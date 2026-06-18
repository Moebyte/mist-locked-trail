// ===== 线索整理页福生仓阶段最终修正 =====
// 目标：避免把光华小学阶段的前置线索，或诊断包曾误写入的 solo_outcome_* flag，误判为“福生仓行动已经发生”。
(function installWrapupDockStageFinalFix() {
  function applyWrapupDockStageFinalFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__wrapupDockStageFinalFixPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasRealDockAction() {
      return E.getFlag('dock_entry_committed')
        || E.getFlag('dock_solo_entry')
        || E.getFlag('dock_fast_support_entry')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_full_search')
        || E.getFlag('dock_limited_search')
        || E.getFlag('dock_rescue_only')
        || E.getFlag('dock_entered_by_east_window')
        || E.getFlag('dock_reached_crate_area')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('rescued_su')
        || E.getFlag('su_moved_from_dock')
        || E.getFlag('missed_both_at_dock')
        || E.getFlag('scene_confirmed_clearance_order')
        || E.getFlag('scene_confirmed_waybill_crates')
        || E.getFlag('scene_confirmed_darkroom_marks')
        || hasThing('公董局公文纸')
        || hasThing('清场指令')
        || hasThing('仓库暗室')
        || hasThing('暗室刚被清空')
        || hasThing('暗室已经转空')
        || hasThing('沈玉芳曾在暗室')
        || hasThing('苏晚亭曾在暗室')
        || hasThing('苏晚亭学生证')
        || hasThing('暗室刻痕')
        || hasThing('暗室刻痕拓片');
    }

    function fushengEntryLocked() {
      return hasThing('王巡官遗留纸条') || hasThing('半张烟盒纸') || hasThing('福生仓标识') || hasThing('福生仓位置') || E.getFlag('got_wang_note');
    }

    function cleanWrapupText(text) {
      let out = String(text || '');
      if (!hasRealDockAction()) {
        out = out.replace(/；?福生仓行动已经发生/g, '');
        out = out.replace(/这里已经不是“再补线索”的阶段，而是要决定下一步行动路线。/g, '这里还处在案情推进阶段，要先把眼前的线索顺序理清。');
        if (fushengEntryLocked() && !out.includes('福生仓入口已经锁定')) {
          out = out.replace(/(<span class="sys">)(.*?)(。<\/span>)/, '$1$2；福生仓入口已经锁定$3');
        }
      }
      return out;
    }

    const node = nodes.ch3_wrapup;
    if (node && !node.__wrapupDockStageFinalFixPatched) {
      const oldText = node.text;
      node.text = function (state) {
        const text = typeof oldText === 'function' ? oldText(state) : oldText;
        return cleanWrapupText(text);
      };
      node.__wrapupDockStageFinalFixPatched = true;
    }

    // 清理早期诊断包可能误写入、但没有真实福生仓行动支撑的 solo outcome flag。
    if (!hasRealDockAction() && E.state?.flags) {
      for (const key of Object.keys(E.state.flags)) {
        if (/^solo_outcome_/.test(key)) delete E.state.flags[key];
      }
    }

    E.__wrapupDockStageFinalFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyWrapupDockStageFinalFix);
})();