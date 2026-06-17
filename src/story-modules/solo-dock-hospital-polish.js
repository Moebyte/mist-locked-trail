// ===== 孤身码头线补全 =====
// 目标：solo 不只是“无支援数值”，而是一条独立路线。
// 潜入：东窗后路没人看，需要自己处理巡灯。
// 撤退：没有便衣护侧巷，也没有老孙卡车道，只能水边绕行、临时遮挡或引开视线。
// 医院：没有人手守后门，只能靠护士/病房/医生先稳住证人。

(function installSoloDockHospitalPolish() {
  function applySoloDockHospitalPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__soloDockHospitalPolishPatched) return;

    function soloMode() {
      return E.getFlag('dock_solo_entry')
        || E.getFlag('dock_solo_waterline_escape')
        || E.getFlag('dock_solo_crate_screen')
        || E.getFlag('dock_solo_decoy_escape')
        || (typeof E.dockSupportMode === 'function' && E.dockSupportMode() === 'solo');
    }

    function dockExitBadge() {
      if (typeof E.dockExitRiskTier !== 'function') return '';
      const tier = E.dockExitRiskTier();
      return `<br><br><span class="sys">码头局势：${tier.label} · tension ${E.dockExitTensionScore()} / control ${E.dockExitControlScore()} · crisis ${E.dockExitCrisisScore()}</span>`;
    }

    function hospitalBadge() {
      if (typeof E.hospitalOutcomeTier !== 'function') return '';
      const o = E.hospitalOutcomeTier();
      const t = typeof E.truthCompletenessTier === 'function' ? E.truthCompletenessTier() : { label: '未知', score: 0 };
      return `<br><br><span class="sys">医院状态：${o.label} · pressure ${E.hospitalPressureScore()} / control ${E.hospitalControlScore()} · witness ${E.witnessStabilityScore()}<br>真相完整度：${t.label} · ${t.score}</span>`;
    }

    if (typeof E.dockExposureScore === 'function' && !E.__soloDockExposurePatched) {
      const oldExposure = E.dockExposureScore.bind(E);
      E.dockExposureScore = function () {
        let score = oldExposure();
        if (this.getFlag('dock_solo_window_screen')) score += 1;
        if (this.getFlag('dock_solo_forced_window')) score += 2;
        return Math.max(0, Math.min(8, score));
      };
      E.__soloDockExposurePatched = true;
    }

    if (typeof E.dockDelayScore === 'function' && !E.__soloDockDelayPatched) {
      const oldDelay = E.dockDelayScore.bind(E);
      E.dockDelayScore = function () {
        let score = oldDelay();
        if (this.getFlag('dock_solo_waited_patrol')) score += 1;
        return Math.max(0, Math.min(8, score));
      };
      E.__soloDockDelayPatched = true;
    }

    if (typeof E.dockExitTensionScore === 'function' && !E.__soloDockExitTensionPatched) {
      const oldTension = E.dockExitTensionScore.bind(E);
      E.dockExitTensionScore = function () {
        let score = oldTension();
        if (this.getFlag('dock_solo_crate_screen')) score += 1;
        if (this.getFlag('dock_solo_decoy_escape')) score += 2;
        if (this.getFlag('dock_solo_hard_confront')) score += 2;
        return Math.max(0, Math.min(12, score));
      };
      E.__soloDockExitTensionPatched = true;
    }

    if (typeof E.hospitalPressureScore === 'function' && !E.__soloHospitalPressurePatched) {
      const oldPressure = E.hospitalPressureScore.bind(E);
      E.hospitalPressureScore = function () {
        let score = oldPressure();
        if (this.getFlag('dock_solo_waterline_escape')) score += 1;
        if (this.getFlag('dock_solo_crate_screen')) score += 1;
        if (this.getFlag('dock_solo_decoy_escape')) score += 2;
        if (this.getFlag('hospital_triage_solo_lock_backdoor')) score -= 1;
        if (this.getFlag('hospital_triage_solo_no_guard')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__soloHospitalPressurePatched = true;
    }

    if (typeof E.hospitalControlScore === 'function' && !E.__soloHospitalControlPatched) {
      const oldControl = E.hospitalControlScore.bind(E);
      E.hospitalControlScore = function () {
        let score = oldControl();
        if (this.getFlag('hospital_triage_solo_lock_backdoor')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__soloHospitalControlPatched = true;
    }

    if (typeof E.witnessStabilityScore === 'function' && !E.__soloWitnessPatched) {
      const oldWitness = E.witnessStabilityScore.bind(E);
      E.witnessStabilityScore = function () {
        let score = oldWitness();
        if (this.getFlag('dock_solo_decoy_escape')) score -= 1;
        if (this.getFlag('hospital_triage_solo_lock_backdoor')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__soloWitnessPatched = true;
    }

    if (nodes.ch4_dock_solo_infiltration && !nodes.ch4_dock_solo_infiltration.__soloWindowPatched) {
      nodes.ch4_dock_solo_infiltration.choices = [
        { text: '🔦 贴近东窗，先看清守卫巡灯', goto: 'ch4_dock_solo_window_crisis' }
      ];
      nodes.ch4_dock_solo_infiltration.__soloWindowPatched = true;
    }

    nodes.ch4_dock_solo_window_crisis = {
      title: '福生仓 · 东窗巡灯',
      weather: 3,
      text: () => `你刚攀上东侧窗框，仓库后门的手电光就扫了过来。<br><br>如果有人在外面替你看着，你现在只要翻进去就行。可你是一个人来的，窗下没有暗号，也没有人替你拖住守卫。<br><br>你只能自己决定：多等几秒，还是冒一点声响。${typeof E.dockHeatTier === 'function' ? `<br><br><span class="sys">潜入风险：${E.dockHeatTier().label} · 暴露 ${E.dockExposureScore()} / 拖延 ${E.dockDelayScore()}</span>` : ''}`,
      choices: [
        {
          text: '🤫 压低身子，等巡灯从窗框上移开',
          effect: () => E.setFlag('dock_solo_waited_patrol', true),
          goto: () => E.routeDockSearchByTime()
        },
        {
          text: '🧺 扯一块油布挡住窗影，马上翻进去',
          effect: () => E.setFlag('dock_solo_window_screen', true),
          goto: () => E.routeDockSearchByTime()
        },
        {
          text: '⚠️ 不停下来，趁装车声直接翻进仓库',
          effect: () => E.setFlag('dock_solo_forced_window', true),
          goto: () => E.routeDockSearchByTime()
        }
      ]
    };

    if (nodes.ch4_dock_exit_assess && !nodes.ch4_dock_exit_assess.__soloExitPatched) {
      const oldChoices = nodes.ch4_dock_exit_assess.choices;
      nodes.ch4_dock_exit_assess.choices = function (state) {
        if (!soloMode()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return [
          {
            text: '🌫️ 沿水边栈道绕开黑车，先把人带走',
            effect: () => {
              E.setFlag('dock_solo_waterline_escape', true);
              E.addClue('水边栈道撤离', '你没有走车灯照住的码头口，而是沿水边栈道绕开黑车，把人先带离福生仓。');
            },
            goto: 'ch4_dock_escape_finish'
          },
          {
            text: '🧱 推倒空木箱挡住车灯，争出几步空隙',
            effect: () => {
              E.setFlag('dock_solo_crate_screen', true);
              E.addHeat(1, '空木箱倒下挡住车灯，也让码头口的目光都转了过来。');
              E.addClue('木箱遮灯撤离', '你用空木箱挡住黑车车灯，争出几步撤离空隙，但动静也引来码头注意。');
            },
            goto: 'ch4_dock_escape_finish'
          },
          {
            text: '⚠️ 让证人先藏进货车阴影，自己引开视线',
            effect: () => {
              E.setFlag('dock_solo_decoy_escape', true);
              E.addHeat(1, '你把视线引到自己身上，傅启元的人开始追着你的脚步移动。');
              E.addClue('孤身引开视线', '你让证人先藏进货车阴影，自己引开码头口视线。这给撤离争取了时间，也让后续医院压力更重。');
            },
            goto: 'ch4_dock_escape_finish'
          },
          {
            text: '⚠️ 站到车灯前，当场拿出货运单和清场指令',
            effect: () => {
              E.setFlag('dock_solo_hard_confront', true);
              E.setFlag('dock_fast_confront_hard_evidence', true);
              E.setFlag('dock_confront_fu', true);
              E.addHeat(4, '你孤身站到车灯前亮出证据，傅启元被逼到死角。');
              E.addClue('孤身码头硬对峙', '没有便衣或老孙压住出口时，你当场亮出货运单和清场指令，码头危机值迅速超过灭口阈值。');
            },
            goto: () => E.fuWillSilenceAtDock() ? 'end_dock_silenced' : 'ch4_fu_confront'
          }
        ];
      };
      nodes.ch4_dock_exit_assess.__soloExitPatched = true;
    }

    if (nodes.ch4_hospital_triage && !nodes.ch4_hospital_triage.__soloTriagePatched) {
      const oldText = nodes.ch4_hospital_triage.text;
      const oldChoices = nodes.ch4_hospital_triage.choices;
      nodes.ch4_hospital_triage.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!soloMode()) return base;
        return `${base}<br><br>你这时才真正感觉到孤身行动的代价：后门没有便衣，巷口没有巡捕，病房外也没有老孙的人。要让证词活到天亮，只能先靠医院本身。${hospitalBadge()}`;
      };
      nodes.ch4_hospital_triage.choices = function (state) {
        if (!soloMode()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return [
          {
            text: '🛏️ 先把证人送进病房，压低声音等医生',
            effect: () => {
              E.setFlag('hospital_triage_settle_witness', true);
              E.addClue('医院后门安置', '你没有立刻审问证人，而是先把人送进病房，让她们离开走廊视线。');
            },
            goto: 'ch4_hospital_conflict'
          },
          {
            text: '🚪 托值夜护士锁住后门，先别让外人进来',
            effect: () => {
              E.setFlag('hospital_triage_solo_lock_backdoor', true);
              E.addClue('护士锁住医院后门', '你没有人手守后门，只能请值夜护士先锁门，把病房和走廊隔开。');
            },
            goto: 'ch4_hospital_conflict'
          },
          {
            text: '⚠️ 让周怀安立刻进来认人',
            effect: () => {
              E.setFlag('hospital_triage_zhou_early', true);
              E.addHeat(1, '周怀安过早进入病房，证人情绪被重新牵动。');
            },
            goto: 'ch4_hospital_conflict'
          },
          {
            text: '🚶 直接去走廊面对所有人的争执',
            effect: () => {
              E.setFlag('hospital_triage_direct_corridor', true);
              E.setFlag('hospital_triage_solo_no_guard', true);
            },
            goto: 'ch4_hospital_conflict'
          }
        ];
      };
      nodes.ch4_hospital_triage.__soloTriagePatched = true;
    }

    E.__soloDockHospitalPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySoloDockHospitalPolish);
})();
