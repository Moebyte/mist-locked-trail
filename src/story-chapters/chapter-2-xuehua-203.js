// ===== 章节剧情：第二章薛华立路 203 室 =====
// Phase 4f: 迁移 203 室固定搜查链。
// 约束：不迁移带 onPresent 的 ch2_building_enter 入口。

(function installChapter2Xuehua203() {
  function applyChapter2Xuehua203() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_ask_landlord: {
        title: '看门老头的证词',
        text: () => `老头姓李，是这栋楼的看门人。

你问他 203 的陆姓女子长什么样。

<span class="sys">"三十岁左右，瘦高个，长头发，长得还挺标致。穿得也讲究——经常穿旗袍。不过她那眼神……不太对劲，像是心里有事。"</span>

<span class="sys">"她干什么的？"</span>

<span class="sys">"说是做翻译的——在家里接活，法文翻中文。不过我看她那进出的时间，不太像正经干翻译的。有时候半夜才回来，有时候连着几天不见人。"</span>

<span class="sys">"那个来找她的女孩子呢？"</span>

<span class="sys">"就那一次。她敲了门，陆小姐开了门，让她进去了。大约过了一个时辰，那女孩子出来了——眼眶红红的，像是哭过。然后一个多星期后，你就来了。"</span>`,
        effect: (s) => { E.addClue('看门人证词', '陆姓女子行踪可疑；苏晚亭见了她后哭着离开'); E.setFlag('asked_landlord', true); },
        choices: [
          { text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' },
        ],
      },

      ch2_landlord_map: {
        title: '向老头出示地图',
        weather: 4,
        effect: () => {
          E.addClue('福生仓标识', '法租界地图上，福生仓用地块被额外标注了记号，老头认出那是公董局常用的标记。');
        },
        text: () => `你从怀里掏出那张法租界地图，在柜台上摊开。<br><br>老头戴上老花镜凑过来看了一眼，忽然指着地图上的一个位置：<br><br><span class="sys">"这个——福生仓。前两个月有人来打听过这个仓库。"</span><br><br>他抬眼看了你一下，压低声音：<br><br><span class="sys">"来打听的是个穿西装的，拿公事包。我看他那派头像是公董局的人。他问这个仓库归谁管。我当时告诉他，这仓库是光华小学的校产——名义上是学校仓库，实际上从来没放过学校的教具。"</span><br><br>老头摘下眼镜，擦了擦：<br><br><span class="sys">"那之后没几天，就有人封了仓库。说是消防不达标。但你我都知道，上海哪有什么消防查得这么勤的。"</span><br><br>你把地图收好。福生仓——这个名字又出现了。光华小学的校产仓库，公董局的人来找过，然后被封了。这不是巧合。`,
        choices: [
          { text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' },
        ],
      },

      ch2_203_door: {
        title: '203 室',
        text: () => `你上了二楼。走廊昏暗，灯泡坏了没人换，只有尽头窗户透进来一点光。

你敲了敲 203 的门。

没有人应。

你又敲了三下。

门开了一条缝——没有上锁。

你推开门。房间里很暗，窗帘拉得严严实实。你摸到墙上的灯绳拉了一下，昏黄的灯光亮起。

房间里没有人。

但东西都在——床上被子没叠，桌上有一杯喝了一半的凉茶，一本摊开的法文书。像是住在这里的人临时出去了。

你的目光落在书桌上——一本摊开的笔记本，上面写满了法文笔记。但在笔记的边缘，有几个中文铅笔字：

<span class="sys">"光华——不可说——陈——对不起"</span>

你的心跳加速了。光华—陈—对不起。光华小学的陈老师。`,
        effect: (s) => { E.addClue('陆小姐的笔记', '"光华——不可说——陈——对不起"'); E.setFlag('searched_203', true); E.addContact('陆小姐（在逃）'); E.discoverRelation('陆小姐'); },
        choices: [
          { text: '📖 仔细搜查房间', goto: 'ch2_203_search' },
          { text: '📚 去光华小学——必须查陈老师的事', goto: 'ch3_school' },
        ],
      },

      ch2_203_search: {
        title: '搜查 203',
        text: () => `你快速但仔细地搜查了房间。

在枕头底下，你找到了一张照片——是三个人的合影：两个年轻女人和一个男人。背景是一所学校的大门，你能看到校牌上写着"光华小学"。

其中一个女人你认出来了——就是苏晚亭。另一个应该就是陆小姐。而那个男人……三十多岁，戴眼镜，文质彬彬。

照片背面写着：<span class="sys">"陈老师 · 晚亭 · 我 · 民国三十六年春"</span>

在抽屉里，你还找到了一封信，没有封口。信纸只有一行字：

<span class="sys">"我知道那晚你看到了什么。如果你不说，他们下一个就是你。——一个知情者"</span>

这封信没有署名，没有日期。

你把照片和信收好。这个房间里发生过什么，正在逐渐清晰。但也越来越不祥。`,
        effect: (s) => { E.addClue('三人合影', '苏晚亭、陆小姐、陈老师的合影'); E.addClue('恐吓信', '"如果你不说，他们下一个就是你"'); E.addItem('三人合影', '苏晚亭、陆小姐、陈老师在光华小学门前的合影。'); E.addItem('恐吓信', '没有署名的信：如果你不说，他们下一个就是你。'); s.chapter = 3; },
        choices: [
          { text: '🕵️ 在楼外转转——看看进出的人', goto: 'ch2_building_stakeout' },
          { text: '📚 去光华小学——照片背景上的学校', goto: 'ch3_school' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_XUEHUA_203_READY = true;
      window.MLT_STORY_CHAPTER_2_XUEHUA_203_NODES = [
        'ch2_ask_landlord',
        'ch2_landlord_map',
        'ch2_203_door',
        'ch2_203_search',
      ];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2Xuehua203);
})();
