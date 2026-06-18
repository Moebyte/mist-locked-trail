// ===== 福生仓入口兜底解锁 =====
// 目标：玩家已完成第一段、第二段推理后，不应被“证据不足早期收束”过滤掉福生仓入口。
// 背景：premature-conclusion-polish 会在坏路线里过滤所有福生仓/苏州河入口；
// 但正常路线只要 deduced_chen + deduced_lu_zhao 已成立，就应该进入行动阶段。

(function installFushengEntryUnblockPolish() {
  function applyFushengEntryUnblockPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fushengEntryUnblockPolishPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasSunSupport() {
      return E.getFlag('sun_support_available')
        || E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('sun_fast_support')
        || E.getFlag('sun_support_in_action');
    }

    function hasDockEvidence() {
      return hasThing('公董局公文纸')
        || hasThing('暗室刚被清空')
        || hasThing('暗室已经转空')
        || hasThing('仓库暗室')
        || hasThing('获救者身份')
        || hasThing('苏晚亭曾在暗室')
        || hasThing('沈玉芳曾在暗室')
        || hasThing('光华货运单')
        || hasThing('清场指令')
        || E.getFlag('dock_entry_committed')
        || E.getFlag('dock_solo_entry')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_fast_support_entry')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('missed_both_at_dock')
        || E.getFlag('missed_both_due_to_return_tool');
    }

    function hasFushengLead() {
      return hasThing('王巡官遗留纸条')
        || hasThing('半张烟盒纸')
        || hasThing('福生仓标识')
        || hasThing('福生仓位置')
        || hasThing('福生仓地址')
        || hasThing('陈明远的信')
        || hasThing('傅启元夜运教具箱')
        || hasThing('管制药品走私')
        || E.getFlag('got_wang_note')
        || E.getFlag('shown_map_to_landlord')
        || E.getFlag('deduced_lu_zhao');
    }

    function shouldOfferFushengEntry() {
      return E.getFlag('deduced_chen')
        && E.getFlag('deduced_lu_zhao')
        && hasFushengLead()
        && !hasDockEvidence();
    }

    function hasGoto(choices, goto) {
      return choices.some(choice => choice?.goto === goto || (typeof choice?.goto === 'function' && choice.goto(E.state) === goto));
    }

    function isPrematureClosureChoice(choice) {
      const text = String(choice?.text || choice?.fogText || '');
      const goto = typeof choice?.goto === 'function' ? choice.goto(E.state) : choice?.goto;
      return goto === 'ch4_conclusion'
        || text.includes('第三段推理')
        || text.includes('福生仓与公董局')
        || text.includes('封卷')
        || text.includes('落笔');
    }

    function addFushengChoices(base) {
      const source = Array.isArray(base) ? base.slice() : [];
      const out = source.filter(choice => !isPrematureClosureChoice(choice));
      const review = source.find(choice => choice?.goto === 'ch4_conclusion' || String(choice?.text || choice?.fogText || '').includes('回顾'))
        || { text: '🔙 先把桌上的材料再看一遍', goto: 'ch4_conclusion' };

      if (!hasGoto(out, 'ch4_suzhou_creek')) {
        out.unshift({ text: '🔦 独自去福生仓探一探', goto: 'ch4_suzhou_creek' });
      }
      if (!hasSunSupport() && !hasGoto(out, 'ch4_sun_support')) {
        out.splice(1, 0, { text: '🚓 找老孙商量福生仓', goto: 'ch4_sun_support' });
      }
      if (!hasGoto(out, 'ch4_conclusion')) out.push(review);
      return out.filter((choice, idx, arr) => {
        const text = choice?.text || choice?.fogText || '';
        const goto = typeof choice?.goto === 'function' ? choice.goto(E.state) : choice?.goto;
        return idx === arr.findIndex(other => {
          const otherGoto = typeof other?.goto === 'function' ? other.goto(E.state) : other?.goto;
          return otherGoto === goto && (other?.text || other?.fogText || '') === text;
        });
      });
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__fushengEntryUnblockPatched) {
      const oldText = nodes.ch3_wrapup.text;
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldOfferFushengEntry()) return base;
        return `${base}<br><br><span class="sys">桌上的碎片终于指向同一片雾：福生仓。现在再坐在事务所里推下去，只会让人被转走。你得去苏州河边看看，也可以先把老孙拉进来。</span>`;
      };
      nodes.ch3_wrapup.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!shouldOfferFushengEntry()) return base;
        return addFushengChoices(base);
      };
      nodes.ch3_wrapup.__fushengEntryUnblockPatched = true;
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__fushengEntryUnblockPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;
      nodes.ch4_conclusion.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldOfferFushengEntry()) return base;
        return `${base}<br><br><div class="notice"><b>⛵ 雾还没有散</b><br>陈明远的死、陆小姐的旧名和王巡官留下的纸，最后都把你推向苏州河边的福生仓。现在不是落笔结案的时候。</div>`;
      };
      nodes.ch4_conclusion.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!shouldOfferFushengEntry()) return base;
        return addFushengChoices(base);
      };
      nodes.ch4_conclusion.__fushengEntryUnblockPatched = true;
    }

    E.__fushengEntryUnblockPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengEntryUnblockPolish);
})();