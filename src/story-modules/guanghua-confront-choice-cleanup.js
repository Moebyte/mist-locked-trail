// ===== 光华校长质询选项清理 =====
// 目标：校长办公室不混排“当前质询”和“缺证导航”，并移除重复的通用出示入口。

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

    function missingEvidenceChoices() {
      const opts = [];
      if (!hasThreatProof()) opts.push({ text: '🏛️ 还差203室的恐吓信——先去薛华立路', goto: 'ch2_frenchtown' });
      if (!hasPhotoProof()) opts.push({ text: '📖 还差三人合影——先去陈老师办公室', goto: 'ch3_school_office' });
      if (!hasUniversityProof()) opts.push({ text: '📚 还差苏晚亭留下的文字——先回圣约翰大学', goto: 'ch2_university' });
      opts.push({ text: '🔙 暂时退回校长办公室，重新整理问法', goto: 'ch3_school' });
      return opts;
    }

    function cleanConfrontChoices() {
      const available = availableEvidenceChoices();
      if (available.length) return available;
      if (allThreePresented()) return [{ text: '🧩 把三件证物合到一起', goto: 'ch3_school_after_confront' }];
      return missingEvidenceChoices();
    }

    function cleanConfrontText() {
      const available = availableEvidenceChoices();
      if (available.length) {
        const lines = [];
        if (hasThreatProof() && !E.getFlag('presented_threat_to_wu')) lines.push('203 室的恐吓信还没有摆出来。');
        if (hasPhotoProof() && !E.getFlag('presented_photo_to_wu')) lines.push('陈老师办公室的三人合影还压在你手里。');
        if (hasUniversityProof() && !E.getFlag('presented_university_to_wu')) lines.push('大学里找到的日记残页还没有让他看见。');
        return `你把办公室门从里面带上。<br><br>吴校长坐在桌后，手指搭着眼镜腿，没有再说“巡捕房已经结案”。<br><br>${lines.join('<br>')}<br><br>现在不要急着跳到下一处调查。先把手里已经有的东西，一件一件放到他面前。`;
      }
      if (allThreePresented()) {
        return `三件证物都已经摆过。<br><br>吴校长的脸色比刚才灰了许多。他没有再替学校辩解，只是看着桌面上那些东西，像终于承认这间办公室也在雾里。<br><br>现在可以把它们合在一起了。`;
      }
      const missing = [];
      if (!hasThreatProof()) missing.push('203 室的恐吓信');
      if (!hasPhotoProof()) missing.push('陈老师办公室的三人合影');
      if (!hasUniversityProof()) missing.push('大学里苏晚亭留下的文字');
      return `你已经把手头能问的都问完了。<br><br>但这场质询还差最后的硬东西：${missing.join('、')}。<br><br>缺证的时候继续压问，只会让吴校长重新缩回壳里。你得先把缺的证物补齐。`;
    }

    if (nodes.ch3_school_confront_wu) {
      delete nodes.ch3_school_confront_wu.onPresent;
      nodes.ch3_school_confront_wu.text = cleanConfrontText;
      nodes.ch3_school_confront_wu.choices = cleanConfrontChoices;
      nodes.ch3_school_confront_wu.presentFilter = () => false;
    }

    ['ch3_wu_present_threat', 'ch3_wu_present_photo', 'ch3_wu_present_university'].forEach(id => {
      if (nodes[id]) nodes[id].choices = cleanConfrontChoices;
    });

    E.__guanghuaConfrontChoiceCleanupPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaConfrontChoiceCleanup);
})();
