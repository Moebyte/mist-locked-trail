// ===== 福生仓行动后整理页不重复入口兜底 =====
// 目标：玩家已经进过福生仓/暗室后，ch3_wrapup 不应再重复给 solo、老孙或码头入口。
// 若第三段推理暂时不可开，也必须保留“回顾现有证据”整理入口，避免整理页像卡在行动前。

(function installWrapupNoRepeatFushengEntryFix() {
  function applyWrapupNoRepeatFushengEntryFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__wrapupNoRepeatFushengEntryFixed) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function dockActionHappened() {
      return E.getFlag('dock_entry_committed')
        || E.getFlag('dock_solo_entry')
        || E.getFlag('dock_fast_support_entry')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('rescued_su')
        || E.getFlag('su_moved_from_dock')
        || E.getFlag('yufang_moved_from_dock')
        || E.getFlag('missed_both_at_dock')
        || E.getFlag('missed_both_due_to_return_tool')
        || hasThing('仓库暗室')
        || hasThing('暗室刚被清空')
        || hasThing('暗室已经转空')
        || hasThing('获救者身份')
        || hasThing('苏晚亭曾在暗室')
        || hasThing('沈玉芳曾在暗室')
        || hasThing('苏晚亭学生证');
    }

    function isRepeatFushengEntry(choice) {
      const text = String(choice?.text || choice?.fogText || '');
      const goto = choice && (typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto);
      return goto === 'ch4_suzhou_creek'
        || goto === 'ch4_sun_support'
        || text.includes('不找支援，独自去福生仓')
        || text.includes('巡捕房找老孙商量福生仓')
        || text.includes('苏州河废弃码头');
    }

    function hasProgressEntry(choices) {
      return choices.some(choice => {
        const text = String(choice?.text || choice?.fogText || '');
        return text.includes('回顾现有证据')
          || text.includes('福生仓与公董局')
          || text.includes('最终结案材料')
          || text.includes('第三段推理');
      });
    }

    const node = nodes.ch3_wrapup;
    if (!node) return;
    const oldChoices = node.choices;
    node.choices = function (state) {
      const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      if (!Array.isArray(base) || !dockActionHappened()) return base;

      const out = base.filter(choice => !isRepeatFushengEntry(choice));
      if (!hasProgressEntry(out)) {
        out.push({ text: '📁 回顾现有证据，整理福生仓行动结果', goto: 'ch4_conclusion' });
      }
      return out;
    };

    E.__wrapupNoRepeatFushengEntryFixed = true;
  }

  document.addEventListener('DOMContentLoaded', applyWrapupNoRepeatFushengEntryFix);
})();