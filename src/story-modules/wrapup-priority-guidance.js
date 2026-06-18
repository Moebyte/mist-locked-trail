// ===== 线索整理页阶段引导 =====
// 目标：ch3_wrapup 不再同时抛出推理、当铺、老孙、码头等多个主线入口。
// 同一阶段只突出当前阶段的关键选择，降低玩家迷路感。
// 推理入口使用 safe opener，避免“下一步推理”点击无反应。
// 调整：福生仓行动阶段同时提供 solo 和老孙支援入口，避免 solo 线被隐藏。

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
      return text.includes('回顾现有证据') || text.includes('再想想') || text.includes('封卷') || choice.goto === 'ch4_conclusion';
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
      return hasThing('公董局公文纸')
        || hasThing('暗室刚被清空')
        || hasThing('暗室已经转空')
        || hasThing('仓库暗室')
        || hasThing('获救者身份')
        || hasThing('苏晚亭曾在暗室')
        || hasThing('苏晚亭手表')
        || hasThing('苏晚亭学生证')
        || hasThing('沈玉芳曾在暗室')
        || hasThing('教具箱走私')
        || hasThing('管制药品走私')
        || hasThing('光华货运单')
        || hasThing('清场指令')
        || E.getFlag('dock_entry_committed')
        || E.getFlag('dock_solo_entry')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('su_moved_from_dock')
        || E.getFlag('su_trace_only')
        || E.getFlag('missed_both_at_dock');
    }

    function fallbackReview() {
      return { text: '📁 就此落笔，先把案子封卷', goto: 'ch4_conclusion' };
    }

    function reviewChoice(base, text = '📁 就此落笔，先把案子封卷') {
      return { ...(base || fallbackReview()), text, goto: 'ch4_conclusion' };
    }

    function recommendText(stage) {
      return `<br><br><span class="sys"><b>建议下一步：</b>${stage}</span>`;
    }

    function openDeductionEffect(id) {
      return () => {
        if (typeof E.openDeductionSafe === 'function') E.openDeductionSafe(id);
        else E.openDeduction(id);
      };
    }

    function deduceChoice(id, text, base) {
      const locked = textOf(base).startsWith('🔒');
      if (locked) return { ...base, text: textOf(base) };
      return { ...(base || {}), text, effect: openDeductionEffect(id), goto: undefined };
    }

    function dockSoloChoice(base) {
      return {
        ...(base || {}),
        text: '🔦 下一步：不找支援，独自去福生仓',
        goto: 'ch4_suzhou_creek'
      };
    }

    function sunChoice(base) {
      return {
        ...(base || {}),
        text: '🚓 下一步：去巡捕房找老孙商量福生仓',
        goto: 'ch4_sun_support'
      };
    }

    function stageHint() {
      if (!E.getFlag('deduced_chen')) {
        return E.canDeduce('deduce_chen')
          ? '先把陈明远之死推清楚。现在证据已经够了，不要急着去码头。'
          : '先补齐陈明远之死的关键证据。';
      }
      if (!hasThing('翡翠镯')) return '去永昌当铺查当票上的翡翠镯。';
      if (!E.getFlag('deduced_lu_zhao')) {
        return E.canDeduce('deduce_lu_zhao')
          ? '现在可以推理黑衣男人与陆小姐的关系。'
          : '黑衣男人与陆小姐这条线还差一点证据。';
      }
      if (!hasDockEvidence()) {
        return hasSunSupport()
          ? '你已经找过老孙，准备够了。现在去苏州河废弃码头查福生仓。'
          : '前两段推理已经完成。现在不是结案，而是进入福生仓行动：可以独自潜入，也可以先找老孙支援。';
      }
      if (!E.getFlag('deduced_fusheng')) {
        return E.canDeduce('deduce_fusheng')
          ? '福生仓现场证据已经到手，现在推理公董局与走私链。'
          : '你已经进过福生仓，行动入口不会重复出现。现在应整理现场结果，补齐福生仓与公董局的推理或进入结案收束。';
      }
      return '主证据链已经闭合，可以进入终局收束。';
    }

    function actionStageSummary() {
      const parts = [];
      if (E.getFlag('deduced_chen')) parts.push('陈明远之死已经推清');
      if (E.getFlag('deduced_lu_zhao')) parts.push('黑衣男人与陆小姐的关系已经推清');
      if (hasThing('王巡官遗留纸条') || hasThing('福生仓位置') || hasThing('福生仓标识')) parts.push('福生仓入口已经锁定');
      if (hasDockEvidence()) parts.push('福生仓行动已经发生');
      if (hasSunSupport()) parts.push('老孙支援已经接上');
      return parts.length ? parts.join('；') : '主线线索已经串起';
    }

    function compactWrapupText() {
      return `你在办公室里把线索重新排了一遍。<br><br><span class="sys">${actionStageSummary()}。</span><br><br>这里已经不是“再补线索”的阶段，而是要决定下一步行动路线。${recommendText(stageHint())}`;
    }

    function pickStageChoices(choices) {
      const review = firstMatching(choices, isReview, fallbackReview());

      if (!E.getFlag('deduced_chen')) {
        const deduce = firstMatching(choices, isDeduceChen, null);
        if (deduce) return [deduceChoice('deduce_chen', '🧩 下一步：拼合线索——推理陈明远之死', deduce), reviewChoice(review)];
      }

      if (E.getFlag('deduced_chen') && !hasThing('翡翠镯')) {
        const pawn = firstMatching(choices, isPawn, { text: '🏛️ 下一步：去当铺——查当票上的翡翠镯', goto: 'ch4_pawnshop' });
        return [{ ...pawn, text: '🏛️ 下一步：去当铺——查当票上的翡翠镯' }, reviewChoice(review)];
      }

      if (hasThing('翡翠镯') && !E.getFlag('deduced_lu_zhao')) {
        const deduce = firstMatching(choices, isDeduceLu, null);
        if (deduce) return [deduceChoice('deduce_lu_zhao', '🧩 下一步：推理黑衣男人与陆小姐的关系', deduce), reviewChoice(review)];
      }

      if (E.getFlag('deduced_lu_zhao') && !hasSunSupport() && !hasDockEvidence()) {
        const dock = firstMatching(choices, isDock, { text: '⛵ 下一步：去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
        const sun = firstMatching(choices, isSunSupport, { text: '🚓 下一步：去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
        return [dockSoloChoice(dock), sunChoice(sun), reviewChoice(review, '📁 就此落笔，先把案子封卷')];
      }

      if (hasSunSupport() && !hasDockEvidence()) {
        const dock = firstMatching(choices, isDock, { text: '⛵ 下一步：去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
        return [{ ...dock, text: '⛵ 下一步：去苏州河废弃码头——查福生仓' }, reviewChoice(review, '📁 就此落笔，先把案子封卷')];
      }

      if (hasDockEvidence() && !E.getFlag('deduced_fusheng')) {
        const deduce = firstMatching(choices, isDeduceFusheng, null);
        if (deduce) return [deduceChoice('deduce_fusheng', '🧩 下一步：推理福生仓与公董局的真相', deduce), reviewChoice(review, '📁 就此落笔，先把案子封卷')];
        return [reviewChoice(review, '📁 就此落笔，先把案子封卷')];
      }

      return choices;
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__wrapupPriorityGuidancePatched) {
      const oldText = nodes.ch3_wrapup.text;
      const oldChoices = nodes.ch3_wrapup.choices;

      nodes.ch3_wrapup.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const visited = E.getFlag('ch3_wrapup_visited');
        E.setFlag('ch3_wrapup_visited', true);
        if (visited && base.length > 200) return compactWrapupText();
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