// ===== 叙事化时钟显示 =====
// 目标：状态栏不直接显示“剩余 X 小时”，避免玩家误以为这是精确倒计时游戏。
// 内部压力系统仍使用分钟和热度判定；这里只改玩家看到的文案。

(function installNarrativeClockPolish() {
  function applyNarrativeClockPolish() {
    if (typeof E === 'undefined') return;
    if (E.__narrativeClockPolishPatched) return;

    function heat() {
      return E.state?.pressure?.heat || 0;
    }

    function minutesLeft() {
      const deadline = E.state?.pressure?.deadline;
      const now = E.state?.inGameTime;
      if (!deadline || !now) return 9999;
      if (typeof E.timeToMinutes === 'function') return E.timeToMinutes(deadline) - E.timeToMinutes(now);
      const toMinutes = (t) => (t.day || 1) * 1440 + (t.hour || 0) * 60 + (t.minute || 0);
      return toMinutes(deadline) - toMinutes(now);
    }

    function deadlinePhase() {
      const left = minutesLeft();
      if (left < 0) return 'expired';
      if (left < 180) return 'critical';
      if (left < 600) return 'tight';
      return 'safe';
    }

    function sceneId() {
      return E.state?.currentScene || '';
    }

    function isDockPressureScene(id) {
      return /^ch4_(suzhou|dock)/.test(id);
    }

    E.narrativeClockLabel = function () {
      const id = sceneId();
      if (!id) return '—';
      if (id.startsWith('end_')) return '尘埃暂落';

      const phase = deadlinePhase();
      const h = heat();

      if (phase === 'expired') return '迟到一步';
      if (E.getFlag('missed_deadline') && !isDockPressureScene(id)) return '迟到一步';
      if (phase === 'critical') return '只够救人';

      if (isDockPressureScene(id)) {
        if (phase === 'tight') return h >= 5 ? '风声很紧' : '夜色紧迫';
        return h >= 5 ? '已有惊动' : '夜色正深';
      }

      if (/^ch4_/.test(id)) return h >= 5 ? '风声很紧' : '夜色已深';
      if (/^ch3_/.test(id) || /^deduc_/.test(id)) return h >= 4 ? '已有惊动' : '夜色渐深';
      if (/^ch2_(frenchtown|building|ask_landlord|landlord|203)/.test(id)) return h >= 3 ? '暗线起雾' : '暮色压低';
      if (/^ch2_(home|leave_home|university|univ|leave_univ|police)/.test(id)) return h >= 2 ? '线索发热' : '时间尚宽';
      if (/^ch1_/.test(id)) return '尚未入夜';
      return '时间流动';
    };

    E.pressureLabel = function () {
      return this.narrativeClockLabel();
    };

    E.renderPressureStatus = function () {
      const el = document.getElementById('s-pressure');
      if (el) el.textContent = this.narrativeClockLabel();
    };

    E.__narrativeClockPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyNarrativeClockPolish);
})();