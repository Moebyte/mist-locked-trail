// ===== 线索簿与人物关系图轻量优化 =====
// 目标：线索簿更像侦探笔记，而不是开局空仪表盘；人物关系图只展示已发现/已确认内容。

(function installCasebookGraphPolish() {
  function applyCasebookGraphPolish() {
    if (typeof E === 'undefined' || typeof document === 'undefined') return;
    if (E.__casebookGraphPolishPatched) return;

    function esc(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function panelButton(tab, label, count, active) {
      const suffix = Number.isFinite(count) && count > 0 ? `<span>${count}</span>` : '';
      return `<button class="panel-tab ${active === tab ? 'active' : ''}" onclick="E.setPanelTab('${tab}')">${label}${suffix}</button>`;
    }

    function card(item, icon) {
      const name = typeof item === 'string' ? item : item?.name;
      const desc = typeof item === 'string' ? '' : item?.desc;
      return `<div class="clue-card"><b>${icon || ''}${esc(name || '未命名记录')}</b>${desc ? `<br><span>${esc(desc)}</span>` : ''}</div>`;
    }

    function listHtml(items, empty, icon, limit) {
      const list = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!list.length) return `<div class="empty">${empty}</div>`;
      const visible = limit ? list.slice(0, limit) : list;
      const more = limit && list.length > limit ? `<div class="panel-note">另有 ${list.length - limit} 条，切换分页查看。</div>` : '';
      return `<div class="panel-list compact-list">${visible.map(item => card(item, icon)).join('')}</div>${more}`;
    }

    function routeTitles(state) {
      const log = Array.isArray(state?.sceneLog) ? state.sceneLog : [];
      return log.slice(-18).map(id => (typeof nodes !== 'undefined' && nodes[id] ? nodes[id].title : id)).filter(Boolean).reverse();
    }

    function caseHint() {
      const s = E.state || {};
      const clueCount = (s.clues || []).length;
      if (!s.currentScene) return { title: '尚未开卷', desc: '案子还没有开始。' };
      if (E.getFlag('deduced_fusheng')) return { title: '核心真相浮出水面', desc: '福生仓、公董局与光华小学已经连成一条线。接下来要看证人、程序和结案判断。' };
      if (E.getFlag('dock_entry_committed') || E.getFlag('dock_solo_entry') || E.getFlag('dock_fast_support_entry') || E.getFlag('dock_full_support_entry')) return { title: '已进入福生仓线', desc: '现在不是普通走访，而是行动现场。动静、拖延和证人安全都会改变后果。' };
      if (E.getFlag('deduced_lu_zhao')) return { title: '福生仓线索正在收束', desc: '陆念薇、黑衣男人和王巡官留下的线索，正在把你推向苏州河边。' };
      if (E.getFlag('deduced_chen')) return { title: '旧案有了方向', desc: '陈明远之死不再像一场普通坠楼。下一步要确认陆小姐与光华小学之间的裂缝。' };
      if (clueCount > 0) return { title: '雾里已有碎片', desc: '你已经摸到几块拼图，但现在下判断还太早。继续走访，别急着定案。' };
      return { title: '雾气很重', desc: '现在下判断太早，最好继续走访。' };
    }

    function nextHint() {
      const s = E.state || {};
      if (!s.currentScene) return '开始调查后，线索簿会记录你真正掌握的信息。';
      if (E.getFlag('deduced_fusheng')) return '整理证人、程序和硬证据，决定这份真相能走到哪一步。';
      if (E.getFlag('dock_entry_committed') || E.getFlag('dock_solo_entry') || E.getFlag('dock_fast_support_entry') || E.getFlag('dock_full_support_entry')) return '现场阶段优先考虑救人窗口，不要把每一次拖延都当成免费搜证。';
      if (E.getFlag('deduced_lu_zhao')) return '可以开始考虑福生仓，但先确认手里有没有足够的钥匙线索。';
      if (E.getFlag('deduced_chen')) return '继续查陆小姐、黑衣男人和光华小学之间的关系。';
      if ((s.clues || []).length > 0) return '先把人物关系串起来，再决定下一处走访地点。';
      return '先听完委托人的说法，再决定从哪里查起。';
    }

    function pressureTitle() {
      const s = E.state || {};
      if (E.getFlag('dock_entry_committed') || E.getFlag('dock_solo_entry') || E.getFlag('dock_fast_support_entry') || E.getFlag('dock_full_support_entry')) return '福生仓行动风险';
      if (E.getFlag('deduced_lu_zhao') || E.getFlag('deduced_chen')) return '案情压力';
      return '调查压力';
    }

    function discoveredPeople() {
      const contactSet = new Set(E.state?.contacts || []);
      const relationNodes = Array.isArray(E.relationData?.nodes) ? E.relationData.nodes : [];
      return relationNodes.filter(n => n && (n.discovered || contactSet.has(n.id)));
    }

    function discoveredEdges(nodesShown) {
      const ids = new Set(nodesShown.map(n => n.id));
      const edges = Array.isArray(E.relationData?.edges) ? E.relationData.edges : [];
      return edges.filter(e => ids.has(e.from) && ids.has(e.to) && (e.revealed || ids.size <= 3));
    }

    E.renderPanel = function () {
      const panel = document.getElementById('panel-content');
      if (!panel || !this.state) return;

      const active = this.panelTab || 'overview';
      const clues = (this.state.clues || []).slice().reverse();
      const items = (this.state.items || []).slice().reverse();
      const contacts = (this.state.contacts || []).slice();
      const endings = (this.state.endings || []).slice().reverse();
      const route = routeTitles(this.state);
      const people = discoveredPeople();
      const edges = discoveredEdges(people);
      const hint = caseHint();
      const wall = typeof this.renderClueWall === 'function' ? this.renderClueWall() : '';
      const pressure = typeof this.pressureLabel === 'function' ? this.pressureLabel() : '尚未形成压力';

      const tabs = `
        <div class="panel-tabs" role="tablist">
          ${panelButton('overview', '总览', undefined, active)}
          ${panelButton('clues', '线索', clues.length, active)}
          ${panelButton('items', '物品', items.length, active)}
          ${panelButton('people', '人物', contacts.length || people.length, active)}
          ${panelButton('route', '足迹', route.length, active)}
          ${panelButton('endings', '结局', endings.length, active)}
        </div>`;

      const overview = `
        <div class="panel-page ${active === 'overview' ? 'active' : ''}">
          <div class="panel-section">
            <h3>案情状态</h3>
            <div class="clue-card"><b>${esc(hint.title)}</b><br><span>${esc(hint.desc)}</span></div>
          </div>
          <div class="panel-section">
            <h3>下一步</h3>
            <div class="clue-card"><span>${esc(nextHint())}</span></div>
          </div>
          <div class="panel-summary-grid">
            <div class="summary-card"><small>${pressureTitle()}</small><b>${esc(pressure)}</b><span>随行动阶段变化</span></div>
            <div class="summary-card"><small>已掌握</small><b>${clues.length + items.length}</b><span>线索与物品</span></div>
            <div class="summary-card"><small>人物</small><b>${people.length}</b><span>已浮出水面</span></div>
            <div class="summary-card"><small>足迹</small><b>${route.length}</b><span>最近调查节点</span></div>
          </div>
          ${wall ? `<div class="panel-section"><h3>🧩 推理墙</h3>${wall}</div>` : ''}
          ${(clues.length || items.length) ? `<div class="panel-section"><h3>最近记录</h3>${listHtml([...clues.slice(0, 3), ...items.slice(0, 2)], '还没有关键记录。', '✦ ', 5)}</div>` : ''}
        </div>`;

      const cluePage = `<div class="panel-page ${active === 'clues' ? 'active' : ''}"><div class="panel-section"><h3>关键线索</h3>${listHtml(clues, '还没有记录到关键线索。', '🔍 ')}</div></div>`;
      const itemPage = `<div class="panel-page ${active === 'items' ? 'active' : ''}"><div class="panel-section"><h3>随身物品</h3>${listHtml(items, '口袋里还没有关键物件。', '🎒 ')}</div></div>`;
      const peopleItems = people.map(n => ({ name: n.id, desc: Array.isArray(n.labels) ? n.labels.join(' · ') : '' }));
      const peoplePage = `
        <div class="panel-page ${active === 'people' ? 'active' : ''}">
          <div class="panel-section">
            <h3>人物关系 <button class="tool-btn mini" onclick="E.openGraph()">关系图</button></h3>
            ${listHtml(peopleItems, '还没有可追踪的人物。', '📇 ')}
            <p class="panel-note">已发现 ${people.length} 位人物，已确认 ${edges.length} 条关系。关系图只显示你已经碰到或确认的部分。</p>
          </div>
        </div>`;
      const routeItems = route.map(title => ({ name: title, desc: '' }));
      const routePage = `<div class="panel-page ${active === 'route' ? 'active' : ''}"><div class="panel-section"><h3>最近足迹</h3>${listHtml(routeItems, '尚未开始调查。', '↗ ')}</div></div>`;
      const endingItems = endings.map(e => ({ name: e.title || '未知结局', desc: e.at ? new Date(e.at).toLocaleString('zh-CN') : '' }));
      const endingPage = `<div class="panel-page ${active === 'endings' ? 'active' : ''}"><div class="panel-section"><h3>结局记录</h3><p class="panel-note">已解锁 ${endings.length} 个。这里只记录你已经走出的结局，不提前透露总数。</p>${listHtml(endingItems, '还没有解锁结局。', '🏁 ')}</div></div>`;

      panel.innerHTML = tabs + overview + cluePage + itemPage + peoplePage + routePage + endingPage;
    };

    E.renderGraph = function () {
      const svg = this.graphEl?.querySelector('svg');
      if (!svg) return;
      const nodesShown = discoveredPeople();
      const edgesShown = discoveredEdges(nodesShown);
      if (!nodesShown.length) {
        svg.innerHTML = '<text x="200" y="140" text-anchor="middle" fill="#999" font-size="14">暂无人物关系</text><text x="200" y="164" text-anchor="middle" fill="#777" font-size="11">继续调查后，这里只会显示已确认的人和关系</text>';
        return;
      }

      const positions = {};
      const cx = 200;
      const cy = 145;
      const r = nodesShown.length <= 2 ? 72 : nodesShown.length <= 5 ? 95 : 112;
      nodesShown.forEach((node, i) => {
        const angle = (Math.PI * 2 * i / Math.max(nodesShown.length, 1)) - Math.PI / 2;
        positions[node.id] = {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      });

      let html = '';
      edgesShown.forEach(edge => {
        const a = positions[edge.from];
        const b = positions[edge.to];
        if (!a || !b) return;
        html += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#6a5a40" stroke-width="1.3" opacity=".72"/>`;
      });
      nodesShown.forEach(node => {
        const p = positions[node.id];
        const label = String(node.id || '').slice(0, 4);
        const sub = Array.isArray(node.labels) && node.labels.length ? node.labels[0].slice(0, 6) : '';
        html += `<circle cx="${p.x}" cy="${p.y}" r="22" fill="#171727" stroke="#b8945f" stroke-width="1.4"/>`;
        html += `<text x="${p.x}" y="${p.y + 3}" text-anchor="middle" fill="#d8bd8e" font-size="10">${esc(label)}</text>`;
        if (sub) html += `<text x="${p.x}" y="${p.y + 34}" text-anchor="middle" fill="#8f8fa0" font-size="9">${esc(sub)}</text>`;
      });
      html += `<text x="200" y="288" text-anchor="middle" fill="#777" font-size="10">已发现 ${nodesShown.length} 人 · 已确认 ${edgesShown.length} 条关系</text>`;
      svg.innerHTML = html;
    };

    E.__casebookGraphPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyCasebookGraphPolish);
})();