#!/usr/bin/env node
/**
 * VOICEVOX（ローカル Docker）でストーリーボードのナレーション音声を生成し、
 * 実測の音声長を埋めた props JSON を出力する。tts-gemini.mjs と同じ入出力契約。
 *
 * 事前準備:
 *   docker run --rm -d --name voicevox -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-latest
 *
 * 使い方:
 *   node scripts/tts-voicevox.mjs <sectionId> [--force]
 *
 * 環境変数:
 *   VOICEVOX_URL      既定 http://127.0.0.1:50021
 *   VOICEVOX_SPEAKER  スタイル ID（既定 13 = 青山龍星 ノーマル）。一覧は GET /speakers
 *   VOICEVOX_SPEED    話速 speedScale（既定 1.0）
 *
 * ⚠ 生成音声の利用にはクレジット表記「VOICEVOX:キャラクター名」が必要。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const sectionId = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");

if (!sectionId) {
  console.error("使い方: node scripts/tts-voicevox.mjs <sectionId> [--force]");
  process.exit(1);
}

const BASE_URL = process.env.VOICEVOX_URL ?? "http://127.0.0.1:50021";
const SPEAKER = Number(process.env.VOICEVOX_SPEAKER ?? 13);
const SPEED = Number(process.env.VOICEVOX_SPEED ?? 1.0);
const FPS = 30;
const TAIL_PADDING_SEC = 0.8;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const storyboard = JSON.parse(
  readFileSync(resolve(root, `data/${sectionId}.storyboard.json`), "utf8"),
);
const audioDir = resolve(root, `public/audio/${sectionId}`);
mkdirSync(audioDir, { recursive: true });

/** WAV バイト列から再生秒数を読む（fmt / data チャンクを走査） */
const wavDurationSeconds = (buf) => {
  let byteRate = 0;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      byteRate = buf.readUInt32LE(offset + 16);
    } else if (id === "data" && byteRate > 0) {
      return size / byteRate;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV の data チャンクが見つかりません");
};

const synthesize = async (text) => {
  const queryRes = await fetch(
    `${BASE_URL}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(text)}`,
    { method: "POST" },
  );
  if (!queryRes.ok) {
    throw new Error(`audio_query 失敗: HTTP ${queryRes.status} ${await queryRes.text()}`);
  }
  const query = await queryRes.json();
  query.speedScale = SPEED;
  // ここで query.accent_phrases を編集すればアクセント・イントネーションを確定的に矯正できる

  const synthRes = await fetch(`${BASE_URL}/synthesis?speaker=${SPEAKER}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) {
    throw new Error(`synthesis 失敗: HTTP ${synthRes.status} ${await synthRes.text()}`);
  }
  return Buffer.from(await synthRes.arrayBuffer());
};

const main = async () => {
  console.log(
    `🎙 ${sectionId}: ${storyboard.scenes.length} シーン / VOICEVOX speaker=${SPEAKER} speed=${SPEED}`,
  );
  const scenes = [];
  let totalSeconds = 0;

  for (const [i, scene] of storyboard.scenes.entries()) {
    const file = `scene-${String(i + 1).padStart(2, "0")}.wav`;
    const filePath = resolve(audioDir, file);
    let wav;

    if (!force && existsSync(filePath)) {
      wav = readFileSync(filePath);
      console.log(`  ↩ ${file} は生成済み（再利用）`);
    } else {
      wav = await synthesize(scene.reading ?? scene.narration);
      writeFileSync(filePath, wav);
    }

    const seconds = wavDurationSeconds(wav);
    totalSeconds += seconds + TAIL_PADDING_SEC;
    scenes.push({
      ...scene,
      audioSrc: `audio/${sectionId}/${file}`,
      audioFrames: Math.ceil(seconds * FPS),
      totalFrames: Math.ceil((seconds + TAIL_PADDING_SEC) * FPS),
    });
    console.log(`  ✅ ${file} ${seconds.toFixed(1)}s 「${scene.id}」`);
  }

  writeFileSync(
    resolve(root, `data/${sectionId}.props.json`),
    JSON.stringify({ ...storyboard, scenes }, null, 2),
  );

  const mm = Math.floor(totalSeconds / 60);
  const ss = Math.round(totalSeconds % 60);
  console.log(`\n⏱ 合計 ${mm}:${String(ss).padStart(2, "0")}（クレジット表記を忘れずに）`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
