// ===== 章节剧情：第二章薛华立路尾随支线运行时契约 =====
// Phase 4e: 验证已迁移的观察、尾随、茶楼与沈玉兰固定支线节点在运行时可用。

(function installChapter2FrenchtownTailContract() {
  function applyChapter2FrenchtownTailContract() {
    if (typeof nodes === 'undefined') return;

    const expected = {
      ch2_building_stakeout: {
        title: '街对面的观察',
        gotos: ['ch2_tail', 'ch2_building_enter'],
      },
      ch2_tail: {
        title: '尾随',
        gotos: ['ch2_tea_monitor', 'ch2_building_enter'],
      },
      ch2_tea_monitor: {
        title: '鸿运茶楼',
        gotos: ['ch2_talk_woman', 'ch2_building_enter'],
      },
      ch2_talk_woman: {
        title: '与神秘女子的对话',
        gotos: ['ch2_woman_detail', 'ch2_building_enter'],
      },
      ch2_woman_detail: {
        title: '另一桩失踪案',
        gotos: ['ch2_building_enter', 'ch3_school'],
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
        errors.push(`missing migrated Frenchtown tail node: ${id}`);
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
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_TAIL_CONTRACT = {
        ids: Object.keys(expected),
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-frenchtown-tail] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2FrenchtownTailContract);
})();
