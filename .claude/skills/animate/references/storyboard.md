# ストーリーボード仕様と台本の執筆ルール

ストーリーボードは動画の **単一の真実**（差分管理する設計図）。`video/data/<sectionId>.storyboard.json` に置く。
TTS スクリプトがこれを読み、音声と実測尺を埋めた `<sectionId>.props.json` を生成する（props.json は成果物なので手で編集しない）。

## トップレベル

```json
{
  "sectionId": "1-2-1",
  "sectionLabel": "Part 1 ○○の基礎 / Chapter 2 △△",
  "title": "変数と型",
  "scenes": [ ... ]
}
```

## シーン共通フィールド

| フィールド | 必須 | 内容 |
|---|---|---|
| `id` | ✅ | シーン識別子（kebab-case。音声ファイル名や修正指示に使う） |
| `type` | ✅ | シーン型（下記カタログ） |
| `heading` | title 以外 | 画面左上の見出し（Section の `##` 見出しに対応させる） |
| `narration` | ✅ | 字幕に表示する原稿（漢字・英字表記のまま） |
| `reading` | ✅ | TTS に渡す読み上げ原稿（読み辞書でカタカナ展開済み） |

`audioSrc` / `audioFrames` / `totalFrames` は TTS スクリプトが埋めるので書かない。

## シーン型カタログ

- **title**: `sectionNo` / `title` / `subtitle`（導入の問いかけ 1 文）
- **codeCompare**: `left` / `right` の 2 ペイン。各ペインは `label`・`labelColor`（言語のブランドカラーを 16 進で指定。省略すると `theme.primary` が既定色）・`lines`（コード行の配列。コメントは `//` 以降が自動で淡色化）・`errorLine`（0 始まり。コンパイルエラー演出を付ける行）・`caption`（ペイン下の一言。errorLine があると赤字になる）。右ペインはナレーション後半（45% 時点）で登場する
- **keypoint**: `cards`（2 枚。`title` と `body`）。二項対立の整理用
- **figure**: `src`（`figures/<name>.jpg`。事前に `assets/diagrams/output/` から `video/public/figures/` へ cp する）・`alt`
- **flow**: `steps`（`label`・`sub`・`emphasis`）+ 任意の `fanout`（分岐先チップ）+ 任意の `tagline`（締めの標語）
- **nest**: `layers`（**内側 → 外側**の順に 3 つまで。`label`・`desc`）+ 任意の `formula`（例: `JDK ⊃ JRE ⊃ JVM`）
- **outro**: `points`（まとめ 4 点以内）+ `next`（次セクション番号とタイトル）

## narration（字幕用原稿）の書き方

- 敬体。writing.md の文体・用語ルールに従う（ダッシュ記号は使わない）
- **音読して自然な文** にする（字幕は文・読点単位で分割表示され、文字送りされる）
- 1 文 50 字以内を目安に句点で区切る。コード記号の読み上げは避け、口頭の言い回しに直す（`int x = 1;` →「int の変数に 1 を入れる」）
- まとめシーンの最後は次セクションへの接続文で締める

## reading（読み上げ用原稿）の書き方

- narration と同じ内容を、**読み辞書 `video/data/pronunciation.json` を適用してカタカナ展開** したもの
- 辞書にない英語用語・記号が出てきたら、**先に辞書へ追加してから** reading に使う（プロジェクト全体で読みを統一するため）
- 間を取りたい位置に読点を増やしてよい（narration と句読点が一致する必要はない）
- 数字の読みが紛れやすい箇所はひらがな・カタカナで明示する（「1-2-1」→「いち、に、いち」）

## 検収（QA）

1. レンダ後、シーン中間フレームを 3〜4 枚 still 書き出しして Read で目視（文字切れ・はみ出し・字幕の重なり）
2. 冒頭シーンの音声を試聴（読み・速度・トーン）。読み間違いは SKILL.md の「音声・台本の修正サイクル」で直す
3. 尺が 3 分を超えていたら narration を削る（シーンを削るより文を削る）
