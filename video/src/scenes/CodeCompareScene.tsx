import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fade, shake, springIn } from "../anim";
import { theme } from "../theme";
import type { CodeCompareScene as CodeCompareSceneType, CodePane } from "../types";
import { SceneHeading } from "./SceneHeading";

const CHAR_SPEED = 1.1; // 1文字あたりのフレーム数
const LINE_GAP = 10; // 行の打ち始めの間隔（前行完了後の待ち）

const CodeLine = ({
  line,
  startFrame,
  isError,
  frame,
}: {
  line: string;
  startFrame: number;
  isError: boolean;
  frame: number;
}) => {
  const typedChars = Math.floor(
    interpolate(
      frame,
      [startFrame, startFrame + line.length * CHAR_SPEED],
      [0, line.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );
  const typed = line.slice(0, typedChars);
  const typing = typedChars > 0 && typedChars < line.length;
  const done = typedChars >= line.length;
  const errorOpacity =
    isError && done ? fade(frame, startFrame + line.length * CHAR_SPEED + 8) : 0;

  const commentIndex = typed.indexOf("//");
  const codePart = commentIndex === -1 ? typed : typed.slice(0, commentIndex);
  const commentPart = commentIndex === -1 ? "" : typed.slice(commentIndex);

  return (
    <div
      style={{
        fontFamily: theme.fontMono,
        fontSize: 34,
        lineHeight: 1.9,
        whiteSpace: "pre",
        background: isError ? `rgba(255,122,122,${0.18 * errorOpacity})` : "transparent",
        borderRadius: 6,
        padding: "0 12px",
        margin: "0 -12px",
      }}
    >
      <span
        style={{
          color: theme.codeText,
          textDecoration: errorOpacity > 0.5 ? "underline wavy" : "none",
          textDecorationColor: theme.errorOnDark,
          textUnderlineOffset: 10,
        }}
      >
        {codePart}
      </span>
      <span style={{ color: theme.codeComment }}>{commentPart}</span>
      {typing ? (
        <span style={{ color: theme.accent, opacity: frame % 16 < 8 ? 1 : 0 }}>
          ▍
        </span>
      ) : null}
    </div>
  );
};

const Pane = ({
  pane,
  startFrame,
  frame,
}: {
  pane: CodePane;
  startFrame: number;
  frame: number;
}) => {
  const { fps } = useVideoConfig();
  // 各行の打ち始めフレーム（前の行が打ち終わってから始める）
  const lineStarts: number[] = [];
  let cursor = startFrame + 14;
  for (const line of pane.lines) {
    lineStarts.push(cursor);
    cursor += line.length * CHAR_SPEED + LINE_GAP;
  }
  const lastLine = pane.lines[pane.lines.length - 1] ?? "";
  const typingDone =
    lineStarts[lineStarts.length - 1] + lastLine.length * CHAR_SPEED;

  const captionIn = springIn(frame, fps, typingDone + 14);

  return (
    <div style={{ ...springIn(frame, fps, startFrame), width: 780 }}>
      <span
        style={{
          display: "inline-block",
          background: pane.labelColor ?? theme.primary,
          color: "#fff",
          fontSize: 28,
          fontWeight: 700,
          borderRadius: "10px 10px 0 0",
          padding: "8px 28px",
          fontFamily: theme.fontJa,
        }}
      >
        {pane.label}
      </span>
      <div
        style={{
          background: theme.codeBg,
          border: `1.5px solid ${theme.codeBorder}`,
          borderRadius: "0 14px 14px 14px",
          padding: "34px 38px",
          minHeight: 220,
          boxShadow: "0 22px 50px rgba(16,42,56,0.22)",
        }}
      >
        {pane.lines.map((line, i) => (
          <CodeLine
            key={i}
            line={line}
            startFrame={lineStarts[i]}
            isError={pane.errorLine === i}
            frame={frame}
          />
        ))}
      </div>
      {pane.caption ? (
        <div
          style={{
            ...captionIn,
            transform: `${captionIn.transform} translateX(${
              pane.errorLine !== undefined ? shake(frame, typingDone + 14) : 0
            }px)`,
            marginTop: 18,
            fontSize: 30,
            fontFamily: theme.fontJa,
            color: pane.errorLine !== undefined ? theme.error : theme.dim,
            fontWeight: 600,
          }}
        >
          {pane.caption}
        </div>
      ) : null}
    </div>
  );
};

export const CodeCompareScene = ({
  scene,
}: {
  scene: CodeCompareSceneType;
}) => {
  const frame = useCurrentFrame();
  const audioFrames = scene.audioFrames ?? 300;
  const rightStart = Math.round(audioFrames * 0.45);

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 90,
        }}
      >
        <Pane pane={scene.left} startFrame={8} frame={frame} />
        <Pane pane={scene.right} startFrame={rightStart} frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
