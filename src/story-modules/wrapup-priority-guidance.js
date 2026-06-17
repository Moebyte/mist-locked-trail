// ===== 线索整理页阶段引导 =====
// 目标：ch3_wrapup 不再同时抛出推理、当铺、老孙、码头等多个主线入口。
// 同一阶段只突出一个推荐下一步，降低玩家迷路感。

(function installWrapupPriorityGuidance() {
  function applyWrapupPriorityGuidance() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__wrapupPriorityGuidancePatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function firstMatching(choices, predicate, fallback) {
      const found = choices.find(predicate);
      return found || fallback;
    }

    function textOf(choice) {
      return choice?.text || choice?.fogText || '';
    }

    function isReview(choice) {
      const text = textOf(choice);
      return text.includes('回顾现有证据') || text.includes('再想想') || choice.goto === 'ch4_conclusion';
    }

    function isDeduceChen(choice) {
      return textOf(choice).includes('陈明远之死');
    }

    function isDeduceLu(choice) {
      const text = textOf(choice);
      return text.includes('黑衣男人与陆小姐') || text.includes('陆小姐的关系');
    }

    function isDeduceFusheng(choice) {
      return textOf(choice).includes('福生仓与公董局');
    }

    function isPawn(choice) {
      const text = textOf(choice);
      return choice.goto === 'ch4_pawnshop' || text.includes('去当铺') || text.includes('翡翠镯');
    }

    function isSunSupport(choice) {
      const text = textOf(choice);
      return choice.goto === 'ch4_sun_support' || text.includes('找老孙') || text.includes('巡捕房找老孙') || text.includes('老孙商量福生仓');
    }

    function isDock(choice) {
      const text = textOf(choice);
      return choice.goto === 'ch4_suzhou_creek' || text.includes('苏州河废弃码头') || text.includes('查福生仓');
    }

    function hasSunSupport() {
      return E.getFlag('sun_support_available')
        || E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('sun_fast_support')
        || E.getFlag('sun_support_in_action');
    }

    function hasDockEvidence() {
      return hasThing('公董局公文纸') || hasThing('教具箱走私') || hasThing('光华货运单') || hasThing('清场指令') || E.getFlag('rescued_yufang') || E.getFlag('found_su_at_dock');
    }

    function fallbackReview() {
      return { text: '🔙 回顾现有证据（暂不推进主线）', goto: 'ch4_conclusion' };
    }

    function recommendText(stage) {
      return `<br><br><span class="sys"><b>建议下一步：</b>${stage}</span>`;
    }

    function stageHint() {
      if (!E.getFlag('deduced_chen')) {
        return E.canDeduce('deduce_chen')
          ? '先把陈明远之死推清楚。现在证据已经够了，不要急着去码头。'
          : '先补齐陈明远之死的关键证据。';
      }
      if (!hasThing('翡翠镯')) return '去永昌当铺查当票。翡翠镯会把陆小姐的旧名和黑衣男人线接上。';
      if (!E.getFlag('deduced_lu_zhao')) {
        return E.canDeduce('deduce_lu_zhao')
          ? '现在可以推理黑衣男人与陆小姐的关系。'
          : '黑衣男人与陆小姐这条线还差一点证据。';
      }
      if (!hasSunSupport()) return '先去巡捕房找老孙，把福生仓行动变成可控行动。';
      if (!hasDockEvidence()) return '准备已经够了，去苏州河废弃码头查福生仓。';
      if (!E.getFlag('deduced_fusheng')) {
        return E.canDeduce('deduce_fusheng')
          ? '福生仓现场证据已经到手，现在推理公董局与走私链。'
          : '福生仓真相还差现场证据。';
      }
      return '主证据链已经闭合，可以进入终局收束。';
    }

    function pickStageChoices(choices) {
      const review = firstMatching(choices, isReview, fallbackReview());

      if (!E.getFlag('deduced_chen')) {
        const deduce = firstMatching(choices, isDeduceChen, null);
        if (deduce) return [{ ...deduce, text: '🧩 下一步：拼合线索——推理陈明远之死' }, review];
      }

      if (E.getFlag('deduced_chen') && !hasThing('翡翠镯')) {
        const pawn = firstMatching(choices, isPawn, { text: '🏛️ 下一步：去当铺——查当票上的翡翠镯', goto: 'ch4_pawnshop' });
        return [{ ...pawn, text: '🏛️ 下一步：去当铺——查当票上的翡翠镯' }, review];
      }

      if (hasThing('翡翠镯') && !E.getFlag('deduced_lu_zhao')) {
        const deduce = firstMatching(choices, isDeduceLu, null);
        if (deduce) return [{ ...deduce, text: textOf(deduce).startsWith('🔒') ? textOf(deduce) : '🧩 下一步：推理黑衣男人与陆小姐的关系' }, review];
      }

      if (E.getFlag('deduced_lu_zhao') && !hasSunSupport()) {
        const sun = firstMatching(choices, isSunSupport, { text: '🚓 下一步：去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
        return [{ ...sun, text: '🚓 下一步：去巡捕房找老孙商量福生仓' }, review];
      }

      if (hasSunSupport() && !hasDockEvidence()) {
        const dock = firstMatching(choices, isDock, { text: '⛵ 下一步：去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
        return [{ ...dock, text: '⛵ 下一步：去苏州河废弃码头——查福生仓' }, review];
      }

      if (hasDockEvidence() && !E.getFlag('deduced_fusheng')) {
        const deduce = firstMatching(choices, isDeduceFusheng, null);
        if (deduce) return [{ ...deduce, text: textOf(deduce).startsWith('🔒') ? textOf(deduce) : '🧩 下一步：推理福生仓与公董局的真相' }, review];
      }

      return choices;
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__wrapupPriorityGuidancePatched) {
      const oldText = nodes.ch3_wrapup.text;
      const oldChoices = nodes.ch3_wrapup.choices;

      nodes.ch3_wrapup.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}${recommendText(stageHint())}`;
      };

      nodes.ch3_wrapup.choices = function (state) {
        const choices = choicesOf(oldChoices, state);
        if (!Array.isArray(choices)) return choices;
        return pickStageChoices(choices);
      };

      nodes.ch3_wrapup.__wrapupPriorityGuidancePatched = true;
    }

    E.__wrapupPriorityGuidancePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyWrapupPriorityGuidance);
})();
