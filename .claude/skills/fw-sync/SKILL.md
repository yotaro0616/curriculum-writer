---
name: fw-sync
description: |
  展開済みの教材プロジェクト側で実行し、教材執筆フレームワーク（curriculum-writer）の最新の共有資産（video/src・video/scripts・scripts/ の品質スクリプト等）を、カテゴリ別ポリシーに従って選択的に取り込む片道同期スキル。
  「FW の最新を取り込んで」「フレームワークと同期して」「fw-sync して」「lint スクリプトを最新化して」「video のテンプレを更新して」など、FW からプロジェクトへの更新取り込みの依頼で使用する。
argument-hint: "[FW リポジトリの URL/ローカルパス(任意)]"
---

# FW の最新をプロジェクトに取り込む（fw-sync）

**入力**: $ARGUMENTS

教材執筆フレームワーク（FW: curriculum-writer）の共有資産を、この教材プロジェクトに選択的に取り込む。**FW → プロジェクトの片道専用**。プロジェクト側での改善を FW に還流したい場合は、従来どおり FW リポジトリへの PR で行う（このスキルでは扱わない）。

適用方式は cc-sdd の overwrite / skip / append + バックアップ方式を参考にしている: 上書きは必ずユーザー承認後、上書き前に `.bak` へ退避する。

## 対象と方針（カテゴリ別）

| カテゴリ | 対象 | 方針 |
|---|---|---|
| **A. 更新提案してよい** | `video/src/`（`brand.ts` を **除く**）・`video/scripts/`・`scripts/`（`lint_curriculum.py` 等）・`.claude/hooks/`・`.claude/skills/github-pages/scripts/`・`.claude/skills/github-pages/assets/` | diff を提示し、**承認されたファイルのみ** `.bak` 退避のうえ上書き。FW にだけある新規ファイルは「追加提案」として提示 |
| **B. 不可侵** | `CLAUDE.md`・`OUTLINE.md`・`PROGRESS.md`・`RESEARCH.md`・`curriculums/`・`assets/`・`video/src/brand.ts`・`video/data/`・`.claude/rules/writing.md` | **diff 提示のみ。自動上書きしない**。プロジェクト固有の内容（哲学・設計・本文・ブランド値・/pilot で確定した writing.md の値）を含むため。FW 側で骨格（章立て・共通ルールの構造）が変わっていた場合は差分を提示して手動マージを提案する |
| **対象外** | 上記以外の `.claude/skills/`（スキル本体）・`.claude/agents/` | このスキルでは触らない。スキル・エージェント本体は plugin `cw` の自動更新（commit = 新バージョン）で配布される。plugin 未導入のプロジェクトなら、同期ではなく plugin の導入（`/plugin marketplace add yotaro0616/curriculum-writer` → `install cw`）を案内する |

📝 カテゴリ B のうち `CLAUDE.md`・`OUTLINE.md`・`curriculums/` 等は、プロジェクト固有化されているのが正常な状態であり、FW テンプレートとの差分があること自体は問題ではない。B で報告する価値があるのは「FW 側の骨格・共通ルールが更新された」差分だけなので、単なるプレースホルダー置換の差分はノイズとして要約に留める。

## FW の取得元

次の順で決める:

1. **plugin `cw` 導入済みの場合**: `${CLAUDE_PLUGIN_ROOT}`（cw プラグインのキャッシュ。auto-update されていれば FW 最新のスナップショット）を取得元とする。変数が展開されない文脈では `claude plugin list` で cw の有無を確認し、`~/.claude/plugins/cache/` 配下の cw ディレクトリを探す
2. **未導入の場合**: $ARGUMENTS に FW の URL / ローカルパスがあればそれを使う。なければユーザーに確認し、一時ディレクトリ（scratchpad）へ `git clone --depth 1` する

取得した FW ルートを以降 `<fw>` と表記する。同期前に `<fw>` の commit（`git -C <fw> rev-parse --short HEAD`、plugin キャッシュならバージョン表示）を控え、報告に含める。

## 手順

### 1. 前提確認

- プロジェクトの `git status` を確認する。未コミットの変更が同期対象パスにある場合は、先にコミットまたは退避を促して中断する（`.bak` と git の二重の安全網を保つため）
- プロジェクト構造を確認する（`video/` や `scripts/` が無いプロジェクトでは該当カテゴリをスキップ）

### 2. 差分の分類

カテゴリ A・B の各パスについて FW とプロジェクトを比較し（`diff -ru` または `git diff --no-index`）、ファイル単位で 3 分類の一覧を提示する:

```text
[変更なし]        … 同一（件数のみ）
[更新提案 (A)]    … FW 側が新しい可能性のある差分。ファイルごとに diff 要約
[不可侵差分 (B)]  … diff 提示のみ。骨格差分の有無を要約
```

### 3. ユーザー選択

[更新提案 (A)] の各ファイルについて、取り込むか（ファイル単位 / 一括）をユーザーに確認する。承認のないファイルには一切触れない。

### 4. 適用（バックアップ付き）

承認されたファイルのみ:

- 既存ファイルの上書き: `cp <対象> <対象>.bak` で退避してから FW 版で上書きする（既存の `.bak` は直前状態で上書き）
- 新規ファイルの追加: そのまま配置（`.bak` は作らない）
- [不可侵差分 (B)] は自動では適用しない。ユーザーが希望した場合のみ、diff を見ながらの手動マージを支援する（writing.md は /pilot で確定した値を保持したまま骨格だけ取り込む）

### 5. 動作確認

適用対象に応じて最低限の確認を行う:

- `scripts/lint_curriculum.py` を更新した場合: 任意の Section に対して実行してエラーが出ないこと
- `video/` を更新した場合: `npx remotion` 系コマンドまたは既存のビルド手順が通ること（プロジェクトの video/README.md に従う）

### 6. 報告

```text
## fw-sync 結果（FW: <commit/バージョン>）
- 適用: <ファイル一覧>（.bak 退避先併記）
- スキップ（ユーザー判断）: <一覧>
- 不可侵差分あり（要手動判断）: <一覧と骨格差分の要約>
- 対象外（plugin 管轄）: スキル・エージェント本体は /plugin update cw で更新
```

`.bak` の削除は動作確認後にユーザーが判断する（このスキルからは自動削除しない）。

## ⚠️ 注意

- **片道専用**: 下流 → FW の還流はこのスキルでは行わない。改善を FW に反映したい場合は FW リポジトリへ PR を出す
- 不可侵カテゴリ（CLAUDE.md・OUTLINE.md・curriculums/ 等）は、たとえユーザーに「全部上書きして」と言われても、ファイルごとに差分内容を確認してから明示的な承認を取り直す（教材本文と哲学の消失は復旧コストが大きい）
