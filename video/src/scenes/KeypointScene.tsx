import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { KeypointScene as KeypointSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

export const KeypointScene = ({ scene }: { scene: KeypointSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 300;
  const accents = [theme.primary, theme.accent];

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 70,
        }}
      >
        {scene.cards.map((card, i) => (
          <div
            key={card.title}
            style={{
              ...springIn(frame, fps, 10 + i * Math.round(audioFrames * 0.3)),
              width: 660,
              background: theme.panel,
              border: `2px solid ${accents[i % accents.length]}`,
              borderRadius: 20,
              padding: "54px 56px",
              boxShadow: theme.shadow,
            }}
          >
            <div
              style={{
                fontSize: 46,
                fontWeight: 700,
                color: accents[i % accents.length],
                marginBottom: 28,
              }}
            >
              {card.title}
            </div>
            <div style={{ fontSize: 38, lineHeight: 1.7, color: theme.text }}>
              {card.body}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
