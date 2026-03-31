---
name: illustrate
description: "Gemini Pro で教材の概念図を生成し、カリキュラムに挿入する。「画像を生成して」「概念図を作って」「イラストを挿入して」「illustrate Part 2」など、教材への画像追加に関する依頼で使用する。画像の挿入ポイント特定・プロンプト作成・生成・挿入までの一連のワークフローに対応する。"
argument-hint: "<scope|scan|generate> [対象]"
---

# illustrate - 教材概念図の生成と挿入

Gemini Pro の画像生成 API を使い、教材に概念図・イラストを生成・挿入する。
Mermaid（正確な処理フロー）では表現しにくい「直感的なメンタルモデル」を可視化する。

## 前提条件

### API キーの確認

実行前に `GEMINI_API_KEY` 環境変数が設定されているか確認する。未設定の場合は以下を案内する:

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを作成
2. `~/.zshrc`（または `~/.bashrc`）に追加:
   ```bash
   export GEMINI_API_KEY="取得したキー"
   ```
3. `source ~/.zshrc` で反映

### ディレクトリの準備

初回実行時、以下のディレクトリが存在しなければ自動作成する:

```
assets/diagrams/
├── output/    # 生成画像（.jpg/.png）
└── prompts/   # プロンプト記録（.md）※再生成・改善用
```

## 使い方

3つのモードがある。ユーザーの依頼に応じて適切なモードを選択する。

### 1. scan（挿入ポイント特定）

```
/illustrate scan Part 2
/illustrate scan 2-1-1
```

指定範囲の Section を読み、AI 画像が効果的な箇所を特定して一覧で報告する。
この段階では画像生成は行わない。

**手順:**

1. 対象の Section ファイルを全て読む
2. `references/criteria.md` の5つの観点で各 Section を評価する
3. 既存の Mermaid 図を確認し、Mermaid で十分な箇所を除外する
4. 挿入ポイントごとに以下を報告する:
   - Section 名
   - 挿入位置（導入 🧠 の直後）
   - 概念の説明（なぜ画像が必要か）
   - 画像名案（英語・ハイフン区切り）
   - プロンプト案（概要のみ）

### 2. generate（画像生成・挿入）

```
/illustrate generate event-loop
/illustrate generate "イベントループの概念図" --name event-loop
```

指定した画像を生成し、対象の Section に挿入する。

**手順:**

1. `references/style-guide.md` を読み、スタイルルールに従ってプロンプトを構成する
2. 生成スクリプトを実行する:
   ```bash
   node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" --name <name>
   ```
3. 生成された画像を確認する（Read ツールで表示）
4. 品質が OK なら、対象 Section の導入 🧠 直後に画像タグを挿入する:
   ```markdown
   ![alt テキスト](../../../assets/diagrams/output/<name>.jpg)
   ```
   - `alt テキスト` は画像の内容を簡潔に日本語で記述する
   - 相対パスは Section ファイルから `assets/` への正しいパスにする

### 3. フルワークフロー（scan + generate）

```
/illustrate Part 2
/illustrate 2-1
```

scan → ユーザー確認 → generate を一気通貫で実行する。

**手順:**

1. scan モードで挿入ポイントを特定し、一覧を提示する
2. ユーザーに「この中から生成する画像を選んでください（または全て）」と確認する
3. 選択された画像を generate モードで順に生成・挿入する

## 画像生成スクリプト

```bash
node .claude/skills/illustrate/scripts/generate-image.js "<プロンプト>" [オプション]
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| --name | (なし) | ファイル名（英語・ハイフン区切り）。指定するとプロンプトも自動保存 |
| --aspect | 16:9 | アスペクト比 |
| --resolution | 4k | 解像度 |
| --output | assets/diagrams/output/ | 出力先パス |

## Mermaid との使い分け

| 用途 | ツール | 配置場所 |
|------|--------|----------|
| 正確な処理フロー・構造の関係性（How it works） | Mermaid | 本文中 |
| メンタルモデル・俯瞰図・比喩の可視化（How to think about it） | illustrate | 導入 🧠 直後 |

判断に迷ったら `references/criteria.md` を参照する。

## 教材への配置ルール

導入セクションの 🧠（先輩エンジニアはこう考える）の直後、`---` 区切りの直前に挿入する。

```markdown
## 導入: [見出し]

[導入テキスト]

### 🧠 先輩エンジニアはこう考える

> [語り]

![alt テキスト](../../../assets/diagrams/output/image-name.jpg)  ← ここ

---

## [本文の最初の見出し]
```

## リファレンス

| ファイル | 内容 | いつ読むか |
|---------|------|-----------|
| `references/style-guide.md` | プロンプト構成ルール・テンプレート・配色・種類別ガイド | generate 実行時 |
| `references/criteria.md` | 画像挿入の5つの判断基準・Mermaid との区別フローチャート | scan 実行時 |
