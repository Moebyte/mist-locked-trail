// ===== 举证流程收束 =====
// 目标：普通地点页不再冒出通用出示按钮；周怀安回访改为连续举证面板；已查过当铺后隐藏当铺入口。

(function installPresentFlowCleanup() {
  function applyPresentFlowCleanup() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__presentFlowCleanupPatched) return;

    function hasItem(name) {
      return Array.isArray(E.state?.items) && E.state.items.some(i => i.name === name);
    }

    function hasClue(name) {
      return Array.isArray(E.state?.clues) && E.state.clues.some(c => c.name === name);
    }

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasUniversityXuehuaLead() {
      return hasThing('法租界地图') || hasThing('铅笔清单');
    }

    function hasLandlordFushengLead() {
      return E.getFlag('shown_map_to_landlord') || hasClue('福生仓标识') || hasClue('福生仓位置') || hasItem('福生仓地址');
    }

    function hasWangNote() {
      return E.getFlag('got_wang_note') || hasClue('王巡官遗留纸条') || hasItem('半张烟盒纸');
    }

    function isBadRouteLocked() {
      return !hasUniversityXuehuaLead() || !hasLandlordFushengLead() || !hasWangNote();
    }

    function hasChenLetter() {
      return hasItem('陈明远的信') || hasItem('未寄出的信');
    }

    function hasSuLastLetter() {
      return hasItem('苏晚亭的遗书') || hasItem('苏晚亭的伪造遗书');
    }

    function hasThreatLetter() {
      return hasItem('恐吓信') || hasClue('恐吓信');
    }

    function zhouHasBothLetters() {
      return E.getFlag('presented_chen_letter_to_zhou') && E.getFlag('presented_su_last_letter_to_zhou');
    }

    function zhouEvidenceChoices() {
      const opts = [];
      if (hasItem('翡翠镯') && !E.getFlag('presented_jade_to_zhou') && !E.getFlag('presented_jade_to_zhou_premature')) {
        opts.push({
          text: '🟢 拿出翡翠镯，问他是否听过“陆念”',
          effect: () => {
            if (isBadRouteLocked()) E.setFlag('presented_jade_to_zhou_premature', true);
            else E.setFlag('presented_jade_to_zhou', true);
          },
          goto: () => isBadRouteLocked() && nodes.ch4_zhou_present_jade_premature ? 'ch4_zhou_present_jade_premature' : 'ch4_zhou_present_jade'
        });
      }
      if (hasChenLetter() && !E.getFlag('presented_chen_letter_to_zhou')) {
        opts.push({
          text: '📩 拿出陈明远那封未寄出的信',
          effect: () => E.setFlag('presented_chen_letter_to_zhou', true),
          goto: () => E.getFlag('presented_su_last_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_chen_letter'
        });
      }
      if (hasSuLastLetter() && !E.getFlag('presented_su_last_letter_to_zhou')) {
        opts.push({
          text: '📝 拿出疑似苏晚亭留下的遗书',
          effect: () => E.setFlag('presented_su_last_letter_to_zhou', true),
          goto: () => E.getFlag('presented_chen_letter_to_zhou') ? 'end_zhou_chen_letter' : 'ch4_zhou_present_su_last_letter'
        });
      }
      if (hasItem('半张烟盒纸') && !E.getFlag('presented_wang_note_to_zhou')) {
        opts.push({
          text: '🧾 拿出王巡官留下的半张烟盒纸',
          effect: () => E.setFlag('presented_wang_note_to_zhou', true),
          goto: 'ch4_zhou_present_wang_note'
        });
      }
      if (hasThreatLetter() && !E.getFlag('presented_threat_to_zhou')) {
        opts.push({
          text: '📄 拿出 203 室的恐吓信',
          effect: () => E.setFlag('presented_threat_to_zhou', true),
          goto: 'ch4_zhou_present_threat'
        });
      }
      return opts;
    }

    function zhouAfterPresentChoices() {
      if (zhouHasBothLetters()) {
        return [{ text: '🕯️ 把两封信并在一起，听他说完', goto: 'end_zhou_chen_letter' }];
      }
      if (zhouEvidenceChoices().length) {
        return [{ text: '📨 继续拿出别的东西给周怀安看', goto: 'ch4_revisit_zhou' }];
      }
      return [{ text: '🔙 暂时不打扰他，回去继续追查福生仓', goto: 'ch3_wrapup' }];
    }

    function disableGenericPresent(nodeId) {
      const node = nodes[nodeId];
      if (!node) return;
      delete node.onPresent;
      node.presentFilter = () => false;
      node.presentClueWhitelist = [];
      node.__genericPresentDisabled = true;
    }

    // 永兴贸易商行入口只做问询/上楼，不在这里提前向老头出示地图。
    disableGenericPresent('ch2_building_enter');

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__hidePawnAfterVisitedPatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.filter(choice => {
          const text = choice.text || choice.fogText || '';
          const isPawn = choice.goto === 'ch4_pawnshop' || text.includes('去当铺') || text.includes('查当票上的翡翠镯');
          if (isPawn && (E.getFlag('visited_pawn') || hasItem('翡翠镯') || hasClue('翡翠镯'))) return false;
          return true;
        });
      };
      nodes.ch3_wrapup.__hidePawnAfterVisitedPatched = true;
    }

    if (nodes.ch4_pawnshop && !nodes.ch4_pawnshop.__presentFlowChoicesPatched) {
      const oldChoices = nodes.ch4_pawnshop.choices;
      nodes.ch4_pawnshop.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.map(choice => {
          const text = choice.text || '';
          if (choice.goto === 'ch4_conclusion' || text.includes('带着翡翠镯回去整理') || text.includes('所有的线索都齐了')) {
            return { ...choice, text: '🔙 带着翡翠镯回去整理下一步', goto: 'ch3_wrapup' };
          }
          return choice;
        });
      };
      nodes.ch4_pawnshop.__presentFlowChoicesPatched = true;
    }

    if (nodes.ch4_revisit_zhou) {
      delete nodes.ch4_revisit_zhou.onPresent;
      nodes.ch4_revisit_zhou.presentFilter = () => false;
      nodes.ch4_revisit_zhou.text = function () {
        const hints = [];
        if (hasItem('翡翠镯') && !E.getFlag('presented_jade_to_zhou') && !E.getFlag('presented_jade_to_zhou_premature')) hints.push('翡翠镯能问出“陆念”这个名字。');
        if (hasChenLetter() && !E.getFlag('presented_chen_letter_to_zhou')) hints.push('陈明远那封未寄出的信，能让周怀安知道晚亭真正卷进了什么。');
        if (hasSuLastLetter() && !E.getFlag('presented_su_last_letter_to_zhou')) hints.push('那封疑似遗书，需要让最熟悉晚亭的人判断真假。');
        if (hasItem('半张烟盒纸') && !E.getFlag('presented_wang_note_to_zhou')) hints.push('王巡官留下的半张烟盒纸，能说明这不是普通失踪案。');
        if (hasThreatLetter() && !E.getFlag('presented_threat_to_zhou')) hints.push('203 室的恐吓信，能证明有人在逼知情者闭嘴。');
        const hintText = hints.length ? `<br><br>${hints.join('<br>')}` : '<br><br>该给他看的东西，你已经基本给过了。';
        return `商务印书馆的编辑室还亮着灯。<br><br>周怀安坐在一堆校样中间，眼睛里全是血丝。看到你进来，他立刻站起身。<br><br><span class="sys">“沈先生，有晚亭的消息了吗？”</span><br><br>你没有立刻回答。你知道有些东西，比一句“还没有”更有用。${hintText}`;
      };
      nodes.ch4_revisit_zhou.choices = function () {
        const opts = zhouEvidenceChoices();
        opts.push({ text: '🔙 暂时不打扰他，回去继续追查福生仓', goto: 'ch3_wrapup' });
        return opts;
      };
    }

    ['ch4_zhou_present_jade', 'ch4_zhou_present_jade_premature', 'ch4_zhou_present_chen_letter', 'ch4_zhou_present_su_last_letter'].forEach(id => {
      if (nodes[id]) nodes[id].choices = zhouAfterPresentChoices;
    });

    nodes.ch4_zhou_present_wang_note = {
      title: '举证 · 半张烟盒纸',
      weather: 5,
      effect: () => {
        E.addClue('周怀安看到王巡官纸条', '周怀安看到“福生仓，三日清；别信公董局来的电话”，确认这不是普通情感纠纷。');
      },
      text: () => `你把那半张烟盒纸放在校样旁边。<br><br>周怀安盯着上面的字：<span class="sys">“福生仓。三日清。别信公董局来的电话。”</span><br><br>他抬头看你，声音压得很低。<br><br><span class="sys">“晚亭不是会无缘无故失踪的人。若连巡捕房里的人都留下这种话，她一定是碰到了不能碰的东西。”</span>`,
      choices: zhouAfterPresentChoices
    };

    nodes.ch4_zhou_present_threat = {
      title: '举证 · 恐吓信',
      weather: 5,
      effect: () => {
        E.addClue('周怀安看到恐吓信', '周怀安看到 203 室恐吓信，意识到苏晚亭接触的人都在被威胁。');
      },
      text: () => `你把 203 室找到的恐吓信推过去。<br><br><span class="sys">“我知道那晚你看到了什么。如果你不说，他们下一个就是你。”</span><br><br>周怀安的脸色一点点白下去。<br><br><span class="sys">“她不是自己走的。”</span><br><br>他说得很慢，像是在逼自己承认这句话真正意味着什么。`,
      choices: zhouAfterPresentChoices
    };

    E.__presentFlowCleanupPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPresentFlowCleanup);
})();
