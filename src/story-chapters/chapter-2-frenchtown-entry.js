// ===== 章节剧情：第二章薛华立路入口 =====
// Phase 4g: 迁移薛华立路 22 号固定入口节点。

(function installChapter2FrenchtownEntry() {
  function applyChapter2FrenchtownEntry() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_frenchtown: {
        title: '薛华立路 22 号',
        time: {d:1, h:19, m:0},
        weather: 4,
        text: () => `薛华立路是法租界的主干道，两旁是高大的法国梧桐。

22 号是一栋灰色的三层小楼，底楼是一家挂着"永兴贸易商行"招牌的店铺，看起来半死不` + `活的。二楼三楼看起来像是民宅。

你站在门口观察了一会儿——没有什么特别的。但苏晚亭专门记下了这个地址，一定有问题。

你感到时间在流逝。每多查一个地方，苏晚亭就多一分危险。

你决定怎么进去？`,
        choices: [
          { text: '🚪 直接推门进去', goto: 'ch2_building_enter' },
          { text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_ENTRY_READY = true;
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_ENTRY_NODES = ['ch2_frenchtown'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2FrenchtownEntry);
})();
