import { Easing, interpolate, spring } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** フェードイン + 下からのスライドイン（等速系。さりげない要素向け） */
export const fadeUp = (
  frame: number,
  delay: number,
  dur = 14,
): { opacity: number; transform: string } => {
  const opacity = interpolate(frame, [delay, delay + dur], [0, 1], {
    ...clamp,
    easing: EASE,
  });
  const y = interpolate(frame, [delay, delay + dur], [28, 0], {
    ...clamp,
    easing: EASE,
  });
  return { opacity, transform: `translateY(${y}px)` };
};

/** spring 物理による登場（軽いオーバーシュート付き。主役要素向け） */
export const springIn = (
  frame: number,
  fps: number,
  delay: number,
): { opacity: number; transform: string } => {
  const f = Math.max(0, frame - delay);
  const s = spring({
    frame: f,
    fps,
    config: { damping: 13, stiffness: 130, mass: 0.7 },
  });
  const opacity = interpolate(f, [0, 9], [0, 1], clamp);
  return {
    opacity,
    transform: `translateY(${(1 - s) * 40}px) scale(${0.94 + 0.06 * s})`,
  };
};

/** 減衰シェイク（エラー演出など）。translateX の px 値を返す */
export const shake = (frame: number, delay: number): number => {
  const t = frame - delay;
  if (t < 0) {
    return 0;
  }
  const amp = interpolate(t, [0, 18], [9, 0], clamp);
  return Math.sin(t * 1.4) * amp;
};

/** 0 → 1 の進行率（scaleX などに使う） */
export const grow = (frame: number, delay: number, dur = 12): number => {
  return interpolate(frame, [delay, delay + dur], [0, 1], {
    ...clamp,
    easing: EASE,
  });
};

/** フェードのみ */
export const fade = (frame: number, delay: number, dur = 10): number => {
  return interpolate(frame, [delay, delay + dur], [0, 1], {
    ...clamp,
    easing: EASE,
  });
};
