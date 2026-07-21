---
name: animate
description: "Remotion で教材の Section 解説動画（アニメーション + ナレーション + 字幕）を生成し、カリキュラムに挿入する。「動画を作って」「解説動画を生成して」「animate 2-1」「Chapter 1 の動画を作って」など、AI による動画生成の依頼で使用する（人間の講師が収録する授業動画の台本・収録支援は /lecture）。既定は判断ベース（動画が最も効く Section に限定）で、全概念 Section への生成や主学習路化は /pilot で選ぶ。ストーリーボード作成・TTS・レンダリング・配信・挿入までの一連のワークフローに対応する。"
argument-hint: "<plan|generate|スコープ> [対象]"
---

# animate - Section 解説動画の生成と挿入

Remotion（React ベースの動画フレームワーク）で、各 Section の解説動画（3〜6 分、1080p mp4）を生成・挿入する。
静止画の `/illustrate` が「直感的なメンタルモデル 1 枚」を担うのに対し、animate は **時間軸を持つ解説**（対比の展開・処理の流れ・状態の変化）を担う。位置づけは /pilot の密度方針で決まる（既定 [B]＝テキストが主で動画はリッチな補助 / [A]＝動画を主たる学習路に据えテキストを補助に回す）。設計基準は `references/criteria.md`。

**密度**: 既定は判断ベース（動画が最も効く Section に限定）。全概念 Section への生成や主学習路化は /pilot で選ぶ。**決定の正は `PROGRESS.md` の `config.animate`**（/pilot が記録。未記録の既定は判断ベース。基準は `references/criteria.md` の密度方針）。配置は **Section タイトル直後**（📝 前提知識の行・グループ全体像があればその後、🎯 の前）。要約・予告編ではなく、見れば核が理解できる解説。再実行しても生成済み Section はスキップする（冪等）。

## 対象範囲

- **対象**: 「概念」種別の Section（OUTLINE.md の「種類」フィールドで判定）。階層（1〜3層）には依存しない。**weave 教材（config.section_model=weave）では概念 Section がほぼ無いため、時間軸を持つ説明が要る混合（織り込み）Section を明示指定で対象にしてよい**
- **除外**: ハンズオン・混合 Section は既定では対象外。ただしコマンド実演・AI エージェント操作は `terminal` / `terminalCompare` シーン型で表現できるため、ユーザーが明示指定した場合は生成してよい
- **1 Section = 1 動画**

## 前提条件

1. **GOOGLE_TTS_API_KEY**（ナレーション TTS 用。既定エンジン＝Google Chirp 3 HD）: `[ -n "$GOOGLE_TTS_API_KEY" ] && echo OK`（代替で Gemini を使うなら `GEMINI_API_KEY`、OpenAI なら `OPENAI_API_KEY`）
2. **video/ ワークスペース**: 初回のみ `cd video && npm install`
3. **Remotion 公式 Skill**: `.claude/skills/remotion-best-practices` が無ければ、ユーザーに `npx skills add remotion-dev/skills` の実行を依頼する（外部 Skill の導入はユーザー操作で行う）
4. **プロジェクト調整（カスタマイズ）**: 配色・フォント・ロゴ・声・読みは **`references/customization.md`** の手順で差し替える。要点は4つだけ:
   - `video/src/brand.ts`（アクセント色・面の淡色・日本語フォント・ロゴパス）。`theme.ts` がこれを取り込んで全トークンを組む
   - `video/public/<logo>`（左上ロゴ）/ `video/data/voice.json`（声・話速・口調）/ `video/data/pronunciation.json`（ドメイン読み）
   - エンジン（`src/scenes`・`anim.ts`・`highlight.ts`・`scripts/*`）は汎用なので触らない
5. 📝 **Remotion ライセンス**: Remotion は一定規模の企業利用で Company License が必要になるが、**本プロジェクトはライセンス判断をプロジェクトオーナーの責任で進める方針**のため、生成・配信・挿入を止めるゲートは設けない（必要があればオーナーが別途手配する）。

## 使い方

### 1. plan（生成せず計画を提示）

```
/animate plan Chapter 1
/animate plan all
```

スコープ内の対象 Section を列挙し、各動画の構成案（シーン分割・中心概念・想定尺）を提示する。**生成は行わない**。コスト（レンダ時間）をかける前の確認ゲート。

### 2. generate（一括生成）

```
/animate Chapter 1          ← plan → 確認 → storyboard → lint → TTS → Studio で確定 → レンダ・QA・配信・挿入
/animate generate 2-1 --yes
```

スコープ内の未生成 Section を順に処理する。**レンダ（書き出し）の前に Studio でプレビューし、フィードバックを反映して確定させてから mp4 を焼く**（下記フローのゲート）。`--force` で生成済みも作り直す。

### 3. 単発の修正

特定シーンの台本・音声・デザインの修正は「制作フロー」の該当ステップだけやり直す（下記「音声・台本の修正サイクル」）。

## 制作フロー（1 Section あたりの手順）

毎回フル mp4 を焼いてから直すのは遅い。次の順で進め、**書き出し（レンダ）は Studio で確定してから1回だけ**行う。複数 Section をまとめて作るときは、全 Section の 1〜5（storyboard + lint + TTS）を先に通し、Studio でまとめて確認・修正してからレンダする方が手戻りが少ない。

```text
storyboard 執筆 → lint-storyboard（機械検証）→ TTS → Studio プレビュー（必須ゲート）
  → レンダ1回 → qa-stills（一括スチール確認）→ 配信・挿入
```

1. **Section ファイルを全文読む**
2. **ストーリーボードを書く**: `video/data/<sectionId>.storyboard.json`。シーン構成・台本の書き方は `references/storyboard.md`、シーン型の選び方と尺は `references/criteria.md` に従う。読み上げは **narration から自動生成**される（`pronunciation.json` で英語・記号だけカタカナ化、漢字は残す。全 TTS エンジン共通）。通常 `reading` は書かず、聞いて違和感がある箇所だけ個別に上書きする（詳細は `storyboard.md`）。新しい英語用語は `pronunciation.json` に追加する。書いたら `narration` の AI 臭をチェックし、不自然な言い回しを平易に直す（`stop-ai-slop-jp` Skill が利用可能ならそれを使い、無ければ `.claude/skills/review/references/ai-slop-curriculum.md` の語彙観点で点検する。本文と表現を揃える）。誤読しやすい漢字は `references/reading-pitfalls.md` に従って対策する（単一読みは `pronunciation.json`、読みが割れる字はひらがな）
3. **lint（機械検証）**: `cd video && node scripts/lint-storyboard.mjs <sectionId>`（シーン数・narration 字数・型名・figure 参照切れを TTS の前に止める）。エラーが出たら storyboard を直してから先へ進む
4. **既存概念図を素材化**: 導入の概念図（/illustrate の出力）を使う場合は `cp assets/diagrams/output/<name>.（jpg|png） video/public/figures/`
5. **TTS（音声つきプレビューの材料）**: `cd video && node scripts/tts-gcloud.mjs <sectionId>`（既定: Google Chirp 3 HD。生成済み wav は再利用される。既定の理由とエンジンの差し替えは下記「コストと品質の注意」）。実測尺入りの `data/<id>.props.json` が生成される。ここまではレンダ不要。reveal 同期は `node scripts/caption-times.mjs <sectionId> [語...]` で字幕セグメントの開始位置を実測してから storyboard に入れる（当て推量しない）。**storyboard を修正したら TTS を再実行して props を更新する**（wav は再利用され API は呼ばれない。Studio・レンダが読むのは props.json のため）
6. **Studio で確認（書き出し前ゲート・必須）**: `cd video && npx remotion studio --port 3333` を起動（ポート 3000 は他アプリと衝突しやすい）。サイドバーの `demo` は全シーン型カタログ（音声なし）で、デザイン調整はここをホットリロードで回す。実 Section は `Root.tsx` の `sections` 配列に `data/<id>.props.json` の import を1行足すと `sec-<id>` が増え、**音声つきでスクラブ・再生**して確認できる。**ここで色・段差・モーション・字幕・表示と音声のタイミング・文言を詰め、ユーザーのフィードバックを反映して確定させる**（mp4 は焼かない）
7. **レンダリング**: Studio ゲート通過後に `npx remotion render src/index.ts SectionVideo out/<sectionId>.mp4 --props=data/<sectionId>.props.json`（1 本あたり約 6 分）
8. **QA**: `node scripts/qa-stills.mjs <sectionId>` で各シーンの中間フレームを `out/qa/<sectionId>/` へ一括書き出し、Read で目視確認（文字切れ・レイアウト崩れ・字幕）。音声を試聴し、読み間違いがないか確認する（`references/reading-pitfalls.md` の漢字を含むシーンは特に注意）
9. **配信と挿入**: 下記「配信規約」に従う

**横断的な修正と個別の修正**: デザイン・モーション・タイミングの不具合は複数 Section に跨ることが多い（`src/scenes/*`・`anim.ts` を直すと全 Section に効く）。文言・シーン構成の不具合はその Section の storyboard を直す。どちらも Studio のホットリロードで確認しながら回す。

## 配信規約

- **配信先は GitHub Releases の固定タグ `videos`**: `gh release upload videos out/<sectionId>.mp4 --clobber`（初回のみ `gh release create videos --title "Section 解説動画" --notes "教材の Section 解説動画アセット"`）。mp4 はリポジトリにコミットしない
- **挿入位置は Section タイトル直後**（📝 前提知識の行・グループ全体像があればその後、🎯 の前）
- **埋め込みテンプレート**（`<org>/<repo>` は `git remote -v` から確定する）:

```html
<video controls preload="metadata" playsinline width="100%">
  <source src="https://github.com/<org>/<repo>/releases/download/videos/<sectionId>.mp4" type="video/mp4">
</video>
```

- `crossorigin` 属性は**付けない**（Releases は CORS ヘッダを返さないため再生が壊れる）
- GitHub.com 上の Markdown 表示では再生されない（CSP 制約）。**正式な閲覧経路は GitHub Pages**
- （任意・アクセシビリティ）`node scripts/make-vtt.mjs <sectionId>` で WebVTT 字幕を生成できる。`<track>` は**同一オリジン配信が必要**なため、.vtt は Releases ではなくリポジトリ内 `assets/videos/` 等にコミットし、`<video>` 内に `<track kind="captions" srclang="ja" src="...">` で添える（/github-pages で公開する教材では、生 HTML 内の相対パスはビルドで書き換えられないため `src` は公開サイト上の絶対パスにする）

## 冪等性（再実行の安全性）

- **判定の真実は Section ファイル**: タイトル直後に `releases/download/videos/<sectionId>.mp4` を含む `<video>` タグがあれば「挿入済み」としてスキップ。**別経路の `<video>` タグ**（/lecture の授業動画等）が既にタイトル直後にある Section も生成対象から外し、同一 Section への動画二重挿入になる旨を報告する
- タグが無く `video/out/<sectionId>.mp4` が存在するなら「生成済み・未挿入」＝配信と挿入のみ行う。どちらも無ければ未生成（フル実行）
- `--force` 指定時のみ再生成（storyboard から作り直す場合は TTS も `--force`）

## 音声・台本の修正サイクル

- **読み間違いの修正**: ①読み辞書 `video/data/pronunciation.json` に語を追加 ② storyboard の該当シーンの `reading` を修正 ③該当シーンの wav を削除（`rm video/public/audio/<sectionId>/scene-NN*.wav`）④ TTS 再実行（削除したシーンだけ再生成される）⑤再レンダ
- **話速の微調整**: `data/voice.json` の `tempo`（atempo 倍率）で、音声を作り直さず（API なし）速度だけ変えられる。生音声は `scene-NN.raw.wav` に保持され、tempo 変更は再合成しない（`tts-voicevox.mjs` のみ非対応: `VOICEVOX_SPEED` の speedScale で調整し、raw.wav も作られない）
- **デザイン・動きの調整**: 色は `video/src/brand.ts`（トークンは `theme.ts`）、モーションは `video/src/anim.ts` に集約。Studio のホットリロードで確認しながら詰める

## Studio の Composition 構成（Root.tsx）

- `SectionVideo`: レンダ用。`--props=data/<id>.props.json` で各 Section を渡す（既定 props は `_smoke`）
- `demo`: 全シーン型カタログ（`data/_demo.props.json`・音声なし）。デザイン調整の既定表示
- `sec-<id>`: 実 Section のプレビュー。`Root.tsx` のコメントに従い `data/<id>.props.json` を import して `sections` 配列に足すと現れる（音声つきスクラブ確認用）

## コストと品質の注意

- レンダ約 6 分 / 本（Apple Silicon・concurrency 5）、TTS は数十秒 / 本。**Chapter / Part 単位での実行を推奨**
- **声の一貫性と TTS エンジンの選択（重要）**: 既定の Chirp 3 HD（production 型）はシーンごとに別呼び出ししても同じ声・同じ調子で揃う。Gemini preview（生成型）は同じ `voice` でも生成のたびに抑揚・話速・声の張りが揺れ、シーン境界で声が変わって聞こえるため既定にしない。声を変えたいときは `data/voice.json` の `gcloudVoice`（Chirp の別ボイス）を変える。エンジン自体の差し替えは同一 CLI 契約で、フォールバック順は `tts-gcloud.mjs` → `tts-gemini.mjs`（生成型・トーン指示可だが一貫しない）→ `tts-voicevox.mjs`（無料・ローカル・要クレジット表記）。`tts-openai.mjs` も差し替え可。いずれも `--force` で再生成
- 動画 mp4 は **コミットしない**（`.gitignore` 済み）。コミットするのは storyboard JSON・**props JSON（TTS 実測尺入り。再レンダに必要）**・コード・教材 md の埋め込みタグ
- **コミットはこの作業の成果物のみで行う**（例: `video(2-1): 解説動画を生成・挿入`）。本文の推敲や画像の変更と混載しない（レビューと巻き戻しを単純にするため）

## リファレンス

| ファイル | 内容 | いつ読むか |
|---|---|---|
| `references/customization.md` | 配色・フォント・ロゴ・声・読みの差し替え（`brand.ts` 等）。**新しい教材に使うとき最初に読む** | プロジェクト立ち上げ時 |
| `references/criteria.md` | 対象選定・尺・シーン型の選び方・挿入位置・デザインの前提 | plan 時・storyboard 設計時 |
| `references/storyboard.md` | storyboard JSON 仕様・台本（narration / reading）の執筆ルール・品質チェックリスト | storyboard 執筆時 |
| `references/reading-pitfalls.md` | 日本語 TTS の誤読対策（単一読み＝辞書 / 読みが割れる＝ひらがな / 区間番号） | narration 執筆時・試聴後の修正時 |
| `video/README.md` | ワークスペースのパイプラインとコマンド | 環境を触るとき |
| `.claude/skills/remotion-best-practices` | Remotion コードの書き方（公式 Skill） | シーン型を実装・修正するとき |
