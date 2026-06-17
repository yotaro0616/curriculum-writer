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
        background: theme.emerald,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: theme.fontJa,
      }}
    >
      <div style={{ ...springIn(frame, fps, 8), marginBottom: 38 }}>
        <span
          style={{
            background: theme.panelGrad,
            boxShadow: `${theme.edge}, ${theme.elevSoft}`,
            borderRadius: 999,
            padding: "12px 34px",
            fontSize: 30,
            color: theme.dim,
            letterSpacing: 1.2,
          }}
        >
          {sectionLabel}
        </span>
      </div>

      <div
        style={{
          ...springIn(frame, fps, 16),
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
            backgroundImage: theme.accentGrad,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {scene.sectionNo}
        </span>
        <h1
          style={{
            fontSize: 90,
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
          height: 4,
          width: 700,
          marginTop: 46,
          background: theme.accentGrad,
          borderRadius: 2,
          transform: `scaleX(${grow(frame, 30, 18)})`,
        }}
      />

      <p
        style={{
          ...springIn(frame, fps, 42),
          fontSize: 42,
          color: theme.dim,
          marginTop: 44,
          letterSpacing: 0.5,
        }}
      >
        {scene.subtitle}
      </p>
    </AbsoluteFill>
  );
};
