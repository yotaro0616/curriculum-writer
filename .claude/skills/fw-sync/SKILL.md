---
name: fw-sync
description: |
  展開済みの教材プロジェクト側で実行し、教材執筆フレームワーク（curriculum-writer）の最新の共有資産（.claude/skills・.claude/agents・scripts・video/src 等）を、カテゴリ別ポリシーに従って選択的に取り込む片道同期スキル。
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
| **A. 更新提案してよい** | `.claude/skills/`（`github-pages/assets/custom.css`・`illustrate/references/style-guide.md` を **除く**）・`.claude/agents/`・`.claude/hooks/`・`scripts/`（`lint_curriculum.py` 等）・`video/src/`（`brand.ts` を **除く**）・`video/scripts/`・`video/` 直下の設定と依存（`package.json`＋`package-lock.json` は**セットで**・`remotion.config.ts`・`tsconfig.json`・`eslint.config.mjs`・`README.md`）・`.textlintrc.json`・`.github/workflows/lint.yml`・ルートの `package.json`＋`package-lock.json`（**セットで**取り込み lock 不整合を避ける）・`.gitignore`（**追記提案のみ**: FW 側で増えた行を提示し、プロジェクト側の既存行は削除しない） | diff を提示し、**承認されたファイルのみ** `.bak` 退避のうえ上書き。FW にだけある新規ファイルは「追加提案」として提示 |
| **B. 不可侵** | `CLAUDE.md`・`OUTLINE.md`・`PROGRESS.md`・`RESEARCH.md`・`curriculums/`・`assets/`・`lecture/`（収録台本）・`video/src/brand.ts`・`video/data/`・`.claude/rules/writing.md`・`.claude/rules/prh.yml`・`.claude/skills/github-pages/assets/custom.css`・`.claude/skills/illustrate/references/style-guide.md`（/pilot がブランド値を書き込む反映先のため） | **diff 提示のみ。自動上書きしない**。プロジェクト固有の内容（哲学・設計・本文・決定録＝PROGRESS.md config・ブランド値・用語辞書 prh.yml）を含むため（writing.md は共有ルールだが、下流の移行前インライン値を保護するため既定は不可侵とする）。FW 側で骨格（章立て・共通ルールの構造）が変わっていた場合は差分を提示して手動マージを提案する |

📝 スキル・エージェントはプロジェクト固有の決定を持たない純ロジック（決定は PROGRESS.md の `config`＝決定録・単一ソースにある）ため、カテゴリ A として上書きしても決定は消えない。カテゴリ B のうち `CLAUDE.md`・`OUTLINE.md`・`curriculums/` 等は、プロジェクト固有化されているのが正常な状態であり、FW テンプレートとの差分があること自体は問題ではない。B で報告する価値があるのは「FW 側の骨格・共通ルールが更新された」差分だけなので、単なるプレースホルダー置換の差分はノイズとして要約に留める。

📝 `.claude/settings.json` は **個別確認**（hooks・permissions を含むため A の一括上書き対象にしない）。FW 側に新しい hook / 権限が増えていれば、既存設定を壊さないようマージ差分を提示して確認する（#71 の update でも同方針）。

## FW の取得元

$ARGUMENTS に FW の URL / ローカルパスがあればそれを使う。なければユーザーに確認し、一時ディレクトリ（scratchpad）へ `git clone --depth 1` する。

取得した FW ルートを以降 `<fw>` と表記する。同期前に `<fw>` の commit（`git -C <fw> rev-parse --short HEAD`）を控え、報告に含める。

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
- [不可侵差分 (B)] は自動では適用しない。ユーザーが希望した場合のみ、diff を見ながらの手動マージを支援する（writing.md は共有ルールなので骨格差分を手動マージできる。/pilot 確定値は config 側にあり影響しない）

### 5. 動作確認

適用対象に応じて最低限の確認を行う:

- `scripts/lint_curriculum.py` を更新した場合: `curriculums/` 全体に対して実行し、**新規の 🔴 が出ないこと（出る場合は差分を報告して承認を得る）**。あわせて `PROGRESS.md` frontmatter に `config`（特に `style:` と `section_model:`）が存在することを確認する（無い旧形式のままだと lint が emoji / separate の既定で検査し、admonition 等の教材では実践見出しの正規形検査が誤検出になる）
- `video/` を更新した場合: `npx remotion` 系コマンドまたは既存のビルド手順が通ること（プロジェクトの video/README.md に従う）

### 6. 報告

```text
## fw-sync 結果（FW: <commit/バージョン>）
- 適用: <ファイル一覧>（.bak 退避先併記）
- スキップ（ユーザー判断）: <一覧>
- 不可侵差分あり（要手動判断）: <一覧と骨格差分の要約>
```

`.bak` の削除は動作確認後にユーザーが判断する（このスキルからは自動削除しない）。

## ⚠️ 注意

- **体系・様式の変更を含む同期は writing.md の手動マージを先に行う**: skills（カテゴリ A）だけ先に取り込むと、新しいスキルが旧い writing.md（カテゴリ B・不可侵）の体系を参照して不整合になる。FW 側で writing.md の骨格（Section の種類・様式・テンプレート）が変わっている場合は、B の手動マージ → A の取り込みの順で進める
- **片道専用**: 下流 → FW の還流はこのスキルでは行わない。改善を FW に反映したい場合は FW リポジトリへ PR を出す
- 不可侵カテゴリ（CLAUDE.md・OUTLINE.md・curriculums/ 等）は、たとえユーザーに「全部上書きして」と言われても、ファイルごとに差分内容を確認してから明示的な承認を取り直す（教材本文と哲学の消失は復旧コストが大きい）
