// ===== 医院终章流程收束 =====
// 目标：福生仓救人后不能直接跳回事务所。
// 正确节奏：码头逃离 → 教会医院冲突 → 陆念薇/证词选择 → 傅启元后巷交易 → 事务所结案。

(function installHospitalFlowPolish() {
  function applyHospitalFlowPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalFlowPolishPatched) return;

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__hospitalOnlyPatched) {
      const oldText = nodes.ch4_dock_escape_finish.text;
      nodes.ch4_dock_escape_finish.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (String(base).includes('车子没有直接回事务所')) return base;
        return `${base}<br><br>车子没有直接回事务所，而是先拐进一家教会医院的后门。老孙的人守在巷口，周怀安站在走廊尽头，脸色白得像墙灰。<br><br>你知道，真正难的不是把人从仓库里带出来，而是决定接下来保护谁、追谁、牺牲什么。`;
      };
      nodes.ch4_dock_escape_finish.choices = [
        { text: '🏥 去医院走廊，面对所有人的争执', goto: 'ch4_hospital_conflict' }
      ];
      nodes.ch4_dock_escape_finish.__hospitalOnlyPatched = true;
    }

    if (nodes.ch4_hospital_protect_witnesses && !nodes.ch4_hospital_protect_witnesses.__forceLuPatched) {
      nodes.ch4_hospital_protect_witnesses.choices = [
        { text: '🕯️ 根据沈玉芳的话，逼陆念薇现身', goto: 'ch4_lu_confrontation' }
      ];
      nodes.ch4_hospital_protect_witnesses.__forceLuPatched = true;
    }

    if (nodes.ch4_lu_confrontation && !nodes.ch4_lu_confrontation.__forceFuPatched) {
      nodes.ch4_lu_confrontation.choices = [
        {
          text: '🚓 把陆念薇交给老孙，换正式口供',
          effect: () => {
            E.setFlag('v07_lu_to_sun', true);
            E.addClue('陆念薇正式口供', '陆念薇被交给老孙后，愿意写下傅启元与福生仓转运安排。');
          },
          goto: 'ch4_fu_private_offer'
        },
        {
          text: '🧾 让她写下傅启元的下一步安排',
          effect: () => {
            E.setFlag('v07_lu_statement', true);
            E.addClue('陆念薇补充口供', '陆念薇写下傅启元南码头转运安排。');
          },
          goto: 'ch4_fu_private_offer'
        },
        {
          text: '🌫️ 放她走，让她继续做内线',
          effect: () => {
            E.setFlag('v07_lu_as_informant', true);
            E.addHeat(1, '你放走陆念薇，留下了内线，也留下了风险。');
          },
          goto: 'ch4_fu_private_offer'
        }
      ];
      nodes.ch4_lu_confrontation.__forceFuPatched = true;
    }

    if (nodes.ch4_fu_private_offer && !nodes.ch4_fu_private_offer.__hospitalClosurePatched) {
      const oldChoices = nodes.ch4_fu_private_offer.choices;
      nodes.ch4_fu_private_offer.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(base)) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_conclusion') {
            return { ...choice, text: `${choice.text}，再回事务所整理结案材料` };
          }
          return choice;
        });
      };
      nodes.ch4_fu_private_offer.__hospitalClosurePatched = true;
    }

    E.__hospitalFlowPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalFlowPolish);
})();
