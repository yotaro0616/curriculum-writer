import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { OutroScene as OutroSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

export const OutroScene = ({ scene }: { scene: OutroSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 400;

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 240,
          right: 240,
          display: "flex",
          flexDirection: "column",
          gap: 44,
        }}
      >
        {scene.points.map((point, i) => (
          <div
            key={i}
            style={{
              ...springIn(frame, fps, 10 + Math.round(audioFrames * 0.16) * i),
              display: "flex",
              alignItems: "flex-start",
              gap: 28,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                marginTop: 18,
                background: theme.accent,
                borderRadius: 4,
                flexShrink: 0,
                boxShadow: "0 0 0 5px rgba(237,139,0,0.14)",
              }}
            />
            <div style={{ fontSize: 40, lineHeight: 1.6, color: theme.text }}>
              {point}
            </div>
          </div>
        ))}
      </div>

      {scene.next ? (
        <div
          style={{
            position: "absolute",
            bottom: 160,
            right: 140,
            ...springIn(frame, fps, Math.round(audioFrames * 0.82)),
          }}
        >
          <span style={{ fontSize: 30, color: theme.dim, marginRight: 20 }}>
            次のセクション
          </span>
          <span style={{ fontSize: 34, color: theme.accent, fontWeight: 700 }}>
            ▶ {scene.next}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
