// ===== 推理链提示收束 =====
// 目标：推理不是一次性三连问；后续推理条件不足时，不再凭空消失，而是显示锁定提示。
// 修正：推理放行不再依赖原始 requiredClues 的单一精确名，避免玩家已拿到等价线索却被卡死。

(function installDeductionFlowGuidance() {
  function applyDeductionFlowGuidance() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__deductionFlowGuidancePatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    const DEDUCTION_REQUIREMENTS = {
      deduce_chen: [
        { names: ['陈明远坠楼案', '陈老师遗物'], label: '陈明远坠楼案' },
        { names: ['恐吓信'], label: '203 室恐吓信' },
        { names: ['陆小姐的笔记', '陆念薇旧名', '杭州旧案剪报'], label: '陆小姐身份线索' },
        { names: ['陈明远的信', '陈老师给苏晚亭的信'], label: '陈明远的信' }
      ],
      deduce_lu_zhao: [
        { names: ['跟踪黑衣男人', '鸿运茶楼', '黑衣男人姓赵'], label: '跟踪黑衣男人' },
        { names: ['神秘女子'], label: '茶楼神秘女子' },
        { names: ['沈玉兰的妹妹', '沈玉芳'], label: '沈玉兰的妹妹' },
        { names: ['翡翠镯'], label: '永昌当铺的翡翠镯' }
      ],
      deduce_fusheng: [
        { names: ['王巡官遗留纸条', '半张烟盒纸'], label: '王巡官遗留纸条' },
        { names: ['陈明远的信'], label: '陈明远的信' },
        { names: ['恐吓信'], label: '203 室恐吓信' },
        { names: ['公董局公文纸', '清场指令'], label: '福生仓公董局公文纸' },
        { names: ['教具箱走私', '管制药品走私', '傅启元夜运教具箱'], label: '福生仓教具箱走私证据' }
      ]
    };

    function requirementMet(req) {
      return req.names.some(name => hasThing(name));
    }

    function missingFor(id) {
      return (DEDUCTION_REQUIREMENTS[id] || [])
        .filter(req => !requirementMet(req))
        .map(req => req.label);
    }

    function deductionSolved(id) {
      const d = Array.isArray(E.deductions) ? E.deductions.find(x => x.id === id) : null;
      return !!d?.solved;
    }

    function canDeduceByState(id) {
      return !!DEDUCTION_REQUIREMENTS[id] && !deductionSolved(id) && missingFor(id).length === 0;
    }

    if (typeof E.canDeduce === 'function' && !E.__deductionCanDeduceRelaxed) {
      const oldCanDeduce = E.canDeduce.bind(E);
      E.canDeduce = function (id) {
        if (DEDUCTION_REQUIREMENTS[id]) return canDeduceByState(id);
        return oldCanDeduce(id);
      };
      E.__deductionCanDeduceRelaxed = true;
    }

    function hasDeductionChoice(choices, id) {
      const labelMap = {
        deduce_chen: '陈明远',
        deduce_lu_zhao: '黑衣男人',
        deduce_fusheng: '福生仓'
      };
      const label = labelMap[id];
      return choices.some(choice => (choice.text || choice.fogText || '').includes(label));
    }

    function lockedDeduction(text, id, hintPrefix) {
      const missing = missingFor(id);
      return {
        text,
        goto: 'ch3_wrapup',
        when: () => false,
        fogText: `🔒 ${text.replace(/^🧩\s*/, '')}`,
        fogHint: missing.length ? `${hintPrefix}：还缺 ${missing.join('、')}。` : `${hintPrefix}：条件还没合上。`
      };
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__deductionGuidancePatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const opts = choicesOf(oldChoices, state).slice();

        if (!E.getFlag('deduced_chen') && !E.getFlag('deduced_wrong') && !hasDeductionChoice(opts, 'deduce_chen')) {
          if (E.canDeduce('deduce_chen')) {
            opts.push({ text: '🧩 拼合线索——推理陈明远之死', effect: () => E.openDeduction('deduce_chen') });
          } else {
            opts.push(lockedDeduction('🧩 拼合线索——推理陈明远之死', 'deduce_chen', '陈明远之死还不能推'));
          }
        }

        if (E.getFlag('deduced_chen') && !E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_lu_zhao_fail') && !hasDeductionChoice(opts, 'deduce_lu_zhao')) {
          if (E.canDeduce('deduce_lu_zhao')) {
            opts.push({ text: '🧩 推理——黑衣男人与陆小姐的关系', effect: () => E.openDeduction('deduce_lu_zhao') });
          } else {
            opts.push(lockedDeduction('🧩 推理——黑衣男人与陆小姐的关系', 'deduce_lu_zhao', '第二段推理还不能开'));
          }
        }

        if (E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_fusheng') && !E.getFlag('deduced_fusheng_fail') && !hasDeductionChoice(opts, 'deduce_fusheng')) {
          if (E.canDeduce('deduce_fusheng')) {
            opts.push({ text: '🧩 推理——福生仓与公董局的真相', effect: () => E.openDeduction('deduce_fusheng') });
          } else {
            opts.push(lockedDeduction('🧩 推理——福生仓与公董局的真相', 'deduce_fusheng', '第三段推理要等福生仓现场证据'));
          }
        }

        return opts;
      };
      nodes.ch3_wrapup.__deductionGuidancePatched = true;
    }

    E.__deductionFlowGuidancePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDeductionFlowGuidance);
})();
