# PROGRESS

<!-- /setup（ルーター）が生成し、各スキルが更新します。/status が実態と同期します。 -->

<!--
=== フォーマット（/setup が生成時にこの形へ置き換える）===

---
gates:
  G1_research: null      # /research 承認日（YYYY-MM-DD。省略時は「(省略) YYYY-MM-DD」）
  G2_philosophy: null    # /define 承認日
  G3_outline: null       # /outline 骨格承認日
  G4_style_lock: null    # /pilot 様式ロック日（量産解禁）
adaptive:
  research: full         # full | light | skipped（理由を1行で添える）
  define: full           # full | light（発注仕様のインポート等。理由を1行で添える）
  pilot: planned         # planned | done | skipped
config:                    # /pilot が確定する「決定録」= 様式・執筆判断の単一ソース。skills が実行時に参照する（fw-sync 不可侵）
  style: emoji             # emoji | plain | admonition | zenn（機械チェックが読む様式の単一ソース。emoji 以外の規則は .claude/skills/write/references/styles/ の様式リファレンス）
  section_model: separate  # separate(分離型・既定=読解中心) | weave(織り込み型=タイピング中心)。/define（G2）で確定する構造決定。/pilot は追認のみ・変更は /revise 扱い（G3 取り直し）
  arc_mode: mode2          # mode2(概要駆動・既定) | mode1(導入駆動)。weave の混合（織り込み）は専用アークのため対象外＝概念・ハンズオン Section にのみ適用
  verification_model: copypaste  # copypaste(決定的再現型・既定。コピペでも手打ちでも「記載どおりに動く」保証) | ai-delegated(AI委任型)
  tryit_timing: A          # A(Part単位2パス・推奨) | B(同一パス) | N/A(weave。概念 Section に置く場合のみ B 扱い・やってみよう表は作らない)
  review_gate: section     # section(毎 Section・既定) | chapter(Chapter 単位でまとめて独立レビュー。小さい Section を量産する教材向け)
  diagram_format: mermaid  # mermaid | ascii（処理フロー・関係図の形式）
  char_target: 4000        # Section あたりの目安文字数
  persona: null            # 🧠 コラムの語り手（人格名）
  persona_frequency: every # every(毎 Section・既定) | selective(効果的な箇所のみ)
  illustrate: null         # /illustrate の経路/密度（例: "claude-design / B"。未使用なら null）
  capture: null            # /capture の撮影環境（例: "playwright / 1280x800 light ja"。手動撮影のみなら "manual"、画面キャプチャ不使用なら null）
  animate: null            # /animate の密度（例: "B"。未使用なら null）
  brand: null              # キーカラー（例: "#0EA5E9"）。brand.ts 等 3 箇所への反映は /pilot 手順を参照
  excluded_terms: []       # 本文で使わない表現（制度名・組織名等。あれば）
  code_langs: []           # トピック固有のコード言語タグ（例: blade, jsonc）
---

## 進捗表（G3 承認時に /outline が Section 一覧を展開する）

| Section | 骨子 | draft | review | 図 | 動画 | 公開 |
|---|---|---|---|---|---|---|
| 1-1-1 | 2026-07-05 | ✅ | ✅ | - | - | ✅ |
| 1-1-2 |  |  |  | - | - |  |

記法: 日付 = 承認日 / ✅ = 完了 / 空欄 = 未着手 / - = 対象外 / 保留 = 意図的保留（理由を OUTLINE 側に明記）

## 進行中の change

- （/revise の未アーカイブ分をここに列挙: slug と状態）
-->
