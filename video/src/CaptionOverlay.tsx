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

  const opacity = interpolate(frame, [current.start, current.start + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = (frame - current.start) / current.dur;
  const revealed = Math.min(
    current.text.length,
    Math.ceil(progress * current.text.length * 1.06),
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 52,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          background: "rgba(13,33,44,0.92)",
          borderLeft: `6px solid ${theme.accent}`,
          borderRadius: 10,
          padding: "16px 34px",
          fontSize: 38,
          lineHeight: 1.5,
          fontFamily: theme.fontJa,
          boxShadow: "0 12px 34px rgba(16,42,56,0.22)",
          opacity,
        }}
      >
        <span style={{ color: "#FFFFFF" }}>{current.text.slice(0, revealed)}</span>
        <span style={{ color: "rgba(255,255,255,0.42)" }}>
          {current.text.slice(revealed)}
        </span>
      </div>
    </div>
  );
};
