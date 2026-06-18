// ===== 周怀安坏路线结局收束 =====
// 目标：《吾爱晚亭》作为证据不足路线，应让周怀安接受“晚亭为情而去”的不完整结论。
// 坏路线里玩家拿到的是被整理过的信封：陈明远残信 + 苏晚亭疑似遗书。
// 它们不是玩家当场能识破的“假道具”，而是足以误导周怀安的错误答案。

(function installZhouEndingPolish() {
  function applyZhouEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__zhouEndingPolishPatched) return;

    function zhouHasBothLetters() {
      return E.getFlag('presented_chen_letter_to_zhou') && E.getFlag('presented_su_last_letter_to_zhou');
    }

    function zhouLetterReturnChoices() {
      if (zhouHasBothLetters()) {
        return [{ text: '🕯️ 把残信和疑似遗书并在一起，听他说完', goto: 'end_zhou_chen_letter' }];
      }
      if (E.getFlag('presented_chen_letter_to_zhou') && !E.getFlag('presented_su_last_letter_to_zhou')) {
        return [{
          text: '📨 把那封疑似遗书也推过去',
          effect: () => E.setFlag('presented_su_last_letter_to_zhou', true),
          goto: 'ch4_zhou_present_su_last_letter'
        }];
      }
      if (E.getFlag('presented_su_last_letter_to_zhou') && !E.getFlag('presented_chen_letter_to_zhou')) {
        return [{
          text: '📨 再把陈明远残信递过去',
          effect: () => E.setFlag('presented_chen_letter_to_zhou', true),
          goto: 'ch4_zhou_present_chen_letter'
        }];
      }
      return [{ text: '📨 再想想该先拿出哪封信', goto: 'ch4_revisit_zhou' }];
    }

    if (nodes.ch4_zhou_present_chen_letter) {
      nodes.ch4_zhou_present_chen_letter.text = () => `你把陈明远那封残信递过去。<br><br>周怀安先看见开头的四个字：<span class="sys">“晚亭吾爱。”</span><br><br>他的眼神在那四个字上停住，像是终于在雾里抓到一根能解释所有事的线。<br><br>信纸下半截缺了，留下的话并不完整：学校、箱子、恐吓、203，还有一通不该相信的电话。可对周怀安来说，最刺眼的不是缺口，而是称呼。<br><br><span class="sys">“他这样叫她。”</span><br><br>他说得很轻，像怕惊动什么。<br><br>这封信没有把案子讲完，却足够把周怀安的心往另一个方向推过去。`;
      nodes.ch4_zhou_present_chen_letter.choices = zhouLetterReturnChoices;
    }

    if (nodes.ch4_zhou_present_su_last_letter) {
      nodes.ch4_zhou_present_su_last_letter.effect = () => {
        E.addClue('周怀安读到苏晚亭疑似遗书', '周怀安读到疑似苏晚亭留下的遗书，被“为情而去”的说法击中。');
      };
      nodes.ch4_zhou_present_su_last_letter.text = () => `你把那张疑似苏晚亭留下的遗书推过去。<br><br>周怀安看得很慢。第一遍，他像是不相信那是苏晚亭的字；第二遍，他又像是终于找到了一个可以解释一切的答案。<br><br><span class="sys">“她……原来已经把话说到这一步了。”</span><br><br>他的手指压在那句<span class="sys">“此身既已入雾，愿随他而去”</span>上，指节一点点发白。<br><br>这封遗书太安静，安静得像有人替所有人把结论写好。可你手里的证据不够，不能当着他的面推翻它。<br><br>周怀安低声问：<span class="sys">“陈明远那封残信，也给我看看吧。我要知道她最后走向的人，到底是谁。”</span>`;
      nodes.ch4_zhou_present_su_last_letter.choices = zhouLetterReturnChoices;
    }

    if (!nodes.end_zhou_chen_letter) {
      nodes.end_zhou_chen_letter = {
        title: '结局 · 吾爱晚亭',
        type: 'end'
      };
    }

    nodes.end_zhou_chen_letter.effect = () => {
      E.addClue('周怀安接受两封信的结论', '周怀安同时读到陈明远残信中的“晚亭吾爱”和苏晚亭疑似遗书，接受了“为情而去”的不完整结论。');
      E.setFlag('zhou_chen_letter_easter_egg', true);
      E.setFlag('zhou_accepts_false_closure', true);
    };
    nodes.end_zhou_chen_letter.text = () => `你把残信和疑似遗书并排放在周怀安面前。<br><br>一封残信开头是：<span class="sys">“晚亭吾爱。”</span><br><br>另一张纸写着：<span class="sys">“此身既已入雾，愿随他而去。”</span><br><br>周怀安看了很久。先看残信，再看那封疑似遗书，最后又回到第一封。<br><br>他没有哭，也没有发怒。只是把背挺得很直，像一个人忽然明白自己已经迟到了很久。<br><br><span class="sys">“原来如此。”</span><br><br>他说。<br><br><span class="sys">“她不是被我弄丢的。她只是……早就走到我看不见的地方去了。”</span><br><br>你想提醒他，这只信封仍有太多空白：残信缺了下半截，薛华立路 22 号 203 室没有完全查清，那条被刻意擦掉的去向也没有重新接上。可是话到嘴边，你又停住了。<br><br>因为周怀安已经接受了这个结局。<br><br>接受苏晚亭爱过陈明远，接受她可能在绝望里选择离开，接受自己从未真正走进她的秘密。这个答案不完整，却足够让一个等待太久的人放下。<br><br>他把陈明远的残信折好，放在疑似遗书下面。这个动作很轻，像是把两个亡魂安置到同一只抽屉里。<br><br><span class="sys">“沈先生，案子可以归档了。”</span><br><br>他停了一下，又说：<br><br><span class="sys">“至少，我知道她最后不是一个人。”</span><br><br>你离开商务印书馆时，雨又落了下来。街边的铅字铺还亮着灯，印刷机在楼下轧轧作响，仿佛这座城每天都在替别人排好结局。<br><br>你没有找到苏晚亭。你也没有证明那封疑似遗书是真是假。<br><br>但周怀安已经相信了它。<br><br>雾没有散，只是有人选择不再往里走。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 吾爱晚亭 ——</div>`;

    E.__zhouEndingPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyZhouEndingPolish);
})();
