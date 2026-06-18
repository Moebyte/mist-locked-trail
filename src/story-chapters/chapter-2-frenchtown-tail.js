// ===== 章节剧情：第二章薛华立路尾随支线 =====
// Phase 4e: 迁移薛华立路观察、尾随、茶楼与沈玉兰固定支线节点。
// 约束：不迁移 ch2_frenchtown 入口，不迁移 203 室搜查链。

(function installChapter2FrenchtownTail() {
  function applyChapter2FrenchtownTail() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_building_stakeout: {
        title: '街对面的观察',
        text: () => `你在街对面的香烟摊买了一包烟，假装点烟，观察那栋楼。秋风从黄浦江方向吹过来，带着水腥气和煤烟味。法租界的梧桐树在路灯下投下斑驳的影子，行人不多，偶尔有黄包车拉着客人经过，车铃在夜色中响得清脆。

站了大约二十分钟，腿都快麻了，你终于看到一个人从楼里出来——一个中年男人，穿黑大褂，戴宽檐帽，帽沿压得很低。他走出门后左右看了看，动作很有分寸，不是普通人那种随意的一瞥，而是训练过的快速扫视。然后他快步往街北走去。

你注意到他的左手——食指上有一枚绿色的玉扳指。在路灯下一闪而过，但那个绿色你不会认错。

就是来找苏晚亭的那个男人。

你扔掉只抽了一口的烟，快步跟上他。`,
        effect: (s) => { E.setFlag('saw_man', true); E.addClue('跟踪黑衣男人', '他从薛华立路22号出来，往北走'); },
        choices: [
          { text: '🕵️ 跟踪他', goto: 'ch2_tail' },
          { text: '🚶 不跟了，先进楼里看看', goto: 'ch2_building_enter' },
        ],
      },

      ch2_tail: {
        title: '尾随',
        text: () => `你跟在黑衣男人后面，保持二十步的距离。暮色已浓，法租界的路灯次第亮起来，把梧桐影打成一片碎金。

他走得不快，但很警觉——过了两个路口就回了一次头。你镇定地展开报纸，假装在看社会版。他目光扫过你，没有停留。

他的步伐带着一种公事公办的节奏，不像在闲逛，像在赴约。拐过薛华立路的尽头，他穿过一条窄巷，巷子两边是卖旧衣服和小五金的铺子，已经打了烊。你的脚步在窄巷里回响，你放慢了步伐，怕被听见。

他在一家叫"鸿运茶楼"的门口停下来，回头又看了看——这一次看得更仔细。你侧身站进一家关了门的裁缝铺的屋檐下。他推门进去了。

你等了几秒钟，透过茶楼的玻璃窗往里看。茶楼不大，里面人不多，吊扇在头顶慢悠悠地转。他坐在靠窗的位子，摘了帽子放在桌上，向伙计要了一壶茶。他的表情很平淡，像是在等一个再平常不过的约会。

你要不要也进去坐下？`,
        choices: [
          { text: '☕ 找个角落坐下，监视他', effect: (s) => { E.setFlag('tailing', true); E.addClue('鸿运茶楼', '黑衣男人在等人'); }, goto: 'ch2_tea_monitor' },
          { text: '🔙 算了，先回去搜 22 号楼', goto: 'ch2_building_enter' },
        ],
      },

      ch2_tea_monitor: {
        title: '鸿运茶楼',
        text: () => `你找了个角落的位置坐下，要了一壶龙井。

大约过了一刻钟，一个女人走进了茶楼。她穿着素色旗袍，戴一顶纱帽，看不清脸，但从身形和步伐来看，年纪不大。

她径直走向黑衣男人的桌子，坐下了。

两人低声交谈了几句——你听不清内容，但你看到那个女人从手袋里拿出一个信封，推到黑衣男人面前。黑衣男人打开看了看，点了点头，收进怀里。

伙计过来添水，冲黑衣男人点了下头：<span class="sys">"赵先生，今天还是龙井？"</span>黑衣男人嗯了一声，没抬头。

然后他站起来，走了。

女人独自坐在窗边，望着雨后的街道发呆。`,
        effect: (s) => { E.addClue('神秘女子', '在茶楼给黑衣男人一个信封，像是交易'); E.addClue('黑衣男人姓赵', '茶楼伙计叫他"赵先生"——常年在此会客的常客'); E.setFlag('saw_woman', true); E.setFlag('knows_zhao', true); },
        choices: [
          { text: '👩 走向那个女人', effect: (s) => { E.setFlag('approach_woman', true); }, goto: 'ch2_talk_woman' },
          { text: '🏛️ 回薛华立路 22 号搜查', goto: 'ch2_building_enter' },
        ],
      },

      ch2_talk_woman: {
        title: '与神秘女子的对话',
        text: () => `你走到她桌前。

<span class="sys">"这位女士，冒昧打扰一下——刚才那位先生，您认识吗？"</span>

她抬起头。你看到她的脸——三十岁左右，容貌端庄，但眉宇间有一种疲惫和警觉。

<span class="sys">"你是谁？"</span>她的声音很冷。

你出示了你的证件（你是私家侦探）。

她沉默了一会儿，然后叹了口气。<span class="sys">"我叫沈玉兰。刚才那个人……我也不知道他叫什么，他只说自己姓赵。他是替我办事的——帮我查一个人。"</span>

<span class="sys">"查谁？"</span>

<span class="sys">"我妹妹。她失踪了。两个月前，不见了。"</span>

你心里一震。`,
        effect: (s) => { E.addContact('沈玉兰'); E.discoverRelation('沈玉兰'); E.addClue('沈玉兰的妹妹', '也失踪了，两个月前；她雇了赵姓男子调查'); E.setFlag('talked_to_woman', true); },
        choices: [
          { text: '💬 详细问她妹妹的事', goto: 'ch2_woman_detail' },
          { text: '🏛️ 留个联系方式，先回去搜 22 号', goto: 'ch2_building_enter' },
        ],
      },

      ch2_woman_detail: {
        title: '另一桩失踪案',
        text: () => `沈玉兰告诉你，她妹妹叫<b>沈玉芳</b>，今年二十五岁，在光华小学当老师。

两个月前，沈玉芳失踪了。跟苏晚亭一样——某天出门后，再也没有回来。

<span class="sys">"巡捕房不立案，说她一个成年女子，可能自己走了。但我妹妹不是那样的人。她喜欢她的工作，她喜欢那些孩子。她不会不告而别。"</span>

沈玉兰的眼泪在眼眶里打转。

你问她为什么要找那个赵姓男人。

<span class="sys">"他说他以前在巡捕房干过，认识人。我付了他一百块，让他帮我查。但他每次都说'有进展、有进展'，可什么都没查到。"</span>

你给她看了苏晚亭的照片。

她盯着照片看了很久，摇了摇头。<span class="sys">"不认识。但……"</span>她犹豫了一下，<span class="sys">"她们失踪的方式，好像。"</span>`,
        effect: (s) => { E.addClue('沈玉芳', '光华小学教师，两个月前失踪'); E.setFlag('sister_case', true); s.chapter = 2; },
        choices: [
          { text: '🏛️ 去薛华立路 22 号——这个地址两案都有', goto: 'ch2_building_enter' },
          { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_TAIL_READY = true;
      window.MLT_STORY_CHAPTER_2_FRENCHTOWN_TAIL_NODES = [
        'ch2_building_stakeout',
        'ch2_tail',
        'ch2_tea_monitor',
        'ch2_talk_woman',
        'ch2_woman_detail',
      ];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2FrenchtownTail);
})();
