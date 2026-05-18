# 執筆ルール

本コンテンツは **Certify LMS** 内で配信される。LMS 側の **教材・模試 執筆規約**（`/Users/yotaro/ExampleAnswer-mockcase-CertifyLMS/docs/steering/content-authoring.md`）と **Tropical Emerald デザインシステム**（静かに熱いトーン、絵文字非使用）に整合するコンテンツとして執筆する。

本プロジェクトでは 2 種類のコンテンツを生成する:

1. **教材**: Part > Chapter > Section + Section 紐づき演習問題（`curriculums/kihonjoho/`）→ LMS の `ContentMarkdownSeeder` で取り込み
2. **模試**: 資格直下のフラットな問題セット（`mock-exams/kihonjoho/`）→ LMS の `MockExamYamlSeeder` で取り込み

ファイル形式・命名・スキーマは LMS 規約に厳密に従う必要がある（Seeder が制約違反で即 `RuntimeException` を投げる）。

---

## 1. ファイル形式とディレクトリ構造

### ディレクトリ構造

**教材**:

```text
curriculums/kihonjoho/                                # 資格スラッグ
├── _meta.yaml                                       # certification: "基本情報技術者試験"
├── 01-第1部 基礎理論/                                # Part フォルダ: NN-第N部 タイトル
│   ├── _meta.yaml                                   # status / description / published_at
│   ├── 01-第1章 離散数学/                            # Chapter フォルダ: NN-第N章 タイトル
│   │   ├── _meta.yaml                               # status / published_at
│   │   ├── 01-2進数とn進数.md                        # Section 本文
│   │   ├── 01-2進数とn進数.questions.yaml            # 演習問題（配列）
│   │   └── ...
```

**模試**:

```text
mock-exams/kihonjoho/                                # 教材と同じ資格スラッグ（_meta.yaml は不要）
├── 01-基本情報模試 第1回.yaml                       # 10 問
├── 02-基本情報模試 第2回.yaml                       # 30 問
└── 03-基本情報模試 直前演習.yaml                    # 60 問
```

### ファイル命名規則

| 種類 | 形式 | 例 |
|---|---|---|
| 資格スラッグ | 英小文字 + ハイフン | `kihonjoho` |
| Part フォルダ | `NN-第N部 タイトル`（ハイフン直後に半角スペース 1 つ） | `01-第1部 基礎理論` |
| Chapter フォルダ | `NN-第N章 タイトル`（ハイフン直後に半角スペース 1 つ） | `01-第1章 離散数学` |
| Section 本文 | `NN-タイトル.md`（ハイフン直後に半角スペースなし） | `01-2進数とn進数.md` |
| 演習問題 | `NN-タイトル.questions.yaml`（本文と同じベース名） | `01-2進数とn進数.questions.yaml` |
| 模試 | `NN-模試タイトル.yaml`（NN が `mock_exams.order`、残部分が `title`） | `01-基本情報模試 第1回.yaml` |

**NN は必ず 2 桁ゼロ埋め**（辞書順で `10-` が `2-` より先に来てしまう問題を回避）。

**ファイル名のタイトル部分**:

- OUTLINE のタイトルから **半角英数字前後の半角スペースを削除**（例: 「2 進数と n 進数」→ `2進数とn進数`）
- 区切り記号「/」は「と」に置換（例: 「IPv4 / IPv6」→ `IPv4とIPv6`）
- 「（）」などの括弧、長すぎる修飾語は削る

### 各階層の `_meta.yaml`

**資格ルート `kihonjoho/_meta.yaml`**:

```yaml
certification: "基本情報技術者試験"
```

`CertificationSeeder` で作成した `Certification.name` と **完全一致** が必須。

**Part `_meta.yaml`**:

```yaml
status: published                # draft / published（default: draft）
description: "進数 / 論理演算 / 確率統計 / 情報理論を学ぶ"   # 任意。Part カードのサブタイトル
published_at: 2026-05-01         # 任意
```

**Chapter `_meta.yaml`**:

```yaml
status: published
published_at: 2026-05-01         # 任意
```

Chapter は `description` カラムを持たないので不要。

**cascade visibility**: Part が draft だと配下 Chapter / Section / 演習問題がすべて publish 済でも非公開扱いになる。執筆中は `draft` で運用し、完成後に `published` へ切り替える。

### Section 本文ファイルのスキーマ

**形式**: YAML フロントマター + Markdown 本文

```markdown
---
status: published
description: "進数変換と補数表現の基礎を学ぶ"   # 任意。Section 詳細画面のサブタイトル
published_at: 2026-05-01                       # 任意
---

## このセクションで学ぶこと

- ...
```

**フロントマターのフィールド**:

| キー | 必須/任意 | 説明 |
|---|---|---|
| `status` | 任意（default: draft） | `draft` / `published` |
| `description` | 任意 | Section の short description。詳細画面のサブタイトル |
| `published_at` | 任意 | 公開日時。省略時、`status: published` なら自動で `now()` |

**`title` は書かない**（ファイル名 `NN-タイトル.md` から自動抽出される）。

**重要**: 本文は **`#` 見出し（H1）を使わない**。**`##`（H2）から開始** する。タイトルはファイル名で表現済み。

### 演習問題 `.questions.yaml` のスキーマ

**形式**: 配列。1 要素 = 1 演習問題。

```yaml
- body: "10 進数 25 を 2 進数で表現するとどれか"
  category: "基礎理論"
  status: published
  explanation: |
    25 = 16 + 8 + 1 = 2^4 + 2^3 + 2^0
    したがって 2 進数表現は 11001 になります。
  options:
    - { body: "10011", correct: false }
    - { body: "11001", correct: true }
    - { body: "10101", correct: false }
    - { body: "11010", correct: false }

- body: "16 進数 0xFF を 10 進数で表現するとどれか"
  category: "基礎理論"
  status: published
  explanation: |
    0xFF = 15 × 16 + 15 = 240 + 15 = 255
  options:
    - { body: "255", correct: true }
    - { body: "256", correct: false }
    - { body: "127", correct: false }
    - { body: "128", correct: false }
```

**フィールド**:

| キー | 必須/任意 | 説明 |
|---|---|---|
| `body` | 必須 | 問題本文（プレーンテキスト）。改行を含めたい場合は YAML の `\|` を使う |
| `category` | 必須 | `QuestionCategory.name` と完全一致する文字列。本教材では IPA シラバス中分類 13 個のいずれか。`OUTLINE.md` の各 Chapter ヘッダの `category` フィールドを参照 |
| `status` | 任意（default: draft） | `draft` / `published` |
| `explanation` | 任意 | 結果画面で表示される解説。YAML の `\|` で改行保持 |
| `options` | 必須 | 選択肢配列。最低 2 件、推奨 4 件。`correct: true` は必ず 1 つだけ |

**制約**:

- `options` の `correct: true` は **必ず 1 つだけ**（単一正答モデル）
- `options` 件数 < 2 は不可
- `category` が QuestionCategory マスタに無いと `ContentMarkdownSeeder` が `RuntimeException` で落ちる
- `body` が空文字は不可

**問題数の目安**:

- 重い領域（暗号化、TCP/IP、SQL、トランザクション、Web 攻撃等）は **3 問**
- 軽い領域（マルチメディア応用、UI 設計等）は **2 問**
- 各 Section に 2〜3 問を必ず作成（演習問題ファイルが無い Section は作らない方針）

**並び順**: YAML 配列のインデックス = 表示順。

### 模試 YAML のスキーマ

**形式**: オブジェクト（教材の `.questions.yaml` の配列形式とは異なる）。1 ファイル = 1 模試。

```yaml
certification: "基本情報技術者試験"
description: "基本情報技術者試験の基礎力を 10 問で測る軽量模試。Part 1〜2 の学習直後に。"
status: published                # default: draft (DB の is_published に変換される)
passing_score: 60                # 0-100 の整数 (default: 60)
published_at: 2026-05-01         # 任意

questions:
  - body: "10 進数 25 を 2 進数で表現するとどれか"
    category: "基礎理論"
    explanation: |
      25 = 16 + 8 + 1 = 2^4 + 2^3 + 2^0
      したがって 2 進数表現は 11001 になります。
    options:
      - { body: "10011", correct: false }
      - { body: "11001", correct: true }
      - { body: "10101", correct: false }
      - { body: "11010", correct: false }

  - body: "...次の問題..."
    category: "..."
    explanation: "..."
    options: [...]
```

**トップレベルフィールド**:

| キー | 必須/任意 | 説明 |
|---|---|---|
| `certification` | 必須 | `Certification.name` と完全一致。教材 `_meta.yaml` と同じ規則 |
| `description` | 任意 | 模試カタログ / 受験前画面に表示される説明文 |
| `status` | 任意（default: draft） | `draft` / `published`（Seeder が `is_published: bool` に変換） |
| `passing_score` | 任意（default: 60） | 0-100 の整数。受験結果画面の合否判定基準 |
| `published_at` | 任意 | 公開日時。省略時、`status: published` なら自動で `now()` |
| `questions` | 必須 | 問題配列（最低 1 問）。要素スキーマは下記 |

**`title` はファイル名から自動抽出**: YAML 内に `title:` を書かない。ファイル `01-基本情報模試 第1回.yaml` → `MockExam.title = "基本情報模試 第1回"`、`order = 1`。

**`questions[]` 要素のスキーマ**:

| キー | 必須/任意 | 説明 |
|---|---|---|
| `body` | 必須 | 問題本文。プレーンテキスト or 軽い inline 記号。改行は YAML の `\|` |
| `category` | 必須 | `QuestionCategory.name` と完全一致。**教材の演習問題と同じマスタを共有** |
| `explanation` | 任意 | 結果画面で表示される解説。`\|` で改行保持 |
| `options` | 必須 | 選択肢配列。最低 2 件、推奨 4 件。`correct: true` は **必ず 1 つだけ** |

**教材の `.questions.yaml` との差分**:

| 項目 | 教材（Section 紐づき） | 模試 |
|---|---|---|
| ファイル形式 | 配列（`- body: ...` のフラット） | オブジェクト（`certification:` + `questions:` 配列） |
| 紐づき | 教材階層（Part / Chapter / Section） | 資格直下（フラット） |
| `status` のキー | `status: published` → DB の `status` カラム | `status: published` → DB の `is_published: bool` |
| cascade visibility | 親 Part が draft なら配下も非公開 | 単独で完結（階層なし） |
| `passing_score` | なし | あり（必須に近い） |

**問題の独立性ルール**:

模試の問題は **Section 紐づき演習問題と重複しない** こと。同じ概念を題材にしても、出題視点を変える:

| Section 紐づき演習 | 模試 |
|---|---|
| 単体トピックの基本理解確認（例: 「2 進数 11001 を 10 進数で表すとどれか」） | 応用・複合・事例型（例: 「1 バイト符号付き整数 -5 を 2 の補数で表現するとどれか」） |
| 概念定義の確認 | 概念の応用や使い分けの判断 |
| 計算手順の習熟 | 計算結果から元の値を逆算する問題 |

**並び順**:

- `MockExam.order` = ファイル名の `NN`
- `MockExamQuestion.order` = `questions` 配列のインデックス（0 始まり）
- `MockExamQuestionOption.order` = `options` 配列のインデックス（0 始まり）

**制約**（違反時は `MockExamYamlSeeder` が `RuntimeException`）:

- `certification` が `CertificationSeeder` で作成済の `name` と一致
- `questions[].category` が `QuestionCategory` マスタに存在
- `options` の `correct: true` が **ちょうど 1 つ**（0 個 or 2 個以上はエラー）
- `options` 件数 ≥ 2
- `passing_score` が 0-100 の整数
- `questions` 件数 ≥ 1（空の模試は登録不可）

---

## 2. 文体

### トーン

- **本文**: 落ち着いた敬体で丁寧に解説する。過度に個人的な語りかけ（「率直に言うと」等）は避ける
- **声と熱量**: 静かに熱い。「!」（感嘆符）は使わない。励ましは進捗の可視化と要点の明確さで伝える
- **実装経験者の目線**: Web 実装経験を起点に概念を立ち上げる。導入の見出しで「実装経験者が現場で出会う疑問」を提示し、本文で CS 理論として回収する

### 用語・表記

- 敬体（です・ます調）で統一。読者への呼びかけは「あなた」
- ダッシュ記号（`——`、`—`、`–`）は使わない
- 感嘆符 `!` は使わない
- 基本情報技術者試験の用語は **IPA 公式シラバス** の表記に従う
- 時間経過で変わる情報（最新規格、暗号アルゴリズムの推奨状況、攻撃手法のトレンド等）は最新情報を取得し「○○時点」と日付を明記
- 外部ソースを参照する場合は出典を明記する
- `**太字**` は語句・キーフレーズに限定する。文全体を太字にしない
- Markdown の `**text**` は閉じ `**` 直後にスペースなしで日本語が続くと適用されない。`**○○** の場合` のようにスペースを入れる。全角括弧 `（` も同様: `**○○**（補足）` → `**○○** （補足）`

### 数値・英数字の表記

LMS デザインシステムの「英数字との混植」ルールに従う。

| パターン | ルール | 例 |
|---|---|---|
| 半角英数字の前後 | 半角スペースを入れる | `2 進数を 16 進数に変換`、`HTTP リクエスト` |
| 数値 + 日本語単位 | 半角結合（スペースなし） | `78%`、`23日`、`8桁` |
| 数値 + 英単位 | 半角スペース | `120 min`、`80 questions`、`100 Mbps` |
| 固有名詞 | 半角 | Certify LMS、Heroicons、TCP/IP |

### 用語テーブル

| 表記 | 備考 |
|---|---|
| セクション | 教材本文ではカタカナ表記 |
| 基本情報技術者試験 / FE 試験 | 初出時は正式名称、2 回目以降は省略可 |
| 科目A / 科目B | IPA 公式表記。「午前 / 午後」とは書かない |
| IPA | 独立行政法人情報処理推進機構。初出時のみフルネーム |
| テクノロジ系 / マネジメント系 / ストラテジ系 | IPA シラバスの大分類区分 |
| OSI 参照モデル | 「OSI モデル」とは書かない |
| TCP/IP | スラッシュは半角。「TCP-IP」「TCP IP」とは書かない |
| 2 進数 / 16 進数 | 数字とカタカナの間に半角スペース |
| データベース / DB | 初出時は「データベース」、以後は文脈に応じて「DB」も使用可 |
| 共通鍵暗号 / 公開鍵暗号 | IPA シラバス表記。「対称鍵 / 非対称鍵」とは書かない |
| 模擬試験 / 問題演習 | 教材本文ではこちら（日本語表記）を主に使う。LMS の機能名を指す場合のみ `mock-exam` / `quiz` を併記 |
| 受講生 | LMS のロール名。「ユーザー」「お客様」は使わない |

### NG ワード

LMS の `docs/steering/content-authoring.md` の「禁止される露出」と LMS デザインシステムの NG ワードに準拠する。教材本文（`.md` / `.questions.yaml`）の `body` / `description` / `explanation` で **絶対に使わない**。

#### 構築側メタ語（最重要）

| 避ける | 代わりに | 理由 |
|---|---|---|
| COACHTECH | （削除、または「Web 開発の経験」のように一般化） | スクール名は受講生視点では構築側メタ語 |
| 模擬案件 / Pro 生 / mock-case | （削除、または「実装プロジェクト」「Web 開発」） | スクール内部用語 |
| Step N / Phase X / v3 改修 / P1-X | （削除、または「最新仕様で」等の自然語） | 構築側の改修フェーズ用語 |
| 2026-05-XX 等の作業日付 | （削除、必要なら「○○年○月時点」） | 内部スケジュール情報 |
| `[[feature-name]]` wikilink | （削除、または通常リンク） | 構築側ドキュメントの記法 |
| `docs/specs/` 等のパス | （削除） | 構築側ファイルパス |

#### DB スキーマ用語

| 避ける | 代わりに | 理由 |
|---|---|---|
| `section_questions` / `SectionQuestionAnswer` 等のテーブル名・モデル名 | 「演習問題」「解答履歴」 | 内部実装の用語 |
| `granted_by_user_id` 等のカラム名 | 業務用語へ言い換え | 内部実装の用語 |

#### Enum 機械値

| 避ける | 代わりに | 理由 |
|---|---|---|
| `admin_grant` / `learning` / `passed` 等の snake_case | `Enum->label()` 相当の日本語表記（「管理者承認」「学習中」「合格」） | 機械値は UI 露出禁止 |

#### LMS デザインシステムの NG ワード

| 避ける | 代わりに | 理由 |
|---|---|---|
| お客様 / お客さま | あなた / 受講生 | 距離が遠く B2B 教育に合わない |
| ユーザー（UI 表示として） | 受講生 / コーチ / 管理者 | 内部用語 |
| コース | 資格 / 教材 / Section | 資格取得 LMS に「コース」概念はない |
| テスト（曖昧用法） | 模擬試験 / 問題演習 / テスト工程 | Part 8 の「テスト技法」など試験用語としてのテストは可 |
| すごい / やったね | 達成しました / 突破しました | テンション過剰 |

### 絵文字

**本教材は絵文字を使用しない**。LMS デザインシステムが「UI コア機能では絵文字を使わない」と定めており、教材本文もこれに準拠する。

絵文字の代わりに、見出し（`##`）・blockquote（`>`）・太字（`**`）・順序付きリストなど **Markdown 標準の構造要素** で読み手の注意を導く。

唯一の例外は、教材内に登場する **コード片** に含まれる絵文字（例: SQL コメント、ログ出力サンプル）。それ以外の本文・見出し・リスト・blockquote では使わない。

---

## 3. Section 本文の構造

### Section の種類

本教材は読み物形式の暗記教材のため、全 Section が **概念** 種類で構成される。

### 見出しの設計

**Why → What → How**（抽象→具体）の流れで組む。導入見出しは実装経験者の疑問から立ち上げる（例: 「あなたが書いた SQL、なぜインデックスがあると速くなるのか」「Eloquent の `where` が遅いとき、内部で何が起きているのか」）。

### Section 本文テンプレート

```markdown
---
status: published
description: "[Section の概要を 1 行で]"
published_at: 2026-05-XX
---

> 前提知識: このセクションは [前提 Section のタイトル] の内容を前提とします。
> （前提がない場合はこの行を省略）

## このセクションで学ぶこと

- 学習目標1
- 学習目標2
- 学習目標3

[1 文で Section の流れを示す導入文]

---

## [導入の見出し: 実装経験者の疑問を提示]

[Web 実装経験者が現場で出会う具体的な課題・疑問・困りごとから立ち上げる本文]

---

## [概念解説の見出し 1]

[本文]

## [概念解説の見出し 2]

[本文]

<!-- 必要に応じて続く -->

> よくある誤解: [試験で引っかかりやすいポイントや、実装経験者が誤解しがちな概念を簡潔に補足]

---

## 要点

- 試験頻出キーワードと定義
- 暗記すべき数値・比較表
- 実装と理論の接続点（試験対策と実務の両方で価値があるもの）

---

次のセクションでは、[次の内容への接続]。
```

**演習問題は本文ファイルに書かない**。同名の `.questions.yaml` ファイルに切り出す（後述）。

### グループ全体像（Chapter 先頭 Section）

各 Chapter の最初の Section では、フロントマターの直後・`## このセクションで学ぶこと` の前に Chapter 全体像を含める。構成:

1. 概要文（1〜2 文）
2. セクション一覧テーブル（セクション / テーマ / 試験頻出度）
3. 「**この Chapter の進め方**: [学習の流れ]」を太字で記述

### 「次セクションへの接続」のルール

- プレーンテキストで記述する（Markdown リンクやカギ括弧は使わない）
- **次セクションへの接続文** は、OUTLINE.md の次セクションのゴールに含まれるキーワードを漏れなく含める
- **Chapter 最終セクション**: Chapter の学びの振り返り + 次の Chapter への橋渡し
- **Part 最終セクション**: 上記に加え、Part 全体の振り返り + 次の Part への橋渡し
- **教材全体の最終セクション**: 教材全体の締め括り文を記述する（学んだことの振り返り + 試験合格に向けた次のステップへの示唆）

### blockquote の用法

絵文字を使わない代わりに、blockquote（`>`）を限定的に使う。

| 用途 | プレフィックス | 例 |
|---|---|---|
| 前提知識の明示 | `> 前提知識:` | `> 前提知識: このセクションは 1-1-1 の内容を前提とします。` |
| 補足・TIP | `> 補足:` | `> 補足: 現場では Eloquent の where が...` |
| 試験での注意 | `> よくある誤解:` または `> 注意:` | `> よくある誤解: ハッシュ関数は暗号化ではない` |
| エラー例示 | `> エラー例:` | `> エラー例: ERROR 1062: Duplicate entry` |

blockquote はセクション単位で多用しない（1 Section に 2〜3 個まで）。

---

## 4. コンテンツの深さと表現

### コードの見せ方

本教材は読み物形式だが、概念を説明する際にコード片を引用する（SQL、PHP、JavaScript、HTML、シェルコマンド、擬似コード等）。

- コードブロック上部にファイルパスをコメントで明示する。実在ファイルではない例示の場合は `// 例:` または `# 例:` と書く。コメント構文は言語タグに合わせる:
  - `typescript` / `javascript` / `php`: `// 例: PHP コード`
  - `tsx` / `jsx`: `{/* 例: コンポーネント */}`
  - `yaml` / `dockerfile` / `bash`: `# 例: シェルコマンド`
  - `css`: `/* 例: スタイル */`
  - `sql`: `-- 例: 売上集計クエリ`
  - `python`: `# 例: ハフマン符号化`
- コードブロックには必ず言語を指定する。本教材で頻繁に使う言語タグ:
  - `sql`、`php`、`javascript`、`html`、`bash`、`yaml`、`json`、`python`
  - 擬似コード・出力例・ディレクトリツリー・コマンド出力・図解・ネットワークパケット構造は `text` を使用する
- diff 表示は使わない（テキストで説明し変更後のコードを示す）
- **参考資料のコードを引用する場合は正確性を最優先する**。コードを簡略化して掲載する場合は、コードブロックの直前に「以下は主要部分の抜粋です」と明記し、省略した重要な処理を本文で補足する
- LMS の Markdown レンダラ（league/commonmark）はハイライト未対応だが、言語タグは将来のハイライト対応のために必ず付ける

### 解説の深さ

- OUTLINE.md に前提（`前提:` フィールド）が記載されている場合、フロントマター直後に `> 前提知識: このセクションは ○○ の内容を前提とします。` を blockquote で明記する
- 前提知識は基本説明を省略。ただし基本情報技術者試験の文脈で組み合わせたときの注意点は丁寧に
- 試験固有の概念は初出時に丁寧に解説し、2 回目以降は初出 Section への参照を本文中で示す（例: 「正規化の詳細は 5-2-2 で扱います」）
- 同じ概念を別の箇所で繰り返さない
- 導入は「これがないと何が困るか」（実装経験者の課題）から入る
- 処理の流れやサイクルは **Mermaid** で視覚化する:
  - フローチャート: TCP の 3way ハンドシェイク、トランザクションの ACID 動作
  - シーケンス図: HTTP リクエスト/レスポンス、OAuth 認可フロー
  - 状態遷移図: プロセスの状態（実行・待機・終了）
  - クラス図: UML のオブジェクト指向設計
- メンタルモデル系の図（CPU 内部構造のメタファ、ネットワークレイヤの建物比喩等）は `/illustrate` で AI 画像生成
- 未説明の用語をツリーやリストに含める場合は、簡潔なコメントか後続セクションへの参照を付ける
- 試験で引っかかりやすいポイント（似た用語の混同、計算式の符号ミス等）は `> よくある誤解:` で先回りして説明する
- 先の Section で扱う内容は「今は概要だけ把握すれば十分です」と明記する
- 概念図は `/illustrate` を使って後から挿入する。初稿では `<!-- TODO: 画像追加 - ○○の概念図 -->` でプレースホルダーを残す
- Section あたりの目安文字数: **最低 3,500 文字、目安 5,000 文字、上限 7,000 文字**。暗記教材としての読みやすさを保ちつつ、要点を含むため一定のボリュームが必要

### 演習問題（Section 紐づき）の作問ルール

各 Section に対応する `.questions.yaml` に 2〜3 問の選択式問題を配置する。

- 問題は IPA 公式サンプル問題・過去問道場の頻出パターンを参考にする（直接の転載は避け、本教材の流れに沿うようにアレンジする）
- 選択肢は **4 つ**。正解は問ごとにランダムに分散させる（`correct: true` の位置を 1 問目はイ、2 問目はア、3 問目はエ、のように偏らせない）
- `explanation` では「なぜ正解か」だけでなく「なぜ他の選択肢が違うか」も書く
- `category` は `OUTLINE.md` の各 Chapter ヘッダで指定された IPA シラバス中分類名を使う（13 カテゴリのいずれか）
- 重い領域（暗号化、TCP/IP、SQL、トランザクション、Web 攻撃等）は 3 問
- 軽い領域（マルチメディア応用、UI 設計等）は 2 問
- 数式・計算問題は `body` に含めて良いが、改行が必要なら YAML の `|` ブロックスカラを使う
- `body` には Markdown を書かない（プレーンテキスト or 軽い inline HTML 程度）

### 模試の作問ルール

3 本の模試（10 / 30 / 60 問）の作問は、`OUTLINE.md` の「模擬試験（Mock Exams）」セクションで定めたカテゴリ配分と難易度に従う。

**配分とタイミング**:

| 模試 | 問題数 | タイミング | 難易度 | カバー範囲 |
|---|---|---|---|---|
| 01-基本情報模試 第1回 | 10 問 | Part 1〜2 学習後 | ★☆☆ 基本中心 | 5 カテゴリ |
| 02-基本情報模試 第2回 | 30 問 | 全 Part 一周後 | ★★☆ 標準 | 11 カテゴリ |
| 03-基本情報模試 直前演習 | 60 問 | 試験本番直前 | ★★★ 試験準拠 | 13 カテゴリすべて |

**独立性の徹底**:

- Section 紐づき演習問題と **完全に独立** した問題を作成する（重複なし）
- 同じ概念を題材にしても、出題視点・問い方を変える
- 演習: 単体トピックの基本理解 / 模試: 応用・複合・事例型

**難易度のグラデーション**:

- 模試 01（★☆☆）: 基本的な定義確認・短い計算問題。教材本文を理解していれば解ける
- 模試 02（★★☆）: 標準。基本問題 7 割 + 応用問題 3 割。複数概念の関係を問う問題を一部含む
- 模試 03（★★★）: 試験本番準拠。基本 5 割 + 応用 4 割 + 複合（複数カテゴリにまたがる）/ 事例型 1 割

**共通ルール**（教材の演習問題と同じ）:

- 選択肢は 4 つ、`correct: true` は 1 問につき 1 つだけ
- 正解の位置をランダム分散（ア・イ・ウ・エが均等に正解になるように）
- `explanation` で「なぜ正解か + なぜ他選択肢が違うか」を解説
- `body` は Markdown 不可（プレーンテキスト中心）
- 計算問題は擬似コードや式を `body` 内にプレーンテキストで含めて良い

**模試固有のメタ情報**:

- `description`: 受験前画面に表示される説明文。模試の狙い・難易度・想定タイミングを 1〜2 文で
- `passing_score: 60`（試験本番準拠で全模試共通）
- `status: published`（執筆完了時）

### Mermaid 図のガイドライン

- 1 つの図に詰め込みすぎない。ノードが 10 個を超える場合は分割する
- 日本語のラベルは `"日本語ラベル"` のようにダブルクオートで囲む
- 配色は Mermaid のデフォルトを使う（テーマ依存の指定は避ける）
- フローチャートの向きは原則 `TD`（上→下）または `LR`（左→右）。複雑なフローでは `LR` を優先

### 数値・コードの正確性

- 公式仕様（RFC・W3C・ISO/IEC 等）から数値や仕様を引用する場合は、必ず最新版で裏取りをする
- 試験問題に使う数値・桁数・正答率は IPA 公式の表記と一致させる
- 計算問題の `body` で示す数値は、本文の説明と整合しているかを確認してから掲載する

---

## 5. 取り込み確認

執筆完了後、LMS リポジトリにコピーして取り込み確認する。

```bash
# 1. 教材と模試を LMS にコピー
cp -r curriculums/kihonjoho /path/to/CertifyLMS/模範解答プロジェクト/database/seeders/contents/
cp -r mock-exams/kihonjoho /path/to/CertifyLMS/模範解答プロジェクト/database/seeders/mock-exams/

# 2. LMS で取り込み
cd /path/to/CertifyLMS/模範解答プロジェクト
sail artisan migrate:fresh --seed

# 3. レコード数の確認
sail artisan tinker --execute='
echo "Parts: " . \App\Models\Part::count() . PHP_EOL;
echo "Chapters: " . \App\Models\Chapter::count() . PHP_EOL;
echo "Sections: " . \App\Models\Section::count() . PHP_EOL;
echo "SectionQuestions: " . \App\Models\SectionQuestion::count() . PHP_EOL;
echo "MockExams: " . \App\Models\MockExam::count() . PHP_EOL;
echo "MockExamQuestions: " . \App\Models\MockExamQuestion::count() . PHP_EOL;
'

# 期待値: Parts=8 / Chapters=30 / Sections=95 / SectionQuestions=約230 / MockExams=3 / MockExamQuestions=100
```

**よくあるエラー（教材）**:

| 症状 | 原因 | 対処 |
|---|---|---|
| `Certification not found: "..."` | `_meta.yaml` の `certification` が CertificationSeeder の `name` と不一致 | name を完全一致させる（全角半角・スペースに注意） |
| `QuestionCategory not found: "..."` | `.questions.yaml` の `category` が QuestionCategory マスタに無い | LMS 側で `CertificationSeeder` にカテゴリを先に登録 |
| `Single correct option required, got N` | `options` の `correct: true` が 0 個 or 2 個以上 | 必ず 1 つだけにする |
| Section 本文が Markdown レンダリングされない | フロントマターの YAML 構文エラー | `status: published` 等のコロン後にスペースがあるか確認 |
| 表示順がおかしい | フォルダ / ファイル名の `NN-` が桁数不揃い | 全ファイル名を 2 桁ゼロ埋め（`01-` `02-` ...）に統一 |
| 教材が一切表示されない | Part / Chapter / Section のいずれかが draft 状態 | cascade visibility に注意 |

**よくあるエラー（模試固有）**:

| 症状 | 原因 | 対処 |
|---|---|---|
| `passing_score must be 0-100` | `passing_score: 150` 等の範囲外 | 0-100 の整数に修正 |
| 模試カタログに表示されない | `status: draft` または `is_published: false` | `status: published` に変更 |
| `questions must not be empty` | `questions: []` または `questions:` のみ | 最低 1 問は記述する |
| 模試の問題が教材と紐づいて表示される | 構造上発生しない（模試 = MockExam モデル、教材 = SectionQuestion モデル） | DB 設計上独立しているため、UI 側の問題として実装側に報告 |
