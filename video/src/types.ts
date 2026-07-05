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
  /** IDE ウィンドウのタブに出すファイル名（省略時は label を使う） */
  file?: string;
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
  /** 右ペインが登場するタイミング（audioFrames に対する 0〜1 の比。ナレーションで右の話に移る位置に合わせる。既定 0.45） */
  rightAt?: number;
  right: CodePane;
};

export type KeypointScene = SceneBase & {
  type: "keypoint";
  /** 各カードが登場するタイミング（audioFrames に対する 0〜1 の比の配列。ナレーションで各概念に触れる位置に合わせる） */
  revealAt?: number[];
  cards: { title: string; body: string }[];
};

export type FigureScene = SceneBase & {
  type: "figure";
  src: string;
  alt?: string;
};

/** ターミナル1行: シェル行（cmd/out/comment）か Claude Code セッション行（user/claude/tool/approve）のいずれか */
export type TermLine =
  | { cmd: string; note?: string; prompt?: string } // シェル: 入力行
  | { out: string } // シェル: 出力行
  | { comment: string } // 注釈行（# …）
  | { user: string } // Claude Code: ユーザー発話（> プロンプト）
  | { claude: string } // Claude Code: Claude の応答（アクセント色の ⏺）
  | { tool: string; result?: string } // Claude Code: ツール実行（⏺ Tool(args) ＋ ⎿ 結果）
  | { approve: string; options?: string[] }; // Claude Code: 承認ゲート（アクセント枠の確認ボックス）

export type TerminalScene = SceneBase & {
  type: "terminal";
  /** タイトルバー中央の文字（例 "ターミナル — projects"）。省略時は "ターミナル" */
  windowTitle?: string;
  /** 入力行の先頭プロンプト（例 "you@Mac ~/projects %"）。省略時は既定 */
  prompt?: string;
  /** 各ステップ（コマンド + その出力のまとまり）の開始タイミング（audioFrames に対する 0〜1 の配列）。ナレーションが各コマンドに触れる位置に合わせる。省略時は音声尺へ自動で均等配分 */
  revealAt?: number[];
  lines: TermLine[];
};

/** ターミナル比較の1ペイン（指示の良し悪しと出力差を左右で見せる）。
 *  lines に使えるのは user / claude / comment / out の4種のみ
 *  （シェル行 cmd・ツール実行 tool・承認 approve は terminal シーン専用。lint も検査する） */
export type TerminalPane = {
  /** タイトルバー中央の文字。省略時は "Claude Code" */
  windowTitle?: string;
  lines: TermLine[];
  /** ペイン下の一言。`good: true` でアクセント色の強調になる */
  caption?: string;
  /** caption と枠をアクセント色で強調（良い側に付ける） */
  good?: boolean;
};

export type TerminalCompareScene = SceneBase & {
  type: "terminalCompare";
  left: TerminalPane;
  right: TerminalPane;
  /** 右ペインが動き出すタイミング（audioFrames に対する 0〜1。ナレーションで右の話に移る位置。既定 0.45） */
  rightAt?: number;
};

export type FlowStep = { label: string; sub?: string; emphasis?: boolean };

export type FlowScene = SceneBase & {
  type: "flow";
  /** 各ステップの登場タイミング（audioFrames に対する 0〜1 の配列。ナレーションで各ステップに触れる位置に合わせる。省略時は自動配分） */
  revealAt?: number[];
  /** fanout（分岐チップ）の登場タイミング（audioFrames に対する 0〜1）。
   *  - 数値: その位置から各チップを少しずつずらして出す（省略時 0.42）
   *  - 配列: チップごとに位置を指定（ナレーションで各項目を言う瞬間に1枚ずつ出す） */
  fanoutAt?: number | number[];
  steps: FlowStep[];
  fanout?: { label: string }[];
  tagline?: string;
};

export type NestScene = SceneBase & {
  type: "nest";
  /** 内側 → 外側の順 */
  layers: { label: string; desc: string }[];
  /** 各層の登場タイミング（audioFrames に対する 0〜1）。layers と同じ内側→外側の並び。
   *  省略時は既定の出現順（外側＝容れ物から先に出す）。ナレーションで各層を言う位置に
   *  合わせるときは caption-times.mjs で字幕セグメント開始を確認して設定する。 */
  revealAt?: number[];
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
  | TerminalScene
  | TerminalCompareScene
  | FlowScene
  | NestScene
  | OutroScene;

export type SectionVideoProps = {
  sectionId: string;
  sectionLabel: string;
  title: string;
  scenes: Scene[];
};
