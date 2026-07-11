<!-- このリポジトリ（curriculum-writer）自体を開発・保守する場合は .github/CONTRIBUTING.md を参照。以下は教材プロジェクト用のテンプレートで、/define が埋める。 -->

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

<!-- /define で階層構造と内容を設定する -->
<!-- 階層は教材の規模に応じて1〜3層から選択: -->
<!--   3層: Part > Chapter > Section（大規模教材） -->
<!--   2層: Chapter > Section（中規模教材） -->
<!--   1層: Section のみ（小規模教材・ドキュメント集） -->

**階層構造**: [/define で設定]

[カリキュラムの表をここに記述する]

各層の設計詳細は `OUTLINE.md` を参照。

CLAUDE.md は教材の哲学（WHO / WHY / WHAT / HOW）を定義し、`OUTLINE.md` はその哲学を具体的な設計に落とし込む。執筆上の判断（題材の選択・構成のアレンジ・外部調査）は `OUTLINE.md` の設計に従いつつ、臨機応変に行うこと。

## プロジェクトマップ（MAP）

執筆ルールは `.claude/rules/writing.md` を参照。

### Skills

| Skill | 用途 |
|---|---|
| `/setup` | 上流フェーズのルーター（PROGRESS.md から次フェーズを案内） |
| `/research` | 設計前調査（RESEARCH.md・ゲート G1） |
| `/define` | 哲学の定義（CLAUDE.md・ゲート G2） |
| `/outline` | 構造設計（OUTLINE.md・ゲート G3）と見出し骨子の JIT 充填 |
| `/pilot` | 試作と様式ロック（writing.md 確定・ゲート G4＝量産解禁） |
| `/write` | 執筆（任意の階層単位） |
| `/review` | レビュー（品質・整合性チェック・改訂の検収） |
| `/revise` | 改訂の変更管理（提案 → 適用 → アーカイブ。changes/） |
| `/status` | 進捗の同期・報告（PROGRESS.md） |
| `/check-updates` | 公式ドキュメントとの鮮度チェック（🔴🟡 は /revise へ） |
| `/illustrate` | 概念図の計画・作成・挿入（既定: Claude Design / 選択式: 生成AI） |
| `/design-ingest` | claude.ai/Design で作図した zip の自動取り込み・挿入 |
| `/animate` | Remotion による Section 解説動画の生成・挿入 |
| `/github-pages` | MkDocs Material + GitHub Actions で教材を GitHub Pages に公開 |
| `/fw-sync` | FW 更新の選択的取り込み（展開済みプロジェクト側で実行） |

<!-- スキルを追加・削除・改名したら、この表と README.md のスキル一覧の両方を必ず更新する（手順は .github/CONTRIBUTING.md。更新漏れが実際に起きた） -->

### フォルダ構造・命名規則

<!-- 階層構造に応じてディレクトリ構造が変わる -->

```
project-root/
├── CLAUDE.md                # 教材の哲学（WHO/WHY/WHAT/HOW/MAP）
├── RESEARCH.md              # 設計前調査（/research が生成。裏取りの正）
├── OUTLINE.md               # カリキュラム設計（骨格 + 見出し骨子 + 付録）
├── PROGRESS.md              # ゲート承認・進捗・決定録（config）（/status が同期）
├── changes/                 # 改訂の変更管理（/revise。archive/ に履歴）
├── .claude/
│   ├── rules/writing.md     # 執筆ルール
│   ├── rules/prh.yml        # 用語辞書（writing.md と同期）
│   ├── hooks/               # PostToolUse hook（編集時 lint）
│   ├── skills/              # Skill 定義
│   ├── agents/              # カスタムエージェント（レビュアー・検証者）
│   └── settings.json
├── scripts/                 # lint 等の共通スクリプト
├── curriculums/             # 教材本体
└── assets/                  # 画像
```

**3層**（Part > Chapter > Section）:
- `curriculums/part-XX_タイトル/chapter-XX_タイトル/X-X-X_タイトル.md`

**2層**（Chapter > Section）:
- `curriculums/chapter-XX_タイトル/X-X_タイトル.md`

**1層**（Section のみ）:
- `curriculums/X_タイトル.md`

**命名規則**:
- ディレクトリ名はゼロパディング（01始まり）
- ファイル名のセクション番号はゼロパディングなし
- ディレクトリ・ファイル名のタイトル部分は OUTLINE.md の見出しをそのまま使用する（日英混在可。スペースはハイフンに置換）
- 画像は内容がわかる英語名
