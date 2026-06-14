/**
 * 動画のデザイントークン（ライト基調・コードパネルのみダーク）。
 * primary / accent は教材サイト（docs/stylesheets/custom.css のテーマカラー）に
 * 合わせて変更する。以下は既定値（ブルー × オレンジ）。
 */
export const theme = {
  // 背景（中心が白、外周がごく薄いブルーグレー）
  bg1: "#EAF2F6",
  bg2: "#FFFFFF",

  // 面・枠
  panel: "#FFFFFF",
  panelBorder: "#D5E3EA",
  shadow: "0 18px 44px rgba(16,42,56,0.10)",

  // コードパネル（ここだけダーク）
  codeBg: "#0E2433",
  codeBorder: "#1E3D4F",
  codeText: "#EAF4F8",
  codeComment: "rgba(169,198,210,0.62)",

  // ブランド
  primary: "#3B82F6",
  primaryDeep: "#2563EB",
  accent: "#F97316",

  // テキスト
  text: "#16303C",
  dim: "#5A7684",

  // エラー（ライト面用とダークパネル内用）
  error: "#D6452F",
  errorOnDark: "#FF7A7A",

  fontJa: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
  fontMono: "'SF Mono',Menlo,Consolas,'Courier New',monospace",
};
