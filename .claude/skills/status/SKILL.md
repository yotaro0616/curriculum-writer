---
name: status
description: |
  PROGRESS.md と実ファイルを突合して、教材の進捗を同期・報告する。
  「進捗は？」「どこまで終わってる？」「次は何をすればいい？」「ステータスを見せて」など、進捗確認の依頼で使用する。
argument-hint: "[スコープ(任意)]"
---

# 進捗の同期・報告

**入力**: $ARGUMENTS

## 手順

1. `PROGRESS.md` を Read する（無ければ `/setup` の実行を案内して終了）
2. **実態との突合**: 表の各列を実ファイルから検証し、乖離があれば PROGRESS.md を実態に合わせて更新する
   - 骨子: OUTLINE.md の該当 Section に `見出し骨子:` が充填済みか
   - draft: `curriculums/` に実ファイルがあるか
   - 図: Section 内に `assets/diagrams/output/` への画像タグがあるか
   - 動画: Section 内に `<video>` タグがあるか
   - 公開: 実デプロイ状態は `/github-pages` のデプロイ確認を正とし、この列は上書きしない（`docs/` はビルド出力で gitignore 対象。fresh clone・push 運用では存在しないため進捗判定に使わない）
3. **報告**:
   - ゲート状態（G1 調査 / G2 哲学 / G3 構成 / G4 様式ロック。省略した場合はその旨）
   - 進捗率（Section 単位: 骨子 / draft / review / 図 / 動画 / 公開 の列ごと）
   - 未着手・保留の一覧（OUTLINE 付録「やってみよう表」の保留、`<!-- TODO -->` プレースホルダの残存を含む）
   - 進行中の change（`changes/` 配下でアーカイブされていないもの）
   - **次の推奨アクション**（/setup のルーター表と同じ判定。例: 「G4 未了 → /pilot」「2-3 の骨子が未充填 → /outline 2-3」）

## 注意

- このスキルは報告と PROGRESS.md の同期のみを行う。教材本文・OUTLINE は変更しない
- review 列は自己申告になりやすいため、疑わしい場合は「最終 review 日時が draft 更新より古い」ことを指摘するに留める
