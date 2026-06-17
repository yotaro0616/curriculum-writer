/**
 * ブランド設定 — プロジェクトごとに「ここだけ」差し替えるカスタマイズ面。
 * 色・フォント・ロゴを定義し、theme.ts がこれを取り込んで全トークンを組み立てる。
 * 詳細は .claude/skills/animate/references/customization.md を参照。
 * 以下は中立デフォルト（落ち着いた青1色／システムゴシック／ロゴなし）。
 */
export const brand = {
  accent: "#3B6FB0",
  accentEnd: "#4F86C6",
  accentText: "#2C5C90",
  accentDeep: "#244B77",
  surfaceTint: "#F5F7FA",
  surfaceTintBorder: "#E4E9F0",
  fontJa: `"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic Medium",YuGothic,"Noto Sans JP",sans-serif`,
  logo: "",
};
