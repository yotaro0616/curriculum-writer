# video/ — Section 解説動画ワークスペース（Remotion）

教材の各 Section から「解説スライド + ナレーション + 字幕」の mp4 を生成する Remotion ワークスペース。
使い方の全体は `.claude/skills/animate/SKILL.md` を参照。

> 📝 **Remotion ライセンス**: Remotion は一定規模の企業利用で Company License が必要になります。
> 本プロジェクトはライセンス判断をプロジェクトオーナーの責任で進める方針です（詳細は [remotion.pro](https://www.remotion.pro/license)）。

## パイプライン

```text
curriculums/.../<sectionId>_*.md（Section 本文）
  → data/<sectionId>.storyboard.json   … シーン分割 + ナレーション台本（Claude が執筆）
  → scripts/lint-storyboard.mjs        … 機械検証（シーン数・字数・型名・figure 参照）
  → scripts/tts-gcloud.mjs             … TTS 音声生成（既定: Chirp 3 HD・声が一貫）+ 実測尺の埋め込み
  → data/<sectionId>.props.json        … レンダリング入力（音声長を反映済み）
  → npx remotion studio                … 書き出し前プレビュー（必須ゲート）
  → npx remotion render                … mp4 出力
  → scripts/qa-stills.mjs              … 各シーン中間フレームの一括 QA スチール
```

## コマンド

```bash
npm install                                    # 初回のみ
node scripts/lint-storyboard.mjs <sectionId>   # storyboard の機械検証（TTS の前に）
node scripts/tts-gcloud.mjs <sectionId>        # 音声生成（既定: Chirp 3 HD・要 GOOGLE_TTS_API_KEY）
node scripts/caption-times.mjs <sectionId> [語...]  # 字幕タイミング診断（revealAt 調整用）
npx remotion studio --port 3333                # プレビュー（書き出し前の必須ゲート）
npx remotion render src/index.ts SectionVideo out/<sectionId>.mp4 \
  --props=data/<sectionId>.props.json          # レンダリング
node scripts/qa-stills.mjs <sectionId>         # QA スチール一括書き出し（out/qa/）
node scripts/make-vtt.mjs <sectionId>          # WebVTT 字幕生成（任意・out/<id>.vtt）
```

## プロジェクトごとのカスタマイズ

カスタマイズ面は `src/brand.ts`（色・フォント・ロゴ）・`public/<logo>`・`data/voice.json`・`data/pronunciation.json` の4つだけ。エンジン（`src/scenes/`・`anim.ts`・`theme.ts` の構造・`scripts/`）は触らない。手順と区分は `.claude/skills/animate/references/customization.md` を参照。

- TTS エンジンは差し替え可能（同一 CLI 契約）:
  - `scripts/tts-gcloud.mjs` — Google Cloud Chirp 3 HD（**日本語ネイティブ・放送品質**・要 `GOOGLE_TTS_API_KEY`）。声は `voice.json` の `gcloudVoice`（`ja-JP-Chirp3-HD-<名前>`）
  - `scripts/tts-gemini.mjs` — Gemini（要 `GEMINI_API_KEY`）。口調は `stylePrompt`
  - `scripts/tts-openai.mjs` — OpenAI `gpt-4o-mini-tts`（要 `OPENAI_API_KEY`。滑らかだが日本語は非ネイティブ感あり）。口調は `stylePrompt`→instructions
  - `scripts/tts-voicevox.mjs` — VOICEVOX（無料・ローカル・ネイティブ・要クレジット表記）
  - 話速は `data/voice.json` の `tempo`（atempo 倍率）。生音声は `scene-NN.raw.wav` に保持され、tempo 変更は再合成不要（gcloud / gemini / openai）。**voicevox のみ非対応**: `VOICEVOX_SPEED`（speedScale）で調整し、`tempo` / `raw.wav` は使われない
- **`data/*.props.json` はコミットする**: TTS の実測尺（`audioFrames` / `totalFrames`）を含み、再レンダ・QA スチール・字幕生成に必要なため（`public/audio/` と `out/` は ignore のまま）
- 生成物（`public/audio/` と `out/`）は git 管理外。コミットするのは storyboard JSON・props JSON と設定
- 配信は GitHub Releases を想定（mp4 はリポジトリにコミットしない）
