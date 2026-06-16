// ===== 区域完成度门槛 =====
// 目的：把“离开地区 / 进入下一站”的控制权收回到地区 hub，避免单个调查分支提前跳出。
(function installRegionGates() {
  function asChoices(source, state) {
    if (!source) return [];
    return typeof source === 'function' ? source(state) : source;
  }

  function applyRegionGates() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

    E.isUniversityComplete = function () {
      return this.hasClue('舍监证词')
        && this.getFlag('asked_door')
        && this.hasClue('法租界地图');
    };

    E.isSchoolComplete = function () {
      const yufangLineComplete = !this.getFlag('sister_case') || this.hasClue('沈玉芳与陈明远');

      return this.getFlag('asked_about_chen')
        && this.getFlag('chen_su_link')
        && this.hasClue('陈老师与女子争吵')
        && this.getFlag('got_chen_evidence')
        && this.getFlag('read_letter')
        && yufangLineComplete;
    };

    // 圣约翰大学：论文草稿只能回到宿舍 hub，不能绕过大学完成度判断直接离开。
    if (nodes.ch2_univ_paper) {
      nodes.ch2_univ_paper.choices = [
        { text: '🔙 回到宿舍继续调查', goto: 'ch2_university' }
      ];
    }

    // 双保险：即使旧存档或其他节点误入“离开大学”，未完成时也只允许返回大学。
    if (nodes.ch2_leave_univ && !nodes.ch2_leave_univ.__regionGatePatched) {
      const oldText = nodes.ch2_leave_univ.text;
      const oldChoices = nodes.ch2_leave_univ.choices;

      nodes.ch2_leave_univ.text = function (s) {
        if (!E.isUniversityComplete()) {
          return '你刚走到校门口，心里忽然一沉。圣约翰大学里还有没问完的人、没对上的细节。现在离开太早，后面的判断会变成猜测。';
        }
        return typeof oldText === 'function' ? oldText(s) : oldText;
      };

      nodes.ch2_leave_univ.choices = function (s) {
        if (!E.isUniversityComplete()) {
          return [{ text: '🔙 回圣约翰大学继续调查', goto: 'ch2_university' }];
        }
        return asChoices(oldChoices, s);
      };

      nodes.ch2_leave_univ.__regionGatePatched = true;
    }

    // 光华小学：主节点改为地区 hub，只展示当前仍需调查的入口；完成后才开放整理线索。
    if (nodes.ch3_school && !nodes.ch3_school.__regionGatePatched) {
      nodes.ch3_school.choices = function () {
        const opts = [];

        if (!E.getFlag('asked_about_chen')) {
          opts.push({ text: '💬 问陈老师的事', goto: 'ch3_school_teacher' });
        }

        if (E.getFlag('sister_case') && !E.hasClue('沈玉芳与陈明远')) {
          opts.push({ text: '💬 问沈玉芳的事', goto: 'ch3_school_yufang' });
        }

        if (E.getFlag('asked_about_chen') && !E.getFlag('chen_su_link')) {
          opts.push({ text: '💬 问陈老师跟苏晚亭的关系', goto: 'ch3_school_chen_su' });
        }

        if (!E.hasClue('陈老师与女子争吵')) {
          opts.push({ text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' });
        }

        if (!E.getFlag('got_chen_evidence')) {
          opts.push({ text: '📖 看陈老师的办公室', goto: 'ch3_school_office' });
        } else if (!E.getFlag('read_letter')) {
          opts.push({ text: '📩 继续看陈老师留下的信', goto: 'ch3_chen_letter' });
        }

        if (E.isSchoolComplete()) {
          opts.push({ text: '🔙 光华小学已经查得差不多了，整理线索', goto: 'ch3_wrapup' });
        }

        return opts;
      };

      nodes.ch3_school.__regionGatePatched = true;
    }

    // 陈老师办公室：不能在没读信前直接“准备结案”。
    if (nodes.ch3_school_office) {
      nodes.ch3_school_office.choices = function () {
        const opts = [];
        if (!E.getFlag('read_letter')) {
          opts.push({ text: '📩 看那封信的内容', goto: 'ch3_chen_letter' });
        }
        opts.push({ text: '🔙 回到校长办公室继续调查', goto: 'ch3_school' });
        return opts;
      };
    }

    // 读完信后仍回 hub，由 hub 判断是否可整理线索。
    if (nodes.ch3_chen_letter) {
      nodes.ch3_chen_letter.choices = [
        { text: '🔙 回到校长办公室整理线索', goto: 'ch3_school' }
      ];
    }

    // 举证三人合影后也不能直接绕过 hub。
    if (nodes.ch3_wu_present_photo) {
      nodes.ch3_wu_present_photo.choices = [
        { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
        { text: '🔙 回到校长办公室', goto: 'ch3_school' }
      ];
    }

    // 双保险：旧存档或其他分支误入 wrapup 时，未完成则引导回光华小学。
    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__regionGatePatched) {
      const oldText = nodes.ch3_wrapup.text;
      const oldChoices = nodes.ch3_wrapup.choices;

      nodes.ch3_wrapup.text = function (s) {
        if (!E.isSchoolComplete()) {
          return '你刚把线索摊开，马上发现光华小学这里还缺关键拼图。陈老师之死、苏晚亭来校、沈玉芳线索、办公室证据和那封未寄出的信，必须先对齐，否则后面的判断会太跳。';
        }
        return typeof oldText === 'function' ? oldText(s) : oldText;
      };

      nodes.ch3_wrapup.choices = function (s) {
        if (!E.isSchoolComplete()) {
          return [{ text: '🔙 回光华小学继续调查', goto: 'ch3_school' }];
        }
        return asChoices(oldChoices, s);
      };

      nodes.ch3_wrapup.__regionGatePatched = true;
    }
  }

  // main.js 与 story-modules.js 都会在 DOMContentLoaded 前注册补丁。
  // 本脚本放在最后加载，DOMContentLoaded 时最后执行，确保覆盖所有旧补丁。
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRegionGates);
  } else {
    applyRegionGates();
  }
})();
