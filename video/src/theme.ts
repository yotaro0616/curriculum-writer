/**
 * デザイントークン（汎用エンジン）。
 *
 * 構造（純白基調＋コンポーネントの細い段差ベベル、IDE 風コード、フロスト字幕、
 * モノクロ＋1アクセント）はここで固定し、**ブランド固有の値は `brand.ts` から取り込む**。
 * プロジェクトを変えるときは brand.ts だけ差し替えればよい（色・フォント・ロゴ）。
 *
 * 全シーンはこのトークンを単一ソースとして参照する（色・ベベル・モーションを直書きしない）。
 */
import { brand } from "./brand";
import { monoFontFamily } from "./fonts";

/** #RRGGBB → rgba(r,g,b,a)。ブランドのアクセント色から淡い面色を導く */
const rgba = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const theme = {
  // 背景（明面）
  bg1: "#FFFFFF",
  bg2: "#FFFFFF",
  haze: rgba(brand.accent, 0.03), // ほぼ不可視の下地（アクセント色から導く）

  // 淡い面色（タイトル/まとめの地・カード）= ブランド
  emerald: brand.surfaceTint,
  emeraldBorder: brand.surfaceTintBorder,

  // 面（白＋ごく薄い縦サイン）
  panel: "#FFFFFF",
  panelGrad: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)",
  panelBorder: "#E5E8EC",

  // 段差（ベベル）＝上端ハイライト + 内側ヘアライン + 下端の段
  edge: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(8,28,34,0.05), inset 0 -1.5px 0 rgba(8,28,34,0.05)",
  elevSoft: "0 1px 2px rgba(8,28,34,0.04), 0 4px 12px rgba(8,28,34,0.05)",
  elev: "0 1px 2px rgba(8,28,34,0.05), 0 12px 30px rgba(8,28,34,0.07)",
  elevHigh: "0 2px 5px rgba(8,28,34,0.06), 0 28px 60px rgba(8,28,34,0.10)",

  // 無彩色の線（矢印・区切り）
  line: "#C6CCD2",
  lineStrong: "#98A0A8",

  // コード面（フラットな IDE 風ダーク。汎用＝ブランド非依存）
  codeBg: "#1E232E",
  codeChrome: "#272D38",
  codeBorder: "rgba(255,255,255,0.07)",
  codeText: "#D4D4D4",
  codeComment: "#6A9B6E",
  codeGutter: "#586273",
  codeTabText: "#C5CCD6",
  codeDots: ["#FF5F56", "#FFBD2E", "#27C93F"],
  // VSCode Dark+ 系のシンタックスカラー
  syntax: {
    keyword: "#569CD6",
    type: "#4EC9B0",
    func: "#DCDCAA",
    string: "#CE9178",
    var: "#9CDCFE",
    num: "#B5CEA8",
    comment: "#6A9B6E",
    op: "#C8CCD2",
    punct: "#C8CCD2",
    ident: "#D4D4D4",
    ws: "#D4D4D4",
  } as Record<string, string>,
  // 字幕（フロスト状の暗色バー。ほぼ無彩の濃色）
  captionBg: "rgba(10,16,24,0.76)",

  // テキスト（クールな黒）
  text: "#0E1620",
  dim: "#54616A",
  faint: "#929BA3",

  // アクセント（= ブランドの1色。グラデ・淡色はここで導く）
  accent: brand.accent,
  accentBlue: brand.accentEnd,
  accentGrad: `linear-gradient(90deg, ${brand.accent} 0%, ${brand.accentEnd} 100%)`,
  accentText: brand.accentText,
  accentDeep: brand.accentDeep,
  accentSoft: rgba(brand.accent, 0.13),
  // 2項対比の「もう片方」＝無彩色の濃いスレート
  markNeutral: "#39414C",

  // エラー（明面用／ダーク面内用）
  error: "#D6452F",
  errorOnDark: "#FF8A7A",

  // 左上ロゴ（public/ からの相対パス）= ブランド
  logo: brand.logo,

  // フォント: 日本語＝ブランド指定 / コード＝JetBrains Mono
  fontJa: brand.fontJa,
  fontMono: `${monoFontFamily}, "SF Mono", Menlo, Consolas, monospace`,
};
