// ===== 旧推理质量分提示词作用域 =====
// 目标：光华小学之后、福生仓之前的整理页仍可显示“调查成熟度”，
// 但不能让玩家误以为这是最终结局分。
// 第三段完成后，提示最终结局改由证人/物证/医院/陆念薇/路线状态决定。

(function installLegacyQualityTextPolish() {
  function applyLegacyQualityTextPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__legacyQualityTextPolishPatched) return;

    function hasWitness() {
      return E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('rescued_su');
    }

    function qualityNotice() {
      if (E.getFlag('deduced_fusheng')) {
        const truth = typeof E.truthCompletenessTier === 'function' ? E.truthCompletenessTier() : null;
        const hospital = typeof E.hospitalOutcomeTier === 'function' ? E.hospitalOutcomeTier() : null;
        const lu = typeof E.luOutputTier === 'function' ? E.luOutputTier() : null;
        const rows = [
          truth ? `真相完整度：${truth.label}` : '',
          hasWitness() && hospital ? `医院状态：${hospital.label}` : '',
          hasWitness() && lu ? `陆念薇：${lu.label}` : '',
        ].filter(Boolean).join('<br>');
        return `<div class="notice"><b>终局判定已切换</b><br>第三段推理完成后，旧的“推理质量分”只作诊断参考；最终结局由证人、物证、医院、陆念薇和撤离路线共同决定。${rows ? `<br>${rows}` : ''}</div>`;
      }

      if (typeof E.v07InvestigationQuality === 'function') {
        const q = E.v07InvestigationQuality();
        if (q?.scope === 'pre_fusheng') {
          return `<div class="notice"><b>调查成熟度</b><br>当前提示只用于福生仓线之前：判断线索是否足以进入第一、第二段推理，以及是否该继续追查福生仓。它不是最终结局分。最终结局会在第三段推理后，由证人、物证、医院和陆念薇状态重新判定。</div>`;
        }
      }

      return `<div class="notice"><b>调查成熟度</b><br>这里显示的是进入福生仓前的线索整理提示，不等同于最终结局分。</div>`;
    }

    function patchText(nodeId, shouldAppend) {
      const node = nodes[nodeId];
      if (!node || node.__legacyQualityTextPatched) return;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldAppend()) return base;
        const text = String(base || '');
        if (text.includes('终局判定已切换') || text.includes('调查成熟度')) return text;
        return `${text}<br><br>${qualityNotice()}`;
      };
      node.__legacyQualityTextPatched = true;
    }

    // ch3_wrapup 是光华小学之后最常见的细节整理页；第三段完成后也必须显示终局判定切换提示。
    patchText('ch3_wrapup', () => E.getFlag('deduced_fusheng') || E.getFlag('deduced_chen') || E.getFlag('deduced_lu_zhao') || E.getFlag('school_wu_three_proofs') || E.hasClue?.('推理结论：陈明远被灭口'));

    // ch4_conclusion 仍保留兼容，但文案必须说明旧分不再决定终局。
    patchText('ch4_conclusion', () => true);

    E.__legacyQualityTextPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLegacyQualityTextPolish);
})();