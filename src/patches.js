// ===== 剧情补丁集中加载 =====
// 约定：稳定模块和运行时补丁按依赖顺序登记在这里，index.html 只加载本文件。
// 后续逐步回填到 story.js 时，从这里移除对应模块即可。

(function loadStoryPatches() {
  const patches = [
    'src/story-consistency.js',
    'src/story-evidence.js',
    'src/story-evidence-polish.js',
    'src/v0.7-narrative-depth.js'
  ];

  window.MLT_PATCH_SCRIPTS = patches.slice();

  for (const src of patches) {
    document.write(`<script src="${src}"><\/script>`);
  }
})();
