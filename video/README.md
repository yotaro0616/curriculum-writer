# video/ — Section 解説動画ワークスペース（Remotion）

教材の各 Section から「解説スライド + ナレーション + 字幕」の mp4 を生成する Remotion ワークスペース。
使い方の全体は `.claude/skills/animate/SKILL.md` を参照。

> ⚠️ **Remotion ライセンス**: 従業員 4 名以上の企業での利用は Company License が必要です。
> 評価（PoC）は無償ですが、「技術スタックに組み込む決定」をした時点で課金対象になります。
> 量産・公開の前に [remotion.pro](https://www.remotion.pro/license) でライセンスを取得してください。

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

- TTS エンジンは差し替え可能（`scripts/tts-voicevox.mjs` が同一 CLI 契約の代替実装。無料・ローカル・要クレジット表記）
- 生成物（`public/audio/` と `out/`）は git 管理外。コミットするのは storyboard JSON と設定のみ
- 配信は GitHub Releases を想定（mp4 はリポジトリにコミットしない）
