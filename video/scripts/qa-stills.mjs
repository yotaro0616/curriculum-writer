#!/usr/bin/env node
/**
 * QA スチール一括書き出し。props.json から各シーンの中間フレームを算出し、
 * `npx remotion still` で out/qa/<sectionId>/ へ PNG を並べる。
 * レンダ後（または Studio 確定後）に Read で目視確認する材料
 * （文字切れ・はみ出し・字幕の重なり・ラベルの化け）。
 *
 * 使い方:
 *   node scripts/qa-stills.mjs <sectionId>              # data/<id>.props.json を使う
 *   node scripts/qa-stills.mjs data/_demo.props.json    # ファイルパス直接指定
 *   --scale=0.5   書き出し倍率（既定 0.5。1920x1080 の半分）
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// SectionVideo.tsx と一致させる（変えたらこちらも合わせる）
const TRANSITION_FRAMES = 9;
const DEFAULT_SCENE_FRAMES = 240;
const SERIES_FROM = 1; // <TransitionSeries from={1}>

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const scale = args.find((a) => a.startsWith("--scale="))?.slice(8) ?? "0.5";

if (!target) {
  console.error("usage: node scripts/qa-stills.mjs <sectionId|path/to.props.json> [--scale=0.5]");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = target.endsWith(".json")
  ? isAbsolute(target)
    ? target
    : resolve(process.cwd(), target)
  : resolve(root, `data/${target}.props.json`);

if (!existsSync(propsPath)) {
  console.error(`props がありません: ${propsPath}（先に TTS を実行して props.json を生成する）`);
  process.exit(1);
}

const props = JSON.parse(readFileSync(propsPath, "utf8"));
const scenes = props.scenes ?? [];
if (scenes.length === 0) {
  console.error("scenes が空です");
  process.exit(1);
}

// Composition の総尺（Root.tsx の calculateMetadata と同じ式）
const totals = scenes.map((s) => s.totalFrames ?? DEFAULT_SCENE_FRAMES);
const duration = Math.max(
  totals.reduce((a, b) => a + b, 0) - TRANSITION_FRAMES * Math.max(0, scenes.length - 1),
  30,
);

const outDir = resolve(root, `out/qa/${props.sectionId}`);
mkdirSync(outDir, { recursive: true });

console.log(`📸 ${props.sectionId}: ${scenes.length} シーン → ${outDir}（scale=${scale}）`);

let start = SERIES_FROM;
scenes.forEach((scene, i) => {
  const mid = Math.min(start + Math.floor(totals[i] / 2), duration - 1);
  const file = `scene-${String(i + 1).padStart(2, "0")}-${scene.id}.png`;
  execFileSync(
    "npx",
    [
      "remotion",
      "still",
      "src/index.ts",
      "SectionVideo",
      resolve(outDir, file),
      `--frame=${mid}`,
      `--props=${propsPath}`,
      `--scale=${scale}`,
    ],
    { cwd: root, stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`  ✅ ${file}（frame ${mid} / ${scene.type}）`);
  start += totals[i] - TRANSITION_FRAMES;
});

console.log(`\n📦 ${outDir}`);
