// ===== 章节剧情入口 =====
// Phase 2 scaffold only.
// 当前不迁移任何剧情节点，只建立未来章节模块的统一入口。

(function installStoryChaptersIndex() {
  function applyStoryChaptersIndex() {
    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTERS_READY = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyStoryChaptersIndex);
})();
