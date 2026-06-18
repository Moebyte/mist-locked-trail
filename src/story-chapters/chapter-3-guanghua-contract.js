(function installChapter3GuanghuaContract() {
  function applyChapter3GuanghuaContract() {
    if (typeof window === 'undefined') return;
    window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT = {
      module: 'chapter-3-guanghua',
      phase: 'first-batch-runtime-takeover',
      nodes: ['ch3_school_chen_su'],
      ownedEffects: {
        ch3_school_chen_su: {
          clues: ['苏晚亭与陈明远'],
          flags: ['chen_su_link'],
        },
      },
      outboundTargets: {
        ch3_school_chen_su: ['ch3_school_weird', 'ch3_school_office', 'ch3_school'],
      },
      physicalRemovalAllowed: false,
    };
  }

  document.addEventListener('DOMContentLoaded', applyChapter3GuanghuaContract);
})();
