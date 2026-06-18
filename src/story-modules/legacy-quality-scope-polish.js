// ===== 旧推理质量分作用域收束 =====
// 目标：最初版本的 v07InvestigationQuality 不再决定福生仓后的最终结局。
// 新规则：
// 1) 福生仓线之前：legacy quality 仍可作为“调查成熟度”使用，负责早期归档/误判/是否继续追查。
// 2) deduced_fusheng 之后：最终结局只看 truthScoreDetails / hospitalOutcomeTier / luOutputTier / route flags。
// 3) 为兼容旧模块，v07InvestigationQuality 仍返回对象，但只作为诊断，不再提供足以触发旧隐藏/真隐藏的高分。

(function installLegacyQualityScopePolish() {
  function applyLegacyQualityScopePolish() {
    if (typeof E === 'undefined') return;
    if (E.__legacyQualityScopePolishPatched) return;

    const oldQuality = typeof E.v07InvestigationQuality === 'function' ? E.v07InvestigationQuality.bind(E) : null;

    E.preFushengInvestigationQuality = function () {
      if (oldQuality) return oldQuality();
      return { score: 0, reasons: [] };
    };

    E.finalTruthQuality = function () {
      const truth = typeof this.truthCompletenessTier === 'function' ? this.truthCompletenessTier() : { score: 0, key: 'weak', label: '真相不足' };
      const hospital = typeof this.hospitalOutcomeTier === 'function' ? this.hospitalOutcomeTier() : { key: 'none', label: '无医院线' };
      const lu = typeof this.luOutputTier === 'function' ? this.luOutputTier() : { key: 'none', label: '陆念薇未定' };
      return {
        score: Number(truth.score || 0),
        truth,
        hospital,
        lu,
        reasons: [
          `真相完整度：${truth.label || truth.key}`,
          `医院状态：${hospital.label || hospital.key}`,
          `陆念薇：${lu.label || lu.key}`
        ]
      };
    };

    E.v07InvestigationQuality = function () {
      const q = oldQuality ? oldQuality() : { score: 0, reasons: [] };
      q.score = Number(q.score || 0);
      q.reasons = Array.isArray(q.reasons) ? q.reasons.slice() : [];

      if (!this.getFlag('deduced_fusheng')) {
        q.scope = 'pre_fusheng';
        q.label = '福生仓前调查成熟度';
        return q;
      }

      const finalQ = this.finalTruthQuality();
      return {
        score: Math.min(finalQ.score, 5),
        scope: 'deprecated_after_fusheng',
        label: '旧推理质量分已退役',
        reasons: [
          '第三段推理完成后，旧推理质量分不再决定最终结局',
          ...finalQ.reasons
        ],
        finalTruth: finalQ
      };
    };

    E.__legacyQualityScopePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLegacyQualityScopePolish);
})();
