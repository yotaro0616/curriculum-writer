// 英語・記号・技術用語をカタカナに置換する純粋関数（fs 非依存）。
// 字幕の表示尺を配分するとき、表示文字数ではなく「発話形の長さ」で測るために使う。
// 例: "JavaScript"→"ジャバスクリプト"（表示10字→発話8拍）, "API"→"エーピーアイ"。
// 置換ロジックは scripts/pronounce.mjs の toSpoken と同一。変更時は両方そろえること。
export const toSpoken = (text: string, dict: Record<string, string>): string => {
  // 長いキーから先に置換（部分一致の取りこぼし防止）
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  let out = text;
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 英字始まりのキーは単語境界で、記号・数字始まりはそのまま置換。大小文字は無視
    const re = /^[A-Za-z]/.test(key)
      ? new RegExp(`\\b${esc}\\b`, "gi")
      : new RegExp(esc, "gi");
    out = out.replace(re, dict[key]);
  }
  return out;
};
