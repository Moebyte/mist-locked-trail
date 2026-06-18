// ===== 光华小学证据不足收口 =====
// 目标：光华小学是必经地点，但不等于必然进入福生仓完整真相线。
// 当前期线索缺失时，吴校长只能给出表层解释；玩家可选择按现有材料结案，进入早期证据不足收束。

(function installGuanghuaIncompleteClosurePolish() {
  function applyGuanghuaIncompleteClosurePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__guanghuaIncompleteClosurePolishPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasThreatProof() {
      return hasThing('恐吓信') || hasThing('203 室恐吓信') || hasThing('如果你不说，他们下一个就是你');
    }

    function hasPhotoProof() {
      return hasThing('三人合影');
    }

    function hasUniversityProof() {
      return hasThing('日记残页') || hasThing('苏晚亭日记残页') || hasThing('苏晚亭半封家书');
    }

    function presentedAnyWuProof() {
      return E.getFlag('presented_threat_to_wu')
        || E.getFlag('presented_photo_to_wu')
        || E.getFlag('presented_university_to_wu')
        || E.getFlag('got_chen_evidence')
        || E.getFlag('read_letter');
    }

    function fullWuProofsReady() {
      return hasThreatProof() && hasPhotoProof() && hasUniversityProof();
    }

    function fullWuProofsPresented() {
      return E.getFlag('school_wu_three_proofs')
        || (E.getFlag('presented_threat_to_wu') && E.getFlag('presented_photo_to_wu') && E.getFlag('presented_university_to_wu'));
    }

    function missingWuProofLabels() {
      const missing = [];
      if (!hasThreatProof()) missing.push('203 室恐吓信');
      if (!hasPhotoProof()) missing.push('陈老师办公室三人合影');
      if (!hasUniversityProof()) missing.push('苏晚亭大学日记残页');
      return missing;
    }

    function shouldOfferIncompleteClosure() {
      if (E.getFlag('school_wu_three_proofs') || E.getFlag('deduced_fusheng')) return false;
      if (!presentedAnyWuProof()) return false;
      return !fullWuProofsReady() || !fullWuProofsPresented();
    }

    function incompleteReasonText() {
      const missing = missingWuProofLabels();
      if (!missing.length) return '三件证物虽然都在你手里，但还没有把它们全部压到吴校长面前。';
      return `你还缺：${missing.join('、')}。`;
    }

    nodes.ch3_school_incomplete_closure = {
      title: '光华小学 · 不完整的答案',
      weather: 4,
      effect: () => {
        E.setFlag('school_incomplete_closure', true);
        E.setFlag('school_truth_partial_only', true);
        E.addClue('光华小学不完整结论', '你在光华小学只压出部分事实：陈明远与苏晚亭、陆小姐之间确有联系，但学校异常与福生仓、公董局之间的链条还没有被接上。');
      },
      text: () => `吴校长终于不再说“巡捕房已经结案”。<br><br>可他也没有真正把话说到底。<br><br>你手里的证据能说明陈明远不是单纯坠楼，能说明苏晚亭和陆小姐都曾靠近光华小学，也能说明学校里有人在害怕。可是这些线索还没能合成一条完整的链。<br><br><span class="sys">${incompleteReasonText()}</span><br><br>吴校长顺着这个缺口，把事情往最安全的方向推：陈明远与苏晚亭有私情，陆小姐只是校外来客，学校只是怕名声受损。<br><br>这不是没有答案。<br><br>只是一个太容易被接受的答案。`,
      choices: [
        { text: '📁 按现有材料回去整理结案', goto: 'ch4_conclusion' },
        { text: '🔙 不甘心，回到校长办公室继续找缺口', goto: 'ch3_school_confront_wu' }
      ]
    };

    if (nodes.ch3_school_confront_wu && !nodes.ch3_school_confront_wu.__incompleteClosurePatched) {
      const oldText = nodes.ch3_school_confront_wu.text;
      const oldChoices = nodes.ch3_school_confront_wu.choices;

      nodes.ch3_school_confront_wu.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldOfferIncompleteClosure()) return base;
        return `${base}<br><br><div class="notice"><b>证据仍不够完整</b><br>${incompleteReasonText()}<br>你可以继续补查，把吴校长压到说出傅启元和福生仓；也可以按现有材料结案，但那只会得到一个表层答案。</div>`;
      };

      nodes.ch3_school_confront_wu.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = Array.isArray(base) ? base.slice() : [];
        if (shouldOfferIncompleteClosure() && !out.some(choice => choice.goto === 'ch3_school_incomplete_closure')) {
          out.push({ text: '📁 证据不足，按光华小学现有材料结案', goto: 'ch3_school_incomplete_closure' });
        }
        return out;
      };

      nodes.ch3_school_confront_wu.__incompleteClosurePatched = true;
    }

    // 如果玩家从学校不足线回到整理页，弱化继续福生仓的诱导，突出早期收束。
    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__guanghuaIncompleteWrapupPatched) {
      const oldText = nodes.ch3_wrapup.text;
      nodes.ch3_wrapup.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!E.getFlag('school_incomplete_closure')) return base;
        return `${base}<br><br><div class="notice"><b>光华小学线索只到表层</b><br>你选择按现有材料整理结案。陈明远、苏晚亭和陆小姐之间的关系可以被写成一份案情说明，但福生仓、公董局和傅启元仍然留在雾里。</div>`;
      };
      nodes.ch3_wrapup.__guanghuaIncompleteWrapupPatched = true;
    }

    E.__guanghuaIncompleteClosurePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaIncompleteClosurePolish);
})();
