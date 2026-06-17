// ===== 状态栏与章节显示收口 =====
// 目标：状态栏章节不再依赖容易滞后的 state.chapter，而是根据当前场景动态判断。
(function installStatusPolish() {
  function applyStatusPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__statusPolishPatched) return;

    const TOTAL_ENDINGS = 12;

    E.deriveChapterLabel = function (sceneId = this.state?.currentScene) {
      const id = sceneId || '';
      if (id.startsWith('end_')) return '结局 · 余波';
      if (id.startsWith('ch1_')) return '序幕 · 委托';

      if (/^ch2_(home|leave_home|university|univ|leave_univ|police)/.test(id)) return '第一章 · 寻人';
      if (/^ch2_(frenchtown|building|ask_landlord|landlord|203)/.test(id)) return '第二章 · 暗线';

      if (/^ch3_/.test(id) || /^deduc_/.test(id)) return '第三章 · 光华小学';

      if (/^ch4_(suzhou|dock|sun)/.test(id)) return '第四章 · 福生仓';
      if (/^ch4_/.test(id)) return '终章 · 真相';

      const legacy = ['', '序幕 · 委托', '第一章 · 寻人', '第二章 · 暗线', '第三章 · 光华小学', '终章 · 真相'];
      return legacy[this.state?.chapter] || '序幕 · 委托';
    };

    if (typeof E.updateStatus === 'function' && !E.__dynamicChapterStatusPatched) {
      const oldUpdateStatus = E.updateStatus.bind(E);
      E.updateStatus = function () {
        oldUpdateStatus();
        const chapterEl = document.getElementById('s-chapter');
        if (chapterEl) chapterEl.textContent = this.deriveChapterLabel();
      };
      E.__dynamicChapterStatusPatched = true;
    }

    if (typeof E.renderPanel === 'function' && !E.__endingTotalPanelPatched) {
      const oldRenderPanel = E.renderPanel.bind(E);
      E.renderPanel = function () {
        oldRenderPanel();
        const panel = document.getElementById('panel-content');
        if (panel && typeof panel.innerHTML === 'string') {
          panel.innerHTML = panel.innerHTML.replace(/结局记录（(\d+)\/\d+）/g, `结局记录（$1/${TOTAL_ENDINGS}）`);
        }
      };
      E.__endingTotalPanelPatched = true;
    }

    E.__statusPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyStatusPolish);
})();
