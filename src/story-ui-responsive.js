// ===== 响应式 UI、分页阅读与分页线索簿 =====
// 目标：桌面端常驻右侧信息栏，手机端底部抽屉分页；场景正文按页阅读，线索簿按档案分页。

function applyResponsiveStoryUI() {
  if (typeof E === 'undefined' || typeof document === 'undefined') return;

  const hasRuntimeUI = typeof E.start === 'function'
    && typeof E.loadGame === 'function'
    && typeof E.renderScene === 'function'
    && typeof E.caseStrength === 'function'
    && typeof E.pressureLabel === 'function'
    && typeof E.renderClueWall === 'function';

  if (!hasRuntimeUI) return;

  E.panelTab = E.panelTab || 'overview';
  E.panelListPages = E.panelListPages || {};
  E.scenePage = 0;
  E.scenePages = [];

  E.themeKey = 'mlt_theme_mode';
  E.themeMode = localStorage.getItem(E.themeKey) || 'night';

  E.applyThemeMode = function (mode) {
    const next = mode === 'day' ? 'day' : 'night';
    this.themeMode = next;
    document.body.classList.toggle('theme-day', next === 'day');
    document.body.classList.toggle('theme-night', next !== 'day');
    const btn = document.getElementById('btn-atmo');
    if (btn) btn.textContent = next === 'day' ? '🌙 夜间' : '☀️ 日间';
    try { localStorage.setItem(this.themeKey, next); } catch (err) {}
  };

  E.toggleThemeMode = function () {
    const next = this.themeMode === 'day' ? 'night' : 'day';
    this.applyThemeMode(next);
    this.toast(next === 'day' ? '已切换到日间档案模式。' : '已切换到夜间侦探模式。');
  };

  E.applyThemeMode(E.themeMode);
  const themeButton = document.getElementById('btn-atmo');
  if (themeButton) themeButton.onclick = () => E.toggleThemeMode();

  E.setPanelTab = function (tab) {
    this.panelTab = tab || 'overview';
    this.renderPanel();
  };

  E.setPanelListPage = function (key, page) {
    this.panelListPages = this.panelListPages || {};
    this.panelListPages[key] = Math.max(0, page || 0);
    this.renderPanel();
  };

  function itemCard(item, icon) {
    const name = typeof item === 'string' ? item : item.name;
    const desc = typeof item === 'string' ? '' : item.desc;
    return `<div class="clue-card"><b>${icon || ''}${name}</b>${desc ? `<br>${desc}` : ''}</div>`;
  }

  function pageNav(key, page, totalPages, totalCount) {
    if (totalPages <= 1) return `<div class="panel-note">共 ${totalCount} 条。</div>`;
    return `
      <div class="panel-page-nav">
        <button class="scene-page-btn" ${page <= 0 ? 'disabled' : ''} onclick="E.setPanelListPage('${key}', ${page - 1})">上一页</button>
        <button class="scene-page-btn primary" ${page >= totalPages - 1 ? 'disabled' : ''} onclick="E.setPanelListPage('${key}', ${page + 1})">下一页</button>
        <span class="scene-page-indicator">${page + 1} / ${totalPages} · 共 ${totalCount} 条</span>
      </div>`;
  }

  function pagedCardList(key, list, empty, icon, pageSize) {
    if (!list || list.length === 0) return `<div class="empty">${empty}</div>`;
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const page = Math.max(0, Math.min(E.panelListPages[key] || 0, totalPages - 1));
    E.panelListPages[key] = page;
    const start = page * pageSize;
    const visible = list.slice(start, start + pageSize);
    return `
      <div class="panel-list compact-list">${visible.map(item => itemCard(item, icon)).join('')}</div>
      ${pageNav(key, page, totalPages, list.length)}`;
  }

  function tabButton(active, id, label, count) {
    const badge = count === undefined ? '' : `<span>${count}</span>`;
    return `<button class="panel-tab ${active === id ? 'active' : ''}" onclick="E.setPanelTab('${id}')">${label}${badge}</button>`;
  }

  function compactRoute(state) {
    return state.sceneLog.slice(-30).map(id => nodes[id] ? nodes[id].title : id).filter(Boolean).reverse();
  }

  function plainLength(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, '').length;
  }

  function splitSceneHtml(html) {
    const isPhone = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    const limit = isPhone ? 150 : 260;
    const maxBlocksPerPage = isPhone ? 1 : 2;
    const blocks = html
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<!--PAGE_BREAK-->')
      .split('<!--PAGE_BREAK-->')
      .map(s => s.trim())
      .filter(Boolean);

    if (blocks.length <= 1 && plainLength(html) <= limit) return [html];

    const sourceBlocks = blocks.length ? blocks : [html];
    const pages = [];
    let current = [];
    let size = 0;

    for (const block of sourceBlocks) {
      const blockSize = Math.max(plainLength(block), 20);
      const wouldOverflowText = current.length && size + blockSize > limit;
      const wouldOverflowBlocks = current.length >= maxBlocksPerPage;
      if (wouldOverflowText || wouldOverflowBlocks) {
        pages.push(current.join('<br><br>'));
        current = [block];
        size = blockSize;
      } else {
        current.push(block);
        size += blockSize;
      }
    }

    if (current.length) pages.push(current.join('<br><br>'));
    return pages.length ? pages : [html];
  }

  E.renderScenePage = function () {
    if (!this.scenePages || this.scenePages.length === 0) return;
    const total = this.scenePages.length;
    this.scenePage = Math.max(0, Math.min(this.scenePage || 0, total - 1));
    const isLast = this.scenePage >= total - 1;

    this.sceneEl.classList.toggle('has-scene-pager', total > 1);
    this.textEl.innerHTML = this.scenePages[this.scenePage];
    this.choicesEl.classList.toggle('choices-hidden', total > 1 && !isLast);

    let pager = document.getElementById('scene-pager');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'scene-pager';
      this.textEl.insertAdjacentElement('afterend', pager);
    }

    if (total <= 1) {
      pager.innerHTML = '';
      pager.style.display = 'none';
      this.choicesEl.classList.remove('choices-hidden');
      return;
    }

    pager.style.display = 'flex';
    pager.innerHTML = `
      <button class="scene-page-btn" ${this.scenePage === 0 ? 'disabled' : ''} onclick="E.prevScenePage()">上一页</button>
      <button class="scene-page-btn primary" onclick="E.nextScenePage()">${isLast ? '显示选项' : '下一页'}</button>
      <span class="scene-page-indicator">第 ${this.scenePage + 1} / ${total} 页</span>
    `;
  };

  E.nextScenePage = function () {
    if (!this.scenePages || this.scenePages.length <= 1) return;
    if (this.scenePage < this.scenePages.length - 1) {
      this.scenePage += 1;
      this.renderScenePage();
      this.sceneEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    this.choicesEl.classList.remove('choices-hidden');
  };

  E.prevScenePage = function () {
    if (!this.scenePages || this.scenePages.length <= 1) return;
    if (this.scenePage > 0) {
      this.scenePage -= 1;
      this.renderScenePage();
      this.sceneEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  E.setupScenePager = function () {
    if (!this.textEl || !this.choicesEl || !this.sceneEl) return;
    const html = this.textEl.innerHTML || '';
    this.scenePages = splitSceneHtml(html);
    this.scenePage = 0;
    this.renderScenePage();
  };

  const oldScroll = E.scroll.bind(E);
  E.scroll = function () {
    if (document.body.classList.contains('game-active') && this.sceneEl) {
      setTimeout(() => this.sceneEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
    oldScroll();
  };

  const oldStart = E.start.bind(E);
  E.start = function () {
    document.body.classList.add('game-active');
    oldStart();
    this.renderPanel();
  };

  const oldLoadGame = E.loadGame.bind(E);
  E.loadGame = function (manual) {
    oldLoadGame(manual);
    if (this.state && this.state.currentScene) {
      document.body.classList.add('game-active');
      this.renderPanel();
    }
  };

  const oldRenderScene = E.renderScene.bind(E);
  E.renderScene = function (node, nodeId) {
    oldRenderScene(node, nodeId);
    if (document.body.classList.contains('game-active')) {
      this.setupScenePager();
      this.renderPanel();
    }
  };

  E.renderPanel = function () {
    const panel = document.getElementById('panel-content');
    if (!panel || !this.state) return;

    const active = this.panelTab || 'overview';
    const strength = this.caseStrength();
    const pressure = this.pressureLabel();
    const clues = (this.state.clues || []).slice().reverse();
    const items = (this.state.items || []).slice().reverse();
    const contacts = this.state.contacts || [];
    const endings = (this.state.endings || []).slice().reverse();
    const route = compactRoute(this.state);
    const graphCount = this.relationData.nodes.filter(n => n.discovered).length;
    const wallHtml = this.renderClueWall();

    const tabs = `
      <div class="panel-tabs" role="tablist">
        ${tabButton(active, 'overview', '总览')}
        ${tabButton(active, 'clues', '线索', clues.length)}
        ${tabButton(active, 'items', '物品', items.length)}
        ${tabButton(active, 'people', '人物', contacts.length)}
        ${tabButton(active, 'route', '足迹', route.length)}
        ${tabButton(active, 'endings', '结局', endings.length)}
      </div>`;

    const overview = `
      <div class="panel-page ${active === 'overview' ? 'active' : ''}">
        <div class="panel-summary-grid">
          <div class="summary-card"><small>案情</small><b>${strength.name}</b><span>${strength.desc}</span></div>
          <div class="summary-card"><small>压力</small><b>福生仓倒计时</b><span>${pressure}</span></div>
          <div class="summary-card"><small>线索</small><b>${clues.length}</b><span>关键记录</span></div>
          <div class="summary-card"><small>人物</small><b>${graphCount}/${this.relationData.nodes.length}</b><span>已发现关系</span></div>
        </div>
        ${wallHtml ? `<div class="panel-section"><h3>🧩 推理墙</h3>${wallHtml}</div>` : ''}
        <div class="panel-section"><h3>最近线索</h3>${pagedCardList('overview-clues', clues, '还没有记录到关键线索。', '🔍 ', 4)}</div>
      </div>`;

    const cluePage = `
      <div class="panel-page ${active === 'clues' ? 'active' : ''}">
        <div class="panel-section"><h3>关键线索（${clues.length}）</h3>${pagedCardList('clues', clues, '还没有记录到关键线索。', '🔍 ', 5)}</div>
      </div>`;

    const itemPage = `
      <div class="panel-page ${active === 'items' ? 'active' : ''}">
        <div class="panel-section"><h3>随身物品（${items.length}）</h3>${pagedCardList('items', items, '口袋里还没有关键物件。', '🎒 ', 5)}</div>
      </div>`;

    const peoplePage = `
      <div class="panel-page ${active === 'people' ? 'active' : ''}">
        <div class="panel-section">
          <h3>人物关系（${contacts.length}） <button class="tool-btn mini" onclick="E.openGraph()">关系图</button></h3>
          ${pagedCardList('people', contacts, '还没有可追踪的人物。', '📇 ', 8)}
          <p class="panel-note">已发现 ${graphCount}/${this.relationData.nodes.length} 位人物。关系图会随人物发现逐步显现。</p>
        </div>
      </div>`;

    const routeItems = route.map(title => ({ name: title, desc: '' }));
    const routePage = `
      <div class="panel-page ${active === 'route' ? 'active' : ''}">
        <div class="panel-section"><h3>最近足迹</h3>${pagedCardList('route', routeItems, '尚未开始调查。', '↗ ', 8)}</div>
      </div>`;

    const endingItems = endings.map(e => ({ name: e.title, desc: new Date(e.at).toLocaleString('zh-CN') }));
    const endingPage = `
      <div class="panel-page ${active === 'endings' ? 'active' : ''}">
        <div class="panel-section"><h3>结局记录（${endings.length}/8）</h3>${pagedCardList('endings', endingItems, '还没有解锁结局。', '🏁 ', 4)}</div>
      </div>`;

    panel.innerHTML = tabs + overview + cluePage + itemPage + peoplePage + routePage + endingPage;
  };
}

document.addEventListener('DOMContentLoaded', applyResponsiveStoryUI);
