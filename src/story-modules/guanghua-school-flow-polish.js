// ===== 光华小学流程收束 =====
// 目标：光华小学不再是松散问询点。先问人、再搜办公室，最后必须把硬证据拿回吴校长面前对质。
// 隐藏结局硬门槛：203 恐吓信 + 光华三人合影 + 大学日记残页，三件都完成校长质询。

(function installGuanghuaSchoolFlowPolish() {
  function applyGuanghuaSchoolFlowPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__guanghuaSchoolFlowPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function hasThreatProof() {
      return hasThing('恐吓信');
    }

    function hasPhotoProof() {
      return hasThing('三人合影');
    }

    function hasUniversityProof() {
      return hasThing('日记残页') || hasThing('苏晚亭日记残页') || hasThing('苏晚亭半封家书');
    }

    function hasAnyWuProof() {
      return hasThreatProof() || hasPhotoProof() || hasUniversityProof() || hasThing('陈老师遗物') || hasThing('陈明远的信') || hasThing('未寄出的信');
    }

    function schoolConfrontNeeded() {
      return !E.getFlag('school_wu_three_proofs') && (E.getFlag('asked_about_chen') || E.getFlag('got_chen_evidence') || E.getFlag('read_letter') || hasAnyWuProof());
    }

    function schoolConfrontCompleteEnough() {
      return E.getFlag('presented_threat_to_wu') && E.getFlag('presented_photo_to_wu') && E.getFlag('presented_university_to_wu');
    }

    function choiceTarget(choice, state) {
      return typeof choice.goto === 'function' ? choice.goto(state) : choice.goto;
    }

    function markThreatPresented() {
      E.setFlag('presented_threat_to_wu', true);
      E.setFlag('wu_threat_broken', true);
    }

    function markPhotoPresented() {
      E.setFlag('presented_photo_to_wu', true);
      E.setFlag('wu_named_fu', true);
    }

    function markUniversityPresented() {
      E.setFlag('presented_university_to_wu', true);
      E.setFlag('wu_understands_su_choice', true);
    }

    function confrontationFollowupChoices() {
      const opts = [];
      if (hasThreatProof() && !E.getFlag('presented_threat_to_wu')) {
        opts.push({ text: '📄 拿出恐吓信，问陈明远死前到底找过谁', effect: markThreatPresented, goto: 'ch3_wu_present_threat' });
      }
      if (hasPhotoProof() && !E.getFlag('presented_photo_to_wu')) {
        opts.push({ text: '🖼️ 拿出三人合影，问陆小姐为什么能进学校', effect: markPhotoPresented, goto: 'ch3_wu_present_photo' });
      }
      if (hasUniversityProof() && !E.getFlag('presented_university_to_wu')) {
        opts.push({ text: '📓 拿出苏晚亭的日记残页，问她为什么会追到光华小学', effect: markUniversityPresented, goto: 'ch3_wu_present_university' });
      }
      if (schoolConfrontCompleteEnough()) {
        opts.push({ text: '🧩 把三件证物合到一起', goto: 'ch3_school_after_confront' });
      } else {
        if (!hasThreatProof()) opts.push({ text: '🏛️ 先去薛华立路 203 室找能压住校长的话', goto: 'ch2_frenchtown' });
        if (!hasPhotoProof()) opts.push({ text: '📖 先去陈老师办公室找学校内部证物', goto: 'ch3_school_office' });
        if (!hasUniversityProof()) opts.push({ text: '📚 先回圣约翰大学补查苏晚亭留下的文字', goto: 'ch2_university' });
      }
      return opts;
    }

    if (nodes.ch2_univ_paper && !nodes.ch2_univ_paper.__guanghuaUniversityProofPatched) {
      const oldEffect = nodes.ch2_univ_paper.effect;
      nodes.ch2_univ_paper.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (!E.hasItem('日记残页')) E.addItem('日记残页', '苏晚亭夹在牛津字典里的残页：她决定继续追查光华小学的秘密。');
        if (!E.hasClue('苏晚亭日记残页')) E.addClue('苏晚亭日记残页', '她知道陈明远害怕，也知道沈玉芳和陆小姐都被卷进光华小学的秘密。');
      };
      nodes.ch2_univ_paper.__guanghuaUniversityProofPatched = true;
    }

    if (nodes.ch3_school && !nodes.ch3_school.__guanghuaSchoolHubPatched) {
      nodes.ch3_school.choices = function () {
        const opts = [];
        if (!E.getFlag('asked_about_chen')) opts.push({ text: '💬 先问陈老师坠楼的事', goto: 'ch3_school_teacher' });
        if (E.getFlag('sister_case') && !E.hasClue('沈玉芳与陈明远')) opts.push({ text: '💬 问沈玉芳的事', goto: 'ch3_school_yufang' });
        if (E.getFlag('asked_about_chen') && !E.hasClue('陈老师与女子争吵')) opts.push({ text: '💬 问学校最近有没有异常', goto: 'ch3_school_weird' });
        if (E.getFlag('asked_about_chen') && !E.getFlag('got_chen_evidence')) opts.push({ text: '📖 去陈老师办公室找能压住话头的东西', goto: 'ch3_school_office' });
        if (E.getFlag('got_chen_evidence') || E.getFlag('read_letter') || hasThreatProof() || hasPhotoProof() || hasUniversityProof()) {
          opts.push({ text: '🧾 带着手里的证据回到校长办公室', goto: 'ch3_school_confront_wu' });
        }
        if (E.getFlag('school_wu_three_proofs')) opts.push({ text: '🔙 光华小学这条线暂时收住，回去整理', goto: 'ch3_wrapup' });
        if (!opts.length) opts.push({ text: '💬 先问陈老师坠楼的事', goto: 'ch3_school_teacher' });
        return opts;
      };
      nodes.ch3_school.__guanghuaSchoolHubPatched = true;
    }

    if (nodes.ch3_school_teacher && !nodes.ch3_school_teacher.__guanghuaTeacherChoicesPatched) {
      const oldOnPresent = nodes.ch3_school_teacher.onPresent;
      nodes.ch3_school_teacher.onPresent = function (item, state) {
        if (item?.name === '恐吓信' && !E.getFlag('presented_threat_to_wu')) {
          markThreatPresented();
          return { goto: 'ch3_wu_present_threat' };
        }
        if (item?.name === '三人合影' && !E.getFlag('presented_photo_to_wu')) {
          markPhotoPresented();
          return { goto: 'ch3_wu_present_photo' };
        }
        if ((item?.name === '日记残页' || item?.name === '苏晚亭日记残页' || item?.name === '苏晚亭半封家书') && !E.getFlag('presented_university_to_wu')) {
          markUniversityPresented();
          return { goto: 'ch3_wu_present_university' };
        }
        return typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
      };
      nodes.ch3_school_teacher.choices = function () {
        const opts = [];
        if (!E.getFlag('chen_su_link')) opts.push({ text: '💬 问陈老师跟苏晚亭的关系', goto: 'ch3_school_chen_su' });
        if (!E.hasClue('陈老师与女子争吵')) opts.push({ text: '💬 问学校最近有没有异常', goto: 'ch3_school_weird' });
        if (!E.getFlag('got_chen_evidence')) opts.push({ text: '📖 要求看陈老师的办公室', goto: 'ch3_school_office' });
        if (hasThreatProof() || hasPhotoProof() || hasUniversityProof()) opts.push({ text: '🧾 不再绕圈子，拿证据对质吴校长', goto: 'ch3_school_confront_wu' });
        opts.push({ text: '🔙 回到校长办公室', goto: 'ch3_school' });
        return opts;
      };
      nodes.ch3_school_teacher.__guanghuaTeacherChoicesPatched = true;
    }

    if (nodes.ch3_school_yufang && !nodes.ch3_school_yufang.__guanghuaYufangChoicesPatched) {
      nodes.ch3_school_yufang.choices = function () {
        const opts = [];
        if (!E.getFlag('asked_about_chen')) opts.push({ text: '💬 问陈老师的事', goto: 'ch3_school_teacher' });
        if (!E.hasClue('陈老师与女子争吵')) opts.push({ text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' });
        if (!E.getFlag('got_chen_evidence')) opts.push({ text: '📖 看陈老师的办公室', goto: 'ch3_school_office' });
        if (E.getFlag('got_chen_evidence') || hasThreatProof() || hasPhotoProof() || hasUniversityProof()) opts.push({ text: '🧾 回去找吴校长核对证据', goto: 'ch3_school_confront_wu' });
        opts.push({ text: '🔙 回到校长办公室', goto: 'ch3_school' });
        return opts;
      };
      nodes.ch3_school_yufang.__guanghuaYufangChoicesPatched = true;
    }

    if (nodes.ch3_school_weird && !nodes.ch3_school_weird.__guanghuaWeirdChoicesPatched) {
      nodes.ch3_school_weird.choices = function () {
        const opts = [];
        if (!E.getFlag('got_chen_evidence')) opts.push({ text: '📖 现在去看陈老师的办公室', goto: 'ch3_school_office' });
        if (E.getFlag('got_chen_evidence') || hasThreatProof() || hasPhotoProof() || hasUniversityProof()) opts.push({ text: '🧾 回去找吴校长核对证据', goto: 'ch3_school_confront_wu' });
        opts.push({ text: '🔙 回到校长办公室', goto: 'ch3_school' });
        return opts;
      };
      nodes.ch3_school_weird.__guanghuaWeirdChoicesPatched = true;
    }

    if (nodes.ch3_school_office && !nodes.ch3_school_office.__guanghuaOfficePatched) {
      const oldEffect = nodes.ch3_school_office.effect;
      nodes.ch3_school_office.text = () => `吴校长带你来到一楼拐角的一间办公室。门上贴着“陈明远老师”的名牌，已经有些褪色。<br><br>办公室被收拾过，书架空了一大半，桌面干净得不像刚死过一个主人。<br><br>但人越想抹平痕迹，越容易留下边角。<br><br>在书桌最底层的抽屉里，你摸到一个夹层。撬开以后，里面压着一个牛皮纸信封。<br><br>信封里有三样东西：<br><br><b>一、</b>一张当票——“永昌当铺 · 民国三十七年九月 · 押：翡翠镯一只 · 洋三百元”。<br><br><b>二、</b>一封没有寄出的信。开头是：“晚亭吾爱……”<br><br><b>三、</b>一张黑白照片——陈明远、苏晚亭和陆小姐站在光华小学门前。陆小姐站得离陈明远不近，却离学校大门很近，像一个本不该出现在这里的人。<br><br>这三样东西不能单独回答所有问题，但已经足够让吴校长不能再只说“巡捕房已经结案”。`;
      nodes.ch3_school_office.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (!E.hasItem('三人合影')) E.addItem('三人合影', '陈明远、苏晚亭和陆小姐在光华小学门前的合影。');
        if (!E.hasClue('三人合影')) E.addClue('三人合影', '陈明远、苏晚亭和陆小姐在光华小学门前的合影。');
        E.setFlag('school_office_searched', true);
      };
      nodes.ch3_school_office.choices = function () {
        const opts = [];
        if (!E.getFlag('read_letter')) opts.push({ text: '📩 先看那封未寄出的信', goto: 'ch3_chen_letter' });
        opts.push({ text: '🧾 带着办公室里的东西回去问吴校长', goto: 'ch3_school_confront_wu' });
        return opts;
      };
      nodes.ch3_school_office.__guanghuaOfficePatched = true;
    }

    if (nodes.ch3_chen_letter && !nodes.ch3_chen_letter.__guanghuaLetterChoicesPatched) {
      nodes.ch3_chen_letter.choices = function () {
        return [
          { text: '🧾 带着这封信回去问吴校长', goto: 'ch3_school_confront_wu' },
          { text: '🔙 先回校长办公室，把前后话问完整', goto: 'ch3_school' }
        ];
      };
      nodes.ch3_chen_letter.__guanghuaLetterChoicesPatched = true;
    }

    nodes.ch3_school_confront_wu = {
      title: '光华小学 · 校长办公室',
      weather: 2,
      onPresent: function (item) {
        if (item?.name === '恐吓信' && !E.getFlag('presented_threat_to_wu')) {
          markThreatPresented();
          return { goto: 'ch3_wu_present_threat' };
        }
        if (item?.name === '三人合影' && !E.getFlag('presented_photo_to_wu')) {
          markPhotoPresented();
          return { goto: 'ch3_wu_present_photo' };
        }
        if ((item?.name === '日记残页' || item?.name === '苏晚亭日记残页' || item?.name === '苏晚亭半封家书') && !E.getFlag('presented_university_to_wu')) {
          markUniversityPresented();
          return { goto: 'ch3_wu_present_university' };
        }
        return null;
      },
      text: function () {
        const parts = [];
        if (hasThreatProof() && !E.getFlag('presented_threat_to_wu')) parts.push('203 室的恐吓信，能逼他承认陈明远死前不是孤立无援。');
        if (hasPhotoProof() && !E.getFlag('presented_photo_to_wu')) parts.push('陈老师办公室的三人合影，能逼他说出陆小姐为什么能进学校。');
        if (hasUniversityProof() && !E.getFlag('presented_university_to_wu')) parts.push('大学里找到的日记残页，能说明苏晚亭不是被动卷入，而是为了沈玉芳和陆小姐继续追查。');
        if (!parts.length) parts.push('三件证物已经摆过，吴校长的沉默也被撬开了。');
        return `你把办公室门从里面带上。<br><br>普通问话到这里已经没有用了。吴校长不是完全不知情的人，他只是一直在等一个可以让自己开口的理由。<br><br>${parts.join('<br>')}<br><br>这一次，你不打算让他再把话绕回“巡捕房已经结案”。`;
      },
      choices: confrontationFollowupChoices
    };

    if (nodes.ch3_wu_present_threat && !nodes.ch3_wu_present_threat.__guanghuaThreatChoicesPatched) {
      const oldEffect = nodes.ch3_wu_present_threat.effect;
      nodes.ch3_wu_present_threat.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.setFlag('wu_procurement_admitted', true);
        E.setFlag('school_wu_confront_started', true);
      };
      nodes.ch3_wu_present_threat.choices = confrontationFollowupChoices;
      nodes.ch3_wu_present_threat.__guanghuaThreatChoicesPatched = true;
    }

    if (nodes.ch3_wu_present_photo && !nodes.ch3_wu_present_photo.__guanghuaPhotoChoicesPatched) {
      const oldEffect = nodes.ch3_wu_present_photo.effect;
      nodes.ch3_wu_present_photo.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.setFlag('wu_named_fu', true);
        E.setFlag('school_wu_confront_started', true);
      };
      nodes.ch3_wu_present_photo.choices = confrontationFollowupChoices;
      nodes.ch3_wu_present_photo.__guanghuaPhotoChoicesPatched = true;
    }

    nodes.ch3_wu_present_university = {
      title: '举证 · 日记残页',
      weather: 2,
      effect: function () {
        E.addClue('吴校长确认苏晚亭主动追查', '吴校长看到苏晚亭日记残页后，承认苏晚亭来光华小学不是普通借书，而是在追沈玉芳和陆小姐的事。');
        E.setFlag('wu_su_active_confirmed', true);
        E.setFlag('school_wu_confront_started', true);
      },
      text: () => `你把那张日记残页放到吴校长面前。<br><br><span class="sys">“如果我不去，沈老师怎么办？陆小姐又怎么办？”</span><br><br>吴校长的眼镜滑到鼻梁下方。他盯着那几行字，看了很久。<br><br><span class="sys">“她……她不是来借书的。”</span><br><br>这句话从他嘴里出来时，像是终于承认了一件早该承认的事。<br><br><span class="sys">“苏小姐后来来过学校，不止一次。她问沈老师，也问过陆小姐为什么能自由进出校门。我当时告诉自己，一个大学女生能知道什么。现在看来，她知道得比我敢承认的还多。”</span><br><br>日记残页把苏晚亭从“失踪者”变成了主动追查的人。她不是被雾吞掉的，她是自己走进雾里，想把别人拉出来。`,
      choices: confrontationFollowupChoices
    };

    nodes.ch3_school_after_confront = {
      title: '光华小学 · 线索合拢',
      weather: 2,
      effect: function () {
        E.setFlag('school_wu_confront_done', true);
        E.setFlag('school_wu_three_proofs', true);
        E.setFlag('school_wu_full_confront', true);
        E.addClue('光华小学采购疑点', '吴校长承认陈明远死前追问过校董会采购和仓库租赁异常。');
        E.addClue('傅启元浮出水面', '吴校长承认陆小姐来学校接触的不是陈明远，而是董事会秘书傅启元。');
        E.addClue('苏晚亭主动追查光华小学', '大学日记残页证明苏晚亭不是被动卷入，她为了沈玉芳和陆小姐继续追查。');
        E.addClue('光华小学证据闭环', '203恐吓信、三人合影和苏晚亭日记残页，把陈明远、苏晚亭、陆小姐、傅启元与校董会异常采购连在一起。');
      },
      text: function () {
        return `你把三件东西并在一起。<br><br>203 室的恐吓信，说明陈明远死前已经被人盯上。<br><br>陈老师办公室的三人合影，说明陆小姐和光华小学不是偶然相交。<br><br>大学里找到的日记残页，说明苏晚亭不是被动卷入，而是为了沈玉芳和陆小姐继续追查。<br><br>吴校长吐出的傅启元，则把学校董事会、仓库租赁和法租界那张看不见的网连了起来。<br><br>光华小学不是案子的旁枝。它是陈明远被灭口的地方，也是苏晚亭和沈玉芳走进雾里的入口。`;
      },
      choices: [
        { text: '📖 如果还没看完陈明远的信，先回办公室补上', when: () => !E.getFlag('read_letter'), goto: 'ch3_school_office' },
        { text: '🔙 离开光华小学，回去整理所有线索', goto: 'ch3_wrapup' }
      ]
    };

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__guanghuaWrapupGatePatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        let opts = typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
        opts = Array.isArray(opts) ? opts.slice() : [];
        if (schoolConfrontNeeded()) {
          const hasReturn = opts.some(c => choiceTarget(c, state) === 'ch3_school_confront_wu');
          if (!hasReturn) opts.unshift({ text: '🏫 光华小学这条线还没收住——回去问吴校长', goto: 'ch3_school_confront_wu' });
          opts = opts.filter(c => choiceTarget(c, state) !== 'end_conspiracy_detail');
        }
        if (!E.getFlag('school_wu_three_proofs')) {
          opts = opts.filter(c => choiceTarget(c, state) !== 'end_conspiracy_detail');
        }
        return opts;
      };
      nodes.ch3_wrapup.__guanghuaWrapupGatePatched = true;
    }

    if (typeof E.v07InvestigationQuality === 'function' && !E.__guanghuaQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const q = oldQuality();
        if (this.getFlag('presented_threat_to_wu')) {
          q.score += 1;
          q.reasons.push('你用恐吓信逼吴校长承认陈明远追过校董会采购和仓库租赁');
        }
        if (this.getFlag('presented_photo_to_wu')) {
          q.score += 1;
          q.reasons.push('你用三人合影逼吴校长说出傅启元与陆小姐的学校接触');
        }
        if (this.getFlag('presented_university_to_wu')) {
          q.score += 1;
          q.reasons.push('你用大学日记残页逼吴校长承认苏晚亭主动追查光华小学');
        }
        if (this.getFlag('school_wu_three_proofs')) {
          q.score += 1;
          q.reasons.push('校长质询三件证物完成，光华小学线形成闭环');
        }
        return q;
      };
      E.__guanghuaQualityPatched = true;
    }

    if (typeof E.v07ResolveEnding === 'function' && !E.__guanghuaHiddenEndingGatePatched) {
      const oldResolveEnding = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        const resolved = oldResolveEnding();
        if (resolved !== 'end_conspiracy_detail') return resolved;
        if (this.getFlag('school_wu_three_proofs')) return resolved;
        const quality = this.v07InvestigationQuality();
        if (this.getFlag('rescued_su') || this.getFlag('v07_witnesses_protected')) return 'end_rescue';
        if (quality.score >= 6) return 'end_conspiracy';
        return 'end_archive';
      };
      E.__guanghuaHiddenEndingGatePatched = true;
    }

    E.__guanghuaSchoolFlowPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaSchoolFlowPolish);
})();
