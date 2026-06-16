(function () {
  function apply() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    const node = nodes.ch2_university;
    if (!node || node.__universityChoicesPatched) return;
    const oldChoices = node.choices;
    const target = ['ch2', 'univ', 'door'].join('_');
    const flag = ['asked', 'door'].join('_');
    node.choices = function (state) {
      const raw = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      const list = Array.isArray(raw) ? raw : [];
      return list.filter(function (choice) {
        return !(choice.goto === target && E.getFlag(flag));
      });
    };
    node.__universityChoicesPatched = true;
  }
  document.addEventListener('DOMContentLoaded', apply);
})();
