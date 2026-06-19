// ===== 医院 pressure / control / witness 机制 =====
// 目标：逃离码头后，医院线不再只是固定剧情，而是根据码头危机、证人数量、医院选择形成状态。
// 注意：医院状态和真相完整度分开。
// 双救 + 紧张医院：逻辑成立，代表人救出来但医院压力大，证词需要保护。
// 单救 + 可控医院：逻辑成立，代表医院秩序可控，但苏晚亭本人证词缺失，真相完整度有上限。

(function installHospitalPressureWitnessPolish() {
  function applyHospitalPressureWitnessPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalPressureWitnessPolishPatched) return;

    function fullSupportAtDock() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_sun_pressed_fu')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function fastSupportOnly() {
      return E.getFlag('sun_fast_support')
        && !E.getFlag('sun_full_support')
        && !E.getFlag('sun_wait_support')
        && !E.getFlag('dock_full_support_entry')
        && !(E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function hasExplicitDockSupport() {
      return fullSupportAtDock()
        || fastSupportOnly()
        || E.getFlag('sun_support_available')
        || E.getFlag('sun_fast_cover_escape')
        || E.getFlag('sun_support_cover_escape');
    }

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    E.hospitalWitnessProfile = function () {
      const yufang = this.getFlag('rescued_yufang') || this.getFlag('found_yufang');
      const su = this.getFlag('rescued_su') || this.getFlag('found_su_at_dock');
      return {
        yufang,
        su,
        count: (yufang ? 1 : 0) + (su ? 1 : 0),
        label: su && yufang ? '双证人' : yufang ? '单证人' : '证人缺席'
      };
    };

    E.hospitalPressureScore = function () {
      const wp = this.hospitalWitnessProfile();
      let score = 0;
      if (typeof this.dockExitCrisisScore === 'function') score += Math.max(0, Math.min(4, this.dockExitCrisisScore()));
      if (wp.count === 2) score += 2;
      else if (wp.count === 1) score += 1;
      if (this.getFlag('dock_confront_fu')) score += 1;
      if (this.getFlag('dock_sun_pressed_fu')) score += 1;
      if (this.getFlag('dock_escaped_during_sun_standoff')) score += 2;
      if (this.getFlag('hospital_early_lu')) score += 2;
      if (this.getFlag('hospital_interrogate_yufang')) score += 1;
      if (this.getFlag('hospital_force_su_identify')) score += 3;
      if (this.getFlag('v07_choice_blockade_after_interference')) score += 1;
      if (this.getFlag('hospital_protect_witnesses')) score -= 1;
      if (this.getFlag('hospital_doctor_record')) score -= 1;
      return Math.max(0, Math.min(10, score));
    };

    E.hospitalControlScore = function () {
      let score = 0;
      if (fullSupportAtDock()) score += 3;
      else if (fastSupportOnly() || this.getFlag('sun_fast_cover_escape')) score += 1;
      if (this.getFlag('hospital_protect_witnesses')) score += 2;
      if (this.getFlag('hospital_separate_witnesses')) score += 1;
      if (this.getFlag('hospital_doctor_record')) score += 2;
      if (this.getFlag('v07_choice_hold_blockade')) score += 2;
      if (this.getFlag('v07_choice_late_blockade')) score += 1;
      if (this.getFlag('v07_choice_blockade_after_interference')) score += 1;
      if (this.getFlag('v07_lu_to_sun')) score += 2;
      if (this.getFlag('v07_lu_statement')) score += 1;
      if (hasThing('清场指令') && hasThing('光华货运单')) score += 1;
      return Math.max(0, Math.min(10, score));
    };

    E.witnessStabilityScore = function () {
      const wp = this.hospitalWitnessProfile();
      let score = 0;
      if (wp.yufang) score += 3;
      if (wp.su) score += 2;
      if (this.getFlag('dock_confront_fu')) score -= 1;
      if (typeof this.dockExitRiskTier === 'function') {
        const tier = this.dockExitRiskTier().key;
        if (tier === 'unstable') score -= 1;
        if (tier === 'lethal') score -= 4;
      }
      if (this.getFlag('hospital_protect_witnesses')) score += 2;
      if (this.getFlag('hospital_separate_witnesses')) score += 1;
      if (this.getFlag('hospital_doctor_record')) score += 2;
      if (this.getFlag('hospital_interrogate_yufang')) score -= 1;
      if (this.getFlag('hospital_early_lu')) score -= 1;
      if (this.getFlag('hospital_force_su_identify')) score -= 3;
      return Math.max(0, Math.min(10, score));
    };

    E.hospitalCrisisScore = function () {
      return this.hospitalPressureScore() - this.hospitalControlScore();
    };

    E.hospitalOutcomeTier = function () {
      const crisis = this.hospitalCrisisScore();
      const witness = this.witnessStabilityScore();
      if (crisis <= 0 && witness >= 6) return { key: 'stable', label: '稳定医院线', crisis, witness };
      if (crisis <= 2 && witness >= 4) return { key: 'controlled', label: '可控医院线', crisis, witness };
      if (crisis <= 4 && witness >= 3) return { key: 'tense', label: '紧张医院线', crisis, witness };
      return { key: 'unstable', label: '医院失控', crisis, witness };
    };

    E.truthCompletenessTier = function () {
      const wp = this.hospitalWitnessProfile();
      let score = 0;
      if (wp.yufang) score += 2;
      if (wp.su) score += 2;
      if (hasThing('清场指令') || hasThing('公董局公文纸') || this.getFlag('fu_clearance_exposed')) score += 1;
      if (hasThing('光华货运单') || hasThing('教具箱走私') || this.getFlag('fu_waybill_exposed')) score += 1;
      if (this.getFlag('hospital_doctor_record')) score += 1;
      if (this.getFlag('v07_lu_to_sun')) score += 2;
      else if (this.getFlag('v07_lu_statement')) score += 1;
      if (!wp.su) score = Math.min(score, 6); // 单救路线的上限：医院再稳，也缺苏晚亭本人证词。
      if (score >= 8) return { key: 'complete', label: '真相完整', score };
      if (score >= 6) return { key: 'solid', label: '真相较完整', score };
      if (score >= 4) return { key: 'partial', label: '真相残缺但可结案', score };
      return { key: 'weak', label: '证据链薄弱', score };
    };

    function hospitalBadge() {
      const o = E.hospitalOutcomeTier();
      const lines = [];
      if (o.key === 'stable') lines.push('医院里暂时安静。证人被保护得很好，你还有时间整理思路。');
      else if (o.key === 'controlled') lines.push('走廊里还没乱。你能听见护士们的脚步声，也能听见雨打在玻璃上的声音。');
      else if (o.key === 'tense') lines.push('走廊里的气氛越来越紧。每个人都在等对方先动。');
      else lines.push('医院已经压不住了。脚步声、低语声和电话铃声挤在一起。');
      return `<br><br><span class="sys">${lines.join(' ')}</span>`;
    }

    function shouldShowImmediateSuIdentify(wp) {
      if (!wp.su) return false;
      const tier = typeof E.hospitalOutcomeTier === 'function' ? E.hospitalOutcomeTier() : { key: 'tense' };
      if (tier.key === 'stable') return false;
      if (E.getFlag('hospital_triage_settle_witness') || E.getFlag('hospital_triage_backdoor_guard')) return false;
      if (E.getFlag('hospital_protect_witnesses') || E.getFlag('hospital_separate_witnesses')) return false;
      return true;
    }

    function dockChoice() {
      if (E.getFlag('dock_sun_pressed_fu')) {
        return {
          text: '🚓 让老孙守住码头封锁线，别让傅启元擦痕迹',
          effect: () => {
            E.setFlag('v07_choice_hold_blockade', true);
            E.setFlag('v07_pressed_fu_network', true);
            E.addClue('老孙守住码头封锁线', '老孙已经在码头正面压过傅启元，此时继续守住封锁线，能保住更多现场证据。');
          },
          goto: 'ch4_hospital_hold_blockade'
        };
      }
      if (E.getFlag('dock_escaped_during_sun_standoff')) {
        return {
          text: '⚠️ 公董局已经插手，让老孙回头补封码头',
          effect: () => {
            E.setFlag('v07_choice_blockade_after_interference', true);
            E.addClue('补封码头受阻', '你们在码头趁乱撤离后，公董局的人已经插手，老孙再去封码头会遇到正式阻力。');
            E.addHeat(1, '公董局已经介入，补封码头会让对方更快统一口径。');
          },
          goto: 'ch4_hospital_blockade_blocked'
        };
      }
      if (E.getFlag('sun_fast_cover_escape') || fastSupportOnly()) {
        return {
          text: '📞 让老孙连夜补人手去封码头',
          effect: () => {
            E.setFlag('v07_choice_late_blockade', true);
            E.addClue('迟一步封码头', '你们只有一个便衣护送撤离，老孙必须临时补人手，码头封锁会迟一步。');
            E.addHeat(1, '补人手需要时间，傅启元可能已经开始清理现场。');
          },
          goto: 'ch4_hospital_late_blockade'
        };
      }
      if (!hasExplicitDockSupport() && typeof E.dockSupportMode === 'function' && E.dockSupportMode() === 'solo') {
        return {
          text: '🚓 让老孙立刻封码头，趁现场还没被清干净',
          effect: () => {
            E.setFlag('v07_choice_pressure_fu', true);
            E.setFlag('v07_choice_solo_call_sun_late', true);
            E.addClue('迟召老孙封码头', '你在医院才让老孙去封码头。命令能传出去，但这不是码头现场已经压住的封锁线。');
          },
          goto: 'ch4_lu_confrontation'
        };
      }
      return {
        text: '🚓 让老孙立刻封码头，趁现场还没被清干净',
        effect: () => E.setFlag('v07_choice_pressure_fu', true),
        goto: 'ch4_hospital_pressure_fu'
      };
    }

    if (nodes.ch4_hospital_conflict && !nodes.ch4_hospital_conflict.__pressureWitnessPatched) {
      const oldText = nodes.ch4_hospital_conflict.text;
      nodes.ch4_hospital_conflict.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${hospitalBadge()}`;
      };
      nodes.ch4_hospital_conflict.choices = function () {
        const wp = E.hospitalWitnessProfile();
        const opts = [
          {
            text: '🛏️ 先分开保护证人，任何追问等天亮以后',
            effect: () => {
              E.setFlag('hospital_protect_witnesses', true);
              E.setFlag('hospital_separate_witnesses', true);
            },
            goto: 'ch4_hospital_protect_witnesses'
          },
          {
            text: '🩺 先让医生写下伤情记录和关押痕迹',
            effect: () => {
              E.setFlag('hospital_doctor_record', true);
              E.addClue('医院伤情记录', '教会医院医生记录了沈玉芳与苏晚亭的伤情和长期拘禁痕迹。');
            },
            goto: 'ch4_hospital_doctor_record'
          },
          dockChoice(),
          {
            text: '🕯️ 请陆念薇出来，把她知道的说清楚',
            effect: () => {
              E.setFlag('hospital_early_lu', true);
              E.setFlag('v07_choice_draw_lu', true);
            },
            goto: 'ch4_lu_confrontation'
          }
        ];
        if (shouldShowImmediateSuIdentify(wp)) {
          opts.splice(3, 0, {
            text: '⚠️ 苏晚亭刚醒，还是立刻问她认不认得车里的人',
            effect: () => E.setFlag('hospital_force_su_identify', true),
            goto: 'ch4_hospital_su_identify'
          });
        }
        return opts;
      };
      nodes.ch4_hospital_conflict.__pressureWitnessPatched = true;
    }

    nodes.ch4_hospital_doctor_record = {
      title: '教会医院 · 伤情记录',
      weather: 3,
      text: () => `医生把病房门半掩上。<br><br>他没有问案子，只问伤口、失温、惊厥和长期拘禁反应。你第一次觉得，有些纸不是用来证明谁有罪，而是证明一个人确实从黑暗里出来过。<br><br>${hospitalBadge()}`,
      choices: [{ text: '🕯️ 拿着医生记录，去见陆念薇', goto: 'ch4_lu_confrontation' }]
    };

    nodes.ch4_hospital_su_identify = {
      title: '教会医院 · 过早辨认',
      weather: 3,
      effect: () => E.setFlag('hospital_force_su_identify', true),
      text: () => `你推开病房门时，苏晚亭刚刚醒。<br><br>她看见门口的人影，手指猛地抓住床单。你问她认不认得傅启元，问她见没见过陆念薇，问她还记不记得福生仓的门。<br><br>每问一句，她的呼吸就乱一分。沈玉芳站在旁边，脸色比走廊的墙还白。<br><br>你得到了几个破碎的词，却把她刚刚恢复的一点信任又推回暗处。${hospitalBadge()}`,
      choices: [{ text: '🛏️ 先停下，重新保护证人', effect: () => E.setFlag('hospital_protect_witnesses', true), goto: 'ch4_hospital_protect_witnesses' }]
    };

    E.__hospitalPressureWitnessPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalPressureWitnessPolish);
})();
