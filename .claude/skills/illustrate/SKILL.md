---
name: illustrate
description: "教材の概念図を計画・作成し、カリキュラムに挿入する。既定は Claude Design（claude.ai/design）で作図して /design-ingest で取り込む経路、選択式で生成AI（Gemini / OpenAI）の API 生成経路。「概念図を作って」「画像を生成して」「イラストを挿入して」「illustrate Part 2」など、教材への画像追加に関する依頼で使用する。挿入ポイントの計画・作図依頼文 / プロンプトの作成・生成・挿入までの一連のワークフローに対応する。"
argument-hint: "<plan|generate|スコープ> [対象] [--route claude-design|genai]"
---

# illustrate - 教材概念図の計画・作成・挿入

教材の Section に概念図を計画し、作成・挿入する。
Mermaid（正確な処理フロー）では表現しにくい「直感的なメンタルモデル」を可視化するのが役割。

作成には 2 つの経路がある。**plan（計画）と、挿入・冪等・命名・コミットの規約は両経路共通**。

- **Claude Design（既定）**: ユーザーが claude.ai/design で対話的に作図 → zip 書き出し → `/design-ingest` で取り込む
- **genai（選択式）**: Gemini / OpenAI の API でこのスキルが生成する（API キーと生成コストが必要）

経路・密度方針の選択肢の意味と判断基準は `references/criteria.md`「0. 経路と密度の判断基準」を参照。**決定の正は `PROGRESS.md` frontmatter の `config.illustrate`**（/pilot が記録する。例: `claude-design / C`。未記録の既定は Claude Design / [B]）。**Section 単位の経路上書きも可**（実行時に `--route genai` / `--route claude-design` を付けるか、依頼文で指定する）。

配置は各 Section の Why ブロックの 🧠（[人格名]はこう考える）直後の **代表図** が基本。密度方針 [C] では `##` 見出し単位の **追加図** も扱う。再実行しても配置済みの図はスキップする（冪等）ため、Part / Chapter を書き終えるたびに繰り返し実行できる。

## 対象範囲と密度方針

- **対象**: 「概念」種別の Section（種別は OUTLINE.md の「種類」フィールドで判定。「ハンズオン」「混合」は手順主体のため既定ではスキップし、明示指定時のみ対象にする）。**weave 教材（config.section_model=weave）では概念 Section がほぼ無いため、混合（織り込み）も対象に含めてよい**（挿入アンカーは冒頭ブロック。スコープの明示指定を推奨し、密度 [A] は「Chapter ごとに効く 1〜2 Section」と読み替える）
- **未執筆の Section はスキップ**する（`curriculums/` に実ファイルがあるものだけ処理する）
- **密度方針**: **[A]** 各概念 Section に 1 枚 / **[B]** 判断ベース（既定） / **[C]** 概念アンカーごと（1 Section 複数図）。定義と判断基準は `references/criteria.md`、決定の正は `PROGRESS.md` の `config.illustrate`

## 使い方

### 1. plan（両経路共通・作成せず計画を提示）

```
/illustrate plan Part 2
/illustrate plan 2-1
/illustrate plan 全て
```

指定スコープの対象 Section を列挙し、**Section → 概念アンカー（`##` 見出し）ごとの図リスト**を提示する。**画像の作成は行わない**。コスト（genai）や作図量（Claude Design）をかける前の確認ゲートとして使う。

**手順:**

1. スコープ内の対象 Section を確定する（OUTLINE.md で「概念」種別かつ `curriculums/` に実ファイルがあるもの。密度方針 [B] なら観点に該当するものに絞る）
2. 各 Section ファイルを読む
3. 図リストを作る。[A]/[B] は代表図（アンカー = 🧠 直後）の 1 行のみ。[C] は代表図に加え、図が立つ `##` アンカーの行を追加する
4. `references/criteria.md` の報告フォーマット（アンカー / 中心概念 / 構図 / 画像名 / 状態 / 内容概要）で報告する

Claude Design 経路では、この図リストが **そのまま作図依頼リスト** になる（各行を `references/claude-design-guide.md` のテンプレートに展開して渡す）。

### 2. 一括作成（既定の流れ）

```
/illustrate Part 2                  ← plan → 確認 → 経路別の作成へ
/illustrate 全て
/illustrate 2-1 --route genai       ← この実行だけ経路を上書き（Section 単位）
/illustrate generate Part 2 --yes   ← genai 経路で確認をスキップ
```

スコープ内の **未作成の図すべて** を対象にする。既定では plan を提示してユーザーに確認してから、経路別の手順（下記）へ進む。

- `--route <claude-design|genai>`: この実行の経路を上書きする
- `--yes`: 確認をスキップ（genai のみ。Claude Design 経路は作図がユーザー作業のため常に plan を経る）
- `--force`: 既に図がある箇所も作り直す（既存タグを置換）

### 3. generate（genai 単発）

```
/illustrate generate "<プロンプト>" --name <section番号>-<concept-slug>
```

特定の図の再生成・微調整に使う。指定プロンプトで 1 枚だけ生成する。挿入先が分かる場合は挿入まで行う。

`generate` は引数の形で挙動が分かれる: 引数がスコープ（`Part 2` / `2-1` / `全て`）なら一括作成（上記 2. を genai 経路で実行）、引用文字列のプロンプトなら本節の単発生成。

## Claude Design 経路（既定）

作図はユーザーが claude.ai/design で行い、取り込み以降は `/design-ingest` が自動化する。plan 確定後の流れ:

1. **依頼文を作る**: plan の図リスト各行を `references/claude-design-guide.md` の作図依頼テンプレートに展開する（構図・ラベルを具体化し、スタイルは `references/style-guide.md` に準拠。命名 `<section番号>-<concept-slug>` を依頼文中で指定する）
2. **依頼文を保存する**: 各図の依頼文を `assets/diagrams/prompts/<name>.md` に保存する（genai のプロンプト記録と同じ場所。`references/criteria.md`「5. 画像の規範」）
3. **ユーザーに渡す**: 依頼文リストを提示し、claude.ai/design での作図（複数案比較・部分修正・デザインシステムの使い方は `references/claude-design-guide.md`）と zip 書き出し（`~/Downloads`）を依頼する。作図待ちでいったん中断してよい
4. **取り込む**: 書き出し後に `/design-ingest` を実行する（zip 自動検出 → 配置 → タグ挿入まで。挿入位置・alt・冪等の規約は本スキルと共通）

## genai 経路（選択式）

### API キー

プロバイダごとに API キーが必要。genai 経路の既定プロバイダは **Gemini**。OpenAI（GPT Image）を使う場合のみ `OPENAI_API_KEY` も設定する。確認:

```bash
[ -n "$GEMINI_API_KEY" ] && echo "Gemini OK" || echo "Gemini 未設定"
[ -n "$OPENAI_API_KEY" ] && echo "OpenAI OK" || echo "OpenAI 未設定"
```

未設定のキーがある場合の取得・設定手順は `references/genai-setup.md` を参照（初回のみ）。

### モデルと出力先

- **Gemini モデル**: `gemini-3-pro-image`（GA 版）。既定 4K / 16:9。利用可能なモデルは `GET https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY` で確認できる
- **OpenAI モデル**: `gpt-image-2`（既定・フラッグシップ）は **flexible サイズ対応**で、既定は **`1792x1008`（16:9）**。4K の `3840x2160` も可（公式には 2560x1440 超は experimental 扱い）。**`gpt-image-1.5` / `gpt-image-1-mini` は固定3サイズのみ**。品質は `low` / `medium` / `high`（既定 high）。サイズ制約の詳細は `generate-image.js --help` を正とする（2026-06 時点）
- **出力**: `assets/diagrams/output/<name>.jpg`（Gemini 既定）/ `.png`（OpenAI 既定）。プロンプト記録: `assets/diagrams/prompts/<name>.md`。どちらも初回実行時に自動作成される

### 1 図あたりの手順（中核）

1. **Section ファイルを全文読む**
2. **図にする中心概念を 1 つ選ぶ**: 「how it works（仕組みの正確な図解）」ではなく「how to think about it（直感的な掴み）」を選ぶ。代表図は 🧠 直後に置かれるため、**Why ブロックの 🧠 が使っている比喩・痛みに最も呼応する概念** を選ぶ。追加図（[C]）は該当 `##` 見出しの主役概念を選ぶ。選定基準は `references/criteria.md`
3. **プロンプトを構成する**: `references/style-guide.md` のテンプレート（内容・スタイル）に従い、構図を具体的に指定する。ラベルは読みやすく最小限に
4. **生成**:
   ```bash
   # 既定プロバイダ（Gemini / Pro / 16:9 / 4K）
   node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" --name <section番号>-<concept-slug>

   # OpenAI（GPT Image）を使う場合
   node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" --name <section番号>-<concept-slug> --provider openai
   ```
   スクリプトが出力先パスをログに表示する
5. **目視確認**: Read ツールで画像を開き、(a) 意図した概念が伝わるか (b) 無関係な文字・タイトルの混入・崩れ・要素過多がないか (c) 立体感があり平板になっていないか (d) 背景に横スジ状のしみ・もや（4K アーティファクト）がないか を確認する。問題があればプロンプトを調整して再生成する。Gemini の 4K で背景のしみが消えない場合は **`--resolution 2k` で生成し直す**か、OpenAI に切り替える（`references/style-guide.md` の注意書きを参照）
6. **挿入**: 「両経路共通の規約」の挿入位置に従い、画像タグを挿入する

### プロバイダの選び方とコスト

- **Gemini（既定）**: 立体感・質感の表現が強く、アイソメトリックで密度の高い絵に向く。既定の 4K / Pro で **約 0.2〜0.25 ドル / 枚**（2026-06 時点の目安）
- **OpenAI（GPT Image）**: **日本語ラベルの精度が高く**、4K でも背景のしみが出ない。フラット寄りの絵になる。`gpt-image-2` の high / 16:9 で **約 0.2〜0.25 ドル / 枚**、medium で約 0.05〜0.06 ドル（2026-06 時点）
- **1 つの Part 内ではプロバイダを揃える**（スタイルの一貫性。`references/criteria.md`「Part 内でスタイル統一」と同じ理由）
- 概念 Section が多い教材を一括生成するとそれなりの額になる。**スコープ単位（Part / Chapter）での実行を推奨**し、枚数を見積もってから実行する

### 画像生成スクリプト

```bash
node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" [オプション]
```

| オプション | デフォルト | 対象 | 説明 |
|-----------|-----------|------|------|
| --provider | gemini | 共通 | `gemini` / `openai`（`--openai` でも可）。プロバイダ選択 |
| --name | (なし) | 共通 | ファイル名（`<section番号>-<concept-slug>`）。指定するとプロンプトも自動保存 |
| --output | assets/diagrams/output/ | 共通 | 出力先パス |
| --aspect | 16:9 | Gemini | アスペクト比 |
| --resolution | 4k | Gemini | 解像度。白背景に横スジ状のしみ・もやが出る場合は `2k` にすると解消する（4K アップスケーラ由来のアーティファクト回避） |
| --flash | (Pro) | Gemini | Flash モデル使用（高速・低品質。既定は Pro） |
| --model | gpt-image-2 | OpenAI | `gpt-image-2` / `gpt-image-1.5` / `gpt-image-1-mini` |
| --size | 1792x1008 | OpenAI | gpt-image-2 は flexible（16:9 `1792x1008`・4K `3840x2160` 等）、1.5/mini は固定3サイズ。制約の詳細は `--help` |
| --quality | high | OpenAI | `low` / `medium` / `high` |
| --format | png | OpenAI | `png` / `jpeg` / `webp` |

`--force` / `--route` はスキル側の指定で、スクリプトのフラグではない。

## 両経路共通の規約

### 命名規則

`<section番号>-<concept-slug>`（英語・ハイフン区切り）。

- 例: 3層 `3-2-1-di-container`、2層 `1-2-immutability`、1層 `3-cli-basics`
- Section 番号を接頭にすることで、画像と Section の対応・出力フォルダ内の並びが追える（`/design-ingest` の自動対応もこの命名が鍵）
- 1 Section に複数図を持つ場合もこの形式で管理する（例: 代表図 `2-1-request-lifecycle`、追加図 `2-1-middleware-pipeline`）。スラッグは Section 内で重複させず、**数字始まりを避ける**（Section 番号との区別のため）
- 構図・内容を変える改版は `<name>-v2` として別名管理する（`references/criteria.md`「5. 画像の規範」）

### 冪等性（再実行の安全性）

- **判定の真実は Section ファイル・図単位**: その図のファイル名（`<name>.jpg` / `.png`）が Section ファイル内に既出なら「配置済み」としてスキップする（`/design-ingest` の `tagPresent` / `needsTag` も同じ判定）
- **SHA-256 はファイル差し替えの判定**: `/design-ingest` は配置済み画像との SHA-256 比較で `new` / `updated` / `unchanged` を決める（`unchanged` は再コピーしない）。これは画像ファイル側の判定であり、タグ挿入の冪等（上記のファイル名既出）とは別。genai 経路に SHA 判定はない
- 代表図 1 枚の運用（[A]/[B]）では、従来どおり「🧠 のブロッククオート直後〜次の `---` の間に `![...](.../output/...)` があるか」で判定してよい
- `--force` 指定時のみ作り直す（既存タグを置換し、同名画像を上書き）
- これにより、Part / Chapter を書き終えるたびに `/illustrate` を繰り返しても、未作成分だけが埋まる

### 挿入位置とパス

**代表図**: Why ブロック配下の 🧠 ブロッククオートの直後、`---` 区切りの直前に挿入する（アークモードがモード2なら「なぜ〇〇を使うのか」配下、モード1なら「導入:」配下にある）。**🧠 が無い Section**（/pilot で頻度を「効果的な Section のみ」にした場合等）では、Why ブロック本文の末尾（`---` の直前）に挿入する。**weave の混合（織り込み構成）Section** では Why ブロックが無いため、冒頭ブロック（🧠 があればその直後・無ければ完成イメージの直後）・最初の `---` の直前と読み替える（`section-models/weave.md`）。この規定は表現様式（4様式）に依存しない。

<!-- emoji 以外の様式では 🧠 マーカーが本文に無いため、人格コラムのブロックを同じアンカーとして読み替える:
     admonition = !!! quote "現場での考え方" ブロックの直後 / plain・zenn = 「### [人格名]はこう考える」見出し＋ブロッククオートの直後（いずれも次の --- の直前） -->

**追加図**（密度方針 [C]）: 該当する `##` 見出しセクションの末尾、次の `##` 見出しまたは `---` の直前に挿入する。

```markdown
## 導入: [見出し]

[導入テキスト]

### 🧠 [人格名]はこう考える

> [語り]

![alt テキスト](<相対パス>/assets/diagrams/output/<name>.jpg)  ← 代表図はここ

---

## [本文の見出し]

[本文]

![alt テキスト](<相対パス>/assets/diagrams/output/<name2>.png)  ← この見出しの追加図はここ

---
```

- **相対パスは階層構造に依存する**。3層（Part > Chapter > Section）なら Section ファイルから `../../../assets/...`、2層なら `../../assets/...`、1層なら `../assets/...`（`/design-ingest` はレポートの `relPath` をそのまま使う）
- **拡張子は実ファイルに合わせる**（`.jpg` または `.png`。genai はスクリプトの「✅ 保存」ログ、`/design-ingest` はレポートの `name` を使う）
- **alt テキスト**は図の内容を完全に説明する 1 文で書き、「〜を示した概念図」で終える（`references/criteria.md`「5. 画像の規範」）

### 図の役割分担とコミット規律

- 図の主役は **Mermaid**（writing.md の図表方針に従う）。illustrate はメンタルモデルの可視化に限定し、本文の Mermaid を再描画せず別角度（比喩・鳥瞰・Before/After）から描く
- **コミットはこのパスの成果物のみ**（画像＋プロンプト / 依頼文記録＋挿入タグ。例: `illustrate(Part 2): 概念図を生成・挿入`）。本文執筆・動画の変更と混載しない（`/design-ingest` 側の規律も同じ）

## リファレンス

| ファイル | 内容 | いつ読むか |
|---------|------|-----------|
| `references/criteria.md` | 経路・密度の判断基準（決定の正は PROGRESS.md の `config.illustrate`）・中心概念の選定・3 つの構図・画像の規範（alt・記録・改版） | plan 時・中心概念とタイプの選定時 |
| `references/style-guide.md` | スタイル基準・プロンプト構成テンプレート・配色・種類別ガイド（両経路共通） | プロンプト / 依頼文の構成時 |
| `references/claude-design-guide.md` | claude.ai/design での作図ガイド（依頼テンプレート・複数案比較・部分修正・デザインシステム・zip 書き出し） | Claude Design 経路の実行時 |
