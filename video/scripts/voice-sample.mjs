#!/usr/bin/env node
/**
 * Google Chirp 3 HD の複数ボイスで同じ文を生成し、聴き比べる。
 * 使い方:
 *   GOOGLE_TTS_API_KEY=... node scripts/voice-sample.mjs <sectionId> <sceneIndex> <voice...>
 * 例:
 *   node scripts/voice-sample.mjs 1-2 0 Charon Achird Sadaltager Iapetus Enceladus
 * 出力: out/sample-<voice>.wav
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDict, spokenForScene } from "./pronounce.mjs";

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_TTS_API_KEY が未設定です");
  process.exit(1);
}

const [sectionId, sceneIdxStr, ...voices] = process.argv.slice(2);
if (!sectionId || sceneIdxStr === undefined || voices.length === 0) {
  console.error("使い方: node scripts/voice-sample.mjs <sectionId> <sceneIndex> <voice...>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sb = JSON.parse(readFileSync(resolve(root, `data/${sectionId}.storyboard.json`), "utf8"));
const dict = loadDict(resolve(root, "data/pronunciation.json"));
const scene = sb.scenes[Number(sceneIdxStr)];
const text = spokenForScene(scene, dict);
const outDir = resolve(root, "out");
mkdirSync(outDir, { recursive: true });

console.log(`サンプル文（${scene.id}）:\n${text}\n`);

for (const voiceName of voices) {
  const name = voiceName.includes("-") ? voiceName : `ja-JP-Chirp3-HD-${voiceName}`;
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": API_KEY },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "ja-JP", name },
      audioConfig: { audioEncoding: "LINEAR16" },
    }),
  });
  if (!res.ok) {
    console.warn(`  ✗ ${voiceName}: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    continue;
  }
  const json = await res.json();
  const out = resolve(outDir, `sample-${voiceName}.wav`);
  writeFileSync(out, Buffer.from(json.audioContent, "base64"));
  console.log(`  ✅ ${out}`);
}
