import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { NestScene as NestSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

const SIZES: [number, number][] = [
  [400, 220],
  [740, 420],
  [1080, 620],
];

export const NestScene = ({ scene }: { scene: NestSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 400;
  const appearAt = [0.04, 0.34, 0.6].map((f) => Math.round(audioFrames * f));
  const colors = [theme.accent, theme.primary, "#7E9AA8"];

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      {scene.layers.map((layer, i) => {
        const [w, h] = SIZES[i] ?? SIZES[SIZES.length - 1];
        const f = Math.max(0, frame - (appearAt[i] ?? 0));
        const s = spring({
          frame: f,
          fps,
          config: { damping: 13, stiffness: 120, mass: 0.8 },
        });
        const opacity = interpolate(f, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isInner = i === 0;
        return (
          <div
            key={layer.label}
            style={{
              position: "absolute",
              left: "50%",
              top: "54%",
              width: w,
              height: h,
              // 内側レイヤーほど手前に描く（外側の半透明背景に覆われないように）
              zIndex: scene.layers.length - i,
              transform: `translate(-50%, -50%) scale(${0.86 + 0.14 * s})`,
              opacity,
              border: `3px solid ${colors[i]}`,
              borderRadius: 22,
              background: isInner ? "rgba(237,139,0,0.07)" : "rgba(255,255,255,0.55)",
              boxShadow: isInner ? "0 0 0 8px rgba(237,139,0,0.1)" : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: isInner ? "center" : "flex-start",
              alignItems: isInner ? "center" : "flex-start",
              padding: isInner ? 0 : "20px 32px",
            }}
          >
            <div
              style={{
                fontFamily: theme.fontMono,
                fontSize: isInner ? 48 : 38,
                fontWeight: 700,
                color: colors[i],
              }}
            >
              {layer.label}
            </div>
            <div
              style={{
                fontSize: isInner ? 26 : 24,
                color: theme.dim,
                marginTop: 8,
              }}
            >
              {layer.desc}
            </div>
          </div>
        );
      })}

      {scene.formula ? (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...springIn(frame, fps, Math.round(audioFrames * 0.84)),
              fontFamily: theme.fontMono,
              fontSize: 44,
              fontWeight: 700,
              color: theme.text,
            }}
          >
            {scene.formula}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
