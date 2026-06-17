// ===== 真结局路线兜底 =====
// 目标：玩家完成完整救人准备后，快速/低调潜入不应被压力路由误挡到“只救沈玉芳/苏晚亭被转走”。
// 说明：福生仓真相推理需要仓库里的公董局公文纸与教具箱证据，不能作为进入福生仓前置条件。
// 完整救人准备 = 光华三证物闭环 + 找到王巡官/福生仓入口 + 认识沈玉芳人质线 + 拿到苏母信物。
// 但“调齐人手/老孙带队”本身会耽误时间：它强化压制和封锁，不再保证苏晚亭仍在暗室。

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

    function fullSupportBeforeEntry() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function fastOrSoloEntry() {
      return E.getFlag('sun_fast_support')
        || E.getFlag('sun_fast_support_active')
        || E.getFlag('sun_fast_cover_escape')
        || !fullSupportBeforeEntry();
    }

    E.trueEndingPrepared = function () {
      return this.getFlag('school_wu_three_proofs')
        && hasWangFushengLead()
        && knowsYufangForRescue()
        && hasSuTrustToken()
        && !this.getFlag('missed_deadline');
    };

    E.trueEndingFastRescuePrepared = function () {
      return this.trueEndingPrepared() && fastOrSoloEntry();
    };

    E.fullSupportTradeoffActive = function () {
      return this.trueEndingPrepared() && fullSupportBeforeEntry();
    };

    if (typeof E.routeDockByPressure === 'function' && !E.__trueEndingRouteDockPatched) {
      const oldRouteDockByPressure = E.routeDockByPressure.bind(E);
      E.routeDockByPressure = function () {
        if (this.trueEndingFastRescuePrepared()) return 'ch4_dock_full_search';
        if (this.fullSupportTradeoffActive()) {
          this.setFlag('dock_full_support_tradeoff', true);
          return 'ch4_dock_full_search';
        }
        return oldRouteDockByPressure();
      };
      E.__trueEndingRouteDockPatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__trueEndingRouteDockDeepPatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (this.trueEndingFastRescuePrepared()) return 'ch4_dock_deep_dual';
        if (this.fullSupportTradeoffActive()) {
          this.setFlag('dock_full_support_tradeoff', true);
          return 'ch4_dock_deep_trace';
        }
        return oldRouteDockDeepByPressure();
      };
      E.__trueEndingRouteDockDeepPatched = true;
    }

    E.__trueEndingRoutePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyTrueEndingRoutePolish);
})();
