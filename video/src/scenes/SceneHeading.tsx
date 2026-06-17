import { useCurrentFrame, useVideoConfig } from "remotion";
import { grow, springIn } from "../anim";
import { theme } from "../theme";

export const SceneHeading = ({ heading }: { heading?: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!heading) {
    return null;
  }
  return (
    <div style={{ position: "absolute", top: 96, left: 120 }}>
      <h2
        style={{
          ...springIn(frame, fps, 2),
          fontSize: 54,
          fontWeight: 700,
          color: theme.text,
          margin: 0,
          letterSpacing: 0.5,
          fontFamily: theme.fontJa,
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          height: 3,
          width: 84,
          marginTop: 18,
          background: theme.accentGrad,
          borderRadius: 2,
          transform: `scaleX(${grow(frame, 10, 14)})`,
          transformOrigin: "left",
        }}
      />
    </div>
  );
};
