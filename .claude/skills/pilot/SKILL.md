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

## 1. writing.md の初期調整

`.claude/rules/writing.md` のプレースホルダ・選択コメントを、ユーザーと対話して確定する:

1. **語りかけの人格**: `[人格名]` を具体化し、🧠 の頻度（毎 Section / 効果的な箇所のみ）を決める
2. **用語テーブル**: {{TOPIC}} 固有の用語を追加（prh.yml にも同期する）
3. **コード表示ルール**: {{TOPIC}} 固有の言語指定（blade, jsonc 等）を追加
4. **図表の形式**: ASCII フロー図 or Mermaid
5. **Section あたりの目安文字数**
6. **表現様式**: 絵文字（既定・GitHub 直読み向け） / admonition（MkDocs・LMS 向け）。RESEARCH.md Phase 0 の公開方式に従う。admonition の場合は対応表を正に確定し、review / lint を `--style admonition` に切り替える
7. **アークモード**: モード2（概要駆動・既定） / モード1（導入駆動）
8. **ハンズオンの検証モデル**: コピペ再現型（既定） / AI委任型
9. **やってみようの執筆タイミング**: A（Part 単位2パス・推奨） / B（本文と同一パス）
10. **画像の方針**（/illustrate を使う場合）: 経路（Claude Design 手動＋/design-ingest（既定） / 生成AI（Gemini・OpenAI））と密度（[A] 各概念 Section 1枚 / [B] 判断ベース / [C] 概念アンカーごと）を選び、`.claude/skills/illustrate/references/criteria.md` の決定記録に反映する
11. **ブランドの一元設定**: キーカラーを決めて3箇所へ反映（video/src/brand.ts・illustrate style-guide・github-pages custom.css）
12. **write スキルのスコープ表**: 階層構造に合わせて調整
13. **本文で使わない表現**: 制度名・組織名等の除外方針（あれば）

この時点の writing.md は**ドラフト**。ロックは手順 5 で行う。

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
- **機械チェック**: lint・textlint がテンプレートの定型と衝突しないか（誤検出があれば allows を調整）
- **学習者視点の通読**: `.claude/agents/learner-persona` で通読させ、つまずき・未定義用語・例示/実践の混乱を収集
- **メディアの様式**（使う場合）: /illustrate・/animate を1点ずつ試し、図・動画のトーンを確認

## 5. 様式ロック（G4）

1. 検証の指摘を writing.md・テンプレートに反映する
2. パイロット Section を確定様式で書き直す（差分がある場合）
3. ユーザー承認を得て `PROGRESS.md` の `G4_style_lock` に日付を記録 = **量産解禁**

ロック後の様式変更は `/revise` で扱う（全 Section への横断修正の計画付き）。

## 省略（適応的深度）

小規模教材では /setup の提案により省略できる。その場合も手順 1（writing.md 初期調整）だけは実施し、最初の Chapter を書いた直後に「ミニ較正」（公開形式での表示確認と writing.md の微調整）を行ってから G4 を記録し、残りを量産する。
