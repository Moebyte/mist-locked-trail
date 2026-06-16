// Region completion gates: keep exits controlled by each location hub.
(function installRegionGates() {
  function choicesOf(source, state) {
    if (!source) return [];
    return typeof source === 'function' ? source(state) : source;
  }

  function appendHubChoice(opts, text, goto) {
    if (!opts.some(choice => choice.goto === goto)) opts.push({ text, goto });
    return opts;
  }

  function chainEffect(node, effect) {
    const oldEffect = node.effect;
    node.effect = function (state) {
      if (typeof oldEffect === 'function') oldEffect(state);
      effect(state);
    };
  }

  function applyRegionGates() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

    const askedDoorFlag = ['asked', 'door'].join('_');

    E.isUniversityComplete = function () {
      return this.hasClue('舍监证词') && this.getFlag(askedDoorFlag) && this.hasClue('法租界地图');
    };

    function universityChoices() {
      const opts = [];
      if (!E.hasClue('舍监证词')) opts.push({ text: '👩 问舍监——失踪那天的情况', goto: 'ch2_univ_matron' });
      if (!E.getFlag(askedDoorFlag)) opts.push({ text: '🚪 找门房——问黑衣男人的事', goto: 'ch2_univ_door' });
      if (!E.hasClue('法租界地图')) opts.push({ text: '📄 检查她的论文草稿', goto: 'ch2_univ_paper' });
      if (E.isUniversityComplete()) opts.push({ text: '🔙 已经查得差不多了，去下一个地方', goto: 'ch2_leave_univ' });
      return opts;
    }

    function universityFollowupChoices() {
      return appendHubChoice(universityChoices(), '🔙 回到宿舍继续调查', 'ch2_university');
    }

    function policeChoices() {
      const opts = [];
      if (!E.getFlag('got_wang_note')) opts.push({ text: '📎 追问王巡官调离前留下了什么', goto: 'ch2_police_wang' });
      if (E.getFlag('got_wang_note')) {
        opts.push({ text: '🏛️ 去薛华立路 22 号——王巡官的线索指向这里', goto: 'ch2_frenchtown' });
        opts.push({ text: '🏠 去苏家', goto: 'ch2_home' });
        opts.push({ text: '📚 去光华小学', goto: 'ch3_school' });
      }
      return opts;
    }

    function searched203Evidence() {
      return E.hasClue('三人合影') || E.hasItem('三人合影') || E.hasClue('恐吓信') || E.hasItem('恐吓信');
    }

    function buildingChoices() {
      const opts = [];
      if (!E.getFlag('saw_man')) opts.push({ text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' });
      if (!E.getFlag('asked_landlord')) opts.push({ text: '🔍 问看门老头更多关于陆姓女子的事', goto: 'ch2_ask_landlord' });
      if (!searched203Evidence()) opts.push({ text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' });
      if (searched203Evidence()) opts.push({ text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' });
      return opts;
    }

    function buildingFollowupChoices() {
      return appendHubChoice(buildingChoices(), '🔙 回到薛华立路 22 号门口', 'ch2_frenchtown');
    }

    function room203Choices() {
      const opts = [];
      if (!searched203Evidence()) opts.push({ text: '📖 仔细搜查房间', goto: 'ch2_203_search' });
      if (searched203Evidence()) opts.push({ text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' });
      return appendHubChoice(opts, '🔙 回到薛华立路 22 号门口', 'ch2_frenchtown');
    }

    E.isSchoolComplete = function () {
      const yufangDone = !this.getFlag('sister_case') || this.hasClue('沈玉芳与陈明远');
      return this.getFlag('asked_about_chen')
        && this.getFlag('chen_su_link')
        && this.hasClue('陈老师与女子争吵')
        && this.getFlag('got_chen_evidence')
        && this.getFlag('read_letter')
        && yufangDone;
    };

    function schoolChoices() {
      const opts = [];
      if (!E.getFlag('asked_about_chen')) opts.push({ text: '💬 问陈老师的事', goto: 'ch3_school_teacher' });
      if (E.getFlag('sister_case') && !E.hasClue('沈玉芳与陈明远')) opts.push({ text: '💬 问沈玉芳的事', goto: 'ch3_school_yufang' });
      if (E.getFlag('asked_about_chen') && !E.getFlag('chen_su_link')) opts.push({ text: '💬 问陈老师跟苏晚亭的关系', goto: 'ch3_school_chen_su' });
      if (!E.hasClue('陈老师与女子争吵')) opts.push({ text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' });
      if (!E.getFlag('got_chen_evidence')) opts.push({ text: '📖 看陈老师的办公室', goto: 'ch3_school_office' });
      else if (!E.getFlag('read_letter')) opts.push({ text: '📩 继续看陈老师留下的信', goto: 'ch3_chen_letter' });
      if (E.isSchoolComplete()) opts.push({ text: '🔙 光华小学已经查得差不多了，整理线索', goto: 'ch3_wrapup' });
      return opts;
    }

    function schoolFollowupChoices() {
      return appendHubChoice(schoolChoices(), '🔙 回到校长办公室继续调查', 'ch3_school');
    }

    function currentHeat() {
      return E.state.pressure?.heat || 0;
    }

    function heatPenalty() {
      const heat = currentHeat();
      if (heat >= 6) return 2;
      if (heat >= 4) return 1;
      return 0;
    }

    function sunSupportPresentAtDock() {
      return E.getFlag('sun_fast_support') || E.getFlag('sun_wait_support') || E.getFlag('sun_support_in_action');
    }

    function adjustedDockPhase(basePhase) {
      const phases = ['safe', 'tight', 'critical', 'expired'];
      const start = Math.max(0, phases.indexOf(basePhase));
      const supportRelief = sunSupportPresentAtDock() ? 1 : 0;
      const penalty = Math.max(0, heatPenalty() - supportRelief);
      return phases[Math.min(phases.length - 1, start + penalty)];
    }

    E.heatPenalty = heatPenalty;
    E.adjustedDockPhase = function () {
      return adjustedDockPhase(this.deadlinePhase());
    };

    E.routeDockByPressure = function () {
      const phase = adjustedDockPhase(this.deadlinePhase());
      if (phase === 'expired') {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (phase === 'critical') return 'ch4_dock_rescue_only';
      if (phase === 'tight') return 'ch4_dock_limited_search';
      return 'ch4_dock_full_search';
    };

    E.routeDockDeepByPressure = function () {
      const phase = adjustedDockPhase(this.deadlinePhase());
      if (phase === 'expired') {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (phase === 'critical') return 'ch4_dock_deep_rescue_only';
      if (phase === 'tight') return 'ch4_dock_deep_trace';
      return 'ch4_dock_deep_dual';
    };

    if (!E.__heatPressureLabelPatched && typeof E.pressureLabel === 'function') {
      const oldPressureLabel = E.pressureLabel.bind(E);
      E.pressureLabel = function () {
        const base = oldPressureLabel();
        const heat = currentHeat();
        if (heat >= 6) return `${base} · 暴露严重`;
        if (heat >= 4) return `${base} · 搜查窗口缩短`;
        return base;
      };
      E.__heatPressureLabelPatched = true;
    }

    if (!E.__heatCaseStrengthPatched && typeof E.caseStrength === 'function') {
      const oldCaseStrength = E.caseStrength.bind(E);
      E.caseStrength = function () {
        const result = oldCaseStrength();
        const heat = currentHeat();
        let suffix = '';
        if (this.getFlag('messy_escape')) suffix = ' 但撤离时动静太大，对方很可能已经开始统一口径，公开指控的阻力会上升。';
        else if (heat >= 6) suffix = ' 但行动暴露严重，对方已有警觉，证据链的实际施压效果会被削弱。';
        else if (heat >= 4) suffix = ' 但现场压力偏高，后续行动窗口正在收窄。';
        return suffix ? { name: result.name, desc: result.desc + suffix } : result;
      };
      E.__heatCaseStrengthPatched = true;
    }

    if (nodes.ch2_university && !nodes.ch2_university.__regionGateHubPatched) {
      nodes.ch2_university.choices = universityChoices;
      nodes.ch2_university.__regionGateHubPatched = true;
    }
    if (nodes.ch2_univ_matron) nodes.ch2_univ_matron.choices = universityFollowupChoices;
    if (nodes.ch2_univ_door) nodes.ch2_univ_door.choices = universityFollowupChoices;
    if (nodes.ch2_univ_paper) nodes.ch2_univ_paper.choices = [{ text: '🔙 回到宿舍继续调查', goto: 'ch2_university' }];

    if (nodes.ch2_leave_univ && !nodes.ch2_leave_univ.__regionGatePatched) {
      const oldChoices = nodes.ch2_leave_univ.choices;
      nodes.ch2_leave_univ.choices = function (s) {
        if (!E.isUniversityComplete()) return [{ text: '🔙 回圣约翰大学继续调查', goto: 'ch2_university' }];
        return choicesOf(oldChoices, s);
      };
      nodes.ch2_leave_univ.__regionGatePatched = true;
    }

    if (nodes.ch2_police_file) nodes.ch2_police_file.choices = policeChoices;
    if (nodes.ch2_police_alt) nodes.ch2_police_alt.choices = policeChoices;

    if (nodes.ch2_frenchtown) nodes.ch2_frenchtown.choices = buildingChoices;
    if (nodes.ch2_building_enter) nodes.ch2_building_enter.choices = buildingFollowupChoices;
    if (nodes.ch2_ask_landlord) nodes.ch2_ask_landlord.choices = buildingFollowupChoices;
    if (nodes.ch2_landlord_map) nodes.ch2_landlord_map.choices = buildingFollowupChoices;
    if (nodes.ch2_203_door) nodes.ch2_203_door.choices = room203Choices;

    if (nodes.ch3_school && !nodes.ch3_school.__regionGatePatched) {
      nodes.ch3_school.choices = schoolChoices;
      nodes.ch3_school.__regionGatePatched = true;
    }
    if (nodes.ch3_school_yufang) nodes.ch3_school_yufang.choices = schoolFollowupChoices;
    if (nodes.ch3_school_teacher) nodes.ch3_school_teacher.choices = schoolFollowupChoices;
    if (nodes.ch3_wu_present_threat) nodes.ch3_wu_present_threat.choices = schoolFollowupChoices;
    if (nodes.ch3_wu_present_photo) nodes.ch3_wu_present_photo.choices = schoolFollowupChoices;
    if (nodes.ch3_school_chen_su) nodes.ch3_school_chen_su.choices = schoolFollowupChoices;
    if (nodes.ch3_school_weird) nodes.ch3_school_weird.choices = schoolFollowupChoices;

    if (nodes.ch3_school_office) {
      nodes.ch3_school_office.choices = function () {
        const opts = [];
        if (!E.getFlag('read_letter')) opts.push({ text: '📩 看那封信的内容', goto: 'ch3_chen_letter' });
        return appendHubChoice(opts, '🔙 回到校长办公室继续调查', 'ch3_school');
      };
    }

    if (nodes.ch3_chen_letter) nodes.ch3_chen_letter.choices = [{ text: '🔙 回到校长办公室整理线索', goto: 'ch3_school' }];

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__regionGatePatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (s) {
        if (!E.isSchoolComplete()) return [{ text: '🔙 回光华小学继续调查', goto: 'ch3_school' }];
        return choicesOf(oldChoices, s);
      };
      nodes.ch3_wrapup.__regionGatePatched = true;
    }

    if (nodes.ch4_dock_wait && !nodes.ch4_dock_wait.__dockSupportPatched) {
      chainEffect(nodes.ch4_dock_wait, () => {
        E.setFlag('sun_support_available', true);
        E.setFlag('sun_wait_support', true);
        E.setFlag('sun_support_in_action', true);
      });
      nodes.ch4_dock_wait.__dockSupportPatched = true;
    }

    if (nodes.ch4_dock_sun_fast_support && !nodes.ch4_dock_sun_fast_support.__dockSupportPatched) {
      chainEffect(nodes.ch4_dock_sun_fast_support, () => {
        E.setFlag('sun_fast_support', true);
        E.setFlag('sun_support_in_action', true);
      });
      nodes.ch4_dock_sun_fast_support.__dockSupportPatched = true;
    }

    if (nodes.ch4_dock_escape && !nodes.ch4_dock_escape.__dockSupportChoicesPatched) {
      const oldChoices = nodes.ch4_dock_escape.choices;
      nodes.ch4_dock_escape.choices = function (s) {
        const support = sunSupportPresentAtDock();
        const heat = currentHeat();
        let opts = choicesOf(oldChoices, s).filter(choice => {
          if (choice.goto === 'ch4_fu_confront' && choice.text && choice.text.includes('老孙的人')) return support;
          if (choice.goto === 'ch4_fu_confront' && choice.text && choice.text.includes('当场质问傅启元')) return support || heat < 4;
          return true;
        });
        if (support && !opts.some(choice => choice.goto === 'ch4_fu_confront' && choice.text && choice.text.includes('老孙的人'))) {
          opts.unshift({ text: '🚓 让老孙的人亮明身份，正面压住傅启元', goto: 'ch4_fu_confront' });
        }
        if (!support && heat >= 6) {
          opts = opts.filter(choice => !(choice.text && choice.text.includes('借雾')));
          opts.push({
            text: '⚠️ 动静太大，只能冒险强行撤离',
            effect: () => {
              E.setFlag('messy_escape', true);
              E.addHeat(1, '现场已经被惊动，你只能带人强行撤离。');
            },
            goto: 'ch4_dock_escape_finish'
          });
        }
        return opts;
      };
      nodes.ch4_dock_escape.__dockSupportChoicesPatched = true;
    }

    if (nodes.ch4_fu_confront && !nodes.ch4_fu_confront.__supportAwareTextPatched) {
      nodes.ch4_fu_confront.text = () => {
        if (sunSupportPresentAtDock()) {
          return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br><span class="sys">"傅秘书，今晚这两个人，得先跟我们走。"</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。`;
        }
        return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元看着你，像是在判断你背后到底有没有人。你没有老孙的人撑场，只能把声音压稳，赌他不敢在码头上把事情闹大。<br><br>他没有让路，只是冷冷地说：<span class="sys">"沈先生，你今天带走的人，明天未必还能替你说话。"</span><br><br>这不是压住了他，只是抢出了一条缝。你不能再多停。`;
      };
      nodes.ch4_fu_confront.choices = [{ text: '🚕 立刻送她们离开码头', goto: 'ch4_dock_escape_finish' }];
      nodes.ch4_fu_confront.__supportAwareTextPatched = true;
    }

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__heatTextPatched) {
      const oldText = nodes.ch4_dock_escape_finish.text;
      nodes.ch4_dock_escape_finish.text = function (s) {
        const base = typeof oldText === 'function' ? oldText(s) : oldText;
        if (E.getFlag('messy_escape')) {
          return `${base}<br><br>只是这次撤离太响了。码头上的守卫、车灯和枪套声都记住了你的脸。你救出了人，也把自己推到了更明处。`;
        }
        return base;
      };
      nodes.ch4_dock_escape_finish.__heatTextPatched = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyRegionGates);
})();
