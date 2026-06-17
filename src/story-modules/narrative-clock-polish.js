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

    function deadlinePhase() {
      if (typeof E.deadlinePhase === 'function') return E.deadlinePhase();
      const left = typeof E.minutesUntilDeadline === 'function' ? E.minutesUntilDeadline() : 9999;
      if (left < 0) return 'expired';
      if (left < 180) return 'critical';
      if (left < 600) return 'tight';
      return 'safe';
    }

    function sceneId() {
      return E.state?.currentScene || '';
    }

    E.narrativeClockLabel = function () {
      const id = sceneId();
      if (!id) return '—';
      if (id.startsWith('end_')) return '尘埃暂落';
      if (E.getFlag('missed_deadline')) return '迟到一步';

      const phase = deadlinePhase();
      const h = heat();

      if (phase === 'expired') return '迟到一步';
      if (phase === 'critical') return '只够救人';

      if (/^ch4_(suzhou|dock)/.test(id)) {
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
