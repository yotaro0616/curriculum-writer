---
name: illustrate
description: "Gemini 3 Pro Image で教材の概念図を生成し、カリキュラムに挿入する。「画像を生成して」「概念図を作って」「イラストを挿入して」「illustrate Part 2」など、教材への画像追加に関する依頼で使用する。Part 1〜4 の概念 Section すべてに 1 枚ずつ生成するのが基本方針。プロンプト作成・生成・挿入までの一連のワークフローに対応する。"
argument-hint: "<plan|generate|スコープ> [対象]"
---

# illustrate - 教材概念図の生成と挿入

Gemini 3 Pro Image を使い、教材の各 Section に概念図を生成・挿入する。
Mermaid（正確な処理フロー）では表現しにくい「直感的なメンタルモデル」を可視化するのが役割。

**基本方針**: **Part 1〜4 の「概念」種別 Section すべて** に、1 枚ずつ概念図を生成する。配置は各 Section の導入 🧠（先輩エンジニアはこう考える）の直後。再実行しても既に画像がある Section はスキップする（冪等）ため、Part を書き終えるたびに繰り返し実行できる。

## 対象範囲

- **対象**: Part 1〜4 の「概念」種別の Section（OUTLINE.md 上で全 34 Section）。
- **除外**: Part 5（総合ハンズオン）は手順主体のため、既定では生成しない。明示的に `/illustrate Part 5` と指定されたときのみ対象にする。
- **1 Section = 1 画像**。
- 種別の判定は **OUTLINE.md の各 Section の「種類」フィールド** を参照する（「ハンズオン」「混合」はスキップ）。
- **未執筆の Section はスキップ**する（`curriculums/` に実ファイルが存在するものだけを処理する）。

## 前提条件

### API キー

`GEMINI_API_KEY` 環境変数が必要。確認:

```bash
[ -n "$GEMINI_API_KEY" ] && echo "OK" || echo "未設定"
```

未設定の場合の手順:

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを作成
2. `~/.zshrc`（または `~/.bashrc`）に追加: `export GEMINI_API_KEY="取得したキー"`
3. `source ~/.zshrc` で反映

### モデルと出力先

- **モデル**: `gemini-3-pro-image`（GA 版）。既定 4K / 16:9。利用可能なモデルは `GET https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY` で確認できる
- **出力**: `assets/diagrams/output/<name>.jpg`（または `.png`）。プロンプト記録: `assets/diagrams/prompts/<name>.md`。どちらも初回実行時に自動作成される

## 使い方

3つのモードがある。

### 1. plan（生成せず計画を提示）

```
/illustrate plan Part 2
/illustrate plan 2-1
/illustrate plan all
```

指定スコープの対象 Section を列挙し、各 Section について計画を一覧化する。**画像生成は行わない**。コストをかける前の確認ゲートとして使う。

**手順:**

1. スコープ内の対象 Section を確定する（OUTLINE.md で「概念」種別かつ `curriculums/` に実ファイルがあるもの。Part 5 は除外）
2. 各 Section ファイルを読む
3. 各 Section について `references/criteria.md` の報告フォーマットで報告する:
   - **状態**: 未生成 / 生成済み（🧠 直後に画像タグがあるか）
   - **中心概念**: 図にする 1 つの概念
   - **タイプ**: criteria.md の 3 つの構図のどれか
   - **画像名**: `<section番号>-<concept-slug>`
   - **プロンプト概要**: 描く内容の要約

### 2. generate（一括生成・挿入）

```
/illustrate Part 2          ← plan → 確認 → 生成（既定の流れ）
/illustrate all
/illustrate generate Part 2 --yes   ← 確認をスキップ
```

スコープ内の **未生成の対象 Section すべて** を順に生成・挿入する。既定では plan を提示してユーザーに確認してから生成する。

- `--yes`: 確認をスキップして一括生成する
- `--force`: 既に画像がある Section も再生成する（既存タグを置換）

**手順:** スコープ内の各対象 Section に対し、下記「1 Section あたりの手順」を順に実行する。生成済み Section はスキップする（`--force` 指定時を除く）。

### 3. generate（単発）

```
/illustrate generate "<プロンプト>" --name 3-2-1-di-container
```

特定 Section の再生成・微調整に使う。指定プロンプトで 1 枚だけ生成する。挿入先 Section が分かる場合は挿入まで行う。

## 1 Section あたりの手順（中核）

1. **Section ファイルを全文読む**
2. **図にする中心概念を 1 つ選ぶ**: 「how it works（仕組みの正確な図解）」ではなく「how to think about it（直感的な掴み）」を選ぶ。画像は 🧠 直後に置かれるため、**導入の 🧠（先輩エンジニア）が使っている比喩・痛みに最も呼応する概念** を選ぶ。タイプの選び方は `references/criteria.md`
3. **プロンプトを構成する**: `references/style-guide.md` のテンプレート（内容・スタイル）に従い、構図を具体的に指定する。ラベルは読みやすく最小限に
4. **生成**:
   ```bash
   node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" --name <section番号>-<concept-slug>
   ```
   既定で Pro / 16:9 / 4K。スクリプトが出力先パスをログに表示する
5. **目視確認**: Read ツールで画像を開き、(a) 意図した概念が伝わるか (b) 無関係な文字の混入・崩れ・要素過多がないか を確認する。問題があればプロンプトを調整して再生成する
6. **挿入**: 🧠 のブロッククオート直後・次の `---` の直前に画像タグを挿入する（下記「挿入位置とパス」）

## 命名規則

`<section番号>-<concept-slug>`（英語・ハイフン区切り）。

- 例: `1-1-2-static-vs-dynamic-typing`、`3-2-1-di-container`、`2-3-2-polymorphism-swap`
- Section 番号を接頭にすることで、画像と Section の対応・出力フォルダ内の並びが追える

## 冪等性（再実行の安全性）

- **判定の真実は Section ファイル**: 🧠 のブロッククオート直後〜次の `---` の間に、既に `![...](.../output/...)` 画像タグがあれば、その Section は「生成済み」としてスキップする
- `--force` 指定時のみ再生成する（既存タグを置換し、同名画像を上書き）
- これにより、Part を書き終えるたびに `/illustrate Part N` を繰り返しても、未生成分だけが埋まる

## 挿入位置とパス

導入の 🧠 ブロッククオートの直後、`---` 区切りの直前に挿入する。

```markdown
## 導入: [見出し]

[導入テキスト]

### 🧠 先輩エンジニアはこう考える

> [語り]

![alt テキスト](../../../assets/diagrams/output/<name>.jpg)  ← ここ

---

## [本文の最初の見出し]
```

- 本教材は **3層構成**（Part > Chapter > Section）のため、Section ファイルから見た相対パスは `../../../assets/diagrams/output/<name>.<ext>`
- **拡張子はスクリプトが実際に出力したファイルに合わせる**（`.jpg` または `.png`。スクリプトの「✅ 保存」ログのパスを使う）
- `alt テキスト` は画像の内容を簡潔な日本語で記述する

## コストと品質の注意

- 既定は **4K / Pro**。概算で **約 0.2〜0.25 ドル / 枚**。概念 34 Section をすべて生成すると概算 **8〜10 ドル程度**（2026-06 時点の目安）
- **Part 単位での実行を推奨**する（書き終えた Part から `/illustrate Part N`）。一気に全件より、確認しながら進めやすい
- **各画像を必ず目視確認**する。Gemini は日本語ラベルを概ね正しく描くが、関係ない英単語などの文字アーティファクトが混じることがある。混入時はラベルを減らして再生成する
- 図の主役は **Mermaid**（writing.md: 図は Mermaid 主体・本文中）。illustrate は 🧠 直後のメンタルモデル 1 枚に限定し、本文の Mermaid を再描画せず別角度（比喩・鳥瞰・Before/After）から描く

## 画像生成スクリプト

```bash
node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" [オプション]
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| --name | (なし) | ファイル名（`<section番号>-<concept-slug>`）。指定するとプロンプトも自動保存 |
| --aspect | 16:9 | アスペクト比 |
| --resolution | 4k | 解像度（4k / 2k / 1k） |
| --output | assets/diagrams/output/ | 出力先パス |
| --flash | (Pro) | Flash モデル使用（高速・低品質。既定は Pro） |

## リファレンス

| ファイル | 内容 | いつ読むか |
|---------|------|-----------|
| `references/style-guide.md` | プロンプト構成ルール・テンプレート・配色・種類別ガイド | プロンプト構成時 |
| `references/criteria.md` | 3つの構図（画像タイプ）と選び方・中心概念の選定 | 中心概念とタイプの選定時 |
