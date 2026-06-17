import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fade, shake, springIn } from "../anim";
import { tokenize } from "../highlight";
import { theme } from "../theme";
import type { CodeCompareScene as CodeCompareSceneType, CodePane } from "../types";
import { SceneHeading } from "./SceneHeading";

const CHAR_SPEED = 1.0; // 1文字あたりのフレーム数
const LINE_GAP = 8; // 行の打ち始めの間隔（前行完了後の待ち）
const FONT = 31;
const LINE_H = 1.95;

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** 1 行のコード（タイピング演出 + シンタックスハイライト） */
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
  const tokens = useMemo(() => tokenize(line), [line]);
  const typedChars = Math.floor(
    interpolate(
      frame,
      [startFrame, startFrame + line.length * CHAR_SPEED],
      [0, line.length],
      clampOpt,
    ),
  );
  const typing = typedChars > 0 && typedChars < line.length;
  const done = typedChars >= line.length;
  const errorOpacity =
    isError && done ? fade(frame, startFrame + line.length * CHAR_SPEED + 8) : 0;

  // typedChars までトークンを色付きで出す（境界トークンはスライス）
  let remaining = typedChars;
  const spans = [];
  for (let k = 0; k < tokens.length && remaining > 0; k++) {
    const tk = tokens[k];
    spans.push(
      <span key={k} style={{ color: theme.syntax[tk.cls] ?? theme.codeText }}>
        {tk.text.slice(0, remaining)}
      </span>,
    );
    remaining -= tk.text.length;
  }

  return (
    <div
      style={{
        fontFamily: theme.fontMono,
        fontSize: FONT,
        lineHeight: LINE_H,
        whiteSpace: "pre",
        background: isError
          ? `rgba(255,122,122,${0.16 * errorOpacity})`
          : "transparent",
        borderRadius: 4,
        margin: "0 -10px",
        padding: "0 10px",
      }}
    >
      <span
        style={{
          textDecoration: errorOpacity > 0.5 ? "underline wavy" : "none",
          textDecorationColor: theme.errorOnDark,
          textUnderlineOffset: 8,
        }}
      >
        {spans}
      </span>
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
  // 各行の打ち始めフレーム
  const lineStarts: number[] = [];
  let cursor = startFrame + 16;
  for (const line of pane.lines) {
    lineStarts.push(cursor);
    cursor += line.length * CHAR_SPEED + LINE_GAP;
  }
  const lastLine = pane.lines[pane.lines.length - 1] ?? "";
  const typingDone = lineStarts[lineStarts.length - 1] + lastLine.length * CHAR_SPEED;
  const captionIn = springIn(frame, fps, typingDone + 14);
  const tab = pane.file ?? pane.label;

  return (
    <div style={{ ...springIn(frame, fps, startFrame), width: 790 }}>
      {/* IDE ウィンドウ */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${theme.codeBorder}`,
          boxShadow: theme.elevHigh,
        }}
      >
        {/* タイトルバー（信号機ドット + ファイル名タブ） */}
        <div
          style={{
            height: 42,
            background: theme.codeChrome,
            display: "flex",
            alignItems: "flex-end",
            paddingLeft: 18,
            gap: 9,
          }}
        >
          <div style={{ display: "flex", gap: 9, alignItems: "center", height: 42 }}>
            {theme.codeDots.map((c) => (
              <div
                key={c}
                style={{ width: 12, height: 12, borderRadius: "50%", background: c }}
              />
            ))}
          </div>
          <div
            style={{
              marginLeft: 16,
              fontFamily: theme.fontMono,
              fontSize: 19,
              color: theme.codeTabText,
              background: theme.codeBg,
              padding: "9px 20px",
              borderRadius: "8px 8px 0 0",
            }}
          >
            {tab}
          </div>
        </div>
        {/* コード（行番号ガター + ハイライト） */}
        <div style={{ background: theme.codeBg, display: "flex", padding: "20px 0", minHeight: 210 }}>
          <div
            style={{
              width: 58,
              flexShrink: 0,
              textAlign: "right",
              paddingRight: 18,
              fontFamily: theme.fontMono,
              fontSize: FONT,
              lineHeight: LINE_H,
              color: theme.codeGutter,
              userSelect: "none",
            }}
          >
            {pane.lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div style={{ flex: 1, paddingRight: 30 }}>
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
        </div>
      </div>
      {pane.caption ? (
        <div
          style={{
            ...captionIn,
            transform: `${captionIn.transform} translateX(${
              pane.errorLine !== undefined ? shake(frame, typingDone + 14) : 0
            }px)`,
            marginTop: 20,
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

export const CodeCompareScene = ({ scene }: { scene: CodeCompareSceneType }) => {
  const frame = useCurrentFrame();
  const audioFrames = scene.audioFrames ?? 300;
  const rightStart = Math.round(audioFrames * (scene.rightAt ?? 0.45));

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 248,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 70,
        }}
      >
        <Pane pane={scene.left} startFrame={8} frame={frame} />
        <Pane pane={scene.right} startFrame={rightStart} frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
