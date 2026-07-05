# .claude-plugin/ 運用メモ

教材執筆フレームワーク（curriculum-writer）を Claude Code plugin として配布するための設定。
配布は「**plugin（skills + agents を marketplace 経由で自動更新）+ GitHub テンプレート（プロジェクト骨格）**」の2層構成で行う。

## 1. 2ファイルの役割

| ファイル | 役割 |
|---|---|
| `plugin.json` | plugin 本体のマニフェスト。名前 `cw`（スキルは `/cw:write` のように名前空間化される）と説明・作者のみを定義する |
| `marketplace.json` | 配布カタログ。このリポジトリ自身（`source: "./"`）を plugin `cw` として公開し、コンポーネントの読み込み先を `.claude/skills` / `.claude/agents` のカスタムパスで指定する |

設計上のポイント:

- **version は意図的に省略**している。git 配布では version 省略時に commit SHA が版として扱われ、**commit = 新バージョン**として自動更新される（内部配布向けの運用。公式ドキュメントの Version resolution 参照）。version を書くと、その文字列を上げない限り利用者に更新が届かなくなるので書かないこと
- `skills` はディレクトリ指定（`"./.claude/skills"`）が可能。`source: "./"`（marketplace ルート）の場合、列挙したパスがそのエントリの完全な集合になり、デフォルトの `skills/` スキャンを置き換える
- `agents` は **ディレクトリ指定不可**（スキーマエラー `Invalid input` になる）。`.md` ファイルを 1 件ずつ配列で列挙する必要がある。**`.claude/agents/` にエージェントを追加・改名したら `marketplace.json` の列挙も必ず更新する**
- ドット始まりディレクトリ（`./.claude/...`）のカスタムパスは、スキーマ検証・実行時ロードとも問題ないことを確認済み（2026-07-05・Claude Code v2.1.201 で実測）

検証コマンド（CI や変更時に実行）:

```bash
claude plugin validate .
```

「version 未指定」の警告 1 件は意図どおりなので許容する。この警告がある限り `--strict` は exit 1 になるため、CI で `--strict` は使わない。

## 2. 導入手順（利用側プロジェクト）

```text
/plugin marketplace add yotaro0616/curriculum-writer
/plugin install cw@curriculum-writer
```

- インストール後、スキルは `/cw:write` `/cw:review` のような名前空間付きで使える
- 自動更新（auto-update）を ON にしておくと、FW リポジトリへの push（= 新 commit）が新バージョンとして配布される。`/plugin` の管理画面で cw の auto-update を有効にする
- 手動更新は `/plugin marketplace update curriculum-writer` → `claude plugin update cw`

## 3. 段階 PoC の残り手順

現在は **第1段階（マニフェスト整備と検証）まで完了**。既存の `.claude/skills` / テンプレートは変更していない。

1. **1 プロジェクトで導入検証**: 展開済み教材プロジェクト 1 つに marketplace add + install し、`/cw:*` スキルとエージェントの動作・自動更新を確認する。このとき検証プロジェクト側の `.claude/skills` は一時退避し、shadow 二重ロード（下記 4.）を避ける
2. **全プロジェクト展開**: 検証で問題なければ全教材プロジェクトに導入する
3. **テンプレート側の切り替え（一斉に行う）**: この時点で初めて、GitHub テンプレートから `.claude/skills` を撤去し、`.claude/settings.json` に `extraKnownMarketplaces` を同梱する。移行を一斉に行うのは、plugin と `.claude/skills` の両方から同名スキルがロードされる二重化を避けるため

## 4. shadow 二重ロードの注意

plugin（`/cw:write`）とプロジェクトの `.claude/skills`（`/write`）は **同時にロードされ、両方がスキル一覧に載る**。同名スキルの併存はモデルの起動判断を混乱させ、どちらが実行されるか安定しないため、**plugin を導入したプロジェクトでは `.claude/skills` の同名スキルを残さない**こと（agents も同様。プロジェクトやユーザーの `.claude/agents/` にある同名定義が plugin 側より優先される）。

## 5. FW 自身の開発（自己ホスト）

- FW リポジトリでの通常開発は plugin 不要。`.claude/skills` / `.claude/agents` がプロジェクト設定としてそのまま（名前空間なしで）ロードされる
- plugin としての挙動（`/cw:` 名前空間・コンポーネント解決）を確認したいときは自己ホストする:

```bash
claude --plugin-dir .
```

⚠️ 実測（v2.1.201）: `--plugin-dir` は `plugin.json` のみを読み、`marketplace.json` のエントリ（カスタムパス）を適用しない。本リポジトリの構成ではカスタムパスを marketplace 側に置いているため、`--plugin-dir .` では cw の skills / agents は載らない。marketplace 経由の解決まで含めて確認する場合は、ローカルパスを marketplace として登録する:

```text
/plugin marketplace add /path/to/curriculum-writer
/plugin install cw@curriculum-writer
```

（確認が終わったら `/plugin marketplace remove curriculum-writer` で外す）
