/**
 * 読み上げ用テキストの生成。
 *
 * ネイティブ TTS（Google Chirp / VOICEVOX 等）は **漢字から正しいアクセント** を推定するため、
 * 漢字をかなに開くと逆に棒読み・誤アクセントになる。そこで原則:
 *   - 日本語（漢字・かな）はそのまま残す
 *   - 英語・技術用語・記号だけを読み辞書でカタカナ化する（Laravel→ララベル, extends→エクステンズ 等）
 *
 * これにより storyboard は narration だけ書けばよく、reading の手書きは不要になる
 * （明示的に scene.reading がある場合のみそれを優先）。
 */
import { readFileSync } from "node:fs";

export const loadDict = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8")).entries ?? {};
  } catch {
    return {};
  }
};

/** text 内の辞書キー（英語・記号）をカタカナに置換。漢字・かなはそのまま */
export const toSpoken = (text, dict) => {
  // 長いキーから先に置換（部分一致の取りこぼし防止）
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  let out = text;
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 英字始まりのキーは単語境界で、記号始まり（$this 等）はそのまま置換。大小文字は無視
    const re = /^[A-Za-z]/.test(key)
      ? new RegExp(`\\b${esc}\\b`, "gi")
      : new RegExp(esc, "gi");
    out = out.replace(re, dict[key]);
  }
  return out;
};

/**
 * scene から読み上げテキストを得る。
 * 話し言葉の reading があればそれを、なければ字幕の narration を使い、
 * どちらも英語・記号だけ辞書でカタカナ化する（漢字は残してアクセントを保つ）。
 */
export const spokenForScene = (scene, dict) =>
  toSpoken(scene.reading ?? scene.narration ?? "", dict);
