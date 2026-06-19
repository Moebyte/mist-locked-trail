// ===== 引擎增强（从 main.js 迁入）=====

// ===== 引擎增强与扩展节点（从 main.js 迁入）=====
// 原 applyGameplayImprovements 的内容，现作为 story.js 顶层代码在加载时执行。

  E.presentOnce = function (item, itemName, flag) {
    if (item && item.name === itemName && !this.getFlag(flag)) {
      this.setFlag(flag, true);
      return true;
    }
    return false;
  };

  const oldSetTime = E.setTime.bind(E);
  E.setTime = function (day, hour, minute) {
    const next = { day: day ?? 1, hour: hour ?? 14, minute: minute ?? 0 };
    const current = this.timeToMinutes(this.state.inGameTime || { day: 1, hour: 14, minute: 0 });
    const target = this.timeToMinutes(next);
    if (target < current) {
      this.state.atmosphere = this.renderAtmosphere();
      return false;
    }
    oldSetTime(next.day, next.hour, next.minute);
    return true;
  };

  E.deadlinePhase = function () {
    const left = this.minutesUntilDeadline();
    if (left < 0) return 'expired';
    if (left < 180) return 'critical';
    if (left < 600) return 'tight';
    return 'safe';
  };

  E.deadlinePhaseLabel = function () {
    return ({ safe: '时间充裕', tight: '时间吃紧', critical: '只够救人', expired: '迟到一步' })[this.deadlinePhase()];
  };

  E.routeDockByPressure = function () {
    const phase = this.deadlinePhase();
    if (phase === 'expired') {
      this.setFlag('missed_deadline', true);
      return 'ch4_dock_cleared';
    }
    if (phase === 'critical') return 'ch4_dock_rescue_only';
    if (phase === 'tight') return 'ch4_dock_limited_search';
    return 'ch4_dock_full_search';
  };

  E.routeDockDeepByPressure = function () {
    const phase = this.deadlinePhase();
    if (phase === 'expired') {
      this.setFlag('missed_deadline', true);
      return 'ch4_dock_cleared';
    }
    if (phase === 'critical') return 'ch4_dock_deep_rescue_only';
    if (phase === 'tight') return 'ch4_dock_deep_trace';
    return 'ch4_dock_deep_dual';
  };

  E.truthFragmentText = function () {
    const parts = [];
    if (this.hasClue('杭州旧案剪报')) parts.push('烧毁的杭州剪报');
    if (this.hasClue('翡翠镯')) parts.push('刻着“陆念”的翡翠镯');
    if (this.hasClue('看门人证词')) parts.push('看门人说她常在深夜出入');
    if (this.hasClue('陆小姐的笔记')) parts.push('203室笔记边缘的“光华——陈——对不起”');
    return parts.length ? parts.join('、') : '你手里那些还不完整的碎片';
  };

  function chainPresent(nodeId, handler) {
    const node = nodes[nodeId];
    if (!node) return;
    const oldHandler = node.onPresent;
    node.onPresent = function (item, s) {
      const oldResult = typeof oldHandler === 'function' ? oldHandler(item, s) : null;
      return oldResult || handler(item, s);
    };
  }







  if (nodes.ch4_suzhou_creek) {
    delete nodes.ch4_suzhou_creek.time;
    nodes.ch4_suzhou_creek.cost = { h: 0, m: 45, reason: '你赶往苏州河废弃码头' };
    nodes.ch4_suzhou_creek.text = () => {
      const phase = E.deadlinePhase();
      const intro = {
        safe: '你提前赶到苏州河，福生仓仍在装货，门口还有人影往来。',
        tight: '你赶到时暮色已深，福生仓外的货车正在加紧装箱。',
        critical: '你赶到时只剩最后一辆货车，仓库深处仍有细微声响。',
        expired: '你赶到时仓库已经清空，只剩车辙、草绳和纸灰。'
      }[phase];
      return `${intro}<br><br><span class="sys">王巡官写过：福生仓，三日清。现在是：${E.deadlinePhaseLabel()}。</span>`;
    };
    nodes.ch4_suzhou_creek.choices = () => {
      if (E.deadlinePhase() === 'expired') return [
        { text: '🕯️ 检查清空后的仓库', goto: 'ch4_dock_cleared' },
        { text: '🔙 回事务所整理线索', goto: 'ch3_wrapup' }
      ];
      return [
        { text: '🕵️ 先绕到后门观察换班', goto: 'ch4_dock_watch' },
        { text: '⚠️ 趁雾直接潜入仓库', effect: () => E.addHeat(1, '冒险行动让码头风险升高。'), goto: () => E.routeDockByPressure() },
        { text: '🚓 先找老孙支援', goto: 'ch4_dock_wait' },
        { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
      ];
    };
  }
















  const wrap = nodes.ch3_wrapup;
  if (wrap && typeof wrap.choices === 'function') {
    const oldChoices = wrap.choices;
    wrap.choices = function (s) {
      const opts = oldChoices(s) || [];
      const canAskSun = !E.getFlag('sun_support_available') && !E.getFlag('missed_deadline') && (E.hasItem('福生仓地址') || E.hasItem('半张烟盒纸') || E.hasClue('王巡官遗留纸条') || E.hasClue('福生仓位置'));
      if (canAskSun) opts.unshift({ text: '🚓 去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
      return opts;
    };
  }







  chainPresent('ch4_dock_who', (item) => {
    if (E.presentOnce(item, '三人合影', 'presented_photo_to_yufang')) return { goto: 'ch4_yufang_present_photo' };
    if (E.presentOnce(item, '陈明远的信', 'presented_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    if (E.presentOnce(item, '未寄出的信', 'presented_unsent_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    return null;
  });



  if (nodes.ch4_conclusion) {
    const oldConclusionChoices = nodes.ch4_conclusion.choices;
    nodes.ch4_conclusion.text = () => {
      const strength = E.caseStrength();
      const suStatus = E.getFlag('rescued_su')
        ? '苏晚亭已经被你从福生仓救出。她还很虚弱，但终于有了自己的声音。'
        : E.getFlag('su_moved_from_dock')
          ? '你没有救出苏晚亭，但你找到了她曾被关在福生仓的直接证据。她刚被转走不久。'
          : E.getFlag('su_trace_only')
            ? '你只找到了苏晚亭的手表。她是否还活着，仍然压在你心口。'
            : '苏晚亭在哪，她是否还活着，仍是案子的核心问题。';
      return `你回到自己的事务所，把所有材料铺在桌上。<br><br>窗外灯火初上，法租界的霓虹灯在夜雾中晕成一片暧昧的光。<br><br>事情的脉络你已经大致摸清了——陈明远不是自杀，光华小学的教具箱不是教具，陆念薇不是主谋，傅启元也不只是一个名字。<br><br><b>${suStatus}</b><br><br>你翻开线索簿，给当前案情写下四个字：<b>${strength.name}</b>。<br><br>${strength.desc}<br><br>你要怎么结这个案？`;
    };
    nodes.ch4_conclusion.choices = oldConclusionChoices;
  }



