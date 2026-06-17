import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { springIn } from "../anim";
import { theme } from "../theme";
import type { NestScene as NestSceneType } from "../types";
import { SceneHeading } from "./SceneHeading";

// layers は内側→外側の順（[0]=最も内側）。各層は上揃えで入れ子にし、
// ラベルは各ボックスの上に置く（内側ボックスが親のラベルを覆わないようにする）。
const GEOM = [
  { top: 440, width: 430, height: 218 }, // inner（中核クラス）
  { top: 322, width: 720, height: 410 }, // middle（名前空間）
  { top: 200, width: 1000, height: 570 }, // outer（ディレクトリ）
];

export const NestScene = ({ scene }: { scene: NestSceneType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioFrames = scene.audioFrames ?? 400;
  // 外側（容れ物）から順に出す
  const appearFrac = [0.5, 0.3, 0.08]; // index 0=inner が最後
  const n = scene.layers.length;

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontJa }}>
      <SceneHeading heading={scene.heading} />
      {scene.layers.map((layer, i) => {
        const g = GEOM[i] ?? GEOM[GEOM.length - 1];
        const isInner = i === 0;
        const appearAt = Math.round(audioFrames * (appearFrac[i] ?? 0.1));
        const f = Math.max(0, frame - appearAt);
        const s = spring({
          frame: f,
          fps,
          config: { damping: 26, stiffness: 120, mass: 0.85 },
        });
        const opacity = interpolate(f, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // 配色: 外=白＋クールな枠、内=ティールで強調（濃淡フェードにしない）
        const border = isInner ? theme.accent : i === 1 ? "#A7B2C0" : "#CBD3DC";
        const labelColor = isInner ? theme.accentText : theme.text;

        return (
          <div
            key={layer.label}
            style={{
              position: "absolute",
              left: "50%",
              top: g.top,
              width: g.width,
              height: g.height,
              zIndex: n - i,
              transform: `translateX(-50%) scale(${0.94 + 0.06 * s})`,
              transformOrigin: "center top",
              opacity,
              border: `${isInner ? 2 : 1.5}px solid ${border}`,
              borderRadius: 20,
              background: isInner ? theme.emerald : "#FFFFFF",
              boxShadow: isInner
                ? `0 0 0 5px ${theme.accentSoft}, ${theme.elev}`
                : theme.elevSoft,
              display: "flex",
              flexDirection: "column",
              justifyContent: isInner ? "center" : "flex-start",
              alignItems: isInner ? "center" : "flex-start",
              padding: isInner ? 0 : "22px 30px",
            }}
          >
            <div
              style={{
                fontFamily: theme.fontMono,
                fontSize: isInner ? 48 : 34,
                fontWeight: 700,
                color: labelColor,
              }}
            >
              {layer.label}
            </div>
            <div
              style={{
                fontSize: isInner ? 25 : 22,
                color: theme.dim,
                marginTop: 7,
              }}
            >
              {layer.desc}
            </div>
          </div>
        );
      })}

      {scene.formula ? (
        <div
          style={{
            position: "absolute",
            bottom: 186,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...springIn(frame, fps, Math.round(audioFrames * 0.86)),
              fontFamily: theme.fontMono,
              fontSize: 40,
              fontWeight: 700,
              color: theme.text,
            }}
          >
            {scene.formula}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
