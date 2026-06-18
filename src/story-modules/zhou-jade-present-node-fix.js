// ===== 周怀安翡翠镯举证节点兜底 =====
// 目标：present-flow-cleanup 会把“拿出翡翠镯”导向 ch4_zhou_present_jade
// 或 ch4_zhou_present_jade_premature。旧剧情里这两个节点并不总是存在，
// 会导致点击选项后场景丢失，用户看到类似回到开头/重开的异常。
// 本模块只补节点，不改变主线证据判定。

(function installZhouJadePresentNodeFix() {
  function applyZhouJadePresentNodeFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__zhouJadePresentNodeFixPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasMoreZhouEvidence() {
      return (hasThing('陈明远的信') && !E.getFlag('presented_chen_letter_to_zhou'))
        || (hasThing('陈明远残信') && !E.getFlag('presented_chen_letter_to_zhou'))
        || (hasThing('苏晚亭疑似遗书') && !E.getFlag('presented_su_last_letter_to_zhou'))
        || (hasThing('半张烟盒纸') && !E.getFlag('presented_wang_note_to_zhou'))
        || ((hasThing('恐吓信') || hasThing('203 室恐吓信')) && !E.getFlag('presented_threat_to_zhou'));
    }

    function afterJadeChoices() {
      const out = [];
      if (hasMoreZhouEvidence()) {
        out.push({ text: '📨 继续拿出别的东西给周怀安看', goto: 'ch4_revisit_zhou' });
      }
      out.push({ text: '🔙 暂时不打扰他，回去整理下一步', goto: 'ch3_wrapup' });
      return out;
    }

    if (!nodes.ch4_zhou_present_jade) {
      nodes.ch4_zhou_present_jade = {
        title: '举证 · 翡翠镯',
        weather: 5,
        effect: () => {
          E.setFlag('presented_jade_to_zhou', true);
          E.addClue('周怀安识出陆念', '周怀安看到翡翠镯和当票后，说“陆念”这个名字不像是凭空来的，陆小姐与旧案之间的联系更重了。');
        },
        text: () => `你把翡翠镯放在校样旁边。<br><br>周怀安先是一怔，随后把镯子拿近了些。灯光从玉色里透过去，照出一圈冷冷的绿。<br><br><span class="sys">“陆念……”</span><br><br>他低声念出当票上的名字。<br><br><span class="sys">“晚亭以前没有跟我提过这个人。但她失踪前那阵子，确实常常像是在替谁担心。”</span><br><br>翡翠镯没有直接告诉你苏晚亭在哪里，也不能证明陆小姐就是答案。<br><br>但它让“陆念”这个名字从纸面上浮了起来。这个名字不再只是当票上的两个字，而是一个会让周怀安沉默很久的影子。`,
        choices: afterJadeChoices
      };
    }

    if (!nodes.ch4_zhou_present_jade_premature) {
      nodes.ch4_zhou_present_jade_premature = {
        title: '举证 · 翡翠镯',
        weather: 5,
        effect: () => {
          E.setFlag('presented_jade_to_zhou_premature', true);
          E.addClue('周怀安看到翡翠镯', '周怀安看到翡翠镯和“陆念”这个名字，但这只能说明陆小姐可疑，还不能解释苏晚亭的去向。');
        },
        text: () => `你把翡翠镯放在周怀安面前。<br><br>他看了很久，最后只问了一句：<br><br><span class="sys">“这和晚亭有什么关系？”</span><br><br>你能说出的，只有当票、旧名和一些还没接上的碎片。<br><br>这只镯子让陆小姐变得更可疑，却不能把苏晚亭带回来，也不能替你解释陈明远为什么会死。<br><br>周怀安把镯子轻轻推回给你。<br><br><span class="sys">“沈先生，我要的不是一个可疑的名字。我要知道晚亭在哪里。”</span>`,
        choices: afterJadeChoices
      };
    }

    E.__zhouJadePresentNodeFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyZhouJadePresentNodeFix);
})();
