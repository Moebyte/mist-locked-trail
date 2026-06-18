// ===== 章节剧情：第一章开场 =====
// Phase 4 scaffold only.
// 当前不迁移任何剧情节点，只建立第一章开场章节文件入口。

(function installChapter1Opening() {
  function applyChapter1Opening() {
    if (typeof nodes === 'undefined') return;

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_1_OPENING_READY = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter1Opening);
})();
