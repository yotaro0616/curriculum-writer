import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { grow, springIn } from "../anim";
import { theme } from "../theme";
import type { TitleScene as TitleSceneType } from "../types";

export const TitleScene = ({
  scene,
  sectionLabel,
}: {
  scene: TitleSceneType;
  sectionLabel: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: theme.fontJa,
      }}
    >
      <div style={{ ...springIn(frame, fps, 4), marginBottom: 36 }}>
        <span
          style={{
            border: `2px solid ${theme.panelBorder}`,
            borderRadius: 999,
            padding: "10px 30px",
            fontSize: 30,
            color: theme.dim,
            letterSpacing: 1,
          }}
        >
          {sectionLabel}
        </span>
      </div>

      <div
        style={{
          ...springIn(frame, fps, 12),
          display: "flex",
          alignItems: "baseline",
          gap: 36,
        }}
      >
        <span
          style={{
            fontFamily: theme.fontMono,
            fontSize: 64,
            fontWeight: 700,
            color: theme.accent,
            textShadow: "0 6px 26px rgba(237,139,0,0.3)",
          }}
        >
          {scene.sectionNo}
        </span>
        <h1
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: theme.text,
            margin: 0,
            letterSpacing: 2,
          }}
        >
          {scene.title}
        </h1>
      </div>

      <div
        style={{
          height: 6,
          width: 760,
          marginTop: 44,
          background: `linear-gradient(90deg, ${theme.primaryDeep}, ${theme.accent})`,
          borderRadius: 3,
          transform: `scaleX(${grow(frame, 26, 18)})`,
        }}
      />

      <p
        style={{
          ...springIn(frame, fps, 38),
          fontSize: 42,
          color: theme.dim,
          marginTop: 44,
        }}
      >
        {scene.subtitle}
      </p>
    </AbsoluteFill>
  );
};
