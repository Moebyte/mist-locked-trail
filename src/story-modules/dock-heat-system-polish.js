// ===== 福生仓潜入 heat 系统重构 =====
// 目标：码头行动不再只靠“时间/压力”粗略路由，而是用潜入 heat 三档决定暗室结果。
// heat 低：两人都在；heat 中：只剩沈玉芳；heat 高：两人都不在。
// 守卫/声响不是一票否决，只是累计 heat；最终由总 heat 分档决定暗室结果。
// 同时区分“一个便衣低调潜入”和“老孙带队压阵”的仓库进入流程。

(function installDockHeatSystemPolish() {
  function applyDockHeatSystemPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockHeatSystemPolishPatched) return;

    function fullSupportMode() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function fastSupportMode() {
      return E.getFlag('sun_fast_support')
        || E.getFlag('sun_fast_support_active')
        || E.getFlag('sun_fast_cover_escape')
        || E.getFlag('dock_fast_support_entry');
    }

    function committedDockEntry() {
      return E.getFlag('dock_entry_committed')
        || E.getFlag('dock_entered_by_east_window')
        || E.getFlag('dock_full_search')
        || E.getFlag('dock_limited_search')
        || E.getFlag('dock_rescue_only');
    }

    function baseHeat() {
      if (fullSupportMode()) return 2; // 老孙带队，人手强，但动静大，默认中热度。
      if (fastSupportMode()) return 0; // 一个便衣，低调快进，默认低热度。
      return 1; // 独自/临时潜入，缺少掩护，默认有风险。
    }

    function routeDockSearchByTime() {
      const phase = typeof E.deadlinePhase === 'function' ? E.deadlinePhase() : 'safe';
      if (phase === 'expired') {
        E.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (phase === 'critical') return 'ch4_dock_rescue_only';
      if (phase === 'tight') return 'ch4_dock_limited_search';
      return 'ch4_dock_full_search';
    }

    E.routeDockSearchByTime = routeDockSearchByTime;

    E.addDockHeat = function (n, reason, flag) {
      this.state.pressure.heat = Math.max(0, (this.state.pressure.heat || 0) + n);
      if (flag) this.setFlag(flag, true);
      if (reason) this.toast(reason);
    };

    E.dockSupportMode = function () {
      if (fullSupportMode()) return 'full';
      if (fastSupportMode()) return 'fast';
      return 'solo';
    };

    E.dockHeatScore = function () {
      if (this.getFlag('missed_both_due_to_return_tool') || this.getFlag('missed_both_at_dock')) return 4;

      let score = baseHeat();
      const globalHeat = this.state?.pressure?.heat || 0;
      score += Math.min(4, globalHeat);

      if (this.getFlag('dock_observed')) score -= 1;
      if (this.getFlag('dock_moved_slowly')) score -= 1;
      if (this.getFlag('dock_clearance_seen_inside')) score -= 1;
      if (this.getFlag('dock_reached_crate_area_fast')) score += 1;
      if (this.getFlag('dock_inner_office_rushed')) score += 1;
      if (this.getFlag('dock_shelf_shortcut')) score += 1;
      if (this.getFlag('heard_fu_lu')) score += 1;
      if (this.getFlag('skipped_crates_for_sound')) score += 1;
      if (this.getFlag('returned_for_door_tool')) score += 2;
      if (this.getFlag('skipped_dock_hide')) score += 1;
      if (this.getFlag('dock_guard_chase_no_hide')) score += 1;
      if (this.getFlag('dock_broke_lock_no_tool')) score += 1;
      if (this.getFlag('dock_full_support_tradeoff')) score += 1;

      return Math.max(0, Math.min(7, score));
    };

    E.dockHeatTier = function () {
      const score = this.dockHeatScore();
      if (score >= 5) return { level: 3, key: 'high', label: '高', score };
      if (score >= 3) return { level: 2, key: 'mid', label: '中', score };
      return { level: 1, key: 'low', label: '低', score };
    };

    E.routeDockByPressure = function () {
      const phase = typeof this.deadlinePhase === 'function' ? this.deadlinePhase() : 'safe';
      if (phase === 'expired') {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (!committedDockEntry()) {
        if (fullSupportMode()) return 'ch4_dock_full_support_infiltration';
        if (fastSupportMode()) return 'ch4_dock_fast_infiltration';
      }
      return routeDockSearchByTime();
    };

    E.routeDockDeepByPressure = function () {
      if (this.getFlag('missed_both_due_to_return_tool')) return 'ch4_dock_empty_after_return';
      const tier = this.dockHeatTier();
      if (tier.key === 'high') return 'ch4_dock_deep_empty_heat';
      if (tier.key === 'mid') return 'ch4_dock_deep_trace';
      return 'ch4_dock_deep_dual';
    };

    function heatBadge() {
      const t = E.dockHeatTier();
      const label = t.key === 'high' ? '警觉已高' : t.key === 'mid' ? '已有风声' : '尚未惊动';
      return `<br><br><span class="sys">潜入热度：${t.label} · ${label}</span>`;
    }

    nodes.ch4_dock_fast_infiltration = {
      title: '福生仓 · 低调潜入',
      weather: 2,
      effect: () => {
        E.setFlag('dock_fast_support_entry', true);
        E.setFlag('dock_entry_committed', true);
        E.setFlag('sun_fast_support_active', true);
      },
      text: () => `老孙派来的便衣没有靠近正门。他把帽檐压得很低，混在码头脚夫里，在东侧窗下给你留出一小段空隙。<br><br><span class="sys">“我只能帮你看住后路。里面要是出事，我压不住傅启元。”</span><br><br>这条路快，也轻。代价是，出了仓库之后，你没有足够人手在码头口正面扣人。${heatBadge()}`,
      choices: [{ text: '🔦 借便衣掩护，从东侧窗户翻进去', goto: () => E.routeDockSearchByTime() }]
    };

    nodes.ch4_dock_full_support_infiltration = {
      title: '福生仓 · 老孙压阵',
      weather: 4,
      cost: { h: 0, m: 12, reason: '老孙带人压住码头外围' },
      effect: () => {
        E.setFlag('dock_full_support_entry', true);
        E.setFlag('dock_entry_committed', true);
        E.setFlag('dock_blockade_record', true);
        E.setFlag('dock_full_support_tradeoff', true);
        E.addClue('老孙压住码头外围', '老孙带人压住福生仓外围，能保住码头封锁线，但行动动静也更大。');
      },
      text: () => `老孙没有只派一个便衣。<br><br>他带了两名信得过的巡捕，分在巷口和码头车道两侧。正门没有被冲开，但傅启元的人已经看见巡捕房的影子。<br><br><span class="sys">“我能压住外面。”</span>老孙低声说，<span class="sys">“但里面你要快。人手一多，对方也知道时间不在他们那边了。”</span><br><br>这条路稳，也硬。代价是，仓库里的人会更早察觉风声。${heatBadge()}`,
      choices: [{ text: '🚶 趁老孙压住外线，从侧窗进入仓库', goto: () => E.routeDockSearchByTime() }]
    };

    nodes.ch4_dock_wait = nodes.ch4_dock_full_support_infiltration;

    nodes.ch4_dock_deep_empty_heat = {
      title: '福生仓 · 空暗室',
      weather: 5,
      effect: () => {
        E.setFlag('missed_yufang_at_dock', true);
        E.setFlag('su_moved_from_dock', true);
        E.setFlag('yufang_moved_from_dock', true);
        E.setFlag('missed_both_at_dock', true);
        E.addClue('暗室已经转空', '你打开暗门时，沈玉芳和苏晚亭都已被带走，只剩刚转移过的痕迹。');
        E.addClue('沈玉芳曾在暗室', '暗室墙边有沈玉芳留下的半截粉笔和一道反复刻出的“沈”字。');
        E.addClue('苏晚亭曾在暗室', '暗室床缝里有苏晚亭的学生证和半张写给母亲的字条，她也曾被关在这里。');
        E.addItem('苏晚亭学生证', '暗室床缝里找到的学生证，边角被水泡软。');
        E.addItem('沈玉芳半截粉笔', '暗室墙边捡到的半截粉笔，旁边刻着一个反复划出的“沈”字。');
      },
      text: () => `暗门开得比你想象中更轻。<br><br>门后没有人声。<br><br>一张行军床，一个水桶，一盏快熄灭的煤油灯。床单皱着，水桶边还倒着半只搪瓷杯，像是刚有人被拖起来。<br><br>墙角有半截粉笔，旁边划着一个反复写坏的“沈”字。床缝里压着一张学生证，边角被水泡软，名字却还清楚：<b>苏晚亭</b>。<br><br>外面的雾里传来汽车发动声。等你冲出仓库，只看见两道尾灯在码头尽头一闪而没。<br><br>你找到了她们曾经在这里的证据。<br><br>但没有把任何一个人从这里带出去。`,
      choices: [{ text: '📄 带着残留证据撤出福生仓', goto: 'ch3_wrapup' }]
    };

    if (nodes.ch4_dock_sun_fast_support && !nodes.ch4_dock_sun_fast_support.__dockHeatFastSupportPatched) {
      nodes.ch4_dock_sun_fast_support.choices = [
        { text: '🚓 让便衣护住后路，低调潜入福生仓', goto: 'ch4_dock_fast_infiltration' }
      ];
      nodes.ch4_dock_sun_fast_support.__dockHeatFastSupportPatched = true;
    }

    E.__dockHeatSystemPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockHeatSystemPolish);
})();
