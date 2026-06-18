// ===== 章节剧情：第二章基础调查运行时契约 =====
// Phase 4b: 验证已迁移的圣约翰大学低风险支线节点在运行时可用。

(function installChapter2HomeXuehuaContract() {
  function applyChapter2HomeXuehuaContract() {
    if (typeof nodes === 'undefined') return;

    const expected = {
      ch2_univ_matron: {
        title: '舍监的证词',
        gotos: ['ch2_univ_door', 'ch2_univ_paper', 'ch2_university'],
      },
      ch2_univ_door: {
        title: '门房的证词',
        gotos: ['ch2_univ_paper', 'ch2_university'],
      },
      ch2_univ_paper: {
        title: '论文草稿',
        gotos: ['ch2_university'],
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
        errors.push(`missing migrated chapter 2 node: ${id}`);
        continue;
      }
      if (node.title !== spec.title) errors.push(`${id} title changed: ${node.title}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') {
        errors.push(`${id} has no renderable text`);
      }
      if (typeof node.effect !== 'function') errors.push(`${id} should keep its effect function`);
      const gotos = choiceGotos(node);
      for (const goto of spec.gotos) {
        if (!gotos.includes(goto)) errors.push(`${id} missing goto ${goto}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_XUEHUA_CONTRACT = {
        ids: Object.keys(expected),
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-home-xuehua] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeXuehuaContract);
})();
