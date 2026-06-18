// ===== 福生仓决策点去除回看入口 =====
// 目标：第二段推理完成后，真相边缘页只保留行动与早期收束，不再出现撤回/回看按钮。
(function installFushengDecisionNoReview() {
  function applyFushengDecisionNoReview() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fushengDecisionNoReviewPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasDockEvidence() {
      return hasThing('公董局公文纸')
        || hasThing('暗室刚被清空')
        || hasThing('暗室已经转空')
        || hasThing('仓库暗室')
        || hasThing('获救者身份')
        || hasThing('苏晚亭曾在暗室')
        || hasThing('沈玉芳曾在暗室')
        || hasThing('教具箱走私')
        || hasThing('光华货运单')
        || hasThing('清场指令')
        || E.getFlag('dock_entry_committed')
        || E.getFlag('dock_solo_entry')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_fast_support_entry')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('missed_both_at_dock')
        || E.getFlag('missed_both_due_to_return_tool');
    }

    function isFushengDecisionStage() {
      return E.getFlag('deduced_chen')
        && E.getFlag('deduced_lu_zhao')
        && !E.getFlag('deduced_fusheng')
        && !E.getFlag('deduced_fusheng_fail')
        && !hasDockEvidence();
    }

    function isReviewOrRollback(choice) {
      const text = choice?.text || choice?.fogText || '';
      const goto = typeof choice?.goto === 'function' ? choice.goto(E.state) : choice?.goto;
      return goto === 'ch3_wrapup'
        || goto === 'ch4_conclusion'
        || text.includes('不落笔')
        || text.includes('回顾现有证据')
        || text.includes('回去看一遍线索')
        || text.includes('暂不行动');
    }

    function patchNode(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__fushengDecisionNoReviewPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const choices = typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
        if (!Array.isArray(choices) || !isFushengDecisionStage()) return choices;
        return choices.filter(choice => !isReviewOrRollback(choice));
      };
      node.__fushengDecisionNoReviewPatched = true;
    }

    patchNode('ch4_conclusion');
    E.__fushengDecisionNoReviewPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengDecisionNoReview);
})();
