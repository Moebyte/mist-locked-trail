// ===== 福生仓木箱潜伏后果 =====
// 目标：“检查教具箱 / 躲进木箱”不再只是气氛选项，而是潜入成败关键。
// 不检查教具箱就没有铁钎，只能砸锁；不躲守卫或砸锁都会触发追击。
// 摆脱追击后仍能救沈玉芳，但会错失苏晚亭。

(function installDockHideConsequencePolish() {
  function applyDockHideConsequencePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockHideConsequencePolishPatched) return;

    if (nodes.ch4_dock_full_search && !nodes.ch4_dock_full_search.__directSearchWarningPatched) {
      nodes.ch4_dock_full_search.choices = [
        { text: '📦 先检查教具箱，找能开暗门的工具', goto: 'ch4_dock_crates' },
        {
          text: '🔦 直接顺着声音找人（没有工具，可能只能砸锁）',
          effect: () => E.setFlag('skipped_crates_for_sound', true),
          goto: 'ch4_dock_locked_door'
        }
      ];
      nodes.ch4_dock_full_search.__directSearchWarningPatched = true;
    }

    if (nodes.ch4_dock_limited_search && !nodes.ch4_dock_limited_search.__directSearchWarningPatched) {
      nodes.ch4_dock_limited_search.choices = [
        { text: '📦 冒险检查教具箱，找工具和货运证据', goto: 'ch4_dock_crates' },
        {
          text: '🔦 立刻顺着声音找人（没有工具，可能只能砸锁）',
          effect: () => E.setFlag('skipped_crates_for_sound', true),
          goto: 'ch4_dock_locked_door'
        }
      ];
      nodes.ch4_dock_limited_search.__directSearchWarningPatched = true;
    }

    if (nodes.ch4_dock_crates && !nodes.ch4_dock_crates.__hideConsequenceChoicesPatched) {
      nodes.ch4_dock_crates.choices = [
        { text: '📦 躲进空木箱，等守卫过去', goto: 'ch4_dock_hide' },
        {
          text: '⚠️ 不躲了，拿上铁钎立刻去开暗门',
          effect: () => {
            E.setFlag('skipped_dock_hide', true);
            E.addHeat(2, '你没有躲避守卫，仓库里的脚步声立刻追了上来。');
          },
          goto: 'ch4_dock_guard_chase'
        }
      ];
      nodes.ch4_dock_crates.__hideConsequenceChoicesPatched = true;
    }

    nodes.ch4_dock_guard_chase = {
      title: '福生仓 · 守卫追击',
      weather: 5,
      cost: { h: 0, m: 18, reason: '你被守卫发现，在仓库里绕行甩开追击' },
      effect: () => {
        E.setFlag('dock_guard_chase_no_hide', true);
        E.setFlag('su_moved_due_to_chase', true);
        E.addClue('仓库守卫追击', '你没有躲进木箱，被守卫发现后绕行甩开追击，耽误了打开暗门的最佳时机。');
      },
      text: () => `你抓起铁钎，刚要往仓库深处走，手电光已经扫到木箱边缘。<br><br><span class="sys">“谁在那里？”</span><br><br>你来不及躲进木箱，只能压低身子绕过货架。脚步声从身后追来，铁门被撞得哐当作响。<br><br>你穿过一排标着“光华小学·教学器材”的木箱，险些被倒下的麻袋绊住。等你终于甩开守卫，仓库深处那阵微弱的敲击声已经停过一次。<br><br>你还来得及开暗门。<br><br>但你心里知道，刚才这十几分钟，足够他们把最不能留下的人转走。`,
      choices: [{ text: '🔦 带着铁钎，继续去找暗门', goto: 'ch4_dock_locked_door' }]
    };

    nodes.ch4_dock_break_lock_chase = {
      title: '福生仓 · 砸锁惊动守卫',
      weather: 5,
      cost: { h: 0, m: 20, reason: '你没有找到工具，只能砸锁并甩开守卫追击' },
      effect: () => {
        E.setFlag('dock_broke_lock_no_tool', true);
        E.setFlag('dock_guard_chase_no_hide', true);
        E.setFlag('su_moved_due_to_chase', true);
        E.addHeat(3, '砸锁声在仓库里炸开，守卫立刻朝暗门方向追来。');
        E.addClue('砸锁惊动守卫', '你没有检查教具箱找铁钎，只能砸锁。守卫追击耽误了时间，苏晚亭被转走。');
      },
      text: () => `你把肩膀撞上旧锁，铁锈和木屑一起落下来。<br><br>第一下，锁没开。<br><br>第二下，仓库另一头已经传来喊声：<span class="sys">“暗门那边有人！”</span><br><br>你咬牙又砸了一下，锁终于断开。可手电光已经从货架缝隙里扫过来，你只能先拖开一排木箱，绕进黑暗里。<br><br>等你甩开追上来的守卫，再回到暗门前，里面的敲击声已经变了。<br><br>不是两个人求救的声音。<br><br>只剩一个人。`,
      choices: [{ text: '🚪 推开暗门', goto: 'ch4_dock_deep_trace' }]
    };

    if (nodes.ch4_dock_locked_door && !nodes.ch4_dock_locked_door.__breakLockConsequencePatched) {
      const oldText = nodes.ch4_dock_locked_door.text;
      nodes.ch4_dock_locked_door.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.hasItem('铁钎')) return base;
        const reason = E.getFlag('skipped_crates_for_sound')
          ? '<br><br><span class="sys">你刚才直接顺着声音过来，没有检查教具箱。现在门就在眼前，但你手里没有能安静撬锁的工具。</span>'
          : '';
        return `${base}${reason}`;
      };
      nodes.ch4_dock_locked_door.choices = function () {
        if (E.hasItem('铁钎')) {
          return [{ text: '🧰 用铁钎撬开暗门', goto: () => E.routeDockDeepByPressure() }];
        }
        return [
          { text: '⚠️ 没有工具，强行砸锁开门', goto: 'ch4_dock_break_lock_chase' },
          { text: '📦 回头检查教具箱找工具', goto: 'ch4_dock_crates' }
        ];
      };
      nodes.ch4_dock_locked_door.__breakLockConsequencePatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__dockHideConsequenceDeepRoutePatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (this.getFlag('dock_guard_chase_no_hide') || this.getFlag('dock_broke_lock_no_tool')) {
          this.setFlag('su_moved_due_to_chase', true);
          return 'ch4_dock_deep_trace';
        }
        return oldRouteDockDeepByPressure();
      };
      E.__dockHideConsequenceDeepRoutePatched = true;
    }

    E.__dockHideConsequencePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockHideConsequencePolish);
})();
