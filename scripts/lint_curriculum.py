#!/usr/bin/env python3
"""教材本文（curriculums/**/*.md）の機械チェック。

このスクリプトが /write・/review の機械チェックの単一の正（Single Source of Truth）。
.claude/rules/writing.md の書式ルールのうち機械判定できるものを実装する。
文章品質（AI 臭・日本語技術文書ルール・表記ゆれ）は textlint（.textlintrc.json + prh.yml）が担い、
本スクリプトは Markdown の書式・構造の破れを検出する。標準ライブラリのみで動作する。

使い方:
    python3 scripts/lint_curriculum.py [--style emoji|plain|admonition|zenn]
        [--section-model separate|weave] [--release] [--json] <file|dir>...

    --style / --section-model 省略時は、カレントディレクトリの PROGRESS.md frontmatter の
    `style:` / `section_model:`（/pilot・/define が設定する単一ソース）を読む。
    無ければ emoji / separate。未知の値は警告を stderr に出して既定値として扱う。
    --release はリリース前検査: 執筆中は 🟡 の残作業（📸 未消化・TODO 画像・alt 欠落）を 🔴 に昇格する。

検出ルール（全様式共通）:
    🔴 broken-bold             閉じ ** の直後にスペースも改行もなく日本語・全角括弧が続く（太字が壊れる）
    🔴 sentence-bold           文全体の太字（** の中身が 30 字以上。太字は語句・キーフレーズに限定する）
    🔴 dash-char               ダッシュ記号（– — ―）
    🔴 code-fence-language     言語指定なしコードブロック（非コードコンテンツには text を指定する）
    🔴 absolute-path           環境依存の絶対パス（/Users/ /home/）
    🔴 practice-heading-form   実践見出しの正規形違反（全角コロン・コロン欠落・レベル違い・🏃 の有無の齟齬。
                               正規形の単一ソースは本スクリプトの PRACTICE_* 定数。位置ルールの機械判定を守る）
    🟡 step-numbering          Step 見出しの連番が 1 から +1 で増えていない（飛び・重複・リセット）
    🟡 image-alt-missing       alt テキストの無い画像タグ（![](...)。--release で 🔴）
    🟡 image-file-missing      相対パスの画像参照先ファイルが存在しない
    🟡 capture-pending         📸 撮影指示コメントの直後に画像参照が無い（未撮影。--release で 🔴）
    🟡 todo-image              TODO 画像プレースホルダの残存（--release で 🔴）
    🟡 missing-goal-heading    学習目標見出しが無い（emoji: 「## 🎯」/ 他様式: 「## このセクションで学ぶこと」）
    🟡 missing-summary-heading まとめ見出しが無い（emoji: 「## ✨」/ 他様式: 「## まとめ」）

様式別ルール:
    emoji      🔴 emoji-not-allowed   writing.md の定義済み 11 絵文字（🎯 ✨ 💡 ⚠️ 📝 🔑 🏃 🧠 📌 ✅ 📖）以外の絵文字
    plain      🔴 emoji-forbidden     絵文字全般（プレーン様式では絵文字を使わない）
    admonition 🔴 emoji-forbidden     絵文字全般
               🔴 admonition-indent   !!! / ??? 直後の内容行の字下げが 4 スペース未満
    zenn       🔴 emoji-forbidden     絵文字全般
               🔴 container-unclosed  :::message / :::details の閉じ ::: が無い（ページ描画が壊れる）
               🔴 raw-html            <br> 以外の HTML タグ（Zenn では描画されず露出する）

section_model=weave 専用ルール（役割行。書式は section-models/weave.md リファレンス）:
    🟡 role-line-missing       実践見出し配下のコードブロック直前に役割行（**入力**: / **実行**:）が無い
    🟡 read-example-missing    実践見出し外のコードブロック直前に **読む例** 行が無い
                               （text / mermaid タグと blockquote 内は両ルールとも対象外）

検査スコープ:
    - コードブロック内・インラインコード内は太字・ダッシュ・絵文字の検査対象外（フェンス追跡）
    - HTML コメント内（📸 撮影指示・verified/captured スタンプ・TODO）は絵文字・太字・ダッシュの検査対象外
      （コメント自体の内容は capture-pending / todo-image が扱う）
    - 絶対パスはコードブロック内も検査する（コピペ手順への環境依存パス混入を検出するため）

出力:  path:line: [🔴|🟡] rule-id: メッセージ（--json で JSON 配列）
終了コード:  🔴 違反あり = 2 / クリーン（🟡 のみを含む）= 0 / 引数・入出力エラー = 1
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

STYLES = ("emoji", "plain", "admonition", "zenn")
SECTION_MODELS = ("separate", "weave")

# writing.md「絵文字」テーブルで定義された 11 絵文字（⚠️ は ⚠ + VS16 のため基底文字で保持）
# この 11 絵文字は .textlintrc.json の正規表現・writing.md の絵文字表にも重複定義がある（単一ソース無し）。
# 追加・削除時は3箇所を同期すること。共有ソース化は #71（カスタムポイント外出し）で検討。
ALLOWED_EMOJI = set("🎯✨💡📝🔑🏃🧠📌✅📖") | {"⚠"}  # ⚠

# 絵文字とみなす Unicode 範囲（→ U+2192 などの矢印・罫線素片は含めない）
EMOJI_RANGES = (
    (0x1F000, 0x1FBFF),  # 絵文字本体（Misc Symbols and Pictographs / Supplemental など）
    (0x231A, 0x231B),    # ⌚ ⌛（時計・砂時計。⌘ ⌥ 等のキーボード記号は含めない）
    (0x23E9, 0x23F3),    # ⏩〜⏳（再生・時計系）
    (0x23F8, 0x23FA),    # ⏸ ⏹ ⏺
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
GOAL_HEADING_RES = {
    "emoji": re.compile(r"^ {0,3}##\s*🎯"),
    "text": re.compile(r"^ {0,3}##\s*このセクションで学ぶこと"),
}
SUMMARY_HEADING_RES = {
    "emoji": re.compile(r"^ {0,3}##\s*✨"),
    "text": re.compile(r"^ {0,3}##\s*まとめ"),
}

# MkDocs Material の admonition ヘッダ（!!! type / ??? type / ???+ type）
ADMONITION_HEADER_RE = re.compile(r"^ {0,3}(?:!{3}|\?{3}\+?)(?:\s|$)")

# ---- 実践見出し（位置ルールの機械可読アンカー。正規形の単一ソース） ----
# emoji 様式: 🏃 付き / plain・admonition・zenn 様式: テキスト形。コロンは半角のみ。
HEADING_LINE_RE = re.compile(r"^ {0,3}(#{1,6})\s*(.*)$")
PRACTICE_CANONICAL = {
    "emoji": (
        re.compile(r"^ {0,3}##\s*🏃\s*(?:実践|やってみよう):\s?\S"),
        re.compile(r"^ {0,3}###\s*🏃\s*Step\s+\d+:\s?\S"),
    ),
    "text": (
        re.compile(r"^ {0,3}##\s*(?:実践|やってみよう):\s?\S"),
        re.compile(r"^ {0,3}###\s*Step\s+\d+:\s?\S"),
    ),
}
# 実践見出しの「つもり」らしき見出し（正規形チェックのトリガ）
PRACTICE_LOOKALIKE_RE = re.compile(
    r"^ {0,3}#{1,6}\s*(?:"
    r"🏃"                                   # 🏃 を含む見出しすべて
    r"|(?:実践|やってみよう)\s*[:：]"        # 実践:/やってみよう:（全角コロン含む）
    r"|(?:実践|やってみよう)\s*$"            # コロン欠落の裸見出し
    r"|Step\s*\d"                            # Step N（コロン・レベル違い含む）
    r")"
)
STEP_NUMBER_RE = re.compile(r"Step\s+(\d+):")

# ---- 役割行（section_model=weave。書式は .claude/skills/write/references/section-models/weave.md） ----
ROLE_LINE_RE = re.compile(r"^(?:>\s*)?(?:🏃\s*)?\*\*(?:入力|実行)\*\*\s*[:：]")
READ_EXAMPLE_RE = re.compile(r"^(?:>\s*)?(?:📖\s*)?\*\*読む例\*\*")
ROLE_EXEMPT_LANGS = {"text", "mermaid"}

# ---- zenn 様式の生 HTML（<br> と HTML コメント以外は描画されない） ----
RAW_HTML_RE = re.compile(r"</?([A-Za-z][A-Za-z0-9-]*)[^>]*>")

# Zenn のコンテナ（:::message / :::message alert / :::details タイトル。ネストは外側 ::::）
ZENN_CONTAINER_RE = re.compile(r"^ {0,3}(:{3,})\s*(.*)$")

# 画像タグ（alt と URL を取り出す。URL は空白か ) まで＝Zenn の「 =250x」サイズ指定を含めない）
IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)")

# 撮影指示・TODO プレースホルダ（writing.md「画像」の規約）
CAPTURE_COMMENT_RE = re.compile(r"<!--\s*📸")
TODO_IMAGE_RE = re.compile(r"<!--\s*TODO:\s*画像")
HTML_COMMENT_OPEN = "<!--"
HTML_COMMENT_CLOSE = "-->"

SEVERITY_ERROR = "error"      # 🔴
SEVERITY_WARNING = "warning"  # 🟡
MARKS = {SEVERITY_ERROR: "🔴", SEVERITY_WARNING: "🟡"}

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


def mask_html_comments(line: str, in_comment: bool) -> tuple[str, bool]:
    """HTML コメント部分を空白に置換する（📸 指示・スタンプ内の絵文字等を検査対象外にする）。

    戻り値: (マスク済みの行, 行末時点でコメント内か)。複数行コメントにも対応する。
    """
    out: list[str] = []
    i = 0
    n = len(line)
    while i < n:
        if in_comment:
            end = line.find(HTML_COMMENT_CLOSE, i)
            if end == -1:
                out.append(" " * (n - i))
                i = n
            else:
                out.append(" " * (end + len(HTML_COMMENT_CLOSE) - i))
                i = end + len(HTML_COMMENT_CLOSE)
                in_comment = False
        else:
            start = line.find(HTML_COMMENT_OPEN, i)
            if start == -1:
                out.append(line[i:])
                i = n
            else:
                out.append(line[i:start])
                i = start
                in_comment = True
    return "".join(out), in_comment


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


def lint_file(path: Path, style: str, section_model: str = "separate",
              release: bool = False) -> list[Finding]:
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
    in_comment = False  # 複数行 HTML コメントの追跡（フェンス外のみ）

    has_goal = False
    has_summary = False

    # admonition 追跡: ヘッダ行を見つけたら、次の非空行の字下げを検査する
    pending_admonition_line = 0  # 0 = 検査待ちなし

    # zenn コンテナ追跡: (開始行, コロン数) のスタック
    zenn_stack: list[tuple[int, int]] = []

    # 📸 撮影指示の追跡: 直後の非空行（コメント行は読み飛ばす）が画像参照でなければ未撮影
    pending_capture_line = 0

    # 実践見出しスコープの追跡（位置ルール）: 見出しごとに practice / non-practice を更新
    fam = "emoji" if style == "emoji" else "text"
    canonical_res = PRACTICE_CANONICAL[fam]
    in_practice_scope = False
    step_expect = 1  # Step 連番の期待値（Section 内通し番号）

    # 役割行の判定用: 直近の非空行（フェンス外）を2行だけ保持する
    recent_nonblank: list[str] = []

    residue_severity = SEVERITY_ERROR if release else SEVERITY_WARNING

    goal_res = [GOAL_HEADING_RES[fam]]
    summary_res = [SUMMARY_HEADING_RES[fam]]

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
            elif section_model == "weave" and not bq:
                # 役割行の検査（weave のみ。text/mermaid と blockquote 内は読む用の器なので対象外）
                lang = re.split(r"[:\s]", info, maxsplit=1)[0].lower()
                if lang not in ROLE_EXEMPT_LANGS:
                    has_role = any(ROLE_LINE_RE.match(l) for l in recent_nonblank)
                    has_read = any(READ_EXAMPLE_RE.match(l) for l in recent_nonblank)
                    if in_practice_scope and not (has_role or has_read):
                        findings.append(Finding(
                            display, lineno, SEVERITY_WARNING, "role-line-missing",
                            "実践見出し配下のコードブロックに役割行（**入力**: / **実行**:）がありません"
                            "（書式は section-models/weave.md）",
                        ))
                    elif not in_practice_scope and not has_read:
                        findings.append(Finding(
                            display, lineno, SEVERITY_WARNING, "read-example-missing",
                            "実践見出し外のコードブロックに **読む例** 行がありません"
                            "（読む例なら宣言を付け、打たせるコードなら実践見出しの配下へ移してください）",
                        ))
            continue

        # ---- フェンス外の検査 ----

        # 画像残作業の検査（コメントの中身を見るため、マスク前の raw で判定する）
        if pending_capture_line and raw.strip() and not raw.lstrip().startswith(HTML_COMMENT_OPEN):
            if not raw.lstrip().startswith("!["):
                findings.append(Finding(
                    display, pending_capture_line, residue_severity, "capture-pending",
                    "📸 撮影指示コメントの直後に画像参照がありません（未撮影）。"
                    "/capture で撮影・挿入するか、手動撮影した画像を取り込んでください",
                ))
            pending_capture_line = 0
        if CAPTURE_COMMENT_RE.search(raw):
            if pending_capture_line:
                findings.append(Finding(
                    display, pending_capture_line, residue_severity, "capture-pending",
                    "📸 撮影指示コメントの直後に画像参照がありません（未撮影）。"
                    "/capture で撮影・挿入するか、手動撮影した画像を取り込んでください",
                ))
            pending_capture_line = lineno
        if TODO_IMAGE_RE.search(raw):
            findings.append(Finding(
                display, lineno, residue_severity, "todo-image",
                "TODO 画像プレースホルダが残っています（初回リリース前に画像を用意するか、方針を確定してください）",
            ))

        # HTML コメントをマスクする（📸 指示・スタンプ内の絵文字等を以降の検査から除外）
        visible, in_comment = mask_html_comments(raw, in_comment)

        # 構造チェック用の見出し検出
        if any(r.match(visible) for r in goal_res):
            has_goal = True
        if any(r.match(visible) for r in summary_res):
            has_summary = True

        # 見出し行: 実践見出しスコープの更新・正規形検査・Step 連番検査
        heading_m = HEADING_LINE_RE.match(visible)
        if heading_m and heading_m.group(2).strip():
            is_canonical = any(r.match(visible) for r in canonical_res)
            if is_canonical:
                in_practice_scope = True
                sn = STEP_NUMBER_RE.search(visible)
                if sn:
                    n = int(sn.group(1))
                    if n != step_expect:
                        findings.append(Finding(
                            display, lineno, SEVERITY_WARNING, "step-numbering",
                            f"Step 連番が飛んでいます（期待: Step {step_expect} / 実際: Step {n}。"
                            "Step は Section 内の通し番号で 1 から +1 ずつ振ります）",
                        ))
                    step_expect = n + 1
            else:
                in_practice_scope = False
                if PRACTICE_LOOKALIKE_RE.match(visible):
                    hint = (
                        "emoji 様式の正規形: 「## 🏃 実践: タイトル」「### 🏃 Step N: タイトル」「## 🏃 やってみよう: タイトル」"
                        if style == "emoji" else
                        "正規形: 「## 実践: タイトル」「### Step N: タイトル」「## やってみよう: タイトル」"
                    )
                    findings.append(Finding(
                        display, lineno, SEVERITY_ERROR, "practice-heading-form",
                        "実践見出しの正規形に合っていません（半角コロン + タイトル・見出しレベル固定。"
                        f"{hint}）。正規形以外の見出し配下のコードは「読む例」扱いになり検証されません",
                    ))

        # admonition の字下げ検査（admonition スタイルのみ）
        if style == "admonition":
            if pending_admonition_line and visible.strip():
                indent = len(visible) - len(visible.lstrip(" "))
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

        # zenn コンテナの開閉検査（zenn スタイルのみ）
        if style == "zenn":
            zm = ZENN_CONTAINER_RE.match(content)
            if zm:
                colons = len(zm.group(1))
                info = zm.group(2).strip()
                if info:
                    zenn_stack.append((lineno, colons))
                elif zenn_stack:
                    zenn_stack.pop()
                else:
                    findings.append(Finding(
                        display, lineno, SEVERITY_ERROR, "container-unclosed",
                        "開始のない閉じ ::: です（:::message / :::details の対応を確認してください）",
                    ))
                continue

        # 絶対パス（インラインコード内も対象とするため raw で検査）
        check_absolute_path(findings, display, lineno, raw)

        # 画像タグの検査（alt 必須・相対パスの実在。インラインコード除外前の visible で検査）
        for im in IMAGE_RE.finditer(visible):
            alt, url = im.group(1).strip(), im.group(2).strip()
            if not alt:
                findings.append(Finding(
                    display, lineno, residue_severity, "image-alt-missing",
                    "alt テキストの無い画像タグです。画像の内容を説明する日本語 alt を書いてください",
                ))
            if url and not re.match(r"^[a-z][a-z0-9+.-]*:", url) and not url.startswith(("/", "#", "<")):
                target = (path.parent / url).resolve()
                if not target.exists():
                    findings.append(Finding(
                        display, lineno, SEVERITY_WARNING, "image-file-missing",
                        f"画像ファイル「{url}」が見つかりません（相対パスの参照切れ）",
                    ))

        # 以降はインラインコードを除外した本文で検査
        work = mask_inline_code(visible)

        # ダッシュ記号
        dashes = sorted({DASH_CHARS[ch] for ch in work if ch in DASH_CHARS})
        if dashes:
            findings.append(Finding(
                display, lineno, SEVERITY_ERROR, "dash-char",
                f"ダッシュ記号 {' '.join(dashes)} は使いません。読点・括弧・コロン等で言い換えてください",
            ))

        # 生 HTML（zenn のみ。<br> と HTML コメント以外は描画されず露出する）
        if style == "zenn":
            for hm in RAW_HTML_RE.finditer(work):
                tag = hm.group(1).lower()
                token = hm.group(0)
                if tag != "br" and "://" not in token and "@" not in token:
                    findings.append(Finding(
                        display, lineno, SEVERITY_ERROR, "raw-html",
                        f"HTML タグ「<{hm.group(1)}>」は Zenn では描画されません（使えるのは <br> と1行 HTML コメントのみ。"
                        "折りたたみは :::details を使ってください）",
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

        # 役割行の判定用バッファ更新（フェンス外の非空行を2行だけ保持）
        if visible.strip():
            recent_nonblank.append(visible)
            if len(recent_nonblank) > 2:
                recent_nonblank.pop(0)

    # ---- ファイル末尾の後始末 ----
    if pending_capture_line:
        findings.append(Finding(
            display, pending_capture_line, residue_severity, "capture-pending",
            "📸 撮影指示コメントの直後に画像参照がありません（未撮影）。"
            "/capture で撮影・挿入するか、手動撮影した画像を取り込んでください",
        ))
    if style == "zenn":
        for opened_line, _ in zenn_stack:
            findings.append(Finding(
                display, opened_line, SEVERITY_ERROR, "container-unclosed",
                "閉じ ::: がありません（:::message / :::details はページ全体の描画を壊すため必ず閉じてください）",
            ))

    # ---- ファイル全体の構造チェック ----
    goal_label = "## 🎯 このセクションで学ぶこと" if style == "emoji" else "## このセクションで学ぶこと"
    summary_label = "## ✨ まとめ" if style == "emoji" else "## まとめ"
    if not has_goal:
        findings.append(Finding(
            display, 1, SEVERITY_WARNING, "missing-goal-heading",
            f"「{goal_label}」見出しがありません（Section の必須構造）",
        ))
    if not has_summary:
        findings.append(Finding(
            display, 1, SEVERITY_WARNING, "missing-summary-heading",
            f"「{summary_label}」見出しがありません（Section の必須構造）",
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
    if style == "emoji":
        findings.append(Finding(
            path, lineno, SEVERITY_ERROR, "emoji-not-allowed",
            f"定義外の絵文字 {' '.join(uniq)} が使われています。"
            "writing.md の 11 絵文字（🎯 ✨ 💡 ⚠️ 📝 🔑 🏃 🧠 📌 ✅ 📖）のみ使用できます",
        ))
    else:
        findings.append(Finding(
            path, lineno, SEVERITY_ERROR, "emoji-forbidden",
            f"絵文字 {' '.join(uniq)} が使われています。{style} 様式では絵文字を使いません",
        ))


# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------

STYLE_RE = re.compile(r"^\s*style:\s*(\S+)", re.MULTILINE)
SECTION_MODEL_RE = re.compile(r"^\s*section_model:\s*(\S+)", re.MULTILINE)


def _read_frontmatter_value(regex: re.Pattern, valid: tuple, default: str, key: str) -> str:
    """PROGRESS.md の frontmatter からキーを読む（/pilot・/define が設定する単一ソース）。

    ファイル先頭が '---' の frontmatter ブロックだけを対象にする（テンプレートの
    コメント内サンプルには反応しない）。見つからなければ既定値。
    未知の値は警告を出して既定値にフォールバックする（黙って既定扱いにしない）。
    """
    try:
        text = Path("PROGRESS.md").read_text(encoding="utf-8")
    except OSError:
        return default
    if not text.startswith("---"):
        return default
    end = text.find("\n---", 3)
    if end == -1:
        return default
    m = regex.search(text[:end])
    if not m:
        return default
    value = m.group(1)
    if value in valid:
        return value
    print(
        f"警告: PROGRESS.md の {key}「{value}」は未知の値です（{' / '.join(valid)}）。"
        f"{default} として検査します",
        file=sys.stderr,
    )
    return default


def read_default_style() -> str:
    return _read_frontmatter_value(STYLE_RE, STYLES, "emoji", "style")


def read_default_section_model() -> str:
    return _read_frontmatter_value(SECTION_MODEL_RE, SECTION_MODELS, "separate", "section_model")


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
    parser.add_argument("--style", choices=STYLES, default=None,
                        help="教材の様式（省略時: PROGRESS.md frontmatter の style: → 無ければ emoji）")
    parser.add_argument("--section-model", choices=SECTION_MODELS, default=None, dest="section_model",
                        help="学習モデル（省略時: PROGRESS.md frontmatter の section_model: → 無ければ separate）")
    parser.add_argument("--release", action="store_true",
                        help="リリース前検査（📸 未消化・TODO 画像・alt 欠落を 🔴 に昇格）")
    parser.add_argument("--json", action="store_true", dest="as_json", help="結果を JSON 配列で出力する")
    args = parser.parse_args(argv)
    style = args.style or read_default_style()
    section_model = args.section_model or read_default_section_model()

    try:
        targets = collect_targets(args.paths)
        findings: list[Finding] = []
        for target in targets:
            findings.extend(lint_file(target, style, section_model=section_model, release=args.release))
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
            print(f"\n🔴 {errors} 件 / 🟡 {warnings} 件（検査対象 {len(targets)} ファイル）")

    return 2 if any(f.severity == SEVERITY_ERROR for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
