// ===== 傅启元后巷交易后果系统 =====
// 目标：后巷交易不再只是“接/拒/反制”三个 flag，而是成为终局前的压力分流器。
// 机制分层：
// - leverage：你手里能反压傅启元的筹码，来自证人、硬物证、医院记录、陆念薇程序、老孙/媒体背书。
// - pressure：傅启元和公董局能反压你的压力，来自医院失控、公董局介入、码头惊动、程序缺口。
// - tier：交易后的局面。可为反制成功、僵持、被拿捏、公董局强行介入。

(function installFuPrivateOfferConsequencePolish() {
  function applyFuPrivateOfferConsequencePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fuPrivateOfferConsequencePolishPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function witnessProfile() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : {
            yufang: E.getFlag('rescued_yufang') || E.getFlag('found_yufang'),
            su: E.getFlag('rescued_su') || E.getFlag('found_su_at_dock'),
            count: (E.getFlag('rescued_yufang') || E.getFlag('found_yufang') ? 1 : 0) + (E.getFlag('rescued_su') || E.getFlag('found_su_at_dock') ? 1 : 0),
            label: '证人状态未知'
          };
    }

    function hospitalTier() {
      return typeof E.hospitalOutcomeTier === 'function' ? E.hospitalOutcomeTier() : { key: 'controlled', label: '可控医院线' };
    }

    function luTier() {
      return typeof E.luOutputTier === 'function' ? E.luOutputTier() : { key: 'none', label: '陆念薇未处理' };
    }

    function hasClearance() {
      return hasThing('清场指令') || hasThing('公董局公文纸') || E.getFlag('fu_clearance_exposed');
    }

    function hasWaybill() {
      return hasThing('光华货运单') || hasThing('教具箱走私') || hasThing('管制药品走私') || E.getFlag('fu_waybill_exposed');
    }

    function hasSunBackstop() {
      return E.getFlag('dock_sun_pressed_fu')
        || E.getFlag('v07_choice_hold_blockade')
        || E.getFlag('sun_wait_support')
        || E.getFlag('sun_full_support')
        || E.getFlag('dock_full_support_entry');
    }

    function hasPressBackstop() {
      return E.getFlag('press_material_prepared') || E.getFlag('v07_fu_bluffed_with_press');
    }

    E.fuOfferLeverageScore = function () {
      const wp = witnessProfile();
      const h = hospitalTier();
      const l = luTier();
      let score = 0;
      const reasons = [];

      if (wp.yufang) { score += 1; reasons.push('沈玉芳能作证'); }
      if (wp.su) { score += 1; reasons.push('苏晚亭能作证'); }
      if (hasClearance()) { score += 2; reasons.push('清场指令能钉住公董局压力'); }
      if (hasWaybill()) { score += 2; reasons.push('货运单能钉住福生仓货路'); }
      if (E.getFlag('hospital_doctor_record')) { score += 1; reasons.push('医生伤情记录能稳住证词'); }
      if (h.key === 'stable') { score += 2; reasons.push('医院线稳定'); }
      else if (h.key === 'controlled') { score += 1; reasons.push('医院线可控'); }
      if (l.key === 'formal') { score += 3; reasons.push('陆念薇正式口供接入程序'); }
      else if (l.key === 'private') { score += 2; reasons.push('陆念薇私下材料补上傅启元下一步'); }
      else if (l.key === 'informant') { score += 1; reasons.push('陆念薇仍可作为暗线'); }
      if (hasSunBackstop()) { score += 2; reasons.push('老孙能接住码头或口供程序'); }
      if (hasPressBackstop()) { score += 2; reasons.push('《申报》/媒体线能形成外部反制'); }

      return { score: Math.max(0, Math.min(16, score)), reasons };
    };

    E.fuOfferPressureScore = function () {
      const h = hospitalTier();
      const l = luTier();
      let score = 0;
      const reasons = [];

      if (h.key === 'tense') { score += 2; reasons.push('医院线紧张，证词容易被搅乱'); }
      if (h.key === 'unstable') { score += 4; reasons.push('医院失控，公董局更容易反压程序'); }
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) { score += 3; reasons.push('公董局已经在码头插手'); }
      if (E.getFlag('v07_choice_solo_call_sun_late') || E.getFlag('v07_choice_late_blockade')) { score += 1; reasons.push('码头封锁迟了一步'); }
      if (l.key === 'withdrawn' || l.key === 'none') { score += 2; reasons.push('陆念薇没有形成可用程序材料'); }
      if (l.key === 'informant') { score += 1; reasons.push('陆念薇继续做内线，当前案卷缺少正式钉子'); }
      if (!hasSunBackstop()) { score += 1; reasons.push('老孙程序背书不足'); }
      if (E.getFlag('v07_accepted_fu_card')) { score += 4; reasons.push('你接下傅启元名片，被他留下把柄'); }
      if (E.getFlag('v07_rejected_fu_deal')) { score += 2; reasons.push('当面拒绝交易，傅启元会立刻推公董局介入'); }
      if (E.getFlag('v07_fu_bluffed_with_press')) { score -= 2; reasons.push('媒体/老孙反制降低当场压力'); }

      return { score: Math.max(0, Math.min(14, score)), reasons };
    };

    E.fuOfferConsequenceTier = function () {
      const leverage = this.fuOfferLeverageScore();
      const pressure = this.fuOfferPressureScore();
      const margin = leverage.score - pressure.score;

      if (this.getFlag('v07_accepted_fu_card')) {
        if (margin >= 5) return { key: 'feigned_acceptance', label: '假意接牌，留住反制空间', leverage, pressure, margin };
        if (margin >= 1) return { key: 'compromised_standoff', label: '假意周旋，但留下把柄', leverage, pressure, margin };
        return { key: 'compromised', label: '被傅启元拿住把柄', leverage, pressure, margin };
      }

      if (this.getFlag('v07_rejected_fu_deal')) {
        if (margin >= 4) return { key: 'hard_reject_success', label: '当面拒绝并压住反扑', leverage, pressure, margin };
        if (margin >= 0) return { key: 'hard_reject_standoff', label: '拒绝交易，局面僵住', leverage, pressure, margin };
        return { key: 'bureau_intervention', label: '拒绝过硬，公董局强行介入', leverage, pressure, margin };
      }

      if (this.getFlag('v07_fu_bluffed_with_press')) {
        if (margin >= 2) return { key: 'press_counter_success', label: '报馆与老孙反制成功', leverage, pressure, margin };
        return { key: 'press_counter_risky', label: '反制不足，傅启元看出虚实', leverage, pressure, margin };
      }

      return { key: 'unresolved', label: '后巷交易未定', leverage, pressure, margin };
    };

    function applyFuOutcome(flag) {
      if (flag === 'accept') {
        E.setFlag('v07_accepted_fu_card', true);
        E.addClue?.('傅启元名片', '傅启元亲自递出交易名片，试图让陆念薇背下全部罪名。你接了下来，但未必是真的答应。');
      } else if (flag === 'reject') {
        E.setFlag('v07_rejected_fu_deal', true);
        E.addClue?.('拒绝傅启元交易', '你拒绝让陆念薇背下全部罪名，坚持追查傅启元本人。');
      } else if (flag === 'press') {
        E.setFlag('v07_fu_bluffed_with_press', true);
        E.setFlag('press_material_prepared', true);
        E.addClue?.('反制傅启元', '你用货运单、清场指令、口供和报馆线索反制傅启元，让他无法当场把医院变成另一个码头。');
      }

      const tier = E.fuOfferConsequenceTier();
      E.setFlag(`fu_offer_${tier.key}`, true);

      if (tier.key === 'compromised') {
        E.setFlag('fu_offer_compromised', true);
        E.addHeat?.(2, '你接下傅启元的名片，公董局有了反过来拿捏你的口径。');
      }
      if (tier.key === 'bureau_intervention') {
        E.setFlag('fu_offer_bureau_intervention', true);
        E.setFlag('hospital_bureau_forced_entry', true);
        E.addHeat?.(2, '你当面拒绝傅启元，公董局的人开始强行介入医院程序。');
      }
      if (tier.key === 'hard_reject_success' || tier.key === 'press_counter_success') {
        E.setFlag('fu_offer_counter_success', true);
      }
    }

    function statusNotice() {
      const leverage = E.fuOfferLeverageScore();
      const pressure = E.fuOfferPressureScore();
      const lrs = leverage.reasons.length ? leverage.reasons.join('；') : '你手里还缺少足够筹码';
      const prs = pressure.reasons.length ? pressure.reasons.join('；') : '傅启元暂时没有明显反压点';
      return `<br><br><div class="notice"><b>后巷局势</b><br>反制筹码：${leverage.score}。${lrs}。<br><br>外部压力：${pressure.score}。${prs}。</div>`;
    }

    if (nodes.ch4_fu_private_offer && !nodes.ch4_fu_private_offer.__fuOfferConsequencePatched) {
      const oldText = nodes.ch4_fu_private_offer.text;
      nodes.ch4_fu_private_offer.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${statusNotice()}`;
      };
      nodes.ch4_fu_private_offer.choices = [
        {
          text: '💼 接下名片，假装答应交易，先看他还会露出什么',
          effect: () => applyFuOutcome('accept'),
          goto: 'ch4_conclusion'
        },
        {
          text: '🧾 当面拒绝交易，把货运单和清场指令压回他手里',
          effect: () => applyFuOutcome('reject'),
          goto: 'ch4_conclusion'
        },
        {
          text: '📰 告诉他材料已寄给《申报》和老孙，反压公董局',
          when: () => hasWaybill() || hasClearance() || E.getFlag('v07_lu_statement') || E.getFlag('v07_lu_to_sun') || E.getFlag('hospital_doctor_record'),
          effect: () => applyFuOutcome('press'),
          goto: 'ch4_conclusion'
        }
      ];
      nodes.ch4_fu_private_offer.__fuOfferConsequencePatched = true;
    }

    if (typeof E.truthScoreDetails === 'function' && !E.__fuOfferTruthScorePatched) {
      const oldDetails = E.truthScoreDetails.bind(E);
      E.truthScoreDetails = function () {
        const details = oldDetails();
        const tier = this.fuOfferConsequenceTier?.();
        if (!tier || tier.key === 'unresolved') return details;
        details.modifiers = Array.isArray(details.modifiers) ? details.modifiers.slice() : [];
        details.capReasons = Array.isArray(details.capReasons) ? details.capReasons.slice() : [];
        details.fuOffer = tier;

        if (tier.key === 'compromised') {
          details.score = Math.min(Number(details.score || 0), 6);
          details.cap = Math.min(Number(details.cap || 10), 6);
          details.modifiers.push({ key: 'fu_compromised', delta: 'cap 6', label: '傅启元名片留下把柄，结案被交易污染' });
        } else if (tier.key === 'compromised_standoff') {
          details.score = Math.min(Number(details.score || 0), 8);
          details.cap = Math.min(Number(details.cap || 10), 8);
          details.modifiers.push({ key: 'fu_compromised_standoff', delta: 'cap 8', label: '假意周旋保住局面，但把柄限制结局上限' });
        } else if (tier.key === 'bureau_intervention') {
          details.score = Math.max(0, Number(details.score || 0) - 2);
          details.cap = Math.min(Number(details.cap || 10), 8);
          details.capReasons.push('公董局强行介入，医院证词和程序链被反压');
          details.modifiers.push({ key: 'fu_bureau_intervention', delta: -2, label: '拒绝过硬引来公董局强行介入' });
        } else if (tier.key === 'hard_reject_success' || tier.key === 'press_counter_success') {
          details.score = Math.min(10, Number(details.score || 0) + 1);
          details.modifiers.push({ key: 'fu_counter_success', delta: 1, label: '后巷交易被反制，傅启元无法轻易改口径' });
        }

        return details;
      };
      E.__fuOfferTruthScorePatched = true;
    }

    if (typeof E.hospitalOutcomeTier === 'function' && !E.__fuOfferHospitalTierPatched) {
      const oldHospitalTier = E.hospitalOutcomeTier.bind(E);
      E.hospitalOutcomeTier = function () {
        const h = oldHospitalTier();
        if (this.getFlag('hospital_bureau_forced_entry') || this.getFlag('fu_offer_bureau_intervention')) {
          return { ...h, key: 'unstable', label: '医院失控', fuOffer: this.fuOfferConsequenceTier?.() };
        }
        return h;
      };
      E.__fuOfferHospitalTierPatched = true;
    }

    if (typeof E.finalPressureProfile === 'function' && !E.__fuOfferFinalPressurePatched) {
      const oldFinalPressure = E.finalPressureProfile.bind(E);
      E.finalPressureProfile = function () {
        const p = oldFinalPressure();
        const tier = this.fuOfferConsequenceTier?.();
        if (!tier || tier.key === 'unresolved') return p;
        const notes = Array.isArray(p.notes) ? p.notes.slice() : [];
        let value = Number(p.value || 0);
        if (tier.key === 'compromised' || tier.key === 'compromised_standoff') {
          value += 2;
          notes.push('傅启元留下能拿捏你的把柄');
        }
        if (tier.key === 'bureau_intervention') {
          value += 3;
          notes.push('公董局强行介入医院程序');
        }
        if (tier.key === 'hard_reject_success' || tier.key === 'press_counter_success') {
          value = Math.max(0, value - 1);
          notes.push('后巷反制压住傅启元');
        }
        let label = '可控';
        if (value >= 7) label = '临界';
        else if (value >= 5) label = '高压';
        else if (value >= 3) label = '紧张';
        return { ...p, value: Math.max(0, Math.min(8, value)), label, notes };
      };
      E.__fuOfferFinalPressurePatched = true;
    }

    E.__fuPrivateOfferConsequencePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFuPrivateOfferConsequencePolish);
})();