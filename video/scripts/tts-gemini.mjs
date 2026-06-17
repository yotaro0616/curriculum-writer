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
// 話速の微調整（atempo 倍率）。1=等速、>1 で速く、<1 で遅く。API を使わず精密に詰められる。
const TEMPO = Number(process.env.TTS_TEMPO ?? voiceConfig.tempo ?? 1);
const FPS = 30;
const SAMPLE_RATE = 24000; // Gemini TTS は 24kHz / 16bit / mono の PCM を返す
const TAIL_PADDING_SEC = 0.8; // シーン末尾の無音余白

const STYLE_PROMPT =
  (voiceConfig.stylePrompt ??
    "あなたはプロのナレーターです。次の日本語ナレーション原稿を、" +
      "落ち着いた口調で、聞き取りやすい速さで読み上げてください。" +
      "原稿にない言葉は付け加えないでください。") + "\n\n原稿: ";

// フォールバック用の最小プロンプト。スタイル付きプロンプトだとモデルが
// まれに「テキスト応答」を返して 400 になる（TTS 専用モデルの既知の癖）。
// その場合に切り替える、極力シンプルな読み上げ専用指示。
const MINIMAL_PROMPT =
  "次の日本語の文章を、原稿どおりに読み上げてください。原稿にない言葉は加えないでください。\n\n原稿: ";
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

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_ATTEMPTS = 4;

const synthesize = async (text) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // 前半はスタイル付き、後半はテキスト応答を避ける最小プロンプトへ切替
    const prompt = attempt <= 2 ? STYLE_PROMPT : MINIMAL_PROMPT;
    const body = {
      contents: [{ parts: [{ text: prompt + text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
        },
      },
    };

    let reason = "";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
          return Buffer.from(data, "base64");
        }
        // 200 でも音声がない＝モデルがテキストを返した。リトライ対象にする
        reason = "音声データなし（モデルがテキスト応答した可能性）";
      } else {
        reason = `HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`;
      }
    } catch (e) {
      reason = `通信エラー: ${e.message}`;
    }

    const mode = attempt > 2 ? "最小プロンプト" : "通常";
    console.warn(`  ⚠ リトライ ${attempt}/${MAX_ATTEMPTS}（${mode}）: ${reason}`);
    if (attempt < MAX_ATTEMPTS) {
      await sleep(Math.min(attempt * 6000, 18000));
    }
  }
  throw new Error(`TTS が ${MAX_ATTEMPTS} 回連続で失敗しました`);
};

/** 生 wav → 最終 wav。TEMPO!==1 なら atempo で話速を変える（ピッチ維持）。等速ならコピー */
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
    const file = `scene-${String(i + 1).padStart(2, "0")}.wav`; // 最終（props が参照）
    const rawFile = `scene-${String(i + 1).padStart(2, "0")}.raw.wav`; // 生（合成結果）
    const filePath = resolve(audioDir, file);
    const rawPath = resolve(audioDir, rawFile);

    // 1) 生 wav を用意（--force か未生成のときだけ API 合成）。話速変更は API 不要
    if (force || !existsSync(rawPath)) {
      const pcm = await synthesize(scene.reading ?? scene.narration);
      writeFileSync(rawPath, pcmToWav(pcm, SAMPLE_RATE));
      await sleep(1200); // レート制限への配慮
    } else {
      console.log(`  ↩ ${rawFile} 再利用（API 呼ばず）`);
    }

    // 2) 生 → 最終（TEMPO で話速調整）。生は残すので再調整も API 不要
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
