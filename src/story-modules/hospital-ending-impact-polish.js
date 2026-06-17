// ===== 医院状态影响结局收束 =====
// 目标：医院状态不只是显示，而是明确影响隐藏/真隐藏资格与结局质量。
// 稳定：可进入真隐藏，并给结案质量加成。
// 可控：可进入真隐藏，但无额外加成。
// 紧张：证词可用但不稳，锁住真隐藏，最多隐藏结局/高质量普通真相。
// 失控：证词崩或程序被压，锁住隐藏与真隐藏，最多普通真相/救援结局。

(function installHospitalEndingImpactPolish() {
  function applyHospitalEndingImpactPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalEndingImpactPolishPatched) return;

    function hospitalTierKey() {
      if (typeof E.hospitalOutcomeTier !== 'function') return 'controlled';
      return E.hospitalOutcomeTier().key;
    }

    function truthKey() {
      if (typeof E.truthCompletenessTier !== 'function') return 'solid';
      return E.truthCompletenessTier().key;
    }

    E.hospitalAllowsTrueHidden = function () {
      const h = hospitalTierKey();
      const t = truthKey();
      return (h === 'stable' || h === 'controlled') && t === 'complete';
    };

    E.hospitalAllowsHidden = function () {
      const h = hospitalTierKey();
      const t = truthKey();
      if (h === 'unstable') return false;
      return t === 'complete' || t === 'solid';
    };

    E.hospitalEndingImpactLabel = function () {
      const h = typeof this.hospitalOutcomeTier === 'function' ? this.hospitalOutcomeTier() : { key: 'controlled', label: '可控医院线' };
      const t = typeof this.truthCompletenessTier === 'function' ? this.truthCompletenessTier() : { key: 'solid', label: '真相较完整' };
      if (h.key === 'stable') return `医院线稳定，${t.label}，证词可作为结案核心。`;
      if (h.key === 'controlled') return `医院线可控，${t.label}，证词能用但没有额外加成。`;
      if (h.key === 'tense') return `医院线紧张，${t.label}，证词可用但不稳，真隐藏资格被锁住。`;
      return `医院线失控，${t.label}，证人状态或程序压力削弱结案上限。`;
    };

    if (typeof E.v07InvestigationQuality === 'function' && !E.__hospitalEndingQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const q = oldQuality();
        q.score = Number(q.score || 0);
        q.reasons = Array.isArray(q.reasons) ? q.reasons.slice() : [];

        const h = typeof this.hospitalOutcomeTier === 'function' ? this.hospitalOutcomeTier() : { key: 'controlled' };
        const t = typeof this.truthCompletenessTier === 'function' ? this.truthCompletenessTier() : { key: 'solid' };

        if (h.key === 'stable') {
          q.score += 1;
          q.reasons.push('医院线稳定，证人保护与伤情记录让证词可作为结案核心');
        }
        if (h.key === 'tense') {
          q.score = Math.min(q.score, 10);
          q.reasons.push('医院线紧张，证词可用但不稳，真隐藏资格被锁住');
        }
        if (h.key === 'unstable') {
          q.score = Math.min(q.score, 8);
          q.reasons.push('医院线失控，证人状态或程序压力削弱证词质量，隐藏结局资格被锁住');
        }
        if (t.key === 'complete') {
          q.score += 1;
          q.reasons.push('医院线补齐证人、伤情与陆念薇证词，真相完整');
        }
        if (t.key === 'partial' || t.key === 'weak') {
          q.score = Math.min(q.score, 8);
          q.reasons.push('医院线真相完整度不足，结案质量存在上限');
        }
        return q;
      };
      E.__hospitalEndingQualityPatched = true;
    }

    if (typeof E.v07ResolveEnding === 'function' && !E.__hospitalEndingResolvePatched) {
      const oldResolve = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        if (this.getFlag('missed_deadline')) return 'end_too_late';
        const quality = this.v07InvestigationQuality();
        const h = typeof this.hospitalOutcomeTier === 'function' ? this.hospitalOutcomeTier().key : 'controlled';
        const t = typeof this.truthCompletenessTier === 'function' ? this.truthCompletenessTier().key : 'solid';

        if (h === 'unstable') {
          if (this.getFlag('rescued_su') || this.getFlag('rescued_yufang')) return 'end_rescue';
          if (quality.score >= 6) return 'end_conspiracy';
          return 'end_archive';
        }

        if (quality.score >= 10
          && this.getFlag('rescued_yufang')
          && this.getFlag('rescued_su')
          && this.getFlag('deduced_fusheng')
          && this.getFlag('school_wu_three_proofs')
          && (t === 'complete' || t === 'solid')) {
          return 'end_true_hidden';
        }

        if (quality.score >= 8
          && this.getFlag('rescued_yufang')
          && this.getFlag('deduced_fusheng')
          && this.getFlag('school_wu_three_proofs')
          && (t === 'complete' || t === 'solid')) {
          return 'end_conspiracy_detail';
        }

        return oldResolve();
      };
      E.__hospitalEndingResolvePatched = true;
    }

    function appendImpactToEndText(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__hospitalImpactTextPatched) return;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (typeof E.hospitalEndingImpactLabel !== 'function') return base;
        return `${base}<br><br><span class="sys">医院线影响：${E.hospitalEndingImpactLabel()}</span>`;
      };
      node.__hospitalImpactTextPatched = true;
    }

    appendImpactToEndText('end_conspiracy_detail');
    appendImpactToEndText('end_true_hidden');
    appendImpactToEndText('end_rescue');
    appendImpactToEndText('end_conspiracy');
    appendImpactToEndText('end_archive');

    E.__hospitalEndingImpactPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalEndingImpactPolish);
})();
