#!/usr/bin/env node
/**
 * OpenAI gpt-4o-mini-tts でナレーション音声を生成する（tts-gemini.mjs と同一 CLI 契約）。
 * gpt-4o-mini-tts は `instructions` で口調・トーンを細かく指示でき、自然で一貫性が高い。
 *
 * 使い方:
 *   OPENAI_API_KEY=sk-... node scripts/tts-openai.mjs <sectionId> [--force]
 *
 * 入力:  data/<sectionId>.storyboard.json
 * 出力:  public/audio/<sectionId>/scene-NN.raw.wav（生）/ scene-NN.wav（tempo 適用後）
 *        data/<sectionId>.props.json
 *
 * 設定（環境変数 > data/voice.json > 既定値）:
 *   OPENAI_API_KEY  必須（環境変数のみ）
 *   OPENAI_TTS_MODEL 既定 gpt-4o-mini-tts
 *   OPENAI_TTS_VOICE 既定 ash（voice.json の openaiVoice でも可。ash/sage/onyx/verse/coral など）
 *   口調は data/voice.json の stylePrompt を instructions として渡す
 *   tempo（話速）は voice.json の tempo（atempo 倍率。再合成なしで効く）
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const sectionId = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");

if (!sectionId) {
  console.error("使い方: node scripts/tts-openai.mjs <sectionId> [--force]");
  process.exit(1);
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY が未設定です");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const voiceConfigPath = resolve(root, "data/voice.json");
const voiceConfig = existsSync(voiceConfigPath)
  ? JSON.parse(readFileSync(voiceConfigPath, "utf8"))
  : {};

const MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const VOICE = process.env.OPENAI_TTS_VOICE ?? voiceConfig.openaiVoice ?? "ash";
const INSTRUCTIONS =
  voiceConfig.stylePrompt ??
  "落ち着いた先輩エンジニアが後輩に解説する口調で、自然で滑らかに、一定のトーンで読み上げてください。";
const TEMPO = Number(process.env.TTS_TEMPO ?? voiceConfig.tempo ?? 1);
const FPS = 30;
const SAMPLE_RATE = 24000; // OpenAI TTS は 24kHz / 16bit / mono の PCM を返す
const TAIL_PADDING_SEC = 0.8;

const storyboardPath = resolve(root, `data/${sectionId}.storyboard.json`);
const storyboard = JSON.parse(readFileSync(storyboardPath, "utf8"));
const audioDir = resolve(root, `public/audio/${sectionId}`);
mkdirSync(audioDir, { recursive: true });

const pcmToWav = (pcm, sampleRate) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const synthesize = async (text) => {
  const body = {
    model: MODEL,
    input: text,
    voice: VOICE,
    instructions: INSTRUCTIONS,
    response_format: "pcm", // 24kHz 16bit mono の生 PCM
  };
  for (let attempt = 1; attempt <= 4; attempt++) {
    let reason = "";
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 0) return buf;
        reason = "空のレスポンス";
      } else {
        reason = `HTTP ${res.status}: ${(await res.text()).slice(0, 180)}`;
      }
    } catch (e) {
      reason = `通信エラー: ${e.message}`;
    }
    console.warn(`  ⚠ リトライ ${attempt}/4: ${reason}`);
    if (attempt < 4) await sleep(Math.min(attempt * 5000, 15000));
  }
  throw new Error("OpenAI TTS が 4 回連続で失敗しました");
};

/** 生 wav → 最終 wav。TEMPO!==1 なら atempo（ピッチ維持）。等速ならコピー */
const toFinalWithTempo = (rawPath, finalPath) => {
  if (TEMPO === 1) {
    copyFileSync(rawPath, finalPath);
    return;
  }
  execFileSync(
    "npx",
    ["remotion", "ffmpeg", "-y", "-i", rawPath, "-filter:a", `atempo=${TEMPO}`, finalPath],
    { stdio: "ignore" },
  );
};

const main = async () => {
  console.log(
    `🎙 ${sectionId}: ${storyboard.scenes.length} シーン / model=${MODEL} / voice=${VOICE} / tempo=${TEMPO}`,
  );
  const scenes = [];
  let totalSeconds = 0;

  for (const [i, scene] of storyboard.scenes.entries()) {
    const file = `scene-${String(i + 1).padStart(2, "0")}.wav`;
    const rawFile = `scene-${String(i + 1).padStart(2, "0")}.raw.wav`;
    const filePath = resolve(audioDir, file);
    const rawPath = resolve(audioDir, rawFile);

    if (force || !existsSync(rawPath)) {
      const pcm = await synthesize(scene.reading ?? scene.narration);
      writeFileSync(rawPath, pcmToWav(pcm, SAMPLE_RATE));
      await sleep(600);
    } else {
      console.log(`  ↩ ${rawFile} 再利用（API 呼ばず）`);
    }

    toFinalWithTempo(rawPath, filePath);
    const pcmBytes = statSync(filePath).size - 44;
    const seconds = pcmBytes / (SAMPLE_RATE * 2);
    totalSeconds += seconds + TAIL_PADDING_SEC;
    scenes.push({
      ...scene,
      audioSrc: `audio/${sectionId}/${file}`,
      audioFrames: Math.ceil(seconds * FPS),
      totalFrames: Math.ceil((seconds + TAIL_PADDING_SEC) * FPS),
    });
    console.log(`  ✅ ${file} ${seconds.toFixed(1)}s 「${scene.id}」`);
  }

  const props = { ...storyboard, scenes };
  const propsPath = resolve(root, `data/${sectionId}.props.json`);
  writeFileSync(propsPath, JSON.stringify(props, null, 2));

  const mm = Math.floor(totalSeconds / 60);
  const ss = Math.round(totalSeconds % 60);
  console.log(`\n📦 ${propsPath}`);
  console.log(`⏱ 合計 ${mm}:${String(ss).padStart(2, "0")}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
