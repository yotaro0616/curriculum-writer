import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { FigureScene as FigureSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

export const FigureScene = ({ scene }: { scene: FigureSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = scene.totalFrames ?? 450;
  const scale = interpolate(frame, [0, totalFrames], [1, 1.05]);

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          ...springIn(frame, fps, 8),
          position: "absolute",
          top: 205,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 1360,
            height: 648,
            borderRadius: 18,
            overflow: "hidden",
            border: `1px solid ${theme.panelBorder}`,
            background: "#fff",
            boxShadow: `0 0 0 1px rgba(16,22,40,0.03), ${theme.elevHigh}`,
          }}
        >
          <Img
            src={staticFile(scene.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `scale(${scale})`,
              scale: 0.973255,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
