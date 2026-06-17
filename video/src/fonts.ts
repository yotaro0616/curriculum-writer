/**
 * 等幅フォントの同梱（コード用）。JetBrains Mono は 0/O・1/l/I が判別しやすい。
 * 日本語は LP と同じ游ゴシック系（システムフォント）を theme.fontJa で直接指定する。
 * loadFont() はモジュール読み込み時に @font-face を注入し、Remotion が読み込み完了を待つ。
 */
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: monoFontFamily } = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
