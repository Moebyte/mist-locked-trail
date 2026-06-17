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
        || hasThing('教具箱走私')
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

    function addFushengChoices(base) {
      const out = Array.isArray(base) ? base.slice() : [];
      const review = out.find(choice => choice?.goto === 'ch4_conclusion' || String(choice?.text || choice?.fogText || '').includes('回顾'))
        || { text: '🔙 回顾现有证据（暂不行动）', goto: 'ch4_conclusion' };

      if (!hasGoto(out, 'ch4_suzhou_creek')) {
        out.unshift({ text: '🔦 下一步：不找支援，独自去福生仓', goto: 'ch4_suzhou_creek' });
      }
      if (!hasSunSupport() && !hasGoto(out, 'ch4_sun_support')) {
        out.splice(1, 0, { text: '🚓 下一步：去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
      }
      if (!out.includes(review) && !hasGoto(out, 'ch4_conclusion')) out.push(review);
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
        return `${base}<br><br><span class="sys"><b>行动入口已解锁：</b>前两段推理已经完成。现在应进入福生仓行动，可以独自潜入，也可以先找老孙支援。</span>`;
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
        return `${base}<br><br><div class="notice"><b>⛵ 还不能结案</b><br>陈明远之死和陆念薇暗线已经推清，福生仓行动入口应当打开。现在不是归档，而是去苏州河码头。</div>`;
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
