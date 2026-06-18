// ===== 光华校长质询选项清理 =====
// 目标：校长办公室只做一次性现场对质，不承担缺证导航；缺证时进入叙事化表层结案，而不是开发者式缺证提示。

(function installGuanghuaConfrontChoiceCleanup() {
  function applyGuanghuaConfrontChoiceCleanup() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__guanghuaConfrontChoiceCleanupPatched) return;

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

    function allThreePresented() {
      return E.getFlag('presented_threat_to_wu') && E.getFlag('presented_photo_to_wu') && E.getFlag('presented_university_to_wu');
    }

    function schoolQuestioningDone() {
      return E.getFlag('chen_su_link') && E.hasClue('陈老师与女子争吵') && E.getFlag('got_chen_evidence');
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

    function incompleteReasonText() {
      const phrases = [];
      if (!hasThreatProof()) phrases.push('陈明远死前究竟被谁逼到墙角，还没有人愿意承认');
      if (!hasPhotoProof()) phrases.push('陆小姐为什么能自由出入学校，仍能被说成偶然来访');
      if (!hasUniversityProof()) phrases.push('苏晚亭到底是主动追查，还是只被一段私情拖进来，仍没有旁证替她说话');
      return phrases.length ? phrases.join('；') + '。' : '这几条线还没有在吴校长面前真正合拢。';
    }

    function incompleteClosureText() {
      return `你把该问的都问完了。<br><br>吴校长重新抿紧嘴唇，视线从桌面挪回你脸上。你知道，再空口逼问下去，只会让他退回“巡捕房已经结案”的那套说辞。<br><br><div class="notice"><b>话还没有压到底</b><br>${incompleteReasonText()}<br>现在的材料足够让吴校长改口，却还不足以逼他把学校背后的那层关系放到桌面上。你可以继续追问，也可以接受这个更容易被写进案卷的说法。</div>`;
    }

    function availableEvidenceChoices() {
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
      return opts;
    }

    function cleanConfrontChoices() {
      const available = availableEvidenceChoices();
      if (available.length) return available;
      if (allThreePresented()) return [{ text: '🧩 把三件证物合到一起', goto: 'ch3_school_after_confront' }];
      return [{ text: '📁 接受这个较容易成立的说法', goto: 'ch3_school_incomplete_closure' }];
    }

    function cleanConfrontText() {
      const available = availableEvidenceChoices();
      if (available.length) {
        const lines = [];
        if (hasThreatProof() && !E.getFlag('presented_threat_to_wu')) lines.push('203 室的恐吓信还没有摆出来。');
        if (hasPhotoProof() && !E.getFlag('presented_photo_to_wu')) lines.push('陈老师办公室的三人合影还压在你手里。');
        if (hasUniversityProof() && !E.getFlag('presented_university_to_wu')) lines.push('大学里找到的日记残页还没有让他看见。');
        return `你把办公室门从里面带上。<br><br>吴校长坐在桌后，手指搭着眼镜腿，没有再说“巡捕房已经结案”。<br><br>${lines.join('<br>')}<br><br>这是一次当面对质。你只能用手里已经握住的东西撬开他的口。`;
      }
      if (allThreePresented()) {
        return `三件证物都已经摆过。<br><br>吴校长的脸色比刚才灰了许多。他没有再替学校辩解，只是看着桌面上那些东西，像终于承认这间办公室也在雾里。<br><br>现在可以把它们合在一起了。`;
      }
      return incompleteClosureText();
    }

    if (nodes.ch3_school_teacher) {
      delete nodes.ch3_school_teacher.onPresent;
      nodes.ch3_school_teacher.presentFilter = () => false;
      nodes.ch3_school_teacher.choices = function () {
        const opts = [];
        if (!E.getFlag('chen_su_link')) opts.push({ text: '💬 问陈老师跟苏晚亭的关系', goto: 'ch3_school_chen_su' });
        if (!E.hasClue('陈老师与女子争吵')) opts.push({ text: '💬 问学校最近有没有异常', goto: 'ch3_school_weird' });
        if (!E.getFlag('got_chen_evidence')) opts.push({ text: '📖 要求看陈老师的办公室', goto: 'ch3_school_office' });
        if (schoolQuestioningDone() && !E.getFlag('school_wu_confront_done') && !E.getFlag('school_wu_confront_closed')) {
          opts.push({ text: '🧾 普通问询到此为止，进入正式质询', goto: 'ch3_school_confront_wu' });
        }
        opts.push({ text: '🔙 暂时结束这个话题', goto: 'ch3_school' });
        return opts;
      };
    }

    if (nodes.ch3_school_weird) {
      const oldWeirdEffect = nodes.ch3_school_weird.effect;
      nodes.ch3_school_weird.text = function () {
        let tail;
        if (E.getFlag('sister_case') || E.hasClue('沈玉芳')) {
          tail = '沈玉芳——沈玉兰的妹妹。她也失踪了。';
        } else if (E.getFlag('talked_to_woman') || E.hasClue('沈玉兰的妹妹')) {
          tail = '沈玉兰说过，她妹妹也失踪了。现在，你第一次从吴校长口中听到这个名字：沈玉芳。';
        } else {
          tail = '沈玉芳。一个此前没有出现在你案卷里的名字。她也失踪了。';
        }
        return `你问吴校长，最近学校有没有什么不寻常的事。

他犹豫了一下。

<span class="sys">"有两件事……我不知道有没有关系。"</span>

<span class="sys">"第一件。陈老师出事前三天，有人看到他在操场上跟一个人在吵架。天已经黑了，看不清是谁，但听声音是个女人。"</span>

<span class="sys">"第二件。沈玉芳老师——她在陈老师出事前一个星期就不来上课了。请了病假，但一直没回来。我派人去她家看过，门锁着，没有人。她是教数学的，一直很负责……突然不来，不太正常。"</span>

${tail}`;
      };
      nodes.ch3_school_weird.effect = function (state) {
        if (typeof oldWeirdEffect === 'function') oldWeirdEffect(state);
        E.addContact('沈玉芳');
        E.addClue('沈玉芳请假失踪', '光华小学数学老师，陈明远出事前一周请病假，此后一直没有回来。');
      };
    }

    if (nodes.ch3_school_after_confront) {
      nodes.ch3_school_after_confront.choices = function () {
        const opts = [];
        if (!E.getFlag('read_letter')) opts.push({ text: '📖 回办公室看完陈明远留下的信', goto: 'ch3_school_office' });
        opts.push({ text: '🔙 离开光华小学，回去整理所有线索', goto: 'ch3_wrapup' });
        return opts;
      };
    }

    nodes.ch3_school_confront_incomplete = {
      title: '光华小学 · 质询中止',
      weather: 2,
      effect: function () {
        E.setFlag('school_wu_confront_done', true);
        E.setFlag('school_wu_confront_closed', true);
        E.setFlag('school_wu_incomplete_confront', true);
      },
      text: function () {
        return `${incompleteClosureText()}<br><br>门外传来上课铃声。你知道，这扇门并不是不能再敲，而是这场对质的气已经散了。缺掉的那一块，只能留在案卷里。`;
      },
      choices: [
        { text: '📁 接受这个较容易成立的说法', goto: 'ch3_school_incomplete_closure' }
      ]
    };

    if (nodes.ch3_school_confront_wu) {
      delete nodes.ch3_school_confront_wu.onPresent;
      nodes.ch3_school_confront_wu.text = cleanConfrontText;
      nodes.ch3_school_confront_wu.choices = cleanConfrontChoices;
      nodes.ch3_school_confront_wu.presentFilter = () => false;
    }

    ['ch3_wu_present_threat', 'ch3_wu_present_photo', 'ch3_wu_present_university'].forEach(id => {
      if (nodes[id]) nodes[id].choices = cleanConfrontChoices;
    });

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__guanghuaClosedOncePatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        let opts = typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
        opts = Array.isArray(opts) ? opts.slice() : [];
        if (E.getFlag('school_wu_confront_closed') && !E.getFlag('school_wu_three_proofs')) {
          opts = opts.filter(c => choiceTarget(c, state) !== 'ch3_school_confront_wu' && choiceTarget(c, state) !== 'end_conspiracy_detail');
        }
        return opts;
      };
      nodes.ch3_wrapup.__guanghuaClosedOncePatched = true;
    }

    E.__guanghuaConfrontChoiceCleanupPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaConfrontChoiceCleanup);
})();
