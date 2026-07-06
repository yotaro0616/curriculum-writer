"""curriculums/ のMarkdownファイルを docs/ にコピーするビルドスクリプト。

日本語ディレクトリ・ファイル名を英語スラッグ（part-XX/chapter-XX/X-X-X.md）に変換し、
MkDocs のソースディレクトリ（docs/）に配置する。
教材内のセクション間リンクも新しいパスに書き換える。

3層構成（part-XX_*/chapter-XX_*/X-X-X_*.md）前提。1件もコピーできない場合は
エラーメッセージを出して非ゼロ終了する（無言で空の docs/ を作らない）。

このリポジトリの scripts/ に置いて `python scripts/build_docs.py` で実行する。
"""

import re
import shutil
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
CURRICULUMS_DIR = ROOT / "curriculums"
DOCS_DIR = ROOT / "docs"

# Markdown リンク: [text](path) / ![alt](path) / [text](path#anchor)
LINK_RE = re.compile(r"(\!?\[[^\]]*\]\()([^)#]+)((?:#[^)]*)?)\)")

# コードフェンス追跡（フェンス内のリンクは書き換えない。blockquote 内のフェンスにも対応）
FENCE_RE = re.compile(r"^( {0,3})(`{3,}|~{3,})[ \t]*(.*)$")
BLOCKQUOTE_PREFIX_RE = re.compile(r"^(?:[ \t]{0,3}>[ \t]?)+")


def extract_part_slug(dirname: str) -> str:
    """'part-01_Java-言語の基礎' → 'part-01'"""
    match = re.match(r"(part-\d+)", dirname)
    return match.group(1) if match else dirname


def extract_chapter_slug(dirname: str) -> str:
    """'chapter-01_基本文法' → 'chapter-01'"""
    match = re.match(r"(chapter-\d+)", dirname)
    return match.group(1) if match else dirname


def extract_section_slug(filename: str) -> str:
    """'1-2-1_変数と型.md' → '1-2-1.md'"""
    match = re.match(r"(\d+-\d+-\d+)", filename)
    return f"{match.group(1)}.md" if match else filename


def rewrite_links(content: str) -> str:
    """Markdown 内の日本語パスリンクを英語スラッグに書き換える。

    対象パターン:
      - ../../part-XX_日本語/chapter-XX_日本語/X-X-X_日本語.md
      - ../chapter-XX_日本語/X-X-X_日本語.md
      - X-X-X_日本語.md
    URL エンコード（%20 等）にも対応する。

    書き換えの対象外:
      - 外部 URL（http:// / https://）: unquote すると %20 等が実文字に戻り
        リンクが壊れるため、そのまま保つ
      - アンカーのみのリンク（#section）
      - コードフェンス内の行（``` / ~~~ を追跡。リンク記法の例示を保つ）
    """

    def replace_link(match: re.Match) -> str:
        prefix = match.group(1)  # [text]( or (
        raw_path = match.group(2)
        suffix = match.group(3)  # #anchor（無ければ空文字）

        # 外部 URL・アンカーのみのリンクは書き換え対象外
        if raw_path.lower().startswith(("http://", "https://")) or raw_path.startswith("#"):
            return prefix + raw_path + suffix

        path = unquote(raw_path)  # URL デコード

        # パスの各セグメントをスラッグに変換
        segments = path.split("/")
        new_segments = []
        for seg in segments:
            if seg == ".." or seg == ".":
                new_segments.append(seg)
            elif seg.startswith("part-"):
                new_segments.append(extract_part_slug(seg))
            elif seg.startswith("chapter-"):
                new_segments.append(extract_chapter_slug(seg))
            elif seg.endswith(".md") and re.match(r"\d+-\d+-\d+", seg):
                # セクション本文（.md）のみスラッグ化する。
                # 画像（X-X-X-name.jpg 等）はセクション番号と同じ並びで始まるが
                # .md ではないので、ここでは書き換えずパスを保つ。
                new_segments.append(extract_section_slug(seg))
            else:
                new_segments.append(seg)

        new_path = "/".join(new_segments)

        # curriculums/ は repo root から3階層（curriculums/part/chapter）だが
        # docs/ は docs root から2階層（part/chapter）なので ../../../ を ../../ に修正
        new_path = re.sub(r"^(\.\./){3}(assets/)", r"../../\2", new_path)

        return prefix + new_path + suffix

    # コードフェンス外の行だけリンクを書き換える（フェンスは行単位で追跡）
    out = []
    in_fence = False
    fence_char = ""
    fence_len = 0
    for raw in content.splitlines(keepends=True):
        bq = BLOCKQUOTE_PREFIX_RE.match(raw)
        body = raw[bq.end():] if bq else raw
        fence_m = FENCE_RE.match(body)

        if in_fence:
            # 閉じフェンス: 同種の記号が開始時以上の長さで、後続文字列なし
            if (
                fence_m
                and fence_m.group(2)[0] == fence_char
                and len(fence_m.group(2)) >= fence_len
                and fence_m.group(3).strip() == ""
            ):
                in_fence = False
            out.append(raw)  # フェンス内と閉じ行はそのまま
            continue

        if fence_m:
            in_fence = True
            fence_char = fence_m.group(2)[0]
            fence_len = len(fence_m.group(2))
            out.append(raw)  # 開き行もそのまま
            continue

        out.append(LINK_RE.sub(lambda m: replace_link(m) + ")", raw))

    return "".join(out)


def build_docs():
    if not CURRICULUMS_DIR.is_dir():
        sys.exit(f"curriculums/ が見つかりません: {CURRICULUMS_DIR}")

    # docs/ 内の part-* ディレクトリだけをクリーン（index.md は保持）
    if DOCS_DIR.exists():
        for item in DOCS_DIR.iterdir():
            if item.is_dir() and item.name.startswith("part-"):
                shutil.rmtree(item)

    # curriculums/ から docs/ にコピー（リンク書き換え付き）
    copied = 0
    for part_dir in sorted(CURRICULUMS_DIR.iterdir()):
        if not part_dir.is_dir():
            continue
        part_slug = extract_part_slug(part_dir.name)

        for chapter_dir in sorted(part_dir.iterdir()):
            if not chapter_dir.is_dir():
                continue
            chapter_slug = extract_chapter_slug(chapter_dir.name)

            dest_dir = DOCS_DIR / part_slug / chapter_slug
            dest_dir.mkdir(parents=True, exist_ok=True)

            for md_file in sorted(chapter_dir.glob("*.md")):
                section_slug = extract_section_slug(md_file.name)
                dest_path = dest_dir / section_slug

                content = md_file.read_text(encoding="utf-8")
                content = rewrite_links(content)
                dest_path.write_text(content, encoding="utf-8")
                copied += 1

    if copied == 0:
        sys.exit(
            "curriculums/ に part-XX_*/chapter-XX_* が見つかりません"
            "（このスクリプトは3層構成前提です）"
        )

    # assets/ を docs/assets/ にコピー
    # .md（概念図生成プロンプト等の作業メモ）は公開サイトに含めない。
    # MkDocs の --strict は「nav に無い .md」を警告→エラー扱いにするため、画像のみコピーする。
    assets_src = ROOT / "assets"
    assets_dest = DOCS_DIR / "assets"
    if assets_src.exists():
        if assets_dest.exists():
            shutil.rmtree(assets_dest)
        shutil.copytree(
            assets_src, assets_dest, ignore=shutil.ignore_patterns("*.md")
        )

    print(f"Done: copied {copied} section files to {DOCS_DIR}")


if __name__ == "__main__":
    build_docs()
