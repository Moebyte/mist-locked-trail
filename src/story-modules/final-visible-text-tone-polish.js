// ===== 最终玩家可见文案清扫 =====
// 目标：在所有剧情模块加载后，再清理一次玩家可见文本，避免残留开发者视角、路线术语、说明书口吻。
(function installFinalVisibleTextTonePolish() {
  function applyFinalVisibleTextTonePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__finalVisibleTextTonePolishPatched) return;

    const replacements = [
      ['<b>⚠️ 证据链不足</b>', '<b>⚠️ 仍有疑点未合</b>'],
      ['现在回头已经来不及了：关键线索没有在正确时间接上。你可以整理手头材料，但这只会得到一个不完整甚至错误的收束。', '你知道有几处线还没有接上。若现在收手，这个案子只会留下一个说得过去、却未必站得住的结论。'],
      ['现在还不是结案的时候：福生仓线索已经浮出水面，继续追查才是正路。', '你心里清楚：福生仓已经浮出水面，现在收手太早。'],
      ['<b>⛵ 仍可继续追查</b><br>翡翠镯只能证明陆念这条旁线，真正决定案子走向的是福生仓。现在应回到线索整理，继续去码头或找老孙支援。', '<b>⛵ 雾还没散</b><br>翡翠镯只能照亮陆念这条旁线，福生仓那扇门还没打开。你还可以去码头，或者先找老孙商量。'],
      ['<b>光华小学线索只到表层</b><br>你选择按现有材料整理结案。', '<b>雾只散到这里</b><br>你把现有材料收进案卷。'],
      ['<b>话还没有压到底</b><br>', '<b>话还留着半截</b><br>'],
      ['现在的材料足够让吴校长改口，却还不足以逼他把学校背后的那层关系放到桌面上。你可以继续追问，也可以接受这个更容易被写进案卷的说法。', '这些东西足够让吴校长改口，却还不足以让他把学校背后的人都说出来。你可以继续逼问，也可以把眼前这套最容易被接受的说法带回去。'],
      ['<b>调查进度</b>', '<b>案头记号</b>'],
      ['现在你掌握的信息足够去追查真相了。', '现在你掌握的信息已经足够继续往雾里走。']
    ];

    const choiceRewrites = new Map([
      ['⚠️ 线索还断着，却仍决定指认一个人', '⚠️ 线还没合上，却仍要指认一个人'],
      ['⚠️ 明知线索还断着，仍要指认嫌疑人', '⚠️ 明知线还断着，仍要指认一个人'],
      ['⛵ 福生仓还没查完，继续追下去', '⛵ 福生仓还没查清，继续追下去'],
      ['⛵ 福生仓还没查清——继续追下去', '⛵ 福生仓还没查清，继续追下去'],
      ['📁 接受这个较容易成立的说法，回去整理结案', '📁 接受这个更容易被写进案卷的说法'],
      ['📁 接受这个较容易成立的说法', '📁 接受这个更容易被写进案卷的说法'],
      ['🔙 把手头材料重新摊开', '🔙 把桌上的材料重新摊开'],
      ['📁 暂时把案卷压进抽屉', '📁 先把案卷压进抽屉']
    ]);

    function polishText(value) {
      let out = String(value == null ? '' : value);
      for (const [from, to] of replacements) out = out.split(from).join(to);
      return out;
    }

    function polishChoices(raw) {
      if (!Array.isArray(raw)) return raw;
      return raw.map(choice => {
        const text = choice?.text || '';
        return choiceRewrites.has(text) ? { ...choice, text: choiceRewrites.get(text) } : choice;
      });
    }

    function patchNodeText(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__finalToneTextPatched) return;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return polishText(base);
      };
      node.__finalToneTextPatched = true;
    }

    function patchNodeChoices(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__finalToneChoicesPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return polishChoices(base || []);
      };
      node.__finalToneChoicesPatched = true;
    }

    [
      'ch3_school_confront_wu',
      'ch3_school_incomplete_closure',
      'ch3_wrapup',
      'ch4_conclusion',
      'ch4_accuse',
      'ch4_pawnshop',
      'ch4_revisit_zhou',
      'ch4_zhou_present_jade',
      'ch4_zhou_present_jade_premature',
      'ch4_zhou_present_chen_letter',
      'ch4_zhou_present_su_last_letter'
    ].forEach(id => { patchNodeText(id); patchNodeChoices(id); });

    E.__finalVisibleTextTonePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFinalVisibleTextTonePolish);
})();