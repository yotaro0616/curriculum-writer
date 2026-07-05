import { CalculateMetadataFunction, Composition } from "remotion";
import {
  DEFAULT_SCENE_FRAMES,
  SectionVideo,
  TRANSITION_FRAMES,
} from "./SectionVideo";
import type { SectionVideoProps } from "./types";
// レンダ用 Composition の既定 props（`--props=data/<id>.props.json` で上書きされる）。
import smokeJson from "../data/_smoke.props.json";
// 全シーン型デモ（音声なし）。Studio で `demo` を開くと、title〜outro の全シーン型を
// 1つずつスクラブ確認できる。デザイン調整（theme/brand/scenes の編集）はこれを開いて
// ホットリロードで回し、mp4 は確定後に1回だけ焼く。
import demoJson from "../data/_demo.props.json";

// 実セクションを Studio で音声つきプレビューする場合は、TTS 後に生成される
// data/<id>.props.json をここで import して sections に足す（サイドバーに
// `sec-<id>` が増える）。例:
//   import s21 from "../data/2-1.props.json";
//   const sections = [s21] as unknown as SectionVideoProps[];
const sections: SectionVideoProps[] = [];

const FPS = 30;

const smokeProps = smokeJson as unknown as SectionVideoProps;
const demoProps = demoJson as unknown as SectionVideoProps;

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
    <>
      {/* レンダ用（generate が `--props=data/<id>.props.json` で各 Section を渡す） */}
      <Composition
        id="SectionVideo"
        component={SectionVideo}
        durationInFrames={300}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={smokeProps}
        calculateMetadata={calculateMetadata}
      />
      {/* 全シーン型デモ（デザイン調整の既定表示。音声なしでも表示は崩れない） */}
      <Composition
        id="demo"
        component={SectionVideo}
        durationInFrames={300}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={demoProps}
        calculateMetadata={calculateMetadata}
      />
      {/* 実セクションのプレビュー: Section ごとに1つ（サイドバーに sec-2-1 … と並ぶ） */}
      {sections.map((props) => (
        <Composition
          key={props.sectionId}
          id={`sec-${props.sectionId}`}
          component={SectionVideo}
          durationInFrames={300}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={props}
          calculateMetadata={calculateMetadata}
        />
      ))}
    </>
  );
};
