#!/usr/bin/env node
/**
 * Google Cloud Text-to-Speech（Chirp 3: HD, ja-JP）で音声を生成する。
 * tts-gemini.mjs と同一 CLI 契約。日本語ネイティブで放送品質、声が一貫。
 *
 * 使い方:
 *   GOOGLE_TTS_API_KEY=... node scripts/tts-gcloud.mjs <sectionId> [--force]
 *
 * 認証（どちらか）:
 *   GOOGLE_TTS_API_KEY     API キー（推奨・簡単）
 *   GOOGLE_ACCESS_TOKEN    アクセストークン（`gcloud auth print-access-token` 等）
 *
 * 設定（環境変数 > data/voice.json > 既定値）:
 *   GCLOUD_TTS_VOICE  既定 ja-JP-Chirp3-HD-Charon（voice.json の gcloudVoice でも可）
 *   tempo（話速）は voice.json の tempo（atempo 倍率。再合成なしで効く）
 *
 * 注: Chirp 3 HD は audioConfig の speakingRate 等が限定的なので、話速は atempo で調整する。
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
import { loadDict, spokenForScene } from "./pronounce.mjs";

const args = process.argv.slice(2);
const sectionId = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");

if (!sectionId) {
  console.error("使い方: node scripts/tts-gcloud.mjs <sectionId> [--force]");
  process.exit(1);
}

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
const ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;
if (!API_KEY && !ACCESS_TOKEN) {
  console.error("GOOGLE_TTS_API_KEY（または GOOGLE_ACCESS_TOKEN）が未設定です");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const voiceConfigPath = resolve(root, "data/voice.json");
const voiceConfig = existsSync(voiceConfigPath)
  ? JSON.parse(readFileSync(voiceConfigPath, "utf8"))
  : {};

const VOICE =
  process.env.GCLOUD_TTS_VOICE ?? voiceConfig.gcloudVoice ?? "ja-JP-Chirp3-HD-Charon";
const TEMPO = Number(process.env.TTS_TEMPO ?? voiceConfig.tempo ?? 1);
const FPS = 30;
const TAIL_PADDING_SEC = 0.8;

const storyboard = JSON.parse(
  readFileSync(resolve(root, `data/${sectionId}.storyboard.json`), "utf8"),
);
const dict = loadDict(resolve(root, "data/pronunciation.json"));
const audioDir = resolve(root, `public/audio/${sectionId}`);
mkdirSync(audioDir, { recursive: true });

/** WAV バイト列から再生秒数を読む（fmt の byteRate と data チャンクから） */
const wavDurationSeconds = (buf) => {
  let byteRate = 0;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    else if (id === "data" && byteRate > 0) return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV の data チャンクが見つかりません");
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const synthesize = async (text) => {
  const body = {
    input: { text },
    voice: { languageCode: "ja-JP", name: VOICE },
    audioConfig: { audioEncoding: "LINEAR16" }, // RIFF/WAV を返す
  };
  const headers = { "Content-Type": "application/json" };
  if (ACCESS_TOKEN) headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  else headers["X-goog-api-key"] = API_KEY;

  for (let attempt = 1; attempt <= 4; attempt++) {
    let reason = "";
    try {
      const res = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
        { method: "POST", headers, body: JSON.stringify(body) },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.audioContent) return Buffer.from(json.audioContent, "base64");
        reason = `audioContent なし: ${JSON.stringify(json).slice(0, 160)}`;
      } else {
        reason = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
      }
    } catch (e) {
      reason = `通信エラー: ${e.message}`;
    }
    console.warn(`  ⚠ リトライ ${attempt}/4: ${reason}`);
    if (attempt < 4) await sleep(Math.min(attempt * 5000, 15000));
  }
  throw new Error("Google Cloud TTS が 4 回連続で失敗しました");
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
    `🎙 ${sectionId}: ${storyboard.scenes.length} シーン / Google Chirp3 HD / voice=${VOICE} / tempo=${TEMPO}`,
  );
  const scenes = [];
  let totalSeconds = 0;

  for (const [i, scene] of storyboard.scenes.entries()) {
    const file = `scene-${String(i + 1).padStart(2, "0")}.wav`;
    const rawFile = `scene-${String(i + 1).padStart(2, "0")}.raw.wav`;
    const filePath = resolve(audioDir, file);
    const rawPath = resolve(audioDir, rawFile);

    if (force || !existsSync(rawPath)) {
      const wav = await synthesize(spokenForScene(scene, dict));
      writeFileSync(rawPath, wav);
      await sleep(400);
    } else {
      console.log(`  ↩ ${rawFile} 再利用（API 呼ばず）`);
    }

    toFinalWithTempo(rawPath, filePath);
    const seconds = wavDurationSeconds(readFileSync(filePath));
    totalSeconds += seconds + TAIL_PADDING_SEC;
    scenes.push({
      ...scene,
      audioSrc: `audio/${sectionId}/${file}`,
      audioFrames: Math.ceil(seconds * FPS),
      totalFrames: Math.ceil((seconds + TAIL_PADDING_SEC) * FPS),
    });
    console.log(`  ✅ ${file} ${seconds.toFixed(1)}s 「${scene.id}」`);
  }

  const propsPath = resolve(root, `data/${sectionId}.props.json`);
  writeFileSync(propsPath, JSON.stringify({ ...storyboard, scenes }, null, 2));

  const mm = Math.floor(totalSeconds / 60);
  const ss = Math.round(totalSeconds % 60);
  console.log(`\n📦 ${propsPath}`);
  console.log(`⏱ 合計 ${mm}:${String(ss).padStart(2, "0")}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
