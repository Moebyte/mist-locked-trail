// ===== 周怀安连续举证节点兜底 =====
// 目标：present-flow-cleanup 会把周怀安回访改成连续举证面板。
// 这些选项会跳到 ch4_zhou_present_jade / jade_premature / chen_letter / su_last_letter
// / wang_note / threat 等节点。旧剧情或补丁里并不总能保证这些节点存在，
// 会导致点击选项后场景丢失，用户看到类似回到开头/重开的异常。
// 本模块补齐所有周怀安举证目标节点，并补清“为什么要拿翡翠镯问周怀安”：
// 不是让他鉴定手镯，而是问苏晚亭是否曾向未婚夫提过“陆念”这个名字。

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

    function patchPawnshopMotivation() {
      if (!nodes.ch4_pawnshop || nodes.ch4_pawnshop.__zhouJadeMotivationPatched) return;
      const oldText = nodes.ch4_pawnshop.text;
      const oldChoices = nodes.ch4_pawnshop.choices;
      nodes.ch4_pawnshop.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br>真正值得追问的，不只是这只镯子值多少钱，而是内侧那两个字：<span class="sys">“陆念”</span>。<br><br>苏晚亭失踪前有没有向周怀安提过这个名字？她有没有说过改名、旧案、一个人能不能摆脱过去？周怀安未必认识镯子，却可能记得苏晚亭说过的话。`;
      };
      nodes.ch4_pawnshop.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(base)) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_revisit_zhou' || String(choice.text || '').includes('回访周怀安')) {
            return { ...choice, text: '🏮 回访周怀安——问他是否听苏晚亭提过“陆念”' };
          }
          return choice;
        });
      };
      nodes.ch4_pawnshop.__zhouJadeMotivationPatched = true;
    }

    patchPawnshopMotivation();

    if (!nodes.ch4_zhou_present_jade) {
      nodes.ch4_zhou_present_jade = {
        title: '举证 · 翡翠镯',
        weather: 5,
        effect: () => {
          E.setFlag('presented_jade_to_zhou', true);
          E.addClue('周怀安识出陆念', '周怀安看到翡翠镯和当票后，想起苏晚亭曾提过“陆念”和改名的话题，说明苏晚亭早已注意到陆小姐的旧名。');
        },
        text: () => `你把翡翠镯放在校样旁边，没有急着问它是谁的。<br><br>你只是把镯子内侧翻给周怀安看。<br><br><span class="sys">“陆念。”</span><br><br>你问他：<span class="sys">“苏小姐失踪前，有没有对你提过这个名字？”</span><br><br>周怀安原本茫然的眼神，慢慢变了。<br><br><span class="sys">“她没有拿给我看过这只镯子。”</span><br><br>他停了一下，像是在回想一个当时被自己轻轻放过去的细节。<br><br><span class="sys">“但她提过这个名字。她说，如果一个人换了名字，过去犯过的错是不是也能一笔勾销。我当时以为她在说论文里的女性人物，没有追问。”</span><br><br>翡翠镯没有直接告诉你苏晚亭在哪里，也不能证明陆小姐就是答案。<br><br>但它让“陆念”这个名字从当票和玉镯上，转到了苏晚亭生前说过的话里。苏晚亭早就注意到了陆小姐的旧名。`,
        choices: afterEvidenceChoices
      };
    } else if (!nodes.ch4_zhou_present_jade.__zhouJadeMotivationPatched) {
      const oldEffect = nodes.ch4_zhou_present_jade.effect;
      nodes.ch4_zhou_present_jade.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.setFlag('presented_jade_to_zhou', true);
        E.addClue('周怀安识出陆念', '周怀安看到翡翠镯和当票后，想起苏晚亭曾提过“陆念”和改名的话题，说明苏晚亭早已注意到陆小姐的旧名。');
      };
      nodes.ch4_zhou_present_jade.text = () => `你把翡翠镯放在校样旁边，没有急着问它是谁的。<br><br>你只是把镯子内侧翻给周怀安看。<br><br><span class="sys">“陆念。”</span><br><br>你问他：<span class="sys">“苏小姐失踪前，有没有对你提过这个名字？”</span><br><br>周怀安原本茫然的眼神，慢慢变了。<br><br><span class="sys">“她没有拿给我看过这只镯子。”</span><br><br>他停了一下，像是在回想一个当时被自己轻轻放过去的细节。<br><br><span class="sys">“但她提过这个名字。她说，如果一个人换了名字，过去犯过的错是不是也能一笔勾销。我当时以为她在说论文里的女性人物，没有追问。”</span><br><br>翡翠镯没有直接告诉你苏晚亭在哪里，也不能证明陆小姐就是答案。<br><br>但它让“陆念”这个名字从当票和玉镯上，转到了苏晚亭生前说过的话里。苏晚亭早就注意到了陆小姐的旧名。`;
      nodes.ch4_zhou_present_jade.choices = afterEvidenceChoices;
      nodes.ch4_zhou_present_jade.__zhouJadeMotivationPatched = true;
    }

    if (!nodes.ch4_zhou_present_jade_premature) {
      nodes.ch4_zhou_present_jade_premature = {
        title: '举证 · 翡翠镯',
        weather: 5,
        effect: () => {
          E.setFlag('presented_jade_to_zhou_premature', true);
          E.addClue('周怀安看到翡翠镯', '周怀安看到翡翠镯和“陆念”这个名字，但这只能说明苏晚亭可能听过陆念，还不能解释她的去向。');
        },
        text: () => `你把翡翠镯放在周怀安面前。<br><br>你问他，苏晚亭有没有提过<span class="sys">“陆念”</span>这个名字。<br><br>周怀安看了很久，最后只说：<br><br><span class="sys">“我好像听她说过一次。可这和晚亭失踪有什么关系？”</span><br><br>你能说出的，只有当票、旧名和一些还没接上的碎片。<br><br>这只镯子让陆小姐变得更可疑，却不能把苏晚亭带回来，也不能替你解释陈明远为什么会死。<br><br>周怀安把镯子轻轻推回给你。<br><br><span class="sys">“沈先生，我要的不是一个可疑的名字。我要知道晚亭在哪里。”</span>`,
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
