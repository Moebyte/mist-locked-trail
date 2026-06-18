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

    function shouldOfferIncompleteClosure() {
      if (E.getFlag('school_wu_three_proofs') || E.getFlag('deduced_fusheng')) return false;
      if (!presentedAnyWuProof()) return false;
      return !fullWuProofsReady() || !fullWuProofsPresented();
    }

    function incompleteReasonText() {
      if (fullWuProofsReady() && !fullWuProofsPresented()) {
        return '几件东西都在你手边，可还没有在同一张桌面上合成一条能压住吴校长的话。';
      }
      const phrases = [];
      if (!hasThreatProof()) phrases.push('陈明远死前究竟被谁逼到墙角，还没有人愿意承认');
      if (!hasPhotoProof()) phrases.push('陆小姐为什么能自由出入学校，仍能被说成偶然来访');
      if (!hasUniversityProof()) phrases.push('苏晚亭到底是主动追查，还是只被一段私情拖进来，仍没有旁证替她说话');
      return phrases.length ? phrases.join('；') + '。' : '这几条线还没有在吴校长面前真正合拢。';
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
        { text: '📁 接受这个较容易成立的说法，回去整理结案', goto: 'ch4_conclusion' },
        { text: '🔙 不甘心，回到校长办公室继续找缺口', goto: 'ch3_school_confront_wu' }
      ]
    };

    if (nodes.ch3_school_confront_wu && !nodes.ch3_school_confront_wu.__incompleteClosurePatched) {
      const oldText = nodes.ch3_school_confront_wu.text;
      const oldChoices = nodes.ch3_school_confront_wu.choices;

      nodes.ch3_school_confront_wu.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldOfferIncompleteClosure()) return base;
        return `${base}<br><br><div class="notice"><b>话还没有压到底</b><br>${incompleteReasonText()}<br>现在的材料足够让吴校长改口，却还不足以逼他把傅启元、福生仓和公董局放到同一张桌面上。你可以继续追问，也可以接受这个更容易被写进案卷的说法。</div>`;
      };

      nodes.ch3_school_confront_wu.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = Array.isArray(base) ? base.slice() : [];
        if (shouldOfferIncompleteClosure() && !out.some(choice => choice.goto === 'ch3_school_incomplete_closure')) {
          out.push({ text: '📁 接受这个较容易成立的说法', goto: 'ch3_school_incomplete_closure' });
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
