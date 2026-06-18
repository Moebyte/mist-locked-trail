(function installChapter3GuanghuaContract() {
  function applyChapter3GuanghuaContract() {
    if (typeof window === 'undefined') return;
    window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT = {
      module: 'chapter-3-guanghua',
      phase: 'second-batch-runtime-takeover',
      nodes: ['ch3_school_chen_su', 'ch3_school_weird'],
      ownedEffects: {
        ch3_school_chen_su: {
          clues: ['苏晚亭与陈明远'],
          flags: ['chen_su_link'],
        },
        ch3_school_weird: {
          clues: ['陈老师与女子争吵'],
          flags: [],
        },
      },
      outboundTargets: {
        ch3_school_chen_su: ['ch3_school_weird', 'ch3_school_office', 'ch3_school'],
        ch3_school_weird: ['ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'],
      },
      physicalRemovalAllowed: false,
    };
  }

  document.addEventListener('DOMContentLoaded', applyChapter3GuanghuaContract);
})();
