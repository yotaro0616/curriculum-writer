import { CalculateMetadataFunction, Composition } from "remotion";
import {
  DEFAULT_SCENE_FRAMES,
  SectionVideo,
  TRANSITION_FRAMES,
} from "./SectionVideo";
import type { SectionVideoProps } from "./types";
// Studio の既定表示。Section を作り始めたら最新の <id>.props.json に差し替えてよい
// （レンダリングは --props で渡すため、この import は既定値にすぎない）
import propsJson from "../data/_smoke.props.json";

const FPS = 30;

const defaultProps = propsJson as unknown as SectionVideoProps;

const calculateMetadata: CalculateMetadataFunction<SectionVideoProps> = async ({
  props,
}) => {
  const scenesTotal = props.scenes.reduce(
    (sum, scene) => sum + (scene.totalFrames ?? DEFAULT_SCENE_FRAMES),
    0,
  );
  // シーン間トランジションはオーバーラップするぶん総尺から差し引く
  const overlap = TRANSITION_FRAMES * Math.max(0, props.scenes.length - 1);
  return {
    durationInFrames: Math.max(scenesTotal - overlap, FPS),
    defaultOutName: props.sectionId,
  };
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="SectionVideo"
      component={SectionVideo}
      durationInFrames={300}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
