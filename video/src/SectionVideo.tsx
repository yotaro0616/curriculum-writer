import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "./CaptionOverlay";
import { theme } from "./theme";
import type { Scene, SectionVideoProps } from "./types";
import { CodeCompareScene } from "./scenes/CodeCompareScene";
import { FigureScene } from "./scenes/FigureScene";
import { FlowScene } from "./scenes/FlowScene";
import { KeypointScene } from "./scenes/KeypointScene";
import { NestScene } from "./scenes/NestScene";
import { OutroScene } from "./scenes/OutroScene";
import { TitleScene } from "./scenes/TitleScene";

export const TRANSITION_FRAMES = 14;
export const DEFAULT_SCENE_FRAMES = 240;

const SceneContent = ({
  scene,
  sectionLabel,
}: {
  scene: Scene;
  sectionLabel: string;
}) => {
  switch (scene.type) {
    case "title":
      return <TitleScene scene={scene} sectionLabel={sectionLabel} />;
    case "codeCompare":
      return <CodeCompareScene scene={scene} />;
    case "keypoint":
      return <KeypointScene scene={scene} />;
    case "figure":
      return <FigureScene scene={scene} />;
    case "flow":
      return <FlowScene scene={scene} />;
    case "nest":
      return <NestScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
    default:
      return null;
  }
};

/** 背景の奥行きレイヤー: 淡い色味のオーブ + ごく薄いドットグリッド */
const Backdrop = () => {
  const frame = useCurrentFrame();
  const orb = (
    color: string,
    size: number,
    cx: number,
    cy: number,
    k: number,
    opacity: number,
  ) => (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(130px)",
        opacity,
        left: cx + Math.sin(frame / (120 * k)) * 60,
        top: cy + Math.cos(frame / (150 * k)) * 44,
      }}
    />
  );
  return (
    <AbsoluteFill>
      {orb("#BFE5F2", 760, 1150, -220, 1, 0.5)}
      {orb("#FFE2BD", 560, -160, 640, 1.4, 0.4)}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,115,150,0.08) 1.4px, transparent 1.4px)",
          backgroundSize: "34px 34px",
        }}
      />
    </AbsoluteFill>
  );
};

const ProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 7,
        width: (frame / durationInFrames) * width,
        background: `linear-gradient(90deg, ${theme.primaryDeep}, ${theme.accent})`,
      }}
    />
  );
};

/** 最終フレームで背景色へ落とす締めのフェード */
const EndFade = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ background: theme.bg2, opacity, pointerEvents: "none" }} />
  );
};

const SectionChip = ({ label }: { label: string }) => (
  <div
    style={{
      position: "absolute",
      top: 44,
      right: 56,
      fontSize: 24,
      color: theme.dim,
      opacity: 0.85,
      fontFamily: theme.fontJa,
    }}
  >
    {label}
  </div>
);

export const SectionVideo = ({
  sectionId,
  sectionLabel,
  title,
  scenes,
}: SectionVideoProps) => {
  const items = scenes.flatMap((scene, i) => {
    const sequence = (
      <TransitionSeries.Sequence
        key={scene.id}
        durationInFrames={scene.totalFrames ?? DEFAULT_SCENE_FRAMES}
      >
        <SceneContent scene={scene} sectionLabel={sectionLabel} />
        {scene.type !== "title" ? (
          <SectionChip label={`${sectionId} ${title}`} />
        ) : null}
        <CaptionOverlay
          narration={scene.narration}
          audioFrames={scene.audioFrames ?? scene.totalFrames ?? DEFAULT_SCENE_FRAMES}
        />
        {scene.audioSrc ? <Audio src={staticFile(scene.audioSrc)} /> : null}
      </TransitionSeries.Sequence>
    );
    if (i === scenes.length - 1) {
      return [sequence];
    }
    return [
      sequence,
      <TransitionSeries.Transition
        key={`transition-${scene.id}`}
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
    ];
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1500px 1000px at 50% 30%, ${theme.bg2} 0%, ${theme.bg1} 75%)`,
        fontFamily: theme.fontJa,
      }}
    >
      <Backdrop />
      <TransitionSeries>{items}</TransitionSeries>
      <ProgressBar />
      <EndFade />
    </AbsoluteFill>
  );
};
