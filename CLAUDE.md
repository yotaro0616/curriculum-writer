<!-- {{TOPIC}}: COACHTECH LMS 開発技術 -->

# COACHTECH LMS 開発オンボーディング

> COACHTECH LMS のプロダクトマネージャーが、教材でカバーされていないフロントエンド・インフラ・バックエンド応用技術を体系的に理解し、Claude Code と協働して LMS の全領域を1人で開発できるようになるための教材

## ペルソナ（WHO）

COACHTECH LMS のプロダクトマネージャー。今後は1人で LMS の開発全般を担えるようになる必要がある。COACHTECH 教材（tutorial 1〜13）を修了しており、バックエンド側の Web アプリケーション開発の基礎知識を持つ。フロントエンド（React/Next.js/TypeScript）とインフラ（AWS/Terraform/CI・CD）の知識は全くない。

### 前提知識

- **バックエンド**: PHP 8+, Laravel（MVC・Eloquent・認証・ミドルウェア・テスト・API 基礎）
- **データベース**: MySQL, SQL（CRUD・JOIN・正規化・マイグレーション・シーダー）
- **フロントエンド基礎**: HTML5, CSS3, Tailwind CSS の基本
- **開発環境**: Docker / Docker Compose の基本操作, Git / GitHub（ブランチ戦略・PR・コードレビュー）
- **テスト**: PHPUnit（ユニットテスト・フィーチャーテスト）
- **ツール**: Claude Code の基本的な使い方

### 技術スタック

- **フロントエンド**: Next.js 14 / React 18 / TypeScript 5 / Tailwind CSS 3 / HeroUI / MUI / Zustand / SWR / React Hook Form
- **バックエンド**: PHP 8.1 / Laravel 10 / Sanctum / Swagger (L5-Swagger, Scramble)
- **インフラ**: AWS (ECS, ECR, CloudFront, ALB, S3, CloudWatch) / Terraform 1.11 / GitHub Actions
- **外部サービス**: SendGrid / Google Calendar API / HubSpot / LINE Notify / Notion API / Veritrans
- **開発ツール**: Makefile / Husky / lint-staged / ESLint / Prettier / PHP-CS-Fixer
- **LMS リポジトリ**: ローカル `/Users/yotaro/lms`、リモート `https://github.com/estra-inc/lms`

## コンセプト（WHY）

従来の教材やドキュメントは、ハンズオンが多く難易度も高いため、断片的な具体に集中してしまい体系的・構造的な理解がしにくい。本教材は Claude Code との協働を前提とし、「構文を暗記する」のではなく「各技術領域のメンタルモデルを構築する」ことに注力する。具体を理解した上でそれらを MECE にグルーピングし抽象化できれば、Claude Code に適切なプロンプトを与えて高速かつ高品質な開発が行える。

各技術を「Why（なぜ必要か）→ What（何ができるか）→ How（どう動くか）」の順で解説し、概念の全体像を先に示してから具体に入る。実践はコードリーディングを中心とし、自分でコードを書くハンズオンは最小限に留める。一般的なサンプルコードで概念を学んだ後、LMS の実際のコードを題材にしたコードリーディング演習で理解を実践に結びつける。「コードが書ける」ではなく「コードを読んで構造を理解し、Claude Code に的確な指示を出せる」ことをゴールとする。

## ゴール（WHAT）

この教材を修了した読者は、以下ができるようになる:

1. **フロントエンドの設計・実装指示**: React/Next.js/TypeScript のコンポーネント設計、状態管理、データフェッチの仕組みを理解し、Claude Code に適切な指示を出して UI を構築できる
2. **バックエンド応用パターンの理解と活用**: Clean Architecture（UseCase パターン）、API 認証（Sanctum）、API ドキュメント（Swagger）を理解し、既存のアーキテクチャに沿った実装ができる
3. **外部サービス連携の設計・実装**: 外部 API 連携の共通パターンを理解し、個別サービス（SendGrid, Google Calendar, HubSpot 等）の連携コードを読み書きできる
4. **インフラの理解と運用**: AWS 上の構成（ECS/CloudFront/ALB 等）と Terraform による管理、GitHub Actions による CI/CD パイプラインを理解し、デプロイや設定変更ができる
5. **LMS コードベースの全体理解**: フロントエンド・バックエンド・インフラのコードを横断的に読み、機能の全体像を把握した上で修正・拡張ができる
6. **開発ワークフローの自立運用**: Makefile、リンター、Git フック等の開発ツールチェーンを理解し、日常の開発フローを1人で回せる

## カリキュラム（HOW）

**階層構造**: 3層（Part > Chapter > Section）

| Part | テーマ | 概要 |
|---|---|---|
| 1 | 開発環境とワークフロー | Makefile・Docker Compose 応用・リンター・Git フック。LMS リポジトリですぐ開発を始められる状態を作る |
| 2 | フロントエンド基盤 | JavaScript 基礎（PHP との差分）・TypeScript・React・Next.js のコア概念。コンポーネント設計とレンダリングモデルの体系的理解 |
| 3 | フロントエンドエコシステム | 状態管理・データ取得・フォーム・UI ライブラリ・リッチコンテンツ。LMS で使われるライブラリ群の全体像 |
| 4 | バックエンド応用と外部連携 | Clean Architecture（UseCase/Repository/Service）・Observer/Listener・Sanctum・Swagger・外部 API 連携パターンと個別サービスの構造的理解 |
| 5 | インフラストラクチャと CI/CD | AWS 構成・Terraform・GitHub Actions。LMS のデプロイパイプライン全体の理解 |
| 6 | LMS コードベース総合理解 | フロントエンド・バックエンド・インフラを横断したコードリーディングと機能トレーシング |

各層の設計詳細は `OUTLINE.md` を参照。

CLAUDE.md は教材の哲学（WHO / WHY / WHAT / HOW）を定義し、`OUTLINE.md` はその哲学を具体的な設計に落とし込む。執筆上の判断（題材の選択・構成のアレンジ・外部調査）は `OUTLINE.md` の設計に従いつつ、臨機応変に行うこと。

## プロジェクトマップ（MAP）

執筆ルールは `.claude/rules/writing.md` を参照。

### 参考資料

| カテゴリ | 資料 |
|---|---|
| LMS リポジトリ | `/Users/yotaro/lms`（ローカル）/ `https://github.com/estra-inc/lms`（リモート） |
| COACHTECH 教材 | `/Users/yotaro/pj-ct-newtext/curriculums`（前提知識の確認用） |
| LMS ドキュメント | `/Users/yotaro/lms/docs/`（ドメインモデル・用語集・プロセス） |
| LMS CLAUDE.md | `/Users/yotaro/lms/CLAUDE.md`, `/Users/yotaro/lms/frontend/CLAUDE.md`, `/Users/yotaro/lms/backend/CLAUDE.md` |
| JavaScript | https://developer.mozilla.org/ja/docs/Web/JavaScript |
| TypeScript | https://www.typescriptlang.org/docs/ |
| React | https://react.dev |
| Next.js | https://nextjs.org/docs |
| Zustand | https://zustand.docs.pmnd.rs/ |
| SWR | https://swr.vercel.app/ja |
| React Hook Form | https://react-hook-form.com |
| Tailwind CSS | https://tailwindcss.com/docs |
| HeroUI | https://www.heroui.com/docs |
| Laravel 10.x | https://laravel.com/docs/10.x |
| Laravel Sanctum | https://laravel.com/docs/10.x/sanctum |
| AWS | https://docs.aws.amazon.com |
| Terraform | https://developer.hashicorp.com/terraform/docs |
| GitHub Actions | https://docs.github.com/ja/actions |

### Skills

| Skill | 用途 |
|---|---|
| `/setup` | 初期設定（CLAUDE.md・OUTLINE.md・writing.md の作成） |
| `/write` | 執筆（任意の階層単位） |
| `/review` | レビュー（品質・整合性チェック） |
| `/check-updates` | 公式ドキュメントとの鮮度チェック |

### フォルダ構造・命名規則

```
project-root/
├── CLAUDE.md                # 教材の哲学（WHO/WHY/WHAT/HOW/MAP）
├── OUTLINE.md               # カリキュラム設計
├── .claude/
│   ├── rules/writing.md     # 執筆ルール
│   ├── skills/              # Skill 定義
│   └── settings.json
├── curriculums/             # 教材本体
└── assets/                  # 画像
```

**3層**（Part > Chapter > Section）:
- `curriculums/part-XX_タイトル/chapter-XX_タイトル/X-X-X_タイトル.md`

**命名規則**:
- ディレクトリ名はゼロパディング（01始まり）
- ファイル名のセクション番号はゼロパディングなし
- ディレクトリ・ファイル名のタイトル部分は OUTLINE.md の見出しをそのまま使用する（日英混在可。スペースはハイフンに置換）
- 画像は内容がわかる英語名
