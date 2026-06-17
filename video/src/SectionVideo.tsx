import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Img,
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

export const TRANSITION_FRAMES = 9;
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

/**
 * 背景（純白）。奥行きはコンポーネントの段差で出すため、背景はテクスチャを
 * 持たせない。完全な平板を避ける程度に、ほぼ不可視のクールな光だけ置く。
 */
const Backdrop = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.bg2 }}>
      <div
        style={{
          position: "absolute",
          width: 1700,
          height: 1700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.haze} 0%, transparent 68%)`,
          right: -360 + Math.sin(frame / 340) * 18,
          top: -460,
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
        height: 4,
        width: (frame / durationInFrames) * width,
        background: theme.accentGrad,
        opacity: 0.95,
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
    <AbsoluteFill
      style={{ background: theme.bg2, opacity, pointerEvents: "none" }}
    />
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

/**
 * 全シーン左上に固定するブランドロゴ（横長ワードマーク。サイトのヘッダー風）。
 * 画像は brand.ts の logo（= theme.logo）で差し替える。明面基調なので隅に大きめに置く。
 */
const BrandHeader = () => {
  if (!theme.logo) return null; // ロゴ未設定のプロジェクトでは何も出さない
  return (
    <div style={{ position: "absolute", top: 40, left: 38 }}>
      <Img
        src={staticFile(theme.logo)}
        style={{ height: 32, width: "auto", opacity: 0.88 }}
      />
    </div>
  );
};

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
        <BrandHeader />
        <CaptionOverlay
          narration={scene.narration}
          audioFrames={
            scene.audioFrames ?? scene.totalFrames ?? DEFAULT_SCENE_FRAMES
          }
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
        background: theme.bg2,
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
