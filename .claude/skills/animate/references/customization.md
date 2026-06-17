# プロジェクトごとのカスタマイズ（汎用エンジン → 各教材へ）

animate の `video/` は **汎用エンジン**（シーン型・モーション・IDE コード描画・シンタックスハイライト・TTS・字幕など）と、**ブランド固有の設定**（色・フォント・ロゴ・読み・声）に分かれている。新しい教材に使うときは、**エンジンには触れず、下のカスタマイズ面だけ**を差し替える。

## 何が汎用で、何が固有か

| 区分 | 中身 | 触るか |
|---|---|---|
| **汎用エンジン** | `src/scenes/*`・`SectionVideo.tsx`・`CaptionOverlay.tsx`・`anim.ts`・`highlight.ts`・`theme.ts`（構造）・`fonts.ts`・`scripts/*`（TTS・pronounce 等） | 触らない（改善はフレームワークへ） |
| **ブランド固有** | `src/brand.ts`・`public/<logo>`・`data/voice.json`・`data/pronunciation.json` | プロジェクトごとに差し替える |
| **教材内容** | `data/<id>.storyboard.json`（各 Section の台本） | Section ごとに書く |

## カスタマイズ面は4つだけ

### 1. `src/brand.ts` — 色・フォント・ロゴ
ここだけ変えれば配色とフォントが切り替わる（`theme.ts` がこれを取り込んで全トークンを組み立てる）。

| フィールド | 意味 |
|---|---|
| `accent` | 要所に効かせる1色（線・マーカー・強調リング・タブ上辺）。サイトの CTA 色などに合わせる |
| `accentEnd` | グラデの端（番号・進捗バー・見出し下線が `accent → accentEnd` のグラデになる） |
| `accentText` | 明面に文字として乗せる読みやすい濃さ |
| `accentDeep` | さらに濃い small text 用 |
| `surfaceTint` / `surfaceTintBorder` | タイトル／まとめの地・カードの淡い色味（無彩色にするなら白系に） |
| `fontJa` | 日本語フォント（サイトに合わせる）。コードは JetBrains Mono 固定 |
| `logo` | 左上ロゴの `public/` からの相対パス |

- **モノクロにしたい**なら accent をグレー系に、surfaceTint を白系（#F7F8FA 等）に
- 淡色〜濃色は `accent` 1色から自動で導かれる（`accentSoft`・`haze` 等）

### 2. `public/<logo>` — 左上ロゴ
`brand.ts` の `logo` パスに合わせて画像（横長ワードマーク推奨・透過 PNG）を置く。全シーンの左上に固定表示される。

### 3. `data/voice.json` — 声・話速・口調
- `gcloudVoice` / `openaiVoice` / `voice`（Gemini）… 使うエンジンの声
- `tempo` … 話速（atempo 倍率。再合成なしで効く。1=等速、>1 速く）
- `stylePrompt` … 口調（Gemini/OpenAI の指示。メンター人格に合わせる）

### 4. `data/pronunciation.json` — 読み辞書
読み上げは `narration` から自動生成され、ここの辞書で **英語・記号だけカタカナ化**する（漢字は残す＝ネイティブ TTS のアクセント保持）。**題材のドメイン用語を追加**する（例: `Eloquent→エロクアント`）。大小文字は無視。

## TTS エンジンの選択
日本語のネイティブ感が要るなら **Google Chirp 3 HD（`tts-gcloud.mjs`）** を推奨（`ja-JP-Chirp3-HD-<名前>`）。ほかに `tts-gemini.mjs`・`tts-openai.mjs`（英語寄りの訛りに注意）・`tts-voicevox.mjs`（無料・ローカル）。いずれも同一 CLI 契約で、`voice.json` の `tempo` と `pronunciation.json` を共有する。各エンジンの API キーは環境変数（`GOOGLE_TTS_API_KEY` 等）。声の聴き比べは `scripts/voice-sample.mjs`。

## 新規プロジェクトのセットアップ手順
1. `video/` 一式をプロジェクトに置く（`npm install`。`@remotion/google-fonts` は remotion と同一バージョンに固定）
2. `src/brand.ts` を編集（accent・surfaceTint・fontJa・logo）
3. `public/<logo>` に左上ロゴを置く
4. `data/voice.json`（声・話速・口調）と `data/pronunciation.json`（ドメイン読み）を設定
5. `npx remotion studio` でデザインをライブ確認 → 固まったら Section ごとに storyboard を書いて生成

## コード中心でない教材について
`codeCompare` シーン（IDE 風コード）はコードがある教材専用。コードを扱わない教材では使わなければよいだけ（`title`・`keypoint`・`flow`・`nest`・`figure`・`outro` で構成する）。エンジンはシーン型に依存しない。
