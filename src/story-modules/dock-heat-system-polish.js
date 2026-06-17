// ===== 福生仓潜入 heat / delay 双轴系统 =====
// 目标：码头行动不再只靠“时间/压力”粗略路由，而是用潜入风险决定暗室结果。
// 暴露 heat：冒进、声响、守卫追击会增加。
// 拖延 delay：过度观察、过度搜证、过度谨慎会增加。
// 最终风险 = heat + delay；低：两人都在；中：只剩沈玉芳；高：两人都不在。
// 守卫/声响不是一票否决，过度谨慎也不是免费最优解。
// 老孙带队默认风险很高，但可以通过“外围低调卡车道”把风险压回中档。
// 调整：dock 风险只按潜入事件 flag 计分，不再把 addDockHeat 写入的全局 pressure.heat 二次叠加。
// 修正：低调便衣潜入不应在“critical”时被旧时间门控直接打成“只够救人”，至少保留有限搜证窗口。
// 补充：无支援时不再直接跳入仓库搜索，而是先进入“孤身潜入”节点，让 solo 线路和便衣/老孙线路并列。

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
        || E.getFlag('dock_solo_entry')
        || E.getFlag('dock_entered_by_east_window')
        || E.getFlag('dock_full_search')
        || E.getFlag('dock_limited_search')
        || E.getFlag('dock_rescue_only');
    }

    function baseExposure() {
      if (fullSupportMode()) return 2; // 老孙带队天然动静大。
      if (fastSupportMode()) return 0;
      return 1; // 孤身潜入没有支援掩护，基础暴露略高。
    }

    function baseDelay() {
      if (fullSupportMode()) return 3; // 等人、布点、封外围都会拖慢窗口。
      return 0;
    }

    function trueFastRescuePrepared() {
      return typeof E.trueEndingFastRescuePrepared === 'function' && E.trueEndingFastRescuePrepared();
    }

    function fullSupportTradeoffActive() {
      return typeof E.fullSupportTradeoffActive === 'function' && E.fullSupportTradeoffActive();
    }

    function lowProfileRouteReady() {
      return fastSupportMode() && !E.getFlag('missed_deadline');
    }

    function routeDockSearchByTime() {
      // 福生仓线使用独立 heat/delay 系统，不再依赖 deadline 门控
      const phase = typeof E.deadlinePhase === 'function' ? E.deadlinePhase() : 'safe';
      if (phase === 'expired' && !committedDockEntry()) {
        E.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (trueFastRescuePrepared()) return 'ch4_dock_full_search';
      if (fullSupportTradeoffActive()) {
        E.setFlag('dock_full_support_tradeoff', true);
        return 'ch4_dock_full_search';
      }
      if (phase === 'critical') {
        if (lowProfileRouteReady()) return 'ch4_dock_limited_search';
        return 'ch4_dock_rescue_only';
      }
      if (phase === 'tight') return 'ch4_dock_limited_search';
      return 'ch4_dock_full_search';
    }

    E.routeDockSearchByTime = routeDockSearchByTime;

    E.addDockHeat = function (n, reason, flag) {
      // 全局 heat 用于状态栏压力感；dock 暗室结果只按下面的潜入 flag 权重计算，避免“加 heat + 计 flag”双重扣分。
      this.state.pressure.heat = Math.max(0, (this.state.pressure.heat || 0) + n);
      if (flag) this.setFlag(flag, true);
      if (reason) this.toast(reason);
    };

    E.dockSupportMode = function () {
      if (fullSupportMode()) return 'full';
      if (fastSupportMode()) return 'fast';
      return 'solo';
    };

    E.dockExposureScore = function () {
      let score = baseExposure();

      if (this.getFlag('dock_sun_outer_quiet')) score -= 2;
      if (this.getFlag('dock_sun_close_pressure')) score += 2;
      if (this.getFlag('dock_sun_lit_uniforms')) score += 1;

      if (this.getFlag('dock_shelf_shortcut')) score += 1;
      if (this.getFlag('dock_inner_office_rushed')) score += 1;
      if (this.getFlag('dock_reached_crate_area_fast')) score += 1;
      if (this.getFlag('heard_fu_lu')) score += 1;
      if (this.getFlag('skipped_crates_for_sound')) score += 1;
      if (this.getFlag('skipped_dock_hide')) score += 1;
      if (this.getFlag('dock_guard_chase_no_hide')) score += 1;
      if (this.getFlag('dock_broke_lock_no_tool')) score += 2;

      return Math.max(0, Math.min(8, score));
    };

    E.dockDelayScore = function () {
      if (this.getFlag('missed_both_due_to_return_tool') || this.getFlag('missed_both_at_dock')) return 6;

      let score = baseDelay();
      if (this.getFlag('dock_sun_block_truck_lane')) score -= 1;
      if (this.getFlag('dock_sun_close_pressure')) score += 1;

      if (this.getFlag('dock_observed')) score += 1;
      if (this.getFlag('heard_fu_lu')) score += 1;
      if (this.getFlag('dock_moved_slowly')) score += 1;
      if (this.getFlag('dock_clearance_seen_inside')) score += 1;
      if (this.getFlag('dock_hid_in_crate') || this.getFlag('avoided_guard')) score += 1;
      if (this.getFlag('returned_for_door_tool')) score += 3;
      if (this.getFlag('dock_full_support_tradeoff')) score += 1;

      return Math.max(0, Math.min(8, score));
    };

    E.dockHeatScore = function () {
      return Math.max(0, Math.min(10, this.dockExposureScore() + this.dockDelayScore()));
    };

    E.dockHeatTier = function () {
      const exposure = this.dockExposureScore();
      const delay = this.dockDelayScore();
      const score = exposure + delay;
      if (score >= 6) return { level: 3, key: 'high', label: '高', score, exposure, delay };
      if (score >= 4) return { level: 2, key: 'mid', label: '中', score, exposure, delay };
      if (fullSupportMode() && score >= 3) return { level: 2, key: 'mid', label: '中', score, exposure, delay };
      return { level: 1, key: 'low', label: '低', score, exposure, delay };
    };

    E.routeDockByPressure = function () {
      const phase = typeof this.deadlinePhase === 'function' ? this.deadlinePhase() : 'safe';
      if (phase === 'expired' && !committedDockEntry()) {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (!committedDockEntry()) {
        if (fullSupportMode()) return 'ch4_dock_full_support_infiltration';
        if (fastSupportMode()) return 'ch4_dock_fast_infiltration';
        return 'ch4_dock_solo_infiltration';
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
      const label = t.key === 'high' ? '警觉与拖延都压上来了' : t.key === 'mid' ? '窗口正在收窄' : '尚未惊动，窗口还在';
      return `<br><br><span class="sys">潜入风险：${t.label} · 暴露 ${t.exposure} / 拖延 ${t.delay} · ${label}</span>`;
    }

    nodes.ch4_dock_solo_infiltration = {
      title: '福生仓 · 孤身潜入',
      weather: 3,
      effect: () => {
        E.setFlag('dock_solo_entry', true);
        E.setFlag('dock_entry_committed', true);
      },
      text: () => `你没有去找老孙，也没有等任何人。<br><br>福生仓外的雾很低，货车声从码头尽头一阵一阵压过来。你把帽檐往下拉，绕到东侧窗下。<br><br>一个人行动最快，也最干净；但没有人帮你看后路，没有人压码头出口，更没有人能在傅启元面前替你挡住第一枪。<br><br>这条路不是不能救人，只是所有风险都要你自己背。${heatBadge()}`,
      choices: [{ text: '🔦 独自从东侧窗户翻进去', goto: () => E.routeDockSearchByTime() }]
    };

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
      text: () => `老孙没有只派一个便衣。<br><br>他带了两名信得过的巡捕，分在巷口和码头车道两侧。人手一到，码头外围就不再是普通夜班的样子。<br><br>这条路能压住傅启元，也能留下封锁记录；但它天然会提高暴露和拖延。<br><br>现在关键不是“有没有人”，而是怎么让这批人别把仓库里的人提前吓走。${heatBadge()}`,
      choices: [
        { text: '🚧 让老孙只卡外围车道，不靠近仓门', goto: 'ch4_dock_full_support_outer_lane' },
        { text: '🚓 让老孙贴近仓门，随时破门接应', goto: 'ch4_dock_full_support_close_pressure' }
      ]
    };

    nodes.ch4_dock_full_support_outer_lane = {
      title: '福生仓 · 外围卡车道',
      weather: 3,
      effect: () => {
        E.setFlag('dock_sun_outer_quiet', true);
        E.setFlag('dock_sun_block_truck_lane', true);
        E.addClue('老孙低调卡住车道', '老孙把人压在外围车道，不靠仓门，不亮明巡捕房阵势，尽量把老孙带队的动静压低。');
      },
      text: () => `你压低声音告诉老孙：<span class="sys">“别靠仓门。卡住车道，别让车走，但别让里面知道巡捕已经到了。”</span><br><br>老孙看了你一眼，点点头。<br><br>两个巡捕退到雾里，一个守巷口，一个拦车道。码头外围被压住了，但仓门口还像什么都没发生。<br><br>这不能把风险降到一个便衣那种程度。人手毕竟已经来了。<br><br>但至少，仓库里的人还没有被正面惊动。${heatBadge()}`,
      choices: [{ text: '🚶 从侧窗进入仓库', goto: () => E.routeDockSearchByTime() }]
    };

    nodes.ch4_dock_full_support_close_pressure = {
      title: '福生仓 · 贴近仓门',
      weather: 5,
      effect: () => {
        E.setFlag('dock_sun_close_pressure', true);
        E.addDockHeat(2, '老孙的人靠近仓门，仓库里立刻有人察觉外面的巡捕房气息。');
        E.addClue('老孙贴近仓门', '老孙带人贴近福生仓正门，接应更强，但仓库内部更早察觉风声。');
      },
      text: () => `老孙带人压到仓门附近。<br><br>巡捕的皮鞋踩过码头木板，声音不大，却和脚夫完全不同。仓库里有人低声骂了一句，紧接着，里面的灯灭了一盏。<br><br>这条路安全感很强：只要你一喊，老孙就能带人冲进来。<br><br>但它也几乎等于告诉仓库里的人——外面已经不是普通夜色了。${heatBadge()}`,
      choices: [{ text: '🚶 趁老孙压住仓门，从侧窗进入仓库', goto: () => E.routeDockSearchByTime() }]
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

    if (nodes.ch4_dock_hide && !nodes.ch4_dock_hide.__dockDelayPatched) {
      const oldEffect = nodes.ch4_dock_hide.effect;
      nodes.ch4_dock_hide.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.setFlag('dock_hid_in_crate', true);
      };
      nodes.ch4_dock_hide.__dockDelayPatched = true;
    }

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
