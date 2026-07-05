---
name: revise
description: |
  執筆後・公開後の教材を安全に改訂する変更管理フロー（提案 → 承認 → 適用 → 検収 → アーカイブ）。
  Section の新設・削除・移動・改番、複数 Section にまたがる方針・用語の変更、哲学（CLAUDE.md）の変更で使用する。
  「章を分割したい」「構成を変えたい」「〜を教材全体で変えたい」「このセクションを廃止したい」など。/check-updates の 🔴🟡 報告への対応でも使用する。
argument-hint: "[変更の概要 | --archive <slug>]"
---

# 改訂の変更管理

教材の Section 間には暗黙の依存（接続文キーワード・初出参照・グループ全体像テーブル・番号・図/動画）があり、無計画な構成変更は連鎖破壊を起こす（実例: 章の3節化が動画8本＋概念図の再生成を同日に連鎖させた）。改訂は提案として隔離し、影響範囲を先に洗い出してから適用する。

**入力**: $ARGUMENTS（`--archive <slug>` の場合は「5. アーカイブ」だけを実行する）

---

## 0. しきい値判定（先に必ず）

| 変更 | 扱い |
|---|---|
| 誤字・リンク切れ・単一 Section 内に閉じる修正 | **/revise 不要**。/write のトリアージ（軽微修正）で直接編集する |
| Section の新設・削除・移動・改番 / 複数 Section にまたがる方針・用語の変更 / 様式ロック後の様式変更 | **/revise 必須** |
| ペルソナ・コンセプト・ゴール（CLAUDE.md の哲学）の変更 | **/revise 最重量**: 影響半径が最大のため、全 Section への波及評価を提案に含める |

## 1. 提案の作成（`changes/<slug>/`）

**適応的深度**: 影響半径に応じて提案の重さを変え、proposal.md 冒頭に宣言する。

- 軽（影響 1〜2 Section・番号変更なし）: proposal.md のみ
- 標準: proposal.md + outline-delta.md + tasks.md
- 重（章構成の組み替え・改番あり）: 標準 + 再設計メモ（新旧構成の対比）

**proposal.md**: Why（きっかけ: ユーザー要望 / check-updates 報告 / 通読レビュー / 誤り発見）/ What（変更内容の要約）/ 深度の宣言

**outline-delta.md**: OUTLINE.md への変更を次の見出しで書く。MODIFIED は差分ではなく**エントリの完全な新版**を書き、変更点に `（旧: …）` 注記を添える（機械的に適用でき、新旧比較でレビューできる）:

```markdown
## ADDED Sections
## MODIFIED Sections
## REMOVED Sections
```

**tasks.md**: 下の影響範囲チェックリストを全走査して生成した作業項目（チェックボックス）。適用の監査証跡になり、中断しても未完了から再開できる。

### 影響範囲チェックリスト（毎回全項目を走査する）

1. **前後の接続文**: 変更 Section の前 Section の末尾接続文（次ゴールのキーワードを含む規則のため、ゴール変更は前 Section に波及する）
2. **初出参照**: 「2回目以降は初出 Section への参照」規則により、削除・移動が後続の参照を壊さないか（grep で列挙）
3. **グループ全体像テーブル**: Chapter 先頭 Section のセクション一覧・進め方
4. **番号・パス・スラッグ**: Section 番号・ファイル/ディレクトリ名・GitHub Pages の nav とスラッグ（公開後の改番は原則避け、やむを得ない場合はリダイレクトの要否を明記）
5. **図・動画の再生成**: assets/diagrams・video/data（storyboard）・GitHub Releases の該当有無と再生成コストの見積もり
6. **PROGRESS.md のキー**: 進捗表の Section 行の追加・削除・改番
7. **CLAUDE.md のカリキュラム表**・OUTLINE 付録（やってみよう表・ハンズオン共通方針）

## 2. 承認

proposal（＋delta・tasks）をユーザーに提示する。**承認までは curriculums/ に触れない**。

## 3. 適用

/write を再利用する（proposal と delta をブリーフとして渡す。トリアージは「構成変更を伴う」扱いだが、承認済み提案があるため停止しない）。tasks.md を1件ずつチェックしながら進め、専用コミットにする（他の変更と混載しない）。

## 4. 検収

/review を「変更スコープモード」で実行する: 網羅性（tasks 全消化・delta 全反映）/ 正確性（本文が新ゴールを満たす）/ 整合性（接続文・初出参照・用語・全体像テーブルの横断一致）。

## 5. アーカイブ（`/revise --archive <slug>`）

1. outline-delta.md を OUTLINE.md へセクション単位でマージする（ADDED は追加・MODIFIED は置換・REMOVED は削除）
2. `CHANGELOG.md`（読者向け更新履歴。無ければ作成）に1行追記する: `- YYYY-MM-DD: [Why/What の要約]`
3. `changes/<slug>/` を `changes/archive/YYYY-MM-DD-<slug>/` へ移動する
4. PROGRESS.md を更新する（改番の反映・該当 Section の review 列リセット等）

## 運用

- 同時に進める change は原則1件（単線。並行させると OUTLINE マージが衝突する）
- /check-updates の 🔴（既存解説が誤りになる）・🟡（主要な変更）は、このスキルで提案を作るのが正式な入口
