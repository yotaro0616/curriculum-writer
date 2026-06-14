export type SceneBase = {
  id: string;
  heading?: string;
  /** 字幕に表示するナレーション原稿（表示用） */
  narration: string;
  /** TTS に渡す読み上げ用原稿（読み調整済み）。省略時は narration を使う */
  reading?: string;
  /** 生成された音声ファイル（public/ からの相対パス） */
  audioSrc?: string;
  /** 音声の実測フレーム数 */
  audioFrames?: number;
  /** シーン全体のフレーム数（音声 + 余白） */
  totalFrames?: number;
};

export type CodePane = {
  label: string;
  labelColor?: string;
  lines: string[];
  /** 0 始まりの行番号。コンパイルエラー演出を付ける行 */
  errorLine?: number;
  caption?: string;
};

export type TitleScene = SceneBase & {
  type: "title";
  sectionNo: string;
  title: string;
  subtitle: string;
};

export type CodeCompareScene = SceneBase & {
  type: "codeCompare";
  left: CodePane;
  right: CodePane;
};

export type KeypointScene = SceneBase & {
  type: "keypoint";
  cards: { title: string; body: string }[];
};

export type FigureScene = SceneBase & {
  type: "figure";
  src: string;
  alt?: string;
};

export type FlowStep = { label: string; sub?: string; emphasis?: boolean };

export type FlowScene = SceneBase & {
  type: "flow";
  steps: FlowStep[];
  fanout?: { label: string }[];
  tagline?: string;
};

export type NestScene = SceneBase & {
  type: "nest";
  /** 内側 → 外側の順 */
  layers: { label: string; desc: string }[];
  formula?: string;
};

export type OutroScene = SceneBase & {
  type: "outro";
  points: string[];
  next?: string;
};

export type Scene =
  | TitleScene
  | CodeCompareScene
  | KeypointScene
  | FigureScene
  | FlowScene
  | NestScene
  | OutroScene;

export type SectionVideoProps = {
  sectionId: string;
  sectionLabel: string;
  title: string;
  scenes: Scene[];
};
