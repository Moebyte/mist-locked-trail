// ===== 故事模块入口 =====
// 约定：稳定故事模块按依赖顺序登记在这里，index.html 只加载本文件。
// 这里是正式模块清单，不再使用版本补丁语义。

(function loadStoryModules() {
  const modules = [
    'src/story-consistency.js',
    'src/story-evidence.js',
    'src/story-evidence-polish.js',
    'src/story-narrative-depth.js'
  ];

  window.MLT_STORY_MODULES = modules.slice();

  for (const src of modules) {
    document.write(`<script src="${src}"><\/script>`);
  }
})();
