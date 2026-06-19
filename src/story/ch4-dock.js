// ===== 第四章 · 福生仓 / 码头 / 医院 =====
Object.assign(nodes, {
  ch4_pawnshop: {
    title: '永昌当铺',
    text: () => `永昌当铺在城外，门面不大，柜台很高。

你把当票递过去。掌柜的看了看，又看了看你，犹豫了一下，转身去后面拿东西。

他捧出一个红绸布包。打开——里面是一只翡翠镯子，通体碧绿，成色极好。

掌柜的翻了翻账本。<span class="sys">"这镯子是上个月一个姓陈的先生来当的。当了三百大洋，当期三个月。"</span>

你问他是否记得陈先生长什么样。

<span class="sys">"戴眼镜，文质彬彬，像个教书先生。他来的时候魂不守舍的，像是有什么心事。"</span>

你把镯子举到光下看。在镯子的内侧，刻着两个字：

<span class="sys">"陆念"</span>

陆——陆小姐的镯子。陈明远把陆小姐的镯子当了。三百大洋——在这个年代，是一笔巨款。`,
    effect: (s) => { E.addClue('翡翠镯', '刻有"陆念"，陈老师当掉换了三百大洋'); E.addItem('翡翠镯', '永昌当铺取回的翡翠镯，内侧刻着"陆念"。'); E.setFlag('visited_pawn', true); },
    choices: [
      { text: '🏮 回访周怀安——让他看看翡翠镯', goto: 'ch4_revisit_zhou' },
      { text: '🔙 所有的线索都齐了', goto: 'ch4_conclusion' },
    ],
  },
  ch4_revisit_zhou: {
    title: '夜访商务印书馆',
    time: {d:2, h:20, m:0},
    weather: 5,
    onPresent: (item, s) => {
      if (item.name === '翡翠镯' && !E.getFlag('presented_jade_to_zhou')) {
        E.setFlag('presented_jade_to_zhou', true);
        return { goto: 'ch4_zhou_present_jade' };
      }
      return null;
    },
    text: () => `商务印书馆的编辑室还亮着灯。

周怀安坐在一堆校样中间，眼睛里全是血丝。看到你进来，他立刻站起身。

<span class="sys">"沈先生，有晚亭的消息了吗？"</span>

你没有立刻回答。你知道有些东西，比一句"还没有"更有用。

如果你手里有能触动他的物件，现在可以出示。`,
    choices: [
      { text: '🔙 暂时不打扰他，回去整理证据', goto: 'ch4_conclusion' },
    ],
  },
  ch4_zhou_present_jade: {
    title: '举证 · 翡翠镯',
    text: () => `你把翡翠镯放在周怀安面前。

他起初只是茫然地看着。可当他看到内侧刻着的"陆念"两个字时，脸色忽然变了。

<span class="sys">"晚亭提过这个名字。"</span>

他说，苏晚亭失踪前一个月，曾经半开玩笑地问他：如果一个人换了名字，过去犯过的错是不是也能一笔勾销。周怀安当时以为她在说论文里的女性人物，没有追问。

<span class="sys">"她还说过，陆念这个名字很好听，像是把一个人从旧日子里念回来。"</span>

周怀安把镯子推回给你，声音发哑。

<span class="sys">"沈先生，晚亭不是自己走的。她是在替别人守秘密。"</span>`,
    effect: (s) => { E.addClue('周怀安识出陆念', '苏晚亭失踪前曾提过"陆念"这个名字，说明她早已知道陆小姐真名'); E.addClue('苏晚亭守秘', '周怀安判断苏晚亭不是离开，而是在替别人守秘密'); },
    choices: [
      { text: '🔙 回去整理证据', goto: 'ch4_conclusion' },
    ],
  },
  ch4_conclusion: {
    title: '真相的边缘',
    time: {d:2, h:19, m:0},
    weather: 5,
    text: (s) => {
      const strength = E.caseStrength();
      return `你回到自己的事务所，把所有材料铺在桌上。

窗外灯火初上，法租界的霓虹灯在夜雾中晕成一片暧昧的光。

你喝了口凉透的茶。

事情的脉络你已经大致摸清了——陈明远和苏晚亭有不寻常的关系；陈明远卷入了一桩不可告人的事（可能是敲诈或更糟）；陆小姐是知情者；沈玉芳也牵涉其中；有人不想让真相浮出水面。

但关键的问题还没有答案：

<b>苏晚亭在哪？她还活着吗？</b>

你翻开线索簿，给当前案情写下四个字：<b>${strength.name}</b>。

${strength.desc}

你要怎么结这个案？`;
    },
    choices: [
      { text: '✍️ 按证据链自然收束此案', goto: (s) => {
        if (E.getFlag('missed_deadline')) return 'end_too_late';
        let score = 0;
        if (E.getFlag('rescued_yufang')) score += 2;
        if (E.getFlag('rescued_su')) score += 3;
        if (E.getFlag('su_moved_from_dock') || E.getFlag('su_trace_only')) score += 1;
        if (E.getFlag('deduced_fusheng')) score += 2;
        if (E.getFlag('fu_waybill_exposed') || E.getFlag('sun_waybill_convinced')) score += 2;
        if (E.getFlag('fu_clearance_exposed') || E.getFlag('sun_clearance_convinced')) score += 2;
        if (E.getFlag('v07_witnesses_protected')) score += 1;
        if (E.getFlag('v07_lu_confronted')) score += 1;
        if (E.getFlag('v07_rejected_fu_deal')) score += 1;
        if (E.getFlag('zhou_understands_wanting') || E.getFlag('zhou_accepts_chen_link')) score += 1;
        if (score >= 10 && E.getFlag('rescued_yufang') && (E.getFlag('rescued_su') || E.getFlag('su_moved_from_dock'))) return 'end_conspiracy_detail';
        if (E.getFlag('rescued_su') || E.getFlag('v07_witnesses_protected')) return 'end_rescue';
        if (score >= 6) return 'end_conspiracy';
        return 'end_archive';
      } },
      { text: '🔍 推理——指认幕后真凶', goto: 'ch4_accuse' },
      { text: '🕯️ 不急着抓人，先追苏晚亭和沈玉芳的下落', when: (s) => E.getFlag('rescued_yufang') && E.getFlag('deduced_fusheng') && !E.getFlag('missed_deadline'), goto: 'end_conspiracy_detail' },
      { text: '🕯️ 追查被转走的人质', when: (s) => E.getFlag('missed_deadline'), goto: 'end_too_late' },
    ],
  },
  ch4_accuse: {
    title: '指认幕后真凶',
    weather: 5,
    text: () => `你摊开所有材料，在灯下重新梳理了一遍。<br><br>三个人的名字从不同方向浮出来，但他们不可能都是主谋。<br><br>你决定指控谁？`,
    choices: [
      { text: '🔍 陆小姐——她是中间人，是执行者', goto: 'end_boss_lu' },
      { text: '🔍 黑衣男人（赵某）——他是上线，是策划者', goto: 'end_boss_zhao' },
      { text: '🔍 吴校长——他是保护伞，是地头蛇', goto: 'end_boss_wu' },
      { text: '🔙 再想想', goto: 'ch4_conclusion' },
    ],
  },
  ch4_suzhou_creek: {
    title: '苏州河 · 废弃码头',
    time: {d:2, h:21, m:0},
    weather: 2,
    effect: (s) => { E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库'); E.addItem('福生仓地址', '王巡官纸条上写的福生仓就在苏州河边的废弃码头。'); },
    text: () => `夜雾从苏州河上漫过来，混着煤烟和腥味。<br><br>你沿着河岸走了二十分钟，在第三个废弃码头找到了福生仓——一栋锈蚀的铁皮仓库，卷帘门半开着，里面透出昏暗的灯光。<br><br>门口停着一辆空货车，车斗上铺着油布。仓库里有人影晃动，像是在搬东西。<br><br>你想起王巡官纸条上的四个字：<span class="sys">"三日清"</span>。<br><br>这不像长期关押人的地方，更像一处即将被清空的中转站。`,
    choices: [
      { text: '🕵️ 先绕到后门观察换班', goto: 'ch4_dock_watch' },
      { text: '⚠️ 趁雾直接潜入仓库', effect: (s) => { E.addHeat(1, '你选择冒险潜入，码头上的风险升高。'); }, goto: 'ch4_dock_inside' },
      { text: '🚓 等老孙带人来再行动', goto: 'ch4_dock_wait' },
      { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' },
    ],
  },
  ch4_dock_watch: {
    title: '福生仓 · 后门',
    cost: {h:0, m:25, reason:'你在码头后门观察了二十五分钟'},
    weather: 2,
    effect: (s) => { E.setFlag('dock_observed', true); E.addClue('码头换班', '福生仓守夜人每半小时从后门绕仓一圈，东侧窗户有短暂空隙'); },
    text: () => `你没有急着进去，而是绕到仓库背后。<br><br>后墙有一扇高窗，窗框生锈，下面堆着废木箱。守夜人每隔半小时从后门绕仓一圈，手电光会在东侧窗户上停留三秒。<br><br>你还看到货车司机和一个穿西装的人在低声说话。那人没有穿制服，却拿着公董局常用的蓝封公文夹。<br><br>他离开前说了一句：<span class="sys">"今晚之前，箱子和人都不能留。"</span><br><br>你心里一沉。时间不多了。`,
    choices: [
      { text: '🔦 从东侧窗户潜入', goto: 'ch4_dock_inside' },
      { text: '🚓 现在去找老孙支援', goto: 'ch4_dock_wait' },
    ],
  },
  ch4_dock_wait: {
    title: '福生仓 · 等待',
    cost: {h:2, m:15, reason:'你去找老孙调人，耽误了两个多小时'},
    weather: 5,
    effect: (s) => { E.addHeat(2, '等待增援让码头开始清场。'); E.setFlag('missed_deadline', true); E.addClue('福生仓清场', '你带人赶回时，仓库已被清空，只留下拖痕和未燃尽的纸灰'); },
    text: () => `你决定不孤身冒险。你折回巡捕房，找老孙调了两个信得过的人。<br><br>但等你们再赶到苏州河边时，福生仓已经暗了。<br><br>卷帘门敞开着，地上有新鲜车辙，几个木箱被砸开，里面空空如也。仓库深处有一堆还没烧尽的纸灰。<br><br>你在灰里翻出半片蓝封纸角，能看见公董局印章的边缘。<br><br>人被转走了。货也被转走了。<br><br>老孙站在仓库门口，脸色很难看。<span class="sys">"他们比我们快一步。"</span>`,
    choices: [
      { text: '🔙 带着残存证据回去整理', goto: 'ch3_wrapup' },
      { text: '🔍 直接回事务所做最后推断', goto: 'ch4_conclusion' },
    ],
  },
  ch4_dock_inside: {
    title: '福生仓 · 货箱之间',
    weather: 2,
    effect: (s) => { E.addClue('公董局公文纸', '福生仓内的清场指令写在公董局蓝封公文纸上'); E.addItem('清场指令', '福生仓木箱上的信：三日内清走，别留痕迹。信纸带有公董局蓝封纸角。'); },
    text: () => `你贴着墙根潜入仓库。<br><br>木箱上的信封还在——里面是五十大洋和一封信。信上只有一行字：<br><br><span class="sys">"三日内清走。别留痕迹。"</span><br><br>没有署名，但信纸是公董局的蓝封公文纸。<br><br>仓库深处传来一点极轻的声音。像是有人在敲木板。一下，两下，停住。然后又一下。<br><br>如果不是你先在后门观察过，你也许会以为那只是老鼠。`,
    choices: [
      { text: '🔦 搜索仓库深处', goto: 'ch4_dock_deep' },
      { text: '📦 先检查标着光华小学的教具箱', goto: 'ch4_dock_crates' },
    ],
  },
  ch4_dock_crates: {
    title: '福生仓 · 教具箱',
    cost: {h:0, m:15, reason:'你撬开教具箱检查货物'},
    weather: 2,
    effect: (s) => { E.addClue('教具箱走私', '标着光华小学的教具箱里装的是洋酒和香烟，不是教学器材'); E.addItem('光华货运单', '福生仓货箱夹层里的货运单，发货名义是光华小学教学器材。'); },
    text: () => `你撬开一个标着"光华小学·教学器材"的木箱。<br><br>箱盖一开，里面不是粉笔和地球仪，而是整齐码放的洋酒和香烟。箱底夹着一张货运单，收货栏写着"福生仓三号"，发货名义却是"光华小学教学器材补充采购"。<br><br>这不是偶发交易。<br><br>有人把学校当成了一块干净招牌，把脏货从孩子们的课桌底下运过去。`,
    choices: [
      { text: '🔦 继续搜索仓库深处', goto: 'ch4_dock_deep' },
    ],
  },
  ch4_dock_deep: {
    title: '福生仓 · 深处',
    weather: 2,
    effect: (s) => { E.addClue('仓库暗室', '木箱背后有一个暗门，通向一个被改造成囚室的小房间。'); },
    text: () => `你绕过堆叠的木箱向深处走。仓库很大，堆满了标着"光华小学"字样的教具箱——你撬开一个，里面不是教具，是洋酒和香烟。<br><br>再往里走，你听到一个微弱的声音——像是有人在哭。<br><br>你循着声音找到仓库尽头，木箱背后有一扇暗门。推开——<br><br>里面是一间不足十平米的房间。一张行军床，一个水桶，一盏煤油灯。床上蜷缩着一个年轻女人，穿着灰扑扑的旗袍，头发散乱。<br><br>她抬起头，看到你的一瞬间，瞳孔猛地收缩了一下。<br><br><span class="sys">"你……你是谁？"</span>她的声音沙哑。<br><br>你出示了证件。<br><br>她愣了几秒，然后捂住脸，浑身发抖。<br><br><span class="sys">"你是来救我的？"</span>`,
    choices: [
      { text: '💬 你是沈玉芳还是苏晚亭？', goto: 'ch4_dock_who' },
    ],
  },
  ch4_dock_who: {
    title: '暗室 · 身份',
    weather: 2,
    effect: (s) => {
      E.addClue('获救者身份', '被关在福生仓的女人是沈玉芳——沈玉兰的妹妹，光华小学的数学老师。');
      E.discoverRelation('沈玉芳');
      E.setFlag('found_yufang', true);
    },
    text: () => `<span class="sys">"我叫沈玉芳。我是光华小学的老师。"</span><br><br>沈玉芳。沈玉兰的妹妹。她还活着。<br><br>她告诉你，她发现陈老师出事前一周，有一批"教具"在深夜被运进学校。陈老师撞见了，第二天就被威胁不准说出去。他把这件事告诉了她——因为他信任她。<br><br><span class="sys">"他让我别说出去。他说他来处理。但几天后他就死了。"</span><br><br>她还没来得及报警，就被几个穿黑衣服的人从家里带走了。他们把她关在这里，已经快一个月了。<br><br><span class="sys">"他们不杀我，可能是因为他们还不敢。但陈老师……陈老师知道了不该知道的事。"</span><br><br>她低下头。<span class="sys">"他是为我死的。如果不是我把那些事告诉他……"</span><br><br>你想安慰她，但你说不出口。因为你知道——她说得对。`,
    choices: [
      { text: '🔙 带她离开这里', goto: 'ch4_dock_escape' },
    ],
  },
  ch4_dock_escape: {
    title: '逃离码头',
    weather: 2,
    effect: (s) => {
      E.setFlag('rescued_yufang', true);
      E.addClue('沈玉芳证词', '陈老师死前曾向她求助，说发现了学校的走私勾当。她被关在福生仓近一个月。');
    },
    text: () => `你搀着沈玉芳走出暗室。她走得很慢——被关得太久了，腿有些发软。<br><br>你们刚走到仓库门口，外面传来脚步声。<br><br>你示意她别出声，贴着墙等了半分钟。脚步声渐远。是巡夜的更夫。<br><br>你带她穿过夜雾中的码头，叫了一辆黄包车。她缩在车座上，裹着你脱下来的大衣。<br><br><span class="sys">"你打算怎么办？"</span>她问你。<br><br><span class="sys">"把这件事查到底。"</span><br><br>她看着你，点了点头。<br><br>黄包车的铃铛在深夜的街道上叮当作响。苏州河的雾在身后慢慢合拢，像什么也没发生过。`,
    choices: [
      { text: '🔙 回事务所整理所有证据', goto: 'ch3_wrapup' },
    ],
  },
});
  nodes.ch4_dock_watch = {
    title: '福生仓 · 后门',
    cost: { h: 0, m: 25, reason: '你在码头后门观察了二十五分钟' },
    weather: 2,
    effect: () => {
      E.setFlag('dock_observed', true);
      E.addClue('码头换班', '福生仓守夜人每半小时从后门绕仓一圈，东侧窗户有短暂空隙');
      E.addClue('傅启元现身码头', '傅启元拿着蓝封公文夹出现在福生仓，要求今晚之前清走箱子和人');
      E.addContact('傅启元');
    },
    text: () => `你没有急着进去，而是绕到仓库背后。<br><br>后墙有一扇高窗，窗框生锈，下面堆着废木箱。守夜人每隔半小时从后门绕仓一圈，手电光会在东侧窗户上停留三秒。<br><br>货车旁站着一个穿西装的人，手里拿着公董局常用的蓝封公文夹。陆念薇站在他对面，脸色苍白。<br><br>你听见陆念薇压低声音说：<span class="sys">"傅先生，两个女人不能都留在这里。"</span><br><br>那人冷冷回答：<span class="sys">"今晚之前，箱子和人都不能留。陆小姐，你也一样。"</span><br><br>你心里一沉。傅启元不只是幕后名字，他就在码头。`,
    choices: [
      { text: '👂 继续观察傅启元和陆念薇', goto: 'ch4_fu_lu_scene' },
      { text: '🔦 趁换班从东侧窗户潜入', goto: () => E.routeDockByPressure() },
      { text: '🚓 现在去找老孙支援', goto: 'ch4_dock_wait' }
    ]
  };
  nodes.ch4_fu_lu_scene = {
    title: '码头 · 傅启元与陆念薇',
    weather: 2,
    cost: { h: 0, m: 20, reason: '你冒险继续观察码头动静' },
    effect: () => {
      E.setFlag('heard_fu_lu', true);
      E.addClue('傅启元威胁陆念薇', '傅启元要求陆念薇闭嘴，并准备连她一起清理');
    },
    text: () => `你屏住呼吸，躲在废木箱后继续听。<br><br>陆念薇的声音在发抖：<span class="sys">"我只答应替你们牵线，没答应杀人。陈明远不是我推下去的。"</span><br><br>傅启元笑了一声：<span class="sys">"不是你，也会算到你头上。杭州那份旧案卷宗还在我手里。"</span><br><br>陆念薇沉默了。<br><br>你终于明白，她不是无辜的人，但她也不是棋盘最上面那只手。`,
    choices: [
      { text: '🔦 趁他们离开，从东侧窗户潜入', goto: () => E.routeDockByPressure() },
      { text: '🚓 立刻去找老孙', goto: 'ch4_dock_wait' }
    ]
  };
  nodes.ch4_dock_full_search = {
    title: '福生仓 · 完整搜查',
    weather: 2,
    effect: () => {
      E.setFlag('dock_full_search', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('公董局公文纸', '福生仓内的清场指令写在公董局蓝封公文纸上');
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
    },
    text: () => `你先观察换班，再从东侧窗户进入。时间尚算充裕，仓库里还有一排排标着"光华小学·教学器材"的木箱。<br><br>深处传来很轻的敲击声。你有时间，但不是无限的。`,
    choices: [
      { text: '📦 先检查教具箱，找能开暗门的工具', goto: 'ch4_dock_crates' },
      { text: '🔦 直接去找声音来源', goto: 'ch4_dock_locked_door' }
    ]
  };
  nodes.ch4_dock_limited_search = {
    title: '福生仓 · 有限搜查',
    weather: 2,
    effect: () => {
      E.setFlag('dock_limited_search', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('公董局公文纸', '福生仓内残留的清场指令写在公董局蓝封公文纸上');
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
    },
    text: () => `仓库已经搬走一半。你只能抢下蓝封纸角和清场指令。<br><br>深处传来敲击声。旁边的教具箱可能藏着证据，也可能浪费最后一点时间。`,
    choices: [
      { text: '📦 冒险检查教具箱', goto: 'ch4_dock_crates' },
      { text: '🔦 立刻搜索仓库深处', goto: 'ch4_dock_locked_door' }
    ]
  };
  nodes.ch4_dock_rescue_only = {
    title: '福生仓 · 只够救人',
    weather: 5,
    effect: () => {
      E.setFlag('dock_rescue_only', true);
      E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
      E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      E.addClue('福生仓仓促清场', '你赶到时只能优先救人，来不及完整搜证');
    },
    text: () => `货箱大多已经搬空，外面的车随时会走。你没有时间查证，只能循着仓库深处的敲击声救人。`,
    choices: [{ text: '🔦 直奔仓库深处', goto: 'ch4_dock_deep_rescue_only' }]
  };
  nodes.ch4_dock_crates = {
    title: '福生仓 · 教具箱',
    cost: { h: 0, m: 15, reason: '你撬开教具箱检查货物' },
    weather: 2,
    effect: () => {
      E.addClue('教具箱走私', '标着光华小学的教具箱里装的是盘尼西林、吗啡针剂和军用纱布，不是教学器材');
      E.addClue('管制药品走私', '福生仓木箱内发现战时管制药品');
      E.addItem('光华货运单', '福生仓货箱夹层里的货运单，发货名义是光华小学教学器材。');
      E.addItem('铁钎', '你在教具箱旁找到一根撬箱用的铁钎，也许能打开暗门。');
      E.setFlag('found_door_tool', true);
    },
    text: () => `你撬开一个标着"光华小学·教学器材"的木箱。<br><br>箱盖一开，里面不是粉笔和地球仪，而是一排排盘尼西林小瓶、吗啡针剂和军用纱布。箱底夹着一张货运单，收货栏写着"福生仓三号"，发货名义却是"光华小学教学器材补充采购"。<br><br>你在箱边摸到一根铁钎。就在这时，仓库外传来脚步声。`,
    choices: [
      { text: '📦 躲进空木箱，等守卫过去', goto: 'ch4_dock_hide' },
      { text: '🔦 拿上铁钎，立刻去开暗门', effect: () => E.addHeat(1, '你顾不上隐藏踪迹，暴露风险升高。'), goto: 'ch4_dock_locked_door' }
    ]
  };
  nodes.ch4_dock_hide = {
    title: '福生仓 · 箱中屏息',
    weather: 2,
    cost: { h: 0, m: 10, reason: '你躲进木箱等守卫离开' },
    effect: () => E.setFlag('avoided_guard', true),
    text: () => `你钻进一只空木箱，把箱盖虚掩上。<br><br>守卫的脚步停在箱外。他用手电照了一圈，骂了一句：<span class="sys">"快点搬，傅先生说了，天亮前一件都不能剩。"</span><br><br>脚步声终于远去。你的衬衫已经被冷汗浸透。`,
    choices: [{ text: '🔦 带着铁钎去找暗门', goto: 'ch4_dock_locked_door' }]
  };
  nodes.ch4_dock_locked_door = {
    title: '福生仓 · 暗门',
    weather: 2,
    effect: () => E.addClue('仓库暗室', '木箱背后有一扇暗门，门上挂着旧锁，里面传出微弱敲击声'),
    text: () => {
      const hasTool = E.hasItem('铁钎');
      return `你循着敲击声走到仓库尽头。木箱背后有一扇暗门，门上挂着一把旧锁。<br><br>门内传来很轻的声音，像有人用指节敲木板。一下，两下，停住。然后又一下。<br><br>${hasTool ? '你握紧刚从教具箱边拿到的铁钎。' : '你手里没有合适的工具。如果强行砸锁，声音一定会传出去。'}`;
    },
    choices: () => {
      if (E.hasItem('铁钎')) {
        return [{ text: '🧰 用铁钎撬开暗门', goto: () => E.routeDockDeepByPressure() }];
      }
      return [
        { text: '⚠️ 砸锁开门', effect: () => E.addHeat(2, '砸锁声在仓库里回荡，守卫可能已经听见了。'), goto: () => E.routeDockDeepByPressure() },
        { text: '📦 回头检查教具箱找工具', goto: 'ch4_dock_crates' }
      ];
    }
  };
  nodes.ch4_dock_deep_dual = {
    title: '福生仓 · 暗室',
    weather: 2,
    effect: () => {
      E.setFlag('found_yufang', true);
      E.setFlag('found_su_at_dock', true);
      E.discoverRelation('沈玉芳');
      E.addClue('获救者身份', '福生仓暗室里关着沈玉芳和苏晚亭');
      E.addClue('苏晚亭在场', '你在福生仓暗室中亲眼找到苏晚亭，她昏迷但还活着');
    },
    text: () => `暗门被撬开的瞬间，一股潮湿的霉味扑出来。<br><br>里面不是一个人。<br><br>靠墙坐着一个穿灰旗袍的年轻女人，头发散乱，眼神警惕。行军床上躺着另一个女人，穿蓝灰色旗袍，脸色白得像纸，手里攥着一角被揉皱的信纸。<br><br>你认出了她。<br><br>苏晚亭。<br><br>灰旗袍女人先往后缩了一下，声音沙哑：<span class="sys">"你也是他们的人？"</span><br><br>你出示证件，她盯着证件看了很久，才像终于听懂了“救人”两个字。`,
    choices: [{ text: '💬 先确认她们的身份和伤势', goto: 'ch4_dock_who_dual' }]
  };
  nodes.ch4_dock_who_dual = {
    title: '暗室 · 两个女人',
    weather: 2,
    text: () => `灰旗袍女人说她叫沈玉芳，是光华小学的数学老师。<br><br>她的叙述断断续续。每说几句，就会停下来听门外有没有脚步声。<br><br><span class="sys">"陈老师……他看见了那些箱子。他不敢说。我也不敢。后来晚亭来了，她说，不能再让学校替他们运东西。"</span><br><br>床上的苏晚亭动了一下。她睁开眼，像隔着很远的雾看你。<br><br>她的第一句话不是问自己在哪里。<br><br><span class="sys">"陈老师……他是不是已经死了？"</span>`,
    choices: [{ text: '🔙 立刻带她们离开暗室', goto: 'ch4_dock_escape' }]
  };
  nodes.ch4_dock_deep_trace = {
    title: '福生仓 · 暗室',
    weather: 2,
    effect: () => {
      E.setFlag('found_yufang', true);
      E.setFlag('su_moved_from_dock', true);
      E.discoverRelation('沈玉芳');
      E.addClue('获救者身份', '被关在福生仓的女人是沈玉芳——沈玉兰的妹妹，光华小学的数学老师。');
      E.addClue('苏晚亭曾在暗室', '暗室里有苏晚亭的学生证和写给母亲的半张字条，她刚被转走不久');
      E.addItem('苏晚亭学生证', '暗室床缝里找到的学生证，边角被水泡软。');
    },
    text: () => `暗门后是一间不足十平米的小房间。一张行军床，一个水桶，一盏快熄灭的煤油灯。<br><br>床边蜷缩着一个穿灰旗袍的年轻女人。她看到你，先是往墙角缩，接着抓起水桶边的铁勺，像要防身。<br><br>你出示证件，她仍然不敢靠近。<br><br>行军床的缝里露出一张学生证。你抽出来，看到名字：<b>苏晚亭</b>。<br><br>旁边还有半张字条：<span class="sys">"妈，如果我回不去，请不要怪明远。"</span><br><br>沈玉芳看见那张学生证，声音发抖：<span class="sys">"他们刚把晚亭带走……不到一个时辰。"</span>`,
    choices: [{ text: '💬 你是沈玉芳？告诉我发生了什么', goto: 'ch4_dock_who' }]
  };
  nodes.ch4_dock_deep_rescue_only = {
    title: '福生仓 · 暗室',
    weather: 5,
    effect: () => {
      E.setFlag('found_yufang', true);
      E.setFlag('su_trace_only', true);
      E.discoverRelation('沈玉芳');
      E.addClue('仓库暗室', '木箱背后有一个暗门，通向一个被改造成囚室的小房间。');
      E.addClue('苏晚亭手表', '暗室地上有一只女式手表，表背刻着“晚亭”');
      E.addItem('苏晚亭手表', '暗室地上捡到的女式手表，表背刻着“晚亭”。');
    },
    text: () => `你在仓库尽头找到暗门。门后有一张行军床、一个水桶和一盏快熄灭的煤油灯。<br><br>床上蜷缩着一个年轻女人。地上还有一只摔坏的女式手表，表背刻着两个字：<b>晚亭</b>。<br><br>女人看到你的一瞬间，瞳孔猛地收缩。<br><br><span class="sys">"你也是他们的人？"</span><br><br>你出示证件。她盯了很久，才终于崩溃似的捂住脸。`,
    choices: [{ text: '💬 你是沈玉芳还是苏晚亭？', goto: 'ch4_dock_who' }]
  };
  nodes.ch4_dock_who = {
    title: '暗室 · 身份',
    weather: 2,
    effect: () => {
      E.addClue('获救者身份', '被关在福生仓的女人是沈玉芳——沈玉兰的妹妹，光华小学的数学老师。');
      E.discoverRelation('沈玉芳');
      E.setFlag('found_yufang', true);
    },
    text: () => `<span class="sys">"我……我叫沈玉芳。"</span><br><br>她说完这句话，像是用尽了力气，肩膀一下一下发抖。<br><br>你问她陈明远。<br><br>她没有立刻回答，而是先看向门口，确认没有脚步声，才断断续续地说下去。<br><br><span class="sys">"陈老师看见了箱子。不是教具……是药，是针剂。他不敢说。他说只要熬过去就好。可是晚亭不肯。她说，孩子们的学校不能变成他们的仓库。"</span><br><br>她说到苏晚亭时，忽然停住。<br><br><span class="sys">"他们把晚亭带走了。或者……如果你来得够早，她也许还在这里。"</span><br><br>这句话像一根针，扎进你的心里。`,
    choices: [{ text: '🔙 带她离开这里', goto: 'ch4_dock_escape' }]
  };
  nodes.ch4_dock_cleared = {
    title: '福生仓 · 迟到的仓库',
    weather: 5,
    effect: () => {
      E.setFlag('missed_deadline', true);
      E.addHeat(2, '福生仓已经清场，调查压力升高。');
      E.addClue('福生仓清场', '仓库已被清空，只留下拖痕、未燃尽的纸灰和苏晚亭的半张字条');
      E.addItem('苏晚亭半张字条', '纸灰边缘压着半张字条：妈，如果我回不去……');
    },
    text: () => `卷帘门敞开，地上有新车辙。你在纸灰里翻出半片蓝封纸角，也翻出半张没烧完的字条。<br><br><span class="sys">"妈，如果我回不去……"</span><br><br>后半句已经被火烧没了。<br><br>人被转走了。货也被转走了。你终于摸到苏晚亭的痕迹，却只摸到余温。`,
    choices: [
      { text: '🔙 带着残存证据回去整理', goto: 'ch3_wrapup' },
      { text: '🔍 直接回事务所做最后推断', goto: 'ch4_conclusion' }
    ]
  };
  nodes.ch4_dock_wait = {
    title: '福生仓 · 等待支援',
    weather: 5,
    cost: { h: 2, m: 15, reason: '你去找老孙调人，耽误了两个多小时' },
    effect: () => E.addHeat(1, '等待增援让码头局势更紧。'),
    text: () => E.deadlinePhase() === 'expired'
      ? `你带人赶回时，福生仓已经清空。老孙低声说：<span class="sys">"他们比我们快一步。"</span>`
      : `你带着老孙的人赶回码头。福生仓还没完全清空。<br><br><span class="sys">${E.deadlinePhaseLabel()}。</span>`,
    choices: () => E.deadlinePhase() === 'expired'
      ? [{ text: '🔦 检查清空后的仓库', goto: 'ch4_dock_cleared' }]
      : [{ text: '🚓 和老孙一起行动', goto: () => E.routeDockByPressure() }]
  };
  nodes.ch4_sun_support = {
    title: '巡捕房 · 私下求援',
    weather: 4,
    onPresent: (item) => {
      if (E.presentOnce(item, '福生仓地址', 'presented_fusheng_to_sun')) return { goto: 'ch4_sun_present_fusheng' };
      if (E.presentOnce(item, '半张烟盒纸', 'presented_wang_note_to_sun_support')) return { goto: 'ch4_sun_present_fusheng' };
      return null;
    },
    text: () => `老孙把办公室门关上。<br><br><span class="sys">"福生仓不能走明面。你要我帮，就拿出能说服我的东西。"</span>`,
    choices: [{ text: '🔙 暂时不找他', goto: 'ch3_wrapup' }]
  };
  nodes.ch4_sun_present_fusheng = {
    title: '举证 · 福生仓地址',
    weather: 4,
    effect: () => {
      E.setFlag('sun_support_available', true);
      E.addClue('老孙愿意私下支援', '老孙答应私下支援福生仓行动，但调人越多越容易惊动对方');
    },
    text: () => `老孙看完地址和纸条，沉默很久。<br><br><span class="sys">"我可以私下帮你。立刻走，快；调齐人手，稳，但慢。"</span>`,
    choices: [
      { text: '🏃 立刻带人赶去福生仓', effect: () => E.setFlag('sun_fast_support', true), goto: 'ch4_dock_sun_fast_support' },
      { text: '🚓 调齐人手再行动', goto: 'ch4_dock_wait' },
      { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
    ]
  };
  nodes.ch4_dock_sun_fast_support = {
    title: '福生仓 · 私下增援',
    weather: 2,
    cost: { h: 0, m: 45, reason: '你和老孙的人赶往福生仓' },
    effect: () => E.addHeat(-1, '老孙的私下支援降低了行动风险。'),
    text: () => `老孙只叫来一个信得过的便衣。你们分头靠近福生仓。<br><br><span class="sys">${E.deadlinePhaseLabel()}。</span>`,
    choices: [{ text: '🚓 分头潜入福生仓', goto: () => E.routeDockByPressure() }]
  };
  nodes.ch4_dock_escape = {
    title: '逃离码头',
    weather: 2,
    text: () => {
      if (E.getFlag('found_su_at_dock')) {
        return `你搀着沈玉芳，背上半昏迷的苏晚亭，沿着木箱阴影往外走。<br><br>快到仓库门口时，一辆黑色汽车停在码头边。傅启元从车上下来，手里仍拿着蓝封公文夹。<br><br>他看见你们，先是愣了一下，随即笑了。<br><br><span class="sys">"沈先生，私闯仓库、绑走证人，你知道这在法租界是什么罪名吗？"</span><br><br>苏晚亭在你背后轻轻动了一下，像是听见了那个声音。`;
      }
      return `你搀着沈玉芳走出暗室。她走得很慢，被关得太久，腿软得几乎站不住。<br><br>快到仓库门口时，一辆黑色汽车停在码头边。傅启元从车上下来，手里拿着蓝封公文夹。<br><br>他没有看沈玉芳，先看你。<br><br><span class="sys">"沈先生，光靠一位受惊过度的女教师，你想证明什么？"</span><br><br>仓库外的雾很重。你必须立刻决定怎么带人出去。`;
    },
    choices: () => {
      const opts = [];
      if (E.getFlag('sun_support_available') || E.getFlag('sun_fast_support')) {
        opts.push({ text: '🚓 让老孙的人亮明身份，正面压住傅启元', goto: 'ch4_fu_confront' });
      }
      opts.push({ text: '🌫️ 借雾绕开汽车，先把人带走', goto: 'ch4_dock_escape_finish' });
      opts.push({ text: '⚠️ 当场质问傅启元', effect: () => E.addHeat(1, '你当场质问傅启元，局势变得危险。'), goto: 'ch4_fu_confront' });
      return opts;
    }
  };
  nodes.ch4_fu_confront = {
    title: '码头 · 正面对峙',
    weather: 5,
    effect: () => {
      E.setFlag('confronted_fu', true);
      E.addClue('傅启元正面对峙', '傅启元在福生仓门口试图阻止你带走证人');
    },
    text: () => `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br><span class="sys">"傅秘书，今晚这两个人，得先跟我们走。"</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。`,
    choices: [{ text: '🚕 立刻送她们离开码头', goto: 'ch4_dock_escape_finish' }]
  };
  nodes.ch4_dock_escape_finish = {
    title: '逃离码头 · 雾中车铃',
    weather: 2,
    effect: () => {
      E.setFlag('rescued_yufang', true);
      E.addClue('沈玉芳证词', '陈老师死前曾向她求助，说发现了学校利用教具箱走私管制药品。她被关在福生仓近一个月。');
      if (E.getFlag('found_su_at_dock')) {
        E.setFlag('rescued_su', true);
        E.addClue('苏晚亭获救', '你在福生仓暗室救出苏晚亭，她昏迷但还活着');
      }
    },
    text: () => {
      if (E.getFlag('found_su_at_dock')) {
        return `黄包车的铃铛在深夜街道上响起。<br><br>沈玉芳蜷在车座一角，苏晚亭靠在你脱下来的大衣里。她醒过一次，只问了一句话：<br><br><span class="sys">"陈老师……他是不是已经死了？"</span><br><br>你没有立刻回答。车轮碾过水洼，雾在身后合拢。至少这一夜，你先找到了人。`;
      }
      return `黄包车的铃铛在深夜街道上响起。<br><br>沈玉芳缩在车座上，裹着你脱下来的大衣。她看见路灯时眯起眼，像是很久没有见过这么亮的光。<br><br><span class="sys">"晚亭还在他们手里。"</span>她说，声音很轻。<br><br>你点点头。至少这一夜，你从雾里抢回了一个活人，也抢回了苏晚亭曾经在这里的证据。`;
    },
    choices: [{ text: '🔙 回事务所整理证词和证据', goto: 'ch3_wrapup' }]
  };
  nodes.ch4_yufang_present_photo = {
    title: '举证 · 三人合影',
    weather: 2,
    effect: () => E.addClue('沈玉芳认出三人合影', '她确认陈明远、苏晚亭与陆念薇早已产生交集'),
    text: () => `沈玉芳看着照片，指尖一直发抖。<br><br><span class="sys">"她不叫陆小姐。陈老师叫她陆念薇。她第一次来学校的时候，说自己只是翻译合同。后来我才知道，她每次来，傅启元的人也会来。"</span><br><br>这句话把照片上的三个人，终于拉回同一张网里。`,
    choices: [{ text: '🔙 带她离开', goto: 'ch4_dock_escape' }]
  };
  nodes.ch4_yufang_present_letter = {
    title: '举证 · 陈明远的信',
    weather: 2,
    effect: () => E.addClue('沈玉芳确认陈明远求助', '她确认陈明远死前准备揭开学校走私链，并试图保护苏晚亭'),
    text: () => `沈玉芳读完信，中途停了三次。<br><br>最后她把信按在胸口，像按住一块伤口。<br><br><span class="sys">"他不是怕死。他是怕晚亭也被拖进来。可是我们谁也没有逃出去。"</span>`,
    choices: [{ text: '🔙 带她离开', goto: 'ch4_dock_escape' }]
  };
