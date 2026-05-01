# OUTLINE.md - COACHTECH LMS 開発オンボーディング

## 階層構造

3層: Part > Chapter > Section

---

## Part 1: 開発環境とワークフロー

→ ゴール: LMS リポジトリの開発ツールチェーンを理解し、日常の開発フローを自立して回せるようになる

### Chapter 01: LMS 開発環境の全体像（3 Section）

**ゴール**: LMS リポジトリの構成と開発ツールの全体像を把握する

- **1-1-1 LMS リポジトリの構成を把握する**
  - 種類: 混合
  - ゴール: LMS リポジトリのディレクトリ構成（frontend/backend/infra/docker）と各ディレクトリの役割を理解する
  - 参考資料: `/Users/yotaro/lms/CLAUDE.md`, `/Users/yotaro/lms/AGENTS.md`

- **1-1-2 Docker Compose の応用構成を理解する**
  - 種類: 概念
  - ゴール: LMS の docker-compose.yml（5サービス構成: app/web/db/phpmyadmin/mailpit）の設計意図と各サービスの関係を理解する
  - 前提: COACHTECH 教材 tutorial-6（Docker 基礎）
  - 参考資料: `/Users/yotaro/lms/docker-compose.yml`, `/Users/yotaro/lms/docker/`

- **1-1-3 Makefile による開発コマンド体系を理解する**
  - 種類: 混合
  - ゴール: Makefile の仕組みと LMS の 70+ コマンド体系（Docker 操作・Laravel 操作・DB 操作・キャッシュ・ログ）を理解し、主要コマンドを実行確認する
  - 参考資料: `/Users/yotaro/lms/Makefile`

### Chapter 02: コード品質ツールチェーン（4 Section）

**ゴール**: リンター・フォーマッター・Git フックの仕組みを理解する

- **1-2-1 リンターとフォーマッターの役割と仕組み**
  - 種類: 概念
  - ゴール: リンター（静的解析）とフォーマッター（整形）の違い、なぜ両方必要かを理解する

- **1-2-2 フロントエンドのコード品質ツール**
  - 種類: 概念
  - ゴール: ESLint（ルール・プラグイン・extends の仕組み）と Prettier（フォーマットルール）の設定構造を理解する
  - 参考資料: `/Users/yotaro/lms/frontend/.eslintrc.json`, `/Users/yotaro/lms/frontend/.prettierrc`

- **1-2-3 バックエンドのコード品質ツール**
  - 種類: 概念
  - ゴール: PHP-CS-Fixer（PSR12 準拠のフォーマット）と PHPCS（コーディング規約チェック）の設定構造を理解する
  - 参考資料: `/Users/yotaro/lms/backend/.php-cs-fixer.php`, `/Users/yotaro/lms/backend/phpcs.xml`

- **1-2-4 Git フックによる自動化**
  - 種類: 混合
  - ゴール: Husky（Git フック管理）と lint-staged（ステージファイルへの選択的リント実行）の仕組みを理解し、コミット時の自動チェックを実行確認する
  - 前提: [1-2-2, 1-2-3]
  - 参考資料: `/Users/yotaro/lms/.husky/`, `/Users/yotaro/lms/package.json`

---

## Part 2: フロントエンド基盤

→ ゴール: JavaScript・TypeScript・React・Next.js のコア概念を体系的に理解し、LMS フロントエンドのコードを読み解く基盤を作る

### Chapter 01: JavaScript の基礎（5 Section）

**ゴール**: PHP の知識を起点に、JavaScript 固有の概念を効率的に学ぶ

- **2-1-1 モダン Web アプリケーションのアーキテクチャ**
  - 種類: 概念
  - ゴール: 従来のサーバーサイドレンダリング（Blade 等）と SPA + API アーキテクチャの違い、フロントエンドとバックエンドが別アプリケーションとして API で通信する構造、CORS・CSRF・Cookie/Token ベース認証の基礎概念を理解する
  - 意図: COACHTECH 教材では Laravel が HTML を返す構成のみ扱うため、「フロントエンドとバックエンドの繋ぎ込み」の全体像を先に示す

- **2-1-2 JavaScript と PHP の根本的な違い**
  - 種類: 概念
  - ゴール: JavaScript のシングルスレッド・イベントループモデル、ブラウザ/Node.js 実行環境、動的型付けの特性を PHP と対比して理解する

- **2-1-3 変数・関数・スコープ**
  - 種類: 概念
  - ゴール: let/const/var の違い、アロー関数、クロージャ、スコープチェーンを理解する

- **2-1-4 非同期処理**
  - 種類: 概念
  - ゴール: コールバック → Promise → async/await の進化と、イベントループの仕組みを理解する。PHP の同期実行モデルとの対比
  - 参考資料: [MDN - Promise](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise), [MDN - async/await](https://developer.mozilla.org/ja/docs/Learn_web_development/Extensions/Async_JS/Promises)

- **2-1-5 モジュールシステムと配列操作**
  - 種類: 概念
  - ゴール: ES Modules（import/export）、npm/yarn パッケージ管理（Composer との対比）、配列の高階関数（map/filter/reduce）、分割代入、スプレッド構文を理解する

### Chapter 02: TypeScript（3 Section）

**ゴール**: JavaScript に型安全性を加える TypeScript の設計思想と型システムを理解する

- **2-2-1 TypeScript の設計思想と基本の型**
  - 種類: 概念
  - ゴール: なぜ TypeScript が必要か、基本型（string/number/boolean/array/object）、型注釈、型推論を理解する
  - 前提: [2-1-2, 2-1-3]

- **2-2-2 高度な型とジェネリクス**
  - 種類: 概念
  - ゴール: ユニオン型、交差型、リテラル型、ジェネリクス、型ガード、ユーティリティ型（Partial/Pick/Omit 等）を理解する
  - 前提: [2-2-1]
  - 参考資料: [TypeScript Handbook - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

- **2-2-3 インターフェースと型エイリアス**
  - 種類: 概念
  - ゴール: interface と type の使い分け、型の拡張と合成、LMS での型定義パターン（Props 型、HttpDocument 型）を理解する
  - 前提: [2-2-2]
  - 参考資料: `/Users/yotaro/lms/frontend/src/type/v2/`

### Chapter 03: React（4 Section）

**ゴール**: React のコンポーネントモデルとレンダリングの仕組みを体系的に理解する

- **2-3-1 コンポーネントと JSX**
  - 種類: 概念
  - ゴール: React のコンポーネント指向、JSX の仕組み、Props による単方向データフローを理解する
  - 前提: [2-2-1]

- **2-3-2 State と Hooks**
  - 種類: 概念
  - ゴール: useState/useEffect/useContext/useCallback/useMemo の役割と使い分け、カスタムフックのパターンを理解する
  - 前提: [2-3-1]
  - 参考資料: [React - State](https://react.dev/learn/state-a-components-memory), [React - Hooks Reference](https://react.dev/reference/react/hooks)

- **2-3-3 レンダリングの仕組みと最適化**
  - 種類: 概念
  - ゴール: 仮想 DOM、再レンダリングの条件、React.memo/useMemo/useCallback による最適化の考え方を理解する
  - 前提: [2-3-2]

- **2-3-4 コンポーネント設計パターン**
  - 種類: 概念
  - ゴール: Container/Presentational パターン、合成パターン、children の活用、LMS のコンポーネント分類（elements/layouts/templates/features）を理解する
  - 前提: [2-3-3]
  - 参考資料: `/Users/yotaro/lms/frontend/src/components/v2/`

### Chapter 04: Next.js（3 Section）

**ゴール**: React のメタフレームワーク Next.js の App Router アーキテクチャを理解する

- **2-4-1 Next.js の設計思想と App Router**
  - 種類: 概念
  - ゴール: なぜ React だけでは不十分か、Next.js が解決する課題（ルーティング・SSR・最適化）、App Router のファイルベースルーティングを理解する
  - 前提: [2-3-1]
  - 参考資料: [Next.js - Routing](https://nextjs.org/docs/app/building-your-application/routing)

- **2-4-2 Server Components と Client Components**
  - 種類: 概念
  - ゴール: Server/Client Components の境界、'use client' ディレクティブの意味、レンダリング戦略（SSR/SSG/ISR）を理解する
  - 前提: [2-4-1]
  - 参考資料: [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components), [Next.js - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

- **2-4-3 レイアウト・ミドルウェア・設定**
  - 種類: 概念
  - ゴール: layout.tsx/loading.tsx/error.tsx の役割、ミドルウェアによるリクエスト制御、next.config.mjs の設定を理解する
  - 前提: [2-4-2]
  - 参考資料: `/Users/yotaro/lms/frontend/src/app/`, `/Users/yotaro/lms/frontend/next.config.mjs`

---

## Part 3: フロントエンドエコシステム

→ ゴール: LMS フロントエンドで使われるライブラリ群の全体像と、それぞれの設計思想・使い方を理解する

### Chapter 01: 状態管理とデータフェッチ（3 Section）

**ゴール**: フロントエンドにおけるデータの流れ（取得・保持・更新）の全体像を理解する

- **3-1-1 フロントエンドのデータ管理戦略**
  - 種類: 概念
  - ゴール: サーバー状態とクライアント状態の区別、グローバル状態 vs ローカル状態、LMS のデータ管理アーキテクチャの全体像を理解する

- **3-1-2 Zustand によるグローバル状態管理**
  - 種類: 概念
  - ゴール: Zustand のストア設計（State/Action 分離）、persist ミドルウェア、SSR ハイドレーション問題の解決パターンを理解する
  - 前提: [3-1-1]
  - 参考資料: `/Users/yotaro/lms/frontend/src/store/v2/`

- **3-1-3 HTTP クライアントと SWR（フロントエンド・バックエンド繋ぎ込みの実装）**
  - 種類: 概念
  - ゴール: LMS のカスタム HTTP クライアント（fetch.ts）の設計（CSRF トークン取得・認証エラーハンドリング・419 リトライ・型安全な HttpDocument パターン）、SWR のキャッシュ・再検証戦略、feature/api/ ディレクトリでの API 関数定義パターンを理解する。2-1-1 で学んだ SPA + API アーキテクチャの概念が LMS でどう実装されているかを具体的に把握する
  - 前提: [3-1-1, 2-1-1]
  - 参考資料: `/Users/yotaro/lms/frontend/src/lib/v2/fetch.ts`, `/Users/yotaro/lms/frontend/src/features/v2/`

### Chapter 02: フォームとバリデーション（1 Section）

**ゴール**: ユーザー入力の収集と検証の仕組みを理解する

- **3-2-1 React Hook Form と Yup**
  - 種類: 概念
  - ゴール: React Hook Form の制御モデル（useForm/useController）、Yup スキーマバリデーション、yupResolver による統合、LMS のフォームパターンを理解する
  - 前提: [2-3-2]
  - 参考資料: `/Users/yotaro/lms/frontend/src/lib/v2/yup.ts`

### Chapter 03: UI ライブラリとスタイリング（3 Section）

**ゴール**: LMS の UI 構築に使われるスタイリング技術とコンポーネントライブラリの全体像を理解する

- **3-3-1 Tailwind CSS の応用テクニック**
  - 種類: 概念
  - ゴール: cn() ユーティリティ（clsx + twMerge）、CVA（Class Variance Authority）、レスポンシブデザインパターン、Tailwind 設定のカスタマイズを理解する
  - 前提: COACHTECH 教材 tutorial-5（Tailwind 基礎）
  - 参考資料: `/Users/yotaro/lms/frontend/tailwind.config.ts`, `/Users/yotaro/lms/frontend/src/lib/v2/cn.ts`

- **3-3-2 HeroUI と MUI**
  - 種類: 概念
  - ゴール: HeroUI（主要コンポーネントライブラリ）と MUI（DatePicker 等の補助利用）の役割分担、Provider 設定、LMS でのラッピングパターンを理解する
  - 前提: [3-3-1]
  - 参考資料: `/Users/yotaro/lms/frontend/src/providers/v2/providers.tsx`

- **3-3-3 CSS-in-JS と Iconify**
  - 種類: 概念
  - ゴール: Emotion（CSS-in-JS）の仕組みと LMS での使用箇所、Iconify によるアイコン管理パターンを理解する
  - 前提: [3-3-1]

### Chapter 04: リッチコンテンツと可視化（3 Section）

**ゴール**: LMS 固有のリッチ UI コンポーネントの仕組みを理解する

- **3-4-1 BlockNote エディタと Markdown レンダリング**
  - 種類: 概念
  - ゴール: BlockNote のブロックベースエディタの仕組み、react-markdown + remark/rehype プラグインによる Markdown レンダリング、LMS での使用箇所を理解する
  - 参考資料: `/Users/yotaro/lms/frontend/src/features/v1/questions/`

- **3-4-2 FullCalendar と Chart.js**
  - 種類: 概念
  - ゴール: FullCalendar のプラグインアーキテクチャ、Chart.js のデータ構造とカスタマイズ、LMS でのスケジュール管理・学習進捗可視化を理解する
  - 参考資料: `/Users/yotaro/lms/frontend/src/features/v2/schedule/`

- **3-4-3 dnd-kit によるドラッグ＆ドロップ**
  - 種類: 概念
  - ゴール: dnd-kit の DndContext/Sortable パターン、LMS でのカリキュラム並び替え等の実装構造を理解する

---

## Part 4: バックエンド応用と外部連携

→ ゴール: LMS の Laravel バックエンドで使われている Clean Architecture パターンと外部サービス連携の構造を理解する

### Chapter 01: Clean Architecture パターン（4 Section）

**ゴール**: LMS の Laravel アーキテクチャ（UseCase/Service/Repository）の設計思想と各層の役割を理解する

- **4-1-1 なぜ MVC だけでは足りないのか**
  - 種類: 概念
  - ゴール: MVC の限界（Fat Controller 問題）、Clean Architecture の思想、LMS が採用するレイヤー構成（Controller → UseCase → Service → Repository → Model）を理解する
  - 前提: COACHTECH 教材 tutorial-9（Laravel MVC 基礎）

- **4-1-2 UseCase パターン**
  - 種類: 概念
  - ゴール: Invokable クラス（__invoke）による単一責務の UseCase 設計、依存注入、UseCase 間の合成パターンを LMS の実例で理解する
  - 前提: [4-1-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/UseCases/`

- **4-1-3 Service 層と Repository パターン**
  - 種類: 概念
  - ゴール: Service（ビジネスロジック・外部連携）と Repository（データアクセス抽象化）の役割分担、インターフェースバインディング、LMS での使い分けを理解する
  - 前提: [4-1-2]
  - 参考資料: `/Users/yotaro/lms/backend/app/Services/`, `/Users/yotaro/lms/backend/app/Repositories/`

- **4-1-4 リクエスト/レスポンス変換層**
  - 種類: 概念
  - ゴール: FormRequest（バリデーション分離）、Resource（snake_case → camelCase 変換・レスポンス整形）、LMS の命名規則とディレクトリ構成を理解する
  - 前提: [4-1-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/Http/Requests/`, `/Users/yotaro/lms/backend/app/Http/Resources/`

### Chapter 02: 認証と API 設計（2 Section）

**ゴール**: マルチユーザー認証と API ドキュメント自動生成の仕組みを理解する

- **4-2-1 Laravel Sanctum とマルチガード認証**
  - 種類: 概念
  - ゴール: Sanctum のトークン認証とセッション認証の仕組み、LMS のマルチガード構成（user/employee/system_user）、ワークスペースベースのマルチテナンシーを理解する
  - 前提: COACHTECH 教材 tutorial-10（認証基礎）, [4-1-1]
  - 参考資料: [Laravel Sanctum](https://laravel.com/docs/10.x/sanctum), `/Users/yotaro/lms/backend/config/auth.php`, `/Users/yotaro/lms/backend/routes/api.php`

- **4-2-2 Swagger/OpenAPI による API ドキュメント**
  - 種類: 概念
  - ゴール: OpenAPI 仕様の構造、L5-Swagger と Scramble の役割、アノテーションベースの API ドキュメント自動生成の仕組みを理解する
  - 前提: COACHTECH 教材 tutorial-11（API 基礎）
  - 参考資料: `/Users/yotaro/lms/backend/config/l5-swagger.php`

### Chapter 03: イベント駆動アーキテクチャ（2 Section）

**ゴール**: Observer・Listener・通知システムによるイベント駆動パターンを理解する

- **4-3-1 Observer と Listener**
  - 種類: 概念
  - ゴール: Eloquent Observer（モデルイベント: creating/updating/deleted）、Event/Listener パターン、saveQuietly() による再帰防止を LMS の並び替え Observer を例に理解する
  - 前提: COACHTECH 教材 tutorial-9（Eloquent 基礎）
  - 参考資料: `/Users/yotaro/lms/backend/app/Observers/`

- **4-3-2 通知システム**
  - 種類: 概念
  - ゴール: Laravel Notification のチャネル（メール/Slack/LINE）、通知の設計パターン、LMS での通知フローを理解する
  - 前提: [4-3-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/Notifications/`

### Chapter 04: 外部サービス連携（4 Section）

**ゴール**: 外部 API 連携の共通パターンと LMS で使われる個別サービスの構造を理解する

- **4-4-1 外部 API 連携の共通パターン**
  - 種類: 概念
  - ゴール: 外部 API 連携の設計原則（Service 層への集約、config/services.php による認証情報管理、エラーハンドリング、リトライ戦略）を理解する
  - 前提: [4-1-3]

- **4-4-2 メール送信（SendGrid / SES）**
  - 種類: 概念
  - ゴール: Laravel Mailable の仕組み、SendGrid（開発/本番）と SES（AWS）の使い分け、LMS のメール送信パターンを理解する
  - 前提: [4-4-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/Mail/`

- **4-4-3 Google Calendar / Drive API**
  - 種類: 概念
  - ゴール: OAuth 2.0 フロー、トークン管理（リフレッシュ）、Google Calendar イベント作成（Meet 自動生成）、LMS のスケジュール同期構造を理解する
  - 前提: [4-4-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/Services/GoogleCalendarService.php`

- **4-4-4 HubSpot・LINE・Notion・Veritrans**
  - 種類: 概念
  - ゴール: HubSpot CRM 連携、LINE Login OAuth / LINE Notify プッシュメッセージ、Notion API、Veritrans 決済の各連携構造を理解する
  - 前提: [4-4-1]
  - 参考資料: `/Users/yotaro/lms/backend/app/Services/Line/`, `/Users/yotaro/lms/backend/config/services.php`

---

## Part 5: インフラストラクチャと CI/CD

→ ゴール: LMS の AWS 構成、Terraform によるインフラ管理、CI/CD パイプラインの全体像を理解する

### Chapter 01: クラウドインフラの基礎と AWS アーキテクチャ（4 Section）

**ゴール**: クラウドインフラの基礎概念と LMS の AWS 構成を理解する

- **5-1-1 クラウドインフラの基礎概念**
  - 種類: 概念
  - ゴール: オンプレミス vs クラウドの違い、IaaS/PaaS/SaaS の区分、AWS の主要サービスカテゴリ（コンピュート・ストレージ・ネットワーク・データベース）を理解する

- **5-1-2 LMS の AWS アーキテクチャ全体像**
  - 種類: 概念
  - ゴール: LMS のリクエストフロー（CloudFront → ALB → ECS Fargate → RDS Aurora）、各 AWS サービスの役割と接続関係、ネットワーク構成（VPC/サブネット/セキュリティグループ）を理解する
  - 前提: [5-1-1]

- **5-1-3 コンテナオーケストレーション（ECS Fargate）**
  - 種類: 概念
  - ゴール: ECS のクラスター/サービス/タスク定義の階層、Fargate のサーバーレスコンテナ実行、LMS の ECS 構成（Nginx + Laravel のサイドカーパターン、バッチタスク）を理解する
  - 前提: [5-1-2], COACHTECH 教材 tutorial-6（Docker 基礎）

- **5-1-4 CDN・ロードバランサー・ストレージ・データベース**
  - 種類: 概念
  - ゴール: CloudFront（CDN + オリジンルーティング）、ALB（ターゲットグループ + Blue/Green）、S3（静的ファイル + OAC）、RDS Aurora（Multi-AZ + リードレプリカ）、DynamoDB（セッション/キャッシュ）の仕組みと LMS での設定を理解する
  - 前提: [5-1-2]

### Chapter 02: Terraform によるインフラ管理（2 Section）

**ゴール**: Infrastructure as Code の概念と LMS の Terraform 構成を理解する

- **5-2-1 Terraform の基礎概念**
  - 種類: 概念
  - ゴール: IaC のメリット、Terraform の動作モデル（plan → apply → state）、HCL 構文（resource/variable/output/module）、状態管理（S3 バックエンド）を理解する
  - 参考資料: [Terraform - Get Started](https://developer.hashicorp.com/terraform/tutorials/aws-get-started), [Terraform - Configuration Language](https://developer.hashicorp.com/terraform/language)

- **5-2-2 LMS の Terraform 構成**
  - 種類: 概念
  - ゴール: LMS の Terraform ディレクトリ構造（shared/stacks/modules）、モジュール分割（application/network/db/cdn/cicd 等）、環境別 tfvars による production/staging の管理を理解する
  - 前提: [5-2-1]
  - 参考資料: `/Users/yotaro/lms/infra/`

### Chapter 03: CI/CD パイプライン（3 Section）

**ゴール**: GitHub Actions・CodeBuild・CodeDeploy によるデプロイ自動化の全体像を理解する

- **5-3-1 GitHub Actions の仕組みと LMS のワークフロー**
  - 種類: 概念
  - ゴール: GitHub Actions の基本概念（ワークフロー/ジョブ/ステップ/トリガー）、LMS の 7 ワークフローの役割を理解する
  - 参考資料: [GitHub Actions - Understanding](https://docs.github.com/ja/actions/about-github-actions/understanding-github-actions), `/Users/yotaro/lms/.github/workflows/`

- **5-3-2 CodeBuild と CodeDeploy**
  - 種類: 概念
  - ゴール: CodeBuild の buildspec.yml（イメージビルド → ECR プッシュ → タスク定義更新 → マイグレーション）、CodeDeploy の Blue/Green デプロイ戦略、デプロイフロー全体を理解する
  - 前提: [5-3-1], [5-1-3]
  - 参考資料: `/Users/yotaro/lms/infra/buildspec.yml`

- **5-3-3 環境管理とモニタリング**
  - 種類: 概念
  - ゴール: dev/staging/production 環境の違い、Secrets Manager による機密情報管理、CloudWatch ログ・メトリクスによるモニタリング、トラブルシューティングの基本手順を理解する
  - 前提: [5-3-2]

---

## Part 6: LMS コードベース総合理解

→ ゴール: Part 1〜5 で学んだ知識を統合し、LMS のコードを横断的に読み解く力を身につける

### Chapter 01: フロントエンドコードリーディング（3 Section）

**ゴール**: LMS フロントエンドのコード構造とパターンを実際のコードで読み解く

- **6-1-1 ディレクトリ構造と V1/V2 移行戦略**
  - 種類: 概念
  - ゴール: LMS フロントエンドのディレクトリ設計思想、V1（凍結）→ V2（現行）→ Kit（次世代）の移行戦略を理解する
  - 前提: Part 2, Part 3
  - 参考資料: `/Users/yotaro/lms/frontend/CLAUDE.md`, `/Users/yotaro/lms/frontend/AGENTS.md`

- **6-1-2 feature モジュールの構造**
  - 種類: 概念
  - ゴール: feature ディレクトリの標準構成（api/components/hooks/schema/types/utils）、HttpDocument 型による型安全な API 呼び出し、feature 間の依存関係を実際のコードで理解する
  - 前提: [6-1-1]
  - 参考資料: `/Users/yotaro/lms/frontend/src/features/v2/`

- **6-1-3 認証フローとプロバイダー構成**
  - 種類: 概念
  - ゴール: Server Components でのサーバーサイド認証（requireUser/requireEmployee）、Zustand の actor-store、Provider 構成を実際のコードで理解する
  - 前提: [6-1-1]
  - 参考資料: `/Users/yotaro/lms/frontend/src/hooks/v2/auth.ts`, `/Users/yotaro/lms/frontend/src/providers/v2/providers.tsx`

### Chapter 02: バックエンドコードリーディング（2 Section）

**ゴール**: LMS バックエンドの Clean Architecture をリクエストのライフサイクルに沿って読み解く

- **6-2-1 リクエストのライフサイクル**
  - 種類: 概念
  - ゴール: HTTP リクエストが Route → Middleware → Controller → UseCase → Service → Repository → Model の各層を通過する流れを、LMS の実際のエンドポイントでトレースして理解する
  - 前提: Part 4
  - 参考資料: `/Users/yotaro/lms/backend/routes/api.php`, `/Users/yotaro/lms/backend/app/Http/Controllers/`

- **6-2-2 ドメインモデルとビジネスロジック**
  - 種類: 概念
  - ゴール: LMS のドメインモデル（User/Employee/Workspace/Curriculum 等）の関係性、Enum による状態管理、Observer によるイベント処理を実際のコードで理解する
  - 前提: [6-2-1]
  - 参考資料: `/Users/yotaro/lms/docs/domain-model.md`, `/Users/yotaro/lms/backend/app/Models/`

### Chapter 03: インフラコードリーディング（2 Section）

**ゴール**: Terraform コード・CI/CD 設定ファイル・Docker 設定を読み解く

- **6-3-1 Terraform モジュールの読み方**
  - 種類: 概念
  - ゴール: LMS の Terraform モジュールの実際のコードを読み、各リソース定義が AWS 上のどのインフラに対応するかを理解する
  - 前提: Part 5
  - 参考資料: `/Users/yotaro/lms/infra/stacks/modules/`

- **6-3-2 CI/CD 設定ファイルと Docker 構成の読み方**
  - 種類: 概念
  - ゴール: GitHub Actions ワークフロー、buildspec.yml、Dockerfile（本番用/開発用）の各設定が何をトリガーし何を実行するかを理解する
  - 前提: [6-3-1]
  - 参考資料: `/Users/yotaro/lms/.github/workflows/`, `/Users/yotaro/lms/infra/buildspec.yml`, `/Users/yotaro/lms/docker/`

### Chapter 04: 機能トレーシング（2 Section）

**ゴール**: フロントエンドからインフラまでを横断し、1つの機能がどう実現されているかをエンドツーエンドで追う

- **6-4-1 リクエストフローのエンドツーエンドトレース**
  - 種類: 概念
  - ゴール: ユーザー操作（UI クリック）→ フロントエンド（コンポーネント → API 呼び出し）→ バックエンド（Controller → UseCase → DB）→ レスポンス → UI 更新の全体フローを、LMS の具体的な機能でトレースする
  - 前提: [6-1-2, 6-2-1]

- **6-4-2 新機能追加時のコード変更箇所の特定**
  - 種類: 概念
  - ゴール: 新機能追加時にフロントエンド・バックエンド・インフラで変更が必要な箇所の特定方法、CLAUDE.md/AGENTS.md を活用したコードナビゲーション手法を理解する
  - 前提: [6-4-1]
  - 参考資料: `/Users/yotaro/lms/CLAUDE.md`, `/Users/yotaro/lms/frontend/CLAUDE.md`, `/Users/yotaro/lms/backend/CLAUDE.md`
