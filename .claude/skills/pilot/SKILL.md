---
name: pilot
description: |
  量産前の試作フェーズ（上流フェーズ 4/4・ゲート G4）。writing.md の初期調整 → 代表 Chapter を試作 → 公開形式で通読検証 → 様式ロック。
  「パイロットを書いて」「試作して様式を固めたい」「writing.md を調整したい」など。通常は /setup（ルーター）から案内される。
argument-hint: "[パイロット Chapter 番号(任意)] [追加指示(任意)]"
---

# 試作と様式ロック（G4）

量産後の様式変更は全 Section の横断修正になる（実例: 絵文字→admonition 移行で 19 ファイル +564/-197 の修正）。様式のミスマッチを試作 1 Chapter に閉じ込めてから量産に入る。

**入力**: $ARGUMENTS

**完了ゲート**: G4 = writing.md の様式ロック → `PROGRESS.md` に記録。**量産（複数 Section の連続執筆）は G4 後にのみ行う**。

---

## 1. 決定録の確定（PROGRESS.md の config）

/pilot で確定する様式・執筆判断は `PROGRESS.md` frontmatter の `config`（**決定録＝単一ソース**）に記録する。skills はここを実行時に参照するため、確定値は writing.md ではなく config に書く（writing.md は題材非依存の共有ルールのまま保つ）。**まず全12項目の既定値を1つの表で提示し、「既定のままで良い」項目は一括承認・変えたい項目だけ対話する**（12問を1問＋差分に圧縮する）:

| # | 項目 | 記録先 | 既定 |
|---|---|---|---|
| 1 | 語りかけの人格・🧠 頻度 | `config.persona` / `config.persona_frequency` | 頻度=毎 Section |
| 2 | 用語テーブル（トピック固有） | `.claude/rules/prh.yml`（＋ writing.md 用語表） | — |
| 3 | コード言語タグ（blade, jsonc 等） | `config.code_langs` | — |
| 4 | 図表の形式 | `config.diagram_format` | mermaid |
| 5 | Section の目安文字数 | `config.char_target` | 4000 |
| 6 | 表現様式 | `config.style` | emoji（GitHub 直読み向け。admonition は MkDocs/LMS 向け・RESEARCH Phase 0 の公開方式に従う） |
| 7 | アークモード | `config.arc_mode` | mode2（概要駆動） |
| 8 | ハンズオン検証モデル | `config.verification_model` | copypaste（コピペ再現型） |
| 9 | やってみよう執筆タイミング | `config.tryit_timing` | A（Part 単位2パス） |
| 10 | 画像の経路/密度（/illustrate 使用時） | `config.illustrate` | claude-design / B |
| 11 | ブランド（キーカラー） | `config.brand`（→ 下記3箇所へ反映） | — |
| 12 | 本文で使わない表現 | `config.excluded_terms` | — |

各スキルはここを正として追随する: lint・hook・CI・/review は `config.style`、/illustrate は `config.illustrate`、/write・/review はアークモード・検証モデル・やってみようタイミング。ブランドは `config.brand` を正として3箇所（`video/src/brand.ts`・illustrate の `references/style-guide.md`・github-pages の `custom.css`）へ反映する。用語だけは辞書性質のため `prh.yml`（＋ writing.md 用語表）に置く。

この時点の config は**ドラフト**。ロックは手順 5 で行う。

## 2. パイロット Chapter の選定

代表性で選ぶ:

- 概念（やってみよう付き候補を含む）とハンズオン（または混合）の両方を含む Chapter
- 題材が教材の中心に近いもの
- Part 1 の導入章は避ける（性格が特殊で、様式の代表にならない）

## 3. 骨子充填と試作

1. `/outline <Chapter>` で見出し骨子を充填・承認
2. `/write <Chapter>` で試作する（パイロットは G4 前だが量産ゲートの対象外）

## 4. 検証

- **公開形式プレビュー**: /github-pages を使う予定なら実レンダして確認（admonition・タブ・Mermaid の描画）。GitHub 直読みなら GitHub 上の表示を確認
- **機械チェック**: `npm ci` で textlint を有効化し、lint・textlint がテンプレートの定型と衝突しないか確認する（誤検出があれば `.textlintrc.json` の allows を調整。既知: 行頭の太字語＋半角スペース（broken-bold の修正形）は no-ai-emphasis-patterns と衝突しやすい）
- **学習者視点の通読**: `.claude/agents/learner-persona` で通読させ、つまずき・未定義用語・例示/実践の混乱を収集
- **メディアの様式**（使う場合）: /illustrate・/animate を1点ずつ試し、図・動画のトーンを確認

## 5. 様式ロック（G4）

1. 検証の指摘を writing.md・テンプレートに反映する
2. パイロット Section を確定様式で書き直す（差分がある場合）
3. ユーザー承認を得て `PROGRESS.md` の `G4_style_lock` に日付を記録 = **量産解禁**

ロック後の様式変更は `/revise` で扱う（全 Section への横断修正の計画付き）。

## 省略（適応的深度）

小規模教材では /setup の提案により省略できる。その場合も手順 1（決定録の確定）だけは実施し、最初の Chapter を書いた直後に「ミニ較正」（公開形式での表示確認と writing.md の微調整）を行ってから G4 を記録し、残りを量産する。
