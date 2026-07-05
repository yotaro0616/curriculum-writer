#!/usr/bin/env node
/**
 * WebVTT 字幕の生成。props.json の narration と TTS 実測尺（audioFrames /
 * totalFrames）から、焼き込み字幕と同じ分割・同じタイミングの .vtt を作る
 * （アクセシビリティと検索性のため。<video> には <track kind="captions"> で添える）。
 *
 * ⚠ 配信の注意: <track> は同一オリジン配信が必要（GitHub Releases は別オリジンに
 *   なり読み込まれない）。生成した .vtt はリポジトリ内 assets/videos/ 等にコミットし、
 *   GitHub Pages と同一オリジンで配信すること。
 *
 * 使い方:
 *   node scripts/make-vtt.mjs <sectionId>            # data/<id>.props.json → out/<id>.vtt
 *   node scripts/make-vtt.mjs data/_demo.props.json
 *   --out=path/to.vtt   出力先の上書き
 *
 * ⚠ CaptionOverlay.tsx の splitIntoSegments / 重み / LEAD のミラー。
 *    あちらを変えたらこちらも合わせる。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDict, toSpoken } from "./pronounce.mjs";

const FPS = 30;
const LEAD = 6; // CaptionOverlay と一致
const INTRO_LEAD = 8; // CaptionOverlay と一致
// SectionVideo.tsx と一致
const TRANSITION_FRAMES = 9;
const DEFAULT_SCENE_FRAMES = 240;
const SERIES_FROM = 1; // <TransitionSeries from={1}>

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const outArg = args.find((a) => a.startsWith("--out="))?.slice(6);

if (!target) {
  console.error("usage: node scripts/make-vtt.mjs <sectionId|path/to.props.json> [--out=path]");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = target.endsWith(".json")
  ? isAbsolute(target)
    ? target
    : resolve(process.cwd(), target)
  : resolve(root, `data/${target}.props.json`);

const props = JSON.parse(readFileSync(propsPath, "utf8"));
const dict = loadDict(resolve(root, "data/pronunciation.json"));

const splitIntoSegments = (text) => {
  const sentences = text
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const segments = [];
  for (const sentence of sentences) {
    if (sentence.length <= 34) {
      segments.push(sentence);
      continue;
    }
    let current = "";
    for (const part of sentence.split(/(?<=、)/)) {
      if (current && (current + part).length > 30) {
        segments.push(current);
        current = part;
      } else {
        current += part;
      }
    }
    if (current) segments.push(current);
  }
  const merged = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.length + seg.length <= 18) {
      merged[merged.length - 1] = last + seg;
    } else {
      merged.push(seg);
    }
  }
  return merged;
};

const weighOf = (s) =>
  [...toSpoken(s, dict)].reduce(
    (w, c) => w + ("。！？".includes(c) ? 4 : "、，".includes(c) ? 2.5 : 1),
    0,
  );

const timestamp = (frame) => {
  const ms = Math.max(0, Math.round((frame / FPS) * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = ms % 1000;
  const pad = (n, w) => String(n).padStart(w, "0");
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(mmm, 3)}`;
};

const cues = [];
let sceneStart = SERIES_FROM;
for (const scene of props.scenes ?? []) {
  const totalFrames = scene.totalFrames ?? DEFAULT_SCENE_FRAMES;
  const audioFrames = scene.audioFrames ?? totalFrames;
  const segments = splitIntoSegments(scene.narration ?? "");
  const weights = segments.map(weighOf);
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  const rawStarts = [];
  let acc = 0;
  for (const w of weights) {
    rawStarts.push(acc);
    acc += (w / totalWeight) * audioFrames;
  }
  const startOf = (i) => (i === 0 ? INTRO_LEAD : Math.max(0, rawStarts[i] - LEAD));
  segments.forEach((text, i) => {
    const start = startOf(i);
    const next = i < segments.length - 1 ? Math.max(start + 1, startOf(i + 1)) : audioFrames;
    cues.push({
      start: sceneStart + start,
      end: sceneStart + Math.max(start + 1, next),
      text,
    });
  });
  sceneStart += totalFrames - TRANSITION_FRAMES;
}

const lines = [
  "WEBVTT",
  "",
  "NOTE",
  "このファイルは scripts/make-vtt.mjs が data/<id>.props.json から生成した字幕です。",
  "<track> は同一オリジン配信が必要なため、.vtt は GitHub Releases ではなく",
  "リポジトリ内 assets/videos/ 等にコミットし、GitHub Pages と同一オリジンで配信する。",
  "",
];
cues.forEach((cue, i) => {
  lines.push(String(i + 1));
  lines.push(`${timestamp(cue.start)} --> ${timestamp(cue.end)}`);
  lines.push(cue.text);
  lines.push("");
});

const outPath = outArg
  ? isAbsolute(outArg)
    ? outArg
    : resolve(process.cwd(), outArg)
  : resolve(root, `out/${props.sectionId}.vtt`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"));
console.log(`📦 ${outPath}（${cues.length} キュー / ${timestamp(sceneStart)} まで）`);
