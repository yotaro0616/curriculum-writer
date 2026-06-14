#!/usr/bin/env node
/**
 * Gemini TTS でストーリーボードのナレーション音声を生成し、
 * 実測の音声長を埋めた props JSON を出力する。
 *
 * 使い方:
 *   node scripts/tts-gemini.mjs <sectionId> [--force]
 *
 * 入力:  data/<sectionId>.storyboard.json
 * 出力:  public/audio/<sectionId>/scene-NN.wav
 *        data/<sectionId>.props.json   ← remotion render の --props に渡す
 *
 * 設定（優先度: 環境変数 > data/voice.json > 既定値）:
 *   GEMINI_API_KEY  必須（環境変数のみ）
 *   TTS_MODEL       既定 gemini-2.5-flash-preview-tts
 *   TTS_VOICE       既定 Charon（落ち着いた男性声）
 *   口調・話者の人格は data/voice.json の stylePrompt で設定する
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const sectionId = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");

if (!sectionId) {
  console.error("使い方: node scripts/tts-gemini.mjs <sectionId> [--force]");
  process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY が未設定です");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// プロジェクトごとの声設定（人格・口調）は data/voice.json に外出しする
const voiceConfigPath = resolve(root, "data/voice.json");
const voiceConfig = existsSync(voiceConfigPath)
  ? JSON.parse(readFileSync(voiceConfigPath, "utf8"))
  : {};

const MODEL =
  process.env.TTS_MODEL ?? voiceConfig.model ?? "gemini-2.5-flash-preview-tts";
const VOICE = process.env.TTS_VOICE ?? voiceConfig.voice ?? "Charon";
const FPS = 30;
const SAMPLE_RATE = 24000; // Gemini TTS は 24kHz / 16bit / mono の PCM を返す
const TAIL_PADDING_SEC = 0.8; // シーン末尾の無音余白

const STYLE_PROMPT =
  (voiceConfig.stylePrompt ??
    "あなたはプロのナレーターです。次の日本語ナレーション原稿を、" +
      "落ち着いた口調で、聞き取りやすい速さで読み上げてください。" +
      "原稿にない言葉は付け加えないでください。") + "\n\n原稿: ";
const storyboardPath = resolve(root, `data/${sectionId}.storyboard.json`);
const storyboard = JSON.parse(readFileSync(storyboardPath, "utf8"));
const audioDir = resolve(root, `public/audio/${sectionId}`);
mkdirSync(audioDir, { recursive: true });

/** 生 PCM (16bit LE mono) に WAV ヘッダを付ける */
const pcmToWav = (pcm, sampleRate) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const synthesize = async (text) => {
  const body = {
    contents: [{ parts: [{ text: STYLE_PROMPT + text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (res.ok) {
      const json = await res.json();
      const data = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        return Buffer.from(data, "base64");
      }
      throw new Error(
        `音声データがレスポンスに含まれていません: ${JSON.stringify(json).slice(0, 300)}`,
      );
    }
    const errText = await res.text();
    console.warn(`  ⚠ HTTP ${res.status}、リトライ ${attempt}/3: ${errText.slice(0, 200)}`);
    await sleep(attempt * 8000);
  }
  throw new Error("TTS が 3 回連続で失敗しました");
};

const main = async () => {
  console.log(`🎙 ${sectionId}: ${storyboard.scenes.length} シーン / model=${MODEL} / voice=${VOICE}`);
  const scenes = [];
  let totalSeconds = 0;

  for (const [i, scene] of storyboard.scenes.entries()) {
    const file = `scene-${String(i + 1).padStart(2, "0")}.wav`;
    const filePath = resolve(audioDir, file);
    let pcmBytes;

    if (!force && existsSync(filePath)) {
      pcmBytes = statSync(filePath).size - 44;
      console.log(`  ↩ ${file} は生成済み（再利用）`);
    } else {
      const pcm = await synthesize(scene.reading ?? scene.narration);
      writeFileSync(filePath, pcmToWav(pcm, SAMPLE_RATE));
      pcmBytes = pcm.length;
      await sleep(1200); // レート制限への配慮
    }

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
