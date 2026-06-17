// ===== 便衣线双救平衡 =====
// 目标：便衣线应当是“低调高收益”路线。
// 实际路径里，拿清场指令后进入货架区必然增加一次 delay 或 exposure；
// 再叠加货运单/铁钎与躲木箱，会把优秀路线推到中风险，导致暗室双救不可达。
// 这里不放宽所有路线，只在“便衣掩护 + 找到工具/货运单 + 选择躲避守卫”时抵消 1 点 delay，表示便衣看后路带来的低调收益。

(function installDockFastSupportDualBalancePolish() {
  function applyDockFastSupportDualBalancePolish() {
    if (typeof E === 'undefined') return;
    if (E.__dockFastSupportDualBalancePolishPatched) return;
    if (typeof E.dockDelayScore !== 'function') return;

    function fastSupportMode() {
      return E.getFlag('sun_fast_support')
        || E.getFlag('sun_fast_support_active')
        || E.getFlag('sun_fast_cover_escape')
        || E.getFlag('dock_fast_support_entry');
    }

    function hasCrateToolOrWaybill() {
      return E.getFlag('found_door_tool')
        || E.hasItem?.('光华货运单')
        || E.hasClue?.('教具箱走私');
    }

    function usedStealthHide() {
      return E.getFlag('dock_hid_in_crate') || E.getFlag('avoided_guard');
    }

    const oldDelayScore = E.dockDelayScore.bind(E);
    E.dockDelayScore = function () {
      let score = oldDelayScore();
      if (this.getFlag('missed_both_due_to_return_tool') || this.getFlag('missed_both_at_dock')) return score;
      if (fastSupportMode() && hasCrateToolOrWaybill() && usedStealthHide()) {
        score -= 1;
      }
      return Math.max(0, Math.min(8, score));
    };

    E.__dockFastSupportDualBalancePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockFastSupportDualBalancePolish);
})();
