# コードを書ける人のための基本情報技術者試験 テクノロジ系完全攻略

> Web 開発を一通り学んだ受講生が、自分が書いてきたコードの裏側にあるコンピュータ・サイエンスの理論を理解しながら、基本情報技術者試験 科目A のテクノロジ系問題を解けるようになるための読み物形式の教材＋模試セットです。

> 📌 本ファイル（CLAUDE.md）は **構築側の内部設計ドキュメント**。教材本文（`curriculums/` 配下の `.md` / `.yaml`）には **構築側メタ語（COACHTECH / 模擬案件 / Pro 生 / Step / Phase / v3 等）を絶対に書かない**。受講生に届く本文は LMS の `docs/steering/content-authoring.md` に従う。詳細は `.claude/rules/writing.md` を参照。
>
> 本プロジェクトは 2 種類の学習コンテンツを生成する:
>
> 1. **教材**（Part > Chapter > Section + 紐づき演習問題）— `curriculums/kihonjoho/` 配下に `.md` + `.questions.yaml`
> 2. **模試**（資格直下のフラットな問題セット）— `mock-exams/kihonjoho/` 配下に `.yaml`

## ペルソナ（WHO）

主対象は、Web 開発のフロントエンド（HTML / CSS / JavaScript）からバックエンド（PHP / Laravel）まで一通り学び、ある程度のアプリケーション実装経験を持つ受講生です。コードは書けるようになったが、その裏でコンピュータがどう動いているのか、なぜ TCP/IP の上で HTTP が動くのか、データベースのインデックスがなぜ速いのか、暗号化アルゴリズムが何をしているのか、といった「理論的な背景」は学んでこなかった層です。

基本情報技術者試験の合格を目指しているものの、市販の参考書は IT 未経験者か情報系学生をターゲットにしており、「Web アプリを実装したことがある」受講生にとっては前提が合わず、暗記学習に飽きてしまうという課題を抱えています。

> 内部メモ: 本教材は COACHTECH の受講生（模擬案件で Web アプリを実装した経験を持つ Pro 生）を念頭に置いて設計しています。ただし上記の固有名詞・社内用語は **教材本文に絶対に出さない**。本文では「Web 開発経験のあるあなた」のように一般化して書きます。

### 前提知識

- **プログラミング**: HTML、CSS、JavaScript（変数、関数、配列、オブジェクト、DOM 操作）、PHP（変数、配列、連想配列、関数、クラス）、Laravel（ルーティング、コントローラ、Eloquent、Blade）
- **データベース**: MySQL でテーブル作成・SELECT / INSERT / UPDATE / DELETE / JOIN を書いた経験
- **Web の仕組み**: クライアントとサーバの違い、リクエスト / レスポンス、HTTP メソッド（GET / POST）の使い分け
- **開発環境**: ターミナル基本操作、Git の add / commit / push / pull、Docker Compose で開発環境を立ち上げた経験
- **未学習の領域**: 2 進数や論理回路、コンピュータ・アーキテクチャ、OS のプロセス / メモリ管理、TCP/IP のレイヤ構造、暗号化アルゴリズムの仕組み、ソフトウェア開発プロセス（ウォーターフォール、アジャイル）

### 技術スタック

- **教材形式**: YAML フロントマター + Markdown（暗記教材）。ハンズオン環境は不要。コードは「実装の裏側を説明するための引用」として登場するが、写経や環境構築は求めない
- **模試形式**: 1 模試 = 1 YAML ファイル。資格直下のフラットな問題セット（教材階層に属さない）
- **配信先**: **Certify LMS**（マルチ資格対応の B2B 教育 SaaS）の `student`（受講生）ロール向けに配信される
  - **教材**: LMS の `basic_learning`（基礎ターム）で Part → Chapter → Section の階層で表示
  - **模試**: LMS の `mock_practice`（実践ターム）でカタログ表示、時間制限 + 一括採点 + 弱点ヒートマップ
- **取り込み**:
  - 教材: `ContentMarkdownSeeder` が `database/seeders/contents/kihonjoho/` を walk し、Part / Chapter / Section / SectionQuestion / SectionQuestionOption を INSERT
  - 模試: `MockExamYamlSeeder` が `database/seeders/mock-exams/kihonjoho/` を walk し、MockExam / MockExamQuestion / MockExamQuestionOption を INSERT
  - 教材と模試は **同じ QuestionCategory マスタを共有** する（弱点ヒートマップでカテゴリ別正答率を集計するため）
- **デザインシステム**: LMS 標準の **Tropical Emerald** テーマに整合する執筆スタイル（静かに熱いトーン、絵文字非使用、感嘆符 `!` 非使用、数値を主役にする表現）に従う
- **試験対象**: 基本情報技術者試験（FE）科目A（旧午前試験）。2026 年 5 月時点の最新シラバスに準拠
- **試験範囲**: テクノロジ系のみ。マネジメント系（プロジェクトマネジメント・サービスマネジメント）、ストラテジ系（システム戦略・経営戦略・企業と法務）、科目B（アルゴリズム擬似言語・情報セキュリティ実践問題）は対象外
- **言語**: 説明・例題は日本語。試験用語は IPA シラバスの表記に準拠

## コンセプト（WHY）

市販の基本情報技術者試験対策本は IT 未経験者か情報系学生をターゲットにしており、「Web アプリを実装した経験がある」受講生にとっては前提と切り口が合いません。実装からスタートした学習者は、コンピュータ・サイエンスの理論を「コードのこの動作の理由」として読み解けるはずなのに、市販教材はその強みを活かせていません。

この教材は、受講生が Web 開発で書いてきたコード（Laravel の Eloquent、JavaScript の非同期処理、SQL の JOIN、HTTP リクエストなど）を入口にして、その裏側の CS 理論に接続します。暗記ではなく「腑に落ちる理解」を目指し、同時に試験合格に必要な用語と数値はしっかり押さえます。受講生が試験に合格するだけでなく、その後のキャリアで CS 基礎を武器にできる状態を作ることが本教材の存在意義です。

特に重視するのは次の 3 点です。

- **実装からの逆引き**: 「あなたが書いた `SELECT ... JOIN` がなぜ遅くなることがあるのか」を入口に、インデックスと B 木の理論を解説する。理論先行ではなく、実装の疑問先行で構成する
- **試験頻出と実務頻出の二軸**: 試験に出るが実務でほぼ使わない用語（例: 古いハードウェア仕様）はコンパクトに、試験にも実務にも出る用語（例: TCP/IP、HTTPS、トランザクション）は厚く扱う
- **暗記の足場**: 各 Section の本文末尾に「要点」（試験頻出キーワード）を、別ファイル `.questions.yaml` に「演習問題」（過去問風の選択式問題）を配置し、本文で理解した内容を試験形式で定着させる

## ゴール（WHAT）

修了後、受講生は以下のことができる状態になります。

1. **試験対応**: 基本情報技術者試験 科目A のテクノロジ系問題（試験全体の約 60% を占める領域）に対応できる
2. **理論と実装の接続**: 自分が書いた SQL・HTTP リクエスト・JavaScript の実行が、コンピュータの中でどのレイヤをどう経由しているか説明できる
3. **実務判断**: DB のインデックス設計、HTTP / HTTPS の選択、認証方式の選択、ファイル形式の選択など、Web 実務で頻出する技術選定について理論的根拠を持って判断できる
4. **用語の体系化**: テクノロジ系全領域（基礎理論 / アルゴリズム / コンピュータシステム / 技術要素 / 開発技術）の頻出用語を、IPA シラバスの分類に沿って体系的に説明できる

ゴール 1（試験対応）が最優先、ゴール 2〜3（実装接続・実務判断）が並列で次点、ゴール 4（用語体系化）は 1〜3 の結果として達成される位置づけです。

## カリキュラム（HOW）

### 教材（Part > Chapter > Section）

**階層構造**: 3 層（Part > Chapter > Section）+ Section 紐づき演習問題

IPA の基本情報技術者試験シラバス（テクノロジ系）の大分類・中分類に準拠しつつ、読者の実務頻度を踏まえて Chapter のボリュームを調整しています。

| Part | テーマ | Chapter 数 | 重点 |
|---|---|---|---|
| 1. 基礎理論 | 2 進数、論理演算、離散数学、確率統計、情報理論 | 3 | 試験頻出。実装経験者が苦手な領域 |
| 2. アルゴリズムとプログラミング | データ構造、アルゴリズム、プログラム言語 | 3 | 実装経験者の強みを活かせる領域 |
| 3. コンピュータシステム | プロセッサ、メモリ、システム構成、性能評価、OS、ミドルウェア、ハードウェア | 6 | 試験頻出。実装の裏側として接続 |
| 4. ヒューマンインタフェース・マルチメディア | UI 設計、画像 / 音声 / 動画の形式 | 2 | 試験出題比率が低めなのでコンパクトに |
| 5. データベース | RDB 設計、正規化、SQL、トランザクション、応用（NoSQL・ビッグデータ） | 5 | 試験 + 実務の両方で頻出 |
| 6. ネットワーク | OSI 参照モデル、TCP/IP、プロトコル、無線、ネットワーク応用 | 4 | 試験 + 実務の両方で頻出 |
| 7. 情報セキュリティ | 基礎、暗号、認証、攻撃手法、対策と管理 | 5 | 試験 + 実務の両方で頻出。最重点領域 |
| 8. 開発技術 | システム開発技術、ソフトウェア開発管理技術 | 2 | 試験出題はあるが実装経験者には馴染みのある内容 |

合計 30 Chapter / 95 Section、各 Section に 2〜3 問の紐づき演習問題（合計 約 230 問）。

### 模試（資格直下フラット）

教材とは独立した問題セット。難易度と問題数を段階的に上げて配置し、`basic_learning` の進捗に応じて受験タイミングを設計する。問題は Section 紐づき演習問題と **完全に独立** させる（重複なし）。

| 模試 | 問題数 | 想定タイミング | 狙い |
|---|---|---|---|
| 01-基本情報模試 第1回（基礎力チェック） | 10 問 | Part 1〜2 学習後 | 動作確認・初回受験のハードル低減・基礎理解度の早期把握 |
| 02-基本情報模試 第2回（実力測定） | 30 問 | 全 Part 一周後 | 中間チェック・弱点カテゴリの把握 |
| 03-基本情報模試 直前演習 | 60 問 | 試験本番直前 | 量と時間（90 分相当）への慣れ・最終仕上げ |

模試は合計 100 問。`passing_score` は試験本番の合格基準（60 点）に揃える。

各層の設計詳細は `OUTLINE.md` を参照。

CLAUDE.md は教材の哲学（WHO / WHY / WHAT / HOW）を定義し、`OUTLINE.md` はその哲学を具体的な設計に落とし込みます。執筆上の判断（題材の選択・構成のアレンジ・外部調査）は `OUTLINE.md` の設計に従いつつ、臨機応変に行ってください。

## プロジェクトマップ（MAP）

執筆ルールは `.claude/rules/writing.md` を参照。LMS デザインシステムとの整合性ガイド（語彙・トーン・絵文字・数値表記）と LMS 規約（フロントマター・命名・ファイル分離・category マスタ）も `writing.md` に統合済み。

### 配信先と取り込みフロー

- **Certify LMS**: マルチ資格対応 B2B 教育 SaaS（Laravel 10 + Blade + Tailwind CSS）
- **対象ロール**: 受講生（`student`）
- **配信タイミング**:
  - **教材**: 受講生が「基本情報技術者試験」資格に登録した後の `basic_learning`（基礎ターム）フェーズ。Part → Chapter → Section の階層で読み進める
  - **模試**: 初回 mock-exam セッション開始で自動的に `mock_practice`（実践ターム）に切り替わる。模試カタログから受験を開始
- **取り込みフロー（教材）**:
  1. 本リポジトリの `curriculums/kihonjoho/` 配下に Part / Chapter / Section / `.questions.yaml` / `_meta.yaml` を執筆
  2. 完成後、LMS リポジトリの `模範解答プロジェクト/database/seeders/contents/kihonjoho/` にコピー
  3. LMS 側で `sail artisan migrate:fresh --seed`（または `db:seed --class=ContentMarkdownSeeder`）を実行
  4. `ContentMarkdownSeeder` がディレクトリを walk し、`_meta.yaml` とフロントマターを読んで Part / Chapter / Section / SectionQuestion / SectionQuestionOption を INSERT
- **取り込みフロー（模試）**:
  1. 本リポジトリの `mock-exams/kihonjoho/` 配下に `NN-模試タイトル.yaml` を執筆（資格 `_meta.yaml` は不要）
  2. 完成後、LMS リポジトリの `模範解答プロジェクト/database/seeders/mock-exams/kihonjoho/` にコピー
  3. 同じく `sail artisan migrate:fresh --seed`（または `db:seed --class=MockExamYamlSeeder`）
  4. `MockExamYamlSeeder` が YAML ファイルを walk し、`certification` フィールドで資格を resolve、MockExam / MockExamQuestion / MockExamQuestionOption を INSERT
- **前提**: `category` マスタ（QuestionCategory）が LMS 側 `CertificationSeeder` で先に登録されている必要がある（後述）。**教材と模試は同じカテゴリマスタを共有する**

### 演習問題 + 模試の category マスタ

LMS の `QuestionCategory` マスタは資格ごとに事前登録が必要。**Section 紐づき演習問題と模試は同じマスタを共有** する。本教材は **IPA シラバスの中分類 13 個** を category として使う。

| category 名 | 担当する Section（Chapter 単位） |
|---|---|
| 基礎理論 | Chapter 1-1, 1-2, 1-3 |
| アルゴリズムとプログラミング | Chapter 2-1, 2-2, 2-3 |
| コンピュータ構成要素 | Chapter 3-1, 3-2 |
| システム構成要素 | Chapter 3-3 |
| ソフトウェア | Chapter 3-4, 3-5 |
| ハードウェア | Chapter 3-6 |
| ヒューマンインタフェース | Chapter 4-1 |
| マルチメディア | Chapter 4-2 |
| データベース | Chapter 5-1, 5-2, 5-3, 5-4, 5-5 |
| ネットワーク | Chapter 6-1, 6-2, 6-3, 6-4 |
| 情報セキュリティ | Chapter 7-1, 7-2, 7-3, 7-4, 7-5 |
| システム開発技術 | Chapter 8-1 |
| ソフトウェア開発管理技術 | Chapter 8-2 |

LMS 側で `CertificationSeeder` に上記 13 カテゴリを `QuestionCategory::factory()->forCertification($kihonjoho)` で先に登録する必要がある。教材納品時にこの一覧を実装側に伝えること。

### 参考資料

- **IPA 公式シラバス**: 基本情報技術者試験シラバス（最新版）。試験範囲と用語の正準
- **過去問道場（基本情報技術者試験）**: 過去問の参照。各 Section 紐づきの `.questions.yaml` の難易度・出題傾向の参考に使用
- **書籍**: キタミ式イラスト IT 塾 基本情報技術者、徹底攻略 基本情報技術者教科書 などの定番書籍を内容の網羅性チェックに使用
- **公式 RFC / W3C / IETF 仕様**: ネットワーク・セキュリティ領域でプロトコル詳細を確認する際に参照
- **LMS 側の規約**: `/Users/yotaro/ExampleAnswer-mockcase-CertifyLMS/docs/steering/content-authoring.md`（教材執筆規約の正準）

> 注意: シラバス・出題傾向は数年ごとに改訂されます。執筆時点で最新版を参照し、`/check-updates` で定期的に更新差分をチェックしてください。

### Skills

| Skill | 用途 |
|---|---|
| `/setup` | 初期設定（CLAUDE.md・OUTLINE.md・writing.md の作成） |
| `/write` | 執筆（任意の階層単位） |
| `/review` | レビュー（品質・整合性チェック） |
| `/check-updates` | IPA シラバス・関連仕様との鮮度チェック |
| `/illustrate` | Gemini Pro による概念図の生成・挿入（メモリ階層、ネットワークレイヤ、暗号化フローなど） |

### フォルダ構造・命名規則

LMS の `docs/steering/content-authoring.md` に準拠。

```text
project-root/
├── CLAUDE.md                       # 教材の哲学（WHO/WHY/WHAT/HOW/MAP）
├── OUTLINE.md                      # カリキュラム + 模試設計
├── .claude/
│   ├── rules/writing.md            # 執筆ルール
│   ├── skills/                     # Skill 定義
│   └── settings.json
├── curriculums/                    # 教材本体（→ LMS の database/seeders/contents/ にコピー）
│   └── kihonjoho/                  # 資格スラッグ（英小文字 + ハイフン）
│       ├── _meta.yaml              # certification: "基本情報技術者試験"
│       ├── 01-第1部 基礎理論/      # Part フォルダ（NN-第N部 タイトル）
│       │   ├── _meta.yaml          # status: published / description: "..."
│       │   ├── 01-第1章 離散数学/  # Chapter フォルダ（NN-第N章 タイトル）
│       │   │   ├── _meta.yaml      # status: published
│       │   │   ├── 01-2進数とn進数.md                 # Section 本文
│       │   │   ├── 01-2進数とn進数.questions.yaml     # 紐づき演習問題
│       │   │   └── ...
│       │   └── 02-第2章 応用数学/
│       │       └── ...
│       └── ...
├── mock-exams/                     # 模試本体（→ LMS の database/seeders/mock-exams/ にコピー）
│   └── kihonjoho/                  # 教材と同じ資格スラッグ（_meta.yaml は不要）
│       ├── 01-基本情報模試 第1回.yaml     # 10 問・基礎力チェック
│       ├── 02-基本情報模試 第2回.yaml     # 30 問・実力測定
│       └── 03-基本情報模試 直前演習.yaml  # 60 問・直前仕上げ
└── assets/                         # 画像（教材外で管理。LMS では SectionImage 経由）
```

**命名規則の要点**:

教材:

- **資格スラッグ**: 英小文字 + ハイフン。基本情報技術者試験は `kihonjoho`
- **Part / Chapter フォルダ**: `NN-第N部 タイトル` または `NN-第N章 タイトル`（NN は 2 桁ゼロ埋め、ハイフン直後に半角スペース 1 つ）
- **Section ファイル**: `NN-タイトル.md`（NN は 2 桁ゼロ埋め、ハイフン直後に半角スペースなし）
- **演習問題ファイル**: `NN-タイトル.questions.yaml`（Markdown とベース名を共有）

模試:

- **資格スラッグ**: 教材と同じスラッグ（`kihonjoho`）を使う（教材と模試の対応を視覚的に保つ）
- **模試ファイル**: `NN-模試タイトル.yaml`（NN が `mock_exams.order`、残部分が `mock_exams.title`）
- **資格 `_meta.yaml` は不要**: 資格は YAML 内の `certification:` フィールドで指定

共通:

- **タイトル内の英数字**: フォルダ名内ではスペース許可、ファイル名内では半角スペースを入れない（例: 「2 進数と n 進数」→ ファイル名 `01-2進数とn進数.md`）
- **2 桁ゼロ埋め必須**: 辞書順で `10-` が `2-` より先に来てしまう問題を回避
- **画像**: 教材本文内に Markdown image 構文を直書きしても良いが、画像ファイル本体は LMS 側で `SectionImage` モデル経由でアップロード。初稿では `<!-- TODO: 画像追加 - ○○の概念図 -->` でプレースホルダーを残す
