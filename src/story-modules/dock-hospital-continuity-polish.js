// ===== 码头 → 医院连续性约束 =====
// 目标：各系统不能割裂。医院线只能接收“成功逃离码头”的状态。
// 如果码头 tension/control 已经进入 lethal，说明傅启元在码头阶段狗急跳墙，不能继续进入医院线。

(function installDockHospitalContinuityPolish() {
  function applyDockHospitalContinuityPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockHospitalContinuityPolishPatched) return;

    E.canEnterHospitalLine = function () {
      if (typeof this.dockExitRiskTier === 'function' && this.dockExitRiskTier().key === 'lethal') return false;
      if (this.getFlag('dock_fast_confront_hard_evidence') && typeof this.dockExitCrisisScore === 'function' && this.dockExitCrisisScore() > 5) return false;
      if (this.getFlag('dock_fast_confront_bad')) return false;
      return true;
    };

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__dockHospitalContinuityPatched) {
      const oldText = nodes.ch4_dock_escape_finish.text;
      const oldChoices = nodes.ch4_dock_escape_finish.choices;
      nodes.ch4_dock_escape_finish.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.canEnterHospitalLine()) return base;
        return `${base}<br><br><span class="sys">码头局势已经超过医院线能够承接的范围。傅启元被逼到死角，医院不再是下一站。</span>`;
      };
      nodes.ch4_dock_escape_finish.choices = function (state) {
        if (!E.canEnterHospitalLine()) {
          return [{ text: '⚠️ 码头局势失控，无法进入医院线', goto: 'end_dock_silenced' }];
        }
        return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      };
      nodes.ch4_dock_escape_finish.__dockHospitalContinuityPatched = true;
    }

    E.__dockHospitalContinuityPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockHospitalContinuityPolish);
})();
