import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { toSpoken } from "./spoken";
import pronDict from "../data/pronunciation.json";

// 字幕の尺配分は発話形（英語→カタカナ）の長さで測る。読み辞書は TTS と共通。
const DICT = (pronDict as { entries: Record<string, string> }).entries;

/**
 * ナレーション原稿を字幕セグメントに分割する。
 * 文（。！？）で区切り、長い文は読点でさらに分割、短すぎる断片は結合する。
 */
const splitIntoSegments = (text: string): string[] => {
  const sentences = text
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 34) {
      segments.push(sentence);
      continue;
    }
    let current = "";
    for (const part of sentence.split(/(?<=、)/)) {
      if (current && (current + part).length > 30) {
        segments.push(current);
        current = part;
      } else {
        current += part;
      }
    }
    if (current) {
      segments.push(current);
    }
  }

  const merged: string[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.length + seg.length <= 18) {
      merged[merged.length - 1] = last + seg;
    } else {
      merged.push(seg);
    }
  }
  return merged;
};

/**
 * シーン内の字幕。音声の実測フレーム数に対して各セグメントの表示時間を割り当てる。
 * 重みは「表示文字数」ではなく「発話形（英語→カタカナ）の長さ＋句読点の間」で測る。
 * 例: "JavaScript"（表示10字）も発話形 "ジャバスクリプト"（8拍）で測るので、
 * 英語語の多い区間でも字幕が音声に対して遅れない。
 */
export const CaptionOverlay = ({
  narration,
  audioFrames,
}: {
  narration: string;
  audioFrames: number;
}) => {
  const frame = useCurrentFrame();

  // セグメント分割と尺配分はフレームに依存しないので一度だけ計算する。
  // 句点 ≒ 0.45s、読点 ≒ 0.24s 相当で間を重く取る（Chirp の読点・句点ポーズに対応）。
  const timeline = useMemo(() => {
    const segments = splitIntoSegments(narration);
    const weighOf = (s: string) =>
      [...toSpoken(s, DICT)].reduce(
        (w, c) => w + ("。！？".includes(c) ? 4 : "、，".includes(c) ? 2.5 : 1),
        0,
      );
    const weights = segments.map(weighOf);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
    // 各シーン冒頭に約0.3秒の無音（Chirp のリードイン）があり、加えて文字重みモデルは
    // 発話速度をやや過小評価するため、字幕が音声より少し遅れる（実測）。全体を LEAD だけ
    // 控えめに前倒しして補正する（seg0 は 0 にクランプ。各セグメントは次の開始まで表示）。
    // 大きすぎると同期済みシーンが早まるため、共通の遅れ分にとどめる（6f ≒ 0.20s）。
    const LEAD = 6;
    // 各シーンの音声は先頭に Chirp のリードイン無音（実測 約0.27〜0.33s）を持つ。
    // seg0 は rawStart=0 で LEAD では 0 にクランプされ、声より早く字幕が出てしまう
    // （冒頭だけ字幕先行）。seg0 だけこの無音ぶん遅らせ、声の出だしに合わせる。
    // 2 番目以降は従来どおり（rawStart - LEAD）で既存の同期調整を保つ。
    const INTRO_LEAD = 8;
    const rawStarts: number[] = [];
    let acc = 0;
    for (const w of weights) {
      rawStarts.push(acc);
      acc += (w / totalWeight) * audioFrames;
    }
    const startOf = (i: number) =>
      i === 0 ? INTRO_LEAD : Math.max(0, rawStarts[i] - LEAD);
    return segments.map((text, i) => {
      const start = startOf(i);
      const next =
        i < segments.length - 1
          ? Math.max(start + 1, startOf(i + 1))
          : audioFrames;
      return { text, start, dur: Math.max(1, next - start) };
    });
  }, [narration, audioFrames]);

  const current = timeline.find(
    (seg) => frame >= seg.start && frame < seg.start + seg.dur,
  );

  if (!current || frame > audioFrames) {
    return null;
  }

  // カラオケ送りは廃止。セグメント単位でフェードイン／アウトし、わずかに持ち上げる
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fadeIn = interpolate(frame, [current.start, current.start + 3], [0, 1], clamp);
  const fadeOut = interpolate(
    frame,
    [current.start + current.dur - 6, current.start + current.dur],
    [1, 0],
    clamp,
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const lift = interpolate(frame, [current.start, current.start + 9], [7, 0], clamp);
  // 字幕は句点「。」を出さない（字幕の慣習）。末尾の読点も落とす
  const display = current.text.replace(/。/g, "").replace(/[、，]\s*$/, "").trim();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          background: theme.captionBg,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "18px 44px",
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: 0.4,
          lineHeight: 1.5,
          color: "#FFFFFF",
          fontFamily: theme.fontJa,
          boxShadow: "0 18px 44px rgba(7,24,30,0.30)",
          opacity,
          transform: `translateY(${lift}px)`,
        }}
      >
        {display}
      </div>
    </div>
  );
};
