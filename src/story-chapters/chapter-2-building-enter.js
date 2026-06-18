// ===== 章节剧情：第二章永兴贸易商行入口 =====
// Phase 4h: 迁移带 onPresent 的 ch2_building_enter。

(function installChapter2BuildingEnter() {
  function applyChapter2BuildingEnter() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_building_enter: {
        title: '永兴贸易商行',
        onPresent: (item, s) => {
          if (item.name === '法租界地图' && !E.getFlag('shown_map_to_landlord')) {
            E.setFlag('shown_map_to_landlord', true);
            return { goto: 'ch2_landlord_map' };
          }
          return null;
        },
        text: () => `你推门走进商行。里面空荡荡的，只有一个老头趴在柜台后面打瞌睡。

你敲了敲柜台。老头抬起头，迷糊地看了你一眼。

<span class="sys">"买东西？"</span>

<span class="sys">"不买东西。我想打听一个人——一个年轻女孩子，大概一个多星期前来过这里。你见过吗？"</span>

老头眯着眼打量你。<span class="sys">"你是巡捕房的？"</span>

<span class="sys">"私家侦探。"</span>

老头哼了一声。<span class="sys">"侦探……告诉你吧，我这里不是什么贸易商行。这栋楼是出租的——二楼三楼住人，一楼这个铺面是空的，挂个牌子掩人耳目。你说的女孩子……前几天确实来过。她上了二楼，敲了 203 的门。"</span>

<span class="sys">"203 住着谁？"</span>

<span class="sys">"一个姓陆的女人。住在这里大概半年了，行踪不定，经常好几天不回来。"</span>`,
        effect: (s) => { E.addClue('203 室的陆姓女子', '苏晚亭曾来找过她'); E.setFlag('entered_building', true); },
        choices: [
          { text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' },
          { text: '🔍 先问老头更多关于陆姓女子的事', goto: 'ch2_ask_landlord' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_BUILDING_ENTER_READY = true;
      window.MLT_STORY_CHAPTER_2_BUILDING_ENTER_NODES = ['ch2_building_enter'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2BuildingEnter);
})();
