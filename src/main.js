// ===== 启动与玩法增强 =====
function applyGameplayImprovements() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  E.presentOnce = function (item, itemName, flag) {
    if (item && item.name === itemName && !this.getFlag(flag)) {
      this.setFlag(flag, true);
      return true;
    }
    return false;
  };

  const oldSetTime = E.setTime.bind(E);
  E.setTime = function (day, hour, minute) {
    const next = { day: day ?? 1, hour: hour ?? 14, minute: minute ?? 0 };
    const current = this.timeToMinutes(this.state.inGameTime || { day: 1, hour: 14, minute: 0 });
    const target = this.timeToMinutes(next);
    if (target < current) {
      this.state.atmosphere = this.renderAtmosphere();
      return false;
    }
    oldSetTime(next.day, next.hour, next.minute);
    return true;
  };

  E.deadlinePhase = function () {
    const left = this.minutesUntilDeadline();
    if (left < 0) return 'expired';
    if (left < 180) return 'critical';
    if (left < 600) return 'tight';
    return 'safe';
  };

  E.deadlinePhaseLabel = function () {
    return ({ safe: '时间充裕', tight: '时间吃紧', critical: '只够救人', expired: '迟到一步' })[this.deadlinePhase()];
  };

  E.routeDockByPressure = function () {
    const phase = this.deadlinePhase();
    if (phase === 'expired') {
      this.setFlag('missed_deadline', true);
      return 'ch4_dock_cleared';
    }
    if (phase === 'critical') return 'ch4_dock_rescue_only';
    if (phase === 'tight') return 'ch4_dock_limited_search';
    return 'ch4_dock_full_search';
  };

  function chainPresent(nodeId, handler) {
    const node = nodes[nodeId];
    if (!node) return;
    const oldHandler = node.onPresent;
    node.onPresent = function (item, s) {
      const oldResult = typeof oldHandler === 'function' ? oldHandler(item, s) : null;
      return oldResult || handler(item, s);
    };
  }

  if (nodes.ch4_suzhou_creek) {
    delete nodes.ch4_suzhou_creek.time;
    nodes.ch4_suzhou_creek.cost = { h: 0, m: 45, reason: '你赶往苏州河废弃码头' };
    nodes.ch4_suzhou_creek.text = () => {
      const phase = E.deadlinePhase();
      const intro = {
        safe: '你提前赶到苏州河，福生仓仍在装货，门口还有人影往来。',
        tight: '你赶到时暮色已深，福生仓外的货车正在加紧装箱。',
        critical: '你赶到时只剩最后一辆货车，仓库深处仍有细微声响。',
        expired: '你赶到时仓库已经清空，只剩车辙、草绳和纸灰。'
      }[phase];
      return `${intro}<br><br><span class="sys">王巡官写过：福生仓，三日清。现在是：${E.deadlinePhaseLabel()}。</span>`;
    };
    nodes.ch4_suzhou_creek.choices = () => {
      if (E.deadlinePhase() === 'expired') return [
        { text: '🕯️ 检查清空后的仓库', goto: 'ch4_dock_cleared' },
        { text: '🔙 回事务所整理线索', goto: 'ch3_wrapup' }
      ];
      return [
        { text: '🕵️ 先观察，再行动', goto: () => E.routeDockByPressure() },
        { text: '⚠️ 直接潜入', effect: () => E.addHeat(1, '冒险行动让码头风险升高。'), goto: () => E.routeDockByPressure() },
        { text: '🚓 先找老孙支援', goto: 'ch4_dock_wait' },
        { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
      ];
    };
  }

  nodes.ch4_dock_full_search = {
    title: '福生仓 · 完整搜查', weather: 2,
    effect: () => {
      E.setFlag('dock_full_search', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('码头换班', '守夜人每半小时从后门绕仓一圈，东侧窗户有空隙');
      E.addClue('公董局公文纸', '福生仓内的清场指令写在公董局蓝封公文纸上');
      E.addClue('教具箱走私', '标着光华小学的教具箱里装的是洋酒和香烟');
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
      E.addItem('光华货运单', '发货名义是光华小学教学器材，收货地是福生仓。');
    },
    text: () => `你先观察换班，再从东侧窗户进入。时间尚算充裕，你查到清场指令、蓝封公文纸和光华小学货运单。<br><br>仓库深处传来很轻的敲击声。`,
    choices: [{ text: '🔦 搜索仓库深处', goto: 'ch4_dock_deep' }]
  };

  nodes.ch4_dock_limited_search = {
    title: '福生仓 · 有限搜查', weather: 2,
    effect: () => {
      E.setFlag('dock_limited_search', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('公董局公文纸', '福生仓内残留的清场指令写在公董局蓝封公文纸上');
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
    },
    text: () => `仓库已经搬走一半。你只能抢下蓝封纸角和清场指令。深处传来敲击声，你必须决定是否再搜箱子。`,
    choices: [
      { text: '📦 冒险检查教具箱', goto: 'ch4_dock_crates' },
      { text: '🔦 立刻搜索仓库深处', goto: 'ch4_dock_deep' }
    ]
  };

  nodes.ch4_dock_rescue_only = {
    title: '福生仓 · 只够救人', weather: 5,
    effect: () => {
      E.setFlag('dock_rescue_only', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('福生仓仓促清场', '你赶到时只能优先救人，来不及完整搜证');
    },
    text: () => `货箱大多已经搬空，外面的车随时会走。你没有时间查证，只能循着仓库深处的敲击声救人。`,
    choices: [{ text: '🔦 直奔仓库深处', goto: 'ch4_dock_deep_rescue_only' }]
  };

  nodes.ch4_dock_deep_rescue_only = {
    title: '福生仓 · 暗室', weather: 5,
    effect: () => E.addClue('仓库暗室', '木箱背后有一个暗门，通向一个被改造成囚室的小房间。'),
    text: () => `你在仓库尽头找到暗门。门后有一张行军床、一个水桶和一盏快熄灭的煤油灯。床上蜷缩着一个年轻女人。<br><br><span class="sys">"你……你是谁？"</span>`,
    choices: [{ text: '💬 你是沈玉芳还是苏晚亭？', goto: 'ch4_dock_who' }]
  };

  nodes.ch4_dock_cleared = {
    title: '福生仓 · 迟到的仓库', weather: 5,
    effect: () => {
      E.setFlag('missed_deadline', true);
      E.addHeat(2, '福生仓已经清场，调查压力升高。');
      E.addClue('福生仓清场', '仓库已被清空，只留下拖痕和未燃尽的纸灰');
    },
    text: () => `卷帘门敞开，地上有新车辙。你在纸灰里翻出半片蓝封纸角，但人和货都已经被转走。`,
    choices: [
      { text: '🔙 带着残存证据回去整理', goto: 'ch3_wrapup' },
      { text: '🔍 直接回事务所做最后推断', goto: 'ch4_conclusion' }
    ]
  };

  nodes.ch4_dock_wait = {
    title: '福生仓 · 等待支援', weather: 5,
    cost: { h: 2, m: 15, reason: '你去找老孙调人，耽误了两个多小时' },
    effect: () => E.addHeat(1, '等待增援让码头局势更紧。'),
    text: () => E.deadlinePhase() === 'expired'
      ? `你带人赶回时，福生仓已经清空。老孙低声说：<span class="sys">"他们比我们快一步。"</span>`
      : `你带着老孙的人赶回码头。福生仓还没完全清空。<br><br><span class="sys">${E.deadlinePhaseLabel()}。</span>`,
    choices: () => E.deadlinePhase() === 'expired'
      ? [{ text: '🔦 检查清空后的仓库', goto: 'ch4_dock_cleared' }]
      : [{ text: '🚓 和老孙一起行动', goto: () => E.routeDockByPressure() }]
  };

  const wrap = nodes.ch3_wrapup;
  if (wrap && typeof wrap.choices === 'function') {
    const oldChoices = wrap.choices;
    wrap.choices = function (s) {
      const opts = oldChoices(s) || [];
      const canAskSun = !E.getFlag('sun_support_available') && !E.getFlag('missed_deadline') && (E.hasItem('福生仓地址') || E.hasItem('半张烟盒纸') || E.hasClue('王巡官遗留纸条') || E.hasClue('福生仓位置'));
      if (canAskSun) opts.unshift({ text: '🚓 去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
      return opts;
    };
  }

  nodes.ch4_sun_support = {
    title: '巡捕房 · 私下求援', weather: 4,
    onPresent: (item) => {
      if (E.presentOnce(item, '福生仓地址', 'presented_fusheng_to_sun')) return { goto: 'ch4_sun_present_fusheng' };
      if (E.presentOnce(item, '半张烟盒纸', 'presented_wang_note_to_sun_support')) return { goto: 'ch4_sun_present_fusheng' };
      return null;
    },
    text: () => `老孙把办公室门关上。<br><br><span class="sys">"福生仓不能走明面。你要我帮，就拿出能说服我的东西。"</span>`,
    choices: [{ text: '🔙 暂时不找他', goto: 'ch3_wrapup' }]
  };

  nodes.ch4_sun_present_fusheng = {
    title: '举证 · 福生仓地址', weather: 4,
    effect: () => {
      E.setFlag('sun_support_available', true);
      E.addClue('老孙愿意私下支援', '老孙答应私下支援福生仓行动，但调人越多越容易惊动对方');
    },
    text: () => `老孙看完地址和纸条，沉默很久。<br><br><span class="sys">"我可以私下帮你。立刻走，快；调齐人手，稳，但慢。"</span>`,
    choices: [
      { text: '🏃 立刻带人赶去福生仓', effect: () => E.setFlag('sun_fast_support', true), goto: 'ch4_dock_sun_fast_support' },
      { text: '🚓 调齐人手再行动', goto: 'ch4_dock_wait' },
      { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
    ]
  };

  nodes.ch4_dock_sun_fast_support = {
    title: '福生仓 · 私下增援', weather: 2,
    cost: { h: 0, m: 45, reason: '你和老孙的人赶往福生仓' },
    effect: () => E.addHeat(-1, '老孙的私下支援降低了行动风险。'),
    text: () => `老孙只叫来一个信得过的便衣。你们分头靠近福生仓。<br><br><span class="sys">${E.deadlinePhaseLabel()}。</span>`,
    choices: [{ text: '🚓 分头潜入福生仓', goto: () => E.routeDockByPressure() }]
  };

  chainPresent('ch4_dock_who', (item) => {
    if (E.presentOnce(item, '三人合影', 'presented_photo_to_yufang')) return { goto: 'ch4_yufang_present_photo' };
    if (E.presentOnce(item, '陈明远的信', 'presented_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    if (E.presentOnce(item, '未寄出的信', 'presented_unsent_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    return null;
  });

  nodes.ch4_yufang_present_photo = {
    title: '举证 · 三人合影', weather: 2,
    effect: () => E.addClue('沈玉芳认出三人合影', '她确认陈明远、苏晚亭与陆念薇早已产生交集'),
    text: () => `沈玉芳看着照片，认出了陆小姐：<span class="sys">"她不叫陆小姐。陈老师叫她陆念薇。"</span>`,
    choices: [{ text: '🔙 带她离开', goto: 'ch4_dock_escape' }]
  };

  nodes.ch4_yufang_present_letter = {
    title: '举证 · 陈明远的信', weather: 2,
    effect: () => E.addClue('沈玉芳确认陈明远求助', '她确认陈明远死前准备揭开学校走私链，并试图保护苏晚亭'),
    text: () => `沈玉芳读完信，低声说：<span class="sys">"他不是怕死。他是怕晚亭也被拖进来。"</span>`,
    choices: [{ text: '🔙 带她离开', goto: 'ch4_dock_escape' }]
  };
}

document.addEventListener('DOMContentLoaded', () => {
  applyGameplayImprovements();
  E.init();
});
