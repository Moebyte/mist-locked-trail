// ===== 故事注册表 =====
// v1_refactor 第一层收束：先把状态、线索、物品、面板归属登记清楚。
// 本文件不改变剧情行为，只提供统一索引，后续“补丁转正”必须以这里为准。

(function installStoryRegistry() {
  const flags = [
    // 主推理阶段
    { id: 'deduced_chen', group: 'deduction', owner: 'deduction-flow', desc: '第一段推理完成：陈明远不是自杀，而是因光华小学线索被灭口。' },
    { id: 'deduced_lu_zhao', group: 'deduction', owner: 'deduction-flow', desc: '第二段推理完成：陆念薇与黑衣男人/赵先生暗线浮出。' },
    { id: 'deduced_fusheng', group: 'deduction', owner: 'deduction-flow', desc: '第三段推理完成：福生仓、公董局、光华小学利益链合拢。' },

    // 周怀安连续举证
    { id: 'presented_jade_to_zhou', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '已向周怀安追问“陆念”，且前置足够。' },
    { id: 'presented_jade_to_zhou_premature', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '过早向周怀安追问“陆念”，只能得到有限反应。' },
    { id: 'presented_chen_letter_to_zhou', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '已向周怀安出示陈明远未寄出的信。' },
    { id: 'presented_su_last_letter_to_zhou', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '已向周怀安出示苏晚亭疑似遗书。' },
    { id: 'presented_wang_note_to_zhou', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '已向周怀安出示王巡官半张烟盒纸。' },
    { id: 'presented_threat_to_zhou', group: 'panel:zhou', owner: 'zhou-evidence-panel', desc: '已向周怀安出示 203 室恐吓信。' },

    // 老孙支援举证
    { id: 'sun_presented_wang_note', group: 'panel:sun', owner: 'sun-support-panel', desc: '已向老孙出示王巡官纸条。' },
    { id: 'sun_presented_chen_letter', group: 'panel:sun', owner: 'sun-support-panel', desc: '已向老孙出示陈明远的信。' },
    { id: 'sun_presented_fusheng_location', group: 'panel:sun', owner: 'sun-support-panel', desc: '已向老孙说明福生仓位置。' },
    { id: 'sun_presented_threat_letter', group: 'panel:sun', owner: 'sun-support-panel', desc: '已向老孙出示 203 室恐吓信。' },
    { id: 'sun_support_available', group: 'support:sun', owner: 'sun-support-panel', desc: '老孙支援可用。' },
    { id: 'sun_fast_support', group: 'support:sun', owner: 'sun-support-panel', desc: '老孙只派一个便衣低调支援。' },
    { id: 'sun_full_support', group: 'support:sun', owner: 'sun-support-panel', desc: '老孙调齐人手，能正面压住福生仓。' },

    // 暗室信任/沈玉芳证词
    { id: 'presented_su_keepsake', group: 'panel:darkroom', owner: 'darkroom-evidence-panel', desc: '已把苏母银发夹给苏晚亭看，建立救援信任。' },
    { id: 'yufang_testimony_quick_confirmed', group: 'panel:darkroom', owner: 'darkroom-evidence-panel', desc: '已在暗室用关键证据快速稳住沈玉芳证词。' },
    { id: 'presented_photo_to_yufang_dual', group: 'panel:darkroom', owner: 'darkroom-evidence-panel', desc: '暗室中三人合影已被沈玉芳确认。' },
    { id: 'presented_letter_to_yufang_dual', group: 'panel:darkroom', owner: 'darkroom-evidence-panel', desc: '暗室中陈明远的信已被沈玉芳确认。' },
    { id: 'presented_diary_to_yufang_dual', group: 'panel:darkroom', owner: 'darkroom-evidence-panel', desc: '暗室中苏晚亭日记残页已被沈玉芳确认。' },

    // 陆念薇医院程序举证
    { id: 'lu_presented_waybill', group: 'panel:lu', owner: 'lu-evidence-panel', desc: '已向陆念薇出示光华货运单。' },
    { id: 'lu_presented_clearance', group: 'panel:lu', owner: 'lu-evidence-panel', desc: '已向陆念薇出示清场指令。' },
    { id: 'lu_presented_witnesses', group: 'panel:lu', owner: 'lu-evidence-panel', desc: '已向陆念薇说明沈玉芳/苏晚亭仍可作证。' },
    { id: 'lu_presented_sun_backstop', group: 'panel:lu', owner: 'lu-evidence-panel', desc: '已向陆念薇说明老孙能承接口供程序。' },
    { id: 'lu_presented_doctor_record', group: 'panel:lu', owner: 'lu-evidence-panel', desc: '已向陆念薇说明医院医生记录存在。' },
    { id: 'v07_lu_to_sun', group: 'outcome:lu', owner: 'lu-procedure', desc: '陆念薇转为正式口供。' },
    { id: 'v07_lu_statement', group: 'outcome:lu', owner: 'lu-procedure', desc: '陆念薇留下私下口供。' },
    { id: 'v07_lu_as_informant', group: 'outcome:lu', owner: 'lu-procedure', desc: '陆念薇继续做内线。' },
    { id: 'v07_lu_withdrawn', group: 'outcome:lu', owner: 'lu-procedure', desc: '陆念薇退缩沉默。' },

    // 福生仓现场确认
    { id: 'scene_confirmed_clearance_order', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel', desc: '现场确认清场指令/蓝封公文纸。' },
    { id: 'scene_confirmed_waybill_crates', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel', desc: '现场确认光华教具箱/货运单。' },
    { id: 'scene_confirmed_darkroom_marks', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel', desc: '现场确认暗室关押痕迹。' },
    { id: 'scene_confirmed_fu_lu_conversation', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel', desc: '现场确认傅启元/陆念薇人物链条。' }
  ];

  const clues = [
    { id: '推理结论：陈明远被灭口', group: 'deduction', owner: 'deduction-flow' },
    { id: '推理结论：黑衣男是暗线', group: 'deduction', owner: 'deduction-flow' },
    { id: '推理结论：法租界利益链', group: 'deduction', owner: 'deduction-flow' },
    { id: '周怀安识出陆念', group: 'panel:zhou', owner: 'zhou-evidence-panel' },
    { id: '苏晚亭认出银发夹', group: 'panel:darkroom', owner: 'darkroom-evidence-panel' },
    { id: '沈玉芳暗室证词强化', group: 'panel:darkroom', owner: 'darkroom-evidence-panel' },
    { id: '陆念薇正式口供', group: 'panel:lu', owner: 'lu-procedure' },
    { id: '陆念薇补充口供', group: 'panel:lu', owner: 'lu-procedure' },
    { id: '现场确认：清场指令', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel' },
    { id: '现场确认：光华货运单', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel' },
    { id: '现场确认：暗室关押痕迹', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel' },
    { id: '现场确认：傅启元与陆念薇对话', group: 'panel:fusheng-scene', owner: 'fusheng-scene-panel' }
  ];

  const items = [
    { id: '翡翠镯', group: 'clue:lu-name', owner: 'pawnshop-flow' },
    { id: '陈明远的信', group: 'core-evidence', owner: 'guanghua-flow' },
    { id: '三人合影', group: 'core-evidence', owner: 'guanghua-flow' },
    { id: '日记残页', group: 'core-evidence', owner: 'university-flow' },
    { id: '半张烟盒纸', group: 'core-evidence', owner: 'wang-note-flow' },
    { id: '恐吓信', group: 'core-evidence', owner: 'xuehua-203-flow' },
    { id: '苏晚亭的银发夹', group: 'trust-token', owner: 'su-home-flow' },
    { id: '福生仓地址', group: 'fusheng-scene', owner: 'fusheng-flow' },
    { id: '清场指令', group: 'fusheng-scene', owner: 'fusheng-scene-panel' },
    { id: '光华货运单', group: 'fusheng-scene', owner: 'fusheng-scene-panel' },
    { id: '暗室刻痕拓片', group: 'fusheng-scene', owner: 'fusheng-scene-panel' }
  ];

  const panels = [
    {
      id: 'zhou-evidence-panel',
      module: 'src/story-modules/present-flow-cleanup.js + src/story-modules/zhou-jade-present-node-fix.js',
      hub: 'ch4_revisit_zhou',
      purpose: '向周怀安核对陆念、信件、纸条、恐吓信，建立人物证言和反证。',
      status: 'to-consolidate'
    },
    {
      id: 'sun-support-panel',
      module: 'src/story-modules/sun-support-evidence-panel.js',
      hub: 'ch4_sun_support',
      purpose: '用硬证据说服老孙在福生仓前提供程序/行动支援。',
      status: 'to-consolidate'
    },
    {
      id: 'darkroom-evidence-panel',
      module: 'src/story-modules/darkroom-evidence-panel.js',
      hub: 'ch4_dock_who_dual',
      purpose: '在暗室里建立苏晚亭信任，并快速稳住沈玉芳证词。',
      status: 'to-consolidate'
    },
    {
      id: 'lu-evidence-panel',
      module: 'src/story-modules/lu-evidence-panel.js + src/story-modules/lu-procedure-truth-polish.js',
      hub: 'ch4_lu_confrontation',
      purpose: '把陆念薇可信度/程序风险转成玩家可见的举证与程序选择。',
      status: 'to-consolidate'
    },
    {
      id: 'fusheng-scene-panel',
      module: 'src/story-modules/fusheng-scene-evidence-panel.js',
      hub: 'ch4_dock_inside / ch4_dock_crates / ch4_dock_deep / ch4_dock_escape',
      purpose: '把福生仓现场调查整理为清场、货运单、暗室、人物链条四类确认。',
      status: 'to-consolidate'
    }
  ];

  function byId(list) {
    return Object.fromEntries(list.map(entry => [entry.id, entry]));
  }

  const registry = Object.freeze({
    version: 'v1-refactor-registry-0.1',
    flags: Object.freeze(flags),
    clues: Object.freeze(clues),
    items: Object.freeze(items),
    panels: Object.freeze(panels),
    lookup: Object.freeze({
      flags: Object.freeze(byId(flags)),
      clues: Object.freeze(byId(clues)),
      items: Object.freeze(byId(items)),
      panels: Object.freeze(byId(panels))
    })
  });

  window.MLT_STORY_REGISTRY = registry;
})();
