// ===== 运行时硬错误兜底 =====
// 目标：修复补丁链叠加后出现的“推理题尚未登记”、重复登记、旧码头节点跳转等硬卡死问题。

(function installRuntimeBugfixes() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  function patchDeductionRegistry() {
    if (E.__runtimeDeductionRegistryPatched) return;

    function findDeduction(id) {
      return Array.isArray(E.deductions) ? E.deductions.find(d => d && d.id === id) : null;
    }

    const oldRegisterDeduction = typeof E.registerDeduction === 'function' ? E.registerDeduction.bind(E) : null;
    if (oldRegisterDeduction) {
      E.registerDeduction = function (id, question, options, correctIdx, successNode, failNode, requiredClues) {
        if (!Array.isArray(this.deductions)) this.deductions = [];
        const existing = findDeduction(id);
        if (existing) {
          Object.assign(existing, { id, question, options, correctIdx, successNode, failNode, requiredClues });
          if (typeof existing.solved !== 'boolean') existing.solved = false;
          return existing;
        }
        oldRegisterDeduction(id, question, options, correctIdx, successNode, failNode, requiredClues);
        return findDeduction(id);
      };
    }

    E.ensureDeductionRegistered = function (id) {
      let d = findDeduction(id);
      if (d) return d;
      if (typeof this.registerAll === 'function') {
        this.registerAll();
        d = findDeduction(id);
      }
      return d;
    };

    const oldOpenDeduction = typeof E.openDeduction === 'function' ? E.openDeduction.bind(E) : null;
    if (oldOpenDeduction) {
      E.openDeduction = function (id) {
        const d = this.ensureDeductionRegistered ? this.ensureDeductionRegistered(id) : findDeduction(id);
        if (!d) {
          this.toast('推理题尚未登记，请刷新页面后重试。');
          return false;
        }
        return oldOpenDeduction(id);
      };
    }

    const oldOpenDeductionSafe = typeof E.openDeductionSafe === 'function' ? E.openDeductionSafe.bind(E) : null;
    E.openDeductionSafe = function (id) {
      const d = this.ensureDeductionRegistered ? this.ensureDeductionRegistered(id) : findDeduction(id);
      if (!d) {
        this.toast('推理题尚未登记，请刷新页面后重试。');
        return false;
      }
      if (oldOpenDeductionSafe) return oldOpenDeductionSafe(id);
      if (typeof this.openDeduction === 'function') return this.openDeduction(id);
      return false;
    };

    E.__runtimeDeductionRegistryPatched = true;
  }

  function normalizeDockGoto(choice) {
    if (!choice || choice.__dockGotoNormalized) return choice;
    const next = { ...choice };
    if (next.goto === 'ch4_dock_inside') {
      next.goto = () => E.routeDockByPressure ? E.routeDockByPressure() : 'ch4_dock_full_search';
      next.__dockGotoNormalized = true;
    }
    return next;
  }

  function patchChoiceList(nodeId) {
    const node = nodes[nodeId];
    if (!node || node.__runtimeDockChoicePatched) return;
    const oldChoices = node.choices;
    node.choices = function (state) {
      const choices = typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
      return Array.isArray(choices) ? choices.map(normalizeDockGoto) : choices;
    };
    node.__runtimeDockChoicePatched = true;
  }

  function patchDockRoutes() {
    patchChoiceList('ch4_suzhou_creek');
    patchChoiceList('ch4_dock_watch');
  }

  function textOf(choice) {
    return choice?.text || choice?.fogText || '';
  }

  function hasThing(name) {
    return typeof E.hasItem === 'function' && typeof E.hasClue === 'function' && (E.hasItem(name) || E.hasClue(name));
  }

  function hasDockEvidence() {
    return hasThing('公董局公文纸')
      || hasThing('暗室刚被清空')
      || hasThing('暗室已经转空')
      || hasThing('仓库暗室')
      || hasThing('获救者身份')
      || hasThing('苏晚亭曾在暗室')
      || hasThing('苏晚亭手表')
      || hasThing('苏晚亭学生证')
      || hasThing('沈玉芳曾在暗室')
      || hasThing('教具箱走私')
      || hasThing('管制药品走私')
      || hasThing('光华货运单')
      || hasThing('清场指令')
      || E.getFlag('dock_entry_committed')
      || E.getFlag('dock_solo_entry')
      || E.getFlag('found_yufang')
      || E.getFlag('rescued_yufang')
      || E.getFlag('found_su_at_dock')
      || E.getFlag('su_moved_from_dock')
      || E.getFlag('su_trace_only')
      || E.getFlag('missed_both_at_dock');
  }

  function isFushengActionStage() {
    return E.getFlag('deduced_lu_zhao')
      && !E.getFlag('deduced_fusheng')
      && !E.getFlag('deduced_fusheng_fail')
      && !hasDockEvidence();
  }

  function isRepeatedFushengEntry(choice) {
    if (!choice || !hasDockEvidence()) return false;
    const text = textOf(choice);
    return choice.goto === 'ch4_suzhou_creek'
      || choice.goto === 'ch4_sun_support'
      || text.includes('不找支援，独自去福生仓')
      || text.includes('巡捕房找老孙商量福生仓')
      || text.includes('苏州河废弃码头')
      || text.includes('查福生仓');
  }

  function normalizeWrapupReviewLoop(choice) {
    if (!choice) return choice;
    if (isRepeatedFushengEntry(choice)) return null;
    const text = textOf(choice);
    if (isFushengActionStage() && (choice.goto === 'ch4_conclusion' || text.includes('回顾现有证据') || text.includes('证据链仍不完整'))) {
      return { ...choice, text: '🔙 回顾现有证据（暂不行动）', goto: 'ch4_conclusion' };
    }
    if (hasDockEvidence() && (choice.goto === 'ch4_conclusion' || text.includes('回顾现有证据') || text.includes('证据链仍不完整'))) {
      return { ...choice, text: '🔙 回顾现有证据，准备收束', goto: 'ch4_conclusion' };
    }
    return choice;
  }

  function hasFushengDeductionChoice(choices) {
    return choices.some(choice => textOf(choice).includes('福生仓与公董局'));
  }

  function openDeductionEffect(id) {
    return () => {
      if (typeof E.openDeductionSafe === 'function') E.openDeductionSafe(id);
      else if (typeof E.openDeduction === 'function') E.openDeduction(id);
    };
  }

  function patchWrapupFushengDeductionChoice() {
    const node = nodes.ch3_wrapup;
    if (!node || node.__runtimeFushengDeductionChoicePatched) return;
    const oldChoices = node.choices;
    node.choices = function (state) {
      let choices = typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
      if (!Array.isArray(choices)) return choices;
      choices = choices.map(normalizeWrapupReviewLoop).filter(Boolean);
      if (hasFushengDeductionChoice(choices)) return choices;
      if (!E.getFlag('deduced_lu_zhao') || E.getFlag('deduced_fusheng') || E.getFlag('deduced_fusheng_fail')) return choices;
      if (typeof E.canDeduce === 'function' && !E.canDeduce('deduce_fusheng')) return choices;
      return [
        { text: '🧩 推理——福生仓与公董局的真相', effect: openDeductionEffect('deduce_fusheng') },
        ...choices,
      ];
    };
    node.__runtimeFushengDeductionChoicePatched = true;
  }

  function applyRuntimeBugfixes() {
    patchDeductionRegistry();
    patchDockRoutes();
    patchWrapupFushengDeductionChoice();
  }

  // 立即补一层：start/loadGame 后的 registerAll 会走去重登记。
  patchDeductionRegistry();

  document.addEventListener('DOMContentLoaded', applyRuntimeBugfixes);
})();