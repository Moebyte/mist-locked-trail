// ===== 福生仓木箱潜伏后果 =====
// 目标：“躲进木箱”不再只是气氛选项，而是潜入成败关键。
// 不躲直接去暗门会触发守卫追击；摆脱追击后仍能救沈玉芳，但会错失苏晚亭。

(function installDockHideConsequencePolish() {
  function applyDockHideConsequencePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockHideConsequencePolishPatched) return;

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

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__dockHideConsequenceDeepRoutePatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (this.getFlag('dock_guard_chase_no_hide')) {
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
