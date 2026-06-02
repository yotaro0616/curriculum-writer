# OUTLINE — Laravel 経験者のための Java / Spring Boot バックエンド開発

CLAUDE.md の哲学（WHO / WHY / WHAT / HOW）を、Part > Chapter > Section の具体設計に落とし込んだもの。執筆（/write）はこの設計に従いつつ、臨機応変に判断する。

## 設計方針

- **階層構造**: 3層（Part > Chapter > Section）。全 5 Part。
- **背骨**: 全 Section で Laravel / PHP との対比を織り込む（`Laravel 対比` フィールド）。読者の既習を足がかりに Java の具体へ接続する。
- **省略しない**: 読者の Java 知識はゼロ。基本文法を含め Java の具体は省略せず解説する。既習の「概念」は再入門しないが、Java での記法・型・作法・差異は必ず扱う。
- **種類**: Part 1〜4 は原則「概念」。Part 5（総合ハンズオン）は「ハンズオン」。各 Part / Chapter の先頭 Section は「グループ全体像」を含む（writing.md 準拠）。
- **Why → What → How**: 各技術はこの順で解説。Part / Chapter 冒頭で全体像（地図）を先に示す。
- **参考資料**: 一次情報（公式ドキュメント）を優先。下記「主要参考資料」を Section ごとに紐付ける。時間で変わる情報・バージョンは /write 時に再確認する。
- **バージョン方針（案件接続）**: Java は **17 で通用する書き方を基本**とし、21 専用機能（仮想スレッド・switch パターンマッチング・record パターン等）を使う場合は明示する（record・Optional・Stream は 17 で利用可なので通常どおり使う）。`var` など旧 LTS（8 / 11）との差分は要所で**差分コラム**を添える。Spring Boot は **4.0.x をメイン**にしつつ、現場遭遇率の高い **3.x への読み替え**（Jackson 2・設定差など）と **2.x→3.x の javax→jakarta 移行**を差分コラムで補足する。

### 種類の凡例

| 種類 | 内容 |
|---|---|
| 概念 | 意義・仕組み・使い方を解説（コード例は示すが手を動かす手順は持たない） |
| ハンズオン | 概念 Section で学んだ機能を実践。冒頭に概念 Section への逆リンク |
| 混合 | 概念を学びながらすぐ手を動かす |

### 主要参考資料（共通）

| 領域 | 一次情報 |
|---|---|
| Java 言語 | [dev.java — Learn](https://dev.java/learn/) / [Java SE 21 Documentation](https://docs.oracle.com/en/java/javase/21/) |
| Spring Boot | [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html) |
| Spring Core（IoC / DI） | [Spring Framework — Core Technologies](https://docs.spring.io/spring-framework/reference/core.html) / [The IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html) |
| Spring Web MVC | [Spring Framework — Web on Servlet Stack](https://docs.spring.io/spring-framework/reference/web/webmvc.html) |
| バリデーション | [Spring — Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html) |
| Spring Data JPA | [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/index.html) / [Hibernate ORM](https://hibernate.org/orm/documentation/) |
| Spring Security | [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html) |
| ビルド | [Maven — Getting Started](https://maven.apache.org/guides/getting-started/index.html) |
| テスト | [JUnit User Guide](https://docs.junit.org/current/user-guide/) / [Mockito](https://site.mockito.org/) / [Spring Boot — Testing](https://docs.spring.io/spring-boot/reference/testing/index.html) |

> ⚠️ JUnit は 2026年6月時点で 5 系と 6 系が併存（Jupiter のプログラミングモデルはほぼ同一。6 系は Java 17 ベースライン）。本教材では Spring Boot 4 の BOM が管理するバージョンに準拠する（4.0 系では JUnit Jupiter 6.0.x / Mockito 5.20.x）。/write 時に依存ツリーで実バージョンを確認すること。
>
> ⚠️ Spring Boot 4 は JSON 処理を Jackson 2 から **Jackson 3** へ移行している。型（`ObjectMapper`・databind 等）の import は `tools.jackson` へ移動したが、**アノテーション（`@JsonProperty` 等）は後方互換のため `com.fasterxml.jackson` のまま**である。3-3-2（DTO と JSON）の /write 時はこの import 混在を明示しないと学習者が詰まる。また Jackson 3 では例外の親が `IOException`（検査例外）から `RuntimeException`（非検査例外）へ変わったため、1-3-2（検査例外／非検査例外）との整合にも注意。Jackson 3 を前提とし、Jackson 2 前提の古い記事をそのまま引かないこと。
>
> ⚠️ Spring Boot 4 は Spring Security **7 系** を引き込む。認証・認可（4-1）の /write 時は 7.x の API・Lambda DSL 表記（`authorizeHttpRequests(...)` / `oauth2ResourceServer(...)` 等）に合わせ、6.x 以前の DSL を引いた古い記事をそのまま使わないこと。

### カリキュラム全体像

| Part | テーマ | Chapter 数 | Section 数 | 種類 |
|---|---|---|---|---|
| Part 1 | Java 言語の基礎 | 3 | 8 | 概念 |
| Part 2 | オブジェクト指向と現代的な Java | 4 | 9 | 概念 |
| Part 3 | Spring Boot で REST API を作る | 5 | 13 | 概念 |
| Part 4 | 実務に耐える品質をつくる | 3 | 6 | 概念 |
| Part 5 | 総合ハンズオン（タスク管理 REST API） | 3 | 9 | ハンズオン |

学習の流れ: **言語に慣れる（P1）→ オブジェクト指向で設計する（P2）→ Spring で API を組む（P3）→ 品質を備える（P4）→ ゼロから作る（P5）**。

---

## Part 1: Java 言語の基礎

→ ゴール: ゼロから Java を「読み書きできる」状態にする。静的型付けという発想転換を軸に、基本文法を省略せず身につける。

### Chapter 1-1: オリエンテーションと Java という言語（3 Section）

**ゴール**: 本教材の歩き方と Java という言語の正体（静的型付け・JVM）をつかみ、Laravel の知識がどう対応するかの全体マップを得る。

- **1-1-1 なぜ Java / Spring Boot を学ぶのか**
  - 種類: 概念（教材全体・Part 1 のグループ先頭。教材全体像と Laravel 対応マップを含む）
  - ゴール: 本教材の目的・歩き方を理解し、Laravel の知識が Java / Spring Boot にどう対応するかの全体マップをつかむ。AI 活用前提・概念主軸・対比という学び方を理解する
  - 前提: なし
  - 参考資料: [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html)
  - Laravel 対比: 「Laravel でできたことは Java でもできる」を対応表で俯瞰し、安心して学び始められるようにする
- **1-1-2 Java という言語の正体**
  - 種類: 概念
  - ゴール: 静的型付け・コンパイル・JVM・実行モデルを理解し、PHP（動的型付け・インタプリタ）との根本的な違いを説明できる
  - 前提: [1-1-1]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP は実行時に型が決まり即実行。Java は書いた時点で型が決まり、コンパイルを経て動く
- **1-1-3 Java プロジェクトの形**
  - 種類: 概念
  - ゴール: パッケージ・クラス・`main` メソッド・Maven プロジェクトの構造を理解し、Java のコードがどの単位で構成されるかを把握する。あわせて、以降の Part 1 のコード例がすべて宿る最小スケルトン（`public class X { public static void main(String[] args) { ... } }`）の読み方を確立する（実際の環境構築は Part 5）
  - 前提: [1-1-2]
  - 参考資料: [Maven — Getting Started](https://maven.apache.org/guides/getting-started/index.html)
  - Laravel 対比: Composer / artisan・PSR オートロードと、Maven・パッケージ構成の対応。PHP のクラス（既習）を土台に「Java のコードはすべてクラスの中に書く」ことを確認する
  - 注記: スケルトンに現れる各キーワードはここでは「型紙」として提示し、本格的な解説は後続に委ねる（メソッドと `static` → 1-2-3、アクセス修飾子 `public` 等 → 2-1-2、クラス本体の定義 → 2-1-1）。Part 1 各 Section のコード例はこのスケルトンを前提に書き、未習キーワードには「今は型紙として捉えれば十分」と一言添えて前方参照する

### Chapter 1-2: 基本文法（3 Section）

**ゴール**: 変数・型・制御構文・メソッド・配列・文字列を Java の文法で読み書きできる。

- **1-2-1 変数と型**
  - 種類: 概念
  - ゴール: 変数宣言・プリミティブ型・参照型・`var` による型推論を理解し、型を意識して変数を扱える
  - 前提: [1-1-2]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP の `$x = ...`（型自由）に対し、Java は型を伴う宣言。緩い型変換が起きない
- **1-2-2 演算子と制御構文**
  - 種類: 概念
  - ゴール: 演算子・条件分岐（`if` / `switch` 式）・繰り返し（`for` / 拡張 `for` / `while`）を Java の文法で書ける
  - 前提: [1-2-1]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP の `foreach` と Java の拡張 `for`、`switch` の違い
- **1-2-3 メソッドと配列・文字列**
  - 種類: 概念
  - ゴール: メソッド定義（シグネチャ・戻り値型・オーバーロード・`static`）、配列、`String`（不変性）を理解し使える
  - 前提: [1-2-2]
  - 参考資料: [Java SE 21 Documentation](https://docs.oracle.com/en/java/javase/21/)
  - Laravel 対比: PHP の関数（型任意・可変長）と Java のメソッド（型必須・オーバーロード）の違い

### Chapter 1-3: コレクションと例外処理（2 Section）

**ゴール**: 複数データの保持（コレクション）とエラーの扱い（例外）を Java の流儀で書ける。

- **1-3-1 コレクション**
  - 種類: 概念
  - ゴール: `List` / `Map` / `Set` とジェネリクスの基本的な使い方を理解し、用途に応じて選べる（定義側のジェネリクスは 2-4-2 で扱う）
  - 前提: [1-2-3]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP の配列は「リストも連想配列も兼ねる」。Java では `List` と `Map` に明確に分かれ、要素の型も指定する
- **1-3-2 例外処理**
  - 種類: 概念
  - ゴール: 例外・`try` / `catch` / `finally`・検査例外と非検査例外・`throw` を理解し、エラーを型として扱える
  - 前提: [1-2-3]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP の例外との共通点と、Java 固有の「検査例外」という考え方

---

## Part 2: オブジェクト指向と現代的な Java

→ ゴール: 本格的なオブジェクト指向（継承・インターフェース・ポリモーフィズム）を習得し、Spring を理解する設計の土台をつくる。読者の最大のギャップを丁寧に埋める。

### Chapter 2-1: クラスとカプセル化（2 Section）

**ゴール**: Java のクラスを型・アクセス修飾子とともに設計でき、なぜ実装を隠すのかを説明できる。

- **2-1-1 クラスとインスタンス**
  - 種類: 概念（Part 2 のグループ先頭。OOP 全体像を含む）
  - ゴール: クラス・フィールド・メソッド・コンストラクタ・`this` を Java の文法で定義でき、PHP の基礎 OOP との差を説明できる
  - 前提: [1-2-3]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP のクラス（既習）を土台に、型付きフィールド・コンストラクタの書き方の違いへ接続
- **2-1-2 カプセル化とアクセス修飾子**
  - 種類: 概念
  - ゴール: `private` / `protected` / `public`・getter / setter・`static` メンバーを理解し、なぜ実装を隠すのかを説明できる
  - 前提: [2-1-1]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: CT では `public` 中心だった。設計に効くアクセス修飾子の使い分けを新たに学ぶ

### Chapter 2-2: 継承と抽象クラス（2 Section）

**ゴール**: 継承と抽象クラスを理解し、共通化と骨組みの設計ができる（未習概念のため丁寧に）。

- **2-2-1 継承**
  - 種類: 概念
  - ゴール: `extends`・`super`・オーバーライド・`Object` クラス（`equals` / `hashCode` / `toString` の契約）・`@Override` を理解し、継承で共通化できる
  - 前提: [2-1-2]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: Eloquent モデルが `extends Model` していた意味を、継承の理解で腑に落とす
  - 注記: `equals` / `hashCode` の契約はここを正式な学習場所とする（`Set` / `Map` のキー [1-3-1] と JPA エンティティ [3-4-1] の前提になる定番のつまずき所）。深入りはせず契約と既定実装の意味に絞り、`record` による自動生成は 2-4-1 で接続する
- **2-2-2 抽象クラス**
  - 種類: 概念
  - ゴール: `abstract` クラス / メソッドを理解し、共通の骨組みを定義して具象クラスに実装させる設計ができる
  - 前提: [2-2-1]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: 基底コントローラ等の「共通の型」を抽象クラスの観点で捉え直す

### Chapter 2-3: インターフェースとポリモーフィズム（2 Section）

**ゴール**: インターフェースと多態性を理解し、実装を差し替えられる設計の利点を説明できる（DI の必須前提）。

- **2-3-1 インターフェース**
  - 種類: 概念
  - ゴール: `interface`・`implements`・「契約としての型」・デフォルトメソッドを理解し、実装と分離した型を定義できる
  - 前提: [2-2-2]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: Laravel の Contracts（インターフェース）を、自分で定義・実装する立場から理解する
- **2-3-2 ポリモーフィズム**
  - 種類: 概念
  - ゴール: 多態性を理解し、インターフェース型で実装を差し替えられる設計の利点を説明できる。Spring が interface 中心である理由（DI の布石）をつかむ
  - 前提: [2-3-1]
  - 参考資料: [The IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
  - Laravel 対比: サービスコンテナで実装を差し替えられた仕組みの根っこ＝ポリモーフィズム

### Chapter 2-4: 現代的な Java（3 Section）

**ゴール**: record・enum・ジェネリクス・Optional・Stream を理解し、簡潔で型安全なコードを書ける。

- **2-4-1 record と enum**
  - 種類: 概念
  - ゴール: `record`（不変データ・DTO 向き）と `enum` を理解し、データを表す型を簡潔に定義できる
  - 前提: [2-1-2]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: 値オブジェクト的な扱い・PHP enum との対応
- **2-4-2 ジェネリクスの定義**
  - 種類: 概念
  - ゴール: 型パラメータを理解し、型安全なクラス / メソッドを定義できる。コレクションが内部でどう型を守るかを説明できる
  - 前提: [2-3-1, 1-3-1]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: PHP には無い静的な型安全。`Repository<User>` のような後続の型表現の土台
- **2-4-3 Optional とラムダ・Stream 入門**
  - 種類: 概念
  - ゴール: `Optional`（null 安全）・関数型インターフェース・ラムダ・`Stream` の基本を理解し、コレクションを宣言的に扱える
  - 前提: [2-4-2]
  - 参考資料: [dev.java — Learn](https://dev.java/learn/)
  - Laravel 対比: Eloquent コレクションの `map` / `filter` と Stream の対応
  - 注記: 1 Section に Optional・関数型インターフェース・ラムダ・`Stream` の 4 トピックが乗る、Part 2 で最も密度の高い Section。分割はせず（Chapter / Section 数は据え置く）、各トピックを入門スコープに絞って深追いしない。記述順は ラムダ → 関数型インターフェース → `Stream`（宣言的なコレクション操作）→ `Optional`（null 安全の締め）を推奨。`Stream` は `map` / `filter` / `collect` 程度に留め、収集器の詳細や並列化は扱わない

---

## Part 3: Spring Boot で REST API を作る

→ ゴール: Spring Boot で REST API の縦串（Web 層からデータ層まで）を体系的に組めるようになる。DI コンテナの理解が核心。

### Chapter 3-1: Spring Boot 入門（3 Section）

**ゴール**: Spring Boot が何を自動化しているかを俯瞰し、プロジェクトを構成・起動・設定できる。

- **3-1-1 Spring と Spring Boot の世界**
  - 種類: 概念（Part 3 のグループ先頭。Spring 全体像を含む）
  - ゴール: Spring エコシステム・Spring Boot の役割・スターター・オートコンフィギュレーション・「規約より設定」を理解し、Spring Boot が何を自動化しているかを俯瞰できる
  - 前提: [2-3-2]
  - 参考資料: [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html)
  - Laravel 対比: Laravel の「規約」と初期構成のありがたみを、Spring Boot のオートコンフィグに対応づける
- **3-1-2 Maven とプロジェクトの構成**
  - 種類: 概念
  - ゴール: `pom.xml`・依存管理・ビルドライフサイクル・標準プロジェクト構造を理解し、依存をどう追加するか説明できる
  - 前提: [3-1-1, 1-1-3]
  - 参考資料: [Maven — Getting Started](https://maven.apache.org/guides/getting-started/index.html)
  - Laravel 対比: Composer（`composer.json`）と Maven（`pom.xml`）、artisan と Maven ゴールの対応
- **3-1-3 アプリケーションの起動と設定**
  - 種類: 概念
  - ゴール: `@SpringBootApplication`・組み込みサーバ・`application.yml`・プロファイルを理解し、設定値の与え方を説明できる
  - 前提: [3-1-2]
  - 参考資料: [Spring Boot — Core Features](https://docs.spring.io/spring-boot/reference/features/index.html)
  - Laravel 対比: `.env` / config と `application.yml` / プロファイルの対応

### Chapter 3-2: DI コンテナとレイヤードアーキテクチャ（2 Section）

**ゴール**: DI コンテナの仕組みを「魔法を解く」形で理解し、層に責務を分けた設計ができる。

- **3-2-1 IoC と DI コンテナ**
  - 種類: 概念
  - ゴール: IoC・DI・Bean・`ApplicationContext`・コンポーネントスキャン・`@Component` 系・コンストラクタインジェクションを理解し、「なぜ動くのか」を説明できる（本教材の核心）
  - 前提: [2-3-2]
  - 参考資料: [The IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
  - Laravel 対比: サービスコンテナ・ファサードの「魔法」を、DI コンテナの明示的な仕組みとして解き明かす
- **3-2-2 レイヤードアーキテクチャ**
  - 種類: 概念
  - ゴール: Controller / Service / Repository の責務分離・`@Service` / `@Repository`・依存の方向を理解し、層をまたぐ設計ができる
  - 前提: [3-2-1]
  - 参考資料: [Spring Framework — Core Technologies](https://docs.spring.io/spring-framework/reference/core.html)
  - Laravel 対比: Laravel の Controller / Model 構成を、Service を挟んだ層構造へ発展させる

### Chapter 3-3: Web 層と REST API の実装（3 Section）

**ゴール**: リクエストの受け取りから JSON 応答・バリデーション・エラー設計まで、Web 層を一通り組める。

- **3-3-1 リクエストを受けて返す**
  - 種類: 概念
  - ゴール: `@RestController`・`@GetMapping` 等・`@PathVariable` / `@RequestParam` / `@RequestBody`・`ResponseEntity`・ステータスコードを理解し、エンドポイントを設計できる
  - 前提: [3-2-2]
  - 参考資料: [Spring — Web on Servlet Stack](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
  - Laravel 対比: ルーティング・コントローラ・HTTP メソッドの対応（既習の REST 原則をそのまま活用）
- **3-3-2 DTO と JSON**
  - 種類: 概念
  - ゴール: DTO・Jackson によるシリアライズ・`record` DTO・リクエスト / レスポンスの分離・エンティティ ↔ DTO の変換を理解し、API の入出力を設計できる
  - 前提: [3-3-1, 2-4-1]
  - 参考資料: [Spring Boot — Web](https://docs.spring.io/spring-boot/reference/web/index.html)
  - Laravel 対比: API リソース / フォームと DTO の対応。エンティティを直接返さない理由（エンティティ ＝ あなたが知る Eloquent モデルに相当する DB マップ対象クラス、と類推で接続する）
  - 注記: エンティティ ↔ DTO の変換は手動マッピングを基本とし、MapStruct 等のライブラリは紹介に留める
  - 注記: この Section の時点で JPA の `@Entity`（実体は 3-4-1 で解説）はまだ未習。「エンティティを直接返さない理由」「エンティティ ↔ DTO 変換」は Eloquent モデルの類推で概念を先に立て、Java での作り方は 3-4-1 へ前方参照する（記述例もこの前提で書く）
- **3-3-3 バリデーションと例外ハンドリング**
  - 種類: 概念
  - ゴール: Bean Validation・`@Valid`・`@RestControllerAdvice` による統一エラーレスポンスを理解し、入力検証とエラー設計ができる
  - 前提: [3-3-2]
  - 参考資料: [Spring — Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
  - Laravel 対比: FormRequest・例外ハンドラと、`@Valid`・`@RestControllerAdvice` の対応
  - 注記: ここでは `@RestControllerAdvice` で統一エラーレスポンスを「作る仕組み」を扱う。例外の分類・設計指針やログとの連携は 4-3-1 で扱う（重複させない）

### Chapter 3-4: データアクセス層と Spring Data JPA（3 Section）

**ゴール**: エンティティ・リレーション・リポジトリ・トランザクションを理解し、データ層を Eloquent の知識を足がかりに組める。

- **3-4-1 エンティティとマッピング**
  - 種類: 概念
  - ゴール: `@Entity`・`@Id`・`@GeneratedValue`・カラムマッピング（`LocalDateTime` 等の日付・時刻型を含む）・JPA / Hibernate の役割を理解し、テーブルとクラスを対応づけられる
  - 前提: [3-2-2]
  - 参考資料: [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/index.html)
  - Laravel 対比: Eloquent モデル / マイグレーションと、エンティティ / スキーマ管理の対応
  - 注記: エンティティの `equals` / `hashCode` は定番の罠（自動採番 ID で実装すると永続化前後で同一性が崩れる）。契約自体は 2-2-1 で学習済みの前提とし、ここではエンティティ特有の注意を ⚠️ で短く添える（深入りはしない）
- **3-4-2 リレーションとリポジトリ**
  - 種類: 概念
  - ゴール: `@OneToMany` / `@ManyToOne` / `@ManyToMany`・`JpaRepository`・派生クエリ・`@Query`（JPQL）・`Pageable` によるページネーション / ソートを理解し、関連を含むデータ操作ができる
  - 前提: [3-4-1]
  - 参考資料: [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/index.html)
  - Laravel 対比: `hasMany` / `belongsTo` / `belongsToMany` と JPA のアノテーション、クエリビルダと派生クエリ、`paginate()` と `Pageable` / `Page`
- **3-4-3 トランザクションと N+1**
  - 種類: 概念
  - ゴール: `@Transactional`・遅延 / 即時フェッチ・N+1 問題と対策（fetch join）を理解し、性能と整合性に配慮できる（トランザクションは未習概念として丁寧に）
  - 前提: [3-4-2]
  - 参考資料: [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/index.html)
  - Laravel 対比: `with()` による N+1 対策は既習。トランザクションは新規概念として導入

### Chapter 3-5: サーバーサイドレンダリング入門（Spring MVC + Thymeleaf）（2 Section）

**ゴール**: Spring Boot は JSON だけでなく画面（HTML）も返せることを理解し、Spring MVC + Thymeleaf で最小のサーバーサイドレンダリングを組める。業務系・SIer 案件で多い画面描画型の構成に備える。

- **3-5-1 画面を返す Spring MVC**
  - 種類: 概念
  - ゴール: `@Controller`（`@RestController` との違い）・ビュー解決・`Model` でのデータ受け渡しを理解し、「JSON を返す API」と「HTML 画面を返す MVC」の違いを説明できる
  - 前提: [3-3-1]
  - 参考資料: [Spring — Web on Servlet Stack](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
  - Laravel 対比: コントローラが view を返す Laravel（`return view(...)`）と、`@Controller` + `Model` + テンプレートの対応。`@RestController` は「戻り値を常に JSON 化する `@Controller`」だと位置づける
- **3-5-2 Thymeleaf テンプレートの基本**
  - 種類: 概念
  - ゴール: Thymeleaf の式・変数展開・繰り返し / 条件・フラグメント（レイアウト）を理解し、`Model` で渡したデータを画面に描画できる
  - 前提: [3-5-1]
  - 参考資料: [Thymeleaf Documentation](https://www.thymeleaf.org/documentation.html)
  - Laravel 対比: Blade（`{{ }}`・`@foreach`・`@if`・`@extends`）と Thymeleaf（`th:text`・`th:each`・`th:if`・フラグメント）の対応

---

## Part 4: 実務に耐える品質をつくる

→ ゴール: API の縦串に、現場で即必要になる品質（認証・テスト・運用）を備え、企業に通用する形にする。

### Chapter 4-1: 認証と認可（2 Section）

**ゴール**: Spring Security の仕組みを理解し、トークンベース認証と認可を組める。

- **4-1-1 Spring Security の仕組み**
  - 種類: 概念（Part 4 のグループ先頭。品質 3 領域の全体像を含む）
  - ゴール: フィルタチェーン・認証 / 認可・`SecurityFilterChain`・パスワードハッシュを理解し、Spring Security が何を守っているか説明できる
  - 前提: [3-3-1]
  - 参考資料: [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
  - Laravel 対比: ミドルウェア・認証・ポリシーと、フィルタチェーン・認証 / 認可の対応
- **4-1-2 認証の実装と JWT 入門**
  - 種類: 概念
  - ゴール: `UserDetails`・認証フロー・JWT（ステートレス認証）の考え方を理解し、トークンベース認証の流れを説明できる
  - 前提: [4-1-1]
  - 参考資料: [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
  - Laravel 対比: セッション認証（Fortify） / Sanctum と、JWT によるステートレス認証の違い
  - 注記: 本題材は自前でログイン→トークン発行する構成のため、第一候補は Nimbus（`spring-security-oauth2-jose` の `NimbusJwtEncoder` / `NimbusJwtDecoder`。Spring Security が内部採用する公式ライブラリで、発行・検証とも Spring 標準で完結する）。代替として `jjwt`（Spring 非依存・API が直感的・現役）を併記してよい。`spring-security-oauth2-resource-server` は外部 IdP が発行したトークンの検証側であり本題材とは用途が異なる。最終選定は /write 時に確定し、入門レベルに収めて SecurityFilterChain の DSL とトークン検証の流れの理解を優先する

### Chapter 4-2: テスト（2 Section）

**ゴール**: 層に応じたテスト（単体・Web・統合）を選び、API の振る舞いを保証できる。

- **4-2-1 単体テスト**
  - 種類: 概念
  - ゴール: JUnit（Jupiter）・アサーション・Mockito によるモックを理解し、Service の単体テストを書ける
  - 前提: [3-2-2]
  - 参考資料: [JUnit User Guide](https://docs.junit.org/current/user-guide/) / [Mockito](https://site.mockito.org/)
  - Laravel 対比: PHPUnit の単体テストと JUnit の対応、モックの考え方
- **4-2-2 Spring のテスト**
  - 種類: 概念
  - ゴール: `@WebMvcTest` / `MockMvc`（Controller）・`@DataJpaTest`（Repository）・`@SpringBootTest`（統合）を理解し、層に応じたテストを選べる（Spring Boot 4 で新設の `RestTestClient` も選択肢として一言触れる）
  - 前提: [4-2-1, 3-3-1, 3-4-2]
  - 参考資料: [Spring Boot — Testing](https://docs.spring.io/spring-boot/reference/testing/index.html)
  - Laravel 対比: Feature テスト・`actingAs` と、`MockMvc`・`@SpringBootTest` の対応
  - 注記: Spring Boot 4 ではモック Bean のアノテーションが変わっている。`@MockBean` / `@SpyBean`（`spring-boot-test` 由来）は Spring Framework 6.2 / Spring Boot 3.4 で非推奨化され、`@MockitoBean` / `@MockitoSpyBean`（`spring-test` 由来）へ置き換わった。4.0 系では `@MockitoBean` を使う（世の中の記事は `@MockBean` が多いので注意）。実際の提供状況は /write 時に依存ツリーで確認する

### Chapter 4-3: 運用の土台（2 Section）

**ゴール**: 例外設計・ログ・設定の外部化・パッケージングを理解し、環境ごとに動かせる形にできる。

- **4-3-1 例外設計とログ**
  - 種類: 概念
  - ゴール: 例外設計の指針（例外の分類・どこで処理するか）・SLF4J / Logback・ログレベルを理解し、運用に耐える例外とログを設計できる
  - 前提: [3-3-3]
  - 参考資料: [Spring Boot — Core Features](https://docs.spring.io/spring-boot/reference/features/index.html)
  - Laravel 対比: Laravel のログ・例外ハンドラと、SLF4J / Logback・例外設計の対応
  - 注記: 3-3-3 で実装した `@RestControllerAdvice` による統一エラーレスポンスの仕組みを前提に、ここでは例外の分類・設計指針とログ連携に踏み込む（仕組みの再説明はしない）
- **4-3-2 設定の外部化とパッケージング**
  - 種類: 概念
  - ゴール: プロファイル・環境変数・シークレットの扱い・Docker パッケージング（Buildpacks / Dockerfile）を理解し、環境ごとに動かせる形にできる
  - 前提: [3-1-3]
  - 参考資料: [Spring Boot — Container Images](https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html)
  - Laravel 対比: `.env` / Sail（Docker）と、プロファイル / Buildpacks の対応

---

## Part 5: 総合ハンズオン（タスク管理 REST API）

→ ゴール: Part 1〜4 の全知識を統合し、認証付きタスク管理 REST API をゼロから設計・実装・テストする。AI（Claude Code）活用を前提に進める。

題材は CT 最終課題（タスク管理アプリ）と同系統とし、「Laravel で作ったものを Java で作り直す」感覚で対比を最大化する。

### 実践プロジェクトの設計

**題材**: 認証付きタスク管理 REST API。エンティティは ユーザー / タスク / タグ（タスクとタグは多対多）。

**使用機能マップ**（各機能が依拠する概念 Section）:

| 機能 | 主に使う概念 Section |
|---|---|
| プロジェクト初期化・設定 | 3-1-1〜3-1-3 |
| エンティティ・リレーション・Repository | 3-4-1, 3-4-2, 2-1-1 |
| Service（ビジネスロジック） | 3-2-2, 2-3-1, 2-3-2 |
| Controller・DTO・バリデーション・例外 | 3-3-1〜3-3-3, 2-4-1 |
| トランザクション・N+1 対策 | 3-4-3 |
| 認証・認可（JWT） | 4-1-1, 4-1-2 |
| テスト | 4-2-1, 4-2-2 |
| ログ・設定・Docker 起動 | 4-3-1, 4-3-2 |
| タスク一覧の画面表示（Thymeleaf） | 3-5-1, 3-5-2 |

**依存関係**: 5-1（設計・初期化）→ 5-2（実装）→ 5-3（テスト・仕上げ）の順。5-2 内はデータ層 → ロジック / API → 認証（Security 設定・ログイン → JWT・認可）の順で積み上げる。

**画面表示について**: 主軸は REST API だが、5-2-5 で `タスク一覧` のみを Thymeleaf で画面表示する（**必須・読み取り専用**）。同じデータを「JSON で返す API」と「HTML で返す画面」の両方で扱うことで、API 開発と画面描画型 MVC の違いを実装レベルで体感し、業務系案件への対応力を高める。画面は一覧表示のみに絞り、API を主役に保つ。

### Chapter 5-1: 設計とプロジェクト初期化（2 Section）

**ゴール**: 要件から設計を起こし、起動可能なプロジェクトを用意する。

- **5-1-1 要件と API の設計**
  - 種類: ハンズオン（Part 5 のグループ先頭。ハンズオン全体の進め方を含む）
  - 逆リンク: Part 1〜4 の概念 Section（特に 3-3, 3-4）
  - ゴール: 題材の要件を整理し、ドメインモデル・テーブル・API エンドポイントを設計する。AI（Claude Code）を使った設計の進め方を体験する
  - 前提: [Part 1〜4 全般]
  - 参考資料: [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/index.html)
  - Laravel 対比: CT 最終課題の「要件 → DB 設計 → 実装」の流れを Java / Spring Boot で再現
- **5-1-2 環境構築とプロジェクト作成**
  - 種類: ハンズオン
  - 逆リンク: 3-1-2, 3-1-3, 4-3-2
  - ゴール: JDK / Docker / IDE を準備し、Spring Initializr でプロジェクトを生成、MySQL（Docker）へ接続して起動を確認する
  - 前提: [3-1-2, 3-1-3]
  - 参考資料: [Maven — Getting Started](https://maven.apache.org/guides/getting-started/index.html)
  - Laravel 対比: `sail up` 相当を Docker Compose で。Initializr は Laravel の新規作成に相当
  - 注記: Spring Initializr の既定ビルドツールは Maven なのでそのまま使う（Gradle に変えない）。既定の Java バージョンは時期により変動するため、生成時に Java 21 を明示的に選ぶ（/write 時に実画面で確認。本教材は Maven / Java 21 採用）

### Chapter 5-2: 実装（5 Section）

**ゴール**: データ層からロジック・API・認証までを積み上げて動く API を完成させ、最後に最小の画面（Thymeleaf）まで作って API と画面描画の違いを体感する。

- **5-2-1 ドメインとデータアクセス**
  - 種類: ハンズオン
  - 逆リンク: 3-4-1, 3-4-2, 2-1-1
  - ゴール: エンティティ（ユーザー / タスク / タグ）・リレーション・`JpaRepository` を実装し、スキーマを起動時に確認する
  - 前提: [3-4-1, 3-4-2]
  - 参考資料: [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/index.html)
  - Laravel 対比: マイグレーション + Eloquent モデル + リレーションを、エンティティ + Repository で再現
- **5-2-2 ビジネスロジックと API**
  - 種類: ハンズオン
  - 逆リンク: 3-2-2, 3-3-1, 3-3-2, 3-3-3, 3-4-3
  - ゴール: Service・Controller・DTO・バリデーション・例外ハンドリング・トランザクションを実装し、CRUD の API を完成させる
  - 前提: [3-2-2, 3-3-1, 3-3-2, 3-3-3, 3-4-3]
  - 参考資料: [Spring — Web on Servlet Stack](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
  - Laravel 対比: コントローラ + FormRequest + API リソースの構成を、Controller + DTO + Service で再現
- **5-2-3 Spring Security 設定とログイン認証**
  - 種類: ハンズオン
  - 逆リンク: 4-1-1, 4-1-2
  - ゴール: Spring Security を導入し、`SecurityFilterChain`・`UserDetailsService`・パスワードハッシュでユーザー登録 / ログイン（認証）を実装する
  - 前提: [4-1-1, 4-1-2]
  - 参考資料: [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
  - Laravel 対比: Fortify / Sanctum のユーザー登録・ログインを、Spring Security の認証設定で再現
- **5-2-4 JWT 発行・検証と認可**
  - 種類: ハンズオン
  - 逆リンク: 4-1-2
  - ゴール: JWT の発行（ログイン成功時）と検証（リクエストごと）を組み込み、ユーザーごとに自分のタスクのみ操作できるよう認可する
  - 前提: [5-2-3]
  - 参考資料: [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
  - Laravel 対比: Sanctum のトークン発行とポリシーによる「自分の資源のみ操作」を、JWT + 認可で再現
- **5-2-5 タスク一覧画面（Thymeleaf）**
  - 種類: ハンズオン
  - 逆リンク: 3-5-1, 3-5-2
  - ゴール: ログイン中ユーザーのタスク一覧を、`@Controller` + Thymeleaf で **読み取り専用の HTML 画面** として表示する。5-2-2 で作った「JSON を返す API」と同じデータを「HTML を返す画面」として並べ、API と画面描画型 MVC の違いを実装して体感する
  - 前提: [5-2-2, 5-2-4, 3-5-1, 3-5-2]
  - 参考資料: [Thymeleaf Documentation](https://www.thymeleaf.org/documentation.html)
  - Laravel 対比: Blade で一覧を表示した経験を Thymeleaf（`th:each`）で再現する。画面は一覧表示のみに絞り、API を主役に保つ
  - 注記: 画面（HTML）の認証は API と運び方が異なる。API はステートレス JWT（`Authorization: Bearer` ヘッダ）だが、ブラウザのページ遷移ではこのヘッダが飛ばず、同じ仕組みでは「ログイン中ユーザー」を解決できない。**既定は、ログイン時（5-2-3 / 5-2-4）に JWT を `HttpOnly` Cookie にも載せ、この 1 ルートだけ Cookie からトークンを読んで認証する** 方式とする（読み取り専用 GET のため CSRF の実害は小さい。`SameSite` を付ける）。代替の session ベース第2 `SecurityFilterChain`（`@Order` で API と分離）はよりリアルだが最小スコープ外。最終選定は /write で確定する。この「API と画面で認証の運び方が違う」こと自体を、JSON API と画面描画型 MVC の違いを示す教材ポイントとして扱う

### Chapter 5-3: テストと仕上げ（2 Section）

**ゴール**: テストで振る舞いを保証し、起動・確認・片付けまで行って教材全体を締め括る。

- **5-3-1 テストを書く**
  - 種類: ハンズオン
  - 逆リンク: 4-2-1, 4-2-2
  - ゴール: Service の単体テスト・Controller の `MockMvc` テスト・統合テストを書き、API の振る舞いを保証する
  - 前提: [4-2-1, 4-2-2]
  - 参考資料: [Spring Boot — Testing](https://docs.spring.io/spring-boot/reference/testing/index.html)
  - Laravel 対比: Feature テストで API を検証した経験を、`MockMvc` / `@SpringBootTest` で再現
- **5-3-2 動作確認と振り返り**
  - 種類: ハンズオン
  - 逆リンク: 4-3-1, 4-3-2
  - ゴール: Docker で起動し API の動作を確認、ログ・設定を整える。作成したリソースを片付け、教材全体を振り返って次のステップ（スコープ外の発展領域）を示す
  - 前提: [5-2-4, 5-3-1]
  - 参考資料: [Spring Boot — Container Images](https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html)
  - Laravel 対比: 教材全体の締め括り。Laravel での開発体験と地続きであることを確認する

---

## 依存関係の要点

- **直線的な土台**: Part 1 → Part 2 は順に積み上げる（基本文法 → OOP）。特に 2-3（インターフェース / ポリモーフィズム）は 3-2（DI）の必須前提。
- **Spring の縦串**: 3-2（DI）→ 3-3（Web）/ 3-4（データ）。3-3 と 3-4 は並行的だが、いずれも 3-2 に依存。
- **品質は縦串の後**: Part 4 は Part 3 の各層に対応（4-1 ↔ Web、4-2 ↔ 全層、4-3 ↔ Web / 設定）。
- **総合ハンズオン**: Part 5 は Part 1〜4 全体に依存。各 Section は対応する概念 Section へ逆リンクする。
