---
name: github-pages
description: |
  教材リポジトリ（curriculums/ 配下の Part > Chapter > Section 構造）を MkDocs Material + GitHub Actions で GitHub Pages として公開・更新するワークフロー。build_docs.py で日本語パス→英語スラッグ変換 → mkdocs build --strict → GitHub Actions で Pages にデプロイする。
  「GitHub Pages で公開して」「教材をページ化して」「MkDocs サイトにして」「公開サイトを更新して」「サイトのテーマカラーを変えて」「デプロイを確認して」など、教材の Web 公開・サイト構築・公開後の更新・テーマ変更・デプロイ確認に関する依頼で使用する。新規構築にも既存サイトの更新にも使う。
argument-hint: "[new|update|deploy] [追加指示(任意)]"
---

# 教材を GitHub Pages で公開する

**入力**: $ARGUMENTS

この教材を、**MkDocs Material + GitHub Actions** 構成で GitHub Pages に公開する。`curriculums/`（日本語ディレクトリ・ファイル名の Part > Chapter > Section）を `build_docs.py` が英語スラッグの `docs/` に変換し、`mkdocs build` で静的サイトを生成、`main` への push で GitHub Actions が自動デプロイする。

## 全体像

```text
curriculums/part-01_.../chapter-01_.../1-1-1_....md   ← 教材本体（手で書く）
        │  scripts/build_docs.py（スラッグ変換・リンク/画像書き換え・assets コピー）
        ▼
docs/part-01/chapter-01/1-1-1.md + docs/assets/...    ← 生成物（gitignore）
        │  mkdocs build --strict
        ▼
site/                                                  ← 静的サイト（gitignore）
        │  .github/workflows/deploy.yml（main push で自動）
        ▼
https://<org>.github.io/<repo>/                        ← 公開
```

手で管理するのは `docs/index.md` と `docs/stylesheets/custom.css` のみ。`docs/part-*`・`docs/assets`・`site/` は生成物なので gitignore する。

## 依頼の種類を見分ける

- **新規構築**（mkdocs.yml が無い）→「セットアップ」→「ローカル検証」→「公開」を順に行う
- **更新**（既に公開済みで内容や設定を変えた）→ 該当ファイルを編集し、「ローカル検証」→ `main` に push（自動デプロイ）
- **テーマカラー変更** → `docs/stylesheets/custom.css` 冒頭の色だけ変更 →「ローカル検証」→ push
- **デプロイ確認** → `gh run watch` と公開 URL の疎通確認のみ

このスキルの場所を `<skill>` と表記する。同梱ファイルは `<skill>/scripts/` と `<skill>/assets/` にある。

---

## セットアップ（新規構築）

### 1. 前提を確認する

- `curriculums/` が `part-XX_*/chapter-XX_*/X-X-X_*.md` 規約に従っているか（ディレクトリ名はゼロ埋め、ファイルのセクション番号はゼロ埋めなし）
- `git remote -v` で GitHub リモートを確認（公開 URL は `https://<org>.github.io/<repo>/`）
- 静的アセット（画像等）は `assets/` 配下に置かれているか

> ⚠️ **同梱スクリプトは 3層構成（Part > Chapter > Section）を前提とする**。`build_docs.py` / `generate_nav.py` は `part-XX_*/chapter-XX_*/X-X-X_*.md` を走査する。2層（Chapter > Section）・1層（Section のみ）の教材で使う場合は、両スクリプトの階層走査ロジック（`part-` / `chapter-` プレフィックスの扱い）を構造に合わせて調整する。

### 2. バンドルファイルを配置する

同梱ファイルを対象リポジトリにコピーする:

- `<skill>/scripts/build_docs.py` → `<repo>/scripts/build_docs.py`（**そのままコピー**。汎用）
- `<skill>/scripts/generate_nav.py` → `<repo>/scripts/generate_nav.py`（そのまま。更新時にも再利用する）
- `<skill>/assets/deploy.yml` → `<repo>/.github/workflows/deploy.yml`（そのまま）
- `<skill>/assets/requirements.txt` → `<repo>/requirements.txt`（そのまま）
- `<skill>/assets/gitignore.txt` の各行を `<repo>/.gitignore` に追記（まだ無い行だけ）

### 3. mkdocs.yml を生成する

1. `<skill>/assets/mkdocs.yml` テンプレートをコピーし、プレースホルダを埋める:
   - `{{SITE_NAME}}` … ヘッダーのサイト名
   - `{{SITE_DESCRIPTION}}` … 1 行説明
   - `{{SITE_URL}}` … `https://<org>.github.io/<repo>/`（リモートから導出）
2. ナビを自動生成して `{{NAV}}` を置き換える。スクリプトを `<repo>/scripts/` に置いてから:
   ```bash
   python3 scripts/generate_nav.py
   ```
   これは `curriculums/` を走査し、各セクションの **H1 をそのままラベル**に、ディレクトリ名から Part / Chapter ラベルを復元して `nav:` ブロックを出力する。**ナビを手書きしない**（抜け・タイプミスの温床。これが新規構築で最も壊れやすい部分）。出力で mkdocs.yml の `{{NAV}}` 行を差し替える。

### 4. docs/index.md を作る

`<skill>/assets/index.md` テンプレートを `<repo>/docs/index.md` に置き、プレースホルダを `CLAUDE.md` / `OUTLINE.md` / `README.md` の WHO・WHAT から埋める（ヒーロー文・カリキュラム表・身につくこと・対象読者）。各 Part の「学習を始める」は各 Part 最初のセクションのスラッグ（例: `part-01/chapter-01/1-1-1.md`）へリンクする。

### 5. テーマカラーを決める

`<skill>/assets/custom.css` テンプレートを `<repo>/docs/stylesheets/custom.css` に置き、冒頭の色プレースホルダをその教材の技術ブランドカラーで埋める。

| 技術 | プライマリ | アクセント |
|---|---|---|
| Java | `#007396` | `#ED8B00` |
| Spring | `#6DB33F` | （単色でも可） |
| Laravel | `#FF2D20` | |
| PHP | `#777BB4` | |
| Python | `#3776AB` | `#FFD43B` |
| TypeScript | `#3178C6` | |
| Claude / Anthropic | `#D97757` | （単色） |

- ユーザーに色を提示して確認する（プライマリ＝ヘッダー、アクセント＝リンク/ホバー）。
- プライマリの light / dark は元色から ±15〜20% 程度の明度違いを用意する（ホバーやグラデーションに使われる）。
- ⚠️ 彩度の高いオレンジ等を**白背景の本文リンク**に使うとコントラストが弱い。気になる場合はライト時のリンク色をプライマリ（濃色）にするか、アクセントを少し濃くする。ダークモードでは映える。
- 色（HEX 値）は商標保護の対象外なので自由に使える。ロゴ画像は別（末尾「ロゴ・商標」参照）。

---

## ローカル検証（必須・公開前に毎回）

> 💡 macOS のローカル実行は `python3`（`python` が無いことがある）。CI（deploy.yml）は setup-python が用意する `python` を使う。

```bash
python3 scripts/build_docs.py        # curriculums/ → docs/
python3 -m mkdocs build --strict     # 厳格ビルド（警告=エラー）
```

`--strict` が 0 エラーで通ること。mkdocs-material が出す「MkDocs 2.0」告知の囲みはビルド警告ではない（無視してよい）。代表的な失敗:

> ⚠️ `Doc file '...md' contains a link '.../X-X-X.md', but the target ... is not found`
> リンクの貼り間違い、または build_docs.py のリンク書き換え不備。リンク先スラッグを確認する。

> ⚠️ `The following pages exist in the docs directory, but are not included in the nav`
> nav から漏れたページ。`generate_nav.py` を再実行して mkdocs.yml を更新するか、対象 .md を除外する。

見た目を確認したいときはローカルサーバ:
```bash
python3 -m mkdocs serve -a 127.0.0.1:8123
```
⚠️ `site_url` にサブパスがあると serve はそのサブパスで配信する（`http://127.0.0.1:8123/<repo>/`。`/` は 302）。プレフィックス付き URL で開く。確認後はサーバを停止し、スクリーンショット等の一時ファイルは消す。

---

## 公開（外向き操作・確認ゲートあり）

公開は外向きの操作。**各ゲートで必ずユーザーに確認**してから進む（一度公開すると取り消しにくい）。

### 1. コミット & プッシュ
- ステージ対象: `mkdocs.yml` / `scripts/` / `.github/` / `requirements.txt` / `.gitignore` / `docs/index.md` / `docs/stylesheets/`。
- **生成物（`docs/part-*`・`docs/assets`・`site/`）がステージされていないこと**を `git status` で確認する。
- 既定ブランチ（main）への push が自動デプロイのトリガー。**push 前にユーザーへ確認**する。

### 2. Pages を有効化（gh）
```bash
gh api -X POST repos/<org>/<repo>/pages -f build_type=workflow
```
> ⚠️ **HTTP 422「current plan does not support GitHub Pages」** が返る場合、リポジトリが **private** で、その org プランは private リポの Pages を許可していない。公開するには**リポジトリを public にする必要がある**。
> public 化は全コードと履歴を公開する重大操作。**必ずユーザーに確認**してから:
> ```bash
> gh repo edit <org>/<repo> --visibility public --accept-visibility-change-consequences
> ```
> その後 Pages 有効化を再実行する。

### 3. デプロイを確認
```bash
gh run watch <run-id> --exit-status                 # build ✓ / deploy ✓
curl -s -o /dev/null -w "%{http_code}\n" https://<org>.github.io/<repo>/
```
- `actions/*` の「Node.js 20 非推奨」警告は無害（将来 action のバージョンを上げれば消える）。
- 反映確認は CSS をキャッシュバスター付きで取得すると確実: `.../stylesheets/custom.css?v=<時刻>`。

---

## 更新フロー（公開後）

`curriculums/` を編集して `main` に push するだけで自動再ビルド・再デプロイされる（手元で build_docs.py を叩く必要はない。CI が叩く）。セクションを増減した場合は `python3 scripts/generate_nav.py`（macOS ローカル）を再実行して mkdocs.yml の nav を更新する。テーマ色は `docs/stylesheets/custom.css` 冒頭のみ。push 前に必要ならローカル検証する。

---

## build_docs.py の要点（なぜこう書くか）

- **`.md` のみスラッグ化**: 画像は `X-X-X-name.jpg` のようにセクション番号で始まる名前のことが多い。リンク書き換えで全セグメントを変換すると画像パスが `X-X-X.md` に壊れる。**`.md` で終わるセグメントだけ**をスラッグ化することで画像を保つ（この対策が同梱版に入っている。素朴な実装で必ず踏む罠）。
- **作図プロンプト .md を除外**: `assets/` を docs にコピーする際 `*.md`（概念図プロンプト等の作業メモ）を除外する。`--strict` の「nav に無いページ」エラー回避と、作業メモの非公開化を兼ねる。
- **生成物クリーン**: 実行時に `docs/part-*` を消して作り直す（手書きの `docs/index.md`・`docs/stylesheets/` は残す）。

---

## ロゴ・商標

- **色（HEX 値）は自由に使える**（商標保護の対象外）。
- **公式ロゴ画像**（各言語・フレームワークのロゴ等）は各社の登録商標。サイトのブランドとして使うには商標ガイドライン準拠・許諾が必要なことが多い。既定では**ロゴを置かない**（テキストタイトルのみ＝リスクなし。テンプレートの CSS はロゴ SVG を隠してタイトル全体をクリック領域にしている）。視覚的アクセントが欲しければ公式ロゴではない中立アイコンを使う。
- 名称（製品名・技術名）の記述的利用は可（「公式」「提携」を匂わせない）。
- 商用公開物では最終的に各社ガイドライン確認を勧める（法的助言ではない旨を添える）。
