// ===== 章节剧情：第二章薛华立路入口运行时契约 =====
// Phase 4g: 验证 ch2_frenchtown 入口节点在运行时可用。

(function installChapter2FrenchtownEntryContract() {
  function applyChapter2FrenchtownEntryContract() {
    if (typeof nodes === 'undefined') return;

    const errors = [];
    const node = nodes.ch2_frenchtown;

    if (!node) {
      errors.push('missing migrated Frenchtown entry node: ch2_frenchtown');
    } else {
      if (node.title !== '薛华立路 22 号') errors.push(`ch2_frenchtown title changed: ${node.title}`);
      if (!node.time || node.time.d !== 1 || node.time.h !== 19 || node.time.m !== 0) {
        errors.push('ch2_frenchtown time changed');
      }
      if (node.weather !== 4) errors.push(`ch2_frenchtown weather changed: ${node.weather}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') {
        errors.push('ch2_frenchtown has no renderable text');
      }
      const choices = Array.isArray(node.choices) ? node.choices : [];
      const gotos = choices.map(choice => choice && choice.goto).filter(Boolean);
      for (const goto of ['ch2_building_enter', 'ch2_building_stakeout']) {
        if (!gotos.includes(goto)) errors.push(`ch2_frenchtown missing goto ${goto}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_ENTRY_CONTRACT = {
        ids: ['ch2_frenchtown'],
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-frenchtown-entry] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2FrenchtownEntryContract);
})();
