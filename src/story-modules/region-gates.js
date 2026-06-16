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

    if (nodes.ch3_chen_letter) {
      nodes.ch3_chen_letter.choices = [{ text: '🔙 回到校长办公室整理线索', goto: 'ch3_school' }];
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__regionGatePatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (s) {
        if (!E.isSchoolComplete()) return [{ text: '🔙 回光华小学继续调查', goto: 'ch3_school' }];
        return choicesOf(oldChoices, s);
      };
      nodes.ch3_wrapup.__regionGatePatched = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyRegionGates);
})();
