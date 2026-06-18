// ===== 医院后门安置 / 分诊缓冲节点 =====
// 目标：逃离码头后，不直接跳到医院走廊争执，而是先给玩家一个安置证人的缓冲节点。
// 这个节点用少量分数调节 hospitalPressure / hospitalControl / witnessStability。
// 注意：周怀安过早入场的 pressure/witness 影响由 lu-procedure-truth-polish.js 统一处理，避免重复计分。

(function installHospitalTriagePolish() {
  function applyHospitalTriagePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalTriagePolishPatched) return;

    function hospitalBadge() {
      if (typeof E.hospitalOutcomeTier !== 'function') return '';
      const o = E.hospitalOutcomeTier();
      const lines = [];
      if (o.key === 'stable') lines.push('医院里暂时安静。证人被保护得很好。');
      else if (o.key === 'tense') lines.push('走廊里的气氛越来越紧。每个人都在等对方先动。');
      else if (o.key === 'chaotic') lines.push('医院已经失控。有人先动了。');
      else lines.push('医院还在你的掌控里。可夜还长。');
      return `<br><br><span class="sys">${lines.join(' ')}</span>`;
    }

    if (typeof E.hospitalPressureScore === 'function' && !E.__hospitalTriagePressurePatched) {
      const oldPressure = E.hospitalPressureScore.bind(E);
      E.hospitalPressureScore = function () {
        let score = oldPressure();
        if (this.getFlag('hospital_triage_settle_witness')) score -= 1;
        if (this.getFlag('hospital_triage_backdoor_guard')) score -= 1;
        if (this.getFlag('hospital_triage_direct_corridor')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__hospitalTriagePressurePatched = true;
    }

    if (typeof E.hospitalControlScore === 'function' && !E.__hospitalTriageControlPatched) {
      const oldControl = E.hospitalControlScore.bind(E);
      E.hospitalControlScore = function () {
        let score = oldControl();
        if (this.getFlag('hospital_triage_settle_witness')) score += 1;
        if (this.getFlag('hospital_triage_backdoor_guard')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__hospitalTriageControlPatched = true;
    }

    if (typeof E.witnessStabilityScore === 'function' && !E.__hospitalTriageWitnessPatched) {
      const oldWitness = E.witnessStabilityScore.bind(E);
      E.witnessStabilityScore = function () {
        let score = oldWitness();
        if (this.getFlag('hospital_triage_settle_witness')) score += 1;
        if (this.getFlag('hospital_triage_direct_corridor')) score -= 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__hospitalTriageWitnessPatched = true;
    }

    nodes.ch4_hospital_triage = {
      title: '教会医院 · 后门安置',
      weather: 3,
      text: () => {
        const wp = typeof E.hospitalWitnessProfile === 'function' ? E.hospitalWitnessProfile() : { label: '证人' };
        const witnessLine = wp.label === '双证人'
          ? '沈玉芳被护士扶进病房，苏晚亭裹着你的大衣，呼吸轻得像随时会被走廊里的争吵惊醒。'
          : '沈玉芳被护士扶进病房，她走得很慢，像每一步都还踩在福生仓潮湿的地面上。';
        return `${witnessLine}<br><br>医院后门的灯很暗。周怀安站在楼梯口，老孙的人或便衣守在巷子里，走廊另一头已经有人听见风声赶来。<br><br>这里不是审讯室。你先做什么，会决定证人能不能撑到天亮。${hospitalBadge()}`;
      },
      choices: [
        {
          text: '🛏️ 先把证人送进病房，压低声音等医生',
          effect: () => {
            E.setFlag('hospital_triage_settle_witness', true);
            E.addClue('医院后门安置', '你没有立刻审问证人，而是先把人送进病房，让她们离开走廊视线。');
          },
          goto: 'ch4_hospital_conflict'
        },
        {
          text: '🚪 让便衣或老孙的人守住医院后门',
          effect: () => {
            E.setFlag('hospital_triage_backdoor_guard', true);
            E.addClue('医院后门有人看守', '你让支援人手守住医院后门，防止傅启元或公董局的人直接闯进病房。');
          },
          goto: 'ch4_hospital_conflict'
        },
        {
          text: '⚠️ 让周怀安立刻进来认人',
          effect: () => {
            E.setFlag('hospital_triage_zhou_early', true);
            E.addHeat(1, '周怀安过早进入病房，证人情绪被重新牵动。');
          },
          goto: 'ch4_hospital_conflict'
        },
        {
          text: '🚶 直接去走廊面对所有人的争执',
          effect: () => E.setFlag('hospital_triage_direct_corridor', true),
          goto: 'ch4_hospital_conflict'
        }
      ]
    };

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__hospitalTriagePatched) {
      nodes.ch4_dock_escape_finish.choices = [
        { text: '🏥 从医院后门先安置证人', goto: 'ch4_hospital_triage' }
      ];
      nodes.ch4_dock_escape_finish.__hospitalTriagePatched = true;
    }

    E.__hospitalTriagePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalTriagePolish);
})();