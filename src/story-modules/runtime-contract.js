// ===== 运行时契约与存档兼容模块 =====
// 负责存档版本号、旧存档迁移、状态结构校验与安全读写。

function applyRuntimeContract() {
  if (typeof E === 'undefined') return;

  E.saveVersion = 7;

  E.normalizeTime = function (value, fallback = { day: 1, hour: 14, minute: 0 }) {
    const src = value && typeof value === 'object' ? value : fallback;
    const day = Number.isFinite(src.day) ? src.day : fallback.day;
    const hour = Number.isFinite(src.hour) ? src.hour : fallback.hour;
    const minute = Number.isFinite(src.minute) ? src.minute : fallback.minute;
    return { day, hour, minute };
  };

  E.normalizeThingList = function (list) {
    if (!Array.isArray(list)) return [];
    return list
      .map(item => {
        if (typeof item === 'string') return { name: item, desc: '' };
        if (!item || typeof item !== 'object') return null;
        const name = typeof item.name === 'string' ? item.name : '';
        if (!name) return null;
        return { name, desc: typeof item.desc === 'string' ? item.desc : '' };
      })
      .filter(Boolean);
  };

  E.normalizeStringList = function (list) {
    if (!Array.isArray(list)) return [];
    return [...new Set(list.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))];
  };

  E.normalizeEndings = function (list) {
    if (!Array.isArray(list)) return [];
    return list
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const id = typeof item.id === 'string' ? item.id : '';
        const title = typeof item.title === 'string' ? item.title : '';
        if (!id || !title) return null;
        return { id, title, at: typeof item.at === 'string' ? item.at : new Date(0).toISOString() };
      })
      .filter(Boolean);
  };

  E.validateStateShape = function (state) {
    const errors = [];
    const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
    if (!isObject(state)) errors.push('state 必须是对象');
    if (!Array.isArray(state?.clues)) errors.push('clues 必须是数组');
    if (!Array.isArray(state?.items)) errors.push('items 必须是数组');
    if (!Array.isArray(state?.contacts)) errors.push('contacts 必须是数组');
    if (!Array.isArray(state?.endings)) errors.push('endings 必须是数组');
    if (!Array.isArray(state?.sceneLog)) errors.push('sceneLog 必须是数组');
    if (!isObject(state?.flags)) errors.push('flags 必须是对象');
    if (!isObject(state?.visitedNodes)) errors.push('visitedNodes 必须是对象');
    if (!isObject(state?.inGameTime)) errors.push('inGameTime 必须是对象');
    if (!isObject(state?.pressure)) errors.push('pressure 必须是对象');
    if (!isObject(state?.pressure?.deadline)) errors.push('pressure.deadline 必须是对象');
    return { ok: errors.length === 0, errors };
  };

  E.migrateSaveState = function (rawState) {
    const base = this.freshStateWithoutMigration ? this.freshStateWithoutMigration() : this.freshState();
    const source = rawState && typeof rawState === 'object' ? rawState : {};
    const migrated = Object.assign({}, base, source);

    migrated.saveVersion = this.saveVersion;
    migrated.clues = this.normalizeThingList(source.clues);
    migrated.items = this.normalizeThingList(source.items);
    migrated.contacts = this.normalizeStringList(source.contacts);
    migrated.endings = this.normalizeEndings(source.endings);
    migrated.sceneLog = this.normalizeStringList(source.sceneLog);
    migrated.flags = source.flags && typeof source.flags === 'object' && !Array.isArray(source.flags) ? { ...source.flags } : {};
    migrated.visitedNodes = source.visitedNodes && typeof source.visitedNodes === 'object' && !Array.isArray(source.visitedNodes) ? { ...source.visitedNodes } : {};
    migrated.chapter = Number.isFinite(source.chapter) ? source.chapter : base.chapter;
    migrated.currentScene = typeof source.currentScene === 'string' ? source.currentScene : (migrated.sceneLog.at(-1) || base.currentScene);
    migrated.inGameTime = this.normalizeTime(source.inGameTime, base.inGameTime);
    migrated.pressure = source.pressure && typeof source.pressure === 'object' && !Array.isArray(source.pressure) ? { ...base.pressure, ...source.pressure } : base.pressure;
    migrated.pressure.heat = Number.isFinite(migrated.pressure.heat) ? migrated.pressure.heat : 0;
    migrated.pressure.deadline = this.normalizeTime(migrated.pressure.deadline, base.pressure.deadline);
    migrated.weatherIdx = Number.isFinite(source.weatherIdx) ? source.weatherIdx : base.weatherIdx;
    migrated.atmosphere = typeof source.atmosphere === 'string' ? source.atmosphere : base.atmosphere;

    const validation = this.validateStateShape(migrated);
    if (!validation.ok) {
      throw new Error(validation.errors.join('；'));
    }
    return migrated;
  };

  if (!E.freshStateWithoutMigration) E.freshStateWithoutMigration = E.freshState.bind(E);
  const oldFreshState = E.freshState.bind(E);
  E.freshState = function () {
    const state = oldFreshState();
    state.saveVersion = this.saveVersion;
    return state;
  };

  E.serializeState = function () {
    const state = this.migrateSaveState(this.state);
    return JSON.stringify(state);
  };

  E.saveGame = function (manual) {
    try {
      localStorage.setItem(this.saveKey, this.serializeState());
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) continueBtn.style.display = 'inline-block';
      if (manual) this.toast('已存档。');
    } catch (err) {
      if (manual) this.toast(`存档失败：${err.message || '浏览器可能禁用了本地存储。'}`);
    }
  };

  E.loadGame = function (manual) {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) {
      this.toast('没有可读取的存档。');
      return;
    }
    try {
      const data = JSON.parse(raw);
      const migrated = this.migrateSaveState(data);
      this.state = migrated;
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
      this.toast(`存档损坏，无法读取：${err.message || '未知错误'}`);
    }
  };

  E.readSavedEndings = function () {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return [];
      const data = this.migrateSaveState(JSON.parse(raw));
      return Array.isArray(data.endings) ? data.endings : [];
    } catch (err) {
      return [];
    }
  };
}

document.addEventListener('DOMContentLoaded', applyRuntimeContract);
