# 記入例: Claude Code 教材（COACHTECH Pro生向け）

このファイルは、教材執筆フレームワークを使って実際に作成されたプロジェクト「pro-cc-guide」の完成形です。`/setup` でどのような回答をし、どのような CLAUDE.md・OUTLINE.md・writing.md が生成されたかの参考として利用してください。

---

## CLAUDE.md の完成形

### {{TOPIC}}

```
Claude Code
```

### WHO（ペルソナ）

```markdown
プログラミングスクール COACHTECH の選抜試験を経てフリーランスエージェントに所属しているジュニアエンジニア。
COACHTECH ではこの層を「Pro生」と呼ぶ。企業に紹介され、副業・フリーランス・転職などの形で
Laravel を使った実務開発に携わる。基礎力はあるが実務はこれから。
```

**前提知識**:
- **Laravel**: MVC、Eloquent ORM、認証（Fortify）、認可（Policy）、バリデーション、ミドルウェア、RESTful API、PHPUnit
- **フロントエンド**: HTML/CSS、Tailwind CSS の基礎
- **データベース**: RDB設計（正規化、ER図）、SQL（JOIN、サブクエリ、集計）
- **開発プロセス**: 要件定義→DB/API設計→実装→テストの一連のフロー
- **開発環境・ツール**: ターミナル、Docker Compose、Git/GitHub（ブランチ運用、PR、コードレビュー）
- **AI活用**: ChatGPT を少し触った程度。AI コーディングツールの経験は問わない

**技術スタック**:
- **Laravel 10**: `composer create-project` でバージョンを明示してインストール
- **Laravel Sail**: Docker ベースの開発環境
- **Claude アカウント**: Pro（20ドル）プランが最低条件、Max プラン推奨
- **Claude Code**: ネイティブインストール推奨

### WHY（コンセプト）

```markdown
AI で一人の生産性が上がり企業の採用が慎重になる中、Pro生がミドル・シニア相当のバリューを
出せるよう Claude Code を使いこなせるようになることを目指す。Claude Code との協働を通じて
驚きと面白さを感じてもらいながら、実務で成果を出せるエンジニアに育てる。

教材の根底にある考え方: AI は抽象的な指示を具体のコードに高速で変換する。しかしその指示を
MECE に構造化するには、具体を深く理解していなければならない。この「具体と抽象の行き来」を
高速・高精度に回す力こそが AI 時代のエンジニアに求められるものである。
```

### WHAT（ゴール）

```markdown
Claude Code と協働して、実務タスク（バグ修正・機能開発・リファクタリング）を高速かつ高品質に
遂行できるようにする。コードリーディングを前提に、既存プロジェクトのコーディング規約と設計方針に
従いながら遂行する。これを支える3つの能力を養う:

1. 使いこなす力（Input）: Claude Code の機能・設定・制約を把握し、目的に応じて的確に活用する力
2. 見極める力（Output）: 生成コードを正しさ・品質・安全性の3観点で検証し、責任を持って採用する力
3. 学び続ける力（Time）: ツール・技術の進化を追い、自ら試し、実務に適応し続ける力
```

> 📝 この「3能力モデル」はこのプロジェクト固有の設計です。フレームワークとしては WHAT の構成は自由です。

### HOW（カリキュラム）

| Part | 対応する能力 | 概要 | ハンズオン |
|---|---|---|---|
| Part 1: はじめに | — | 教材の導入、Claude Code の概要 | なし |
| Part 2: Claude Code の基礎 | 使いこなす力 + 見極める力 | 主要機能を習得 | 自分のプロジェクト作成 |
| Part 3: Claude Code の実践 | 見極める力 + 使いこなす力 | 提供プロジェクトで実務タスクを遂行 | CourseHub で実践 |
| Part 4: 継続的な学習 | 学び続ける力 | 学び続けるサイクル・発展機能 | なし |

### MAP（プロジェクトマップ）

**公式ドキュメント**: https://code.claude.com/docs/en/

**実践プロジェクト**: CourseHub（オンライン学習プラットフォーム、Laravel 10 + Sail）
- 仕様書: `outline/coursehub-spec.md`
- リポジトリ: `/Users/yotaro/pro-cc-coursehub`

---

## OUTLINE.md の完成形

各 Section にゴール・種類・公式ドキュメント URL を記載した実際の OUTLINE です。Part 3 は実践プロジェクト固有のフィールド（方法論、🏃 実践、意図）も含まれています。

```markdown
# OUTLINE

## Part 1: はじめに

→ ゴール: Claude Code を学ぶ意義と教材の全体像を理解し、学習を開始する準備を整える
→ ハンズオンなし（全 Section 概念）

### Chapter 1-1: この教材について（3 Section）

**ゴール**: Claude Code を学ぶ意義と教材の全体像を理解し、自分に適した学習計画を立てる。

- **1-1-1 なぜ Claude Code を使うのか**
  - 種類: 概念
  - ゴール: AI 時代にジュニアエンジニアが Claude Code を学ぶ意義と、この教材で養う3つの能力を理解する
  - 公式ドキュメント: [Overview](https://code.claude.com/docs/en/overview)

- **1-1-2 対象読者と前提条件**
  - 種類: 概念
  - ゴール: 自分のスキルレベルと照らし合わせて、この教材が適切かを判断できる
  - 公式ドキュメント: [Setup](https://code.claude.com/docs/en/setup)

- **1-1-3 教材の構成と学習の進め方**
  - 種類: 概念
  - ゴール: 教材の全体構成を把握し、自分に適した進め方を選択できる
  - 公式ドキュメント: [Features Overview](https://code.claude.com/docs/en/features-overview)

### Chapter 1-2: 学習を始める前に（2 Section）

**ゴール**: Claude Code を使い始めるために必要な確認事項とプラン選択を完了する。

- **1-2-1 AI ツールを使う前の確認事項**
  - 種類: 概念
  - ゴール: 所属組織の AI ツール利用ポリシーとデータの取り扱いを確認し、責任を持って使い始められる
  - 公式ドキュメント: [Security](https://code.claude.com/docs/en/security), [Data Usage](https://code.claude.com/docs/en/data-usage)

- **1-2-2 プランの選択と費用**
  - 種類: 概念
  - ゴール: 自分に適したプランを選択し、契約を完了する
  - 公式ドキュメント: [Pricing](https://claude.com/pricing), [Setup](https://code.claude.com/docs/en/setup)

---

## Part 2: Claude Code の基礎

→ ゴール: Claude Code の主要機能を習得し、AI 出力を確認する習慣の土台を作る
→ ハンズオン: 全 Chapter で cc-practice プロジェクトを一貫して使用

### Chapter 2-1: セットアップ（4 Section）

**ゴール**: Claude Code をインストールし、プロジェクトの土台を作り、最初のコード生成を体験する。

- **2-1-1 インストールと認証**
  - 種類: 混合
  - ゴール: Claude Code をインストール・認証し、最初のコード生成を体験する
  - 公式ドキュメント: [Setup](https://code.claude.com/docs/en/setup), [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)

- **2-1-2 権限とセキュリティ**
  - 種類: 混合
  - ゴール: Claude Code の権限モデルを理解し、安全に使うための設定を行う
  - 公式ドキュメント: [Permissions](https://code.claude.com/docs/en/permissions), [Settings](https://code.claude.com/docs/en/settings)

- **2-1-3 モデル選択とコスト管理**
  - 種類: 混合
  - ゴール: タスクに応じたモデル選択とコスト管理の方法を理解する
  - 公式ドキュメント: [Model Configuration](https://code.claude.com/docs/en/model-config), [Costs](https://code.claude.com/docs/en/costs)

- **2-1-4 CLAUDE.md とプロジェクト作成**
  - 種類: 混合
  - ゴール: CLAUDE.md の設計原則を理解し、プロジェクトの土台を作る
  - 公式ドキュメント: [Memory](https://code.claude.com/docs/en/memory)

### Chapter 2-2: 基本を理解する（3 Section）

**ゴール**: Claude Code の動作原理、コンテキスト管理、プロンプト設計を理解し、効果的に使うための土台を作る。

- **2-2-1 エージェントループ**
  - 種類: 混合
  - ゴール: Claude Code の動作原理を理解し、意図通りに動かす勘所を掴む
  - 公式ドキュメント: [Agentic Loop](https://code.claude.com/docs/en/agentic-loop)

- **2-2-2 コンテキストとセッション管理**
  - 種類: 混合
  - ゴール: コンテキストウィンドウの仕組みを理解し、効率的なセッション管理ができる
  - 公式ドキュメント: [Context Management](https://code.claude.com/docs/en/context-management)

- **2-2-3 プロンプト設計**
  - 種類: 混合
  - ゴール: 目的に応じた効果的なプロンプトを設計できる
  - 公式ドキュメント: [Best Practices](https://code.claude.com/docs/en/best-practices)

### Chapter 2-3: 機能を使いこなす（8 Section）

**ゴール**: Claude Code の主要機能を一通り体験し、タスクに応じて使い分けられる。

- **2-3-1 Plan Mode**
  - 種類: 混合
  - ゴール: Plan Mode で設計を可視化し、実装前に方針を固める習慣を身につける
  - 公式ドキュメント: [Plan Mode](https://code.claude.com/docs/en/sub-agents)

- **2-3-2 Skills**
  - 種類: 混合
  - ゴール: 繰り返すワークフローを Skill として定義し、再利用できる
  - 公式ドキュメント: [Skills](https://code.claude.com/docs/en/skills)

- **2-3-3 Hooks**
  - 種類: 混合
  - ゴール: イベント駆動の自動化を Hooks で設定できる
  - 公式ドキュメント: [Hooks](https://code.claude.com/docs/en/hooks)

- **2-3-4 MCP**
  - 種類: 混合
  - ゴール: MCP サーバーを接続し、外部ツールと連携できる
  - 公式ドキュメント: [MCP](https://code.claude.com/docs/en/mcp)

- **2-3-5 Sub-agents**
  - 種類: 混合
  - ゴール: タスクを Sub-agents に分割し、効率的に処理できる
  - 公式ドキュメント: [Sub-agents](https://code.claude.com/docs/en/sub-agents)

- **2-3-6 Plugins**
  - 種類: 混合
  - ゴール: Plugins でチーム共通の Skill・MCP 設定を配布できる
  - 公式ドキュメント: [Plugins](https://code.claude.com/docs/en/plugins)

- **2-3-7 Git と Worktree**
  - 種類: 混合
  - ゴール: Claude Code の Git 連携と Worktree を使った並列作業ができる
  - 公式ドキュメント: [Git Integration](https://code.claude.com/docs/en/git-integration), [Worktrees](https://code.claude.com/docs/en/worktrees)

- **2-3-8 GitHub Actions**
  - 種類: 混合
  - ゴール: GitHub Actions で Claude Code を CI/CD に組み込める
  - 公式ドキュメント: [GitHub Actions](https://code.claude.com/docs/en/github-actions)

---

## Part 3: Claude Code の実践

→ ゴール: 提供プロジェクトで実務タスクを Claude Code と協働して遂行し、AI 出力を自ら検証・判断する力を鍛える
→ ハンズオン: 提供プロジェクト CourseHub（概念 + 混合パターン）

### 実践の方針

- 全 Chapter は概念 Section（方法論）+ 混合 Section（実践）の構成
- 概念 Section: その Chapter に共通する方法論を教える（提供プロジェクトに依存しない）
- 混合 Section: 🏃 実践パートで提供プロジェクトを使って手を動かす
- 見極めチェック（正しさ・品質・安全性）を Chapter ごとに重点を変える

### Chapter 3-1: 実践の準備（3 Section）

**ゴール**: Claude Code で実務タスクを遂行する考え方を理解し、提供プロジェクトの環境を整えて初動を完了する。

- **3-1-1 Claude Code で実務タスクを遂行する考え方**
  - 種類: 概念
  - ゴール: Part 2 で学んだ機能を実務で活かすための考え方と、AI 出力を判断する力の重要性を理解する
  - 方法論: 70-30 モデル、「AI エージェントの活用 = コードレビュー」、AI 生成コードの検証が必要な理由
  - 公式ドキュメント: [Best Practices](https://code.claude.com/docs/en/best-practices)

- **3-1-2 セットアップと動作確認**
  - 種類: 混合
  - ゴール: リポジトリのクローンから Sail 起動・動作確認までを完了する
  - 🏃 実践: CourseHub をクローンし、Sail で起動して動作確認する
  - 意図: README のズレに気づき、Claude Code で正しい手順を特定する体験を含む
  - 公式ドキュメント: [Common Workflows](https://code.claude.com/docs/en/common-workflows)

- **3-1-3 プロジェクトの規約・設定を確認する**
  - 種類: 混合
  - ゴール: 前任チームが残したドキュメントと設定を確認し、不足や乖離に気づいて更新できる
  - 🏃 実践: CourseHub のドキュメントと設定を確認・更新する
  - 意図: 実務では規約と実態のズレが日常的に存在する。「何に従うべきか」を判断する体験
  - 公式ドキュメント: [Memory](https://code.claude.com/docs/en/memory), [Settings](https://code.claude.com/docs/en/settings), [Skills](https://code.claude.com/docs/en/skills)

### Chapter 3-2: 既存コードを理解する（3 Section）

**ゴール**: Claude Code を使ってプロジェクトの全体像と業務フローを把握し、Claude の説明を自分で検証できる。

- **3-2-1 コードリーディングの方法論**
  - 種類: 概念
  - ゴール: 既存プロジェクトを効率的に理解する方法論と、Claude の説明を検証する力を身につける
  - 方法論: 既存プロジェクトの読み方（全体像→構造→フロー）、Claude の説明を検証する方法
  - 公式ドキュメント: [Best Practices](https://code.claude.com/docs/en/best-practices), [Sub-agents](https://code.claude.com/docs/en/sub-agents)

- **3-2-2 知らない技術への向き合い方**
  - 種類: 概念
  - ゴール: 未知の技術やパターンに出会ったとき、段階的に理解を深める対処フローと心構えを身につける
  - 方法論: 理解する→評価する→判断する→説明できる の4ステップ、理解の深さの判断基準
  - 公式ドキュメント: [Best Practices](https://code.claude.com/docs/en/best-practices)

- **3-2-3 CourseHub のコードを読む**
  - 種類: 混合
  - ゴール: プロジェクトの全体像と業務フローを把握し、知らないパターンに対処できる
  - 🏃 実践: CourseHub のコードを読み、理解する（全体像把握→業務フロー追跡→知らない技術との遭遇）
  - 公式ドキュメント: [Sub-agents](https://code.claude.com/docs/en/sub-agents), [MCP](https://code.claude.com/docs/en/mcp)

### Chapter 3-3: バグを修正する（2 Section）

**ゴール**: Claude Code と協働してバグの原因特定から修正・検証までを遂行し、バグの種類に応じた見極めができる。

> 見極める力の重点: **安全性**（認可の漏れ）

- **3-3-1 バグ修正の方法論**
  - 種類: 概念
  - ゴール: バグ修正の全体フロー（報告→再現→調査→修正→検証）と、Claude Code を活用した各フェーズの進め方を理解する
  - 方法論: バグ報告から技術的な原因仮説を立てる方法、3類型（データの正しさ・アクセス制御・機能不全）ごとのアプローチ
  - 公式ドキュメント: [Common Workflows](https://code.claude.com/docs/en/common-workflows)

- **3-3-2 CourseHub のバグを修正する**
  - 種類: 混合
  - ゴール: 3種類のバグを段階的に自律度を上げながら修正・検証できる
  - 🏃 実践: 進捗率バグ（データの正しさ）→ 認可バグ（アクセス制御）→ 500エラー（機能不全）
  - 公式ドキュメント: [Common Workflows](https://code.claude.com/docs/en/common-workflows), [Checkpointing](https://code.claude.com/docs/en/checkpointing)

### Chapter 3-4: 機能を開発する（2 Section）

**ゴール**: 既存機能への追加と新規機能の開発を Claude Code と協働して遂行し、既存設計との整合性を自分で判断できる。

> 見極める力の重点: **品質**（既存設計との整合性）

- **3-4-1 機能開発の方法論**
  - 種類: 概念
  - ゴール: 機能開発の全体フロー（要件理解→設計→実装→検証）を理解する
  - 方法論: 要件をタスクに分解する方法、既存パターンを指示に含める方法、AI の設計提案を判断する基準
  - 公式ドキュメント: [Common Workflows](https://code.claude.com/docs/en/common-workflows), [Best Practices](https://code.claude.com/docs/en/best-practices)

- **3-4-2 CourseHub に機能を追加する**
  - 種類: 混合
  - ゴール: 既存機能の拡張と新規機能の構築を、既存設計との整合性を検証しながら遂行できる
  - 🏃 実践: 小テスト再受験機能（既存機能の拡張）→ コースレビュー機能（新規機能の構築）
  - 公式ドキュメント: [Hooks](https://code.claude.com/docs/en/hooks), [Common Workflows](https://code.claude.com/docs/en/common-workflows)

### Chapter 3-5: コードを改善する（2 Section）

**ゴール**: Claude Code を使って既存コードの品質を改善し、変更前後で動作が変わらないことをテストで保証できる。

> 見極める力の重点: **正しさ**（動作不変の保証）

- **3-5-1 リファクタリングの方法論**
  - 種類: 概念
  - ゴール: リファクタリングの全体フロー（対象特定→テスト確認→改善→テスト再実行）を理解する
  - 方法論: 改善対象の特定基準、テストによる動作保証、Claude Code の改善提案を評価する基準
  - 公式ドキュメント: [Common Workflows](https://code.claude.com/docs/en/common-workflows)

- **3-5-2 CourseHub のコードを改善する**
  - 種類: 混合
  - ゴール: コード構造とパフォーマンスを改善し、テストで動作保証できる
  - 🏃 実践: Fat Controller の責務分離（コード構造）→ N+1 クエリの解消（パフォーマンス）
  - 公式ドキュメント: [Worktrees](https://code.claude.com/docs/en/worktrees), [Costs](https://code.claude.com/docs/en/costs)

### Chapter 3-6: チームに共有する（2 Section）

**ゴール**: AI 生成コードに対する説明責任を理解し、チーム開発での Claude Code 活用の環境を整備できる。

- **3-6-1 AI 時代のチーム開発**
  - 種類: 概念
  - ゴール: AI 生成コードをチームに共有する際の説明責任と、AI がチーム開発にもたらす変化を理解する
  - 方法論: 説明責任、AI でレビューがボトルネックになる問題と対策、帰属表示
  - 公式ドキュメント: [Git Integration](https://code.claude.com/docs/en/git-integration)

- **3-6-2 CourseHub の変更をチームに届ける**
  - 種類: 混合
  - ゴール: 説明責任を意識した PR 作成と、チーム開発の環境整備を遂行できる
  - 🏃 実践: PR 作成 → チーム設定（GitHub Actions, settings.json）→ ワークフローの Skill 化
  - 公式ドキュメント: [GitHub Actions](https://code.claude.com/docs/en/github-actions), [Settings](https://code.claude.com/docs/en/settings), [Skills](https://code.claude.com/docs/en/skills)

---

## Part 4: 継続的な学習

→ ゴール: ツール・技術の進化を追い、自ら試し、実務に適応し続けるための習慣を身につける
→ ハンズオンなし（全 Section 概念）

### Chapter 4-1: 学び続けるために（3 Section）

**ゴール**: Claude Code と AI ツールの進化に追従し続ける方法を理解し、教材で学んだことを振り返り、さらに先の活用領域を知る。

- **4-1-1 学び続けるサイクル**
  - 種類: 概念
  - ゴール: 情報収集・検証・適用判断の一連のサイクルを理解し、自走できるようになる
  - 公式ドキュメント: [Overview](https://code.claude.com/docs/en/overview), [Best Practices](https://code.claude.com/docs/en/best-practices)

- **4-1-2 教材の総まとめ・次のステップ**
  - 種類: 概念
  - ゴール: 教材全体で身につけた能力を振り返り、ここから先の成長の道筋を描く

- **4-1-3 Claude Code の発展機能を知る**
  - 種類: 概念
  - ゴール: 教材で深く扱わなかった機能の全体像を把握し、次に試す候補を見つける
  - 公式ドキュメント: [Desktop](https://code.claude.com/docs/en/desktop), [Voice Dictation](https://code.claude.com/docs/en/voice-dictation), [Agent Teams](https://code.claude.com/docs/en/agent-teams), [Headless](https://code.claude.com/docs/en/headless)
```

---

## writing.md の調整例

### トーン

```markdown
Pro生の隣にいる**先輩エンジニア**として書く。Claude Code との協働を通じて**驚き**と**面白さ**を届ける。

- **本文**: 落ち着いた敬体で丁寧に解説する
- **🧠 先輩エンジニアはこう考える**: 実体験ベースの語りを集中させる
```

### 用語テーブル

| 表記 | 備考 |
|---|---|
| WSL | Windows Subsystem for Linux。初出時に正式名称を記載 |
| MCP | Model Context Protocol。初出時に正式名称を記載 |
| セクション | 教材本文ではカタカナ表記。内部ドキュメントでは英語 |

### その他の調整

- 読者への呼びかけは「あなた」。各 Part の最初の Section で「Pro生」を定義し、以降は「あなた」
- Claude Code の機能名は公式ドキュメントの表記に従い英語のまま
