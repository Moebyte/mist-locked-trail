// ===== 真结局路线兜底 =====
// 目标：玩家完成完整救人准备后，福生仓路线不应被压力路由误挡到“只救沈玉芳/苏晚亭被转走”。
// 说明：福生仓真相推理需要仓库里的公董局公文纸与教具箱证据，不能作为进入福生仓前置条件。
// 完整救人准备 = 光华三证物闭环 + 找到王巡官/福生仓入口 + 认识沈玉芳人质线 + 拿到苏母信物。

(function installTrueEndingRoutePolish() {
  function applyTrueEndingRoutePolish() {
    if (typeof E === 'undefined') return;
    if (E.__trueEndingRoutePolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function hasWangFushengLead() {
      if (typeof E.hasWangFushengLead === 'function') return E.hasWangFushengLead();
      return E.getFlag('got_wang_note') || hasThing('王巡官遗留纸条') || hasThing('半张烟盒纸') || hasThing('福生仓地址');
    }

    function knowsYufangForRescue() {
      if (typeof E.knowsYufangForRescue === 'function') return E.knowsYufangForRescue();
      return E.getFlag('sister_case') || hasThing('沈玉芳') || hasThing('沈玉芳与陈明远');
    }

    function hasSuTrustToken() {
      if (typeof E.hasSuHomeTrustToken === 'function') return E.hasSuHomeTrustToken();
      return E.getFlag('shown_photo_to_mother') || hasThing('苏母认出照片') || hasThing('苏晚亭的银发夹');
    }

    E.trueEndingPrepared = function () {
      return this.getFlag('school_wu_three_proofs')
        && hasWangFushengLead()
        && knowsYufangForRescue()
        && hasSuTrustToken()
        && !this.getFlag('missed_deadline');
    };

    if (typeof E.routeDockByPressure === 'function' && !E.__trueEndingRouteDockPatched) {
      const oldRouteDockByPressure = E.routeDockByPressure.bind(E);
      E.routeDockByPressure = function () {
        if (this.trueEndingPrepared()) return 'ch4_dock_full_search';
        return oldRouteDockByPressure();
      };
      E.__trueEndingRouteDockPatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__trueEndingRouteDockDeepPatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (this.trueEndingPrepared()) return 'ch4_dock_deep_dual';
        return oldRouteDockDeepByPressure();
      };
      E.__trueEndingRouteDockDeepPatched = true;
    }

    E.__trueEndingRoutePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyTrueEndingRoutePolish);
})();
