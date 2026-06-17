// ===== Solo 福生仓 heat / delay 结果分流 =====
// 目标：solo 线仍遵守 heat / delay 制度，而不是硬编码剧情捷径。
// 取证只改变 delay；冒进只改变 heat。最终只由 heat + delay 三档决定：
// 1) score >= 7：高风险，救人窗口错过。
// 2) score >= 4：中风险，救出一方。
// 3) score < 4：低风险，双救机会最大。
// 证据完整度由实际路线决定，不再和救人结果硬绑定。

(function installSoloHeatDelayOutcomes() {
  function applySoloHeatDelayOutcomes() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__soloHeatDelayOutcomesPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function soloMode() {
      return E.getFlag('dock_solo_entry')
        || E.getFlag('dock_force_solo_entry')
        || E.getFlag('dock_solo_entry_requested')
        || (typeof E.dockSupportMode === 'function' && E.dockSupportMode() === 'solo');
    }

    function hasClearanceEvidence() {
      return hasThing('清场指令')
        || hasThing('公董局公文纸')
        || hasThing('福生仓公董局公文纸')
        || hasThing('福生仓清场');
    }

    function hasWaybillEvidence() {
      return hasThing('光华货运单')
        || hasThing('教具箱走私')
        || hasThing('管制药品走私')
        || hasThing('傅启元货运单破绽')
        || hasThing('光华小学采购疑点');
    }

    function soloHardEvidenceCount() {
      return (hasClearanceEvidence() ? 1 : 0) + (hasWaybillEvidence() ? 1 : 0);
    }

    function addClearanceEvidence() {
      E.setFlag('dock_solo_partial_clearance', true);
      E.setFlag('dock_clearance_seen_inside', true);
      E.addClue('公董局公文纸', '你在福生仓里撕下带蓝封印的清场指令，落款痕迹指向公董局。');
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
    }

    function addWaybillEvidence() {
      E.setFlag('dock_solo_partial_waybill', true);
      E.addClue('教具箱走私', '标着光华小学的教具箱里装的是盘尼西林、吗啡针剂和军用纱布，不是教学器材。');
      E.addClue('管制药品走私', '福生仓木箱内发现战时管制药品。');
      E.addItem('光华货运单', '福生仓货箱夹层里的货运单，发货名义是光华小学教学器材。');
    }

    if (typeof E.dockDelayScore === 'function' && !E.__soloEvidenceDelayPatched) {
      const oldDelayScore = E.dockDelayScore.bind(E);
      E.dockDelayScore = function () {
        let score = oldDelayScore();
        if (soloMode()) {
          // 取证动作只改变 delay floor，结果仍由 heat + delay 统一阈值决定。
          if (this.getFlag('dock_solo_full_evidence_sweep') || soloHardEvidenceCount() >= 2) score = Math.max(score, 5);
          else if (this.getFlag('dock_solo_partial_evidence_sweep') || soloHardEvidenceCount() === 1) score = Math.max(score, 3);
          else if (this.getFlag('dock_solo_no_evidence_rush')) score = Math.min(score, 1);
        }
        return Math.max(0, Math.min(8, score));
      };
      E.__soloEvidenceDelayPatched = true;
    }

    E.soloDockOutcomeTier = function () {
      const exposure = typeof this.dockExposureScore === 'function' ? this.dockExposureScore() : 0;
      const delay = typeof this.dockDelayScore === 'function' ? this.dockDelayScore() : 0;
      const hardEvidence = soloHardEvidenceCount();
      const score = exposure + delay;

      if (score >= 7) {
        return { key: 'full_evidence_no_rescue', label: '高风险：救人窗口错过', exposure, delay, score, hardEvidence };
      }
      if (score >= 4) {
        return { key: 'partial_evidence_one_rescue', label: '中风险：救出一方', exposure, delay, score, hardEvidence };
      }
      return { key: 'no_evidence_dual_rescue', label: '低风险：双救', exposure, delay, score, hardEvidence };
    };

    E.routeSoloDockDeepByHeatDelay = function () {
      const tier = this.soloDockOutcomeTier();
      this.setFlag(`solo_outcome_${tier.key}`, true);
      if (tier.key === 'full_evidence_no_rescue') return 'ch4_dock_deep_empty_heat';
      if (tier.key === 'partial_evidence_one_rescue') return 'ch4_dock_deep_trace';
      return 'ch4_dock_deep_dual';
    };

    if (typeof E.routeDockSearchByTime === 'function' && !E.__soloSearchChoiceRoutePatched) {
      const oldRouteDockSearchByTime = E.routeDockSearchByTime.bind(E);
      E.routeDockSearchByTime = function () {
        const phase = typeof this.deadlinePhase === 'function' ? this.deadlinePhase() : 'safe';
        if (soloMode() && phase !== 'expired' && !this.getFlag('dock_solo_search_committed')) {
          return 'ch4_dock_solo_search_choice';
        }
        return oldRouteDockSearchByTime();
      };
      E.__soloSearchChoiceRoutePatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__soloDeepOutcomeRoutePatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (soloMode()) return this.routeSoloDockDeepByHeatDelay();
        return oldRouteDockDeepByPressure();
      };
      E.__soloDeepOutcomeRoutePatched = true;
    }

    function narrativeRiskHint() {
      if (typeof E.soloDockOutcomeTier !== 'function') return '';
      const t = E.soloDockOutcomeTier();
      if (t.key === 'full_evidence_no_rescue') return '你已经把能证明福生仓罪证的东西攥在手里，可仓库深处的声音也越来越远。';
      if (t.key === 'partial_evidence_one_rescue') return '你手里有一块关键拼图，但仓库深处的时间已经被你用掉一截。';
      return '你几乎没有停下取证，仓库深处的敲击声还来得及回应。';
    }

    function outcomeBadge() {
      const hint = narrativeRiskHint();
      return hint ? `<br><br><span class="sys">${hint}</span>` : '';
    }

    nodes.ch4_dock_solo_search_choice = {
      title: '福生仓 · 取证还是救人',
      weather: 3,
      text: () => `你翻进东窗，落在一排木箱后面。<br><br>仓库深处传来很轻的敲击声。另一边的桌上压着蓝封公文，木箱夹层里也许还有货运单。<br><br>一个人行动没有后手。你在这里多停一下，就多接近真相；但深处那几下敲击声不会一直等你。${outcomeBadge()}`,
      choices: [
        {
          text: '🔦 不碰公文和货箱，直奔敲击声开暗门',
          effect: () => {
            E.setFlag('dock_solo_search_committed', true);
            E.setFlag('dock_solo_no_evidence_rush', true);
            E.addClue('仓库暗室', '你没有停下取证，直接循着敲击声找到暗门。');
          },
          goto: () => E.routeSoloDockDeepByHeatDelay()
        },
        {
          text: '📄 只拿蓝封清场指令，马上去暗门',
          effect: () => {
            E.setFlag('dock_solo_search_committed', true);
            E.setFlag('dock_solo_partial_evidence_sweep', true);
            addClearanceEvidence();
          },
          goto: () => E.routeSoloDockDeepByHeatDelay()
        },
        {
          text: '📦 只翻教具箱货运单，马上去暗门',
          effect: () => {
            E.setFlag('dock_solo_search_committed', true);
            E.setFlag('dock_solo_partial_evidence_sweep', true);
            addWaybillEvidence();
          },
          goto: () => E.routeSoloDockDeepByHeatDelay()
        },
        {
          text: '📚 清场指令和教具箱货运单都查清，再去暗门',
          effect: () => {
            E.setFlag('dock_solo_search_committed', true);
            E.setFlag('dock_solo_full_evidence_sweep', true);
            addClearanceEvidence();
            addWaybillEvidence();
          },
          goto: () => E.routeSoloDockDeepByHeatDelay()
        }
      ]
    };

    nodes.ch4_dock_escape_evidence_only = {
      title: '福生仓 · 带证据撤离',
      weather: 5,
      text: () => `码头口的车灯在雾里晃了一下，又很快消失。<br><br>你没有带出沈玉芳，也没有带出苏晚亭。你怀里只有清场指令、货运单、学生证和暗室残留的痕迹。<br><br>这足够证明福生仓不是普通仓库，却不足以把活人送进医院。<br><br>现在能做的不是医院安置，而是趁码头还没完全反应过来，把证据带出去。`,
      choices: [
        { text: '🌫️ 避开码头口车灯，带证据撤出福生仓', goto: 'ch3_wrapup' },
        { text: '🔍 直接回事务所整理证据', goto: 'ch4_conclusion' }
      ]
    };

    function patchEmptyRoomEscape(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__soloEvidenceOnlyEscapePatched) return;
      node.choices = [{ text: '🌫️ 带着完整证据逃出码头', goto: 'ch4_dock_escape_evidence_only' }];
      node.__soloEvidenceOnlyEscapePatched = true;
    }

    patchEmptyRoomEscape('ch4_dock_deep_empty_heat');
    patchEmptyRoomEscape('ch4_dock_empty_after_return');

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__soloNoHospitalPatched) {
      const oldChoices = nodes.ch4_dock_escape_finish.choices;
      nodes.ch4_dock_escape_finish.choices = function (state) {
        if (soloMode() && E.getFlag('solo_outcome_full_evidence_no_rescue')) {
          return nodes.ch4_dock_escape_evidence_only.choices;
        }
        return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      };
      nodes.ch4_dock_escape_finish.__soloNoHospitalPatched = true;
    }

    E.__soloHeatDelayOutcomesPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySoloHeatDelayOutcomes);
})();