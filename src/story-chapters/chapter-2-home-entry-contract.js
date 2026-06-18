(function installChapter2HomeEntryContract() {
  function applyChapter2HomeEntryContract() {
    if (typeof nodes === 'undefined') return;
    const errors = [];
    const node = nodes.ch2_home;

    function withEvidence(config, fn) {
      if (typeof E === 'undefined') return null;
      const oldHas = E.hasClue;
      const oldFlag = E.getFlag;
      const oldSet = E.setFlag;
      try {
        E.hasClue = (name) => Boolean(config.clues && config.clues.includes(name));
        E.getFlag = (name) => Boolean(config.flags && config.flags.includes(name));
        E.setFlag = () => {};
        return fn();
      } finally {
        E.hasClue = oldHas;
        E.getFlag = oldFlag;
        E.setFlag = oldSet;
      }
    }

    function gotos(config) {
      return withEvidence(config || {}, () => {
        const raw = typeof node.choices === 'function' ? node.choices({}) : node.choices;
        return Array.isArray(raw) ? raw.map(c => c && c.goto).filter(Boolean) : [];
      }) || [];
    }

    if (!node) {
      errors.push('missing ch2_home');
    } else {
      if (node.title !== '苏家') errors.push('ch2_home title changed');
      if (node.weather !== 0) errors.push('ch2_home weather changed');
      if (typeof node.onPresent !== 'function') errors.push('ch2_home should keep onPresent');
      else {
        const result = withEvidence({ clues: [], flags: [] }, () => node.onPresent({ name: '苏晚亭的照片' }, {}));
        if (!result || result.goto !== 'ch2_home_showphoto') errors.push('ch2_home onPresent should route 苏晚亭的照片 to ch2_home_showphoto');
      }

      const empty = gotos({ clues: [], flags: [] });
      if (!empty.includes('ch2_home_talk')) errors.push('ch2_home should offer ch2_home_talk before 母亲证词');
      if (!empty.includes('ch2_home_photo')) errors.push('ch2_home should offer ch2_home_photo before asked_photo');

      const complete = gotos({ clues: ['母亲证词'], flags: ['asked_photo'] });
      if (!complete.includes('ch2_leave_home')) errors.push('ch2_home should offer ch2_leave_home after talk and photo');
      if (complete.includes('ch2_home_talk')) errors.push('ch2_home should hide ch2_home_talk after 母亲证词');
      if (complete.includes('ch2_home_photo')) errors.push('ch2_home should hide ch2_home_photo after asked_photo');
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_ENTRY_CONTRACT = { ids: ['ch2_home'], ok: errors.length === 0, errors };
    }
    if (errors.length && typeof console !== 'undefined') console.error('[story-chapters/chapter-2-home-entry] contract failed', errors);
  }
  document.addEventListener('DOMContentLoaded', applyChapter2HomeEntryContract);
})();
