// ===== 推理重选与光华不足案情环节 =====
// 目标：主线推理题选错时不直接失败，而是提示玩家再想想并允许重选。
// 同时保留“非三证光华小学结束后 → 案情推理/表层收束”的结构，
// 不再把早期案情环节误删成只能回线索整理。

(function installDeductionRetryNoEarlyEndingPolish() {
  function applyDeductionRetryNoEarlyEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__deductionRetryNoEarlyEndingPatched) return;

    function retryHintFor(id, optionText) {
      const text = String(optionText || '');
      if (id === 'deduce_chen') {
        if (text.includes('陆小姐')) return '陆小姐有旧名和旧案，但这些还不能解释陈明远为什么会在学校里被逼到绝路。再想想：哪条线同时连着恐吓、箱子和那封信？';
        if (text.includes('吴校长')) return '吴校长的沉默很可疑，但“能遮掩”不等于“能灭口”。这一步要先判断陈明远到底撞见了什么。';
        if (text.includes('自杀') || text.includes('情感')) return '这能解释旁人愿意相信什么，却解释不了恐吓信和陈明远留下证据的动作。';
        return '这个判断还没有被桌上的证据压住。先从陈明远害怕的源头想起。';
      }
      if (id === 'deduce_lu_zhao') {
        if (text.includes('情人') || text.includes('合谋')) return '他们之间不像亲密同谋，更像互相盯防。赵先生的目光一直落在陆小姐会不会开口上。';
        if (text.includes('上线') || text.includes('受他指挥')) return '赵先生像一根线，但线头未必在他手里。现在能确定的是：他在盯陆小姐，而不是直接指挥她。';
        if (text.includes('没有关系')) return '这两条线出现得太频繁，不能当作巧合。只是它们还没有合成完整幕后。';
        return '这个关系还没说准。再看沈玉兰、茶楼和薛华立路之间的方向。';
      }
      if (id === 'deduce_fusheng') {
        if (text.includes('商业纠纷')) return '如果只是商业纠纷，就解释不了清场、恐吓和人被转走。';
        if (text.includes('吴校长')) return '吴校长能压学校里的口径，但现场清场证据指向更大的手续链。';
        if (text.includes('拆除')) return '拆校建仓库太表面了。纸条里的“三日清”和现场留下的东西，更像是在抹掉痕迹。';
        return '这一步要把仓库、清场、教具箱和王巡官纸条放在同一张桌面上。';
      }
      return '这个答案还压不住证据。再想想。';
    }

    if (typeof E.submitDeduction === 'function' && !E.__retryDeductionSubmitPatched) {
      const oldSubmitDeduction = E.submitDeduction.bind(E);
      E.submitDeduction = function (id, chosenIdx) {
        const d = this.deductions.find(x => x.id === id);
        if (!d) return oldSubmitDeduction(id, chosenIdx);

        if (chosenIdx === d.correctIdx) {
          this.deducEl.style.display = 'none';
          d.solved = true;
          this.setFlag?.(`deduction_${id}_solved`, true);
          this.toast('✅ 推理正确。这个判断能被现有证据压住。');
          this.go(d.successNode);
          return;
        }

        const opt = d.options?.[chosenIdx] || '';
        const hint = retryHintFor(id, opt);
        this.setFlag?.(`deduction_${id}_wrong_once`, true);
        this.toast('再想想：这个判断还不够稳。');

        const container = this.deducEl?.querySelector('.deduc-options');
        if (container) {
          let feedback = container.querySelector('.deduc-feedback');
          if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'deduc-feedback notice';
            feedback.style.cssText = 'margin-top:12px;text-align:left;line-height:1.7';
            container.appendChild(feedback);
          }
          feedback.innerHTML = `<b>这个判断还压不住证据。</b><br>${hint}`;
        }
      };
      E.__retryDeductionSubmitPatched = true;
    }

    // 重要：这里不再 patch ch4_conclusion / ch4_accuse。
    // 非三证光华小学结束后的“案情推理/表层收束”由 premature-conclusion-polish
    // 与 early-ending-continuity-polish 接管；本模块只负责推理题选错可重选。

    E.__deductionRetryNoEarlyEndingPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDeductionRetryNoEarlyEndingPolish);
})();
