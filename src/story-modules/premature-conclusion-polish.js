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
      return E.hasClue('法租界地图')
        || E.hasItem('法租界地图')
        || E.hasClue('铅笔清单')
        || E.hasItem('铅笔清单')
        // 到达薛华立路 203 后取得的线索也能证明玩家已经接上这条前置线，
        // 避免后续整理页把已完成第二段推理的正常路线误判为“没查大学”。
        || E.hasClue('陆小姐的笔记')
        || E.hasClue('三人合影')
        || E.hasItem('三人合影');
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
      if (E.getFlag('rescued_yufang') || E.getFlag('rescued_su') || E.getFlag('v07_witnesses_protected')) return false;
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
        if (E.getFlag('missed_deadline')) return choices;
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
          E.addClue('周怀安读到陈明远的信', '周怀安读到“晚亭吾爱”，确认苏晚亭与陈明远确有情感牵连');
        },
        text: () => `周怀安接过陈明远的信，指尖发白。<br><br>他读到第一句<span class="sys">“晚亭吾爱”</span>时，整个人像被人从背后推了一下。<br><br>你没有解释。窗外雨声很密，屋里只剩纸页翻动的声音。<br><br><span class="sys">“原来……是真的。”</span>他说。<br><br>他把信纸放回桌上，眼神空了一块。<br><br>如果只有这封信，他会相信苏晚亭确实为了陈明远离开了他。`,
        choices: zhouLetterReturnChoices
      };
    }

    if (!nodes.ch4_zhou_present_su_last_letter) {
      nodes.ch4_zhou_present_su_last_letter = {
        title: '举证 · 遗书',
        weather: 5,
        effect: () => {
          E.addClue('周怀安读到苏晚亭的遗书', '周怀安读到疑似苏晚亭遗书，与陈明远的信互相印证又互相矛盾');
        },
        text: () => `你把那张疑似遗书递过去。<br><br>周怀安读得很慢。读完以后，他没有哭，只是反复看最后一句。<br><br><span class="sys">“愿随他而去……”</span><br><br>他轻轻念了一遍，像是被这几个字钉住。<br><br>这封遗书太整齐，整齐得不像一个逃亡中的女学生。可它又太像苏晚亭的字。`,
        choices: zhouLetterReturnChoices
      };
    }

    if (!nodes.ch4_zhou_present_jade_premature) {
      nodes.ch4_zhou_present_jade_premature = {
        title: '举证 · 翡翠镯',
        weather: 4,
        effect: () => E.addClue('周怀安见到翡翠镯', '周怀安认出翡翠镯不是苏晚亭的东西，只能说明她曾接触陆小姐，不能证明她还活着'),
        text: () => `你把翡翠镯放到桌上。<br><br>周怀安看了很久，摇了摇头。<br><br><span class="sys">“这不是晚亭的。”</span><br><br>他见过苏晚亭所有首饰。晚亭不喜欢玉，说玉太冷，像旧宅里的东西。<br><br>翡翠镯证明陆念薇存在，却不能证明苏晚亭还活着。<br><br>周怀安看向你怀里的两封信。<br><br><span class="sys">“沈先生，你到底查到了什么？”</span>`,
        choices: [{ text: '📨 出示陈明远的信或苏晚亭的遗书', goto: 'ch4_revisit_zhou' }]
      };
    }

    if (!nodes.end_zhou_chen_letter) {
      nodes.end_zhou_chen_letter = {
        title: '结局 · 吾爱晚亭',
        weather: 0,
        effect: () => E.addClue('结局已解锁', '特殊结局已解锁'),
        text: () => `两封信摆在一起。<br><br>一封是陈明远写给苏晚亭的，字里行间有爱、有悔、有求救。另一封像是苏晚亭写的遗书，句子短，情绪稳，像是替她把人生收成一个“殉情”的结尾。<br><br>周怀安先是沉默，然后把两封信推回你面前。<br><br><span class="sys">“沈先生，这两封信，不能都是真的。”</span><br><br>你没有回答。<br><br>他终于明白了。不是苏晚亭抛弃了他，也不是她为了另一个男人投向死亡。有人希望他这么相信，有人希望案子停在这里。<br><br>可你们都没有找到那个人。<br><br>十天后，周怀安离开上海。他没有再登广告，也没有再找巡捕房。<br><br>你偶尔会在梦里想起那两封信。想起一封信写得太深，一封信写得太浅。<br><br>上海的雾很重，有时候不是因为天气。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局七 · 吾爱晚亭 ——</div>`,
        type: 'end'
      };
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();