// ===== 周怀安连续举证节点兜底 =====
// 目标：present-flow-cleanup 会把周怀安回访改成连续举证面板。
// 这些选项会跳到 ch4_zhou_present_jade / jade_premature / chen_letter / su_last_letter
// / wang_note / threat 等节点。旧剧情或补丁里并不总能保证这些节点存在，
// 会导致点击选项后场景丢失，用户看到类似回到开头/重开的异常。
// 本模块补齐所有周怀安举证目标节点，不改变主线证据判定。

(function installZhouJadePresentNodeFix() {
  function applyZhouJadePresentNodeFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__zhouJadePresentNodeFixPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasMoreZhouEvidence() {
      return (hasThing('翡翠镯') && !E.getFlag('presented_jade_to_zhou') && !E.getFlag('presented_jade_to_zhou_premature'))
        || (hasThing('陈明远的信') && !E.getFlag('presented_chen_letter_to_zhou'))
        || (hasThing('陈明远残信') && !E.getFlag('presented_chen_letter_to_zhou'))
        || (hasThing('苏晚亭疑似遗书') && !E.getFlag('presented_su_last_letter_to_zhou'))
        || (hasThing('苏晚亭的遗书') && !E.getFlag('presented_su_last_letter_to_zhou'))
        || (hasThing('苏晚亭的伪造遗书') && !E.getFlag('presented_su_last_letter_to_zhou'))
        || (hasThing('半张烟盒纸') && !E.getFlag('presented_wang_note_to_zhou'))
        || ((hasThing('恐吓信') || hasThing('203 室恐吓信')) && !E.getFlag('presented_threat_to_zhou'));
    }

    function afterEvidenceChoices() {
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
        choices: afterEvidenceChoices
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
        choices: afterEvidenceChoices
      };
    }

    if (!nodes.ch4_zhou_present_chen_letter) {
      nodes.ch4_zhou_present_chen_letter = {
        title: '举证 · 陈明远的信',
        weather: 5,
        effect: () => {
          E.setFlag('presented_chen_letter_to_zhou', true);
          E.addClue('周怀安读到陈明远的信', '周怀安读到陈明远留给苏晚亭的信，确认苏晚亭不是无故失踪，而是在追一件危险的事。');
        },
        text: () => {
          const altered = hasThing('陈明远残信') || E.getFlag('chen_letter_packet_altered');
          if (altered) {
            return `你把陈明远那封残信递过去。<br><br>周怀安先看见开头的四个字：<span class="sys">“晚亭吾爱。”</span><br><br>他的眼神停住了。信纸下半截缺失，留下的只有学校、箱子、恐吓、203，还有一通不该相信的电话。<br><br>这封信没有把案子讲完，却足够说明：苏晚亭不是无缘无故失踪，她追着陈明远留下的碎片，走进了一团更深的雾。`;
          }
          return `你把陈明远那封未寄出的信递给周怀安。<br><br>他读得很慢，读到“不要相信第一通电话”时，手指在纸边停了一下。<br><br><span class="sys">“晚亭不是自己走的。”</span><br><br>周怀安抬起头，声音发哑。<br><br><span class="sys">“她是在替别人追一个答案。陈老师把线索留给她，她就一定会继续往下查。”</span><br><br>这封信没有给出完整真相，却让周怀安明白：苏晚亭的失踪不能被写成私情，也不能被写成逃离。`;
        },
        choices: afterEvidenceChoices
      };
    }

    if (!nodes.ch4_zhou_present_su_last_letter) {
      nodes.ch4_zhou_present_su_last_letter = {
        title: '举证 · 疑似遗书',
        weather: 5,
        effect: () => {
          E.setFlag('presented_su_last_letter_to_zhou', true);
          E.addClue('周怀安读到苏晚亭疑似遗书', '周怀安读到疑似苏晚亭留下的遗书，但这份纸页是否可信，仍要看苏家与其他证据能否对上。');
        },
        text: () => `你把那张疑似苏晚亭留下的遗书推过去。<br><br>周怀安看得很慢。第一遍，他像是不相信那是苏晚亭的字；第二遍，他又像是在逼自己承认一种更容易承受的答案。<br><br>可你也知道，这张纸太安静，安静得像有人替所有人把结论写好。<br><br>它可以成为疑点，却不能独自替苏晚亭作证。`,
        choices: afterEvidenceChoices
      };
    }

    if (!nodes.ch4_zhou_present_wang_note) {
      nodes.ch4_zhou_present_wang_note = {
        title: '举证 · 半张烟盒纸',
        weather: 5,
        effect: () => {
          E.setFlag('presented_wang_note_to_zhou', true);
          E.addClue('周怀安看到王巡官纸条', '周怀安看到“福生仓，三日清；别信公董局来的电话”，确认这不是普通失踪案。');
        },
        text: () => `你把那半张烟盒纸放在校样旁边。<br><br>周怀安盯着上面的字：<span class="sys">“福生仓。三日清。别信公董局来的电话。”</span><br><br>他抬头看你，声音压得很低。<br><br><span class="sys">“晚亭不是会无缘无故失踪的人。若连巡捕房里的人都留下这种话，她一定是碰到了不能碰的东西。”</span>`,
        choices: afterEvidenceChoices
      };
    }

    if (!nodes.ch4_zhou_present_threat) {
      nodes.ch4_zhou_present_threat = {
        title: '举证 · 恐吓信',
        weather: 5,
        effect: () => {
          E.setFlag('presented_threat_to_zhou', true);
          E.addClue('周怀安看到恐吓信', '周怀安看到 203 室恐吓信，意识到苏晚亭接触的人都在被威胁。');
        },
        text: () => `你把 203 室找到的恐吓信推过去。<br><br><span class="sys">“我知道那晚你看到了什么。如果你不说，他们下一个就是你。”</span><br><br>周怀安的脸色一点点白下去。<br><br><span class="sys">“她不是自己走的。”</span><br><br>他说得很慢，像是在逼自己承认这句话真正意味着什么。`,
        choices: afterEvidenceChoices
      };
    }

    E.__zhouJadePresentNodeFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyZhouJadePresentNodeFix);
})();
