import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { grow, springIn } from "../anim";
import { theme } from "../theme";
import type { FlowScene as FlowSceneType, FlowStep } from "../types";
import { SceneHeading } from "./SceneHeading";

const StepBox = ({ step }: { step: FlowStep }) => (
  <div
    style={{
      background: theme.panelGrad,
      borderRadius: 16,
      padding: "26px 36px",
      textAlign: "center",
      minWidth: 200,
      boxShadow: step.emphasis
        ? `${theme.edge}, 0 0 0 1.5px ${theme.accent}, 0 0 0 7px ${theme.accentSoft}, ${theme.elev}`
        : `${theme.edge}, ${theme.elev}`,
    }}
  >
    <div
      style={{
        fontFamily: theme.fontMono,
        fontSize: 36,
        fontWeight: 700,
        color: step.emphasis ? theme.accentDeep : theme.text,
      }}
    >
      {step.label}
    </div>
    {step.sub ? (
      <div style={{ fontSize: 24, color: theme.dim, marginTop: 10 }}>
        {step.sub}
      </div>
    ) : null}
  </div>
);

const Arrow = ({ progress }: { progress: number }) => (
  <div style={{ display: "flex", alignItems: "center", opacity: progress }}>
    <div
      style={{
        width: 56,
        height: 5,
        background: theme.lineStrong,
        transform: `scaleX(${progress})`,
        transformOrigin: "left",
      }}
    />
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `16px solid ${theme.lineStrong}`,
        borderTop: "11px solid transparent",
        borderBottom: "11px solid transparent",
        opacity: progress > 0.9 ? 1 : 0,
      }}
    />
  </div>
);

export const FlowScene = ({ scene }: { scene: FlowSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 400;
  const stepAt = (i: number) => Math.round(audioFrames * (0.04 + i * 0.13));
  const fanoutBase = Math.round(audioFrames * 0.58);

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
          gap: 14,
        }}
      >
        {scene.steps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {i > 0 ? <Arrow progress={grow(frame, stepAt(i) - 10, 12)} /> : null}
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
              gap: 26,
              marginLeft: 10,
            }}
          >
            {scene.fanout.map((os, j) => (
              <div
                key={os.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  ...springIn(frame, fps, fanoutBase + j * 12),
                }}
              >
                <Arrow progress={grow(frame, fanoutBase + j * 12, 12)} />
                <div
                  style={{
                    background: theme.panelGrad,
                    borderRadius: 999,
                    padding: "14px 34px",
                    fontSize: 28,
                    color: theme.text,
                    marginLeft: 8,
                    boxShadow: `${theme.edge}, ${theme.elevSoft}`,
                  }}
                >
                  {os.label}
                </div>
              </div>
            ))}
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
