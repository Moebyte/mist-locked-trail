// ===== 跨章节因果回响模块 =====
// 让早期选择在后续章节以人物态度、额外台词和行动方式回响。

function applyCausalEchoes() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  E.causalEchoSummary = function () {
    const echoes = [];
    if (this.getFlag('echo_zhou_quick_trust')) echoes.push({ id: 'zhou_quick_trust', name: '周明远：雨中托付', desc: '你在茶馆里没有多问，直接接下委托。周明远后来一直把这件事记在心里。' });
    if (this.getFlag('echo_zhou_questioned_first')) echoes.push({ id: 'zhou_questioned_first', name: '周明远：先问清楚', desc: '你先问清楚细节再接案。周明远后来更愿意补充事实，而不是只寄望于你的承诺。' });
    if (this.getFlag('echo_yulan_promise')) echoes.push({ id: 'yulan_promise', name: '沈玉兰：一句承诺', desc: '你答应会一并查沈玉芳。后来沈玉芳听见你的名字时，先想起的是姐姐的托付。' });
    if (this.getFlag('echo_yulan_distance')) echoes.push({ id: 'yulan_distance', name: '沈玉兰：冷静边界', desc: '你告诉沈玉兰自己不能保证。后来沈玉芳的信任来得更慢，也更谨慎。' });
    if (this.getFlag('echo_sun_private_trust')) echoes.push({ id: 'sun_private_trust', name: '老孙：私下默契', desc: '你接受老孙的提醒，答应不走明面。福生仓行动中，他更愿意冒险压上私人关系。' });
    if (this.getFlag('echo_sun_public_pressure')) echoes.push({ id: 'sun_public_pressure', name: '老孙：公事公办', desc: '你当面质疑巡捕房。老孙仍会帮忙，但他必须先把边界讲清楚。' });
    return echoes;
  };

  function chainChoiceEffect(choice, effect) {
    const oldEffect = choice.effect;
    choice.effect = function (s) {
      if (typeof oldEffect === 'function') oldEffect(s);
      effect(s);
    };
  }

  function replaceChoiceEffect(nodeId, textFragment, effect) {
    const node = nodes[nodeId];
    if (!node || !Array.isArray(node.choices)) return;
    const choice = node.choices.find(c => c.text && c.text.includes(textFragment));
    if (choice) chainChoiceEffect(choice, effect);
  }

  function appendText(oldText, extra) {
    return `${oldText}<br><br>${extra}`;
  }

  replaceChoiceEffect('ch1_open', '接下委托', () => {
    E.setFlag('echo_zhou_quick_trust', true);
    E.addClue('周明远的第一印象', '你在听雨茶馆没有多问，直接接下委托。周明远记住了这份干脆。');
  });
  replaceChoiceEffect('ch1_ask', '好，这委托我接了', () => {
    E.setFlag('echo_zhou_questioned_first', true);
    E.addClue('周明远的第一印象', '你先问清楚苏晚亭失踪前的异常，再接下委托。周明远记住了这份谨慎。');
  });

  if (nodes.ch4_conclusion) {
    const oldText = nodes.ch4_conclusion.text;
    nodes.ch4_conclusion.text = function (s) {
      const base = typeof oldText === 'function' ? oldText(s) : oldText;
      if (E.getFlag('echo_zhou_quick_trust')) {
        return appendText(base, '<span class="sys">你想起周明远在茶馆里那一鞠躬。那时你几乎没有多问，只说会接。现在桌上的证据告诉你：有些承诺不是说出口那一刻成立的，是一路走到这里才真正成立。</span>');
      }
      if (E.getFlag('echo_zhou_questioned_first')) {
        return appendText(base, '<span class="sys">你想起周明远回答你第一个问题时的停顿。幸好你当时多问了那几句，否则黑衣男人、晚归和毕业论文之间的裂缝，未必会这么早露出来。</span>');
      }
      return base;
    };
  }

  if (nodes.ch2_woman_detail) {
    nodes.ch2_woman_detail.choices = [
      { text: '🤝 告诉她：我会尽力把沈玉芳也找出来', effect: () => { E.setFlag('echo_yulan_promise', true); E.addClue('对沈玉兰的承诺', '你答应沈玉兰，会把沈玉芳的失踪一并查下去。'); }, goto: 'ch2_yulan_promise_echo' },
      { text: '🕯️ 坦白说：我不能保证，但会记下这条线', effect: () => { E.setFlag('echo_yulan_distance', true); E.addClue('对沈玉兰的保留', '你没有贸然承诺，只告诉沈玉兰会把沈玉芳这条线记入案中。'); }, goto: 'ch2_yulan_distance_echo' }
    ];
  }

  nodes.ch2_yulan_promise_echo = {
    title: '沈玉兰 · 托付',
    weather: 3,
    text: () => `沈玉兰抬起头看你。她像是想确认你有没有只是随口安慰，盯了你很久。<br><br><span class="sys">"沈先生，我找了两个月。巡捕房说她自己走了，赵先生说快有消息了，可没有一个人真的去找她。"</span><br><br>她把手袋里的旧照片推到你面前。照片上，沈玉芳站在光华小学门口，头发被风吹乱，笑得很轻。<br><br><span class="sys">"如果你真要查，请别只查苏小姐。也看看我妹妹。她们也许在同一场雾里。"</span>`,
    choices: [
      { text: '🏛️ 去薛华立路 22 号——这个地址两案都有', goto: 'ch2_building_enter' },
      { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' }
    ]
  };

  nodes.ch2_yulan_distance_echo = {
    title: '沈玉兰 · 边界',
    weather: 1,
    text: () => `沈玉兰听完，没有立刻说话。她把眼泪压回去，反而显得比刚才更冷静。<br><br><span class="sys">"我明白。你是周先生请来的，不是我请来的。"</span><br><br>她停了一下，又补了一句：<br><br><span class="sys">"可如果你在查苏小姐的时候，碰见我妹妹的名字，请不要像他们一样，把它当成一个麻烦。"</span><br><br>你点头。这个案子从这一刻开始，不再只有一个失踪者。`,
    choices: [
      { text: '🏛️ 去薛华立路 22 号——这个地址两案都有', goto: 'ch2_building_enter' },
      { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' }
    ]
  };

  if (nodes.ch4_dock_who_dual) {
    const oldText = nodes.ch4_dock_who_dual.text;
    nodes.ch4_dock_who_dual.text = function (s) {
      const base = typeof oldText === 'function' ? oldText(s) : oldText;
      if (E.getFlag('echo_yulan_promise')) return appendText(base, '<span class="sys">沈玉芳听见你的名字，忽然抓住你的袖口："我姐姐……是不是见过你？她是不是还在找我？" 你点头。她闭了闭眼，像终于确认自己不是被世界忘掉的人。</span>');
      if (E.getFlag('echo_yulan_distance')) return appendText(base, '<span class="sys">沈玉芳听见沈玉兰的名字，眼神先是一亮，随即又警惕起来："她是不是求过你？你当时怎么回答她？" 你没有立刻辩解，只把外衣披到她肩上。</span>');
      return base;
    };
  }

  if (nodes.ch2_police_present) {
    nodes.ch2_police_present.choices = [
      { text: '🤝 点头：我信你，之后走私下这条线', effect: () => { E.setFlag('echo_sun_private_trust', true); E.addClue('与老孙的私下默契', '你接受老孙的提醒，答应福生仓线索不走官方渠道。'); }, goto: 'ch2_leave_univ' },
      { text: '⚖️ 追问：巡捕房这次还要装不知道吗', effect: () => { E.setFlag('echo_sun_public_pressure', true); E.addHeat(1, '你当面逼问老孙，巡捕房这条线变得更敏感。'); E.addClue('对老孙的质疑', '你提醒老孙，巡捕房不能再把光华小学与福生仓压成一份沉默卷宗。'); }, goto: 'ch2_sun_pressure_echo' }
    ];
  }

  nodes.ch2_sun_pressure_echo = {
    title: '巡捕房 · 烟灰',
    weather: 1,
    text: () => `老孙没有发火，只是把烟灰磕进铜烟缸。<br><br><span class="sys">"你以为我想装不知道？沈先生，巡捕房不是一间屋子，是一张网。网眼大，有些人掉下去，有些人故意漏过去。"</span><br><br>他把烧剩的纸灰按灭。<br><br><span class="sys">"你要查，我不拦。但以后你来找我，别在外面提王巡官，也别提公董局。否则不是我不帮你，是我帮不了你。"</span>`,
    choices: [{ text: '🔙 离开巡捕房', goto: 'ch2_leave_univ' }]
  };

  if (nodes.ch4_sun_support) {
    const oldText = nodes.ch4_sun_support.text;
    nodes.ch4_sun_support.text = function (s) {
      const base = typeof oldText === 'function' ? oldText(s) : oldText;
      if (E.getFlag('echo_sun_private_trust')) return appendText(base, '<span class="sys">老孙把窗帘拉严："你还记得我说过的，别走明面。好，今晚我叫两个信得过的人，不挂巡捕房名头。出了事，算我私事。"</span>');
      if (E.getFlag('echo_sun_public_pressure')) return appendText(base, '<span class="sys">老孙盯着你看了一会儿："你上次问我巡捕房是不是还要装不知道。今晚我可以不装，但我也只能做到今晚。"</span>');
      return base;
    };
  }
}

document.addEventListener('DOMContentLoaded', applyCausalEchoes);
