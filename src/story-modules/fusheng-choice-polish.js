// ===== 福生仓选项与结局收口 =====
// 目标：收束福生仓后段选项，并让同一结局按实际路线显示不同文案。
(function installFushengChoicePolish() {
  function applyFushengChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

    const escapeNode = nodes.ch4_dock_escape;
    if (escapeNode && !escapeNode.__fushengChoicePolishPatched) {
      function fullSupportAtDock() {
        return E.getFlag('sun_full_support')
          || E.getFlag('sun_wait_support')
          || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
      }

      const oldChoices = escapeNode.choices;
      escapeNode.choices = function (state) {
        const choices = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(choices)) return [];
        if (!fullSupportAtDock()) return choices;

        return choices.filter(choice => {
          const text = choice.text || '';
          return !(choice.goto === 'ch4_fu_confront'
            && text.includes('老孙的人')
            && text.includes('亮明身份'));
        });
      };

      escapeNode.__fushengChoicePolishPatched = true;
    }

    const hiddenEnding = nodes.end_conspiracy_detail;
    if (hiddenEnding && !hiddenEnding.__routeAwareLetterPatched) {
      hiddenEnding.text = () => {
        const rescuedSu = E.getFlag('rescued_su');
        const suLine = rescuedSu
          ? '苏晚亭在医院醒来后，亲手写下了她在福生仓听见的名字：傅启元。'
          : '苏晚亭仍在转移途中，但她留在福生仓的学生证和字条，足以证明她不是自行离沪。';
        const closingLetter = rescuedSu
          ? `一个月后，周怀安替苏晚亭送来一封信。信上只有一行字：<br><br><span class="sys">"沈先生，谢谢你先找人，而不是先找凶手。——苏晚亭"</span>`
          : `一个月后，周怀安来找你。他带来一页从医院病房转出的短笺，纸边还压着药水味。<br><br>他说，苏晚亭已经知道你姓沈，也知道是你先把福生仓这条线捅到光下。她没有见过你，只托他带一句话：<br><br><span class="sys">"请替我谢谢那位沈先生。他先找的是人，不只是凶手。——苏晚亭"</span>`;

        return `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关在福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>${suLine}<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》头版刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。<br><br>报道第一次点出了傅启元的名字。<br><br>又过了三天，福生仓被查封。傅启元以“协助调查”的名义被带走。公董局没有承认任何事，但他们也没能让这件事完全消失。<br><br>${closingLetter}<br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局九 · 雨夜灯火（隐藏结局）——</div>`;
      };
      hiddenEnding.__routeAwareLetterPatched = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyFushengChoicePolish);
})();
