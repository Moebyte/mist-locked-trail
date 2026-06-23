// ===== 硬时间结局退役 =====
// 目标：时间系统不再作为结局判定来源。
// 现在福生仓阶段由 heat/delay 判断潜入结果，由 dock exit tension/control 判断逃出危机。
// “迟到一步”只保留为旧存档/旧节点兼容文案，不再由新路线主动路由。

(function installDeadlineDeprecationPolish() {
  function applyDeadlineDeprecationPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__deadlineDeprecationPolishPatched) return;

    function rawMinutesUntilDeadline() {
      const deadline = E.state?.pressure?.deadline;
      const now = E.state?.inGameTime;
      if (!deadline || !now) return Number.POSITIVE_INFINITY;
      if (typeof E.timeToMinutes === 'function') return E.timeToMinutes(deadline) - E.timeToMinutes(now);
      const toMinutes = (t) => (t.day || 1) * 1440 + (t.hour || 0) * 60 + (t.minute || 0);
      return toMinutes(deadline) - toMinutes(now);
    }

    function rawDeadlinePhase() {
      const left = rawMinutesUntilDeadline();
      if (left < 0) return 'expired';
      if (left < 180) return 'critical';
      if (left < 600) return 'tight';
      return 'safe';
    }

    function fastSupportMode() {
      return E.getFlag('sun_fast_support')
        || E.getFlag('sun_fast_support_active')
        || E.getFlag('sun_fast_cover_escape')
        || E.getFlag('dock_fast_support_entry');
    }

    function fullSupportMode() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function trueFastRescuePrepared() {
      return typeof E.trueEndingFastRescuePrepared === 'function' && E.trueEndingFastRescuePrepared();
    }

    function fullSupportTradeoffActive() {
      return typeof E.fullSupportTradeoffActive === 'function' && E.fullSupportTradeoffActive();
    }

    E.minutesUntilDeadline = rawMinutesUntilDeadline;

    E.effectiveMinutesUntilDeadline = function () {
      return Number.POSITIVE_INFINITY;
    };

    E.rawDeadlinePhaseForDock = rawDeadlinePhase;

    E.deadlinePhase = function () {
      return 'safe';
    };

    E.deadlinePhaseLabel = function () {
      const h = this.state?.pressure?.heat || 0;
      if (h >= 5) return '风声很紧';
      if (h >= 3) return '已有惊动';
      if (h >= 1) return '略有风险';
      return '尚未惊动';
    };

    E.pressureLabel = function () {
      if (typeof this.narrativeClockLabel === 'function') return this.narrativeClockLabel();
      return this.deadlinePhaseLabel();
    };

    if (typeof E.routeDockSearchByTime === 'function' && !E.__deadlineFastSearchWindowPatched) {
      const oldRouteDockSearchByTime = E.routeDockSearchByTime.bind(E);
      E.routeDockSearchByTime = function () {
        if (trueFastRescuePrepared()) return 'ch4_dock_full_search';
        if (fullSupportTradeoffActive()) {
          this.setFlag('dock_full_support_tradeoff', true);
          return 'ch4_dock_full_search';
        }
        const heat = Math.max(0, Number(this.state?.pressure?.heat || 0));
        if (fastSupportMode() && !fullSupportMode() && rawDeadlinePhase() === 'critical' && heat < 5 && !this.getFlag('missed_deadline')) {
          return 'ch4_dock_limited_search';
        }
        return oldRouteDockSearchByTime();
      };
      E.__deadlineFastSearchWindowPatched = true;
    }

    // 不再用硬时间门控覆盖新版福生仓入口路由。
    // dock-heat-system-polish 会先按 solo/便衣/老孙进入潜入节点，再在仓内用 heat/delay 分流。
    // 这里仅在旧包没有安装新版路由时提供兼容兜底。
    if (typeof E.routeDockByPressure !== 'function' || typeof E.dockSupportMode !== 'function') {
      E.routeDockByPressure = function () {
        if (typeof this.dockHeatTier === 'function') {
          const tier = this.dockHeatTier();
          if (tier.key === 'high') return 'ch4_dock_limited_search';
          if (tier.key === 'mid') return 'ch4_dock_limited_search';
        }
        return 'ch4_dock_full_search';
      };
    }

    if (typeof E.routeDockDeepByPressure !== 'function' || typeof E.dockSupportMode !== 'function') {
      E.routeDockDeepByPressure = function () {
        if (typeof this.dockHeatTier === 'function') {
          const tier = this.dockHeatTier();
          if (tier.key === 'high') return 'ch4_dock_deep_empty_heat';
          if (tier.key === 'mid') return 'ch4_dock_deep_trace';
        }
        return 'ch4_dock_deep_dual';
      };
    }

    if (typeof E.v07ResolveEnding === 'function' && !E.__deadlineEndingResolvePatched) {
      const oldResolve = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        const result = oldResolve();
        if (result === 'end_too_late') {
          if (!this.getFlag('rescued_yufang') && !this.getFlag('rescued_su') && typeof this.truthCompletenessTier === 'function') {
            const t = this.truthCompletenessTier();
            if ((t.hardEvidenceCount || 0) >= 2 || (t.score || 0) >= 6) return 'end_evidence_only';
          }
          return 'end_archive';
        }
        return result;
      };
      E.__deadlineEndingResolvePatched = true;
    }

    if (nodes.end_too_late && !nodes.end_too_late.__deprecatedDeadlinePatched) {
      nodes.end_too_late.title = '结局 · 空仓余证';
      nodes.end_too_late.text = () => `福生仓已经空了。<br><br>这不是因为钟表上的某个刻度到了，而是因为你们在仓库里的动静、折返和犹豫，让傅启元的人提前把人和箱子都转走了。<br><br>地上还有拖痕，纸灰里还有蓝封公文角。你捡起那些残片，明白自己仍能证明一部分真相，却再也听不到暗室里的人亲口说出那一夜。<br><br><span class="sys">旧的“迟到一步”结局已退役；当前路线按空仓/证据收束处理。</span><br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 空仓余证 ——</div>`;
      nodes.end_too_late.__deprecatedDeadlinePatched = true;
    }

    E.__deadlineDeprecationPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDeadlineDeprecationPolish);
})();
