(function installChapter2UniversityEntryContract() {
  function applyChapter2UniversityEntryContract() {
    if (typeof nodes === 'undefined') return;
    const errors = [];

    function withEvidence(config, fn) {
      if (typeof E === 'undefined') return null;
      const oldHas = E.hasClue;
      const oldFlag = E.getFlag;
      try {
        E.hasClue = (name) => Boolean(config.clues && config.clues.includes(name));
        E.getFlag = (name) => Boolean(config.flags && config.flags.includes(name));
        return fn();
      } finally {
        E.hasClue = oldHas;
        E.getFlag = oldFlag;
      }
    }

    function gotos(id, config) {
      const node = nodes[id];
      return withEvidence(config || {}, () => {
        const raw = typeof node.choices === 'function' ? node.choices({}) : node.choices;
        return Array.isArray(raw) ? raw.map(c => c && c.goto).filter(Boolean) : [];
      }) || [];
    }

    const university = nodes.ch2_university;
    if (!university) errors.push('missing ch2_university');
    else {
      if (university.title !== '圣约翰大学') errors.push('ch2_university title changed');
      if (university.weather !== 0) errors.push('ch2_university weather changed');
      const early = gotos('ch2_university', { clues: [], flags: [] });
      for (const goto of ['ch2_univ_matron', 'ch2_univ_door', 'ch2_univ_paper']) {
        if (!early.includes(goto)) errors.push(`ch2_university missing early goto ${goto}`);
      }
      const complete = gotos('ch2_university', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] });
      if (!complete.includes('ch2_leave_univ')) errors.push('ch2_university should unlock ch2_leave_univ when university clues are complete');
    }

    const leave = nodes.ch2_leave_univ;
    if (!leave) errors.push('missing ch2_leave_univ');
    else {
      if (leave.title !== '下一步调查') errors.push('ch2_leave_univ title changed');
      const early = gotos('ch2_leave_univ', { clues: [], flags: [] });
      for (const goto of ['ch2_university', 'ch2_frenchtown', 'ch2_police_alt', 'ch2_home']) {
        if (!early.includes(goto)) errors.push(`ch2_leave_univ missing goto ${goto}`);
      }
      const withMap = gotos('ch2_leave_univ', { clues: ['法租界地图'], flags: [] });
      if (withMap.includes('ch2_university')) errors.push('ch2_leave_univ should hide ch2_university after 法租界地图');
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_UNIVERSITY_ENTRY_CONTRACT = { ids: ['ch2_university', 'ch2_leave_univ'], ok: errors.length === 0, errors };
    }
    if (errors.length && typeof console !== 'undefined') console.error('[story-chapters/chapter-2-university-entry] contract failed', errors);
  }
  document.addEventListener('DOMContentLoaded', applyChapter2UniversityEntryContract);
})();
