// ===== 光华校长质询选项清理 =====
// 目标：校长办公室只做一次性现场对质，不承担缺证导航；缺证就是惩罚，不能回头补问。

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
      return [{ text: '🔚 收起材料，结束这次质询', goto: 'ch3_school_confront_incomplete' }];
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
      return `你把该问的都问完了。<br><br>吴校长重新抿紧嘴唇，视线从桌面挪回你脸上。你知道，再空口逼问下去，只会让他退回“巡捕房已经结案”的那套说辞。<br><br>这次质询到此为止。没有摆上桌的证物，已经错过了它该出现的时机。`;
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
        const asked = [];
        if (E.getFlag('presented_threat_to_wu')) asked.push('恐吓信');
        if (E.getFlag('presented_photo_to_wu')) asked.push('三人合影');
        if (E.getFlag('presented_university_to_wu')) asked.push('日记残页');
        const askedText = asked.length ? `你已经摆上桌的是：${asked.join('、')}。` : '你没有拿出足够硬的证物。';
        return `${askedText}<br><br>吴校长没有再往下说。他把眼镜重新戴好，声音恢复到一开始那种谨慎的平稳。<br><br><span class="sys">“沈先生，我能说的都说了。学校还有课，我不便久留。”</span><br><br>门外传来上课铃声。你知道，这扇门并不是不能再敲，而是这场对质的气已经散了。缺掉的那一块，只能留在案卷里。`;
      },
      choices: [
        { text: '🔙 离开光华小学，回去整理线索', goto: 'ch3_wrapup' }
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
          const hasSchoolDoneNote = opts.some(c => (c.text || '').includes('光华小学质询已经结束'));
          if (!hasSchoolDoneNote) opts.unshift({ text: '🏫 光华小学质询已经结束，继续整理其他线索', goto: 'ch3_wrapup' });
        }
        return opts;
      };
      nodes.ch3_wrapup.__guanghuaClosedOncePatched = true;
    }

    E.__guanghuaConfrontChoiceCleanupPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaConfrontChoiceCleanup);
})();
