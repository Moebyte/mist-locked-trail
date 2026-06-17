// ===== 故事模块入口 =====
// 约定：稳定故事模块按依赖顺序登记在这里，index.html 只加载本文件。
// 这里是正式模块清单，不再使用版本补丁语义。

(function loadStoryModules() {
  const modules = [
    'src/story-modules/runtime-contract.js',
    'src/story-modules/consistency.js',
    'src/story-modules/evidence.js',
    'src/story-modules/evidence-polish.js',
    'src/story-modules/narrative-depth.js',
    'src/story-modules/causal-echo.js',
    'src/story-modules/ui-responsive.js',
    'src/story-modules/region-gates.js',
    'src/story-modules/fusheng-choice-polish.js',
    'src/story-modules/route-prereq-gates.js',
    'src/story-modules/xuehua-choice-polish.js',
    'src/story-modules/xuehua-source-gate.js',
    'src/story-modules/wang-note-prereq.js',
    'src/story-modules/investigation-guidance.js',
    'src/story-modules/home-route-polish.js',
    'src/story-modules/su-home-trust-gate.js',
    'src/story-modules/status-polish.js'
  ];

  window.MLT_STORY_MODULES = modules.slice();

  for (const src of modules) {
    document.write(`<script src="${src}"><\/script>`);
  }
})();
