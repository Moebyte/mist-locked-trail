// ===== 引擎 UI 运行时补回 =====
// 目标：补回被 core engine 覆盖掉的新版 UI 依赖方法，让 ui-responsive 能重新接管线索簿、分页与关系图布局。

(function installEngineUiRuntimeRestore() {
  function applyEngineUiRuntimeRestore() {
    if (typeof E === 'undefined') return;
    if (E.__engineUiRuntimeRestorePatched) return;

    const style = document.createElement('style');
    style.textContent = `
      .clue-wall{position:relative;padding:8px 4px}
      .clue-wall-node{display:inline-block;background:var(--surface2);border:1px solid var(--gold);border-radius:2px;padding:7px 10px;margin:3px 2px;font-size:12px;color:var(--text2);box-shadow:0 4px 12px rgba(0,0,0,.08)}
      .clue-wall-edges{margin-top:8px;border-top:1px solid var(--line);padding-top:8px;font-size:11px;color:var(--muted);line-height:1.7}
    `;
    document.head.appendChild(style);

    if (typeof E.caseStrength !== 'function') {
      E.caseStrength = function () {
        const n = this.state?.clues?.length || 0;
        if (n >= 13) return { name: '证据成链', desc: '关键人物、地点与动机已经能互相印证。' };
        if (n >= 9) return { name: '脉络清晰', desc: '主线已经成形，但仍有几处断口。' };
        if (n >= 5) return { name: '线索散落', desc: '你看到了方向，还没有看见全局。' };
        return { name: '雾气很重', desc: '现在下判断太早，最好继续走访。' };
      };
    }

    if (typeof E.renderClueWall !== 'function') {
      E.renderClueWall = function () {
        const clues = this.state?.clues || [];
        if (clues.length < 3) return '';
        const wallNodes = [
          { id: '苏晚亭失踪', label: '苏晚亭失踪', color: '#c8a87c', check: () => true },
          { id: '陈明远坠楼', label: '陈明远坠楼', color: '#d08070', check: () => E.hasClue('陈明远坠楼案') },
          { id: '沈玉芳失踪', label: '沈玉芳失踪', color: '#d08070', check: () => E.hasClue('沈玉芳') || E.hasClue('沈玉芳失踪') || E.hasClue('沈玉芳与陈明远') },
          { id: '陆小姐身份', label: '陆小姐身份', color: '#8a7ab8', check: () => E.hasClue('恐吓信') || E.hasClue('陆念薇旧名') || E.hasClue('杭州旧案剪报') },
          { id: '黑衣男人暗线', label: '黑衣男人暗线', color: '#b8a070', check: () => E.hasClue('跟踪黑衣男人') || E.hasClue('神秘女子') || E.hasClue('黑衣男人') },
          { id: '福生仓真相', label: '福生仓真相', color: '#6f86c8', check: () => E.hasClue('王巡官遗留纸条') || E.hasClue('福生仓标识') || E.hasClue('福生仓地址') },
        ];
        const edges = [
          ['苏晚亭失踪', '陈明远坠楼'],
          ['苏晚亭失踪', '沈玉芳失踪'],
          ['陈明远坠楼', '陆小姐身份'],
          ['陆小姐身份', '黑衣男人暗线'],
          ['黑衣男人暗线', '福生仓真相'],
          ['沈玉芳失踪', '福生仓真相'],
        ];
        const visibleNodes = wallNodes.filter(n => n.check());
        const visibleIds = new Set(visibleNodes.map(n => n.id));
        const visibleEdges = edges.filter(e => visibleIds.has(e[0]) && visibleIds.has(e[1]));
        if (visibleNodes.length < 2) return '';
        let html = '<div class="clue-wall">';
        html += visibleNodes.map(n => `<div class="clue-wall-node" style="border-color:${n.color}">${n.label}</div>`).join('');
        if (visibleEdges.length > 0) {
          html += '<div class="clue-wall-edges">';
          html += visibleEdges.map(e => `↗ ${e[0]} ↔ ${e[1]}`).join('<br>');
          html += '</div>';
        }
        html += '</div>';
        return html;
      };
    }

    E.openPanel = function () {
      if (typeof this.renderPanel === 'function') this.renderPanel();
      const panel = document.getElementById('side-panel');
      if (panel) {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
      }
    };

    E.closePanel = function () {
      const panel = document.getElementById('side-panel');
      if (panel) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
      }
    };

    const oldOpenGraph = E.openGraph?.bind(E);
    E.openGraph = function () {
      if (typeof oldOpenGraph === 'function') oldOpenGraph();
      else if (this.graphEl) this.graphEl.style.display = 'flex';
      if (typeof this.renderGraph === 'function') this.renderGraph();
    };

    E.__engineUiRuntimeRestorePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyEngineUiRuntimeRestore);
})();
