// ===== 故事章节加载清单 =====
(function loadStoryChapters() {
  const chapters = [
  'src/story/ch1-opening.js',
  'src/story/endings.js',
  'src/story/ch2-investigation.js',
  'src/story/ch3-school.js',
  'src/story/ch4-dock.js',
  'src/story/deductions.js',
  'src/story/engine-patches.js'
];
  for (const src of chapters) {
    document.write(`<script src="${src}"><\/script>`);
  }
})();
