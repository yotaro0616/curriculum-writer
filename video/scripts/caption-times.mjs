#!/usr/bin/env node
/**
 * 字幕タイミング診断ツール（reveal 同期の当て推量をやめるための補助）。
 *
 * CaptionOverlay.tsx と同じセグメント分割・重み配分・LEAD を再現し、各シーンの
 * 字幕セグメントが「音声に対して何フレーム目・何割の位置」で始まるかを出す。
 * これを見て storyboard の revealAt / fanoutAt / rightAt を、対象の語が出る
 * 字幕セグメントの開始フラクションに合わせる（バネ立ち上がりぶん手前に置く）。
 *
 * 使い方:
 *   node scripts/caption-times.mjs <sectionId> [keyword ...]
 *   例) node scripts/caption-times.mjs 2-1 モデル 検証
 * keyword を渡すと、その語を含む最初のセグメントの開始フラクションも表示する
 * （revealAt はここから spring 立ち上がり分 ≒ 0.02〜0.03 を引いた値が目安）。
 *
 * ⚠ CaptionOverlay.tsx の splitIntoSegments / 重み / LEAD のミラー。
 *    あちらを変えたらこちらも合わせる。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDict, toSpoken } from "./pronounce.mjs";

const FPS = 30;
const LEAD = 6; // CaptionOverlay と一致させる
const INTRO_LEAD = 8; // seg0 は音声リードイン無音ぶん遅らせる（CaptionOverlay と一致）

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

const sectionId = process.argv[2];
const keywords = process.argv.slice(3);
if (!sectionId) {
  console.error("usage: node scripts/caption-times.mjs <sectionId> [keyword ...]");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dict = loadDict(resolve(root, "data/pronunciation.json"));
const props = JSON.parse(
  readFileSync(resolve(root, `data/${sectionId}.props.json`), "utf8"),
);

const weighOf = (s) =>
  [...toSpoken(s, dict)].reduce(
    (w, c) => w + ("。！？".includes(c) ? 4 : "、，".includes(c) ? 2.5 : 1),
    0,
  );

for (const scene of props.scenes) {
  const audioFrames = scene.audioFrames ?? scene.totalFrames ?? 300;
  const segments = splitIntoSegments(scene.narration ?? "");
  const weights = segments.map(weighOf);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const rows = segments.map((text, i) => {
    const rawStart = acc;
    acc += (weights[i] / total) * audioFrames;
    const startF = i === 0 ? INTRO_LEAD : Math.max(0, Math.round(rawStart - LEAD));
    return { i, startF, frac: +(startF / audioFrames).toFixed(3), sec: +(startF / FPS).toFixed(1), text };
  });
  console.log(`\n===== [${scene.id}] type=${scene.type} audioFrames=${audioFrames} (${(audioFrames / FPS).toFixed(1)}s) =====`);
  for (const r of rows) {
    console.log(`  seg${String(r.i).padStart(2)} f=${String(r.startF).padStart(4)} frac=${r.frac.toFixed(3)} ${r.sec.toFixed(1)}s | ${r.text}`);
  }
  for (const kw of keywords) {
    const hit = rows.find((r) => r.text.includes(kw));
    if (hit) {
      const suggest = Math.max(0, +(hit.frac - 0.025).toFixed(3));
      console.log(`  ▶ "${kw}" → seg${hit.i} frac=${hit.frac} / revealAt目安≈${suggest}`);
    }
  }
}
