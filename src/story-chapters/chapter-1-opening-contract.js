// ===== 章节剧情：第一章开场运行时契约 =====
// Phase 4a: 验证已迁移的第一章开场节点在运行时可用，且 ID / title / 主要 goto 不变。

(function installChapter1OpeningContract() {
  function applyChapter1OpeningContract() {
    if (typeof nodes === 'undefined') return;

    const expected = {
      ch1_open: {
        title: '民国三十七年 · 暮秋 · 上海',
        gotos: ['ch1_take', 'ch1_ask', 'end_refuse'],
      },
      ch1_ask: {
        title: '听雨茶馆',
        gotos: ['ch1_take', 'end_refuse'],
      },
      ch1_take: {
        title: '接案',
        gotos: ['ch2_university', 'ch2_police', 'ch2_home'],
      },
    };

    const errors = [];
    function choiceGotos(node) {
      const raw = typeof node.choices === 'function' ? node.choices({ flags: {}, clues: [], items: [] }) : node.choices;
      if (!Array.isArray(raw)) return [];
      return raw.map(choice => choice && choice.goto).filter(Boolean);
    }

    for (const [id, spec] of Object.entries(expected)) {
      const node = nodes[id];
      if (!node) {
        errors.push(`missing migrated chapter 1 node: ${id}`);
        continue;
      }
      if (node.title !== spec.title) errors.push(`${id} title changed: ${node.title}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') {
        errors.push(`${id} has no renderable text`);
      }
      const gotos = choiceGotos(node);
      for (const goto of spec.gotos) {
        if (!gotos.includes(goto)) errors.push(`${id} missing goto ${goto}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_1_OPENING_CONTRACT = {
        ids: Object.keys(expected),
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-1-opening] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter1OpeningContract);
})();
