// ===== 章节剧情：第二章苏家固定支线运行时契约 =====
// Phase 4d: 验证已迁移的苏家固定支线节点在运行时可用。

(function installChapter2HomeFixedContract() {
  function applyChapter2HomeFixedContract() {
    if (typeof nodes === 'undefined') return;

    const expected = {
      ch2_home_photo: {
        title: '墙上的照片',
        gotos: ['ch2_home_ask_photo', 'ch2_home'],
      },
      ch2_home_ask_photo: {
        title: '母亲的回避',
        gotos: ['ch2_home'],
      },
      ch2_home_showphoto: {
        title: '向苏母出示照片',
        gotos: ['ch2_home'],
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
        errors.push(`missing migrated Su home node: ${id}`);
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
      window.MLT_STORY_CHAPTER_2_HOME_FIXED_CONTRACT = {
        ids: Object.keys(expected),
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-home-fixed] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeFixedContract);
})();
