// ===== 线索簿与人物关系图轻量优化 =====
// 目标：线索簿更像侦探笔记；人物关系图只展示已发现/已确认内容。
(function installCasebookGraphPolish() {
  function applyCasebookGraphPolish() {
    if (typeof E === 'undefined' || typeof document === 'undefined') return;
    if (E.__casebookGraphPolishPatched) return;

    function esc(v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function hasFlag(k) { return !!(E.getFlag && E.getFlag(k)); }
    function sceneTitle(id) { return typeof nodes !== 'undefined' && nodes[id] ? nodes[id].title : id; }

    function discoveredPeople() {
      const contacts = new Set((E.state && E.state.contacts) || []);
      const relNodes = (E.relationData && E.relationData.nodes) || [];
      return relNodes.filter(n => n && (n.discovered || contacts.has(n.id)));
    }

    function discoveredEdges(list) {
      const ids = new Set(list.map(n => n.id));
      return ((E.relationData && E.relationData.edges) || []).filter(e => ids.has(e.from) && ids.has(e.to) && e.revealed);
    }

    function caseHint() {
      const s = E.state || {};
      const clues = (s.clues || []).length;
      if (!s.currentScene) return ['尚未开卷', '案子还没有开始。'];
      if (hasFlag('deduced_fusheng')) return ['核心真相浮出水面', '福生仓、公董局与光华小学已经连成一条线。'];
      if (hasFlag('dock_entry_committed') || hasFlag('dock_solo_entry') || hasFlag('dock_fast_support_entry') || hasFlag('dock_full_support_entry')) return ['已进入福生仓线', '现在是行动现场。动静、拖延和证人安全都会改变后果。'];
      if (hasFlag('deduced_lu_zhao')) return ['福生仓线索正在收束', '陆念薇、黑衣男人和王巡官留下的线索，正在把你推向苏州河边。'];
      if (hasFlag('deduced_chen')) return ['旧案有了方向', '陈明远之死不再像普通坠楼。下一步要确认陆小姐与光华小学之间的裂缝。'];
      if (clues > 0) return ['雾里已有碎片', '你已经摸到几块拼图，但现在下判断还太早。'];
      return ['雾气很重', '现在下判断太早，最好继续走访。'];
    }

    function nextHint() {
      const s = E.state || {};
      if (!s.currentScene) return '开始调查后，线索簿会记录你真正掌握的信息。';
      if (hasFlag('deduced_fusheng')) return '整理证人、程序和硬证据，决定这份真相能走到哪一步。';
      if (hasFlag('dock_entry_committed') || hasFlag('dock_solo_entry') || hasFlag('dock_fast_support_entry') || hasFlag('dock_full_support_entry')) return '现场阶段优先考虑救人窗口，不要把每一次拖延都当成免费搜证。';
      if (hasFlag('deduced_lu_zhao')) return '可以开始考虑福生仓，但先确认手里有没有足够的钥匙线索。';
      if (hasFlag('deduced_chen')) return '继续查陆小姐、黑衣男人和光华小学之间的关系。';
      if (((s.clues || []).length) > 0) return '先把人物关系串起来，再决定下一处走访地点。';
      return '先听完委托人的说法，再决定从哪里查起。';
    }

    function pressureTitle() {
      if (hasFlag('dock_entry_committed') || hasFlag('dock_solo_entry') || hasFlag('dock_fast_support_entry') || hasFlag('dock_full_support_entry')) return '福生仓行动风险';
      if (hasFlag('deduced_lu_zhao') || hasFlag('deduced_chen')) return '案情压力';
      return '调查压力';
    }

    function tab(active, id, label, count) {
      const badge = count > 0 ? '<span>' + count + '</span>' : '';
      return '<button class="panel-tab ' + (active === id ? 'active' : '') + '" onclick="E.setPanelTab(\'' + id + '\')">' + label + badge + '</button>';
    }

    function card(name, desc, icon) {
      return '<div class="clue-card"><b>' + (icon || '') + esc(name) + '</b>' + (desc ? '<br><span>' + esc(desc) + '</span>' : '') + '</div>';
    }

    function list(items, empty, icon, limit) {
      items = (items || []).filter(Boolean);
      if (!items.length) return '<div class="empty">' + empty + '</div>';
      const shown = limit ? items.slice(0, limit) : items;
      let html = '<div class="panel-list compact-list">';
      shown.forEach(x => html += card(typeof x === 'string' ? x : x.name, typeof x === 'string' ? '' : x.desc, icon));
      html += '</div>';
      if (limit && items.length > limit) html += '<div class="panel-note">另有 ' + (items.length - limit) + ' 条，切换分页查看。</div>';
      return html;
    }

    E.renderPanel = function () {
      const panel = document.getElementById('panel-content');
      if (!panel || !this.state) return;
      const active = this.panelTab || 'overview';
      const clues = (this.state.clues || []).slice().reverse();
      const items = (this.state.items || []).slice().reverse();
      const endings = (this.state.endings || []).slice().reverse();
      const route = ((this.state.sceneLog || []).slice(-18).map(sceneTitle).filter(Boolean).reverse());
      const people = discoveredPeople();
      const edges = discoveredEdges(people);
      const hint = caseHint();
      const pressure = typeof this.pressureLabel === 'function' ? this.pressureLabel() : '尚未形成压力';
      const wall = typeof this.renderClueWall === 'function' ? this.renderClueWall() : '';

      const tabs = '<div class="panel-tabs" role="tablist">'
        + tab(active, 'overview', '总览')
        + tab(active, 'clues', '线索', clues.length)
        + tab(active, 'items', '物品', items.length)
        + tab(active, 'people', '人物', people.length)
        + tab(active, 'route', '足迹', route.length)
        + tab(active, 'endings', '结局', endings.length)
        + '</div>';

      const overview = '<div class="panel-page ' + (active === 'overview' ? 'active' : '') + '">'
        + '<div class="panel-section"><h3>案情状态</h3>' + card(hint[0], hint[1], '') + '</div>'
        + '<div class="panel-section"><h3>下一步</h3>' + card(nextHint(), '', '') + '</div>'
        + '<div class="panel-summary-grid">'
        + '<div class="summary-card"><small>' + pressureTitle() + '</small><b>' + esc(pressure) + '</b><span>随行动阶段变化</span></div>'
        + '<div class="summary-card"><small>已掌握</small><b>' + (clues.length + items.length) + '</b><span>线索与物品</span></div>'
        + '<div class="summary-card"><small>人物</small><b>' + people.length + '</b><span>已浮出水面</span></div>'
        + '<div class="summary-card"><small>足迹</small><b>' + route.length + '</b><span>最近调查节点</span></div>'
        + '</div>'
        + (wall ? '<div class="panel-section"><h3>🧩 推理墙</h3>' + wall + '</div>' : '')
        + ((clues.length || items.length) ? '<div class="panel-section"><h3>最近记录</h3>' + list(clues.slice(0,3).concat(items.slice(0,2)), '还没有关键记录。', '✦ ', 5) + '</div>' : '')
        + '</div>';

      const peopleItems = people.map(n => ({ name: n.id, desc: (n.labels || []).join(' · ') }));
      const endingItems = endings.map(e => ({ name: e.title || '未知结局', desc: e.at ? new Date(e.at).toLocaleString('zh-CN') : '' }));
      const routeItems = route.map(x => ({ name: x, desc: '' }));

      const cluePage = '<div class="panel-page ' + (active === 'clues' ? 'active' : '') + '"><div class="panel-section"><h3>关键线索</h3>' + list(clues, '还没有记录到关键线索。', '🔍 ') + '</div></div>';
      const itemPage = '<div class="panel-page ' + (active === 'items' ? 'active' : '') + '"><div class="panel-section"><h3>随身物品</h3>' + list(items, '口袋里还没有关键物件。', '🎒 ') + '</div></div>';
      const peoplePage = '<div class="panel-page ' + (active === 'people' ? 'active' : '') + '"><div class="panel-section"><h3>人物关系 <button class="tool-btn mini" onclick="E.openGraph()">关系图</button></h3>' + list(peopleItems, '还没有可追踪的人物。', '📇 ') + '<p class="panel-note">已发现 ' + people.length + ' 位人物，已确认 ' + edges.length + ' 条关系。关系图只显示你已经碰到或确认的部分。</p></div></div>';
      const routePage = '<div class="panel-page ' + (active === 'route' ? 'active' : '') + '"><div class="panel-section"><h3>最近足迹</h3>' + list(routeItems, '尚未开始调查。', '↗ ') + '</div></div>';
      const endingPage = '<div class="panel-page ' + (active === 'endings' ? 'active' : '') + '"><div class="panel-section"><h3>结局记录</h3><p class="panel-note">已解锁 ' + endings.length + ' 个。这里只记录你已经走出的结局，不提前透露总数。</p>' + list(endingItems, '还没有解锁结局。', '🏁 ') + '</div></div>';

      panel.innerHTML = tabs + overview + cluePage + itemPage + peoplePage + routePage + endingPage;
    };

    E.renderGraph = function () {
      const svg = this.graphEl && this.graphEl.querySelector('svg');
      if (!svg) return;
      const people = discoveredPeople();
      const edges = discoveredEdges(people);
      const isDay = document.body.classList.contains('theme-day');
      const C = isDay
        ? { nodeFill:'#fffcf0', nodeStroke:'#9a7b4f', edge:'#a89060', label:'#3a2e1a', sub:'#6a5a40', empty:'#999', emptySub:'#aaa', footer:'#888' }
        : { nodeFill:'#171727', nodeStroke:'#b8945f', edge:'#6a5a40', label:'#d8bd8e', sub:'#8f8fa0', empty:'#999', emptySub:'#777', footer:'#777' };
      if (!people.length) {
        svg.innerHTML = '<text x="200" y="140" text-anchor="middle" fill="' + C.empty + '" font-size="14">暂无人物关系</text><text x="200" y="164" text-anchor="middle" fill="' + C.emptySub + '" font-size="11">继续调查后，只显示已确认的人和关系</text>';
        return;
      }
      const pos = {}, cx = 200, cy = 145, r = people.length <= 2 ? 72 : people.length <= 5 ? 95 : 112;
      people.forEach((n, i) => { const a = Math.PI * 2 * i / Math.max(people.length, 1) - Math.PI / 2; pos[n.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }; });
      let html = '';
      edges.forEach(e => { const a = pos[e.from], b = pos[e.to]; if (a && b) html += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + C.edge + '" stroke-width="1.3" opacity=".72"/>'; });
      people.forEach(n => { const p = pos[n.id], label = String(n.id || '').slice(0, 4), sub = (n.labels && n.labels[0]) ? String(n.labels[0]).slice(0, 6) : ''; html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="22" fill="' + C.nodeFill + '" stroke="' + C.nodeStroke + '" stroke-width="1.4"/><text x="' + p.x + '" y="' + (p.y + 3) + '" text-anchor="middle" fill="' + C.label + '" font-size="10">' + esc(label) + '</text>'; if (sub) html += '<text x="' + p.x + '" y="' + (p.y + 34) + '" text-anchor="middle" fill="' + C.sub + '" font-size="9">' + esc(sub) + '</text>'; });
      html += '<text x="200" y="288" text-anchor="middle" fill="' + C.footer + '" font-size="10">已发现 ' + people.length + ' 人 · 已确认 ' + edges.length + ' 条关系</text>';
      svg.innerHTML = html;
    };

    E.__casebookGraphPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyCasebookGraphPolish);
})();