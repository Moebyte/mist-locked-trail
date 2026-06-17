// ===== 隐藏结局门槛兜底 =====
// 目标：隐藏结局需要光华小学三证物质询 + 救出沈玉芳；真·隐藏结局额外要求救出苏晚亭。

(function installHiddenEndingGateCleanup() {
  function applyHiddenEndingGateCleanup() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hiddenEndingGateCleanupPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hiddenGatePassed() {
      return E.getFlag('school_wu_three_proofs') && E.getFlag('rescued_yufang');
    }

    function trueHiddenGatePassed() {
      return hiddenGatePassed() && E.getFlag('rescued_su');
    }

    function fallbackEnding() {
      if (typeof E.v07InvestigationQuality === 'function') {
        const quality = E.v07InvestigationQuality();
        if (E.getFlag('rescued_su') || E.getFlag('v07_witnesses_protected')) return 'end_rescue';
        if (quality.score >= 6) return 'end_conspiracy';
      }
      return 'end_archive';
    }

    function guardChoice(choice) {
      const rawGoto = choice.goto;
      const rawWhen = choice.when;
      const isStaticHiddenEntry = rawGoto === 'end_conspiracy_detail';
      const isStaticTrueHiddenEntry = rawGoto === 'end_true_hidden';

      return {
        ...choice,
        when: function (state) {
          const ok = typeof rawWhen === 'function' ? rawWhen(state) : rawWhen;
          if (rawWhen !== undefined && !ok) return false;
          if (isStaticHiddenEntry && !hiddenGatePassed()) return false;
          if (isStaticTrueHiddenEntry && !trueHiddenGatePassed()) return false;
          return true;
        },
        goto: function (state) {
          const target = typeof rawGoto === 'function' ? rawGoto(state) : rawGoto;
          if (target === 'end_true_hidden' && !trueHiddenGatePassed()) return hiddenGatePassed() ? 'end_conspiracy_detail' : fallbackEnding();
          if (target === 'end_conspiracy_detail') {
            if (trueHiddenGatePassed()) return 'end_true_hidden';
            if (!hiddenGatePassed()) return fallbackEnding();
          }
          return target;
        }
      };
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__hiddenEndingGateChoicesPatched) {
      const oldChoices = nodes.ch4_conclusion.choices;
      nodes.ch4_conclusion.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.map(guardChoice).filter(choice => {
          const visible = typeof choice.when === 'function' ? choice.when(state) : choice.when;
          return choice.when === undefined || !!visible;
        });
      };
      nodes.ch4_conclusion.__hiddenEndingGateChoicesPatched = true;
    }

    E.__hiddenEndingGateCleanupPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHiddenEndingGateCleanup);
})();
