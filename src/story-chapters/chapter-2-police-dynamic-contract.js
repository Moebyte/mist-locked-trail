(function installChapter2PoliceDynamicContract() {
  function applyChapter2PoliceDynamicContract() {
    if (typeof nodes === 'undefined') return;
    const errors = [];

    function withFlag(flagNames, fn) {
      if (typeof E === 'undefined') return null;
      const oldFlag = E.getFlag;
      const oldSet = E.setFlag;
      try {
        E.getFlag = (name) => flagNames.includes(name);
        E.setFlag = () => {};
        return fn();
      } finally {
        E.getFlag = oldFlag;
        E.setFlag = oldSet;
      }
    }

    function gotos(id, flags) {
      const node = nodes[id];
      return withFlag(flags || [], () => {
        const raw = typeof node.choices === 'function' ? node.choices({}) : node.choices;
        return Array.isArray(raw) ? raw.map(c => c && c.goto).filter(Boolean) : [];
      }) || [];
    }

    const police = nodes.ch2_police;
    if (!police) errors.push('missing ch2_police');
    else {
      if (police.title !== '上海法租界巡捕房') errors.push('ch2_police title changed');
      if (typeof police.onPresent !== 'function') errors.push('ch2_police should keep onPresent');
      else {
        const result = withFlag([], () => police.onPresent({ name: '半张烟盒纸' }, {}));
        if (!result || result.goto !== 'ch2_police_present') errors.push('ch2_police onPresent should route 半张烟盒纸 to ch2_police_present');
      }
      if (!gotos('ch2_police', []).includes('ch2_police_file')) errors.push('ch2_police missing ch2_police_file goto');
    }

    for (const id of ['ch2_police_file', 'ch2_police_alt']) {
      const node = nodes[id];
      if (!node) {
        errors.push(`missing ${id}`);
        continue;
      }
      if (typeof node.choices !== 'function') errors.push(`${id} should keep dynamic choices`);
      const before = gotos(id, []);
      if (!before.includes('ch2_police_wang')) errors.push(`${id} should always offer ch2_police_wang`);
      const after = gotos(id, ['got_wang_note']);
      if (!after.includes('ch2_frenchtown')) errors.push(`${id} should offer ch2_frenchtown after got_wang_note`);
      if (!after.includes('ch2_home')) errors.push(`${id} should offer ch2_home after got_wang_note`);
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_POLICE_DYNAMIC_CONTRACT = { ids: ['ch2_police', 'ch2_police_file', 'ch2_police_alt'], ok: errors.length === 0, errors };
    }
    if (errors.length && typeof console !== 'undefined') console.error('[story-chapters/chapter-2-police-dynamic] contract failed', errors);
  }
  document.addEventListener('DOMContentLoaded', applyChapter2PoliceDynamicContract);
})();
