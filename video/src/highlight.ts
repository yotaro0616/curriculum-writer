/**
 * 簡易シンタックスハイライタ（1 行をトークンへ分解し、クラス名を付ける）。
 * 色は theme.syntax 側で持つ。現状は PHP / Laravel 向けだが、KEYWORDS と
 * トークン規則を差し替えれば他言語にも拡張できる（教材フレームワークでの転用を想定）。
 */
export type Token = { text: string; cls: string };

const KEYWORDS = new Set([
  "class", "interface", "trait", "enum", "extends", "implements", "use",
  "namespace", "function", "fn", "return", "yield", "new", "clone", "instanceof",
  "public", "private", "protected", "static", "final", "abstract", "const", "readonly",
  "if", "else", "elseif", "for", "foreach", "while", "do", "switch", "case", "default",
  "break", "continue", "as", "match", "throw", "try", "catch", "finally",
  "echo", "print", "require", "require_once", "include", "include_once",
  "void", "int", "float", "string", "bool", "array", "object", "mixed", "callable", "iterable", "self", "parent",
  "true", "false", "null",
]);

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\$[A-Za-z_]\w*)|(\b\d+(?:\.\d+)?\b)|(->|::|=>|=&gt;)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_$]+)/g;

/** 1 行を色付きトークンに分解する。typing 演出と組み合わせて使う */
export const tokenize = (line: string): Token[] => {
  const raw: { t: string; k: string }[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m[1] != null) raw.push({ t: m[1], k: "comment" });
    else if (m[2] != null) raw.push({ t: m[2], k: "string" });
    else if (m[3] != null) raw.push({ t: m[3], k: "var" });
    else if (m[4] != null) raw.push({ t: m[4], k: "num" });
    else if (m[5] != null) raw.push({ t: m[5], k: "op" });
    else if (m[6] != null) raw.push({ t: m[6], k: "ident" });
    else if (m[7] != null) raw.push({ t: m[7], k: "ws" });
    else raw.push({ t: m[8] ?? "", k: "punct" });
  }
  return raw.map((tk, i) => {
    if (tk.k !== "ident") return { text: tk.t, cls: tk.k };
    if (KEYWORDS.has(tk.t)) return { text: tk.t, cls: "keyword" };
    // 次の非空白トークンが "(" なら関数呼び出し / 定義
    let j = i + 1;
    while (j < raw.length && raw[j].k === "ws") j++;
    if (raw[j] && raw[j].t.startsWith("(")) return { text: tk.t, cls: "func" };
    // 大文字始まりはクラス／型
    if (/^[A-Z]/.test(tk.t)) return { text: tk.t, cls: "type" };
    return { text: tk.t, cls: "ident" };
  });
};
