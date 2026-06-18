// ===== 福生仓行动后整理页不重复入口兜底 =====
// 目标：玩家已经进过福生仓/暗室后，ch3_wrapup 不应再重复给 solo、老孙或码头入口。
// 正确节奏不是直接收束，而是：逃离码头 → 医院安置/证人处理 → 陆念薇 → 第三段推理 → 终局。

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

    function hasWitness() {
      return E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('rescued_su');
    }

    function hospitalDone() {
      return E.getFlag('v07_choice_protect_witnesses')
        || E.getFlag('hospital_protect_witnesses')
        || E.getFlag('hospital_doctor_record')
        || E.getFlag('v07_choice_hold_blockade')
        || E.getFlag('v07_choice_late_blockade')
        || E.getFlag('v07_choice_pressure_fu')
        || E.getFlag('v07_choice_blockade_after_interference')
        || E.getFlag('v07_choice_draw_lu');
    }

    function hasLuOutcome() {
      return E.getFlag('v07_lu_to_sun')
        || E.getFlag('v07_lu_statement')
        || E.getFlag('v07_lu_as_informant')
        || E.getFlag('v07_lu_withdrawn')
        || E.getFlag('v07_lu_formal_blocked');
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
        const goto = choice && (typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto);
        return goto === 'ch4_dock_escape_finish'
          || goto === 'ch4_hospital_conflict'
          || goto === 'ch4_lu_confrontation'
          || text.includes('逃离')
          || text.includes('撤离')
          || text.includes('医院')
          || text.includes('陆念薇')
          || text.includes('福生仓与公董局')
          || text.includes('第三段推理')
          || text.includes('最终结案材料');
      });
    }

    function nextPostDockChoice() {
      if (hasWitness() && !hospitalDone()) {
        return { text: '🏥 先去医院安置证人，再处理福生仓后续', goto: 'ch4_hospital_conflict' };
      }
      if (hasWitness() && hospitalDone() && !hasLuOutcome()) {
        return { text: '🕯️ 先处理陆念薇，再做第三段推理', goto: 'ch4_lu_confrontation' };
      }
      return { text: '📁 回顾现有证据，整理福生仓行动结果', goto: 'ch4_conclusion' };
    }

    const node = nodes.ch3_wrapup;
    if (!node) return;
    const oldChoices = node.choices;
    node.choices = function (state) {
      const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      if (!Array.isArray(base) || !dockActionHappened()) return base;

      const out = base.filter(choice => !isRepeatFushengEntry(choice));
      if (!hasProgressEntry(out)) out.unshift(nextPostDockChoice());
      return out;
    };

    E.__wrapupNoRepeatFushengEntryFixed = true;
  }

  document.addEventListener('DOMContentLoaded', applyWrapupNoRepeatFushengEntryFix);
})();