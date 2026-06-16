// ===== 剧情补丁集中加载 =====
// 约定：所有运行时补丁按版本顺序登记在这里，index.html 只加载本文件。
// 后续逐步回填到 story.js 时，从这里移除对应补丁即可。

(function loadStoryPatches() {
  const patches = [
    'src/v0.6.1-fixes.js',
    'src/v0.6.2-evidence.js',
    'src/v0.6.3-evidence-polish.js',
    'src/v0.7-narrative-depth.js'
  ];

  window.MLT_PATCH_SCRIPTS = patches.slice();

  for (const src of patches) {
    document.write(`<script src="${src}"><\/script>`);
  }
})();
