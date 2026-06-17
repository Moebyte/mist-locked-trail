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
      const t = E.truthCompletenessTier();
      const lines = [];
      if (o.key === 'stable') lines.push('医院里暂时安静。证人被保护得很好，你还有时间整理思路。');
      else if (o.key === 'stable') lines.push('走廊里还没乱。你能听见护士们的脚步声，但没有傅启元的气味。');
      else if (o.key === 'tense') lines.push('走廊里的气氛越来越紧。每个人都在等对方先动。');
      else if (o.key === 'chaotic') lines.push('医院已经失控。有人先动了。你现在不是在救人，是在收尾。');
      else lines.push('医院还在你的掌控里。可夜还长。');
      return `<br><br><span class="sys">${lines.join(' ')}</span>`;
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
          text: '⚠️ 让老孙补封码头，但公董局已经插手',
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
      return {
        text: '🚓 让老孙立刻封码头，趁傅启元还没擦干净',
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
            text: '🛏️ 先分开保护证人，任何审问等天亮以后',
            effect: () => {
              E.setFlag('hospital_protect_witnesses', true);
              E.setFlag('hospital_separate_witnesses', true);
            },
            goto: 'ch4_hospital_protect_witnesses'
          },
          {
            text: '🩺 先让医生做伤情记录和镇静处理',
            effect: () => {
              E.setFlag('hospital_doctor_record', true);
              E.addClue('医院伤情记录', '教会医院医生记录了沈玉芳与苏晚亭的伤情和长期拘禁痕迹。');
            },
            goto: 'ch4_hospital_doctor_record'
          },
          dockChoice(),
          {
            text: '🕯️ 立刻逼陆念薇现身，让三条线当面对质',
            effect: () => {
              E.setFlag('hospital_early_lu', true);
              E.setFlag('v07_choice_draw_lu', true);
            },
            goto: 'ch4_lu_confrontation'
          }
        ];
        if (wp.su) {
          opts.splice(3, 0, {
            text: '⚠️ 让苏晚亭立刻指认傅启元',
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
      text: () => `医生把病房门关上，先检查沈玉芳手腕上的绳痕，又让护士替苏晚亭换下被雨水泡硬的外衣。<br><br>他没有多问，只在病历纸上写下“长期拘禁”“失温”“外伤”“惊厥后虚脱”。<br><br>这不是口供，却比口供更难被傅启元轻易抹掉。${hospitalBadge()}`,
      choices: [
        { text: '🚪 离开病房，去医院走廊', effect: () => { E.setFlag('hospital_protect_witnesses', true); E.setFlag('hospital_separate_witnesses', true); }, goto: 'ch4_lu_confrontation' },
        { text: '📝 趁沈玉芳清醒，先问一段福生仓经过', effect: () => E.setFlag('hospital_interrogate_yufang', true), goto: 'ch4_hospital_yufang_statement' },
        { text: '🕯️ 让陆念薇现身补上傅启元下一步', effect: () => E.setFlag('hospital_early_lu', true), goto: 'ch4_lu_confrontation' }
      ]
    };

    nodes.ch4_hospital_yufang_statement = {
      title: '教会医院 · 沈玉芳初步证词',
      weather: 4,
      effect: () => {
        E.addClue('沈玉芳医院初步证词', '沈玉芳在医院补充说明：福生仓装车前有人反复提到南码头和公董局清场手续。');
      },
      text: () => `沈玉芳坐在病床边，手指一直攥着被单。<br><br>你只问了两个问题，她就开始发抖。她说福生仓最后几天一直在搬箱子，也听见有人提到“南码头”和“清场手续”。<br><br>这段证词有用，但你也看得出来，她不能再被逼下去了。${hospitalBadge()}`,
      choices: [
        { text: '🛏️ 停止追问，先保护证人', effect: () => { E.setFlag('hospital_protect_witnesses', true); E.setFlag('hospital_separate_witnesses', true); }, goto: 'ch4_hospital_protect_witnesses' },
        { text: '🩺 让医生补上伤情记录', when: () => !E.getFlag('hospital_doctor_record'), effect: () => { E.setFlag('hospital_doctor_record', true); E.addClue('医院伤情记录', '教会医院医生记录了沈玉芳与苏晚亭的伤情和长期拘禁痕迹。'); }, goto: 'ch4_hospital_doctor_record' },
        { text: '🕯️ 根据她的话，逼陆念薇现身', goto: 'ch4_lu_confrontation' }
      ]
    };

    nodes.ch4_hospital_su_identify = {
      title: '教会医院 · 苏晚亭醒来',
      weather: 5,
      text: () => `苏晚亭醒得很短。她听见傅启元的名字时，手指突然抓紧床单，呼吸也乱了。<br><br>你可以得到一句极有力的指认，但这会把她重新推回福生仓那扇暗门后面。<br><br>这不是不能问，而是现在问，代价太高。${hospitalBadge()}`,
      choices: [
        { text: '🛏️ 停止指认，先保护她和沈玉芳', effect: () => { E.setFlag('hospital_protect_witnesses', true); E.setFlag('hospital_separate_witnesses', true); }, goto: 'ch4_hospital_protect_witnesses' },
        { text: '🕯️ 带着这句指认，逼陆念薇现身', effect: () => E.setFlag('hospital_early_lu', true), goto: 'ch4_lu_confrontation' }
      ]
    };

    if (nodes.ch4_hospital_protect_witnesses && !nodes.ch4_hospital_protect_witnesses.__pressureWitnessChoicesPatched) {
      const oldText = nodes.ch4_hospital_protect_witnesses.text;
      nodes.ch4_hospital_protect_witnesses.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${hospitalBadge()}`;
      };
      nodes.ch4_hospital_protect_witnesses.choices = [
        { text: '🩺 让医生补上伤情记录', when: () => !E.getFlag('hospital_doctor_record'), effect: () => { E.setFlag('hospital_doctor_record', true); E.addClue('医院伤情记录', '教会医院医生记录了沈玉芳与苏晚亭的伤情和长期拘禁痕迹。'); }, goto: 'ch4_hospital_doctor_record' },
        { text: '📝 只问沈玉芳一段福生仓经过', effect: () => E.setFlag('hospital_interrogate_yufang', true), goto: 'ch4_hospital_yufang_statement' },
        { text: '🕯️ 等证人稳住后，再逼陆念薇现身', goto: 'ch4_lu_confrontation' }
      ];
      nodes.ch4_hospital_protect_witnesses.__pressureWitnessChoicesPatched = true;
    }

    if (nodes.ch4_lu_confrontation && !nodes.ch4_lu_confrontation.__pressureWitnessTextPatched) {
      const oldText = nodes.ch4_lu_confrontation.text;
      nodes.ch4_lu_confrontation.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${hospitalBadge()}`;
      };
      nodes.ch4_lu_confrontation.__pressureWitnessTextPatched = true;
    }

    if (typeof E.v07InvestigationQuality === 'function' && !E.__hospitalQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const quality = oldQuality();
        const outcome = this.hospitalOutcomeTier();
        const truth = this.truthCompletenessTier();
        if (outcome.key === 'stable') {
          quality.score += 1;
          quality.reasons.push('医院线稳定，证人保护与伤情记录支撑证词可信度');
        }
        if (outcome.key === 'unstable') {
          quality.score = Math.min(quality.score, 8);
          quality.reasons.push('医院线失控，证人状态和程序压力削弱证词质量');
        }
        if (truth.key === 'complete') {
          quality.score += 1;
          quality.reasons.push('双证人与陆念薇证词补齐，真相链条完整');
        }
        if (truth.key === 'partial' || truth.key === 'weak') {
          quality.score = Math.min(quality.score, 8);
          quality.reasons.push('医院线真相完整度不足，结案质量存在上限');
        }
        return quality;
      };
      E.__hospitalQualityPatched = true;
    }

    E.__hospitalPressureWitnessPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalPressureWitnessPolish);
})();
