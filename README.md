# 教材執筆フレームワーク

Claude Code の Skills と Rules を活用した教材執筆フレームワーク。教材の哲学を定義し、構造を MECE に分解し、品質を担保しながら執筆する一連のプロセスを提供します。

## クイックスタート

### 前提条件

- [Claude Code](https://claude.ai/code) がインストール済み
- 教材のテーマが決まっていること

### 使い方

1. このリポジトリをクローンする
2. Claude Code を起動し `/setup` を実行（対話的に CLAUDE.md・OUTLINE.md・writing.md を作成）
3. `/write [スコープ]` で執筆
4. `/review [スコープ]` でレビュー
5. 定期的に `/check-updates` で鮮度確認

---

## 設計思想

### 抽象から具体へ

```
CLAUDE.md（哲学: WHO/WHY/WHAT/HOW）
    ↓ MECE 分解
OUTLINE.md（構造）
    ↓ 執筆（writing.md がルールを定義）
curriculums/（教材本体）
```

| 層 | ファイル | 役割 |
|---|---|---|
| 哲学層 | `CLAUDE.md` | 誰に、なぜ、何を、どう教えるか |
| 設計層 | `OUTLINE.md` | 何を、どの順で、どの粒度で教えるか |
| 執筆層 | `writing.md` | どんな文体・形式・深さで書くか |
| コンテンツ層 | `curriculums/` | 読者に届く教材そのもの |

### 柔軟な階層構造

教材の規模に応じて1〜3層から選択:

| 層数 | 構造 | 用途 |
|---|---|---|
| 3層 | Part > Chapter > Section | 大規模教材 |
| 2層 | Chapter > Section | 中規模教材 |
| 1層 | Section のみ | 小規模教材・ドキュメント集 |

`/setup` で選択し、CLAUDE.md の HOW セクションに記録される。

### 3種セクション

| 種類 | 使いどころ |
|---|---|
| **概念** | 理論・背景・方法論。コード生成なし |
| **ハンズオン** | 既知の概念を手で確認 |
| **混合** | セットアップ・機能の初回体験 |

### 3観点検証

ハンズオン・混合でコードを生成した場合: **正しさ** / **品質** / **安全性** の3観点で検証。

---

## ワークフロー

```
/setup → /write → /review → /check-updates
           ↑        │              │
           └── 修正 ─┘              │
           ↑                       │
           └── 更新必要 ────────────┘
```

| Skill | 用途 |
|---|---|
| `/setup` | 哲学の定義 → 階層構造の選択 → MECE 構造化 → ルール調整 |
| `/write` | OUTLINE に基づき公式ドキュメントを参照しながら執筆 |
| `/review` | 4観点で品質検証（自動修正しない） |
| `/check-updates` | 公式ドキュメント・Changelog との差分チェック |

---

## カスタマイズ

- **階層構造**: `/setup` で1〜3層から選択
- **検証観点**: デフォルトの3観点（正しさ・品質・安全性）はソフトウェア開発向け。テーマに応じて `writing.md` で調整
- **絵文字**: `writing.md` の絵文字テーブルで追加・変更可
- **実践プロジェクト**: なしでも使える。ある場合は CLAUDE.md の MAP にプロジェクト情報を記載

---

## ファイル構成

```
project-root/
├── CLAUDE.md           # 哲学（WHO/WHY/WHAT/HOW/MAP）
├── OUTLINE.md          # 構造（階層構造に応じた設計）
├── .claude/
│   ├── rules/writing.md
│   ├── skills/{setup,write,review,check-updates}/
│   └── settings.json
├── curriculums/        # 教材本体
└── assets/             # 画像
```
