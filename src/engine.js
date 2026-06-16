// ===== 引擎 =====
const E = {
  saveKey: 'wusuo_mizong_save_v4',
  state: null,
  logEl: null,
  sceneEl: null,
  titleEl: null,
  textEl: null,
  choicesEl: null,
  toastEl: null,
  deducEl: null,
  graphEl: null,

  // 氛围系统
  weathers: ['秋雨绵绵','阴云低垂','薄雾笼街','雨后初晴','暮色昏黄','冷月清辉'],
  periods: ['清晨','上午','正午','午后','傍晚','入夜','深夜'],

  // 关系图
  relationData: {
    nodes: [],
    edges: []
  },

  // 推理题目
  deductions: [],

  freshState() {
    return {
      clues: [],
      items: [],
      contacts: [],
      flags: {},
      chapter: 0,
      sceneLog: [],
      currentScene: null,
      visitedNodes: {},
      endings: [],
      inGameTime: { day:1, hour:14, minute:0 },
      pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
      weatherIdx: 0,
      atmosphere: '秋雨绵绵的午后',
    };
  },

  init() {
    this.state = this.freshState();
    this.logEl = document.getElementById('log');
    this.sceneEl = document.getElementById('scene-card');
    this.titleEl = document.getElementById('scene-title');
    this.textEl = document.getElementById('scene-text');
    this.choicesEl = document.getElementById('choices');
    this.toastEl = document.getElementById('toast');
    document.getElementById('start-btn').onclick = () => {
      document.getElementById('title-screen').style.display = 'none';
      this.start();
    };
    document.getElementById('continue-btn').onclick = () => this.loadGame(true);
    document.getElementById('btn-panel').onclick = () => this.openPanel();
    document.getElementById('btn-close-panel').onclick = () => this.closePanel();
    document.getElementById('panel-mask').onclick = () => this.closePanel();
    document.getElementById('btn-save').onclick = () => this.saveGame(true);
    document.getElementById('btn-load').onclick = () => this.loadGame(true);
    document.getElementById('btn-restart').onclick = () => {
      if (confirm('确定重新开始本轮调查？已解锁结局会保留在存档里。')) this.start();
    };
    document.getElementById('btn-atmo').onclick = () => {
      document.body.classList.toggle('vintage');
      this.toast(document.body.classList.contains('vintage') ? '年代滤镜已开启' : '年代滤镜已关闭');
    };
    this.deducEl = document.getElementById('deduction-modal');
    this.graphEl = document.getElementById('graph-panel');
    document.getElementById('btn-graph').onclick = () => this.openGraph();
    document.getElementById('close-graph').onclick = () => this.closeGraph();
    document.getElementById('graph-mask').onclick = () => this.closeGraph();
    document.getElementById('close-deduction').onclick = () => this.closeDeduction();
    if (localStorage.getItem(this.saveKey)) document.getElementById('continue-btn').style.display = 'inline-block';
    this.updateStatus();
  },

  start() {
    const oldEndings = this.readSavedEndings();
    this.state = this.freshState();
    this.state.endings = oldEndings;
    this.relationData = {nodes:[], edges:[]};
    this.deductions = [];
    this.registerAll();
    this.logEl.innerHTML = '';
    this.logEl.style.display = 'block';
    this.sceneEl.style.display = 'block';
    document.getElementById('top-actions').style.display = 'flex';
    document.getElementById('status-bar').style.display = 'flex';
    this.go('ch1_open');
  },

  registerAll() {
    // ── 注册关系 ──
    this.registerRelation('苏晚亭',['圣约翰大学学生','失踪者'],[]);
    this.registerRelation('周明远',['商务印书馆编辑','委托者'],['苏晚亭']);
    this.registerRelation('孙国栋',['法租界巡捕房探长'],['苏晚亭']);
    this.registerRelation('苏母',['苏晚亭母亲'],['苏晚亭']);
    this.registerRelation('陈明远',['光华小学教师','已故'],['苏晚亭','苏晚亭']);
    this.registerRelation('沈玉芳',['光华小学教师','失踪者'],['陈明远','苏晚亭']);
    this.registerRelation('沈玉兰',['沈玉芳姐姐'],['沈玉芳','陈明远']);
    this.registerRelation('陆小姐',['薛华立路203室','知情人'],['陈明远','苏晚亭']);
    this.registerRelation('吴校长',['光华小学校长'],['陈明远','沈玉芳']);
    this.registerRelation('黑衣男人',['身份不明','戴玉扳指'],['陆小姐','沈玉兰']);

    // ── 注册推理题 ──
    this.registerDeduction(
      'deduce_chen',
      '陈明远的真正死因最有可能是？',
      [
        'A. 因愧对学生而自杀',
        'B. 被陆小姐灭口——他发现了她的真实身份',
        'C. 被吴校长灭口——他发现学校有非法交易',
        'D. 因情感纠葛被蘇晚亭牵连'
      ],
      1,
      'deduc_success',
      'deduc_fail',
      ['陈明远坠楼案','恐吓信','陆小姐的笔记','陈明远的信']
    );
    this.registerDeduction(
      'deduce_lu_zhao',
      '陆小姐与黑衣男人的真实关系是？',
      [
        'A. 情人与合谋——他们一起做敲诈生意',
        'B. 黑衣男人是陆小姐的上线——陆小姐受他指挥',
        'C. 黑衣男在追查陆小姐——沈玉兰雇他调查',
        'D. 没有关系——黑衣男只是恰好去过薛华立路'
      ],
      2,
      'deduc_lu_zhao_ok',
      'deduc_lu_zhao_fail',
      ['跟踪黑衣男人','神秘女子','沈玉兰的妹妹','翡翠镯']
    );
    this.registerDeduction(
      'deduce_fusheng',
      '福生仓与公董局的关联意味着什么？',
      [
        'A. 一场普通的商业纠纷',
        'B. 法租界高层有人利用学校掩护走私，陈老师和沈玉芳发现了真相',
        'C. 吴校长私自挪用学校资金',
        'D. 公董局要拆除光华小学建仓库'
      ],
      1,
      'deduc_fusheng_ok',
      'deduc_fusheng_fail',
      ['王巡官遗留纸条','陈明远的信','恐吓信','公董局公文纸','教具箱走私']
    );
  },

  logNarration(text) {
    const d = document.createElement('div'); d.className = 'entry';
    d.innerHTML = `<div class="narration">${text}</div>`;
    this.logEl.appendChild(d);
    this.scroll();
  },

  logChoice(text) {
    const d = document.createElement('div'); d.className = 'entry';
    d.innerHTML = `<div class="choice-log">▸ ${text}</div>`;
    this.logEl.appendChild(d);
    this.scroll();
  },

  chapterBreak(title, subtitle) {
    const d = document.createElement('div'); d.className = 'entry';
    let sub = subtitle || '';
    if (this.state.atmosphere) sub += (sub ? ' · ' : '') + `<span style="color:#6f8a9a">${this.state.atmosphere}</span>`;
    d.innerHTML = `<div class="chapter-title">${title}<small>${sub}</small></div>`;
    this.logEl.appendChild(d);
    this.scroll();
  },

  ambientLine() {
    const a = this.state.atmosphere;
    const lines = {
      '秋雨绵绵': '檐水滴滴答答地敲着青石板。',
      '阴云低垂': '云压得很低，像一床灰棉被罩在上海头顶。',
      '薄雾笼街': '雾从苏州河那边漫过来，路灯变成一圈模糊的光晕。',
      '雨后初晴': '雨刚停，路面还泛着水光，空气里有一种干净的凉意。',
      '暮色昏黄': '太阳收走了最后一丝光，法租界的霓虹灯次第亮起。',
      '冷月清辉': '月亮悬在屋顶上方，清冷的光把影子拉得很长。',
      '深夜': '街上没什么人了，偶尔一辆黄包车碾过水洼，声音传得很远。'
    };
    const hint = lines[a] || '';
    if (hint) {
      this.logNarration(`<span style="color:#6a7a8a;font-size:13px">${hint}</span>`);
    }
  },

  scroll() {
    setTimeout(() => {
      document.getElementById('scroll-anchor').scrollIntoView({behavior:'smooth'});
    }, 50);
  },

  renderScene(node, nodeId) {
    if (!node) return this.endGame('场景丢失。');
    if (nodeId) {
      this.state.currentScene = nodeId;
      this.state.visitedNodes[nodeId] = (this.state.visitedNodes[nodeId] || 0) + 1;
    }
    if (node.effect) node.effect(this.state);
    if (node.time) { this.setTime(node.time.d, node.time.h, node.time.m); }
    if (node.cost && this.state.visitedNodes[nodeId] <= 1) {
      this.spendTime(node.cost.h || 0, node.cost.m || 0, node.cost.reason || '调查耗时');
    }
    if (node.weather !== undefined) {
      const oldWeather = this.state.weatherIdx;
      this.setWeather(node.weather);
      this.applyWeatherClass();
      if (nodeId && nodeId !== 'ch1_open' && this.state.visitedNodes[nodeId] <= 1) {
        this.ambientLine();
      }
    }
    this.titleEl.innerHTML = node.title ? node.title + '  ' + this.atmosphereTag() : '';
    this.textEl.innerHTML = this.resolveText(node);
    this.choicesEl.innerHTML = '';
    if (node.type === 'end') {
      this.unlockEnding(nodeId, node.title);
      this.renderEndChoices();
      this.updateStatus();
      this.saveGame(false);
      this.scroll();
      return;
    }
    const choices = typeof node.choices === 'function' ? node.choices(this.state) : node.choices;
    if (choices && choices.length) {
      // Auto 2-column grid when 4+ choices
      this.choicesEl.classList.toggle('choices-grid', choices.length >= 4);
      choices.forEach(c => {
        const btn = document.createElement('button');
        const locked = c.when && !c.when(this.state);
        btn.className = locked ? 'choice-btn locked' : 'choice-btn';
        btn.textContent = locked ? (c.fogText || '🌫️ 迷雾中的选项') : c.text;
        if (locked) btn.title = '这条路还看不清。';
        btn.onclick = () => {
          if (locked) {
            this.toast(c.fogHint || '这条路还藏在雾里。继续调查，也许会看清它。');
            return;
          }
          this.logChoice(c.text);
          if (c.effect) c.effect(this.state);
          if (c.goto) {
            const target = typeof c.goto === 'function' ? c.goto(this.state) : c.goto;
            this.go(target);
          }
          if (c.end) this.endGame(c.end);
        };
        this.choicesEl.appendChild(btn);
      });
    } else {
      // 没有选项 = 自动推进
      if (node.auto) {
        setTimeout(() => {
          const target = node.auto(this.state);
          if (target) this.go(target);
        }, 800);
      }
    }
    // Show present button if node has onPresent handler
    if (node.onPresent) {
      this.showPresentBtn();
    }
    this.updateStatus();
    this.saveGame(false);
    this.scroll();
  },

  go(nodeId) {
    if (nodeId === 'end') return this.endGame('故事结束。');
    this.state.sceneLog.push(nodeId);
    this.renderScene(nodes[nodeId], nodeId);
  },

  endGame(msg) {
    this.titleEl.textContent = '调查中断';
    this.choicesEl.innerHTML = '';
    this.textEl.innerHTML = `<span class="danger">${msg}</span>`;
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = '🔄 重新开始';
    btn.onclick = () => { this.start(); };
    this.choicesEl.appendChild(btn);
    this.updateStatus();
  },

  renderEndChoices() {
    const note = document.createElement('div');
    note.className = 'notice';
    note.textContent = '本结局已记录到线索簿。你可以重开调查，尝试另一条判断。';
    this.choicesEl.appendChild(note);
    const restart = document.createElement('button');
    restart.className = 'choice-btn';
    restart.textContent = '🔄 重新开始，寻找另一个结局';
    restart.onclick = () => this.start();
    this.choicesEl.appendChild(restart);
    const panel = document.createElement('button');
    panel.className = 'choice-btn';
    panel.textContent = '📒 打开线索簿';
    panel.onclick = () => this.openPanel();
    this.choicesEl.appendChild(panel);
  },

  resolveText(node) {
    if (!node.text) return '';
    return typeof node.text === 'function' ? node.text(this.state) : node.text;
  },

  addClue(name, desc) {
    if (!this.state.clues.find(c => c.name === name)) {
      this.state.clues.push({name, desc});
      this.toast(`获得线索：${name}`);
    }
  },
  hasClue(name) { return this.state.clues.some(c => c.name === name); },
  addItem(name, desc) {
    if (!this.state.items.find(i => i.name === name)) {
      this.state.items.push({name, desc});
      this.toast(`获得道具：${name}`);
    }
  },
  hasItem(name) { return this.state.items.some(i => i.name === name); },
  addContact(name) {
    if (!this.state.contacts.includes(name)) {
      this.state.contacts.push(name);
      this.toast(`人物记录：${name}`);
    }
  },
  setFlag(k, v) { this.state.flags[k] = v; },
  getFlag(k) { return this.state.flags[k]; },

  unlockEnding(id, title) {
    if (!id || !title) return;
    if (!this.state.endings.find(e => e.id === id)) {
      this.state.endings.push({id, title, at: new Date().toISOString()});
      this.toast(`已解锁：${title}`);
    }
  },

  saveGame(manual) {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.state));
      document.getElementById('continue-btn').style.display = 'inline-block';
      if (manual) this.toast('已存档。');
    } catch (err) {
      if (manual) this.toast('存档失败，浏览器可能禁用了本地存储。');
    }
  },

  loadGame(manual) {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) {
      this.toast('没有可读取的存档。');
      return;
    }
    try {
      const data = JSON.parse(raw);
      this.state = Object.assign(this.freshState(), data);
      this.logEl.innerHTML = '';
      this.logEl.style.display = 'block';
      this.sceneEl.style.display = 'block';
      document.getElementById('title-screen').style.display = 'none';
      document.getElementById('top-actions').style.display = 'flex';
      document.getElementById('status-bar').style.display = 'flex';
      const history = this.state.sceneLog.slice(0, -1);
      history.forEach(id => {
        const n = nodes[id];
        if (n) this.logNarration(`<b>${n.title || '场景'}</b>`);
      });
      const current = this.state.currentScene || this.state.sceneLog[this.state.sceneLog.length - 1] || 'ch1_open';
      this.renderScene(nodes[current], current);
      if (manual) this.toast('已读档。');
    } catch (err) {
      this.toast('存档损坏，无法读取。');
    }
  },

  readSavedEndings() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data.endings) ? data.endings : [];
    } catch (err) {
      return [];
    }
  },

  // ── 氛围系统 ──
  setTime(day, hour, minute) {
    this.state.inGameTime = { day:day||1, hour:hour||14, minute:minute||0 };
    this.state.atmosphere = this.renderAtmosphere();
  },

  advanceTime(hours, minutes) {
    const t = this.state.inGameTime;
    t.minute += minutes || 0;
    t.hour += hours || 0;
    while (t.minute >= 60) { t.minute -= 60; t.hour++; }
    if (t.hour >= 24) { t.hour -= 24; t.day++; }
    this.state.atmosphere = this.renderAtmosphere();
  },

  spendTime(hours, minutes, reason) {
    this.advanceTime(hours, minutes);
    if (reason) this.toast(`${reason}，时间推进了。`);
    this.checkDeadline();
  },

  timeToMinutes(t) {
    return (t.day || 1) * 24 * 60 + (t.hour || 0) * 60 + (t.minute || 0);
  },

  minutesUntilDeadline() {
    if (!this.state.pressure) this.state.pressure = { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };
    return this.timeToMinutes(this.state.pressure.deadline) - this.timeToMinutes(this.state.inGameTime);
  },

  checkDeadline() {
    if (this.minutesUntilDeadline() < 0) {
      this.setFlag('missed_deadline', true);
    }
  },

  addHeat(n, reason) {
    if (!this.state.pressure) this.state.pressure = { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };
    this.state.pressure.heat = Math.max(0, this.state.pressure.heat + n);
    if (reason) this.toast(reason);
  },

  pressureLabel() {
    const left = this.minutesUntilDeadline();
    const heat = this.state.pressure?.heat || 0;
    const heatLabel = heat >= 4 ? '高危' : heat >= 2 ? '紧张' : '可控';
    if (left < 0) return `已错过 · ${heatLabel}`;
    const h = Math.floor(left / 60);
    const m = left % 60;
    return `${h}时${String(m).padStart(2,'0')}分 · ${heatLabel}`;
  },

  setWeather(idx) {
    this.state.weatherIdx = idx;
    this.state.atmosphere = this.renderAtmosphere();
  },

  renderAtmosphere() {
    const t = this.state.inGameTime;
    const periodIdx = t.hour < 6 ? 6 : t.hour < 8 ? 0 : t.hour < 11 ? 1 : t.hour < 13 ? 2 : t.hour < 16 ? 3 : t.hour < 18 ? 4 : t.hour < 21 ? 5 : 6;
    const period = this.periods[periodIdx];
    const weather = this.weathers[this.state.weatherIdx];
    return `${period}，${weather}`;
  },

  atmosphereTag() {
    const a = this.state.atmosphere;
    return `<span style="color:#6f8a9a;font-size:13px">【 ${a} 】</span>`;
  },

  applyWeatherClass() {
    const w = this.state.weatherIdx;
    document.body.classList.remove('w0','w1','w2','w3','w4','w5','w6');
    document.body.classList.add('w' + w);
  },

  // ── 举证系统 ──
  showPresentBtn() {
    const existing = document.getElementById('present-btn-wrapper');
    if (existing) return;
    // Pre-check: only show button if at least one item/clue triggers a response
    const nodeId = this.state.currentScene;
    const node = nodes[nodeId];
    if (!node || !node.onPresent) return;
    const allThings = [...this.state.clues.map(c=>({type:'clue',...c})), ...this.state.items.map(i=>({type:'item',...i}))];
    // Pre-filter with flag save/restore to avoid side effects
    const savedFlags = this.state.flags ? {...this.state.flags} : {};
    const hasValid = allThings.some(t => {
      try {
        const r = typeof node.onPresent === 'function' ? node.onPresent(t, this.state) : node.onPresent;
        return r && (r.goto || r.text);
      } catch(e) { return false; }
    });
    this.state.flags = savedFlags;
    if (typeof E !== 'undefined' && E.state) E.state.flags = savedFlags;
    if (!hasValid) return;
    const wrap = document.createElement('div');
    wrap.id = 'present-btn-wrapper';
    wrap.style.cssText = 'margin-top:10px;border-top:1px dashed #2a2a48;padding-top:12px';
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.textContent = '🔍 出示线索或物品';
    btn.style.cssText = 'width:100%';
    btn.onclick = () => this.openPresentModal();
    wrap.appendChild(btn);
    this.choicesEl.appendChild(wrap);
  },

  openPresentModal() {
    const state = this.state;
    const nodeId = state.currentScene;
    const node = nodes[nodeId];
    // No onPresent handler → nothing to show
    if (!node || !node.onPresent) { this.toast('当前没有可以出示的东西。'); return; }
    const allThings = [...state.clues.map(c=>({type:'clue',...c})), ...state.items.map(i=>({type:'item',...i}))];
    if (allThings.length === 0) { this.toast('你身上没有可以出示的东西。'); return; }
    // Pre-filter: only show items that trigger a real response from onPresent
    // Save & restore flags to prevent side effects from corrupting game state
    const savedFlags = state.flags ? {...state.flags} : {};
    const validThings = allThings.filter(t => {
      try {
        const r = typeof node.onPresent === 'function' ? node.onPresent(t, state) : node.onPresent;
        return r && (r.goto || r.text);
      } catch(e) { return false; }
    });
    state.flags = savedFlags;
    if (typeof E !== 'undefined' && E.state) E.state.flags = savedFlags;
    if (validThings.length === 0) { this.toast('没有能在此处出示的线索。'); return; }
    // Create modal
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px';
    const box = document.createElement('div');
    box.style.cssText = 'background:#0f0f1e;border:1px solid #3a3a58;border-radius:12px;max-width:460px;width:100%;max-height:70vh;padding:20px;overflow:auto';
    box.innerHTML = '<h3 style="color:#c8a87c;font-size:16px;margin-bottom:12px">选择要出示的线索或物品</h3>';
    validThings.forEach(t => {
      const card = document.createElement('div');
      card.style.cssText = 'background:#171727;border:1px solid #282846;border-radius:8px;padding:10px 12px;margin:6px 0;cursor:pointer;transition:.12s';
      card.innerHTML = `<b style="color:#d8bd8e">${t.type==='item'?'🎒':'🔍'} ${t.name}</b><br><span style="color:#999;font-size:13px">${t.desc}</span>`;
      card.onmouseenter = () => { card.style.borderColor = '#6f86c8'; card.style.background = '#1c1c30'; };
      card.onmouseleave = () => { card.style.borderColor = '#282846'; card.style.background = '#171727'; };
      card.onclick = () => {
        mask.remove();
        this.handlePresent(t);
      };
      box.appendChild(card);
    });
    const close = document.createElement('button');
    close.className = 'tool-btn';
    close.textContent = '取消';
    close.style.cssText = 'margin-top:10px';
    close.onclick = () => mask.remove();
    box.appendChild(close);
    mask.appendChild(box);
    document.body.appendChild(mask);
  },

  handlePresent(item) {
    const nodeId = this.state.currentScene;
    const node = nodes[nodeId];
    if (node && node.onPresent) {
      const result = typeof node.onPresent === 'function' ? node.onPresent(item, this.state) : node.onPresent;
      if (result) {
        if (result.goto) {
          this.logChoice(`出示了「${item.name}」`);
          this.toast(`你出示了「${item.name}」`);
          this.go(result.goto);
          return;
        }
        if (result.text) {
          this.logChoice(`出示了「${item.name}」`);
          this.toast(`你出示了「${item.name}」`);
          this.textEl.innerHTML += `<div class="notice" style="margin-top:12px">${result.text}</div>`;
          if (result.effect) result.effect(this.state);
          return;
        }
      }
    }
    this.toast(`出示「${item.name}」似乎没有引起特别的反应。`);
  },

  // ── 推理拼图 ──
  registerDeduction(id, question, options, correctIdx, successNode, failNode, requiredClues) {
    this.deductions.push({id, question, options, correctIdx, successNode, failNode, requiredClues, solved:false});
  },

  canDeduce(id) {
    const d = this.deductions.find(d => d.id === id);
    if (!d || d.solved) return false;
    return d.requiredClues.every(c => this.hasClue(c));
  },

  openDeduction(id) {
    const d = this.deductions.find(d => d.id === id);
    if (!d) return;
    if (d.solved) return this.toast('你已经推理过这一环了。');
    const missing = d.requiredClues.filter(c => !this.hasClue(c));
    if (missing.length > 0) {
      this.toast('你还没有掌握足够的线索来推理这一环。');
      return;
    }
    // Render deduction UI
    this.deducEl.querySelector('.deduc-question').textContent = d.question;
    const optContainer = this.deducEl.querySelector('.deduc-options');
    optContainer.innerHTML = '';
    d.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'deduc-btn';
      btn.textContent = opt;
      btn.onclick = () => this.submitDeduction(d.id, i);
      optContainer.appendChild(btn);
    });
    document.getElementById('deduc-title').textContent = '推理 —— ' + d.question.replace(/[？?]$/,'');
    this.deducEl.style.display = 'flex';
  },

  submitDeduction(id, chosenIdx) {
    const d = this.deductions.find(d => d.id === id);
    if (!d) return;
    this.deducEl.style.display = 'none';
    if (chosenIdx === d.correctIdx) {
      d.solved = true;
      this.toast('✅ 推理正确！拼图又完整了一块。');
      this.go(d.successNode);
    } else {
      this.toast('❌ 推理有误——证据不足以支持这个判断。故事继续，但这条路可能错过了什么。');
      this.go(d.failNode);
    }
  },

  closeDeduction() {
    this.deducEl.style.display = 'none';
  },

  // ── 关系图 ──
  registerRelation(person, labels, connectsTo) {
    if (!this.relationData.nodes.find(n => n.id === person)) {
      this.relationData.nodes.push({id:person, labels:labels||[], discovered:false});
    }
    if (connectsTo) {
      connectsTo.forEach(target => {
        if (!this.relationData.edges.find(e => (e.from === person && e.to === target) || (e.from === target && e.to === person))) {
          this.relationData.edges.push({from:person, to:target, revealed:false});
        }
      });
    }
  },

  discoverRelation(person) {
    const n = this.relationData.nodes.find(n => n.id === person);
    if (n) n.discovered = true;
    this.relationData.edges.forEach(e => {
      const fromDisc = this.relationData.nodes.find(n => n.id === e.from)?.discovered;
      const toDisc = this.relationData.nodes.find(n => n.id === e.to)?.discovered;
      if (fromDisc && toDisc) e.revealed = true;
    });
  },

  openGraph() {
    this.renderGraph();
    this.graphEl.style.display = 'flex';
  },

  closeGraph() {
    this.graphEl.style.display = 'none';
  },

  renderGraph() {
    const svg = this.graphEl.querySelector('.graph-svg');
    if (!svg) return;
    const nodes = this.relationData.nodes.filter(n => n.discovered);
    const edges = this.relationData.edges.filter(e => e.revealed);
    if (nodes.length === 0) {
      svg.innerHTML = '<text x="200" y="160" fill="#666" font-size="14" text-anchor="middle">还没有建立人物关系。</text>';
      return;
    }
    const cx = 200, cy = 150, r = Math.min(110, 60 + nodes.length * 20);
    const angleStep = nodes.length > 1 ? 2 * Math.PI / nodes.length : 0;
    const positions = {};
    nodes.forEach((n, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      positions[n.id] = {x, y};
    });
    let svgContent = '';
    // Edges
    edges.forEach(e => {
      const from = positions[e.from];
      const to = positions[e.to];
      if (from && to) {
        svgContent += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#334" stroke-width="1.5" opacity="0.5"/>`;
      }
    });
    // Nodes
    nodes.forEach(n => {
      const p = positions[n.id];
      if (!p) return;
      const label = `${n.id}\n${n.labels.join(' · ')}`;
      svgContent += `<g>"`;
      svgContent += `<circle cx="${p.x}" cy="${p.y}" r="22" fill="#1a1a2e" stroke="#c8a87c" stroke-width="1.5" opacity="0.9"/>`;
      svgContent += `<text x="${p.x}" y="${p.y + 4}" fill="#d0d0da" font-size="10" text-anchor="middle" dominant-baseline="middle">${n.id.slice(0,3)}</text>`;
      svgContent += `</g>`;
    });
    svg.innerHTML = svgContent;
  },

  renderClueWall() {
    const clues = this.state.clues;
    if (clues.length < 3) return '';
    const wallNodes = [
      {id:'苏晚亭失踪', label:'苏晚亭失踪', color:'#c8a87c', check: () => true},
      {id:'陈明远坠楼', label:'陈明远坠楼', color:'#d08070', check: () => E.hasClue('陈明远坠楼案')},
      {id:'沈玉芳失踪', label:'沈玉芳失踪', color:'#d08070', check: () => E.hasClue('沈玉芳')},
      {id:'陆小姐身份', label:'陆小姐身份', color:'#8a7ab8', check: () => E.hasClue('恐吓信') && E.hasClue('陆小姐的笔记')},
      {id:'黑衣男人暗线', label:'黑衣男人暗线', color:'#b8a070', check: () => E.hasClue('跟踪黑衣男人') || E.hasClue('神秘女子')},
      {id:'福生仓真相', label:'福生仓真相', color:'#6f86c8', check: () => E.hasClue('王巡官遗留纸条')},
    ];
    const edges = [
      ['苏晚亭失踪','陈明远坠楼'],
      ['苏晚亭失踪','沈玉芳失踪'],
      ['陈明远坠楼','陆小姐身份'],
      ['陆小姐身份','黑衣男人暗线'],
      ['黑衣男人暗线','福生仓真相'],
      ['沈玉芳失踪','福生仓真相'],
    ];
    const visibleNodes = wallNodes.filter(n => n.check());
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = edges.filter(e => visibleIds.has(e[0]) && visibleIds.has(e[1]));
    if (visibleNodes.length < 2) return '';
    let html = '<div style="position:relative;padding:8px 4px">';
    html += visibleNodes.map((n,i) => {
      const pct = 5 + (i * 85 / (visibleNodes.length - 1 || 1));
      return `<div style="display:inline-block;background:rgba(23,23,40,.9);border:1px solid ${n.color};border-radius:6px;padding:6px 10px;margin:3px 2px;font-size:12px;color:#ddd">${n.label}</div>`;
    }).join('');
    if (visibleEdges.length > 0) {
      html += '<div style="margin-top:8px;border-top:1px solid #2a2a48;padding-top:8px;font-size:11px;color:#667">';
      html += visibleEdges.map(e => `↗ ${e[0]} ↔ ${e[1]}`).join('<br>');
      html += '</div>';
    }
    html += '</div>';
    return html;
  },

  caseStrength() {
    const n = this.state.clues.length;
    if (n >= 13) return {name:'证据成链', desc:'关键人物、地点与动机已经能互相印证。'};
    if (n >= 9) return {name:'脉络清晰', desc:'主线已经成形，但仍有几处断口。'};
    if (n >= 5) return {name:'线索散落', desc:'你看到了方向，还没有看见全局。'};
    return {name:'雾气很重', desc:'现在下判断太早，最好继续走访。'};
  },

  openPanel() {
    this.renderPanel();
    document.getElementById('side-panel').classList.add('open');
    document.getElementById('side-panel').setAttribute('aria-hidden', 'false');
  },

  closePanel() {
    document.getElementById('side-panel').classList.remove('open');
    document.getElementById('side-panel').setAttribute('aria-hidden', 'true');
  },

  renderPanel() {
    const strength = this.caseStrength();
    const pressure = this.pressureLabel();
    const clues = this.state.clues.map(c => `<div class="clue-card"><b>${c.name}</b><br>${c.desc}</div>`).join('') || '<div class="empty">还没有记录到关键线索。</div>';
    const items = this.state.items.map(i => `<div class="clue-card"><b>${i.name}</b><br>${i.desc}</div>`).join('') || '<div class="empty">口袋里还没有关键物件。</div>';
    const contacts = this.state.contacts.map(c => `<div class="clue-card">${c}</div>`).join('') || '<div class="empty">还没有可追踪的人物。</div>';
    const route = this.state.sceneLog.slice(-10).map(id => nodes[id] ? nodes[id].title : id).join(' → ') || '尚未开始';
    const endings = this.state.endings.map(e => `<div class="clue-card"><b>${e.title}</b><br>${new Date(e.at).toLocaleString('zh-CN')}</div>`).join('') || '<div class="empty">还没有解锁结局。</div>';
    const graphCount = this.relationData.nodes.filter(n => n.discovered).length;
    const wallHtml = this.renderClueWall();
    document.getElementById('panel-content').innerHTML = `
      <div class="panel-section"><h3>案情判断</h3><div class="clue-card"><b>${strength.name}</b><br>${strength.desc}</div></div>
      <div class="panel-section"><h3>调查压力</h3><div class="clue-card"><b>福生仓清场倒计时</b><br>${pressure}</div></div>
      ${wallHtml ? `<div class="panel-section"><h3>🧩 推理墙</h3>${wallHtml}</div>` : ''}
      <div class="panel-section"><h3>关键线索（${this.state.clues.length}）</h3>${clues}</div>
      <div class="panel-section"><h3>随身物品（${this.state.items.length}）</h3>${items}</div>
      <div class="panel-section"><h3>人物关系（${this.state.contacts.length}） <button class="tool-btn" onclick="E.openGraph()" style="float:right;font-size:11px;padding:3px 8px">查看关系图</button></h3>${contacts}<p style="color:#556;font-size:12px;margin-top:4px">已发现 ${graphCount}/${this.relationData.nodes.length} 位人物</p></div>
      <div class="panel-section"><h3>最近足迹</h3><div class="clue-card">${route}</div></div>
      <div class="panel-section"><h3>结局记录（${this.state.endings.length}/8）</h3>${endings}</div>
    `;
  },

  toast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 1800);
  },

  updateStatus() {
    document.getElementById('s-case').textContent = '雾锁迷踪';
    document.getElementById('s-clues').textContent = this.state.clues.length;
    document.getElementById('s-items').textContent = this.state.items.length;
    document.getElementById('s-contacts').textContent = this.state.contacts.length || '—';
    const chNames = ['','序幕·委托','第一章·现场','第二章·走访','第三章·卷宗','终章·真相'];
    document.getElementById('s-chapter').textContent = chNames[this.state.chapter] || '—';
    const atm = this.state.atmosphere || '';
    document.getElementById('s-atmo').textContent = atm;
    const p = document.getElementById('s-pressure');
    if (p) p.textContent = this.pressureLabel();
  }
};
