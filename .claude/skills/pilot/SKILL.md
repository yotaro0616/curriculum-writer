---
name: pilot
description: |
  量産前の試作フェーズ（上流フェーズ 4/4・ゲート G4）。決定録（PROGRESS.md config）の確定 → 代表 Chapter を試作 → 公開形式で通読検証 → 様式ロック。
  「パイロットを書いて」「試作して様式を固めたい」「writing.md を調整したい」など。通常は /setup（ルーター）から案内される。
argument-hint: "[パイロット Chapter 番号(任意)] [追加指示(任意)]"
---

# 試作と様式ロック（G4）

量産後の様式変更は全 Section の横断修正になる（実例: 絵文字→admonition 移行で 19 ファイル +564/-197 の修正）。様式のミスマッチを試作 1 Chapter に閉じ込めてから量産に入る。

**入力**: $ARGUMENTS

**完了ゲート**: G4 = writing.md の様式ロック → `PROGRESS.md` に記録。**量産（複数 Section の連続執筆）は G4 後にのみ行う**。

---

## 1. 決定録の確定（PROGRESS.md の config）

/pilot で確定する様式・執筆判断は `PROGRESS.md` frontmatter の `config`（**決定録＝単一ソース**）に記録する。skills はここを実行時に参照するため、確定値は writing.md ではなく config に書く（writing.md は題材非依存の共有ルールのまま保つ）。

**前段（初期値セットの適用）**: `config.section_model` は /define（G2）で確定済みの**構造決定**であり、ここでは追認のみ行う（変える場合は /revise 扱いで、/outline モード A の再実行＝G3 の取り直しを伴う）。section_model に応じて初期値セットを適用してから表を出す:

- **reading-first**（section_model=separate）: 下表の既定のまま
- **typing-first**（section_model=weave）: style は公開方式に従い提案（plain / zenn / admonition）・tryit_timing=N/A・review_gate=chapter・char_target=2000〜2500 を提案・persona_frequency=selective・capture の使用を提案（デプロイ URL の無いローカル完結・エディタ画面中心の教材では `manual` を既定に提案する）

**まず全項目の値を1つの表で提示し、「このままで良い」項目は一括承認・変えたい項目だけ対話する**（17問を1問＋差分に圧縮する）:

| # | 項目 | 記録先 | 既定 |
|---|---|---|---|
| **体験設計** | | | |
| 1 | 学習モデル（G2 確定済みの追認） | `config.section_model` | separate |
| 2 | アークモード | `config.arc_mode` | mode2（概要駆動。weave でも記録する＝概念・ハンズオン Section に適用。混合（織り込み）のみ専用アーク） |
| 3 | ハンズオン検証モデル | `config.verification_model` | copypaste（決定的再現型。**weave × ai-delegated は未サポート**＝選ばれたら警告して組み合わせを変える） |
| 4 | やってみよう執筆タイミング | `config.tryit_timing` | A（Part 単位2パス。weave では N/A を記録＝概念 Section に置く場合のみ B 扱い・やってみよう表は作らない） |
| 5 | Section の目安文字数 | `config.char_target` | 4000（weave 提案: 2000〜2500） |
| **文体・様式** | | | |
| 6 | 表現様式 | `config.style` | emoji（公開方式＝RESEARCH Phase 0 に従う。plain=汎用/AI感排除、admonition=MkDocs、zenn=Zenn互換レンダラ） |
| 7 | 語りかけの人格・🧠 頻度 | `config.persona` / `config.persona_frequency` | 頻度=毎 Section（weave 提案: selective） |
| 8 | 用語テーブル（トピック固有） | `.claude/rules/prh.yml`（＋ writing.md 用語表） | — |
| 9 | 本文で使わない表現 | `config.excluded_terms` | — |
| 10 | コード言語タグ（blade, jsonc 等） | `config.code_langs` | — |
| **メディア** | | | |
| 11 | 図表の形式 | `config.diagram_format` | mermaid |
| 12 | 概念図の経路/密度（/illustrate 使用時） | `config.illustrate` | claude-design / B（不使用なら null） |
| 13 | 画面キャプチャ（/capture 使用時） | `config.capture` | null（使う場合: "playwright / <viewport等>" か "manual"） |
| 14 | 動画の密度（/animate 使用時） | `config.animate` | null（使う場合: "B" 等） |
| 15 | 授業動画＝人間収録（/lecture 使用時） | `config.lecture` | null（使う場合: "selective / screencast-wipe" 等。/animate と同一 Section で併用しない） |
| 16 | ブランド（キーカラー） | `config.brand`（→ 下記3箇所へ反映） | — |
| **運用** | | | |
| 17 | 独立レビューの粒度 | `config.review_gate` | section（weave 提案: chapter） |

各スキルはここを正として追随する: lint・hook・CI・/review は `config.style` と `config.section_model`、/illustrate・/capture・/animate・/lecture は各キー、/write・/review はアークモード・検証モデル・やってみようタイミング・レビュー粒度。ブランドは `config.brand` を正として3箇所（`video/src/brand.ts`・illustrate の `references/style-guide.md`・github-pages の `custom.css`）へ反映する。用語だけは辞書性質のため `prh.yml`（＋ writing.md 用語表）に置く。

**骨格プレビュー（ドラフト確定後に必ず）**: 選択した 様式 × アークモード × 学習モデルの組み合わせで、Section 骨格のダミー（見出しとコールアウトの枠だけの短いサンプル）を提示して確認を取る。weave の場合は専用の開始アーク（`section-models/weave.md` の骨格）のダミーを含める。ここで見た目の違和感を潰してから試作に進む。

この時点の config は**ドラフト**。ロックは手順 5 で行う。

## 2. パイロット Chapter の選定

代表性で選ぶ:

- 選択した学習モデルの主要な種類を両方含む Chapter（separate: 概念＋ハンズオン/混合 / weave: 混合（織り込み）＋概念またはハンズオン）
- 題材が教材の中心に近いもの
- Part 1 の導入章は避ける（性格が特殊で、様式の代表にならない）

## 3. 骨子充填と試作

1. `/outline <Chapter>` で見出し骨子を充填・承認
2. `/write <Chapter>` で試作する（パイロットは G4 前だが量産ゲートの対象外）

## 4. 検証

- **公開形式プレビュー**: /github-pages を使う予定なら実レンダして確認（admonition・タブ・Mermaid の描画）。GitHub 直読みなら GitHub 上の表示を確認。zenn 様式なら Zenn 互換レンダラ（公開先の LMS プレビュー等）で `:::message`・コード・画像・キャプションの実描画を確認する。plain なら貼り付け先レンダラ（LMS プレビュー・PDF 等）で blockquote・チェックボックス・画像パスの描画と折りたたみ非依存を確認する
- **機械チェック**: `npm ci` で textlint を有効化し、lint・textlint がテンプレートの定型と衝突しないか確認する（誤検出があれば `.textlintrc.json` の allows を調整。既知: 行頭の太字語＋半角スペース（broken-bold の修正形）は no-ai-emphasis-patterns と衝突しやすい）
- **学習者視点の通読**: `.claude/agents/learner-persona` で通読させ、つまずき・未定義用語・例示/実践の混乱を収集
- **メディアの様式**（使う場合）: /illustrate・/animate を1点ずつ試し、図・動画のトーンを確認。/lecture を使う教材ではパイロット Section の台本を1本作り、話し言葉のトーンと収録段取りが現場に合うか確認

## 5. 様式ロック（G4）

1. 検証の指摘を writing.md・テンプレートに反映する
2. パイロット Section を確定様式で書き直す（差分がある場合）
3. ユーザー承認を得て `PROGRESS.md` の `G4_style_lock` に日付を記録 = **量産解禁**

ロック後の様式変更は `/revise` で扱う（全 Section への横断修正の計画付き）。

## 省略（適応的深度）

小規模教材では /setup の提案により省略できる。その場合も手順 1（決定録の確定）だけは実施し、最初の Chapter を書いた直後に「ミニ較正」（公開形式での表示確認と writing.md の微調整）を行ってから G4 を記録し、残りを量産する。
