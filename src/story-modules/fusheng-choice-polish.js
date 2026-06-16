// ===== 福生仓选项收口 =====
// 目标：在人马已经到场封控时，隐藏弱一级的“亮明身份”重复选项。
(function installFushengChoicePolish() {
  function applyFushengChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    const node = nodes.ch4_dock_escape;
    if (!node || node.__fushengChoicePolishPatched) return;

    function fullSupportAtDock() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    const oldChoices = node.choices;
    node.choices = function (state) {
      const choices = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      if (!Array.isArray(choices)) return [];
      if (!fullSupportAtDock()) return choices;

      return choices.filter(choice => {
        const text = choice.text || '';
        return !(choice.goto === 'ch4_fu_confront'
          && text.includes('老孙的人')
          && text.includes('亮明身份'));
      });
    };

    node.__fushengChoicePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengChoicePolish);
})();
