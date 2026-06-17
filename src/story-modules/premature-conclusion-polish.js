// ===== 证据不足路线收口 =====
// 目标：玩家过早从光华小学回到线索整理时，不再用“正常破案”口吻误导。
// 1) 光华小学后若证据链断裂，不允许倒回大学 / 苏家 / 巡捕房补课，坏路线成立。
// 2) 证据链不足时，结案页明确这是“证据不足的归档 / 冒然指认”，而不是正常收束。
// 3) 周怀安线可通过“陈明远的信 + 殉情误报”触发情感彩蛋结局，补足找人案件的委托人回响。
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

    if (nodes.ch4_pawnshop && !nodes.ch4_pawnshop.__prematurePawnshopPatched) {
      const oldEffect = nodes.ch4_pawnshop.effect;
      const oldText = nodes.ch4_pawnshop.text;
      const oldChoices = nodes.ch4_pawnshop.choices;

      nodes.ch4_pawnshop.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (isPrematureConclusion()) {
          E.addItem('小报剪报', '包着翡翠镯的旧小报剪角，标题写着“苏姓女学生疑为情殉身”。');
          E.addClue('殉情误报', '小报把苏晚亭的失踪写成“为情殉身”，替她编了一个错误结局。');
        }
      };

      nodes.ch4_pawnshop.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!isPrematureConclusion()) return base;
        return `${base}<br><br>掌柜重新包好镯子时，用的是一张旧小报。你本想随手扔掉，却在纸角看到一行刺眼的标题：<br><br><span class="sys">“苏姓女学生疑为情殉身，陈姓教员旧信曝光。”</span><br><br>报道写得含糊又轻佻，把苏晚亭写成一个为情赴死的影子。没有福生仓，没有光华小学，没有沈玉芳，甚至没有“失踪”两个字。<br><br>你忽然意识到，如果你查不到她在哪里，别人会替她写完结局。`;
      };

      nodes.ch4_pawnshop.choices = function (state) {
        return choicesOf(oldChoices, state).map(choice => {
          if (isPrematureConclusion() && choice.goto === 'ch4_revisit_zhou') {
            return { ...choice, text: '🏮 回访周怀安——带去翡翠镯和那张小报剪报' };
          }
          return choice;
        });
      };

      nodes.ch4_pawnshop.__prematurePawnshopPatched = true;
    }

    if (nodes.ch4_revisit_zhou && !nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched) {
      const oldOnPresent = nodes.ch4_revisit_zhou.onPresent;
      const oldText = nodes.ch4_revisit_zhou.text;

      nodes.ch4_revisit_zhou.onPresent = function (item, state) {
        if (isPrematureConclusion() && item.name === '翡翠镯' && !E.getFlag('presented_jade_to_zhou_premature')) {
          E.setFlag('presented_jade_to_zhou_premature', true);
          return { goto: 'ch4_zhou_present_jade_premature' };
        }
        if (item.name === '陈明远的信' && !E.getFlag('presented_chen_letter_to_zhou')) {
          E.setFlag('presented_chen_letter_to_zhou', true);
          return { goto: 'end_zhou_chen_letter' };
        }
        return typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
      };

      nodes.ch4_revisit_zhou.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.hasItem('陈明远的信') && isPrematureConclusion()) {
          const clipping = E.hasItem('小报剪报')
            ? '你怀里还有那张小报剪报。它已经替苏晚亭写好了“殉情”的死因。'
            : '你怀里没有足够的证据，只有陈明远那封没有寄出的信。';
          return `${base}<br><br><span class="sys">${clipping} 陈明远的信开头是“晚亭吾爱”。它未必能帮你找到苏晚亭，却足以让周怀安明白：这个案子若就此收束，苏晚亭会被永远写进一个错误故事里。</span>`;
        }
        return base;
      };

      nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched = true;
    }

    if (!nodes.ch4_zhou_present_jade_premature) {
      nodes.ch4_zhou_present_jade_premature = {
        title: '举证 · 翡翠镯',
        weather: 5,
        effect: () => {
          E.addClue('周怀安识出陆念', '周怀安从翡翠镯上确认“陆念”这个名字，但这仍不能回答苏晚亭在哪里。');
        },
        text: () => `你把翡翠镯放在周怀安面前。<br><br>他看到内侧刻着的“陆念”时，脸色变了一下。<br><br><span class="sys">“晚亭提过这个名字。”</span><br><br>他告诉你，苏晚亭失踪前确实说过“陆念”这个名字，也说过一个人换了名字，过去犯过的错是不是也能一笔勾销。<br><br>这能证明陆小姐不是普通过客，却仍然回答不了最要紧的问题：苏晚亭在哪里？她是否还活着？<br><br>周怀安看向你，声音比刚才更低：<span class="sys">“沈先生，还有别的吗？有她自己的消息吗？”</span>`,
        choices: [
          { text: '📨 如果还有陈明远的信，就拿出来', goto: 'ch4_revisit_zhou' },
          { text: '🔙 暂时回去整理现有证据', goto: 'ch4_conclusion' }
        ]
      };
    }

    if (!nodes.end_zhou_chen_letter) {
      nodes.end_zhou_chen_letter = {
        title: '结局 · 吾爱晚亭',
        weather: 5,
        effect: () => {
          E.addClue('周怀安读到陈明远的信', '周怀安读到“晚亭吾爱”，又看到小报“殉情”误报，终于明白苏晚亭正在被写进一个错误结局。');
          E.setFlag('zhou_chen_letter_easter_egg', true);
        },
        text: () => {
          const clipping = E.hasItem('小报剪报')
            ? `你先把那张小报剪报放在桌上。标题很轻佻：<br><br><span class="sys">“苏姓女学生疑为情殉身。”</span><br><br>周怀安看了很久，像没有读懂，又像太早读懂了。`
            : `你没有找到苏晚亭，也没有拿到能证明她去向的关键线索。你只剩下一封没有寄出的信。`;
          return `${clipping}<br><br>然后你把陈明远那封未寄出的信放在剪报旁边。<br><br>周怀安看到开头四个字时，手指停住了。<br><br><span class="sys">“晚亭吾爱。”</span><br><br>办公室里很安静，只有排字房远处传来铅字碰撞的声音。周怀安读得很慢。读到陈明远写“别替我原谅我”的时候，他把信纸放回桌上，像忽然老了几岁。<br><br><span class="sys">“他们说她殉情。”</span><br><br>他说。<br><br><span class="sys">“可这封信里，她不是去死。她是在找人，也是在救人。”</span><br><br>这不是背叛带来的滑稽，也不是谁输给了谁。只是一个爱着苏晚亭的人，终于看见：苏晚亭不是任何人的附属，也不是小报上的“情死女学生”。她曾经选择、隐瞒、害怕，也曾经爱过别人。<br><br>周怀安把剪报折起来，压在信下面。<br><br><span class="sys">“沈先生，案子可以归档，报纸可以乱写。但请你记住，她不是这样结束的。”</span><br><br>你走出商务印书馆时，雨又落了下来。你知道这条路已经断了几处，真相也许再也拼不完整。可至少有一件事被照亮了：苏晚亭不是谜面，她是活过的人。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 吾爱晚亭（彩蛋）——</div>`;
        },
        type: 'end'
      };
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();
