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

  // タイトル長に応じてサイズを段階的に下げ、1行に収める（長いタイトルで番号が改行されるのを防ぐ）
  const titleLen = [...scene.title].length;
  const titleSize =
    titleLen <= 12 ? 88 : titleLen <= 16 ? 74 : titleLen <= 20 ? 62 : 54;
  const noSize = Math.round(titleSize * 0.7);

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
          justifyContent: "center",
          gap: 32,
          maxWidth: 1760,
          padding: "0 60px",
        }}
      >
        <span
          style={{
            fontFamily: theme.fontMono,
            fontSize: noSize,
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
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
            fontSize: titleSize,
            fontWeight: 700,
            color: theme.text,
            margin: 0,
            letterSpacing: 1.5,
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
