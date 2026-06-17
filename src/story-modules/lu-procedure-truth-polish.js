// ===== 陆念薇程序链条机制 =====
// 目标：陆念薇不是“万能加分口供”，而是决定真相能否进入正式程序。
// 可信度 credibility：她是否愿意说到傅启元、公董局、南码头。
// 程序风险 procedureRisk：她的口供能否被老孙接住，还是会被公董局反压成越权/伪证。
// 公董局已出面会降低她正式留名意愿，并提高程序风险。
// 周怀安不直接加真相分；他是医院证人稳定变量，用得早会刺激证人，用得稳会帮助苏晚亭撑住。

(function installLuProcedureTruthPolish() {
  function applyLuProcedureTruthPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__luProcedureTruthPolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function clearanceEvidenceReady() {
      return hasThing('清场指令') || hasThing('公董局公文纸') || E.getFlag('fu_clearance_exposed');
    }

    function waybillEvidenceReady() {
      return hasThing('光华货运单') || hasThing('教具箱走私') || hasThing('管制药品走私') || E.getFlag('fu_waybill_exposed');
    }

    function fullSupportAtDock() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_sun_pressed_fu')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function witnessProfile() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : { count: 0, yufang: false, su: false, label: '证人缺席' };
    }

    function hospitalKey() {
      return typeof E.hospitalOutcomeTier === 'function' ? E.hospitalOutcomeTier().key : 'controlled';
    }

    E.luCredibilityScore = function () {
      const wp = witnessProfile();
      let score = 0;
      if (clearanceEvidenceReady()) score += 2;
      if (waybillEvidenceReady()) score += 2;
      if (wp.yufang) score += 1;
      if (wp.su) score += 1;
      if (this.getFlag('dock_sun_pressed_fu') || this.getFlag('v07_choice_hold_blockade')) score += 1;
      if (this.getFlag('hospital_doctor_record')) score += 1;

      const h = hospitalKey();
      if (h === 'stable') score += 1;
      if (h === 'tense') score -= 1;
      if (h === 'unstable') score -= 3;

      if (this.getFlag('hospital_early_lu') || this.getFlag('v07_choice_draw_lu')) score -= 1;
      if (this.getFlag('dock_escaped_during_sun_standoff') || this.getFlag('v07_choice_blockade_after_interference')) score -= 2;
      return Math.max(0, Math.min(10, score));
    };

    E.luProcedureRiskScore = function () {
      let score = 0;
      const h = hospitalKey();
      if (h === 'tense') score += 1;
      if (h === 'unstable') score += 3;
      if (this.getFlag('hospital_early_lu') || this.getFlag('v07_choice_draw_lu')) score += 2;
      if (this.getFlag('dock_escaped_during_sun_standoff')) score += 2;
      if (this.getFlag('v07_choice_blockade_after_interference')) score += 2;
      if (!fullSupportAtDock() && !this.getFlag('v07_choice_hold_blockade')) score += 1;
      if (this.getFlag('v07_lu_statement')) score += 1;
      if (this.getFlag('v07_lu_as_informant')) score += 2;
      if (this.getFlag('v07_lu_to_sun')) score -= 1;
      return Math.max(0, Math.min(10, score));
    };

    E.luAllowsFormalStatement = function () {
      return this.luCredibilityScore() >= 6 && this.luProcedureRiskScore() <= 3;
    };

    E.luOutputTier = function () {
      if (this.getFlag('v07_lu_to_sun')) return { key: 'formal', label: '正式口供', credibility: this.luCredibilityScore(), risk: this.luProcedureRiskScore() };
      if (this.getFlag('v07_lu_statement')) return { key: 'private', label: '私下口供', credibility: this.luCredibilityScore(), risk: this.luProcedureRiskScore() };
      if (this.getFlag('v07_lu_as_informant')) return { key: 'informant', label: '继续做内线', credibility: this.luCredibilityScore(), risk: this.luProcedureRiskScore() };
      if (this.getFlag('v07_lu_withdrawn')) return { key: 'withdrawn', label: '退缩沉默', credibility: this.luCredibilityScore(), risk: this.luProcedureRiskScore() };
      const c = this.luCredibilityScore();
      const r = this.luProcedureRiskScore();
      if (c >= 6 && r <= 3) return { key: 'formal_ready', label: '可转正式口供', credibility: c, risk: r };
      if (c >= 3) return { key: 'private_ready', label: '只适合私下口供', credibility: c, risk: r };
      return { key: 'fragile', label: '可能退缩', credibility: c, risk: r };
    };

    function luBadge() {
      const tier = E.luOutputTier();
      const text = tier.key === 'formal_ready'
        ? '陆念薇已经看见你手里的证据和医院里的证人。只要程序接得住，她可以正式留名。'
        : tier.key === 'private_ready'
          ? '陆念薇愿意写下一段东西，但她还不敢把自己交进巡捕房程序里。'
          : tier.key === 'fragile'
            ? '陆念薇的眼神一直避开病房。现在逼她，她很可能只会自保。'
            : `陆念薇当前状态：${tier.label}。`;
      return `<br><br><span class="sys">${text}</span>`;
    }

    if (nodes.ch4_lu_confrontation && !nodes.ch4_lu_confrontation.__luProcedurePatched) {
      const oldText = nodes.ch4_lu_confrontation.text;
      nodes.ch4_lu_confrontation.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${luBadge()}`;
      };
      nodes.ch4_lu_confrontation.choices = function () {
        const opts = [];
        const credibility = E.luCredibilityScore();
        const risk = E.luProcedureRiskScore();

        if (E.luAllowsFormalStatement()) {
          opts.push({
            text: '🚓 把陆念薇交给老孙，换正式口供',
            effect: () => {
              E.setFlag('v07_lu_to_sun', true);
              E.addClue('陆念薇正式口供', '陆念薇被交给老孙后，愿意写下傅启元、公董局清场与南码头转运安排。');
            },
            goto: 'ch4_fu_private_offer'
          });
        } else if (credibility >= 6) {
          opts.push({
            text: '⚠️ 现在硬交给老孙，可能被公董局反压程序',
            effect: () => {
              E.setFlag('v07_lu_statement', true);
              E.setFlag('v07_lu_formal_blocked', true);
              E.addClue('陆念薇口供受阻', '陆念薇愿意写下傅启元线索，但医院与码头程序风险过高，暂时无法形成正式口供。');
            },
            goto: 'ch4_fu_private_offer'
          });
        }

        if (credibility >= 3) {
          opts.push({
            text: '🧾 避开走廊，让她写下傅启元的下一步安排',
            effect: () => {
              E.setFlag('v07_lu_statement', true);
              E.addClue('陆念薇补充口供', '陆念薇写下傅启元南码头转运安排，但这份材料还不能直接替代正式程序。');
            },
            goto: 'ch4_fu_private_offer'
          });
        }

        opts.push({
          text: '🌫️ 放她走，让她继续做内线',
          effect: () => {
            E.setFlag('v07_lu_as_informant', true);
            E.addHeat(1, '你放走陆念薇，留下了内线，也留下了程序风险。');
          },
          goto: 'ch4_fu_private_offer'
        });

        if (credibility < 3 || risk >= 6) {
          opts.push({
            text: '🕯️ 暂时别逼她，先稳住医院里的证人',
            effect: () => {
              E.setFlag('v07_lu_withdrawn', true);
              E.addClue('陆念薇暂时退缩', '医院和码头压力太高，陆念薇没有立刻留下可用口供。');
            },
            goto: 'ch4_fu_private_offer'
          });
        }

        return opts;
      };
      nodes.ch4_lu_confrontation.__luProcedurePatched = true;
    }

    if (typeof E.truthScoreDetails === 'function' && !E.__luTruthScorePatched) {
      const oldDetails = E.truthScoreDetails.bind(E);
      E.truthScoreDetails = function () {
        const details = oldDetails();
        const lu = this.luOutputTier();
        details.lu = lu;
        details.procedureRisk = this.luProcedureRiskScore();
        if (lu.key === 'formal') {
          details.modifiers.push({ key: 'lu_formal', delta: 1, label: '陆念薇正式口供补齐公董局程序链条' });
        } else if (lu.key === 'private') {
          details.modifiers.push({ key: 'lu_private', delta: 1, label: '陆念薇私下口供补强傅启元下一步安排' });
        } else if (lu.key === 'informant') {
          details.cap = Math.min(details.cap, 9);
          details.capReasons.push('陆念薇继续做内线，当前结案程序力不足');
        } else if (lu.key === 'withdrawn') {
          details.score = Math.min(details.score, 7);
          details.cap = Math.min(details.cap, 7);
          details.capReasons.push('陆念薇退缩，公董局链条缺口未闭合');
        }
        return details;
      };
      E.__luTruthScorePatched = true;
    }

    E.__luProcedureTruthPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLuProcedureTruthPolish);
})();
