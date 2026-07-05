/**
 * 等幅フォントの同梱（コード用）。JetBrains Mono は 0/O・1/l/I が判別しやすい。
 * 日本語は洗練ゴシック系（システムフォント）を theme.fontJa（= brand.ts）で直接指定する。
 *
 * 📝 日本語フォントの埋め込みについて: Noto Sans JP 等の CJK を @remotion/google-fonts
 * （CDN）で読むと unicode-range で数百リクエストに分割され、headless レンダのセットアップが
 * タイムアウトすることがある（実測 363 リクエスト）。埋め込みたい場合は CDN ではなく
 * **ローカル woff2 を public/fonts/ に置いて @font-face で読む**こと。
 *
 * loadFont() はモジュール読み込み時に @font-face を注入し、Remotion が読み込み完了を待つ。
 */
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: monoFontFamily } = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
