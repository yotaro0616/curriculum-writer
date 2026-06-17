# ストーリーボード仕様と台本の執筆ルール

ストーリーボードは動画の **単一の真実**（差分管理する設計図）。`video/data/<sectionId>.storyboard.json` に置く。
TTS スクリプトがこれを読み、音声と実測尺を埋めた `<sectionId>.props.json` を生成する（props.json は成果物なので手で編集しない）。

動画の役割（要約ではなく Section の主たる学習路）と尺・シーン数の基準は `criteria.md` を参照する。本ファイルは JSON の形式と台本の書き方を定める。

## トップレベル

```json
{
  "sectionId": "1-2",
  "sectionLabel": "Part 1 学習の地図と PHP OOP / Chapter 1",
  "title": "PHP OOP の基礎",
  "scenes": [ ... ]
}
```

- `sectionId` は教材のセクション番号（2 連番。例 `1-2`・`8-1`）。音声フォルダ名・mp4 名・配信 URL に使う
- `sectionLabel` は画面右上のチップと title シーンのラベルに出る（`Part X タイトル / Chapter Y` 形式）

## シーン共通フィールド

| フィールド | 必須 | 内容 |
|---|---|---|
| `id` | ✅ | シーン識別子（kebab-case。音声ファイル名や修正指示に使う） |
| `type` | ✅ | シーン型（下記カタログ） |
| `heading` | title 以外 | 画面左上の見出し（Section の `##` 見出しに対応させる） |
| `narration` | ✅ | 字幕に表示する原稿（漢字・英字表記のまま） |
| `reading` | 任意 | 読み上げを個別調整したい時だけ。通常は **書かず** narration から自動生成する（下記「reading」参照） |

`audioSrc` / `audioFrames` / `totalFrames` は TTS スクリプトが埋めるので書かない。

## シーン型カタログ

- **title**: `sectionNo` / `title` / `subtitle`（導入の問いかけ 1 文）
- **codeCompare**: `left` / `right` の 2 ペイン。各ペインは **IDE ウィンドウ風**（信号機ドット＋ファイル名タブ＋行番号＋VSCode 風シンタックスハイライト、`src/highlight.ts` が自動で色付け）で描画される。フィールド: `file`（タブのファイル名。例 `app/Models/Task.php`。省略時は `label`）・`lines`（コード行）・`errorLine`（0 始まり。エラー演出）・`caption`（ペイン下の一言）。`rightAt`（0〜1）で右ペインの登場を **ナレーションが右の話に移る位置** に合わせる（既定 0.45）
  - コードは「読み解く対象」。長すぎる全文は載せず、要点の数行に絞る（コピペ用の全文は本文が担う）
- **keypoint**: `cards`（2 枚。`title` と `body`）。二項対立・定義の対比用（1 枚目がティールアクセント、2 枚目が無彩色の濃スレート）。`body` は `\n` で改行でき、要素を1行ずつ並べると構造的で読みやすい（長い1文の自動折り返しは避ける）。`revealAt`（各カードの登場比、例 `[0.05, 0.45]`）で **各概念にナレーションが触れる位置** に合わせる
- **figure**: `src`（`figures/<name>.jpg`。事前に `assets/diagrams/output/` から `video/public/figures/` へ cp する）・`alt`。/illustrate の白背景の概念図を額装して見せる
- **flow**: `steps`（`label`・`sub`・`emphasis`）+ 任意の `fanout`（分岐先チップ）+ 任意の `tagline`（締めの標語）。`emphasis: true` のステップは鋼色で強調される。矢印は無彩色
- **nest**: `layers`（**内側 → 外側**の順に 3 つまで。`label`・`desc`）+ 任意の `formula`（例: `App\Models ⊃ Task`）
- **outro**: `points`（まとめ 4 点以内。Section の ✨ に対応）+ `next`（次セクション番号とタイトル）

### 記号の安全性

ラベル・formula に使う記号は、フォントで確実に出るものに限る。矢印は `→` `↔`、包含は `⊃`、区切りは `/` を使う。`⇄` など稀な記号はフォント次第で別の字（`≠` 等）に化けることがあるので避ける。コード記号（`->` `::` `$`）はコード行（`lines`）の中だけで使い、ラベルや narration には持ち込まない。

## narration（字幕用原稿）の書き方

- 敬体。writing.md の文体・用語ルールに従う（ダッシュ記号 `—` は使わない）
- **音読して自然な文** にする（字幕は文・読点単位で分割表示され、文字送りされる）
- 1 文 50 字以内を目安に句点で区切る。コード記号の読み上げは避け、口頭の言い回しに直す（`$this->done = true;` →「this が指すインスタンスの done を true にする」）
- Why → What → How の流れを台本全体で通す。各シーンの narration は前のシーンを受けて自然につながるようにする
- outro シーンの最後は次セクションへの接続文で締める（OUTLINE.md の次セクションのゴールのキーワードを含める）

## reading（読み上げ原稿）— 通常は書かない

読み上げ音声は **narration から自動生成** される（`scripts/pronounce.mjs`）。`data/pronunciation.json` の辞書で **英語・技術用語・記号だけをカタカナ化**し、**漢字・かなはそのまま残す**。これはネイティブ TTS（Google Chirp / VOICEVOX 等）が **漢字から正しいアクセントを推定する** ため。漢字をかなに開くと逆に棒読み・誤アクセントになる（過去にこれで失敗した）。

- **新しい英語用語・記号が出たら `pronunciation.json` に追加**する（例 `Task→タスク`・`extends→エクステンズ`・`$fillable→フィラブル`）。大小文字は無視されるので 1 エントリで足りる
- 生成前に取り残しを確認: 全シーンの `spokenForScene` 出力を grep し、英字が残っていたら辞書へ追加
- どうしても個別に読み・間を調整したいシーンだけ `scene.reading` を明示する（あれば最優先）
- 話速は `voice.json` の `tempo`（atempo 倍率。再合成不要）。数字の紛れは narration 側で工夫

## 検収（QA）

1. レンダ後、シーン中間フレームを 3〜4 枚 still 書き出しして Read で目視（文字切れ・はみ出し・字幕の重なり・ラベルの化け）
2. 冒頭シーンの音声を試聴（読み・速度・トーン）。読み間違いは SKILL.md の「音声・台本の修正サイクル」で直す
3. 尺が 6 分を大きく超えていたら narration を削る（シーンを削るより文を削る）。逆に 3 分に満たず説明が足りないなら、🎯 / ✨ の取りこぼしがないか確認する
