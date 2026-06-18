// ===== 章节剧情：第二章薛华立路 203 室运行时契约 =====
// Phase 4f: 验证已迁移的 203 室固定搜查链节点在运行时可用。

(function installChapter2Xuehua203Contract() {
  function applyChapter2Xuehua203Contract() {
    if (typeof nodes === 'undefined') return;

    const expected = {
      ch2_ask_landlord: {
        title: '看门老头的证词',
        gotos: ['ch2_203_door'],
      },
      ch2_landlord_map: {
        title: '向老头出示地图',
        gotos: ['ch2_203_door'],
      },
      ch2_203_door: {
        title: '203 室',
        gotos: ['ch2_203_search', 'ch3_school'],
      },
      ch2_203_search: {
        title: '搜查 203',
        gotos: ['ch2_building_stakeout', 'ch3_school'],
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
        errors.push(`missing migrated Xuehua 203 node: ${id}`);
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
      window.MLT_STORY_CHAPTER_2_XUEHUA_203_CONTRACT = {
        ids: Object.keys(expected),
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-xuehua-203] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2Xuehua203Contract);
})();
