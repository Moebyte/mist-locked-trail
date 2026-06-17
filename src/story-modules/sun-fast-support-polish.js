// ===== 老孙私下增援收束 =====
// 目标：“只带一个便衣”表示低调快速潜入，不应直接显示/路由成“只够救人”。
// 人少的代价是压不住傅启元，不是找不到暗室或必然错过苏晚亭。

(function installSunFastSupportPolish() {
  function applySunFastSupportPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__sunFastSupportPolishPatched) return;

    function fastSupportActive() {
      return E.getFlag('sun_fast_support') || E.getFlag('sun_fast_support_active');
    }

    function lowProfileRouteReady() {
      return fastSupportActive() && !E.getFlag('missed_deadline');
    }

    if (nodes.ch4_dock_sun_fast_support && !nodes.ch4_dock_sun_fast_support.__sunFastTextPatched) {
      const oldEffect = nodes.ch4_dock_sun_fast_support.effect;
      nodes.ch4_dock_sun_fast_support.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.setFlag('sun_fast_support_active', true);
      };
      nodes.ch4_dock_sun_fast_support.text = () => `老孙只叫来一个信得过的便衣。你们分头靠近福生仓。<br><br>人少，动静小，能抢时间；但真要在码头上正面扣人，仅靠一个便衣还压不住傅启元。<br><br><span class="sys">低调潜入 · 尚未惊动。</span>`;
      nodes.ch4_dock_sun_fast_support.choices = [
        { text: '🚓 分头潜入福生仓', goto: () => E.routeDockByPressure() }
      ];
      nodes.ch4_dock_sun_fast_support.__sunFastTextPatched = true;
    }

    if (typeof E.routeDockByPressure === 'function' && !E.__sunFastRouteDockPatched) {
      const oldRouteDockByPressure = E.routeDockByPressure.bind(E);
      E.routeDockByPressure = function () {
        if (typeof this.trueEndingPrepared === 'function' && this.trueEndingPrepared()) return 'ch4_dock_full_search';
        if (lowProfileRouteReady()) {
          const target = oldRouteDockByPressure();
          if (target === 'ch4_dock_cleared') return target;
          if (target === 'ch4_dock_rescue_only') return 'ch4_dock_limited_search';
          return target;
        }
        return oldRouteDockByPressure();
      };
      E.__sunFastRouteDockPatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__sunFastRouteDockDeepPatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (typeof this.trueEndingPrepared === 'function' && this.trueEndingPrepared()) return 'ch4_dock_deep_dual';
        if (lowProfileRouteReady()) {
          const target = oldRouteDockDeepByPressure();
          if (target === 'ch4_dock_cleared') return target;
          if (target === 'ch4_dock_deep_rescue_only') return 'ch4_dock_deep_trace';
          return target;
        }
        return oldRouteDockDeepByPressure();
      };
      E.__sunFastRouteDockDeepPatched = true;
    }

    if (typeof E.narrativeClockLabel === 'function' && !E.__sunFastClockPatched) {
      const oldNarrativeClockLabel = E.narrativeClockLabel.bind(E);
      E.narrativeClockLabel = function () {
        const id = this.state?.currentScene || '';
        if (lowProfileRouteReady() && (id === 'ch4_dock_sun_fast_support' || /^ch4_dock/.test(id))) return '低调潜入';
        return oldNarrativeClockLabel();
      };
      E.pressureLabel = function () {
        return this.narrativeClockLabel();
      };
      E.__sunFastClockPatched = true;
    }

    E.__sunFastSupportPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySunFastSupportPolish);
})();
