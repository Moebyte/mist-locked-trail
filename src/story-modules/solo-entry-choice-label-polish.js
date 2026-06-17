// ===== Solo 入口文案显性化 =====
// 目标：solo 线已经存在，但入口原文“趁换班从东侧窗户潜入”不够明显。
// 调整：在没有选择老孙/便衣支援前，把福生仓外的直接潜入选项标成“独自潜入”。

(function installSoloEntryChoiceLabelPolish() {
  function applySoloEntryChoiceLabelPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__soloEntryChoiceLabelPolishPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasSupportCommitted() {
      return E.getFlag('sun_fast_support')
        || E.getFlag('sun_fast_support_active')
        || E.getFlag('dock_fast_support_entry')
        || E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('sun_support_in_action');
    }

    function polishSoloChoice(choice) {
      if (!choice) return choice;
      const text = choice.text || '';
      const looksLikeDirectDockEntry = text.includes('东侧窗户潜入') || text.includes('东侧窗户翻进去');
      if (!looksLikeDirectDockEntry) return choice;
      if (hasSupportCommitted()) return choice;
      return {
        ...choice,
        text: '🔦 不找支援，独自从东侧窗户潜入'
      };
    }

    for (const nodeId of ['ch4_suzhou_creek', 'ch4_fu_lu_scene']) {
      const node = nodes[nodeId];
      if (!node || node.__soloEntryChoiceLabelPatched) continue;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.map(polishSoloChoice);
      };
      node.__soloEntryChoiceLabelPatched = true;
    }

    E.__soloEntryChoiceLabelPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySoloEntryChoiceLabelPolish);
})();
