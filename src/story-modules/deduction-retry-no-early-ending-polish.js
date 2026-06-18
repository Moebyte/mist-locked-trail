// ===== 推理重选与早期结案退役 =====
// 目标：主线推理题不再用错误答案触发早期失败结局。
// 玩家选错时留在推理面板，获得“再想想”的叙事提示，直到选出能被证据压住的答案。
// 同时，光华小学后的早期 ch4_conclusion 不再提供归档/冒然指认等早期结案系统，只引导玩家回到线索整理继续调查。

(function installDeductionRetryNoEarlyEndingPolish() {
  function applyDeductionRetryNoEarlyEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__deductionRetryNoEarlyEndingPatched) return;

    function hasWitness() {
      return E.getFlag('found_yufang') || E.getFlag('rescued_yufang') || E.getFlag('found_su_at_dock') || E.getFlag('rescued_su');
    }

    function hasAlteredPacket() {
      return E.getFlag('chen_letter_packet_altered') || E.hasItem?.('陈明远残信') || E.hasItem?.('苏晚亭疑似遗书');
    }

    function isEarlyClosureState() {
      return !E.getFlag('deduced_fusheng')
        && !hasWitness()
        && (E.getFlag('school_incomplete_closure')
          || E.getFlag('school_truth_partial_only')
          || hasAlteredPacket()
          || E.getFlag('deduced_chen')
          || E.getFlag('deduced_lu_zhao'));
    }

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

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__noEarlyEndingRetirePatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        if (!isEarlyClosureState()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `你回到事务所，把材料一件件摊开。<br><br>它们已经能拼出一些形状：陈明远不是无缘无故死去，苏晚亭不是无缘无故失踪，光华小学也不是一处无关地点。<br><br>可是这还不是可以落笔结案的时候。<br><br>现在写报告，只会把一个还没走完的案子压成过早的答案。与其把雾写进案卷，不如回到线索整理页，继续把断掉的几条线接上。`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        if (!isEarlyClosureState()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = [
          { text: '🔙 不结案，回到线索整理继续推理', goto: 'ch3_wrapup' }
        ];
        if (hasAlteredPacket()) {
          out.push({ text: '🏮 暂存残信和疑似遗书，先不要交给周怀安', goto: 'ch3_wrapup' });
        }
        return out;
      };
      nodes.ch4_conclusion.__noEarlyEndingRetirePatched = true;
    }

    if (nodes.ch4_accuse && !nodes.ch4_accuse.__noEarlyEndingRetirePatched) {
      const oldText = nodes.ch4_accuse.text;
      const oldChoices = nodes.ch4_accuse.choices;
      nodes.ch4_accuse.text = function (state) {
        if (!isEarlyClosureState()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `你试着把某个人的名字写到纸上。<br><br>陆小姐、赵先生、吴校长——每个人都能解释一部分，每个人又都解释不了全部。<br><br>这不是指认的时候。真正的推理不该靠一个最像凶手的名字结束，而要靠能互相咬合的证据继续往下走。`;
      };
      nodes.ch4_accuse.choices = function (state) {
        if (!isEarlyClosureState()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return [{ text: '🔙 收起这份过早的指认，回到线索整理', goto: 'ch3_wrapup' }];
      };
      nodes.ch4_accuse.__noEarlyEndingRetirePatched = true;
    }

    E.__deductionRetryNoEarlyEndingPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDeductionRetryNoEarlyEndingPolish);
})();
