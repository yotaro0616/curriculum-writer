#!/usr/bin/env node
/**
 * storyboard の機械検証（TTS の前に流す）。criteria.md / storyboard.md の
 * 定量ルールをコードにしたもの。人手レビューの代わりではなく、明らかな崩れ
 * （型名の打ち間違い・figure の参照切れ・尺の逸脱）を API を呼ぶ前に止める。
 *
 * 使い方:
 *   node scripts/lint-storyboard.mjs <sectionId>            # data/<id>.storyboard.json を検証
 *   node scripts/lint-storyboard.mjs data/_demo.props.json  # ファイルパス直接指定（props も可）
 *   --lenient  件数系ルール（シーン数・narration 字数・総量）を警告扱いにする（_demo 用）
 *
 * 違反は「シーン番号: ルール: メッセージ」で stderr に出し、exit 1。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const lenient = args.includes("--lenient");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error(
    "usage: node scripts/lint-storyboard.mjs <sectionId|path/to.json> [--lenient]",
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const filePath = target.endsWith(".json")
  ? isAbsolute(target)
    ? target
    : resolve(process.cwd(), target)
  : resolve(root, `data/${target}.storyboard.json`);

if (!existsSync(filePath)) {
  console.error(`-: file-not-found: ${filePath} がありません`);
  process.exit(1);
}

let doc;
try {
  doc = JSON.parse(readFileSync(filePath, "utf8"));
} catch (e) {
  console.error(`-: invalid-json: ${e.message}`);
  process.exit(1);
}

// ---- ルール定義（criteria.md 2 / storyboard.md と一致させる） ----
const SCENES_MIN = 8;
const SCENES_MAX = 14;
const NARRATION_MIN = 80;
const NARRATION_MAX = 200;
const TOTAL_MIN = 1000;
const TOTAL_MAX = 1800;
const KNOWN_TYPES = new Set([
  "title",
  "codeCompare",
  "keypoint",
  "figure",
  "terminal",
  "terminalCompare",
  "flow",
  "nest",
  "outro",
]);
const TERM_LINE_KEYS = ["cmd", "out", "comment", "user", "claude", "tool", "approve"];
// terminalCompare のペインが描画できる行種（TerminalCompareScene.tsx の対応と一致させる。
// シェル行 cmd・ツール実行 tool・承認 approve は terminal シーン専用）
const TERM_COMPARE_LINE_KEYS = ["out", "comment", "user", "claude"];

const errors = []; // { where, rule, msg }
const warnings = [];
// 件数系（シーン数・字数）は --lenient で警告に落とす。構造系は常にエラー
const countIssue = (where, rule, msg) =>
  (lenient ? warnings : errors).push({ where, rule, msg });
const error = (where, rule, msg) => errors.push({ where, rule, msg });

const charLen = (s) => [...String(s ?? "")].length;

// ---- トップレベル ----
for (const key of ["sectionId", "sectionLabel", "title"]) {
  if (typeof doc[key] !== "string" || doc[key] === "") {
    error("全体", "required-field", `トップレベルの ${key} がありません`);
  }
}
if (!Array.isArray(doc.scenes) || doc.scenes.length === 0) {
  error("全体", "required-field", "scenes（シーン配列）がありません");
  report();
}

const scenes = doc.scenes;

if (scenes.length < SCENES_MIN || scenes.length > SCENES_MAX) {
  countIssue(
    "全体",
    "scene-count",
    `シーン数 ${scenes.length}（基準 ${SCENES_MIN}〜${SCENES_MAX}）`,
  );
}

if (scenes[0]?.type !== "title") {
  error("シーン1", "first-title", `先頭は type:"title"（現在 ${scenes[0]?.type}）`);
}
if (scenes[scenes.length - 1]?.type !== "outro") {
  error(
    `シーン${scenes.length}`,
    "last-outro",
    `末尾は type:"outro"（現在 ${scenes[scenes.length - 1]?.type}）`,
  );
}

// ---- 各シーン ----
const seenIds = new Set();
let totalChars = 0;

const checkFraction = (where, name, v) => {
  const list = Array.isArray(v) ? v : [v];
  for (const n of list) {
    if (typeof n !== "number" || n < 0 || n > 1) {
      error(where, "reveal-range", `${name} は 0〜1 の数値（現在 ${JSON.stringify(n)}）`);
    }
  }
};

const checkTermLines = (where, lines, field, allowed = TERM_LINE_KEYS) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    error(where, "required-field", `${field} が空です`);
    return;
  }
  lines.forEach((l, j) => {
    const keys = TERM_LINE_KEYS.filter((k) => l != null && k in l);
    if (keys.length !== 1) {
      error(
        where,
        "terminal-line",
        `${field}[${j}] は ${allowed.join("/")} のいずれか1つを持つ（現在 ${JSON.stringify(Object.keys(l ?? {}))}）`,
      );
    } else if (!allowed.includes(keys[0])) {
      error(
        where,
        "terminal-line",
        `${field}[${j}] の "${keys[0]}" は terminalCompare では描画できない（有効: ${allowed.join("/")}。シェル行・ツール実行・承認は terminal シーンで）`,
      );
    }
  });
};

scenes.forEach((scene, i) => {
  const where = `シーン${i + 1}`;

  if (typeof scene.id !== "string" || scene.id === "") {
    error(where, "required-field", "id がありません");
  } else if (seenIds.has(scene.id)) {
    error(where, "duplicate-id", `id "${scene.id}" が重複しています`);
  } else {
    seenIds.add(scene.id);
  }

  if (!KNOWN_TYPES.has(scene.type)) {
    error(
      where,
      "unknown-type",
      `type "${scene.type}" は未知（有効: ${[...KNOWN_TYPES].join(", ")}）`,
    );
  }

  if (typeof scene.narration !== "string" || scene.narration === "") {
    error(where, "required-field", "narration がありません");
  } else {
    const len = charLen(scene.narration);
    totalChars += len;
    if (len < NARRATION_MIN || len > NARRATION_MAX) {
      countIssue(
        where,
        "narration-length",
        `narration ${len}字（基準 ${NARRATION_MIN}〜${NARRATION_MAX}字）`,
      );
    }
  }

  if (scene.revealAt != null) checkFraction(where, "revealAt", scene.revealAt);
  if (scene.rightAt != null) checkFraction(where, "rightAt", scene.rightAt);
  if (scene.fanoutAt != null) checkFraction(where, "fanoutAt", scene.fanoutAt);

  switch (scene.type) {
    case "title":
      for (const k of ["sectionNo", "title", "subtitle"]) {
        if (typeof scene[k] !== "string" || scene[k] === "") {
          error(where, "required-field", `title シーンの ${k} がありません`);
        }
      }
      break;
    case "codeCompare":
      for (const side of ["left", "right"]) {
        const pane = scene[side];
        if (!pane || typeof pane.label !== "string" || !Array.isArray(pane.lines) || pane.lines.length === 0) {
          error(where, "required-field", `${side} ペイン（label と lines）が必要です`);
        }
      }
      break;
    case "keypoint":
      if (!Array.isArray(scene.cards) || scene.cards.length === 0) {
        error(where, "required-field", "cards がありません");
      } else {
        if (scene.cards.length !== 2) {
          countIssue(
            where,
            "keypoint-cards",
            `cards は 2 枚（現在 ${scene.cards.length} 枚。3 枚以上は画面幅からはみ出す）`,
          );
        }
        scene.cards.forEach((c, j) => {
          if (typeof c?.title !== "string" || typeof c?.body !== "string") {
            error(where, "required-field", `cards[${j}] に title / body が必要です`);
          }
        });
      }
      break;
    case "figure": {
      if (typeof scene.src !== "string" || scene.src === "") {
        error(where, "required-field", "src がありません");
      } else {
        const fig = resolve(root, "public", scene.src);
        if (!existsSync(fig)) {
          error(where, "figure-missing", `参照画像がありません: public/${scene.src}`);
        }
      }
      break;
    }
    case "terminal":
      checkTermLines(where, scene.lines, "lines");
      break;
    case "terminalCompare":
      for (const side of ["left", "right"]) {
        if (!scene[side]) {
          error(where, "required-field", `${side} ペインがありません`);
        } else {
          checkTermLines(where, scene[side].lines, `${side}.lines`, TERM_COMPARE_LINE_KEYS);
        }
      }
      break;
    case "flow":
      if (!Array.isArray(scene.steps) || scene.steps.length === 0) {
        error(where, "required-field", "steps がありません");
      } else {
        scene.steps.forEach((s, j) => {
          if (typeof s?.label !== "string" || s.label === "") {
            error(where, "required-field", `steps[${j}] に label が必要です`);
          }
        });
      }
      if (scene.fanout != null) {
        if (!Array.isArray(scene.fanout)) {
          error(where, "flow-fanout", "fanout は配列で指定します");
        } else {
          scene.fanout.forEach((f, j) => {
            if (typeof f?.label !== "string") {
              error(
                where,
                "flow-fanout",
                `fanout[${j}] は {"label": "..."} のオブジェクト（文字列にすると空箱で描画される）`,
              );
            }
          });
        }
      }
      break;
    case "nest":
      if (!Array.isArray(scene.layers) || scene.layers.length === 0) {
        error(where, "required-field", "layers がありません");
      } else {
        if (scene.layers.length > 3) {
          error(where, "nest-layers", `layers は 3 つまで（現在 ${scene.layers.length}）`);
        }
        scene.layers.forEach((l, j) => {
          if (typeof l?.label !== "string" || typeof l?.desc !== "string") {
            error(where, "required-field", `layers[${j}] に label / desc が必要です`);
          }
        });
      }
      break;
    case "outro":
      if (!Array.isArray(scene.points) || scene.points.length === 0) {
        error(where, "required-field", "points がありません");
      } else if (scene.points.length > 4) {
        countIssue(where, "outro-points", `points は 4 点以内（現在 ${scene.points.length}）`);
      }
      break;
    default:
      break; // unknown-type は既に報告済み
  }
});

if (totalChars < TOTAL_MIN || totalChars > TOTAL_MAX) {
  countIssue(
    "全体",
    "total-length",
    `narration 総量 ${totalChars}字（基準 ${TOTAL_MIN}〜${TOTAL_MAX}字）`,
  );
}

report();

function report() {
  for (const w of warnings) {
    console.error(`⚠ ${w.where}: ${w.rule}: ${w.msg}`);
  }
  for (const e of errors) {
    console.error(`${e.where}: ${e.rule}: ${e.msg}`);
  }
  if (errors.length > 0) {
    console.error(`\n✖ lint 失敗: エラー ${errors.length} 件 / 警告 ${warnings.length} 件`);
    process.exit(1);
  }
  console.log(
    `✅ lint OK: ${Array.isArray(doc?.scenes) ? doc.scenes.length : 0} シーン / narration 総量 ${totalChars ?? 0} 字${warnings.length > 0 ? ` / 警告 ${warnings.length} 件` : ""}`,
  );
  process.exit(0);
}
