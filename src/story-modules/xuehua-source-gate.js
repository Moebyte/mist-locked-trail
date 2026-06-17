// ===== 薛华立路来源收口 =====
// 目标：薛华立路 22 号只由大学论文草稿/法租界地图解锁。
// 巡捕房不能单独解锁薛华立路；但如果玩家先去过大学拿到地图，再去巡捕房，回流菜单仍可显示薛华立路。
(function installXuehuaSourceGate() {
  function applyXuehuaSourceGate() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehuaSourceGatePatched) return;

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图');
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function isXuehuaChoice(choice) {
      const text = choice?.text || choice?.fogText || '';
      return choice?.goto === 'ch2_frenchtown' || text.includes('薛华立路') || text.includes('法租界');
    }

    function filterXuehuaUntilUniversityLead(choices) {
      if (hasUniversityXuehuaLead()) return choices;
      return choices.filter(choice => !isXuehuaChoice(choice));
    }

    for (const nodeId of ['ch2_leave_home', 'ch2_leave_univ', 'ch2_police_file', 'ch2_police_alt', 'ch2_police_wang']) {
      const node = nodes[nodeId];
      if (!node || node.__xuehuaSourceGatePatched) continue;
      const oldChoices = node.choices;
      node.choices = function (state) {
        return filterXuehuaUntilUniversityLead(choicesOf(oldChoices, state));
      };
      node.__xuehuaSourceGatePatched = true;
    }

    E.__xuehuaSourceGatePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehuaSourceGate);
})();
