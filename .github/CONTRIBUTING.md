# Contributing / DEVELOPING — このフレームワークを開発・改善する

> このファイルは **curriculum-writer（FW 本体）を開発・保守・改善する人**向けです（教材そのものの書き方は README と各スキル `/setup` 等を参照）。FW への改善は PR で歓迎します。

## このリポジトリの二重の役割

curriculum-writer は2つの顔を持ちます。

1. **正典（source of truth）**: skills・agents・rules・scripts・機械チェック基盤の唯一の正。
2. **テンプレート**: `gh repo create --template` で新しい教材リポジトリの雛形になる。ルート直下の `CLAUDE.md`・`OUTLINE.md`・`PROGRESS.md`・`CONTEXT.md` は**教材用の空テンプレート**（プレースホルダ）で、教材側の `/define`・`/outline` などが埋める。

⚠️ FW 開発中は、Claude Code がこの空テンプレの `CLAUDE.md` を project instructions として自動ロードします。それは FW の設計哲学ではなく教材の雛形なので、**本体開発の指針はこの DEVELOPING.md を正**としてください。

## 崩してはいけない不変条件

- **skills / agents はプロジェクト固有の決定を持たない純ロジック**にする。様式・アークモード・人格・字数などプロジェクトごとに変わる値は skills 本文に書かず、**決定録＝ `PROGRESS.md` frontmatter の `config`** に置く（`.claude/rules/writing.md` は題材非依存の共有ルール、用語辞書は `.claude/rules/prh.yml`）。これにより `/fw-sync` で skills を丸ごと上書きしても教材の決定が消えない。
- **機械チェックの単一の正**は `scripts/lint_curriculum.py`（書式・構造）と textlint（文章・AI 臭・表記ゆれ）。同じ検査を PostToolUse hook・CI・`/write`・`/review` が共有する。検出ルールを足すときはスクリプト側だけを直す（各スキルに検査ロジックを重複させない）。
- **重要度記号**は全層で `🔴 ブロッキング > 🟡 警告 > 🔵 情報` の順に統一する。

## 還流ループ（下流の学びを FW へ戻す）

正典（FW）→ テンプレート展開 → 教材インスタンスで実践 → **改善は FW リポジトリへ PR** で還流する。既存インスタンスへの配布は各プロジェクト側で `/fw-sync`（pull 型・片道同期）。**バックフィル禁止**（過去インスタンスへ遡及して一括変更しない。新規執筆・`/revise` の対象になった箇所だけ新方式へ移行する）。

## スキルを追加・変更したときの必須チェック

- `README.md` のスキル表と `CLAUDE.md` の MAP スキル表は**別々に手で保守している**（読者が違う: README=人間の導線・入力例つき、CLAUDE=エージェント向けの簡潔マップ）。スキルを追加・削除・改名したら**両方**を更新する（更新漏れの実績あり）。
- 新スキルの `description`（frontmatter）は発火トリガ。「〜して」という自然な依頼文の例を含める。
- lint / textlint に触れたら、代表 Section で実行して緑を確認する（`npm run lint`）。

## 上流フローとゲート（設計の背骨）

`/setup`（ルーター）→ `/research`(G1) → `/define`(G2) → `/outline`(G3) → `/pilot`(G4＝量産解禁) → `/write` → `/review`。ゲート承認は `PROGRESS.md` に永続化する。構成変更（Section の追加・削除・移動・改番、横断的な方針変更）は `/write` から `/revise`（変更管理）へ回す。この4フェーズ分割は「単一 /setup で承認が揮発し、設計の手戻りが本文へ波及する」問題への対処なので、1スキルへ統合し直さない。

検証エージェント3種（責務と権限で分離）:

- `independent-reviewer`: `/write` 完了ゲート。実ファイルのみを根拠に検証（read-only・Edit/Write なし）
- `learner-persona`: 前提知識だけの読者として通読し、つまずきを報告（Bash なし）
- `handson-verifier`: 🏃 のコマンド列を一時ディレクトリで実機実行する唯一のエージェント（`/review` から任意起動）

## 配布の現状（2026-07 時点）

- 現行: GitHub テンプレート（新規プロジェクト）＋ `/fw-sync`（既存プロジェクトの更新・pull 型）。Claude Code plugin は撤収済み（量産中の教材に未検収のスキル変更が届く問題・読み取り専用キャッシュとの相性が理由。README「配布・更新」節を参照）。
- 進行中: Issue #71 = npx インストーラ（`init` / `update`）で配布ストーリーを完成させる。上記「決定録の外出し」はその前提リファクタで、npx 化と独立に先行実装できる。
