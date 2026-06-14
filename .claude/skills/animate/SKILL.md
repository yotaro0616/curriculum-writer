---
name: animate
description: "Remotion で教材の Section 解説動画（アニメーション + ナレーション + 字幕）を生成し、カリキュラムに挿入する。「動画を作って」「解説動画を生成して」「animate 2-1」「Chapter 1 の動画を作って」など、教材への動画追加に関する依頼で使用する。概念 Section に 1 本ずつ生成するのが基本方針。ストーリーボード作成・TTS・レンダリング・配信・挿入までの一連のワークフローに対応する。"
argument-hint: "<plan|generate|スコープ> [対象]"
---

# animate - Section 解説動画の生成と挿入

Remotion（React ベースの動画フレームワーク）で、各 Section の解説動画（1.5〜3 分、1080p mp4）を生成・挿入する。
静止画の `/illustrate` が「直感的なメンタルモデル 1 枚」を担うのに対し、animate は **時間軸を持つ説明**（対比の展開・処理の流れ・状態の変化）を担う。

**基本方針**: 「概念」種別の Section に 1 本ずつ生成する（密度は `references/criteria.md` の方針設定に従う）。配置は **Section タイトル直後**（📝 前提知識の行・グループ全体像があればその後、🎯 の前）。学習の最初に視聴する想定。再実行しても生成済み Section はスキップする（冪等）。

## 対象範囲

- **対象**: 「概念」種別の Section（OUTLINE.md の「種類」フィールドで判定）。階層（1〜3層）には依存しない
- **除外**: ハンズオン・混合 Section（コマンド実況テンプレートが未実装のため。実装後に拡張する）、`curriculums/` に実ファイルがない Section
- **1 Section = 1 動画**

## 前提条件

1. **GEMINI_API_KEY**（ナレーション TTS 用）: `[ -n "$GEMINI_API_KEY" ] && echo OK`
2. **video/ ワークスペース**: 初回のみ `cd video && npm install`
3. **Remotion 公式 Skill**: `.claude/skills/remotion-best-practices` が無ければ、ユーザーに `npx skills add remotion-dev/skills` の実行を依頼する（外部 Skill の導入はユーザー操作で行う）
4. **プロジェクト調整**（初回に確認。未調整でも既定値で動作する）:
   - `video/src/theme.ts` の primary / accent を教材サイトのテーマカラーに合わせる
   - `video/data/voice.json` の stylePrompt を writing.md のメンター人格に合わせる
   - `video/data/pronunciation.json` に題材のドメイン用語を追加する
5. ⚠️ **Remotion ライセンス**: 評価・PoC は無償だが、**動画を量産して教材として公開する時点で Company License（従業員 4 名以上の企業は必須、Creators $25/席/月・最低 3 席）が必要**。配信・挿入フェーズに進む前にライセンス状態を確認し、未取得なら停止してユーザーに確認する

## 使い方

### 1. plan（生成せず計画を提示）

```
/animate plan Chapter 1
/animate plan all
```

スコープ内の対象 Section を列挙し、各動画の構成案（シーン分割・中心概念・想定尺）を提示する。**生成は行わない**。コスト（レンダ時間）をかける前の確認ゲート。

### 2. generate（一括生成）

```
/animate Chapter 1          ← plan → 確認 → 生成（既定の流れ）
/animate generate 2-1 --yes
```

スコープ内の未生成 Section を順に処理する。`--force` で生成済みも作り直す。

### 3. 単発の修正

特定シーンの台本・音声・デザインの修正は「1 Section あたりの手順」の該当ステップだけやり直す（下記「音声・台本の修正サイクル」）。

## 1 Section あたりの手順（中核）

1. **Section ファイルを全文読む**
2. **ストーリーボードを書く**: `video/data/<sectionId>.storyboard.json`。シーン構成・台本の書き方は `references/storyboard.md`、シーン型の選び方と尺は `references/criteria.md` に従う。読み上げ原稿（`reading`）には **読み辞書 `video/data/pronunciation.json` を必ず適用**する
3. **既存概念図を素材化**: 🧠 直後の概念図（/illustrate の出力）を使う場合は `cp assets/diagrams/output/<name>.jpg video/public/figures/`
4. **TTS**: `cd video && node scripts/tts-gemini.mjs <sectionId>`（生成済み wav は再利用される）
5. **レンダリング**: `npx remotion render src/index.ts SectionVideo out/<sectionId>.mp4 --props=data/<sectionId>.props.json`（1 本あたり約 6 分）
6. **QA**: 各シーンの中間フレームを `npx remotion still src/index.ts SectionVideo out/qa-<frame>.png --frame=<N> --props=... --scale=0.5` で 3〜4 枚書き出し、Read で目視確認（文字切れ・レイアウト崩れ・字幕）。音声も冒頭シーンを試聴確認する
7. **配信と挿入**（ライセンス確認後のフェーズ）:
   - `gh release upload videos out/<sectionId>.mp4 --clobber`（初回は `gh release create videos --title "Section 解説動画" --notes "教材の Section 解説動画アセット"`）
   - Section タイトル直後に下記テンプレートで挿入する

### 埋め込みテンプレート

`<org>/<repo>` は `git remote -v` から確定する。

```html
<video controls preload="metadata" playsinline width="100%">
  <source src="https://github.com/<org>/<repo>/releases/download/videos/<sectionId>.mp4" type="video/mp4">
</video>
```

- `crossorigin` 属性は付けない（Releases は CORS ヘッダを返さないため再生が壊れる）
- GitHub.com 上の Markdown 表示では再生されない（CSP 制約）。正式な閲覧経路は GitHub Pages

## 冪等性（再実行の安全性）

- **判定の真実は Section ファイル**: タイトル直後に `releases/download/videos/<sectionId>.mp4` を含む `<video>` タグがあれば「挿入済み」としてスキップ
- 挿入前フェーズでは `video/out/<sectionId>.mp4` の存在で生成済みと判定
- `--force` 指定時のみ再生成（storyboard から作り直す場合は TTS も `--force`）

## 音声・台本の修正サイクル

- **読み間違いの修正**: ①読み辞書 `video/data/pronunciation.json` に語を追加 ② storyboard の該当シーンの `reading` を修正 ③該当シーンの wav を削除（`rm video/public/audio/<sectionId>/scene-NN.wav`）④ TTS 再実行（削除したシーンだけ再生成される）⑤再レンダ
- **デザイン・動きの調整**: 色は `video/src/theme.ts`、モーションは `video/src/anim.ts` に集約。プレビューは `npx remotion studio --port 3333`（ポート 3000 は他アプリと衝突しやすい）

## コストと品質の注意

- TTS 約 $0.07 / 本（gemini-2.5-flash-preview-tts）、レンダ約 6 分 / 本（Apple Silicon・concurrency 5）。**Chapter / Part 単位での実行を推奨**
- 音声は **Preview モデル**のため、モデル ID 変更時は `TTS_MODEL`（または `data/voice.json` の `model`）で切替える。エンジン自体の差し替えは `scripts/tts-voicevox.mjs`（同一 CLI 契約）が前例
- 動画 mp4 は **コミットしない**（`.gitignore` 済み）。コミットするのは storyboard JSON・コード・教材 md の埋め込みタグのみ

## リファレンス

| ファイル | 内容 | いつ読むか |
|---|---|---|
| `references/criteria.md` | 対象選定・尺・シーン型の選び方・挿入位置 | plan 時・storyboard 設計時 |
| `references/storyboard.md` | storyboard JSON 仕様・台本（narration / reading）の執筆ルール | storyboard 執筆時 |
| `video/README.md` | ワークスペースのパイプラインとカスタマイズポイント | 環境を触るとき |
| `.claude/skills/remotion-best-practices` | Remotion コードの書き方（公式 Skill） | シーン型を実装・修正するとき |
