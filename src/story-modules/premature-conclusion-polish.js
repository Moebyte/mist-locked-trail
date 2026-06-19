// ===== 证据不足路线收口 =====
// 目标：玩家过早从光华小学回到线索整理时，不再用“正常破案”口吻误导。
// 1) 光华小学后若关键前置断裂，不允许倒回大学 / 苏家 / 巡捕房补课，坏路线成立。
// 2) 只有“接案 → 巡捕房拿卷宗 → 直接去光华小学”的特定坏路线，才会得到“陈明远残信 + 苏晚亭疑似遗书”，并触发《吾爱晚亭》。
// 3) 如果苏家线确认苏母知道周怀安婚约，则“为情而去”说法站不稳，不再触发《吾爱晚亭》。
// 4) 前置线索充足的正常路线不会获得疑似遗书，也不会被周怀安彩蛋截走。
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

    function knowsZhouFianceFromSuHome() {
      if (typeof E.knowsZhouFianceFromSuHome === 'function') return E.knowsZhouFianceFromSuHome();
      return E.getFlag('su_mother_knows_zhou_fiance') || E.hasClue('苏母知道周怀安婚约') || E.hasClue('为情而去说法存疑');
    }

    function hasChenBadRouteLetter() {
      return E.hasItem('陈明远残信') || E.hasItem('陈明远的信');
    }

    function hasSuLastLetter() {
      return E.hasItem('苏晚亭的遗书') || E.hasItem('苏晚亭的伪造遗书') || E.hasItem('苏晚亭疑似遗书');
    }

    function hasZhouBadRouteLetters() {
      return hasChenBadRouteLetter() && hasSuLastLetter() && !knowsZhouFianceFromSuHome();
    }

    function hasDetourBeforeSchool(log, firstSchoolIndex) {
      const detourPrefixes = [
        'ch2_univ',
        'ch2_university',
        'ch2_home',
        'ch2_frenchtown',
        'ch2_landlord',
        'ch2_xuehua',
        'ch4_'
      ];
      return log.slice(0, firstSchoolIndex).some(id => detourPrefixes.some(prefix => id.startsWith(prefix)));
    }

    function tookPoliceToSchoolShortcut() {
      const hasCaseFile = E.getFlag('got_case_file') || E.hasItem('卷宗摘抄');
      if (!hasCaseFile) return false;

      const log = Array.isArray(E.state?.sceneLog) ? E.state.sceneLog : [];
      if (log.length) {
        const firstSchoolIndex = log.findIndex(id => id.startsWith('ch3_school'));
        const policeFileIndex = log.findIndex(id => id === 'ch2_police_file');
        if (firstSchoolIndex < 0 || policeFileIndex < 0 || policeFileIndex > firstSchoolIndex) return false;
        return !hasDetourBeforeSchool(log, firstSchoolIndex);
      }

      // Fallback for older saves/tests without sceneLog: require the police file and absence of known detours.
      return !hasUniversityXuehuaLead()
        && !hasLandlordFushengLead()
        && !E.getFlag('home_talk_done')
        && !E.getFlag('asked_photo')
        && !E.getFlag('asked_mother_photo')
        && !E.getFlag('shown_photo_to_mother')
        && !E.getFlag('asked_landlord')
        && !E.getFlag('shown_map_to_landlord');
    }

    function shouldCreateAlteredLetterPacket() {
      return tookPoliceToSchoolShortcut() && isBadRouteLocked() && !knowsZhouFianceFromSuHome();
    }

    function addAlteredLetterPacket() {
      if (!shouldCreateAlteredLetterPacket()) return;
      E.setFlag('chen_letter_packet_altered', true);
      if (!E.hasItem('陈明远残信')) {
        E.addItem('陈明远残信', '陈明远留给苏晚亭的信，但信纸下半截缺失，信封边缘像被重新压过。开头仍是“晚亭吾爱”。');
      }
      if (!E.hasClue('陈明远残信')) {
        E.addClue('陈明远残信', '陈明远残信只留下“晚亭吾爱”、后楼箱子、恐吓和“不要相信第一通电话”等碎片，关键去向被切断。');
      }
      if (!E.hasItem('苏晚亭疑似遗书')) {
        E.addItem('苏晚亭疑似遗书', '夹在残信信封内层的纸，字迹像苏晚亭，内容把她的失踪解释为“为情而去”。');
      }
      if (!E.hasClue('苏晚亭疑似遗书')) {
        E.addClue('苏晚亭疑似遗书', '陈明远残信信封夹层里藏着一份疑似苏晚亭留下的遗书，把她的失踪指向“为情而去”。');
      }
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
      return [{ text: '📨 再递出另一封信', goto: 'ch4_revisit_zhou' }];
    }

    if (nodes.ch3_chen_letter && !nodes.ch3_chen_letter.__suLastLetterPatched) {
      const oldEffect = nodes.ch3_chen_letter.effect;
      const oldText = nodes.ch3_chen_letter.text;
      nodes.ch3_chen_letter.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        addAlteredLetterPacket();
      };
      nodes.ch3_chen_letter.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldCreateAlteredLetterPacket()) return base;
        return `${base}<br><br>你把信纸重新折好时，才注意到信封边缘压得很平，像是曾经被人重新封过。信纸下半截也不见了，断口整齐，不像被岁月磨掉。<br><br>信封内层还有一道很浅的夹缝，里面藏着另一张纸。<br><br>纸上的字迹很像苏晚亭，句子却短得像被刻意压住：<br><br><span class="sys">“我自知愧对明远，也无颜再见周先生。此身既已入雾，愿随他而去。”</span><br><br>如果只看这个信封，答案几乎已经替你排好了：陈明远爱过苏晚亭，苏晚亭也像是追着他走进了雾里。<br><br>可你手里的线索太少，还不能判断这个信封究竟保留了什么，又拿走了什么。`;
      };
      nodes.ch3_chen_letter.__suLastLetterPatched = true;
    }

    if (nodes.ch3_school && !nodes.ch3_school.__prematureSchoolLetterEffectPatched) {
      const oldChoices = nodes.ch3_school.choices;
      nodes.ch3_school.choices = function (state) {
        return choicesOf(oldChoices, state).map(choice => {
          const text = choice.text || choice.fogText || '';
          if (!text.includes('看陈明远那封未寄出的信')) return choice;
          const oldEffect = choice.effect;
          return {
            ...choice,
            effect: function (s) {
              if (typeof oldEffect === 'function') oldEffect(s);
              addAlteredLetterPacket();
            }
          };
        });
      };
      nodes.ch3_school.__prematureSchoolLetterEffectPatched = true;
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
            if (tookPoliceToSchoolShortcut() && isBadRouteLocked() && hasZhouBadRouteLetters() && !hasZhouChoice) {
              out.push({ text: '🏮 回访周怀安——带去残信和那封疑似遗书', goto: 'ch4_revisit_zhou' });
              hasZhouChoice = true;
            }
            out.push({ ...choice, text: '🔙 把手头材料重新摊开' });
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
          { text: '📁 暂时把案卷压进抽屉', goto: 'end_archive' },
          { text: '⚠️ 线索还断着，却仍决定指认一个人', goto: 'ch4_accuse' }
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
        if (!hasZhouBadRouteLetters()) return base;
        return `${base}<br><br>翡翠镯能证明“陆念”这个名字不是空穴来风，却仍然回答不了这个案子最要紧的问题：苏晚亭去了哪里，她是不是还活着。<br><br>你想到陈明远那只被重新压平的信封，也想到信封夹层里那张疑似苏晚亭留下的遗书。它们比这只镯子更应该先给周怀安看；当铺只是旁证，不是这条坏路线的前置。`;
      };

      nodes.ch4_pawnshop.choices = function (state) {
        return choicesOf(oldChoices, state).map(choice => {
          if (isBadRouteLocked() && hasZhouBadRouteLetters() && choice.goto === 'ch4_revisit_zhou') {
            if (knowsZhouFianceFromSuHome()) {
              return { ...choice, text: '🔙 把翡翠镯收回去，别让那封疑似遗书误导他', goto: 'ch4_conclusion' };
            }
            return { ...choice, text: '🏮 回访周怀安——带去翡翠镯、残信和疑似遗书' };
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
        if (knowsZhouFianceFromSuHome() && (item.name === '陈明远的信' || item.name === '陈明远残信' || item.name === '苏晚亭的遗书' || item.name === '苏晚亭的伪造遗书' || item.name === '苏晚亭疑似遗书')) {
          return { text: '你想起苏母的话：周怀安是晚亭的未婚夫，晚亭若真要离开，不会一句话都不留给他。这两张纸可以作为疑点，但不能再把案子压成“为情而去”。' };
        }
        if (isBadRouteLocked() && item.name === '翡翠镯' && !E.getFlag('presented_jade_to_zhou_premature')) {
          E.setFlag('presented_jade_to_zhou_premature', true);
          return { goto: 'ch4_zhou_present_jade_premature' };
        }
        if (isBadRouteLocked() && hasZhouBadRouteLetters() && (item.name === '陈明远的信' || item.name === '陈明远残信') && !E.getFlag('presented_chen_letter_to_zhou')) {
          E.setFlag('presented_chen_letter_to_zhou', true);
          return { goto: E.getFlag('presented_su_last_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_chen_letter' };
        }
        if (isBadRouteLocked() && hasZhouBadRouteLetters() && (item.name === '苏晚亭的遗书' || item.name === '苏晚亭的伪造遗书' || item.name === '苏晚亭疑似遗书') && !E.getFlag('presented_su_last_letter_to_zhou')) {
          E.setFlag('presented_su_last_letter_to_zhou', true);
          return { goto: E.getFlag('presented_chen_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_su_last_letter' };
        }
        return typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
      };

      nodes.ch4_revisit_zhou.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (isBadRouteLocked() && hasZhouBadRouteLetters()) {
          return `${base}<br><br><span class="sys">你怀里有一只被重新压平过的信封：一封残信写着“晚亭吾爱”，让苏晚亭重新成为一个会爱、会怕、会选择的人；另一张纸像是她的遗书，把她压成一句“为情而去”的遗言。周怀安必须看见它们并在一起的样子。</span>`;
        }
        if (isBadRouteLocked() && knowsZhouFianceFromSuHome() && hasChenBadRouteLetter() && hasSuLastLetter()) {
          return `${base}<br><br><span class="sys">你怀里有残信和那封疑似遗书。可苏母已经说过，周怀安是晚亭的未婚夫，晚亭若真要离开，不会一句话都不留给他。现在把这两张纸递出去，只会制造一个太容易被接受的误会。</span>`;
        }
        return base;
      };

      nodes.ch4_revisit_zhou.__chenLetterEasterEggPatched = true;
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();
