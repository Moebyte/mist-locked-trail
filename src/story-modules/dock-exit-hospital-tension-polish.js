// ===== 码头逃离 / 医院前置张力系统 =====
// 目标：潜入结束后，码头不再继续使用 heat/delay，而改用 tension/control。
// tension：傅启元被逼急、现场火药味、公董局插手。
// control：老孙人手、封锁线、撤离路线、证据掌控。
// 规则：一个便衣时当面对峙并亮核心证据，会大幅提高 tension；若 crisis > 5，则由分数机制触发灭口。
// 节奏：先进入“黑车拦路”判断节点，再选择借雾撤离、老孙压制或硬质问。

(function installDockExitHospitalTensionPolish() {
  function applyDockExitHospitalTensionPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockExitHospitalTensionPolishPatched) return;

    function fastSupportOnly() {
      return E.getFlag('sun_fast_support')
        && !E.getFlag('sun_full_support')
        && !E.getFlag('sun_wait_support')
        && !E.getFlag('dock_full_support_entry')
        && !(E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function fullSupportAtDock() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_sun_pressed_fu')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function hardDockEvidenceReady() {
      return E.hasItem('清场指令')
        || E.hasItem('光华货运单')
        || E.hasClue('公董局公文纸')
        || E.hasClue('教具箱走私')
        || E.getFlag('fu_waybill_exposed')
        || E.getFlag('fu_clearance_exposed');
    }

    E.dockExitControlScore = function () {
      let score = 0;
      if (this.getFlag('sun_fast_support') || this.getFlag('sun_fast_cover_escape')) score += 1;
      if (this.getFlag('sun_support_cover_escape')) score += 2;
      if (fullSupportAtDock()) score += 4;
      if (this.getFlag('dock_sun_outer_quiet') || this.getFlag('dock_sun_block_truck_lane')) score += 1;
      if (this.getFlag('dock_exit_side_lane')) score += 1;
      if (this.getFlag('dock_sun_exit_lane_control')) score += 2;
      if (this.getFlag('dock_sun_pressed_fu')) score += 2;
      if (this.getFlag('dock_blockade_record')) score += 1;
      if (this.getFlag('v07_choice_hold_blockade')) score += 1;
      if (this.getFlag('dock_escaped_during_sun_standoff')) score -= 1;
      return Math.max(0, Math.min(10, score));
    };

    E.dockExitTensionScore = function () {
      let score = 0;
      if (this.getFlag('dock_fast_confront_hard_evidence')) score += 8;
      if (this.getFlag('dock_confront_fu')) score += 3;
      if (this.getFlag('dock_sun_pressed_fu')) score += 2;
      if (this.getFlag('dock_sun_exit_close_pressure')) score += 2;
      if (this.getFlag('dock_escaped_during_sun_standoff')) score += 2;
      if (this.getFlag('dock_sun_close_pressure')) score += 2;
      if (this.getFlag('dock_broke_lock_no_tool') || this.getFlag('dock_guard_chase_no_hide')) score += 1;
      if (this.getFlag('found_su_at_dock') || this.getFlag('rescued_su')) score += 1; // 双证人在场，傅启元更急。
      return Math.max(0, Math.min(12, score));
    };

    E.dockExitCrisisScore = function () {
      return this.dockExitTensionScore() - this.dockExitControlScore();
    };

    E.dockExitRiskTier = function () {
      const crisis = this.dockExitCrisisScore();
      if (crisis > 5) return { key: 'lethal', label: '灭口边缘', crisis };
      if (crisis >= 3) return { key: 'unstable', label: '失控边缘', crisis };
      if (crisis >= 1) return { key: 'tense', label: '紧张可控', crisis };
      return { key: 'controlled', label: '被压住', crisis };
    };

    E.fuWillSilenceAtDock = function () {
      return this.dockExitRiskTier().key === 'lethal';
    };

    function markFastHardConfront() {
      E.setFlag('dock_fast_confront_hard_evidence', true);
      E.setFlag('dock_confront_fu', true);
      E.addHeat(4, '你在人手不足时当场亮出关键证据，傅启元被逼到死角。');
      E.addClue('码头硬对峙失败', '只有一个便衣护住后路时，你当场亮出货运单和清场指令，码头危机值超过灭口阈值。');
    }

    function markFullPressFu() {
      E.setFlag('dock_sun_pressed_fu', true);
      E.setFlag('dock_confront_fu', true);
      E.addClue('码头正面压制傅启元', '老孙带队压住码头局面，你得以当场质问傅启元并出示货运单、清场指令。');
    }

    function dockExitBadge() {
      const tier = E.dockExitRiskTier();
      const text = tier.key === 'high' ? '码头已经压不住了。再不走就走不了。' : tier.key === 'mid' ? '局势还能控制，但时间不在你这边。' : '码头暂时安静。你还有机会安全撤离。';
      return `<br><br><span class="sys">${text}</span>`;
    }

    if (nodes.ch4_dock_escape && !nodes.ch4_dock_escape.__exitTensionPatched) {
      const oldText = nodes.ch4_dock_escape.text;
      nodes.ch4_dock_escape.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br>黑车没有熄火。车灯切开雾气，正好照住仓库门口。你能看见傅启元身后的司机，也能看见码头另一头有人影停了一下。<br><br>现在不是单纯“走出去”的问题，而是先判断：谁护证人，谁压出口，谁会被逼急。`;
      };
      nodes.ch4_dock_escape.choices = [
        {
          text: '🚘 先判断黑车、巷口和码头出口的位置',
          effect: () => E.setFlag('dock_exit_black_car_assessed', true),
          goto: 'ch4_dock_exit_assess'
        }
      ];
      nodes.ch4_dock_escape.__exitTensionPatched = true;
    }

    nodes.ch4_dock_exit_assess = {
      title: '码头口 · 黑车拦路',
      weather: 4,
      text: () => {
        const witnessText = E.getFlag('found_su_at_dock')
          ? '你身边是沈玉芳，背后还有半昏迷的苏晚亭。两个人都活着，也意味着傅启元此刻更不能让她们离开码头。'
          : '你身边只有沈玉芳。她还站不稳，却已经足够让傅启元不安。';
        const supportText = fastSupportOnly()
          ? '老孙派来的便衣在侧巷口压低帽檐。他能护后路，但压不住一辆黑车和傅启元身后的整张网。'
          : fullSupportAtDock()
            ? '老孙的人在雾里散开。车道、巷口、仓门都有人影，但人一多，公董局也更容易闻到味道。'
            : '你没有可靠支援。雾能遮住几步路，却遮不住傅启元的车灯。';
        return `${witnessText}<br><br>${supportText}<br><br>傅启元没有急着上前。他只是站在车灯后面，像在等你先犯错。${dockExitBadge()}`;
      },
      choices: () => {
        if (fastSupportOnly()) {
          return [
            {
              text: '🚓 让便衣护住侧巷，借雾把人先带走',
              effect: () => {
                E.setFlag('sun_fast_cover_escape', true);
                E.setFlag('dock_exit_side_lane', true);
                E.addClue('便衣掩护撤离', '老孙派来的便衣没有正面扣住傅启元，只护住侧巷和后路，帮你先把人带走。');
              },
              goto: 'ch4_dock_escape_finish'
            },
            {
              text: '⚠️ 站到车灯前，当场拿出货运单和清场指令',
              effect: markFastHardConfront,
              goto: () => 'end_dock_silenced'
            }
          ];
        }

        if (fullSupportAtDock()) {
          return [
            {
              text: '🚧 让老孙先卡住车道和巷口，再正面压傅启元',
              effect: () => {
                E.setFlag('dock_sun_exit_lane_control', true);
                markFullPressFu();
              },
              goto: () => E.fuWillSilenceAtDock() ? 'end_dock_silenced' : 'ch4_fu_confront'
            },
            {
              text: '🚓 让老孙贴近黑车，随时拔枪接应',
              effect: () => {
                E.setFlag('dock_sun_exit_close_pressure', true);
                markFullPressFu();
                E.addHeat(1, '老孙贴近黑车，码头火药味继续上升。');
              },
              goto: () => E.fuWillSilenceAtDock() ? 'end_dock_silenced' : 'ch4_fu_confront'
            },
            {
              text: '🌫️ 趁老孙和公董局纠缠，先带人撤离',
              effect: () => {
                E.setFlag('dock_escaped_during_sun_standoff', true);
                E.addClue('公董局干预码头', '老孙试图压住傅启元时，公董局的人出面阻拦。你趁乱先把人带走，但正式查明真相会更困难。');
                E.addHeat(1, '码头冲突被公董局察觉，后续公开指控难度上升。');
              },
              goto: 'ch4_dock_escape_finish'
            }
          ];
        }

        return [
          { text: '🌫️ 借雾绕开汽车，先把人带走', effect: () => E.setFlag('dock_exit_side_lane', true), goto: 'ch4_dock_escape_finish' },
          {
            text: '⚠️ 当场质问傅启元',
            effect: () => {
              E.setFlag('dock_confront_fu', true);
              E.addHeat(2, '你当场质问傅启元，局势变得危险。');
            },
            goto: () => E.fuWillSilenceAtDock() ? 'end_dock_silenced' : (supportPresent() ? 'ch4_fu_confront' : 'end_dock_silenced')
          }
        ];
      }
    };

    function supportPresent() {
      return E.getFlag('sun_support_available')
        || E.getFlag('sun_fast_support')
        || E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('sun_support_in_action');
    }

    if (nodes.ch4_fu_confront && !nodes.ch4_fu_confront.__exitTensionTextPatched) {
      const oldEffect = nodes.ch4_fu_confront.effect;
      nodes.ch4_fu_confront.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (fullSupportAtDock()) E.setFlag('fu_confront_with_full_support', true);
      };
      nodes.ch4_fu_confront.text = () => {
        if (fullSupportAtDock()) {
          return `你没有绕开那辆黑色汽车。<br><br>老孙带着人从雾里压出来，没拔枪，却把码头两头都封住了。<br><br>你把清场指令、光华货运单和蓝封纸角一件件摆在车灯前。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br><span class="sys">“傅秘书，今晚这两个人，得先跟我们走。”</span>老孙说。<br><br>几名公董局的人很快赶到，试图用“越权办案”压住老孙。但老孙没有退。<br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是因为码头两头都有人，他暂时不敢开枪。${dockExitBadge()}`;
        }
        return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br>他让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。${dockExitBadge()}`;
      };
      nodes.ch4_fu_confront.choices = [{ text: '🚕 趁傅启元让开的半步，立刻送她们离开码头', goto: 'ch4_dock_escape_finish' }];
      nodes.ch4_fu_confront.__exitTensionTextPatched = true;
    }

    if (nodes.end_dock_silenced && !nodes.end_dock_silenced.__exitTensionReasonPatched) {
      nodes.end_dock_silenced.effect = () => {
        E.addClue('码头灭口', '码头危机值超过灭口阈值，傅启元被逼急后选择灭口，证人和证据线断裂。');
      };
      nodes.end_dock_silenced.__exitTensionReasonPatched = true;
    }

    E.__dockExitHospitalTensionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockExitHospitalTensionPolish);
})();
