// ===== 调查顺序提示 =====
// 目标：在玩家拿到大学线索后，明确提示巡捕房卷宗是关键拼图，但不提前剧透福生仓。
(function installInvestigationGuidance() {
  function applyInvestigationGuidance() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__investigationGuidancePatched) return;

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function hasPoliceCaseFile() {
      return E.getFlag('got_case_file') || E.hasClue('光华小学事件') || E.hasItem('卷宗摘抄');
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    if (nodes.ch2_leave_univ && !nodes.ch2_leave_univ.__investigationGuidanceTextPatched) {
      const oldText = nodes.ch2_leave_univ.text;
      nodes.ch2_leave_univ.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (hasUniversityXuehuaLead() && !hasPoliceCaseFile()) {
          return `${base}<br><br><span class="sys">薛华立路 22 号已经浮出水面，但这只是地址，不是证据链。巡捕房的卷宗里也许藏着苏晚亭案与光华小学之间的正式连接；先把案卷补上，后面的判断才不至于只靠猜测。</span>`;
        }
        return base;
      };
      nodes.ch2_leave_univ.__investigationGuidanceTextPatched = true;
    }

    if (nodes.ch2_leave_univ && !nodes.ch2_leave_univ.__investigationGuidanceChoicePatched) {
      const oldChoices = nodes.ch2_leave_univ.choices;
      nodes.ch2_leave_univ.choices = function (state) {
        const choices = choicesOf(oldChoices, state);
        if (!hasUniversityXuehuaLead() || hasPoliceCaseFile()) return choices;
        return choices.map(choice => {
          if (choice.goto === 'ch2_police' || choice.goto === 'ch2_police_alt' || (choice.text || '').includes('巡捕房')) {
            return { ...choice, text: '📋 去巡捕房，把光华小学那桩旧案查清楚' };
          }
          return choice;
        });
      };
      nodes.ch2_leave_univ.__investigationGuidanceChoicePatched = true;
    }

    E.__investigationGuidancePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyInvestigationGuidance);
})();
