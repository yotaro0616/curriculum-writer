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

  // 見出しがある図は見出しの下に置く。見出しがない図（焼き込みタイトル付きの概念図）は
  // 上に見出しぶんの空白が残って間延びするので、画面の縦中央に大きめに置く。
  const hasHeading = !!scene.heading;
  const figW = hasHeading ? 1152 : 1500;
  const figH = hasHeading ? 648 : 844; // 16:9（元画像 1600×900 と同比＝トリミングなし）
  const top = hasHeading ? 205 : Math.round((1080 - figH) / 2);

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          ...springIn(frame, fps, 8),
          position: "absolute",
          top,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: figW,
            height: figH,
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
              objectFit: "cover",
              transform: `scale(${scale})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
