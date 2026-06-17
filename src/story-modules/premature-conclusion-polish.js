// ===== 证据不足路线收口 =====
// 目标：玩家过早从光华小学回到线索整理时，不再用“正常破案”口吻误导。
// 1) 光华小学后若关键前置断裂，不允许倒回大学 / 苏家 / 巡捕房补课，坏路线成立。
// 2) 坏路线可通过“陈明远的信 + 苏晚亭的遗书”触发《吾爱晚亭》；玩家初见时不知道遗书真伪。
// 3) 前置线索充足的正常路线不会获得苏晚亭的遗书，也不会被周怀安彩蛋截走。
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

    function isBadRouteLocked() {
      return !hasUniversityXuehuaLead() || !hasLandlordFushengLead() || !hasWangNote();
    }

    function isPrematureConclusion() {
      return isBadRouteLocked() || !hasReachedFushengCore();
    }

    function hasSuLastLetter() {
      return E.hasItem('苏晚亭的遗书') || E.hasItem('苏晚亭的伪造遗书');
    }

    function hasZhouBadRouteLetters() {
      return E.hasItem('陈明远的信') && hasSuLastLetter();
    }

    function missingEvidenceText() {
      if (!hasUniversityXuehuaLead()) return '你没有查过圣约翰大学，苏晚亭失踪前真正去过哪里仍是空白。';
      if (!hasLandlordFushengLead()) return '你没有查清薛华立路地图标记背后的仓库名。';
      if (!hasWangNote()) return '你没有拿到王巡官留下的半张烟盒纸，福生仓线索仍然接不上。';
      return '你没有推明白福生仓与光华小学、公董局之间的关系。';
    }

    function zhouHasBothLetters() {
      return E.getFlag('presented_chen_letter_to_zhou') && E.getFlag('presented_su_last_letter_to_zhou');
    }

    function zhouLetterReturnChoices() {
      if (zhouHasBothLetters()) return [{ text: '🕯️ 把两封信并在一起，听周怀安说完', goto: 'end_zhou_chen_letter' }];
      return [{ text: '📨 继续出示另一封信', goto: 'ch4_revisit_zhou' }];
    }

    if (nodes.ch3_chen_letter && !nodes.ch3_chen_letter.__suLastLetterPatched) {
      const oldEffect = nodes.ch3_chen_letter.effect;
      const oldText = nodes.ch3_chen_letter.text;
      nodes.ch3_chen_letter.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (isBadRouteLocked()) {
          E.addItem('苏晚亭的遗书', '夹在陈明远信封里的另一张纸，字迹像苏晚亭，内容把她的失踪解释为“为情而去”。');
          E.addClue('苏晚亭的遗书', '陈明远信封夹层里藏着一份疑似苏晚亭留下的遗书，把她的失踪指向“为情而去”。');
        }
      };
      nodes.ch3_chen_letter.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!isBadRouteLocked()) return base;
        return `${base}<br><br>你把信纸重新折好时，发现信封内层还有一道很浅的夹缝。里面藏着另一张纸。<br><br>纸上的字迹很像苏晚亭，句子却短得像被刻意压住：<br><br><span class="sys">“我自知愧对明远，也无颜再见周先生。此身既已入雾，愿随他而去。”</span><br><br>如果只看这张纸，苏晚亭像是主动走向了一场“殉情”。<br><br>可你手里的线索太少，还不能判断这封遗书是真是假。`;
      };
      nodes.ch3_chen_letter.__suLastLetterPatched = true;
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__prematureWrapupPatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const out = [];
        let hasZhouChoice = false;
        for (const choice of choicesOf(oldChoices, state)) {
          const text = choice.text || choice.fogText || '';
          const isOldWangShortcut = choice.goto === 'ch2_police_wang' || text.includes('王巡官的批注');
          const isFushengEntry = choice.goto === 'ch4_suzhou_creek' || text.includes('福生仓') || text.includes('苏州河废弃码头');
          const isConclusion = choice.goto === 'ch4_conclusion' || text.includes('回顾所有证据');

          if (isBadRouteLocked() && (isOldWangShortcut || isFushengEntry)) continue;

          if (isConclusion && isPrematureConclusion()) {
            if (isBadRouteLocked() && hasZhouBadRouteLetters() && !hasZhouChoice) {
              out.push({ text: '🏮 回访周怀安——带去陈明远的信和苏晚亭的遗书', goto: 'ch4_revisit_zhou' });
              hasZhouChoice = true;
            }
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
      const oldText = nodes.ch4_pawnshop.text;
      const oldChoices = nodes.ch4_pawnshop.choices;

      nodes.ch4_pawnshop.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!isBadRouteLocked()) return base;
        return `${base}<br><br>翡翠镯能证明“陆念”这个名字不是空穴来风，却仍然回答不了这个案子最要紧的问题：苏晚亭去了哪里，她是不是还活着。<br><br>你想到陈明远那封未寄出的信，也想到信封夹层里那张苏晚亭的遗书。它们比这只镯子更应该先给周怀安看；当铺只是旁证，不是这条坏路线的前置。`;
      };

      nodes.ch4_pawnshop.choices = function (state) {
        return choicesOf(oldChoices, state).map(choice => {
          if (isBadRouteLocked() && choice.goto === 'ch4_revisit_zhou') {
            return { ...choice, text: '🏮 回访周怀安——带去翡翠镯和两封信' };
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
        if (isBadRouteLocked() && item.name === '翡翠镯' && !E.getFlag('presented_jade_to_zhou_premature')) {
          E.setFlag('presented_jade_to_zhou_premature', true);
          return { goto: 'ch4_zhou_present_jade_premature' };
        }
        if (isBadRouteLocked() && item.name === '陈明远的信' && !E.getFlag('presented_chen_letter_to_zhou')) {
          E.setFlag('presented_chen_letter_to_zhou', true);
          return { goto: E.getFlag('presented_su_last_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_chen_letter' };
        }
        if (isBadRouteLocked() && (item.name === '苏晚亭的遗书' || item.name === '苏晚亭的伪造遗书') && !E.getFlag('presented_su_last_letter_to_zhou')) {
          E.setFlag('presented_su_last_letter_to_zhou', true);
          return { goto: E.getFlag('presented_chen_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_su_last_letter' };
        }
        return typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
      };

      nodes.ch4_revisit_zhou.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (isBadRouteLocked() && hasZhouBadRouteLetters()) {
          return `${base}<br><br><span class="sys">你怀里有两封互相撕扯的信：一封写着“晚亭吾爱”，让苏晚亭重新成为一个会爱、会怕、会选择的人；另一封像是她的遗书，把她压成一句“为情而去”的遗言。周怀安必须看见它们并在一起的样子。</span>`;
        }
        return base;
      };

      nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched = true;
    }

    if (!nodes.ch4_zhou_present_chen_letter) {
      nodes.ch4_zhou_present_chen_letter = {
        title: '举证 · 晚亭吾爱',
        weather: 5,
        effect: () => {
          E.addClue('周怀安读到陈明远的信', '周怀安读到“晚亭吾爱”，明白苏晚亭与陈明远之间有一段自己从未真正触及的关系。');
        },
        text: () => `你把陈明远那封未寄出的信放在周怀安面前。<br><br>他看到开头四个字时，手指停住了。<br><br><span class="sys">“晚亭吾爱。”</span><br><br>办公室里安静得只剩铅字碰撞的声音。周怀安读得很慢，读到陈明远写“别替我原谅我”的时候，他把信纸放回桌上，像忽然老了几岁。<br><br><span class="sys">“原来我连她真正走进哪一场雾里，都不知道。”</span><br><br>但这还不是全部。你还需要让他看见另一封信——那封看起来像苏晚亭留下的遗书。`,
        choices: zhouLetterReturnChoices
      };
    }

    if (!nodes.ch4_zhou_present_su_last_letter) {
      nodes.ch4_zhou_present_su_last_letter = {
        title: '举证 · 苏晚亭的遗书',
        weather: 5,
        effect: () => {
          E.addClue('周怀安否认遗书', '周怀安读到苏晚亭的遗书，却判断这不是苏晚亭会写出的文字。');
        },
        text: () => `你把那张疑似苏晚亭留下的遗书推过去。<br><br>周怀安只看了两行，就抬起头。<br><br><span class="sys">“这不是她。”</span><br><br>他的声音很轻，却没有犹豫。<br><br><span class="sys">“晚亭写信从不这样收尾。她不会说‘此身既已入雾’，她会说‘我还没想完’。”</span><br><br>这封遗书太顺从了，顺从得像一张盖好章的死亡证明。<br><br>但这还不是全部。你还需要让他看见陈明远那封信——那封让苏晚亭不再只是一个被写好结局的人。`,
        choices: zhouLetterReturnChoices
      };
    }

    nodes.ch4_zhou_present_jade_premature = {
      title: '举证 · 翡翠镯',
      weather: 5,
      effect: () => {
        E.addClue('周怀安识出陆念', '周怀安从翡翠镯上确认“陆念”这个名字，但这仍不能回答苏晚亭在哪里。');
      },
      text: () => `你把翡翠镯放在周怀安面前。<br><br>他看到内侧刻着的“陆念”时，脸色变了一下。<br><br><span class="sys">“晚亭提过这个名字。”</span><br><br>他告诉你，苏晚亭失踪前确实说过“陆念”这个名字，也说过一个人换了名字，过去犯过的错是不是也能一笔勾销。<br><br>这能证明陆小姐不是普通过客，却仍然回答不了最要紧的问题：苏晚亭在哪里？她是否还活着？<br><br>周怀安看向你，声音比刚才更低：<span class="sys">“沈先生，还有别的吗？有她自己的消息吗？”</span>`,
      choices: [
        { text: '📨 如果还有两封信，就拿出来', goto: 'ch4_revisit_zhou' },
        { text: '🔙 暂时回去整理现有证据', goto: 'ch4_conclusion' }
      ]
    };

    if (!nodes.end_zhou_chen_letter) {
      nodes.end_zhou_chen_letter = {
        title: '结局 · 吾爱晚亭',
        weather: 5,
        effect: () => {
          E.addClue('周怀安读到两封信', '周怀安同时读到陈明远的“晚亭吾爱”和苏晚亭的遗书，并判断那封遗书不是她真正的声音。');
          E.setFlag('zhou_chen_letter_easter_egg', true);
        },
        text: () => `你把两封信并排放在周怀安面前。<br><br>一封开头是：<span class="sys">“晚亭吾爱。”</span><br><br>另一封写着：<span class="sys">“此身既已入雾，愿随他而去。”</span><br><br>周怀安看了很久。先看陈明远的信，再看那封遗书，最后又回到第一封。<br><br><span class="sys">“这不是殉情。”</span><br><br>他说。<br><br><span class="sys">“如果她真的要随谁而去，就不会还想着沈老师，不会还想着陆念薇，也不会把光华小学那些事藏到最后。”</span><br><br>你没有找到苏晚亭。你没有拿到福生仓那半截最关键的线。可这两封信至少证明了一件事：有人正在替她写死因，有人要把一个找人案改成一桩情死案。<br><br>这不是背叛带来的滑稽，也不是谁输给了谁。只是一个爱着苏晚亭的人，终于看见：苏晚亭不是任何人的附属，也不是等待营救的影子。她曾经选择、隐瞒、害怕，也曾经爱过别人。<br><br>周怀安把遗书折起来，压在陈明远的信下面。<br><br><span class="sys">“沈先生，案子可以归档。可请你记住，她不是这样结束的。”</span><br><br>你走出商务印书馆时，雨又落了下来。你知道这条路已经断了几处，真相也许再也拼不完整。可至少有一件事被照亮了：苏晚亭不是谜面，她是活过的人。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 吾爱晚亭（彩蛋）——</div>`,
        type: 'end'
      };
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();
