import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fade, springIn } from "../anim";
import { theme } from "../theme";
import type {
  TerminalCompareScene as TerminalCompareSceneType,
  TermLine,
  TerminalPane,
} from "../types";
import { SceneHeading } from "./SceneHeading";

const FONT = 26;
const LINE_H = 1.62;
const CHAR_SPEED = 0.9; // 入力1文字あたりのフレーム数
const PANE_W = 860;

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type Kind = "user" | "claude" | "comment" | "out";
const kindOf = (l: TermLine): Kind =>
  "user" in l ? "user" : "claude" in l ? "claude" : "comment" in l ? "comment" : "out";

/** ユーザー発話: > プロンプト + タイピング（折り返しあり） */
const UserRow = ({ text, start, frame }: { text: string; start: number; frame: number }) => {
  const typed = Math.floor(
    interpolate(frame, [start, start + text.length * CHAR_SPEED], [0, text.length], clampOpt),
  );
  const typing = typed > 0 && typed < text.length;
  return (
    <div
      style={{
        fontFamily: theme.fontMono,
        fontSize: FONT,
        lineHeight: LINE_H,
        whiteSpace: "pre-wrap",
        opacity: frame >= start ? 1 : 0,
        marginTop: 8,
      }}
    >
      <span style={{ color: theme.codeGutter }}>&gt; </span>
      <span style={{ color: theme.codeText }}>{text.slice(0, typed)}</span>
      {typing ? (
        <span style={{ color: theme.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>▍</span>
      ) : null}
    </div>
  );
};

/** Claude の応答: ⏺（アクセント色）+ 本文（フェード） */
const ClaudeRow = ({ text, start, frame }: { text: string; start: number; frame: number }) => (
  <div
    style={{
      display: "flex",
      gap: 10,
      fontFamily: theme.fontMono,
      fontSize: FONT,
      lineHeight: LINE_H,
      opacity: fade(frame, start),
      marginTop: 12,
    }}
  >
    <span style={{ color: theme.accent }}>⏺</span>
    <span style={{ color: theme.codeText, whiteSpace: "pre-wrap" }}>{text}</span>
  </div>
);

/** 出力（生成物の抜粋）: ⎿ 付きの淡色。フェード */
const OutRow = ({ text, start, frame }: { text: string; start: number; frame: number }) => (
  <div
    style={{
      fontFamily: theme.fontMono,
      fontSize: FONT - 2,
      lineHeight: LINE_H,
      whiteSpace: "pre-wrap",
      color: theme.codeGutter,
      opacity: fade(frame, start),
      marginTop: 8,
      paddingLeft: 30,
    }}
  >
    {`⎿  ${text}`}
  </div>
);

const CommentRow = ({ text, start, frame }: { text: string; start: number; frame: number }) => (
  <div
    style={{
      fontFamily: theme.fontMono,
      fontSize: FONT - 2,
      lineHeight: LINE_H,
      whiteSpace: "pre-wrap",
      color: theme.codeComment,
      opacity: fade(frame, start),
      marginTop: 8,
    }}
  >
    {`# ${text}`}
  </div>
);

const Pane = ({
  pane,
  startFrame,
  endFrame,
  frame,
  fps,
}: {
  pane: TerminalPane;
  startFrame: number;
  endFrame: number;
  frame: number;
  fps: number;
}) => {
  // 行をナレーション尺に合わせて [startFrame, endFrame] に均等配分する
  // （まとめて一気に出さず、語りに合わせて1行ずつ出し、音声とズレないようにする）
  const n = pane.lines.length;
  const span = Math.max(30, endFrame - startFrame);
  const starts = pane.lines.map((_, i) =>
    Math.round(startFrame + 8 + (span - 8) * (i / Math.max(1, n))),
  );
  const lastStart = starts[starts.length - 1] ?? startFrame;
  const captionIn = springIn(frame, fps, lastStart + 26);
  const accent = pane.good ? theme.accent : theme.codeBorder;

  return (
    <div style={{ ...springIn(frame, fps, startFrame), width: PANE_W }}>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${pane.good ? theme.accent : theme.codeBorder}`,
          boxShadow: pane.good
            ? `0 0 0 5px ${theme.accentSoft}, ${theme.elevHigh}`
            : theme.elevHigh,
        }}
      >
        {/* タイトルバー（信号機ドット + 中央タイトル） */}
        <div
          style={{
            height: 44,
            background: theme.codeChrome,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {theme.codeDots.map((c) => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: theme.fontMono,
              fontSize: 18,
              color: theme.codeTabText,
              pointerEvents: "none",
            }}
          >
            {pane.windowTitle ?? "Claude Code"}
          </div>
        </div>
        {/* 本体 */}
        <div style={{ background: theme.codeBg, padding: "20px 28px", minHeight: 320 }}>
          {pane.lines.map((l, i) => {
            const k = kindOf(l);
            if (k === "user") {
              return <UserRow key={i} text={(l as { user: string }).user} start={starts[i]} frame={frame} />;
            }
            if (k === "claude") {
              return <ClaudeRow key={i} text={(l as { claude: string }).claude} start={starts[i]} frame={frame} />;
            }
            if (k === "comment") {
              return <CommentRow key={i} text={(l as { comment: string }).comment} start={starts[i]} frame={frame} />;
            }
            return <OutRow key={i} text={(l as { out: string }).out} start={starts[i]} frame={frame} />;
          })}
        </div>
      </div>
      {pane.caption ? (
        <div
          style={{
            ...captionIn,
            marginTop: 18,
            fontSize: 28,
            fontFamily: theme.fontJa,
            fontWeight: 700,
            color: pane.good ? theme.accentText : theme.dim,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {pane.good ? (
            <span style={{ width: 11, height: 11, borderRadius: 3, background: accent }} />
          ) : null}
          {pane.caption}
        </div>
      ) : null}
    </div>
  );
};

export const TerminalCompareScene = ({ scene }: { scene: TerminalCompareSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 300;
  const rightStart = Math.round(audioFrames * (scene.rightAt ?? 0.45));

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 236,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 56,
        }}
      >
        <Pane
          pane={scene.left}
          startFrame={8}
          endFrame={Math.round(audioFrames * 0.4)}
          frame={frame}
          fps={fps}
        />
        <Pane
          pane={scene.right}
          startFrame={rightStart}
          endFrame={Math.round(audioFrames * 0.96)}
          frame={frame}
          fps={fps}
        />
      </div>
    </AbsoluteFill>
  );
};
