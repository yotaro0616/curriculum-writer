import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

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
 * シーン内の字幕。音声の実測フレーム数に対して文字数比で各セグメントの表示時間を
 * 割り当て、セグメント内ではカラオケ風に文字を送る（読み上げ位置の目安になる）。
 */
export const CaptionOverlay = ({
  narration,
  audioFrames,
}: {
  narration: string;
  audioFrames: number;
}) => {
  const frame = useCurrentFrame();
  const segments = useMemo(() => splitIntoSegments(narration), [narration]);

  const totalChars = segments.reduce((sum, s) => sum + s.length, 0);
  const lead = 3;
  let acc = lead;
  let current: { text: string; start: number; dur: number } | null = null;
  for (const seg of segments) {
    const dur = (seg.length / totalChars) * (audioFrames - lead);
    if (frame >= acc && frame < acc + dur) {
      current = { text: seg, start: acc, dur };
      break;
    }
    acc += dur;
  }

  if (!current || frame > audioFrames) {
    return null;
  }

  // カラオケ送りは廃止。セグメント単位でフェードイン／アウトし、わずかに持ち上げる
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fadeIn = interpolate(frame, [current.start, current.start + 5], [0, 1], clamp);
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
