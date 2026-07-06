#!/usr/bin/env node
// .claude/skills/design-ingest/scripts/ingest-design.js
//
// Claude Design から書き出した zip を取り込み、教材の概念図を
// リポジトリの assets/diagrams/output/ に配置する（決定的なファイル操作のみ）。
// Markdown へのタグ挿入は行わず、各画像の Section 対応・タグ有無・相対パスを
// レポートして、その判断は呼び出し側（Claude / SKILL.md）に委ねる。
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// ---- リポジトリ内の基準パス ----
// カレントディレクトリから .git を上方探索してプロジェクトルートを決める（generate-image.js と同方式）。
// plugin 配布ではスクリプトが教材リポジトリ外（プラグインキャッシュ等）に置かれ得るため、__dirname 基点にしない。
function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}
const REPO_ROOT = findProjectRoot();

// 画像拡張子 / Section 番号で始まる図ファイルの命名規約（教材の階層 1〜3層に対応）
// 例: 2-1-1-current-directory.png -> 2-1-1（3層）/ 2-1-http-request.png -> 2-1（2層）/ 3-cli-basics.png -> 3（1層）
const IMG_EXT = /\.(png|jpe?g|svg)$/i;
const SECTION_PREFIX = /^(\d+(?:-\d+){0,2})-/;

// ---- 引数パース ----
function parseArgs(argv) {
  const o = {
    zip: null,
    downloads: path.join(os.homedir(), 'Downloads'),
    output: path.join(REPO_ROOT, 'assets', 'diagrams', 'output'),
    curriculums: path.join(REPO_ROOT, 'curriculums'),
    archive: null, // 既定は <downloads>/_design_ingested（後で確定）
    section: null,
    dryRun: false,
    noArchive: false,
    json: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--zip') o.zip = next();
    else if (a === '--downloads') o.downloads = next();
    else if (a === '--output') o.output = next();
    else if (a === '--curriculums') o.curriculums = next();
    else if (a === '--archive') o.archive = next();
    else if (a === '--section') o.section = next();
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--no-archive') o.noArchive = true;
    else if (a === '--json') o.json = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else if (!a.startsWith('--') && /^\d+(-\d+){0,2}$/.test(a) && !o.section) o.section = a; // 位置引数: Section 番号
    else if (!a.startsWith('--') && !o.zip) o.zip = a; // 位置引数: zip パス
    else throw new Error(`不明な引数: ${a}`);
  }
  if (!o.archive) o.archive = path.join(o.downloads, '_design_ingested');
  return o;
}

const HELP = `design-ingest: Claude Design 書き出し zip を取り込み概念図を配置する

使い方:
  node ingest-design.js [zip | section番号] [オプション]
  （位置引数が 2-1-4 のような番号なら --section、それ以外は --zip として解釈する）

オプション:
  --zip <path>        取り込む zip を明示（既定: Downloads から最新の該当 zip を自動検出）
  --section <番号>    指定 Section の図だけ取り込む（例: 2-1-4。番号プレフィックス一致・1〜3層対応）
  --downloads <dir>   Downloads ディレクトリ（既定: ~/Downloads）
  --output <dir>      配置先（既定: <repo>/assets/diagrams/output）
  --curriculums <dir> 教材ルート（既定: <repo>/curriculums）
  --archive <dir>     取り込み済み zip の退避先（既定: <downloads>/_design_ingested）
  --no-archive        zip を退避しない（元の場所に残す）
  --dry-run           コピー・退避を行わず、検出結果だけ報告する
  --json              機械可読 JSON のみ出力する
  -h, --help          このヘルプ
`;

// ---- ユーティリティ ----
function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.isFile()) acc.push(p);
  }
  return acc;
}

// エントリ（zip 内パス / 展開後の相対パス）が「教材の図」か:
// assets/diagrams/output/ 配下の画像、または basename が Section 番号始まりの画像に限定する。
function isDiagramEntry(entryPath) {
  const p = entryPath.trim();
  if (!p || !IMG_EXT.test(p)) return false;
  if (p.includes('assets/diagrams/output/')) return true;
  return SECTION_PREFIX.test(path.posix.basename(p));
}

// zip 内に図ファイルが含まれるか（unzip -Z1 のパス一覧を 1 行ずつ判定）。
// unzip -l の表形式は日付列（07-05-2026 等）が Section 番号様の並びにマッチして
// 無関係な zip を誤検出するため使わない。
function zipHasDiagrams(zipPath) {
  try {
    const out = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\n').some(isDiagramEntry);
  } catch {
    return false;
  }
}

// Downloads から「図を含む最新 zip」を自動検出
function autoDetectZip(downloadsDir) {
  let names;
  try { names = fs.readdirSync(downloadsDir); } catch {
    throw new Error(`Downloads が見つかりません: ${downloadsDir}`);
  }
  const zips = names
    .filter((n) => n.toLowerCase().endsWith('.zip'))
    .map((n) => path.join(downloadsDir, n))
    .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const { p } of zips) {
    if (zipHasDiagrams(p)) return p;
  }
  return null;
}

// 命名から Section 番号の候補を長い順に返す（例: "2-1-4-http.png" -> ["2-1-4", "2-1", "2"]）。
// 教材の階層（1〜3層）が異なっても、実在する Section ファイルに一致する最長の候補を採用できる。
function sectionCandidates(base) {
  const m = base.match(SECTION_PREFIX);
  if (!m) return [];
  const parts = m[1].split('-');
  const out = [];
  for (let n = parts.length; n >= 1; n--) out.push(parts.slice(0, n).join('-'));
  return out;
}

// 教材ルートから Section 番号に対応する .md を探す（例: 2-1-1 -> 2-1-1_*.md）
function findSectionFile(curriculumsDir, secNum) {
  const matches = walk(curriculumsDir).filter(
    (f) => f.endsWith('.md') && path.basename(f).startsWith(secNum + '_')
  );
  return matches[0] || null;
}

// 衝突しない退避先パスを返す
function uniqueDest(dir, base) {
  let dest = path.join(dir, base);
  if (!fs.existsSync(dest)) return dest;
  const ext = path.extname(base);
  const stem = base.slice(0, base.length - ext.length);
  for (let i = 1; ; i++) {
    dest = path.join(dir, `${stem} (${i})${ext}`);
    if (!fs.existsSync(dest)) return dest;
  }
}

// 空レポート（対象なし時の出力を通常時と同じ構造に保つ）
function emptyReport(opt) {
  return {
    zip: null,
    output: path.relative(REPO_ROOT, opt.output),
    dryRun: opt.dryRun,
    archived: null,
    counts: { total: 0, new: 0, updated: 0, unchanged: 0, needsTag: 0, unmatched: 0 },
    items: [],
  };
}

// ---- 本体 ----
function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { process.stdout.write(HELP); return; }

  // 1) zip を確定（自動検出で見つからない場合は「対象なし」として正常終了する）
  let zipPath = opt.zip ? path.resolve(opt.zip) : autoDetectZip(opt.downloads);
  if (!zipPath) {
    const report = emptyReport(opt);
    if (opt.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      return;
    }
    process.stdout.write(
      [
        `対象なし: 取り込める zip が見つかりません（検出元: ${opt.downloads}）。`,
        'Claude Design から zip を書き出すか、--zip <path> で指定してください。',
        '',
        '===INGEST_RESULT_JSON===',
        JSON.stringify(report),
      ].join('\n') + '\n'
    );
    return;
  }
  if (!fs.existsSync(zipPath)) throw new Error(`zip が存在しません: ${zipPath}`);

  // 2) 一時ディレクトリへ展開
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'design-ingest-'));
  let report;
  try {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmp], { stdio: ['ignore', 'ignore', 'pipe'] });

    // 3) 図ファイルを収集（zip 検出と同じ isDiagramEntry 判定: assets/diagrams/output 配下 or Section 番号始まり）
    const all = walk(tmp).filter((f) => IMG_EXT.test(f));
    const picked = all.filter((f) =>
      isDiagramEntry(path.relative(tmp, f).split(path.sep).join('/'))
    );
    // basename で重複排除（assets/diagrams/output 配下を優先）
    const byBase = new Map();
    for (const f of picked) {
      const base = path.basename(f);
      const rel = path.relative(tmp, f).split(path.sep).join('/');
      const prev = byBase.get(base);
      const preferred = rel.includes('assets/diagrams/output/');
      if (!prev || (preferred && !prev.preferred)) byBase.set(base, { f, preferred });
    }
    let images = [...byBase.values()].map((v) => v.f);

    // --section フィルタ（番号プレフィックス一致。--section 2-1 で Chapter 単位の絞り込みも可）
    if (opt.section) {
      images = images.filter((f) => path.basename(f).startsWith(opt.section + '-'));
    }

    // 配置先ディレクトリを用意
    if (!opt.dryRun) fs.mkdirSync(opt.output, { recursive: true });

    // 4) 各画像を解析・配置
    const items = [];
    for (const src of images) {
      const base = path.basename(src);
      const target = path.join(opt.output, base);
      const srcHash = sha256(src);
      let action;
      if (fs.existsSync(target)) action = sha256(target) === srcHash ? 'unchanged' : 'updated';
      else action = 'new';

      // Section 対応（最長一致の候補から、実在する Section ファイルを探す）
      const candidates = sectionCandidates(base);
      let secNum = candidates[0] || null;
      let sectionFile = null;
      for (const c of candidates) {
        const f = findSectionFile(opt.curriculums, c);
        if (f) { secNum = c; sectionFile = f; break; }
      }

      // タグ有無 / 相対パス
      let tagPresent = null;
      let relPath = null;
      if (sectionFile) {
        const content = fs.readFileSync(sectionFile, 'utf8');
        tagPresent = content.includes(base);
        relPath = path.relative(path.dirname(sectionFile), target).split(path.sep).join('/');
      }

      // コピー
      if (!opt.dryRun && action !== 'unchanged') fs.copyFileSync(src, target);

      items.push({
        name: base,
        section: secNum,
        sectionFile: sectionFile ? path.relative(REPO_ROOT, sectionFile) : null,
        action,
        tagPresent,
        relPath,
        bytes: fs.statSync(src).size,
        needsTag: !!sectionFile && tagPresent === false,
      });
    }

    // 5) zip を退避（取り込み対象 0 件の zip は退避しない: 誤検出した無関係 zip を Downloads から動かさないため）
    let archived = null;
    if (!opt.dryRun && !opt.noArchive && items.length > 0) {
      fs.mkdirSync(opt.archive, { recursive: true });
      const dest = uniqueDest(opt.archive, path.basename(zipPath));
      try { fs.renameSync(zipPath, dest); }
      catch { fs.copyFileSync(zipPath, dest); fs.unlinkSync(zipPath); } // 別ボリューム対策
      archived = path.relative(os.homedir(), dest);
    }

    report = {
      zip: path.relative(os.homedir(), zipPath),
      output: path.relative(REPO_ROOT, opt.output),
      dryRun: opt.dryRun,
      archived,
      counts: {
        total: items.length,
        new: items.filter((i) => i.action === 'new').length,
        updated: items.filter((i) => i.action === 'updated').length,
        unchanged: items.filter((i) => i.action === 'unchanged').length,
        needsTag: items.filter((i) => i.needsTag).length,
        unmatched: items.filter((i) => !i.sectionFile).length,
      },
      items,
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 6) 出力
  if (opt.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }

  const c = report.counts;
  const lines = [];
  lines.push(`取り込み元 zip : ~/${report.zip}${report.dryRun ? '  (DRY-RUN)' : ''}`);
  lines.push(`配置先         : ${report.output}/`);
  if (report.archived) lines.push(`zip 退避先     : ~/${report.archived}`);
  lines.push('');
  lines.push(`計 ${c.total} 枚  / 新規 ${c.new}  更新 ${c.updated}  変更なし ${c.unchanged}  / 要タグ挿入 ${c.needsTag}  Section未対応 ${c.unmatched}`);
  lines.push('');
  const pad = (s, n) => String(s ?? '').padEnd(n);
  lines.push(`${pad('ACTION', 10)}${pad('SECTION', 9)}${pad('TAG', 6)}IMAGE`);
  for (const i of report.items) {
    const tag = i.tagPresent === null ? '-' : i.tagPresent ? 'あり' : 'なし';
    lines.push(`${pad(i.action, 10)}${pad(i.section || '?', 9)}${pad(tag, 6)}${i.name}`);
  }
  lines.push('');
  // 呼び出し側（Claude）がタグ挿入対象を確実に拾えるよう、機械可読 JSON も併記
  lines.push('===INGEST_RESULT_JSON===');
  lines.push(JSON.stringify(report));
  process.stdout.write(lines.join('\n') + '\n');
}

try {
  main();
} catch (e) {
  process.stderr.write(`エラー: ${e.message}\n`);
  process.exit(1);
}
