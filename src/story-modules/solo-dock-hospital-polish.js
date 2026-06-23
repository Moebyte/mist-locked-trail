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
        || E.getFlag('dock_solo_hard_confront');
    }

    function dockExitBadge() {
      if (typeof E.dockExitRiskTier !== 'function') return '';
      const tier = E.dockExitRiskTier();
      const text = tier.key === 'high' ? '码头已经压不住了。再不走就走不了。' : tier.key === 'mid' ? '局势还能控制，但时间不在你这边。' : '码头暂时安静。你还有机会安全撤离。';
      return `<br><br><span class="sys">${text}</span>`;
    }

    function hospitalBadge() {
      if (typeof E.hospitalOutcomeTier !== 'function') return '';
      const o = E.hospitalOutcomeTier();
      const lines = [];
      if (o.key === 'stable') lines.push('医院里暂时安静。证人被保护得很好。');
      else if (o.key === 'tense') lines.push('走廊里的气氛越来越紧。每个人都在等对方先动。');
      else if (o.key === 'chaotic') lines.push('医院已经失控。有人先动了。');
      else lines.push('医院还在你的掌控里。可夜还长。');
      return `<br><br><span class="sys">${lines.join(' ')}</span>`;
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

    E.__soloHospitalPressurePatched = true;
    // BAKED into hospital-pressure-witness-polish

    E.__soloHospitalControlPatched = true;
    // BAKED into hospital-pressure-witness-polish

    E.__soloWitnessPatched = true;
    // BAKED into hospital-pressure-witness-polish

    if (nodes.ch4_dock_solo_infiltration && !nodes.ch4_dock_solo_infiltration.__soloWindowPatched) {
      nodes.ch4_dock_solo_infiltration.choices = [
        { text: '🔦 独自从东侧窗户翻进去', goto: () => E.routeDockSearchByTime() },
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
        if (!soloMode()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `医院后门的灯很暗。周怀安站在楼梯口，走廊另一头已经有人听见风声赶来。<br><br>你这时才真正感觉到孤身行动的代价：后门没有便衣，巷口没有巡捕，病房外也没有老孙的人。要让证词活到天亮，只能先靠医院本身。${hospitalBadge()}`;
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

    // SOLO 路线医院冲突——老孙不在场
    if (nodes.ch4_hospital_conflict && !nodes.ch4_hospital_conflict.__soloConflictPatched) {
      const oldConflictText = nodes.ch4_hospital_conflict.text;
      const oldConflictChoices = nodes.ch4_hospital_conflict.choices;
      nodes.ch4_hospital_conflict.text = function (state) {
        if (!soloMode()) return typeof oldConflictText === 'function' ? oldConflictText(state) : oldConflictText;
        const suLine = E.getFlag('rescued_su')
          ? '苏晚亭躺在病房里，隔着一扇门，你能听见她很轻的咳声。'
          : '苏晚亭仍然不在这里，沈玉芳手里攥着那张学生证，像攥着一块会割手的玻璃。';
        return `医院走廊很窄，消毒水的味道压住了码头带来的潮腥。<br><br>${suLine}<br><br>周怀安第一个开口，声音压得很低：<span class="sys">"先别问了。她们刚逃出来。先让她们睡一觉。"</span><br><br>沈玉芳坐在长椅上，突然抬头：<span class="sys">"你们都在说傅启元，可陆念薇呢？她不是清白的。她知道箱子里是什么，也知道陈老师会死。"</span><br><br>走廊里没有老孙的人。你只能靠自己决定下一步。`;
      };
      nodes.ch4_hospital_conflict.choices = function (state) {
        if (!soloMode()) return typeof oldConflictChoices === 'function' ? oldConflictChoices(state) : (Array.isArray(oldConflictChoices) ? oldConflictChoices : []);
        return [
          { text: '🛏️ 先分开保护证人，任何审问等天亮以后', effect: () => E.setFlag('v07_choice_protect_witnesses', true), goto: 'ch4_hospital_protect_witnesses' },
          { text: '🕯️ 逼陆念薇现身，让三条线当面对质', effect: () => E.setFlag('v07_choice_draw_lu', true), goto: 'ch4_lu_confrontation' },
          { text: '🔙 带着证词回去整理结案材料', goto: 'ch4_conclusion' }
        ];
      };
      nodes.ch4_hospital_conflict.__soloConflictPatched = true;
    }

    E.__soloDockHospitalPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySoloDockHospitalPolish);
})();