import { Easing, interpolate, spring } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * 子要素を連鎖的に出すときの 1 要素あたりの遅延（フレーム）。
 * 「動き＝ブランド」: 全シーンでこの間隔を使い、所作を統一する。
 */
export const STAGGER = 3;

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
    // 過減衰気味（damping を critical 以上に）にして跳ねを消し、
    // すっと収まる近未来・大人の所作にする
    config: { damping: 26, stiffness: 120, mass: 0.85 },
  });
  const opacity = interpolate(f, [0, 11], [0, 1], clamp);
  return {
    opacity,
    transform: `translateY(${(1 - s) * 24}px) scale(${0.975 + 0.025 * s})`,
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
