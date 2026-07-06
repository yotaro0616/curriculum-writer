#!/usr/bin/env python3
"""教材本文（curriculums/**/*.md）の機械チェック。

このスクリプトが /write・/review の機械チェックの単一の正（Single Source of Truth）。
.claude/rules/writing.md の書式ルールのうち機械判定できるものを実装する。
文章品質（AI 臭・日本語技術文書ルール・表記ゆれ）は textlint（.textlintrc.json + prh.yml）が担い、
本スクリプトは Markdown の書式・構造の破れを検出する。標準ライブラリのみで動作する。

使い方:
    python3 scripts/lint_curriculum.py [--style emoji|admonition] [--json] <file|dir>...

    --style 省略時は、カレントディレクトリの PROGRESS.md frontmatter の `style:`
    （/pilot が設定する様式の単一ソース）を読む。それも無ければ emoji。

検出ルール（--style emoji: 既定。絵文字プレフィックス様式の教材向け）:
    🔵 broken-bold             閉じ ** の直後にスペースも改行もなく日本語・全角括弧が続く（太字が壊れる）
    🔵 sentence-bold           文全体の太字（** の中身が 30 字以上。太字は語句・キーフレーズに限定する）
    🔵 dash-char               ダッシュ記号（– — ― / ——）
    🔵 code-fence-language     言語指定なしコードブロック（非コードコンテンツには text を指定する）
    🔵 emoji-not-allowed       writing.md の定義済み 11 絵文字（🎯 ✨ 💡 ⚠️ 📝 🔑 🏃 🧠 📌 ✅ 📖）以外の絵文字
    🔵 absolute-path           環境依存の絶対パス（/Users/ /home/）
    🟡 missing-goal-heading    「## 🎯」見出しが無い（Section の必須構造）
    🟡 missing-summary-heading 「## ✨」見出しが無い（Section の必須構造）

検出ルール（--style admonition: 将来用。MkDocs Material の admonition 記法へ移行した教材向け）:
    🔵 emoji-forbidden         絵文字全般（admonition スタイルでは絵文字プレフィックスを使わない）
    🔵 admonition-indent       !!! / ??? 直後の内容行の字下げが 4 スペース未満
    （broken-bold / sentence-bold / dash-char / code-fence-language / absolute-path は両スタイル共通。
      🎯 / ✨ の構造チェックは emoji スタイル専用。admonition 本文の字下げ 0 は通常段落と
      区別できないため検出対象外＝1〜3 スペースのみ検出する）

検査スコープ:
    - コードブロック内・インラインコード内は太字・ダッシュ・絵文字の検査対象外（フェンス追跡）
    - 絶対パスはコードブロック内も検査する（コピペ手順への環境依存パス混入を検出するため）

出力:  path:line: [🔵|🟡] rule-id: メッセージ（--json で JSON 配列）
終了コード:  🔵 違反あり = 2 / クリーン（🟡 のみを含む）= 0 / 引数・入出力エラー = 1
    （🟡 のみのファイルは exit 0 のため PostToolUse hook・CI からは通知されない。
      部分編集のたびに構造警告を出さないための意図的仕様で、🟡 は /write の
      セルフチェックと /review が拾う）
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------

# writing.md「絵文字」テーブルで定義された 11 絵文字（⚠️ は ⚠ + VS16 のため基底文字で保持）
ALLOWED_EMOJI = set("🎯✨💡📝🔑🏃🧠📌✅📖") | {"⚠"}  # ⚠

# 絵文字とみなす Unicode 範囲（→ U+2192 などの矢印・罫線素片は含めない）
EMOJI_RANGES = (
    (0x1F000, 0x1FBFF),  # 絵文字本体（Misc Symbols and Pictographs / Supplemental など）
    (0x2600, 0x27BF),    # Miscellaneous Symbols / Dingbats（⚠ ✅ ✨ ✔ ➜ など）
    (0x2B00, 0x2BFF),    # ⭐ ⬆ など
    (0x203C, 0x203C),    # ‼
    (0x2049, 0x2049),    # ⁉
)

# 表示に影響しない結合用コードポイント（検査時に読み飛ばす）
JOINER_CHARS = {"️", "‍", "⃣"}  # VS16 / ZWJ / 囲み用キー

# 禁止ダッシュ（writing.md: ——・—・– を使わない。― は同型の全角ダッシュとして含める）
DASH_CHARS = {"–": "–", "—": "—", "―": "―"}

# 太字スパン（同一行内で完結する ** ペア）
BOLD_RE = re.compile(r"\*\*([^*\n]+?)\*\*")

# インラインコード（`...` / ``...``。同じ長さの空白に置換して位置を保つ）
INLINE_CODE_RE = re.compile(r"(`+)([^`]+?)\1")

# コードフェンス（blockquote 記号を剥がした後に判定）
FENCE_RE = re.compile(r"^( {0,3})(`{3,}|~{3,})[ \t]*(.*)$")
BLOCKQUOTE_PREFIX_RE = re.compile(r"^(?:[ \t]{0,3}>[ \t]?)+")

# 環境依存の絶対パス（直前が英数字・ピリオドなら URL のパス部とみなして除外:
# https://example.com/home/... を誤検出しない）
ABS_PATH_RE = re.compile(r"(?<![A-Za-z0-9.])/(?:Users|home)/[^\s'\"`)\]]*")

# Section の必須構造（見出しは ## レベル。前置きスペースは Markdown 仕様の 0-3 を許容）
GOAL_HEADING_RE = re.compile(r"^ {0,3}##\s*🎯")
SUMMARY_HEADING_RE = re.compile(r"^ {0,3}##\s*✨")

# MkDocs Material の admonition ヘッダ（!!! type / ??? type / ???+ type）
ADMONITION_HEADER_RE = re.compile(r"^ {0,3}(?:!{3}|\?{3}\+?)(?:\s|$)")

SEVERITY_ERROR = "error"      # 🔵
SEVERITY_WARNING = "warning"  # 🟡
MARKS = {SEVERITY_ERROR: "🔵", SEVERITY_WARNING: "🟡"}

FULL_BOLD_THRESHOLD = 30  # ** の中身がこの字数以上なら「文全体の太字」とみなす


# ---------------------------------------------------------------------------
# 判定ヘルパー
# ---------------------------------------------------------------------------

def is_emoji(ch: str) -> bool:
    code = ord(ch)
    return any(lo <= code <= hi for lo, hi in EMOJI_RANGES)


def is_japanese_or_fullwidth_paren(ch: str) -> bool:
    """閉じ ** の直後に来ると太字が壊れる文字か（日本語の字・全角括弧）。

    句読点（。、）や全角コロンは CommonMark 上は約物として扱われ太字が壊れないため対象外。
    """
    if ch in ("（", "）"):
        return True
    code = ord(ch)
    return (
        0x3040 <= code <= 0x30FF      # ひらがな・カタカナ（ー を含む）
        or code == 0x3005             # 々
        or 0x3400 <= code <= 0x4DBF   # CJK 拡張 A
        or 0x4E00 <= code <= 0x9FFF   # CJK 統合漢字
        or 0xF900 <= code <= 0xFAFF   # CJK 互換漢字
    )


def mask_inline_code(line: str) -> str:
    """インラインコードを同じ長さの空白に置換する（列位置を保ったまま検査対象外にする）。"""
    return INLINE_CODE_RE.sub(lambda m: " " * len(m.group(0)), line)


# ---------------------------------------------------------------------------
# Lint 本体
# ---------------------------------------------------------------------------

class Finding:
    __slots__ = ("path", "line", "severity", "rule", "message")

    def __init__(self, path: str, line: int, severity: str, rule: str, message: str):
        self.path = path
        self.line = line
        self.severity = severity
        self.rule = rule
        self.message = message

    def format(self) -> str:
        return f"{self.path}:{self.line}: {MARKS[self.severity]} {self.rule}: {self.message}"

    def to_json(self) -> dict:
        return {
            "path": self.path,
            "line": self.line,
            "severity": self.severity,
            "mark": MARKS[self.severity],
            "rule": self.rule,
            "message": self.message,
        }


def lint_file(path: Path, style: str) -> list[Finding]:
    findings: list[Finding] = []
    display = str(path)

    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise RuntimeError(f"{display}: 読み込みに失敗しました: {exc}") from exc

    lines = text.splitlines()

    in_fence = False
    fence_char = ""
    fence_len = 0

    has_goal = False
    has_summary = False

    # admonition 追跡: ヘッダ行を見つけたら、次の非空行の字下げを検査する
    pending_admonition_line = 0  # 0 = 検査待ちなし

    for lineno, raw in enumerate(lines, start=1):
        # blockquote 記号（> ）を剥がしてフェンス判定する（引用内のコードブロックに対応）
        bq = BLOCKQUOTE_PREFIX_RE.match(raw)
        content = raw[bq.end():] if bq else raw

        fence_m = FENCE_RE.match(content)

        if in_fence:
            # 閉じフェンス: 同種の記号が開始時以上の長さで、後続文字列なし
            if (
                fence_m
                and fence_m.group(2)[0] == fence_char
                and len(fence_m.group(2)) >= fence_len
                and fence_m.group(3).strip() == ""
            ):
                in_fence = False
            else:
                # フェンス内: 絶対パスのみ検査（コピペ手順への環境依存パス混入を検出）
                check_absolute_path(findings, display, lineno, raw)
            continue

        if fence_m:
            # 開きフェンス
            in_fence = True
            fence_char = fence_m.group(2)[0]
            fence_len = len(fence_m.group(2))
            info = fence_m.group(3).strip()
            if info == "":
                findings.append(Finding(
                    display, lineno, SEVERITY_ERROR, "code-fence-language",
                    "言語指定なしコードブロックです。コードは言語名、非コードコンテンツ"
                    "（ディレクトリツリー・コマンド出力等）は text を指定してください",
                ))
            continue

        # ---- フェンス外の検査 ----

        # 構造チェック用の見出し検出（emoji スタイルのみ利用）
        if GOAL_HEADING_RE.match(raw):
            has_goal = True
        if SUMMARY_HEADING_RE.match(raw):
            has_summary = True

        # admonition の字下げ検査（admonition スタイルのみ）
        if style == "admonition":
            if pending_admonition_line and raw.strip():
                indent = len(raw) - len(raw.lstrip(" "))
                if 1 <= indent <= 3:
                    findings.append(Finding(
                        display, lineno, SEVERITY_ERROR, "admonition-indent",
                        f"admonition の内容行の字下げが {indent} スペースです。"
                        "4 スペースで字下げしてください",
                    ))
                pending_admonition_line = 0
            if ADMONITION_HEADER_RE.match(content):
                pending_admonition_line = lineno
                continue

        # 絶対パス（インラインコード内も対象とするため raw で検査）
        check_absolute_path(findings, display, lineno, raw)

        # 以降はインラインコードを除外した本文で検査
        work = mask_inline_code(raw)

        # ダッシュ記号
        dashes = sorted({DASH_CHARS[ch] for ch in work if ch in DASH_CHARS})
        if dashes:
            findings.append(Finding(
                display, lineno, SEVERITY_ERROR, "dash-char",
                f"ダッシュ記号 {' '.join(dashes)} は使いません。読点・括弧・コロン等で言い換えてください",
            ))

        # 絵文字
        check_emoji(findings, display, lineno, work, style)

        # 太字の書式
        for m in BOLD_RE.finditer(work):
            inner = m.group(1)
            if len(inner) >= FULL_BOLD_THRESHOLD:
                findings.append(Finding(
                    display, lineno, SEVERITY_ERROR, "sentence-bold",
                    f"文全体の太字です（{len(inner)} 字）。太字は語句・キーフレーズに限定してください",
                ))
            nxt = work[m.end():m.end() + 1]
            if nxt and is_japanese_or_fullwidth_paren(nxt):
                findings.append(Finding(
                    display, lineno, SEVERITY_ERROR, "broken-bold",
                    f"閉じ ** の直後に「{nxt}」が続いています。太字が適用されないため"
                    f"半角スペースを入れてください（例: **{inner}** {nxt}）",
                ))

    # ---- ファイル全体の構造チェック（emoji スタイルのみ） ----
    if style == "emoji":
        if not has_goal:
            findings.append(Finding(
                display, 1, SEVERITY_WARNING, "missing-goal-heading",
                "「## 🎯 このセクションで学ぶこと」見出しがありません（Section の必須構造）",
            ))
        if not has_summary:
            findings.append(Finding(
                display, 1, SEVERITY_WARNING, "missing-summary-heading",
                "「## ✨ まとめ」見出しがありません（Section の必須構造）",
            ))

    return findings


def check_absolute_path(findings: list[Finding], path: str, lineno: int, line: str) -> None:
    m = ABS_PATH_RE.search(line)
    if m:
        findings.append(Finding(
            path, lineno, SEVERITY_ERROR, "absolute-path",
            f"環境依存の絶対パス「{m.group(0)}」が含まれています。"
            "読者の環境で再現できる相対パス・プレースホルダーに置き換えてください",
        ))


def check_emoji(findings: list[Finding], path: str, lineno: int, line: str, style: str) -> None:
    offending: list[str] = []
    for ch in line:
        if ch in JOINER_CHARS:
            continue
        if not is_emoji(ch):
            continue
        if style == "emoji" and ch in ALLOWED_EMOJI:
            continue
        offending.append(ch)
    if not offending:
        return
    uniq = sorted(set(offending), key=offending.index)
    if style == "admonition":
        findings.append(Finding(
            path, lineno, SEVERITY_ERROR, "emoji-forbidden",
            f"絵文字 {' '.join(uniq)} が使われています。admonition スタイルでは絵文字を使いません",
        ))
    else:
        findings.append(Finding(
            path, lineno, SEVERITY_ERROR, "emoji-not-allowed",
            f"定義外の絵文字 {' '.join(uniq)} が使われています。"
            "writing.md の 11 絵文字（🎯 ✨ 💡 ⚠️ 📝 🔑 🏃 🧠 📌 ✅ 📖）のみ使用できます",
        ))


# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------

STYLE_RE = re.compile(r"^\s*style:\s*(emoji|admonition)\s*(?:#.*)?$", re.MULTILINE)


def read_default_style() -> str:
    """PROGRESS.md の frontmatter から様式を読む（/pilot が設定する単一ソース）。

    ファイル先頭が '---' の frontmatter ブロックだけを対象にする（テンプレートの
    コメント内サンプルには反応しない）。見つからなければ emoji。
    """
    try:
        text = Path("PROGRESS.md").read_text(encoding="utf-8")
    except OSError:
        return "emoji"
    if not text.startswith("---"):
        return "emoji"
    end = text.find("\n---", 3)
    if end == -1:
        return "emoji"
    m = STYLE_RE.search(text[:end])
    return m.group(1) if m else "emoji"


def collect_targets(inputs: list[str]) -> list[Path]:
    """引数のファイル・ディレクトリから検査対象の .md を集める。"""
    targets: list[Path] = []
    for arg in inputs:
        p = Path(arg)
        if not p.exists():
            raise RuntimeError(f"{arg}: ファイルまたはディレクトリが見つかりません")
        if p.is_dir():
            for md in sorted(p.rglob("*.md")):
                # 隠しディレクトリ・依存物は対象外
                if any(part.startswith(".") or part == "node_modules" for part in md.parts):
                    continue
                targets.append(md)
        else:
            targets.append(p)
    return targets


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="lint_curriculum.py",
        description="教材本文（Markdown）の書式・構造の機械チェック（/write・/review の単一の正）",
    )
    parser.add_argument("paths", nargs="+", metavar="<file|dir>", help="検査対象の .md ファイルまたはディレクトリ")
    parser.add_argument("--style", choices=("emoji", "admonition"), default=None,
                        help="教材の様式（省略時: PROGRESS.md frontmatter の style: → 無ければ emoji）")
    parser.add_argument("--json", action="store_true", dest="as_json", help="結果を JSON 配列で出力する")
    args = parser.parse_args(argv)
    style = args.style or read_default_style()

    try:
        targets = collect_targets(args.paths)
        findings: list[Finding] = []
        for target in targets:
            findings.extend(lint_file(target, style))
    except RuntimeError as exc:
        print(f"エラー: {exc}", file=sys.stderr)
        return 1

    findings.sort(key=lambda f: (f.path, f.line, f.rule))

    if args.as_json:
        print(json.dumps([f.to_json() for f in findings], ensure_ascii=False, indent=2))
    else:
        for f in findings:
            print(f.format())
        errors = sum(1 for f in findings if f.severity == SEVERITY_ERROR)
        warnings = len(findings) - errors
        if findings:
            print(f"\n🔵 {errors} 件 / 🟡 {warnings} 件（検査対象 {len(targets)} ファイル）")

    return 2 if any(f.severity == SEVERITY_ERROR for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
