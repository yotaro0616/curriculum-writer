#!/usr/bin/env python3
"""PostToolUse hook: 教材本文の編集直後に機械チェックを実行する。

Claude Code の Edit / Write ツール実行後に呼ばれる（.claude/settings.json の hooks 参照）。
stdin の JSON（PostToolUse ペイロード）から tool_input.file_path を取り出し、
プロジェクト配下 curriculums/**/*.md のときだけ次を実行する:

  1. scripts/lint_curriculum.py（書式・構造。/write・/review の機械チェックの単一の正）
  2. node_modules/.bin/textlint（日本語文章・AI 臭・表記ゆれ。未インストールなら黙ってスキップ）

違反があれば stderr に出力して exit 2 する。PostToolUse の exit 2 は非ブロッキングで、
stderr が Claude にフィードバックされる（編集自体は完了済み）。対象外のファイルは exit 0。
自動修正（--fix）は行わない。修正の判断は Claude / 執筆者に委ねる。

lint_curriculum.py の 🟡（構造警告）は exit 0 のためこの hook からは通知されない
（部分編集のたびに 🎯/✨ 欠落を警告しないための意図的仕様。🟡 は /write のセルフ
チェックと /review が拾う）。様式（--style）・学習モデル（--section-model）は
スクリプト自身が PROGRESS.md の frontmatter から読むため、この hook から渡す必要はない。
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

SUBPROCESS_TIMEOUT = 90  # 秒（textlint 初回起動の辞書ロードを考慮）


def resolve_project_dir() -> Path:
    """プロジェクトルートを解決する。$CLAUDE_PROJECT_DIR 優先、なければスクリプト位置から導出。"""
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env:
        return Path(env).resolve()
    # .claude/hooks/post-edit-lint.py → 2 つ上がプロジェクトルート
    return Path(__file__).resolve().parents[2]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return 0  # ペイロードが読めない場合はチェックせず通す

    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path")
    if not file_path:
        return 0  # file_path を持たないツール（Bash 等）は対象外

    root = resolve_project_dir()
    target = Path(file_path)
    if not target.is_absolute():
        target = root / target
    target = target.resolve()

    # プロジェクト配下 curriculums/**/*.md のみ検査する
    try:
        rel = target.relative_to(root)
    except ValueError:
        return 0
    if rel.parts[:1] != ("curriculums",) or target.suffix.lower() != ".md":
        return 0
    if not target.is_file():
        return 0  # 削除・リネーム直後など

    sections: list[str] = []

    # 1) lint_curriculum.py（書式・構造チェック）
    lint_script = root / "scripts" / "lint_curriculum.py"
    if lint_script.is_file():
        result = subprocess.run(
            [sys.executable, str(lint_script), str(target)],
            capture_output=True, text=True, timeout=SUBPROCESS_TIMEOUT, cwd=str(root),
        )
        if result.returncode == 2:
            output = (result.stdout + result.stderr).strip()
            sections.append(f"[lint_curriculum.py]\n{output}")

    # 2) textlint（インストール済みの場合のみ）
    textlint_bin = root / "node_modules" / ".bin" / "textlint"
    if textlint_bin.is_file():
        result = subprocess.run(
            [str(textlint_bin), "--no-color", str(target)],
            capture_output=True, text=True, timeout=SUBPROCESS_TIMEOUT, cwd=str(root),
        )
        if result.returncode != 0:
            output = (result.stdout + result.stderr).strip()
            sections.append(f"[textlint]\n{output}")
    elif sections and (root / "package.json").is_file():
        # lint 違反を通知するついでに、textlint が動いていないことも知らせる
        sections.append("[textlint] 未導入のためスキップしました（`npm ci` で有効化できます）")

    if sections:
        header = (
            f"機械チェックで違反を検出しました: {rel}\n"
            "編集内容は保存済みです。以下を .claude/rules/writing.md に沿って修正してください。\n"
        )
        print(header + "\n\n".join(sections), file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # フック自体の不具合で執筆を止めない
        print(f"post-edit-lint hook 内部エラー（チェックをスキップしました）: {exc}", file=sys.stderr)
        sys.exit(0)
