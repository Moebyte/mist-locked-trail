// ===== 苏家信物回访入口 =====
// 目标：如果玩家早访苏家未拿到银发夹，之后在大学线拿到苏晚亭近期照片时，
// 在自然整理/转场节点显式提供“回苏家给苏母看照片”的入口。
// 注意：203 室与苏母没有直接因果关系，不在 203 搜查后硬插回访入口。
(function installSuHomeRevisitEntryFix() {
  function applySuHomeRevisitEntryFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__suHomeRevisitEntryFixPatched) return;

    function hasUniversityPhotoLead() {
      return E.hasItem?.('苏晚亭的照片') || E.hasClue?.('苏晚亭藏起的照片');
    }

    function needsSuHomeRevisit() {
      return E.getFlag?.('su_home_early_without_photo')
        && hasUniversityPhotoLead()
        && !E.getFlag?.('shown_photo_to_mother')
        && !E.hasItem?.('苏晚亭的银发夹');
    }

    function revisitChoice() {
      return { text: '🏠 回苏家——把大学里找到的照片给苏母看', goto: 'ch2_home' };
    }

    function prependRevisitChoice(choices) {
      if (!Array.isArray(choices)) return choices;
      if (!needsSuHomeRevisit()) return choices;
      if (choices.some(c => c.goto === 'ch2_home')) return choices.map(c => c.goto === 'ch2_home' ? revisitChoice() : c);
      return [revisitChoice(), ...choices];
    }

    function patchChoices(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__suHomeRevisitEntryPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const raw = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return prependRevisitChoice(raw || []);
      };
      node.__suHomeRevisitEntryPatched = true;
    }

    [
      'ch2_leave_univ',
      'ch2_leave_home',
      'ch3_wrapup'
    ].forEach(patchChoices);

    E.__suHomeRevisitEntryFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySuHomeRevisitEntryFix);
})();