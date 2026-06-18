(function installChapter3GuanghuaContract() {
  function applyChapter3GuanghuaContract() {
    if (typeof window === 'undefined') return;
    window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT = {
      module: 'chapter-3-guanghua',
      phase: 'office-runtime-takeover',
      nodes: ['ch3_school_chen_su', 'ch3_school_yufang', 'ch3_school_weird', 'ch3_school_office'],
      ownedEffects: {
        ch3_school_chen_su: {
          clues: ['苏晚亭与陈明远'],
          flags: ['chen_su_link'],
        },
        ch3_school_yufang: {
          clues: ['沈玉芳与陈明远'],
          flags: [],
        },
        ch3_school_weird: {
          clues: ['陈老师与女子争吵'],
          flags: [],
        },
        ch3_school_office: {
          clues: ['陈老师遗物', '陈老师给苏晚亭的信'],
          items: ['永昌当票', '未寄出的信'],
          flags: ['got_chen_evidence'],
        },
      },
      outboundTargets: {
        ch3_school_chen_su: ['ch3_school_weird', 'ch3_school_office', 'ch3_school'],
        ch3_school_yufang: ['ch3_school_teacher', 'ch3_school_weird', 'ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'],
        ch3_school_weird: ['ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'],
        ch3_school_office: ['ch3_chen_letter', 'ch3_wrapup'],
      },
      physicalRemovalAllowed: false,
    };
  }

  document.addEventListener('DOMContentLoaded', applyChapter3GuanghuaContract);
})();
