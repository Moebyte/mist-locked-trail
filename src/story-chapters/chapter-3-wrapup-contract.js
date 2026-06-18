(function installChapter3WrapupContract() {
  function applyChapter3WrapupContract() {
    if (typeof window === 'undefined') return;
    window.MLT_STORY_CHAPTER_3_WRAPUP_CONTRACT = {
      module: 'chapter-3-wrapup',
      phase: 'wrapup-runtime-takeover',
      nodes: ['ch3_wrapup'],
      ownedEffects: {
        ch3_wrapup: {
          flags: ['hidden_end_unlocked'],
          opensDeduction: ['deduce_chen', 'deduce_lu_zhao', 'deduce_fusheng'],
        },
      },
      outboundTargets: {
        ch3_wrapup: [
          'ch2_police_wang',
          'ch4_suzhou_creek',
          'end_conspiracy_detail',
          'ch4_pawnshop',
          'ch4_conclusion',
          'runtime wrapup/final closure patches; verify all emitted targets exist',
        ],
      },
      physicalRemovalAllowed: false,
    };
  }

  document.addEventListener('DOMContentLoaded', applyChapter3WrapupContract);
})();
