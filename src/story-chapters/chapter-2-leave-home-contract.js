(function installChapter2LeaveHomeContract() {
  function applyChapter2LeaveHomeContract() {
    if (typeof nodes === 'undefined') return;

    const errors = [];
    const node = nodes.ch2_leave_home;

    function withEvidence(config, fn) {
      if (typeof E === 'undefined') return null;
      const originalHasClue = E.hasClue;
      const originalGetFlag = E.getFlag;
      try {
        E.hasClue = (name) => Boolean(config.clues && config.clues.includes(name));
        E.getFlag = (name) => Boolean(config.flags && config.flags.includes(name));
        return fn();
      } finally {
        E.hasClue = originalHasClue;
        E.getFlag = originalGetFlag;
      }
    }

    function visibleGotos(config) {
      return withEvidence(config, () => {
        const choices = Array.isArray(node.choices) ? node.choices : [];
        return choices
          .filter(choice => typeof choice.when === 'function' ? choice.when({}) : true)
          .map(choice => choice && choice.goto)
          .filter(Boolean);
      }) || [];
    }

    if (!node) {
      errors.push('missing migrated leave home node: ch2_leave_home');
    } else {
      if (node.title !== '闸北街头') errors.push(`ch2_leave_home title changed: ${node.title}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') errors.push('ch2_leave_home has no renderable text');
      if (!Array.isArray(node.choices)) errors.push('ch2_leave_home choices should remain an array');

      const withMap = visibleGotos({ clues: ['法租界地图'], flags: [] });
      if (!withMap.includes('ch2_frenchtown')) errors.push('ch2_leave_home should show ch2_frenchtown with 法租界地图');

      const withWangNote = visibleGotos({ clues: [], flags: ['got_wang_note'] });
      if (!withWangNote.includes('ch2_frenchtown')) errors.push('ch2_leave_home should show ch2_frenchtown with got_wang_note');

      const withoutCaseFile = visibleGotos({ clues: [], flags: [] });
      if (!withoutCaseFile.includes('ch2_police')) errors.push('ch2_leave_home should show ch2_police before got_case_file');

      const withCaseFile = visibleGotos({ clues: [], flags: ['got_case_file'] });
      if (withCaseFile.includes('ch2_police')) errors.push('ch2_leave_home should hide ch2_police after got_case_file');

      const withoutPencilList = visibleGotos({ clues: [], flags: [] });
      if (!withoutPencilList.includes('ch2_university')) errors.push('ch2_leave_home should show ch2_university before 铅笔清单');

      const withPencilList = visibleGotos({ clues: ['铅笔清单'], flags: [] });
      if (withPencilList.includes('ch2_university')) errors.push('ch2_leave_home should hide ch2_university after 铅笔清单');
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_LEAVE_HOME_CONTRACT = {
        ids: ['ch2_leave_home'],
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-leave-home] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2LeaveHomeContract);
})();
