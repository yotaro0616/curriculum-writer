<!-- {{TOPIC}}: /setup で設定する。例: "Claude Code", "Docker", "TypeScript" -->

# [教材タイトルを記入]

> [1文で教材の目的を要約する。「誰が」「何を使って」「何ができるようになるか」を含める]

## ペルソナ（WHO）

<!-- 読者像・動機・現在地を具体的に描く -->

[読者像の説明をここに記述する]

### 前提知識

- **[カテゴリ1]**: [具体的な技術・概念をカンマ区切りで]
- **[カテゴリ2]**: [具体的な技術・概念をカンマ区切りで]

### 技術スタック

- **[ツール/環境1]**: [バージョン・導入方法・注意事項]
- **[ツール/環境2]**: [バージョン・導入方法・注意事項]

## コンセプト（WHY）

<!-- なぜ今この教材が必要か。業界の変化・読者への価値・教材の哲学 -->

[コンセプトをここに記述する]

## ゴール（WHAT）

<!-- 修了後に「何ができるか」を行動レベルで定義する。HOW の設計根拠になる -->

[ゴールをここに記述する]

## カリキュラム（HOW）

| Part | 概要 |
|---|---|
| Part 1: [タイトル] | [概要] |
| Part 2: [タイトル] | [概要] |
| Part 3: [タイトル] | [概要] |

Part > Chapter > Section の3層構造。各 Part の設計詳細は `OUTLINE.md` を参照。

CLAUDE.md は教材の哲学（WHO / WHY / WHAT / HOW）を定義し、`OUTLINE.md` はその哲学を具体的な設計に落とし込む。執筆上の判断（題材の選択・構成のアレンジ・外部調査）は `OUTLINE.md` の設計に従いつつ、臨機応変に行うこと。

## プロジェクトマップ（MAP）

執筆ルールは `.claude/rules/writing.md` を参照。

### Skills

| Skill | 用途 |
|---|---|
| `/setup` | 初期設定（CLAUDE.md・OUTLINE.md・writing.md の作成） |
| `/write` | 執筆（Part / Chapter / Section 単位） |
| `/review` | レビュー（品質・整合性チェック） |
| `/check-updates` | 公式ドキュメントとの鮮度チェック |

### フォルダ構造・命名規則

```
project-root/
├── CLAUDE.md                # 教材の哲学（WHO/WHY/WHAT/HOW/MAP）
├── OUTLINE.md               # カリキュラム設計（Part/Chapter/Section）
├── .claude/
│   ├── rules/writing.md     # 執筆ルール
│   ├── skills/              # Skill 定義
│   └── settings.json
├── curriculums/             # 教材本体
│   └── part-XX_タイトル/chapter-XX_タイトル/X-X-X_タイトル.md
└── assets/                  # 画像（assets/part-XX/chapter-XX/）
```

- Part: `part-XX_タイトル/`（01始まり、ゼロパディング）
- Chapter: `chapter-XX_タイトル/`（Part 内で01始まり）
- Section: `X-X-X_タイトル.md`（ゼロパディングなし）
- 画像: 内容がわかる英語名（例: `install-confirmation.png`）
