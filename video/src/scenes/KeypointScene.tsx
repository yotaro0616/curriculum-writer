import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { KeypointScene as KeypointSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

export const KeypointScene = ({ scene }: { scene: KeypointSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 300;
  // 2項対比: 1枚目はティールアクセント、2枚目は無彩色の濃スレート（色は1つに集約）
  const accents = [theme.accent, theme.markNeutral];
  // 各カードの登場タイミング（ナレーションで各概念に触れる位置に合わせる）
  const revealAt = (i: number) =>
    Math.round(audioFrames * (scene.revealAt?.[i] ?? 0.04 + i * 0.42));

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 70,
        }}
      >
        {scene.cards.map((card, i) => (
          <div
            key={card.title}
            style={{
              ...springIn(frame, fps, revealAt(i)),
              position: "relative",
              width: 660,
              background: theme.emerald,
              borderRadius: 20,
              padding: "52px 54px 54px",
              boxShadow: `${theme.edge}, ${theme.elev}`,
              overflow: "hidden",
            }}
          >
            {/* 上辺の細いアクセントタブ（色はここだけ） */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: accents[i % accents.length],
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: accents[i % accents.length],
                }}
              />
              <div style={{ fontSize: 46, fontWeight: 700, color: theme.text }}>
                {card.title}
              </div>
            </div>
            <div
              style={{
                fontSize: 37,
                lineHeight: 1.75,
                color: theme.text,
                whiteSpace: "pre-line",
              }}
            >
              {card.body}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
