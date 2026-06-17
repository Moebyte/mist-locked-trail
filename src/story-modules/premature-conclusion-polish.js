// ===== 证据不足路线收口 =====
// 目标：玩家过早从光华小学回到线索整理时，不再用“正常破案”口吻误导。
// 1) 光华小学后若证据链断裂，不允许倒回大学 / 苏家 / 巡捕房补课，坏路线成立。
// 2) 证据链不足时，结案页明确这是“证据不足的归档 / 冒然指认”，而不是正常收束。
// 3) 周怀安线可通过陈明远的信触发情感彩蛋结局，补足委托人回响。
(function installPrematureConclusionPolish() {
  function applyPrematureConclusionPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__prematureConclusionPolishPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function hasLandlordFushengLead() {
      return E.getFlag('shown_map_to_landlord')
        || E.hasClue('福生仓标识')
        || E.hasClue('福生仓位置')
        || E.hasItem('福生仓地址');
    }

    function hasWangNote() {
      return E.getFlag('got_wang_note') || E.hasClue('王巡官遗留纸条') || E.hasItem('半张烟盒纸');
    }

    function hasReachedFushengCore() {
      return E.getFlag('deduced_fusheng')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.hasClue('推理结论：法租界利益链');
    }

    function isPrematureConclusion() {
      return !hasWangNote() || !hasReachedFushengCore();
    }

    function missingEvidenceText() {
      if (!hasUniversityXuehuaLead()) return '你没有查过圣约翰大学，苏晚亭失踪前真正去过哪里仍是空白。';
      if (!hasLandlordFushengLead()) return '你没有查清薛华立路地图标记背后的仓库名。';
      if (!hasWangNote()) return '你没有拿到王巡官留下的半张烟盒纸，福生仓线索仍然接不上。';
      return '你没有推明白福生仓与光华小学、公董局之间的关系。';
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__prematureWrapupPatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const out = [];
        for (const choice of choicesOf(oldChoices, state)) {
          const text = choice.text || choice.fogText || '';
          const isOldWangShortcut = choice.goto === 'ch2_police_wang' || text.includes('王巡官的批注');
          const isFushengEntry = choice.goto === 'ch4_suzhou_creek' || text.includes('福生仓') || text.includes('苏州河废弃码头');
          const isConclusion = choice.goto === 'ch4_conclusion' || text.includes('回顾所有证据');

          if (isPrematureConclusion() && (isOldWangShortcut || isFushengEntry)) continue;

          if (isConclusion && isPrematureConclusion()) {
            out.push({ ...choice, text: '🔙 回顾现有证据（证据链仍不完整）' });
            continue;
          }

          out.push(choice);
        }
        return out;
      };
      nodes.ch3_wrapup.__prematureWrapupPatched = true;
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__prematureConclusionChoicesPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!isPrematureConclusion()) return base;
        return `${base}<br><br><div class="notice"><b>⚠️ 证据链不足</b><br>${missingEvidenceText()}<br>现在回头已经来不及了：关键线索没有在正确时间接上。你可以整理手头材料，但这只会得到一个不完整甚至错误的收束。</div>`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        const choices = choicesOf(oldChoices, state);
        if (!isPrematureConclusion()) return choices;
        return [
          { text: '📁 证据不足，暂时归档此案', goto: 'end_archive' },
          { text: '⚠️ 证据不足，仍要冒然指认嫌疑人', goto: 'ch4_accuse' }
        ];
      };
      nodes.ch4_conclusion.__prematureConclusionChoicesPatched = true;
    }

    if (nodes.ch4_revisit_zhou && !nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched) {
      const oldOnPresent = nodes.ch4_revisit_zhou.onPresent;
      const oldText = nodes.ch4_revisit_zhou.text;

      nodes.ch4_revisit_zhou.onPresent = function (item, state) {
        if (item.name === '陈明远的信' && !E.getFlag('presented_chen_letter_to_zhou')) {
          E.setFlag('presented_chen_letter_to_zhou', true);
          return { goto: 'end_zhou_chen_letter' };
        }
        return typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
      };

      nodes.ch4_revisit_zhou.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.hasItem('陈明远的信') && isPrematureConclusion()) {
          return `${base}<br><br><span class="sys">你怀里还有陈明远那封没有寄出的信。信的开头是“晚亭吾爱”。它未必能帮你找到苏晚亭，却足以让周怀安明白：他委托你寻找的人，有一部分人生从未向他打开过。</span>`;
        }
        return base;
      };

      nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched = true;
    }

    if (!nodes.end_zhou_chen_letter) {
      nodes.end_zhou_chen_letter = {
        title: '彩蛋 · 吾爱晚亭',
        weather: 5,
        effect: () => {
          E.addClue('周怀安读到陈明远的信', '周怀安读到“晚亭吾爱”，终于明白苏晚亭与陈明远之间有一段自己从未真正触及的关系。');
          E.setFlag('zhou_chen_letter_easter_egg', true);
        },
        text: () => `你没有先拿出翡翠镯。<br><br>你把那封未寄出的信放在周怀安面前。<br><br>他看到开头四个字时，手指停住了。<br><br><span class="sys">“晚亭吾爱。”</span><br><br>办公室里很安静，只有排字房远处传来铅字碰撞的声音。周怀安读得很慢。读到陈明远写“别替我原谅我”的时候，他把信纸放回桌上，像忽然老了几岁。<br><br><span class="sys">“我一直以为，我是在找一个被世界夺走的人。”</span><br><br>他说。<br><br><span class="sys">“原来我连她真正走进哪一场雾里，都不知道。”</span><br><br>这不是背叛带来的滑稽，也不是谁输给了谁。只是一个爱着苏晚亭的人，终于看见：苏晚亭不是任何人的附属，也不是等待营救的影子。她曾经选择、隐瞒、害怕，也曾经爱过别人。<br><br>周怀安把信推回给你。<br><br><span class="sys">“沈先生，继续找她吧。不是为了我。为了她自己。”</span><br><br>你走出商务印书馆时，雨又落了下来。你知道这条路已经断了几处，真相也许再也拼不完整。可至少有一件事被照亮了：苏晚亭不是谜面，她是活过的人。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 彩蛋 · 吾爱晚亭 ——</div>`,
        type: 'end'
      };
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();
