<!-- docs/index.md のテンプレート。{{...}} を CLAUDE.md / OUTLINE.md / README.md の
     WHO・WHAT から埋める。カリキュラム表は Part 数ぶん行を作る（「学習を始める」は
     各 Part 最初のセクションのスラッグへリンク: 例 part-01/chapter-01/1-1-1.md）。 -->
---
hide:
  - navigation
  - toc
---

# {{SITE_TITLE}}

<div class="hero" markdown>

**{{HERO_HEADLINE}}**

{{HERO_DESCRIPTION}}

</div>

---

## カリキュラム

| Part | 内容 | |
|---|---|---|
| **{{PART1_TITLE}}** | {{PART1_SUMMARY}} | [学習を始める]({{PART1_FIRST_SECTION}}) |
| **{{PART2_TITLE}}** | {{PART2_SUMMARY}} | [学習を始める]({{PART2_FIRST_SECTION}}) |
<!-- Part 数ぶん行を追加する -->

---

## この教材で身につくこと

<!-- CLAUDE.md / OUTLINE.md のゴール（WHAT）を要約した表 -->
| 領域 | 到達点 |
|---|---|
| **{{AREA1}}** | {{GOAL1}} |
| **{{AREA2}}** | {{GOAL2}} |

{{CLOSING_GOAL_SENTENCE}}

---

## 対象読者

{{AUDIENCE_DESCRIPTION}}

詳しくは [{{FIRST_SECTION_LABEL}}]({{FIRST_SECTION_PATH}}) をご覧ください。
