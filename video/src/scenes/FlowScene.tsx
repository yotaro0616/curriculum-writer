import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { grow, springIn } from "../anim";
import { theme } from "../theme";
import type { FlowScene as FlowSceneType, FlowStep } from "../types";
import { SceneHeading } from "./SceneHeading";

// 矢印が伸びきるまでのフレーム数。短くしてきびきび描く（旧 12 は伸びが遅く感じた）
const ARROW_GROW = 7;

const StepBox = ({ step }: { step: FlowStep }) => (
  <div
    style={{
      background: theme.panelGrad,
      borderRadius: 18,
      padding: "32px 46px",
      textAlign: "center",
      minWidth: 230,
      boxShadow: step.emphasis
        ? `${theme.edge}, 0 0 0 1.5px ${theme.accent}, 0 0 0 7px ${theme.accentSoft}, ${theme.elev}`
        : `${theme.edge}, ${theme.elev}`,
    }}
  >
    <div
      style={{
        fontFamily: theme.fontMono,
        fontSize: 40,
        fontWeight: 700,
        color: step.emphasis ? theme.accentDeep : theme.text,
      }}
    >
      {step.label}
    </div>
    {step.sub ? (
      <div style={{ fontSize: 25, color: theme.dim, marginTop: 10 }}>
        {step.sub}
      </div>
    ) : null}
  </div>
);

/** 連結矢印。len で長さを変える（ステップ間は短め、fanout は長めにして横を埋める） */
const Arrow = ({ progress, len = 72 }: { progress: number; len?: number }) => (
  <div style={{ display: "flex", alignItems: "center", opacity: progress > 0.04 ? 1 : 0 }}>
    <div
      style={{
        width: len,
        height: 6,
        borderRadius: 3,
        background: theme.lineStrong,
        transform: `scaleX(${progress})`,
        transformOrigin: "left",
      }}
    />
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `18px solid ${theme.lineStrong}`,
        borderTop: "12px solid transparent",
        borderBottom: "12px solid transparent",
        opacity: progress > 0.82 ? 1 : 0,
      }}
    />
  </div>
);

export const FlowScene = ({ scene }: { scene: FlowSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 400;
  // fanout が5個以上だと縦に伸びて heading や tagline と干渉するため、その時だけ
  // 間隔・余白・文字を詰めてコンパクトにする（3個以下の flow には影響しない）。
  const manyFanout = (scene.fanout?.length ?? 0) >= 5;

  // 各ステップの開始フレーム。revealAt があればナレーションに合わせて上書きできる
  const stepAt = (i: number) =>
    scene.revealAt?.[i] != null
      ? Math.round(audioFrames * (scene.revealAt[i] as number))
      : Math.round(audioFrames * (0.04 + i * 0.12));

  // fanout 各チップの開始フレーム。
  //  - fanoutAt が配列なら、その項目をナレーションで言う位置に合わせて1枚ずつ出す
  //  - 数値（既定 0.42）なら、その位置から少しずつずらして出す
  const fanoutAtFrame = (j: number): number => {
    const fa = scene.fanoutAt;
    if (Array.isArray(fa)) {
      const frac = fa[j] ?? fa[fa.length - 1] ?? 0.42;
      return Math.round(audioFrames * frac);
    }
    const base = audioFrames * (typeof fa === "number" ? fa : 0.42);
    return Math.round(base + j * 8);
  };

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: scene.tagline ? 120 : 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        {scene.steps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {i > 0 ? <Arrow progress={grow(frame, stepAt(i) - 8, ARROW_GROW)} /> : null}
            <div style={springIn(frame, fps, stepAt(i))}>
              <StepBox step={step} />
            </div>
          </div>
        ))}

        {scene.fanout ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: manyFanout ? 18 : 42,
              marginLeft: 4,
            }}
          >
            {scene.fanout.map((os, j) => {
              const at = fanoutAtFrame(j);
              return (
                <div
                  key={os.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    ...springIn(frame, fps, at),
                  }}
                >
                  <Arrow progress={grow(frame, at, ARROW_GROW)} len={150} />
                  <div
                    style={{
                      background: theme.panelGrad,
                      borderRadius: 16,
                      padding: manyFanout ? "14px 48px" : "26px 60px",
                      fontSize: manyFanout ? 38 : 42,
                      fontWeight: 600,
                      color: theme.text,
                      marginLeft: 10,
                      minWidth: 200,
                      textAlign: "center",
                      boxShadow: `${theme.edge}, ${theme.elev}`,
                    }}
                  >
                    {os.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {scene.tagline ? (
        <div
          style={{
            position: "absolute",
            bottom: 170,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...springIn(frame, fps, Math.round(audioFrames * 0.84)),
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              borderRadius: 14,
              padding: "16px 40px",
              fontSize: 38,
              fontWeight: 700,
              color: theme.accentDeep,
              background: theme.panelGrad,
              boxShadow: `${theme.edge}, ${theme.elev}`,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: theme.accent,
              }}
            />
            {scene.tagline}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
