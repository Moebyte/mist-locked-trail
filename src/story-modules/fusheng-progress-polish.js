// ===== 福生仓追查衔接收束 =====
// 目标：玩家已经拿到王巡官纸条 / 福生仓标识等有效前置，但尚未进入福生仓核心时，
// 不应因为当铺或回访周怀安而被误送进“证据不足”坏收束。

(function installFushengProgressPolish() {
  function applyFushengProgressPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fushengProgressPolishPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function hasLandlordFushengLead() {
      return E.getFlag('shown_map_to_landlord')
        || E.hasClue('福生仓标识')
        || E.hasClue('福生仓位置')
        || E.hasItem('福生仓地址');
    }

    function hasWangNote() {
      return E.getFlag('got_wang_note') || E.hasClue('王巡官遗留纸条') || E.hasItem('半张烟盒纸');
    }

    function isBadRouteLocked() {
      return !hasUniversityXuehuaLead() || !hasLandlordFushengLead() || !hasWangNote();
    }

    function hasReachedFushengCore() {
      return E.getFlag('deduced_fusheng')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('dock_full_search')
        || E.getFlag('dock_limited_search')
        || E.getFlag('dock_rescue_only')
        || E.hasClue('推理结论：法租界利益链')
        || E.hasClue('公董局公文纸')
        || E.hasItem('光华货运单')
        || E.hasItem('清场指令');
    }

    function hasActionableFushengLead() {
      return hasWangNote()
        || hasLandlordFushengLead()
        || E.hasClue('傅启元夜运教具箱')
        || E.hasClue('管制药品走私')
        || E.hasClue('陈明远的信')
        || E.hasItem('陈明远的信');
    }

    function shouldContinueFusheng() {
      return !isBadRouteLocked()
        && !hasReachedFushengCore()
        && hasActionableFushengLead()
        && !E.getFlag('missed_deadline');
    }

    function fushengContinueChoices() {
      const out = [];
      if (typeof E.deadlinePhase === 'function' && E.deadlinePhase() === 'critical') {
        out.push({ text: '⛵ 时间不多了，立刻去苏州河废弃码头', goto: 'ch4_suzhou_creek' });
      } else {
        out.push({ text: '⛵ 证据还差福生仓——继续追查', goto: 'ch3_wrapup' });
      }
      out.push({ text: '📁 暂时归档此案（证据仍不足）', goto: 'end_archive' });
      out.push({ text: '⚠️ 证据不足，仍要冒然指认嫌疑人', goto: 'ch4_accuse' });
      return out;
    }

    if (nodes.ch4_pawnshop && !nodes.ch4_pawnshop.__fushengProgressChoicesPatched) {
      const oldChoices = nodes.ch4_pawnshop.choices;
      nodes.ch4_pawnshop.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base) || !shouldContinueFusheng()) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_conclusion') {
            return { ...choice, text: '🔙 带着翡翠镯回去整理下一步', goto: 'ch3_wrapup' };
          }
          return choice;
        });
      };
      nodes.ch4_pawnshop.__fushengProgressChoicesPatched = true;
    }

    if (nodes.ch4_revisit_zhou && !nodes.ch4_revisit_zhou.__fushengProgressReturnPatched) {
      const oldChoices = nodes.ch4_revisit_zhou.choices;
      nodes.ch4_revisit_zhou.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base) || !shouldContinueFusheng()) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_conclusion') {
            return { ...choice, text: '🔙 暂时不打扰他，回去继续追查福生仓', goto: 'ch3_wrapup' };
          }
          return choice;
        });
      };
      nodes.ch4_revisit_zhou.__fushengProgressReturnPatched = true;
    }

    if (nodes.ch4_zhou_present_jade && !nodes.ch4_zhou_present_jade.__fushengProgressReturnPatched) {
      const oldChoices = nodes.ch4_zhou_present_jade.choices;
      nodes.ch4_zhou_present_jade.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base) || !shouldContinueFusheng()) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_conclusion') {
            return { ...choice, text: '⛵ 带着这条旁证继续追查福生仓', goto: 'ch3_wrapup' };
          }
          return choice;
        });
      };
      nodes.ch4_zhou_present_jade.__fushengProgressReturnPatched = true;
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__fushengProgressGuardPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!shouldContinueFusheng()) return base;
        const softened = String(base).replace(
          '现在回头已经来不及了：关键线索没有在正确时间接上。你可以整理手头材料，但这只会得到一个不完整甚至错误的收束。',
          '现在还不是结案的时候：福生仓线索已经浮出水面，继续追查才是正路。'
        );
        return `${softened}<br><br><div class="notice"><b>⛵ 仍可继续追查</b><br>翡翠镯只能证明陆念这条旁线，真正决定案子走向的是福生仓。现在应回到线索整理，继续去码头或找老孙支援。</div>`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        if (shouldContinueFusheng()) return fushengContinueChoices();
        return choicesOf(oldChoices, state);
      };
      nodes.ch4_conclusion.__fushengProgressGuardPatched = true;
    }

    E.__fushengProgressPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengProgressPolish);
})();
