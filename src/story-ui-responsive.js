// ===== 响应式 UI 与分页线索簿 =====
// 目标：桌面端常驻右侧信息栏，手机端底部抽屉分页，避免线索簿内容堆叠。

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

  E.setPanelTab = function (tab) {
    this.panelTab = tab || 'overview';
    this.renderPanel();
  };

  function cardList(list, empty, icon) {
    if (!list || list.length === 0) return `<div class="empty">${empty}</div>`;
    return `<div class="panel-list">${list.map(item => {
      const name = typeof item === 'string' ? item : item.name;
      const desc = typeof item === 'string' ? '' : item.desc;
      return `<div class="clue-card"><b>${icon || ''}${name}</b>${desc ? `<br>${desc}` : ''}</div>`;
    }).join('')}</div>`;
  }

  function tabButton(active, id, label, count) {
    const badge = count === undefined ? '' : `<span>${count}</span>`;
    return `<button class="panel-tab ${active === id ? 'active' : ''}" onclick="E.setPanelTab('${id}')">${label}${badge}</button>`;
  }

  function compactRoute(state) {
    return state.sceneLog.slice(-12).map(id => nodes[id] ? nodes[id].title : id).filter(Boolean);
  }

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
    if (document.body.classList.contains('game-active')) this.renderPanel();
  };

  E.renderPanel = function () {
    const panel = document.getElementById('panel-content');
    if (!panel || !this.state) return;

    const active = this.panelTab || 'overview';
    const strength = this.caseStrength();
    const pressure = this.pressureLabel();
    const clues = this.state.clues || [];
    const items = this.state.items || [];
    const contacts = this.state.contacts || [];
    const endings = this.state.endings || [];
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
        <div class="panel-section"><h3>最近线索</h3>${cardList(clues.slice(-4).reverse(), '还没有记录到关键线索。', '🔍 ')}</div>
      </div>`;

    const cluePage = `
      <div class="panel-page ${active === 'clues' ? 'active' : ''}">
        <div class="panel-section"><h3>关键线索（${clues.length}）</h3>${cardList(clues.slice().reverse(), '还没有记录到关键线索。', '🔍 ')}</div>
      </div>`;

    const itemPage = `
      <div class="panel-page ${active === 'items' ? 'active' : ''}">
        <div class="panel-section"><h3>随身物品（${items.length}）</h3>${cardList(items.slice().reverse(), '口袋里还没有关键物件。', '🎒 ')}</div>
      </div>`;

    const peoplePage = `
      <div class="panel-page ${active === 'people' ? 'active' : ''}">
        <div class="panel-section">
          <h3>人物关系（${contacts.length}） <button class="tool-btn mini" onclick="E.openGraph()">关系图</button></h3>
          ${cardList(contacts, '还没有可追踪的人物。', '📇 ')}
          <p class="panel-note">已发现 ${graphCount}/${this.relationData.nodes.length} 位人物。关系图会随人物发现逐步显现。</p>
        </div>
      </div>`;

    const routePage = `
      <div class="panel-page ${active === 'route' ? 'active' : ''}">
        <div class="panel-section"><h3>最近足迹</h3>
          ${route.length ? `<ol class="route-list">${route.map(title => `<li>${title}</li>`).join('')}</ol>` : '<div class="empty">尚未开始调查。</div>'}
        </div>
      </div>`;

    const endingPage = `
      <div class="panel-page ${active === 'endings' ? 'active' : ''}">
        <div class="panel-section"><h3>结局记录（${endings.length}/8）</h3>
          ${endings.length ? `<div class="panel-list">${endings.map(e => `<div class="clue-card"><b>🏁 ${e.title}</b><br>${new Date(e.at).toLocaleString('zh-CN')}</div>`).join('')}</div>` : '<div class="empty">还没有解锁结局。</div>'}
        </div>
      </div>`;

    panel.innerHTML = tabs + overview + cluePage + itemPage + peoplePage + routePage + endingPage;
  };
}

document.addEventListener('DOMContentLoaded', applyResponsiveStoryUI);
