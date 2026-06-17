# video/ — Section 解説動画ワークスペース（Remotion）

教材の各 Section から「解説スライド + ナレーション + 字幕」の mp4 を生成する Remotion ワークスペース。
使い方の全体は `.claude/skills/animate/SKILL.md` を参照。

> 📝 **Remotion ライセンス**: Remotion は一定規模の企業利用で Company License が必要になります。
> 本プロジェクトはライセンス判断をプロジェクトオーナーの責任で進める方針です（詳細は [remotion.pro](https://www.remotion.pro/license)）。

## パイプライン

```text
curriculums/.../<sectionId>_*.md（Section 本文）
  → data/<sectionId>.storyboard.json   … シーン分割 + ナレーション台本（Claude が執筆）
  → scripts/tts-gemini.mjs             … TTS 音声生成 + 実測尺の埋め込み
  → data/<sectionId>.props.json        … レンダリング入力（音声長を反映済み）
  → npx remotion render                … mp4 出力
```

## コマンド

```bash
npm install                                    # 初回のみ
node scripts/tts-gemini.mjs <sectionId>        # 音声生成（要 GEMINI_API_KEY）
npx remotion studio --port 3333                # プレビュー
npx remotion render src/index.ts SectionVideo out/<sectionId>.mp4 \
  --props=data/<sectionId>.props.json          # レンダリング
```

## プロジェクトごとのカスタマイズポイント

| ファイル | 内容 |
|---|---|
| `src/theme.ts` | デザイントークン。primary / accent を教材サイトのテーマカラーに合わせる |
| `data/voice.json` | ナレーターの声と口調（writing.md のメンター人格に合わせる） |
| `data/pronunciation.json` | 読み辞書。題材のドメイン用語を追加していく |
| `src/anim.ts` | モーションプリセット（spring の強さ等） |
| `src/scenes/` | シーン型。新しい見せ方が必要になったらここに追加 |

- TTS エンジンは差し替え可能（同一 CLI 契約）:
  - `scripts/tts-gcloud.mjs` — Google Cloud Chirp 3 HD（**日本語ネイティブ・放送品質**・要 `GOOGLE_TTS_API_KEY`）。声は `voice.json` の `gcloudVoice`（`ja-JP-Chirp3-HD-<名前>`）
  - `scripts/tts-gemini.mjs` — Gemini（要 `GEMINI_API_KEY`）。口調は `stylePrompt`
  - `scripts/tts-openai.mjs` — OpenAI `gpt-4o-mini-tts`（要 `OPENAI_API_KEY`。滑らかだが日本語は非ネイティブ感あり）。口調は `stylePrompt`→instructions
  - `scripts/tts-voicevox.mjs` — VOICEVOX（無料・ローカル・ネイティブ・要クレジット表記）
  - 話速は全エンジン共通で `data/voice.json` の `tempo`（atempo 倍率）。生音声は `scene-NN.raw.wav` に保持され、tempo 変更は再合成不要
- 生成物（`public/audio/` と `out/`）は git 管理外。コミットするのは storyboard JSON と設定のみ
- 配信は GitHub Releases を想定（mp4 はリポジトリにコミットしない）
