// ===== 推理链提示收束 =====
// 目标：推理不是一次性三连问；后续推理条件不足时，不再凭空消失，而是显示锁定提示。
// 修正：推理放行不再依赖原始 requiredClues 的单一精确名，避免玩家已拿到等价线索却被卡死。
// 修正：推理入口使用 safe opener，避免 wrapup 选项点击后没有任何反馈。
// 调整：三段推理改为“证据组满足”，把同义线索、阶段性线索纳入同一组。

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
        {
          names: ['陈明远坠楼案', '光华小学事件', '陈老师遗物', '陈明远的退缩'],
          label: '陈明远死亡疑点'
        },
        {
          names: ['陈明远的信', '陈老师给苏晚亭的信', '给苏晚亭的信', '未寄出的信'],
          label: '陈明远留下的求助或证据'
        },
        {
          names: ['恐吓信', '203 室恐吓信', '如果你不说，他们下一个就是你'],
          label: '外部威胁证据'
        },
        {
          names: ['光华小学箱子异常', '光华小学采购疑点', '吴校长补充证词', '傅启元夜运教具箱', '管制药品走私', '教具箱走私'],
          label: '光华小学异常线索'
        }
      ],
      deduce_lu_zhao: [
        {
          names: ['跟踪黑衣男人', '黑衣男人线索', '黑衣男人', '鸿运茶楼', '黑衣男人姓赵'],
          label: '黑衣男人行动线索'
        },
        {
          names: ['神秘女子', '203 室的陆姓女子', '陆小姐的笔记', '陆念薇旧名', '杭州旧案剪报', '203 室烧毁照片', '陆小姐身份线索'],
          label: '陆小姐身份线索'
        },
        {
          names: ['翡翠镯', '周怀安识出陆念', '陆念薇旧名', '杭州旧案剪报', '陆念'],
          label: '黑衣男人与陆小姐连接证据'
        },
        {
          names: ['沈玉兰的妹妹', '沈玉芳', '沈玉芳请假失踪', '陈老师与女子争吵', '苏晚亭日记残页', '苏晚亭主动追查光华小学', '苏晚亭主动追查光华小学'],
          label: '沈玉芳或苏晚亭卷入陆小姐线索'
        }
      ],
      deduce_fusheng: [
        {
          names: ['王巡官遗留纸条', '半张烟盒纸', '福生仓标识', '福生仓地址', '福生仓位置'],
          label: '福生仓入口与王巡官警告'
        },
        {
          names: ['陈明远的信', '陈老师给苏晚亭的信', '给苏晚亭的信', '陈明远的退缩'],
          label: '陈明远留下的福生仓前因'
        },
        {
          names: ['恐吓信', '203 室恐吓信', '如果你不说，他们下一个就是你'],
          label: '灭口威胁证据'
        },
        {
          names: ['公董局公文纸', '清场指令', '暗室刚被清空', '福生仓公董局公文纸', '福生仓清场'],
          label: '福生仓现场公董局清场证据'
        },
        {
          names: ['教具箱走私', '管制药品走私', '傅启元夜运教具箱', '光华货运单', '傅启元货运单破绽', '光华小学采购疑点'],
          label: '教具箱走私与傅启元线索'
        }
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

    E.deductionMissingFor = function (id) {
      return missingFor(id);
    };

    E.deductionRequirementLabels = function (id) {
      return (DEDUCTION_REQUIREMENTS[id] || []).map(req => req.label);
    };

    function deductionSolved(id) {
      const d = Array.isArray(E.deductions) ? E.deductions.find(x => x.id === id) : null;
      return !!d?.solved || (id === 'deduce_chen' && E.getFlag('deduced_chen')) || (id === 'deduce_lu_zhao' && E.getFlag('deduced_lu_zhao')) || (id === 'deduce_fusheng' && E.getFlag('deduced_fusheng'));
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

    if (typeof E.openDeduction === 'function' && !E.__safeOpenDeductionPatched) {
      const oldOpenDeduction = E.openDeduction.bind(E);
      E.openDeductionSafe = function (id) {
        const d = Array.isArray(this.deductions) ? this.deductions.find(x => x.id === id) : null;
        if (!d) {
          this.toast('推理题尚未登记，请刷新页面后重试。');
          return false;
        }
        const missing = missingFor(id);
        if (DEDUCTION_REQUIREMENTS[id] && missing.length) {
          this.toast(`这段推理还差：${missing.join('、')}。`);
          return false;
        }
        oldOpenDeduction(id);
        const opened = !!(this.deducEl && this.deducEl.style && this.deducEl.style.display === 'flex');
        if (!opened) this.toast('推理面板没有打开，请刷新页面后重试。');
        return opened;
      };
      E.__safeOpenDeductionPatched = true;
    }

    function openDeductionEffect(id) {
      return () => {
        if (typeof E.openDeductionSafe === 'function') E.openDeductionSafe(id);
        else E.openDeduction(id);
      };
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
            opts.push({ text: '🧩 拼合线索——推理陈明远之死', effect: openDeductionEffect('deduce_chen') });
          } else {
            opts.push(lockedDeduction('🧩 拼合线索——推理陈明远之死', 'deduce_chen', '陈明远之死还不能推'));
          }
        }

        if (E.getFlag('deduced_chen') && !E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_lu_zhao_fail') && !hasDeductionChoice(opts, 'deduce_lu_zhao')) {
          if (E.canDeduce('deduce_lu_zhao')) {
            opts.push({ text: '🧩 推理——黑衣男人与陆小姐的关系', effect: openDeductionEffect('deduce_lu_zhao') });
          } else {
            opts.push(lockedDeduction('🧩 推理——黑衣男人与陆小姐的关系', 'deduce_lu_zhao', '第二段推理还不能开'));
          }
        }

        if (E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_fusheng') && !E.getFlag('deduced_fusheng_fail') && !hasDeductionChoice(opts, 'deduce_fusheng')) {
          if (E.canDeduce('deduce_fusheng')) {
            opts.push({ text: '🧩 推理——福生仓与公董局的真相', effect: openDeductionEffect('deduce_fusheng') });
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