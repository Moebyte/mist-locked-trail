(function installChapter3GuanghuaContract() {
  function applyChapter3GuanghuaContract() {
    if (typeof window === 'undefined') return;
    window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT = {
      module: 'chapter-3-guanghua',
      phase: 'school-teacher-runtime-takeover',
      nodes: ['ch3_school_teacher', 'ch3_school_chen_su', 'ch3_school_yufang', 'ch3_school_weird', 'ch3_school_office', 'ch3_chen_letter', 'ch3_wu_present_threat', 'ch3_wu_present_photo'],
      ownedEffects: {
        ch3_school_teacher: {
          clues: ['陈明远坠楼案'],
          contacts: ['陈明远'],
          flags: ['asked_about_chen'],
        },
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
        ch3_chen_letter: {
          clues: ['陈明远的信'],
          items: ['陈明远的信'],
          flags: ['read_letter'],
        },
        ch3_wu_present_threat: {
          clues: ['吴校长补充证词'],
          items: ['校董会采购线索'],
          flags: ['wu_procurement_admitted', 'school_wu_confront_started'],
        },
        ch3_wu_present_photo: {
          clues: ['陆小姐与校董会'],
          contacts: ['傅启元'],
          flags: ['wu_named_fu', 'school_wu_confront_started'],
        },
      },
      outboundTargets: {
        ch3_school_teacher: ['runtime school/confrontation flow; verify all emitted targets exist'],
        ch3_school_chen_su: ['ch3_school_weird', 'ch3_school_office', 'ch3_school'],
        ch3_school_yufang: ['ch3_school_teacher', 'ch3_school_weird', 'ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'],
        ch3_school_weird: ['ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'],
        ch3_school_office: ['ch3_chen_letter', 'ch3_school_confront_wu'],
        ch3_chen_letter: ['runtime region flow; verify all emitted targets exist'],
        ch3_wu_present_threat: ['runtime confrontation flow; verify all emitted targets exist'],
        ch3_wu_present_photo: ['runtime confrontation flow; verify all emitted targets exist'],
      },
      physicalRemovalAllowed: false,
    };
  }

  document.addEventListener('DOMContentLoaded', applyChapter3GuanghuaContract);
})();
