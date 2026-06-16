// ===== 故事 =====
const nodes = {
  // —— 序幕 ——
  ch1_open: {
    title: '民国三十七年 · 暮秋 · 上海',
    time: {d:1, h:14, m:30},
    weather: 0,
    text: () => `秋雨连绵的午后，你坐在霞飞路一家叫"听雨"的茶馆里。

茶凉了第三泡的时候，一个穿灰色长衫的中年人推门进来。他环顾一圈，径直走向你的桌子，在你对面坐下。

<span class="sys">"沈先生？"</span>他问。

你点点头。他是通过《申报》的广告找到你的——「承办各类调查事务，不问公私」。

中年人从怀里掏出一张照片放在桌上。照片上是一个年轻女人，容貌端正，穿着民国女学生的制服，眉目之间带着一丝倔强。

<span class="sys">"她叫苏晚亭，我的未婚妻。四天前失踪了。"</span>

他说，苏晚亭是圣约翰大学的学生，四天前说去图书馆还书，再也没有回来。巡捕房立了案，但什么进展都没有。

<span class="sys">"巡捕房说人可能自己走了。但晚亭不是那种人。她父亲死得早，母亲卧病在床，她不会丢下她母亲不管。"</span>男人的声音有些发抖。<span class="sys">"沈先生，我听说你有办法。请你帮帮我。"</span>

他把一个信封推过来——沉甸甸的，是银元。

<span class="sys">"这是定金。我只有这么多，但如果能找到她……"</span>

窗外的雨还在下。`,
    choices: [
      { text: '💵 接下委托', effect: (s) => { s.chapter = 1; E.addContact('周明远'); E.addItem('苏晚亭的照片', '光启公园留影，照片背面写着"民国三十七年九月 · 光启公园 · 晚亭"。'); E.setFlag('took_case', true); }, goto: 'ch1_take' },
      { text: '❓ 先问几个问题', goto: 'ch1_ask' },
      { text: '🚪 这个案子我不接', goto: 'end_refuse' },
    ],
  },

  end_refuse: {
    title: '结局 · 雨不停',
    weather: 0,
    text: () => `你把信封推回去。

<span class="sys">"周先生，这个案子我接不了。你另请高明吧。"</span>

周明远愣了一下。他看着你，像是想说什么，最后只是把银元收回怀里。

<span class="sys">"……我明白了。打扰了，沈先生。"</span>

他站起来，鞠了一躬，走进雨里。

你又叫了一壶茶。窗外的雨没有要停的意思。你看着对面的空椅子，心想：上海每天都有人失踪，你管不过来，也不想管。

——三个月后。

你在《申报》的社会版角落里看到一则简短的报道：「圣约翰大学女生苏某失踪案因线索不足，已由巡捕房归档。家属未再提出申诉。」

报道旁边是一条皮鞋广告。

你把报纸翻了过去，继续喝你的茶。

雨还在下。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局零 · 雨不停（隐藏结局）——</div>`,
    type: 'end',
  },

  ch1_ask: {
    title: '听雨茶馆',
    text: () => `你端起凉透的茶喝了一口。

<span class="sys">"你有她的照片，但我需要知道更多。她最近有没有什么异常？有没有跟人结怨？她平时都去哪些地方？"</span>

男人——他叫<b>周明远</b>，在商务印书馆做编辑——深吸一口气，像是在整理思路。

<span class="sys">"晚亭最近……确实有点不一样。失踪前半个月，她经常很晚才回宿舍。我问她去哪，她只说在准备毕业论文。但她是英文系的，论文题目是《简·奥斯汀作品中的女性意识》——她跟我说过，不需要外出查资料。"</span>

他顿了顿。

<span class="sys">"还有一件事。她失踪前两天，有一个穿黑衣服的男人来学校找过她。门房说那人大概四十岁，戴一顶宽檐帽，看不清脸。晚亭出来跟他说了几句话，回来以后脸色很不好看。"</span>

他眼巴巴地看着你。`,
    choices: [
      { text: '💵 好，这委托我接了', effect: (s) => { s.chapter = 1; E.addContact('周明远'); E.addItem('苏晚亭的照片', '光启公园留影，照片背面写着"民国三十七年九月 · 光启公园 · 晚亭"。'); E.addClue('黑衣男人', '失踪前有人找过她'); E.setFlag('took_case', true); }, goto: 'ch1_take' },
      { text: '🚪 听完了，但这个案子我不接', goto: 'end_refuse' },
    ],
  },

  ch1_take: {
    title: '接案',
    weather: 0,
    effect: (s) => {
      E.registerRelation('苏晚亭',['圣约翰大学学生','失踪者'],[]);
      E.discoverRelation('苏晚亭');
      E.registerRelation('周明远',['商务印书馆编辑','委托者'],['苏晚亭']);
      E.discoverRelation('周明远');
    },
    text: () => `你把银元收好，将照片揣进大衣内袋。

<span class="sys">"我会找到她的。"</span>

周明远站起来，深深鞠了一躬，转身走进雨里。

你坐在空荡荡的茶馆里，把照片又拿出来看了一遍。照片背面用钢笔写着一行娟秀的小字：

<span class="sys">"民国三十七年九月 · 光启公园 · 晚亭"</span>

你决定先去哪里？`,
    choices: [
      { text: '🏛️ 去圣约翰大学——她最后出现的地方', goto: 'ch2_university' },
      { text: '📋 去巡捕房——查她的失踪案卷', goto: 'ch2_police' },
      { text: '🏠 去苏家——看她母亲', goto: 'ch2_home' },
    ],
  },

  // —— 第一章 · 现场 ——
  ch2_university: {
    title: '圣约翰大学',
    time: {d:1, h:15, m:0},
    weather: 0,
    text: (s) => {
      let extra = '';
      if (E.hasClue('黑衣男人')) extra += '\n\n你记起周明远说的黑衣男人——你要找门房聊聊。';
      return `圣约翰大学的校园在这个季节很美。法国梧桐的叶子落了满地，金黄色的，踩上去沙沙响。

你找到了苏晚亭的宿舍——一栋红砖小楼。舍监是个四十多岁的胖女人，姓王，警惕地打量了你半天才放你进去。

苏晚亭的寝室在二楼，靠窗。房间里收拾得很干净，书桌上摆着几本英文小说和一沓稿纸。你翻了翻——是她的论文草稿，批注密密麻麻。

${extra}`;
    },
    choices: (s) => {
      const opts = [];
      if (!E.hasClue('舍监证词')) opts.push({ text: '👩 问舍监——失踪那天的情况', goto: 'ch2_univ_matron' });
      if (!E.hasClue('黑衣男人') || !E.getFlag('asked_door')) opts.push({ text: '🚪 找门房——问黑衣男人的事', goto: 'ch2_univ_door' });
      opts.push({ text: '📄 检查她的论文草稿', goto: 'ch2_univ_paper' });
      if (E.hasClue('法租界地图')) opts.push({ text: '🔙 已经查得差不多了，去下一个地方', goto: 'ch2_leave_univ' });
      return opts;
    },
  },

  ch2_univ_matron: {
    title: '舍监的证词',
    text: () => `王舍监一边织毛衣一边回忆那天的事。

<span class="sys">"苏小姐啊——她那天下午两点多出去的。穿一件蓝灰色的旗袍，拿了一把伞。我问她去哪儿，她只说去图书馆。我也没多想。"</span>

<span class="sys">"她平时按时回来的，那天到了晚上十点还没回来。我以为她可能回家里住了——她母亲身体不好，有时候她会回去照顾。第二天还没回来我才觉得不对劲，报告了学校。"</span>

你问她苏晚亭最近有没有什么异常。

<span class="sys">"异常……"</span>她想了想，<span class="sys">"她最近确实经常出去，以前不是这样的。还有一回——大概五六天前吧——我半夜起来上厕所，看到她房间的灯还亮着。我以为她在看书，但走近了听到她在哭。哭得很小声，像是怕人听见。"</span>`,
    effect: (s) => { E.addClue('舍监证词', '失踪当天下午两点出门，最近常外出，失踪前夜曾哭泣'); },
    choices: [
      { text: '🚪 去门房问黑衣男人的事', goto: 'ch2_univ_door' },
      { text: '📄 检查她的论文草稿', goto: 'ch2_univ_paper' },
    ],
  },

  ch2_univ_door: {
    title: '门房的证词',
    text: () => `门房是个瘦小的老头，姓刘，正在门房里就着花生米喝黄酒。

你问他有没有见过一个黑衣男人来找苏晚亭。

<span class="sys">"哦，那个人。"</span>他放下酒杯，回忆道，<span class="sys">"是有这么个人。大概是苏小姐失踪前两天来的。穿一件黑大褂，戴宽檐帽，压得很低，看不清楚脸。他让我叫苏小姐出来，说是她家里的亲戚。"</span>

<span class="sys">"苏小姐出来以后，跟他站在那棵梧桐树下说了大概……一盏茶的功夫。回来的时候脸色很白。我问她没事吧，她摇摇头就上楼了。"</span>

你问他还记得那人有什么特征。

<span class="sys">"特征……"</span>老头眯着眼想了半天，<span class="sys">"他说话有点北方口音。还有——他左手食指戴了一枚玉扳指，绿色的，成色不错。我之所以记得，是因为那玩意儿在门房的灯光下反了一下光，晃了我眼睛。"</span>`,
    effect: (s) => { E.addClue('黑衣男人线索', '四十岁左右，北方口音，左手食指戴绿玉扳指'); E.setFlag('asked_door', true); },
    choices: [
      { text: '📄 检查论文草稿', goto: 'ch2_univ_paper' },
    ],
  },

  ch2_univ_paper: {
    title: '论文草稿',
    text: () => `你翻看苏晚亭的论文稿纸。

她的字很漂亮，英文流畅，批注逻辑清晰——确实是一个好学生的水准。但你注意到一些奇怪的东西。

有几页稿纸的背面有铅笔写的草稿——不是论文，像是某种清单。字迹很轻，像是随手记的：

<span class="sys">"法租界 · 薛华立路 22 号"</span>
<span class="sys">"周三下午三点"</span>
<span class="sys">"不要告诉任何人"</span>

你把这页纸折好收进口袋。

另外，在她的牛津字典里夹着一张书签——不是普通书签，是一张法租界的地图。地图上用铅笔圈了一个位置：<b>薛华立路 22 号</b>。`,
    effect: (s) => { E.addClue('法租界地图', '薛华立路 22 号被圈出'); E.addClue('铅笔清单', '薛华立路 22 号，周三下午三点，不要告诉任何人'); E.addItem('法租界地图', '夹在牛津字典里的书签地图，薛华立路 22 号被铅笔圈出。'); E.addItem('铅笔清单', '写在论文稿背面的轻淡字迹：薛华立路 22 号、周三下午三点、不要告诉任何人。'); },
    choices: [
      { text: '🔙 差不多了，去下一站', goto: 'ch2_leave_univ' },
    ],
  },

  ch2_leave_univ: {
    title: '离开校园',
    text: () => `你把线索整理了一下。苏晚亭失踪前频繁外出，有人来找过她，她去过法租界的薛华立路 22 号，失踪前夜在哭泣。

你走出校门。去哪？`,
    choices: [
      { text: '🏛️ 去法租界 · 薛华立路 22 号', goto: 'ch2_frenchtown' },
      { text: '📋 去巡捕房查卷宗', effect: (s) => {}, goto: 'ch2_police_alt' },
      { text: '🏠 去苏家看她母亲', effect: (s) => {}, goto: 'ch2_home' },
    ],
  },

  // —— 巡捕房 ——
  ch2_police: {
    title: '上海法租界巡捕房',
    time: {d:1, h:16, m:0},
    weather: 1,
    onPresent: (item, s) => {
      if (item.name === '半张烟盒纸' && !E.getFlag('presented_note')) {
        E.setFlag('presented_note', true);
        return { goto: 'ch2_police_present' };
      }
      return null;
    },
    text: () => `巡捕房坐落在薛华立路上，灰扑扑的建筑，门口挂着青天白日旗。

你认识这里的一个探长——<b>老孙</b>，孙国栋，跟你打过几次交道。他正坐在办公桌前抽烟，看到你来了也不意外。

<span class="sys">"我就知道你会来。周明远那小子去找你了吧？"</span>

他吐了个烟圈，从抽屉里抽出一个文件夹丢在桌上。

<span class="sys">"苏晚亭的案子。说实话，没什么东西。女学生失踪，十有八九是自己跑了——但周明远不死心，我也不能拦着他花钱。"</span>

你翻开卷宗。`,
    effect: (s) => { E.addContact('孙国栋探长'); E.discoverRelation('孙国栋'); E.setFlag('met_police', true); },
    choices: [
      { text: '📖 仔细翻看卷宗', goto: 'ch2_police_file' },
    ],
  },

  ch2_police_file: {
    title: '失踪案卷宗',
    text: () => `卷宗很薄，记录平平无奇。

但你的目光被一行小字吸引——在记录页的边缘，有人用铅笔写了一行批注。字迹潦草，跟正式记录的不是同一只手：

<span class="sys">"此案与光华小学事件有关联？建议并案——王"</span>

你抬头看老孙。

<span class="sys">"光华小学？"</span>

老孙掐灭了烟，表情有些微妙。<span class="sys">"那是上个月的事了。光华小学有个男老师跳楼了。三十七岁，姓陈。留了一封遗书，说是'愧对学生，无颜苟活'。当时定性为自杀，案子就结了。"</span>

<span class="sys">"那个姓陈的老师……跟苏晚亭有什么关系？"</span>

老孙耸耸肩。<span class="sys">"不知道。写这备注的同事姓王，上个月调走了。你要是想查，得自己去挖。"</span>`,
    effect: (s) => { E.addClue('光华小学事件', '男教师跳楼自杀；备注提到与苏案可能有关'); E.addItem('卷宗摘抄', '苏晚亭失踪案卷宗边缘有铅笔批注：此案与光华小学事件有关联？'); E.addContact('王巡官（已调离）'); E.setFlag('got_case_file', true); },
    choices: [
      { text: '📎 追问王巡官调离前留下了什么', goto: 'ch2_police_wang' },
      { text: '🏛️ 去薛华立路 22 号——就在同一条街上', goto: 'ch2_frenchtown' },
      { text: '🏠 去苏家看她母亲', goto: 'ch2_home' },
    ],
  },

  ch2_police_alt: {
    title: '上海法租界巡捕房',
    text: () => `老孙还坐在那里抽烟，看你来了把卷宗推过来。

卷宗里有一行铅笔批注引起了你的注意：<span class="sys">"此案与光华小学事件有关联？建议并案——王"</span>

你问了老孙才知道，光华小学上个月有个男老师跳楼自杀了，姓陈。`,
    effect: (s) => { E.addContact('孙国栋探长'); E.addClue('光华小学事件', '男教师跳楼自杀；备注提到与苏案可能有关'); E.addItem('卷宗摘抄', '苏晚亭失踪案卷宗边缘有铅笔批注：此案与光华小学事件有关联？'); E.setFlag('got_case_file', true); },
    choices: [
      { text: '📎 追问王巡官调离前留下了什么', goto: 'ch2_police_wang' },
      { text: '🏛️ 去薛华立路 22 号', goto: 'ch2_frenchtown' },
      { text: '🏠 去苏家', goto: 'ch2_home' },
    ],
  },

  ch2_police_present: {
    title: '巡捕房 · 出示烟盒纸',
    time: {d:1, h:16, m:15},
    weather: 1,
    effect: (s) => { E.addClue('老孙承认暗查', '巡捕房也在秘密调查福生仓——那是公董局的人插手的线。王巡官的调离不是巧合。'); },
    text: () => `你把王巡官留下的半张烟盒纸放在老孙桌上。<br><br>老孙低头看了一眼，表情凝固了一瞬。然后他叹了口气，把烟掐灭。<br><br><span class="sys">"你见到王巡官了？"</span><br><br><span class="sys">"他调走了。这是他留在卷宗里的。"</span><br><br>老孙拿起烟盒纸，翻来覆去看了两遍。然后他把纸折好，揣进自己口袋里。<br><span class="sys">"这件事……我本来不想让你卷进去。"</span><br><br>他告诉你，王巡官是他的老部下。光华小学出事之后，王巡官一直觉得不对劲，私下在查福生仓这条线。查了一个月，被公董局的人知道了。<br><br><span class="sys">"他没有被调走。他是被调走的。你明白我的意思吗？"</span><br><br>你明白。明升暗降，把人从案子上挪开。<br><br><span class="sys">"福生仓的事，你最好别碰。"</span>老孙的声音很低。<span class="sys">"但如果你碰了……查到什么，别走官方渠道。直接来找我。私下。"</span><br><br>你点了点头。老孙拿起烟盒纸，划了一根火柴，把它烧了。<br><br>灰烬飘进废纸篓里。`,
    choices: [
      { text: '🔙 离开巡捕房', goto: 'ch2_leave_univ' },
    ],
  },

  ch2_police_wang: {
    title: '王巡官的铅笔字',
    text: () => `你把卷宗边角那行铅笔批注推到老孙面前。

<span class="sys">"这个王巡官，为什么会觉得苏晚亭的案子和光华小学有关？"</span>

老孙皱了皱眉，像是不太愿意谈。过了一会儿，他起身走到铁皮档案柜前，从最底层抽出一个薄薄的牛皮纸袋。

<span class="sys">"老王调走前，确实留过一点东西。他说这案子不干净，让我有机会就烧了。我没烧，也没敢往上报。"</span>

纸袋里只有半张烟盒纸，上面写着三行字：

<span class="sys">"光华夜值。"</span>
<span class="sys">"福生仓。三日清。"</span>
<span class="sys">"别信公董局来的电话。"</span>

你问老孙福生仓是什么地方。

<span class="sys">"苏州河边一个旧仓库，早年囤棉纱的。后来荒了。"</span>

老孙把烟盒纸重新推给你。<span class="sys">"拿走吧。我没见过这东西。"</span>`,
    effect: (s) => { E.addClue('王巡官遗留纸条', '光华夜值；福生仓，三日清；别信公董局来的电话'); E.addItem('半张烟盒纸', '王巡官调离前留下的纸条：光华夜值；福生仓，三日清；别信公董局来的电话。'); E.setFlag('got_wang_note', true); },
    choices: [
      { text: '🏛️ 去薛华立路 22 号', goto: 'ch2_frenchtown' },
      { text: '🏠 去苏家', goto: 'ch2_home' },
      { text: '📚 去光华小学', goto: 'ch3_school' },
    ],
  },

  // —— 苏家 ——
  ch2_home: {
    title: '苏家',
    time: {d:1, h:17, m:30},
    weather: 0,
    text: () => `苏晚亭的家在闸北一条狭窄的弄堂里。青石板路面湿漉漉的，墙根长着青苔。

你敲开门。苏母是个五十多岁的妇人，坐在轮椅上，腿上盖着一条薄毯。她脸色苍白，但眼神清亮。

<span class="sys">"你是……周先生派来的人吧？"</span>她的声音很轻。<span class="sys">"明远跟我说过了。请进。"</span>

屋里很小，但收拾得干净。墙上挂着一张全家福——苏晚亭大约十五六岁的时候，站在一个中年男人身边，笑得很灿烂。那大概是她父亲，已经过世了。

苏母给你倒了一杯茶。`,
    effect: (s) => { E.addContact('苏母'); E.discoverRelation('苏母'); },
    choices: [
      { text: '💬 问苏晚亭最近的情况', goto: 'ch2_home_talk' },
      { text: '🖼️ 注意墙上的照片', goto: 'ch2_home_photo' },
    ],
  },

  ch2_home_talk: {
    title: '母亲的证词',
    text: () => `你问苏母，晚亭失踪前有没有什么异常。

<span class="sys">"这孩子……"</span>苏母叹了口气，<span class="sys">"她从小就懂事，从来不让我操心。功课好，人也乖巧。可是最近这半年，她好像一直有心事。我问她，她总说没事。"</span>

<span class="sys">"有一回——大概两个月前——她半夜突然跑回来，浑身湿透了，像是淋了雨。我问她怎么了，她说是图书馆关门了，走到半路下雨了。但我看到她眼睛红红的，像是哭过。她不说，我也不忍心追问。"</span>

<span class="sys">"她爸爸走得早，我这条腿也不争气。这孩子扛了太多事了。"</span>

你安慰了她几句，心里却在想——苏晚亭到底扛着什么事。`,
    effect: (s) => { E.addClue('母亲证词', '两个月前曾深夜淋雨回家，像哭过；这半年一直有心事'); },
    choices: (s) => {
      const opts = [];
      if (!E.getFlag('asked_photo')) opts.push({ text: '🖼️ 墙上的照片里有什么线索？', goto: 'ch2_home_photo' });
      opts.push({ text: '🔙 告辞，去下一个地方', goto: 'ch2_leave_home' });
      return opts;
    },
  },

  ch2_home_photo: {
    title: '墙上的照片',
    text: () => `你走近细看那张全家福。照片里苏晚亭的父亲穿着长衫，面容和善。

但你注意到一个细节——照片的角落里还有一个人，被裁剪掉了。

只剩下一只手臂，搭在苏晚亭的肩膀上。那只手臂的袖口上别着一枚徽章——看起来像是某种学校的校徽。

你看不太清楚是什么学校。`,
    effect: (s) => { E.addClue('裁切的照片', '全家福里有人被裁掉；袖口有校徽'); E.setFlag('asked_photo', true); },
    choices: [
      { text: '💬 问苏母——照片里还有谁？', goto: 'ch2_home_ask_photo' },
      { text: '🔙 告辞', goto: 'ch2_leave_home' },
    ],
  },

  ch2_home_ask_photo: {
    title: '母亲的回避',
    text: () => `你指着照片上被裁掉的部分，装作不经意地问苏母。

<span class="sys">"这张照片——还有别人吧？"</span>

苏母的表情有一瞬间的僵硬。她低下头，沉默了一会儿。

<span class="sys">"那是……晚亭的一个表哥。很多年不来往了。裁了就裁了吧。"</span>

她的语气很平淡，但你觉得她在回避什么。你没有追问。

离开苏家的时候，你回头看了一眼那扇门——一个坐着轮椅的母亲，一个失踪的女儿，一张被裁掉的照片。这个家藏着的事，比表面上看到的要多。`,
    effect: (s) => { E.addClue('表哥', '照片上裁掉的人是苏晚亭的"表哥"；苏母不愿多谈'); E.setFlag('asked_mother_photo', true); },
    choices: [
      { text: '🔙 去下一个地方', goto: 'ch2_leave_home' },
    ],
  },

  ch2_leave_home: {
    title: '闸北街头',
    text: () => `你站在弄堂口，秋风吹起地上的落叶。

三选一：`,
    choices: [
      { text: '🏛️ 去法租界 · 薛华立路 22 号', goto: 'ch2_frenchtown' },
      { text: '📋 去巡捕房（如果还没去）', effect: (s) => {}, goto: (s) => E.getFlag('got_case_file') ? 'ch2_frenchtown' : 'ch2_police' },
      { text: '📚 去光华小学——查跳楼案', goto: 'ch3_school' },
    ],
  },

  // —— 法租界 · 薛华立路 22 号 ——
  ch2_frenchtown: {
    title: '薛华立路 22 号',
    time: {d:1, h:19, m:0},
    weather: 4,
    text: () => `薛华立路是法租界的主干道，两旁是高大的法国梧桐。

22 号是一栋灰色的三层小楼，底楼是一家挂着"永兴贸易商行"招牌的店铺，看起来半死不活的。二楼三楼看起来像是民宅。

你站在门口观察了一会儿——没有什么特别的。但苏晚亭专门记下了这个地址，一定有问题。

你决定怎么进去？`,
    choices: [
      { text: '🚪 直接推门进去', goto: 'ch2_building_enter' },
      { text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' },
    ],
  },

  ch2_building_stakeout: {
    title: '街对面的观察',
    text: () => `你在街对面的香烟摊买了一包烟，假装点烟，观察那栋楼。

站了大约二十分钟，你看到了一个人从楼里出来——一个中年男人，穿黑大褂，戴宽檐帽。他走出门后左右看了看，然后快步往街北走去。

你注意到他的左手——食指上有一枚绿色的玉扳指。

就是来找苏晚亭的那个男人。

你快步跟上他。`,
    effect: (s) => { E.setFlag('saw_man', true); E.addClue('跟踪黑衣男人', '他从薛华立路22号出来，往北走'); },
    choices: [
      { text: '🕵️ 跟踪他', goto: 'ch2_tail' },
      { text: '🚶 不跟了，先进楼里看看', goto: 'ch2_building_enter' },
    ],
  },

  ch2_tail: {
    title: '尾随',
    text: () => `你跟在黑衣男人后面，保持二十步的距离。

他走得不快，但很警觉——过了两个路口就回了一次头。你假装看报纸躲过了。

他在一家叫"鸿运茶楼"的门口停下来，回头看了看，推门进去了。

你等了几秒钟，跟进去。茶楼里人不多，他坐在靠窗的位子，似乎在等什么人。

你要不要也在茶楼坐下，监视他？`,
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

然后他站起来，走了。

女人独自坐在窗边，望着雨后的街道发呆。`,
    effect: (s) => { E.addClue('神秘女子', '在茶楼给黑衣男人一个信封，像是交易'); E.setFlag('saw_woman', true); },
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

  // —— 薛华立路 22 号 ——
  ch2_building_enter: {
    title: '永兴贸易商行',
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
    effect: (s) => { E.addClue('三人合影', '苏晚亭、陆小姐、陈老师的合影'); E.addClue('恐吓信', '"如果你不说，他们下一个就是你"'); E.addItem('三人合影', '苏晚亭、陆小姐、陈老师在光华小学门前的合影。'); E.addItem('恐吓信', '没有署名的信：如果你不说，他们下一个就是你。'); E.setFlag('got_photo_letter', true); s.chapter = 3; },
    choices: [
      { text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' },
    ],
  },

  // —— 第二章 · 光华小学 ——
  ch3_school: {
    title: '光华小学',
    time: {d:2, h:9, m:0},
    weather: 2,
    text: (s) => {
      let extra = '';
      if (E.getFlag('talked_to_woman')) extra += '\n\n沈玉芳也在这里教书——她的失踪跟这一切有没有关系？';
      return `光华小学坐落在法租界边缘，一栋灰砖三层楼建筑。操场上空荡荡的，旗杆上挂着民国国旗，在秋风中翻卷。

你走进校门，门卫拦住你。你出示了证件，说你是来调查陈老师坠楼案的。

门卫的脸色变了一下，放你进去了。

校长的办公室在二楼。你敲门进去——校长姓<b>吴</b>，五十多岁，秃顶，戴一副金丝眼镜。他听你说明来意后，表情很复杂。

<span class="sys">"陈老师的事……已经结案了。自杀，巡捕房认定的。"</span>${extra}`;
    },
    effect: (s) => { E.addContact('吴校长'); E.discoverRelation('吴校长'); s.chapter = 3; },
    choices: [
      { text: '💬 问陈老师的事', goto: 'ch3_school_teacher' },
      { text: '💬 问沈玉芳的事', when: (s) => E.getFlag('sister_case'), hint: '你还不知道沈玉芳这条线。先去茶楼接触沈玉兰。', goto: 'ch3_school_yufang' },
    ],
  },

  ch3_school_yufang: {
    title: '问沈玉芳的事',
    text: () => `你从怀里掏出沈玉兰给的那张照片——她妹妹沈玉芳，梳着齐耳短发，穿一件素色旗袍，站在光华小学门口，笑得很安静。

吴校长接过照片，脸色沉了下来。

<span class="sys">"沈老师……她是我们学校的数学老师，教五年级。来了三年了，课讲得好，学生都喜欢她。"</span>

<span class="sys">"她失踪前有什么异常吗？"</span>

吴校长摘下眼镜擦了擦。<span class="sys">"说实话——她出事前那段时间确实不对劲。总是心不在焉，上课有时候会走神。我找她谈过一次话，她说家里有事。她说她姐姐身体不好……现在看来，可能是另一个意思。"</span>

<span class="sys">"她跟陈老师关系怎么样？"</span>

吴校长想了想。<span class="sys">"走得挺近的。陈老师藏书多，沈老师也爱看书，经常去他办公室借书。有时候放学了还看到他们在办公室里聊到很晚。但也就是普通同事——我当时是这么以为的。"</span>

他说"我当时是这么以为的"的时候，语气里有一丝迟来的不安。

<span class="sys">"她失踪前最后一天——有什么特别的事吗？"</span>

<span class="sys">"最后一天……她上了一节早课，然后说人不舒服，提前走了。那之后再也没有回来。她办公桌上的东西都没带走——书本、茶杯、一张学生的成绩单——到现在还原封不动放着。"</span>

你心里记下了这一点——沈玉芳离开得很匆忙，连随身物品都没拿。不像是计划好的离开。`,
    effect: (s) => { E.addClue('沈玉芳与陈明远', '走得近，经常借书聊天；失踪前心不在焉，匆忙离开未带物品'); },
    choices: [
      { text: '💬 问陈老师的事', goto: 'ch3_school_teacher' },
      { text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' },
      { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
    ],
  },

  ch3_school_teacher: {
    title: '关于陈老师',
    onPresent: (item, s) => {
      if (item.name === '恐吓信' && !E.getFlag('presented_threat_to_wu')) {
        E.setFlag('presented_threat_to_wu', true);
        return { goto: 'ch3_wu_present_threat' };
      }
      if (item.name === '三人合影' && !E.getFlag('presented_photo_to_wu')) {
        E.setFlag('presented_photo_to_wu', true);
        return { goto: 'ch3_wu_present_photo' };
      }
      return null;
    },
    text: () => `吴校长叹了口气，坐到椅子上。

<span class="sys">"陈老师——陈明远——在我们学校教了五年书，一直是个好老师。语文课讲得好，学生都喜欢他。他出事的那个晚上，是他在学校值夜。第二天早上，工友发现他躺在教学楼后面的水泥地上。"</span>

<span class="sys">"遗书呢？"</span>

吴校长从抽屉里拿出一个证物袋，里面是一张对折的信纸。你接过来看，字迹确实像是陈明远的：

<span class="sys">"愧对学生，无颜苟活。我做了不可原谅的事。所有责任在我一人，与他人无关。"</span>

你盯着这封遗书看了很久。

<span class="sys">"校长，你觉得他是自杀吗？"</span>

吴校长摘下眼镜擦了擦。<span class="sys">"巡捕房说是。但我跟陈老师共事五年——他不是那种人。他出事前一周，我还跟他谈过话，说下学期让他当年级组长。他很高兴。一个准备升职的人，为什么要自杀？"</span>`,
    effect: (s) => { E.addClue('陈明远坠楼案', '遗书称"做了不可原谅的事"；校长不信是自杀'); E.discoverRelation('陈明远'); E.setFlag('asked_about_chen', true); },
    choices: [
      { text: '💬 问陈老师跟苏晚亭的关系', goto: 'ch3_school_chen_su' },
      { text: '💬 问学校有没有其他异常', goto: 'ch3_school_weird' },
      { text: '📖 要求看陈老师的办公室', goto: 'ch3_school_office' },
    ],
  },

  ch3_wu_present_threat: {
    title: '举证 · 恐吓信',
    text: () => `你把 203 室找到的那封恐吓信放到吴校长面前。

<span class="sys">"我知道那晚你看到了什么。如果你不说，他们下一个就是你。"</span>

吴校长的脸色一下子白了。他盯着那行字，手指微微发抖。

<span class="sys">"这封信……陈老师也收到过。"</span>

他说，陈明远出事前两天曾经来找过他，关上办公室门，问学校董事会最近有没有异常的采购和仓库租赁。吴校长当时以为他在多管闲事，还训了他几句。

<span class="sys">"他临走前说，如果他出事，让我别相信校董会，也别相信巡捕房第一时间给出的结论。"</span>

吴校长摘下眼镜，用手背擦了擦额头的汗。

<span class="sys">"沈先生，我不是好人。我怕事。但陈老师……他不是自杀。"</span>`,
    effect: (s) => { E.addClue('吴校长补充证词', '陈明远死前曾向吴校长求助，提到校董会采购和仓库租赁异常'); E.addItem('校董会采购线索', '吴校长承认陈明远曾追问校董会采购与仓库租赁。'); },
    choices: [
      { text: '📖 要求看陈老师的办公室', goto: 'ch3_school_office' },
      { text: '💬 继续问学校异常', goto: 'ch3_school_weird' },
    ],
  },

  ch3_wu_present_photo: {
    title: '举证 · 三人合影',
    text: () => `你把三人合影推到吴校长眼前。

照片上，陈明远、苏晚亭和陆小姐站在光华小学门口。吴校长只看了一眼，就把视线移开了。

<span class="sys">"这个陆小姐……我见过。她来学校找过董事会的人，不是找陈老师。"</span>

你问是哪位董事。

吴校长犹豫很久，终于低声说出一个名字：<b>傅启元</b>。光华小学董事会秘书，常年和法租界公董局来往。

<span class="sys">"她说是来谈翻译合同。我当时信了。现在想想，她进出学校，根本没人登记。"</span>`,
    effect: (s) => { E.addClue('陆小姐与校董会', '陆小姐曾以翻译合同名义接触光华小学董事会秘书傅启元'); E.addContact('傅启元'); },
    choices: [
      { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
      { text: '🔙 整理线索', goto: 'ch3_wrapup' },
    ],
  },

  ch3_school_chen_su: {
    title: '陈老师与苏晚亭',
    text: () => `你拿出苏晚亭的照片给吴校长看。

<span class="sys">"这个女孩子，你认识吗？"</span>

吴校长一看照片，表情就变了。<span class="sys">"她……她来过。陈老师出事前一个星期，她来过学校几次，说是陈老师的朋友。"</span>

<span class="sys">"她来做什么？"</span>

<span class="sys">"说是来借书。陈老师藏书很多，尤其是教育类的。她说她在写论文，需要参考资料。我也没多想。"</span>

<span class="sys">"陈老师出事后，她还来过吗？"</span>

吴校长摇了摇头。<span class="sys">"没有。再也没来过。"</span>

你没有告诉他苏晚亭失踪的事。`,
    effect: (s) => { E.addClue('苏晚亭与陈明远', '失踪前多次来学校找陈老师借书'); E.setFlag('chen_su_link', true); },
    choices: [
      { text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' },
      { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
    ],
  },

  ch3_school_weird: {
    title: '学校的异常',
    text: () => `你问吴校长，最近学校有没有什么不寻常的事。

他犹豫了一下。

<span class="sys">"有两件事……我不知道有没有关系。"</span>

<span class="sys">"第一件。陈老师出事前三天，有人看到他在操场上跟一个人在吵架。天已经黑了，看不清是谁，但听声音是个女人。"</span>

<span class="sys">"第二件。沈玉芳老师——她在陈老师出事前一个星期就不来上课了。请了病假，但一直没回来。我派人去她家看过，门锁着，没有人。她是教数学的，一直很负责……突然不来，不太正常。"</span>

沈玉芳——沈玉兰的妹妹。她也失踪了。`,
    effect: (s) => { E.addClue('陈老师与女子争吵', '出事前三天；沈玉芳同时请假失踪'); },
    choices: [
      { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
    ],
  },

  ch3_school_office: {
    title: '陈老师的办公室',
    text: () => `吴校长带你来到一楼拐角的一间办公室。门上贴着"陈明远老师"的名牌，已经有些褪色。

办公室已经被收拾过了——书架上空了一大半，桌面干净得像没人用过一样。

但你还是发现了一些东西。

在书桌最底层的抽屉里，有一个夹层——你摸到了。撬开夹层，里面有一个牛皮纸信封。

信封里装着三样东西：

<b>一、</b>一张当票——"永昌当铺 · 民国三十七年九月 · 押：翡翠镯一只 · 洋三百元"。

<b>二、</b>一封没有寄出的信。开头是："晚亭吾爱……"

<b>三、</b>一张黑白照片——陈老师、苏晚亭，还有一个穿旗袍的女人。三个人站在一座教堂前。那个女人你在茶楼见过——沈玉兰。`,
    effect: (s) => { E.addClue('陈老师遗物', '当票、给苏晚亭的信、三人合影'); E.addClue('陈老师给苏晚亭的信', '"晚亭吾爱"开头——两人关系不一般'); E.addItem('永昌当票', '民国三十七年九月，押翡翠镯一只，洋三百元。'); E.addItem('未寄出的信', '陈明远写给苏晚亭的信，开头是"晚亭吾爱"。'); E.setFlag('got_chen_evidence', true); },
    choices: [
      { text: '📩 看那封信的内容', goto: 'ch3_chen_letter' },
      { text: '🔙 整理线索，准备结案', goto: 'ch3_wrapup' },
    ],
  },

  ch3_chen_letter: {
    title: '一封未寄出的信',
    text: () => `你展开信纸。陈老师的字迹方正而清秀：

<span class="sys">"晚亭吾爱：

写这封信的时候，我的手在发抖。

那晚你看到的事——请你无论如何不要说出去。不是为了我，是为了你。那些人不是你能招惹的。

我跟你说过，有些事知道得越少越安全。你当时没有听进去。现在你知道了，我唯一的愿望就是你能平安离开这个旋涡。

不要来找我。也不要相信任何人——包括你最亲近的人。

我已经做好了最坏的打算。但如果我出了什么事，请你记住：我在薛华立路 22 号 203 室留了一些东西。那里面有全部的真相。

永别了。

明远
民国三十七年十月"</span>

这封信没有寄出去——陈明远写完这封信后不久就"坠楼"了。而苏晚亭拿到了这封信——她正是按照信中的指示，去了薛华立路 22 号。`,
    effect: (s) => { E.addClue('陈明远的信', '让苏晚亭去薛华立路22号203取真相；暗示有人要灭口'); E.addItem('陈明远的信', '信里写着薛华立路 22 号 203 室有全部真相，并提醒苏晚亭不要相信任何人。'); E.setFlag('read_letter', true); },
    choices: [
      { text: '🔙 案件脉络已经清晰了', goto: 'ch3_wrapup' },
    ],
  },

  ch3_wrapup: {
    title: '线索整理',
    time: {d:2, h:11, m:30},
    weather: 3,
    text: (s) => {
      const clues = s.clues.map(c => `• ${c.name}：${c.desc}`).join('\n');
      return `你在办公室里坐了一会儿，把所有线索串起来。

目前掌握的证据：

${clues || '暂时还没有关键线索。'}

现在你掌握的信息足够去追查真相了。但关键人物陆小姐已经失踪，黑衣男人身份不明，陈老师死了，苏晚亭和沈玉芳都下落不明。

你还有最后一个地方可以去——或者你已经想明白了，可以直接去结案。`;
    },
    choices: (s) => {
      const opts = [];
      if (E.getFlag('got_case_file') && !E.getFlag('got_wang_note')) opts.push({ text: '📎 回巡捕房追查王巡官的批注', goto: 'ch2_police_wang' });
      if (!E.getFlag('found_yufang') && !E.getFlag('missed_deadline')) opts.push({ text: '⛵ 去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
      if (E.canDeduce('deduce_chen') && !E.getFlag('deduced_chen') && !E.getFlag('deduced_wrong')) {
        opts.push({ text: '🧩 拼合线索——推理陈明远之死', effect: (s) => { E.openDeduction('deduce_chen'); } });
      }
      if (E.canDeduce('deduce_lu_zhao') && E.getFlag('deduced_chen') && !E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_lu_zhao_fail')) {
        opts.push({ text: '🧩 推理——黑衣男人与陆小姐的关系', effect: (s) => { E.openDeduction('deduce_lu_zhao'); } });
      }
      if (E.canDeduce('deduce_fusheng') && E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_fusheng') && !E.getFlag('deduced_fusheng_fail')) {
        opts.push({ text: '🧩 推理——福生仓与公董局的真相', effect: (s) => { E.openDeduction('deduce_fusheng'); } });
      }
      if (E.getFlag('deduced_fusheng') && E.getFlag('rescued_yufang') && !E.getFlag('missed_deadline') && !E.getFlag('hidden_end_unlocked')) {
        opts.push({ text: '🌟 完整拼图——直指法租界幕后', effect: (s) => { E.setFlag('hidden_end_unlocked', true); }, goto: 'end_conspiracy_detail' });
      }
      opts.push({ text: '🏛️ 去当铺——查当票上的翡翠镯', goto: 'ch4_pawnshop' });
      opts.push({ text: '🔙 回顾所有证据，做出推断', goto: 'ch4_conclusion' });
      return opts;
    },
  },

  // —— 终章 ——
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
      { text: '🏮 回访周明远——让他看看翡翠镯', goto: 'ch4_revisit_zhou' },
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

周明远坐在一堆校样中间，眼睛里全是血丝。看到你进来，他立刻站起身。

<span class="sys">"沈先生，有晚亭的消息了吗？"</span>

你没有立刻回答。你知道有些东西，比一句"还没有"更有用。

如果你手里有能触动他的物件，现在可以出示。`,
    choices: [
      { text: '🔙 暂时不打扰他，回去整理证据', goto: 'ch4_conclusion' },
    ],
  },

  ch4_zhou_present_jade: {
    title: '举证 · 翡翠镯',
    text: () => `你把翡翠镯放在周明远面前。

他起初只是茫然地看着。可当他看到内侧刻着的"陆念"两个字时，脸色忽然变了。

<span class="sys">"晚亭提过这个名字。"</span>

他说，苏晚亭失踪前一个月，曾经半开玩笑地问他：如果一个人换了名字，过去犯过的错是不是也能一笔勾销。周明远当时以为她在说论文里的女性人物，没有追问。

<span class="sys">"她还说过，陆念这个名字很好听，像是把一个人从旧日子里念回来。"</span>

周明远把镯子推回给你，声音发哑。

<span class="sys">"沈先生，晚亭不是自己走的。她是在替别人守秘密。"</span>`,
    effect: (s) => { E.addClue('周明远识出陆念', '苏晚亭失踪前曾提过"陆念"这个名字，说明她早已知道陆小姐真名'); E.addClue('苏晚亭守秘', '周明远判断苏晚亭不是离开，而是在替别人守秘密'); },
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
      { text: '📁 把现有材料交给巡捕房，暂时结案', goto: 'end_archive' },
      { text: '🔍 推理——指出真凶是陆小姐', goto: 'end_boss_lu' },
      { text: '🔍 推理——指出真凶是黑衣男人（赵先生）', goto: 'end_boss_zhao' },
      { text: '🔍 推理——真凶是吴校长', goto: 'end_boss_wu' },
      { text: '🕯️ 不急着抓人，先追苏晚亭和沈玉芳的下落', when: (s) => E.getFlag('rescued_yufang') && E.getFlag('deduced_fusheng') && !E.getFlag('missed_deadline'), goto: 'end_conspiracy_detail' },
      { text: '🕯️ 追查被转走的人质', when: (s) => E.getFlag('missed_deadline'), goto: 'end_too_late' },
      { text: '🔍 推理——这是一个更大的阴谋，牵涉多方势力', goto: 'end_conspiracy' },
    ],
  },

  // ===== 结局 =====
  end_too_late: {
    title: '结局 · 迟到一步',
    time: {d:3, h:0, m:20},
    weather: 5,
    text: () => `你沿着福生仓留下的车辙继续追下去。

车辙在苏州河边断了。码头工说，半夜有一艘小货船离岸，船上装了几个木箱，也像是带了人。

老孙托人查了船号。登记簿上写的是空船，船主栏是假的。公董局码头处的人说没见过。

你知道这是谎话。

沈玉芳被转走了。苏晚亭也可能在同一条线上。你手里的证据比以前更多，但人已经不在原地。

三天后，《申报》刊出一则很小的消息：苏州河下游发现一具女尸，身份不明。你赶过去看，幸好不是苏晚亭，也不是沈玉芳。

但这并没有让你轻松多少。

你把福生仓的纸灰、货运单和那半张蓝封纸角锁进抽屉。你知道幕后的人还在上海，也知道这条线还会继续吞人。

只是这一次，你晚了一步。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局六 · 迟到一步 ——</div>`,
    type: 'end',
  },

  end_archive: {
    title: '结局 · 无声归档',
    text: () => `你没有继续追下去。

材料被装进牛皮纸袋，交到巡捕房老孙的桌上。老孙翻了几页，抬头看你，像是想说什么，最后只是把烟按灭在瓷缸里。

<span class="sys">"沈先生，这些东西……够写一份报告，不够抓人。"</span>

三天后，苏晚亭失踪案被改成"自行离沪，去向不明"。陈明远坠楼案仍然维持自杀结论。沈玉芳的名字没有出现在任何正式卷宗里。

周明远来找过你一次。他没有责怪你，只是问：<span class="sys">"她真的自己走了吗？"</span>

你没有回答。

很多年后，你在旧箱底翻到那张照片。照片上的女学生仍然年轻，仍然倔强，仍然看着镜头之外的某个地方。

你突然想起那晚窗外的雾。

有些案子不是破不了，是被人轻轻合上了。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局零 · 无声归档 ——</div>`,
    type: 'end',
  },

  deduc_success: {
    title: '推理 · 拼图合拢',
    weather: 0,
    effect: (s) => { E.setFlag('deduced_chen', true); E.addClue('推理结论：陈明远被灭口', '他发现了陆念薇潜伏在法租界的真实身份，选择了沉默——但沉默没有换来安全。'); },
    text: () => `你把所有线索摊在桌上。

恐吓信、当票、薛华立路203室的笔记本、苏晚亭的眼泪、陈明远不敢寄出的信……

它们指向同一个方向。

<b>陈明远发现了陆念薇的真实身份。</b>那个住在薛华立路、自称法文翻译的女人，是一个在逃的通缉犯——五年前在杭州犯下诈骗案，改名换姓逃到上海，在法租界的灰色地带重操旧业。

陈明远没有报警。他给了她一条生路。

但他的善良没有换来同样的善意。陆念薇用一封恐吓信让他闭嘴——永久地。

而苏晚亭，因为陈明远在出事前把所有真相都告诉了她，成了下一个目标。

窗外的雨不知什么时候停了。夜雾从法租界的街道上缓缓升起，像一层薄薄的纱。

你点燃一支烟，看着烟雾在灯下飘散。

你已经触摸到了真相的形状。现在剩下的，是决定怎么收场。`,
    choices: [
      { text: '🔙 带着这个判断继续调查', goto: 'ch3_wrapup' },
    ],
  },

  deduc_fail: {
    title: '推理 · 岔路',
    weather: 0,
    effect: (s) => { E.setFlag('deduced_wrong', true); },
    text: () => `你盯着桌上的证据看了很久。

这些碎片缺了一块最重要的——你还不能确定陈明远为什么必须死。是陆小姐？还是另有其人？

你的直觉说这件事背后还有更多你没有看到的东西。也许回到巡捕房查一查福生仓那条线，或者再去一趟薛华立路，会有新的发现。

你收起桌上的证据。调查还没有结束。`,
    choices: [
      { text: '🔙 继续调查', goto: 'ch3_wrapup' },
    ],
  },

  // ── 推理节点 二层 ──
  deduc_lu_zhao_ok: {
    title: '推理 · 暗线浮出',
    weather: 4,
    effect: (s) => { E.setFlag('deduced_lu_zhao', true); E.addClue('推理结论：黑衣男是巡捕房暗线', '他受法租界高层指使，名义上替沈玉兰查案，实际在监视陆小姐与学校的联系。'); },
    text: () => `你把沈玉兰的证词和薛华立路的监视记录放在一起。

黑衣男人——赵先生——他根本不是沈玉兰请的普通侦探。他是巡捕房的人，或者说，是法租界高层安插的一条暗线。

沈玉兰付他一百大洋查妹妹的下落，他每次都敷衍说"有进展"，其实他的目光一直盯着薛华立路22号——盯着陆小姐。

而陆小姐——陆念薇——她在法租界做的那些事，巡捕房不是不知道，是有人不让动她。因为她的上线，牵涉到公董局的人。

赵先生的出现，说明上面有人开始动摇了。他们想查清楚陆念薇到底知道多少，但她背后的人也不是吃素的。

这就是为什么王巡官会在卷宗上写"别信公董局来的电话"——调查还没开始，就已经有人在压了。

你把这些暗线理清楚之后，一片更大的棋盘在你眼前浮现。

苏晚亭和沈玉芳，不过是棋盘边缘不小心碰倒的两枚棋子。`,
    choices: [
      { text: '🔙 带着这个判断继续调查', goto: 'ch3_wrapup' },
    ],
  },

  deduc_lu_zhao_fail: {
    title: '推理 · 暗线模糊',
    weather: 4,
    effect: (s) => { E.setFlag('deduced_lu_zhao_fail', true); },
    text: () => `你把沈玉兰的话和薛华立路的线索放在一起，总觉得哪里对不上。

黑衣男人去找陆小姐，沈玉兰雇他查妹妹——这两件事可能有关，也可能只是时间上的巧合。

你决定不急着下判断，先收集更多证据。`,
    choices: [
      { text: '🔙 继续调查', goto: 'ch3_wrapup' },
    ],
  },

  // ── 推理节点 三层 ──
  deduc_fusheng_ok: {
    title: '推理 · 棋局',
    weather: 5,
    effect: (s) => { E.setFlag('deduced_fusheng', true); E.addClue('推理结论：法租界利益链', '有人利用光华小学做掩护走私，陈老师和沈玉芳无意中发现后被灭口。'); },
    text: () => `王巡官留下的那半张烟盒纸上写着："福生仓，三日清；别信公董局来的电话。"

福生仓——法租界码头边上的一个仓库。光华小学的校产登记册上，有一批"教具"最后送到了福生仓。而福生仓的租户，是公董局一个副秘书长的远亲。

你终于看清楚了。

光华小学不只是一所小学。有人利用学校作为掩护，通过教具采购和校产租赁的渠道，在法租界码头上做走私生意。陈明远发现了这件事——不是有意调查，而是他值夜那天晚上，亲眼看到有人在教学楼里搬运东西。

他被灭口了。

沈玉芳呢？她跟陈明远走得太近，可能从他那里知道了什么。她不是失踪——她是被送走了，藏在福生仓里。

而陆念薇，是这条利益链上的中间人。她负责联络、收钱、处理"麻烦"。

法租界的霓虹灯下，光鲜体面的公董局大楼里，有人在夜色中数着不干净的钱。`,
    choices: [
      { text: '🔙 推演完毕', goto: 'ch3_wrapup' },
    ],
  },

  deduc_fusheng_fail: {
    title: '推理 · 无从下手',
    weather: 5,
    effect: (s) => { E.setFlag('deduced_fusheng_fail', true); },
    text: () => `你盯着王巡官留下的纸条看了很久。"福生仓，三日清"——你知道这几个字一定有分量，但你手上的证据还不足以把它们跟整个案子联系起来。

也许你需要亲自去一趟福生仓。`,
    choices: [
      { text: '🔙 继续调查', goto: 'ch3_wrapup' },
    ],
  },

  // ── 苏州河新场景 ──
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

  // ── 结局 ──
  end_boss_lu: {
    title: '结局 · 面具之下',
    text: () => `你断定陆小姐是真凶。

她假扮翻译住在薛华立路，接近陈明远和苏晚亭，掌握他们的秘密，然后用恐吓信逼迫陈明远自杀。苏晚亭发现了真相——所以陆小姐也让她"消失"了。

你把推理写成了报告，第二天交给了巡捕房。老孙看了你的报告，沉默了很久。

他派人去搜薛华立路 22 号 203 室。陆小姐的房间——人已经不在了，但他们在墙角的暗格里发现了一本详细的账本，记录了三年来的每一笔交易——敲诈、勒索、替人"处理麻烦"。

陆小姐——真名<b>陆念薇</b>——五年前因为一桩诈骗案被通缉，改名换姓逃到上海。她在法租界底层摸爬滚打，最终成了一个游走于灰色地带的"解决问题的人"。

陈明远发现了她的真实身份。他没有報警——反而给了她一次机会让她离开。但她没有走。她选择让陈明远"闭嘴"。

至于苏晚亭……
老孙的人在一个废弃的码头仓库里找到了她。还活着，但已经被关了一个星期，瘦了很多，眼神有些涣散。

她被救出来的时候，说的第一句话是：<span class="sys">"他死了，是不是？"</span>

她没有说"他"是谁。

三个月后，陆念薇在杭州被抓获。审讯中她对一切供认不讳。被判了十五年。

苏晚亭离开了上海。周明远收到了一封信，没有署名，没有地址。信上只有三个字：

<span class="sys">"对不起。"</span>

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局一 · 面具之下 ——</div>`,
    type: 'end',
  },

  end_boss_zhao: {
    title: '结局 · 提线木偶',
    text: () => `你的推理指向黑衣男人——赵先生。

他才是这一切的核心。陆小姐不过是他的下线。陈明远发现了赵先生的非法生意（利用学校做掩护，进行违禁品交易），准备举报。赵先生派人威胁陈明远——但陈明远不从。

于是陈明远"坠楼"了。

苏晚亭知道得太多了——陈明远在出事前把一切都告诉了她。她去找陆小姐（赵先生的同伙），想求她帮忙。但陆小姐通知了赵先生。

你把自己的推理整理成一份详细的报告，交给了老孙。老孙看完后默不作声地点了点头。

一周后，赵先生在虹口的一个出租屋里被捕了。他确实是个老手——十年前在北平吃过大案，逃到上海后改名换姓，干起了更隐蔽的勾当。

但苏晚亭……

老孙的人找到了她的遗体。在苏州河下游，被水泡了不知道多少天。法医鉴定是溺亡——但身上有捆绑的痕迹。

你没有告诉她母亲。你让周明远去的。

周明远后来寄了一封信给你——信很短：

<span class="sys">"谢谢你，沈先生。至少我们知道她在哪了。"</span>

你把那张照片——苏晚亭在光启公园的那张——放进了抽屉的最深处。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局二 · 提线木偶 ——</div>`,
    type: 'end',
  },

  end_boss_wu: {
    title: '结局 · 师者',
    text: () => `你认定吴校长才是幕后真凶。

光华小学表面是一所正常的学校，实际上吴校长利用学校作为一个中转站，帮法租界的走私团伙转运货物。陈明远发现了这件事，准备告发。

吴校长先下手为强——伪造了遗书，制造了自杀假象。苏晚亭因为从陈明远处知道了内情，也被逼失踪。

但你的推理有一个漏洞——吴校长有不在场证明。陈明远坠楼那晚，吴校长在参加一个教育系统的晚宴，有三十个人作证。

你重新审视证据时发现——那张当票和恐吓信，全是指向吴校长的，太刻意了。像是有人故意留下这些线索，就是要你查到他。

你沿着这条线追查下去，发现了一个更大的秘密——真正的幕后操纵者是学校董事会的一个人，跟法租界高层有密切往来。吴校长不过是替罪羊。

当你想继续追查的时候，老孙敲开了你的门。

<span class="sys">"沈先生，这个案子到此为止吧。"</span>

他把一份公文放在你桌上——上面有法租界公董局的公章。<span class="sys">"光华小学案——已办结。不得再查。"</span>

你明白这是什么意思。在法租界，有些线是不能碰的。

苏晚亭的家人在闸北收到了一笔钱——匿名，整整两千大洋。足够苏母治病和养老了。

案子结了——以另一种方式。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局三 · 师者 ——</div>`,
    type: 'end',
  },

  end_rescue: {
    title: '结局 · 雨夜灯火',
    text: () => `你没有急着写报告。

陈明远的信、沈玉芳仓促离开的办公桌、陆念那只被当掉的翡翠镯、王巡官留下的半张烟盒纸——这些线索放在一起，指向的不是一个可以立刻逮捕的人，而是一条正在转移人质的暗线。

你把那张烟盒纸摊在桌上，盯着其中一行字看了很久：<span class="sys">"福生仓 · 三日清"</span>。

福生仓在苏州河边，早就废弃了。你带着老孙和两个信得过的巡捕赶到时，天正下雨，仓库里只有一盏煤油灯。

灯下坐着两个女人。

苏晚亭还活着。沈玉芳也还活着。

她们被关在一起，手腕上有绳痕，脸色苍白，但眼神还没有散。苏晚亭认出你的时候，第一句话不是问自己能不能回家，而是问：

<span class="sys">"陈老师……是不是已经死了？"</span>

你点了点头。

沈玉芳闭上眼，像是终于撑不住了。她告诉你，陈明远发现学校董事会有人借校产转运违禁品，陆念薇是中间人，赵先生负责收尾。苏晚亭撞见了交易，沈玉芳想帮陈明远留下证据，结果三个人都被卷了进去。

陆念薇跑了，赵先生也跑了。但这一次，他们没来得及灭口。

两个月后，苏晚亭离开上海。她临走前托周明远给你送来一封信，信里只有一句话：

<span class="sys">"沈先生，谢谢你先找人，而不是先找凶手。"</span>

你把那封信夹进案卷最里层。

案子没有真正结束。但那一夜，至少有两盏灯没有灭。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局五 · 雨夜灯火 ——</div>`,
    type: 'end',
  },

  end_conspiracy_detail: {
    title: '结局 · 雨夜灯火',
    time: {d:2, h:23, m:0},
    weather: 0,
    effect: (s) => { E.setFlag('hidden_end', true); },
    text: () => `所有的碎片都拼上了。<br><br>陈明远发现光华小学的走私勾当——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关在福生仓。<br>陆念薇是中间人——她不是主谋，她上面还有人。<br>黑衣男人是巡捕房的暗线——有人想查这条线，但查不动。<br><br>而福生仓里的货，和公董局的公文纸——它们指向同一个方向。<br><br>你没有去找巡捕房。<br>你写了一封信——不是报案信，是一封私人信件。收信人是《申报》的副总编辑，你认识他。你把所有证据的副本随信附上。<br><br>三天后，《申报》头版刊登了一篇报道：《法租界光华小学教具箱暗藏走私通道，两教师一死一失踪》。<br><br>报道没有点名公董局的人，但所有的描述都足够让人对号入座。<br><br>又过了三天，福生仓被查封。公董局那位副秘书长以"健康原因"辞职。<br><br>一个月后，你收到了一封信，没有署名。<br><br><span class="sys">"沈先生：晚亭已平安。她让我代她向你说一声谢谢。另外，那条线上的人，不止一个。但你能做到的，已经比大多数人多了。——孙"</span><br><br>你把信折好，放进口袋。<br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局七 · 雨夜灯火（隐藏结局）——</div>`,
    type: 'end',
  },

  end_conspiracy: {
    title: '结局 · 迷雾未尽',
    text: (s) => {
      let extra = '';
      if (E.getFlag('read_letter')) extra += '\n\n你把陈老师的信又看了一遍。你意识到他说的"全部的真相"可能不只是这一桩案子的真相——而是涉及更大层面的事。';
      if (E.getFlag('sister_case')) extra += '\n\n而沈玉兰的妹妹沈玉芳的失踪，显然与这个案子有关。天知道她发现了什么。';
      return `你没有急于指认任何一个凶手。因为你觉得——这件事没有这么简单。

陈明远的死、苏晚亭的失踪、沈玉芳的失踪、陆小姐的潜逃、黑衣男人的神秘现身、玉扳指、当票、恐吓信、法租界公董局的介入、巡捕房的敷衍……

所有线索像一张蛛网，而你只看到了其中的几根丝。${extra}

你做了一个决定——不结案。

你把自己的调查结果分成了三份。一份留给自己，一份寄给了香港《大公报》的一个记者朋友，一份锁在了银行的保险柜里。

然后你坐等。

你等了两个月。没有动静。

第七十三天的深夜，你的事务所被人翻了一遍。什么都没丢。但有人在你桌上留下一张字条——用印刷体写的：

<span class="sys">"你很聪明。别太聪明。"</span>

你知道你猜对了。你也知道自己该收手了。

苏晚亭的案子没有被正式结案。档案存在巡捕房的柜子里，落满了灰。

但有一件事是好的——春天的时候，你收到了一张没有署名的明信片。寄自杭州西湖。正面是"三潭印月"的风景照。

背面只有一行字——是女人的笔迹：

<span class="sys">"我还活着。谢谢。"</span>

你没有回信。你把明信片收进了抽屉里。

跟那张学生装的照片放在了一起。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局四 · 迷雾未尽 ——</div>`;
    },
    type: 'end',
  },

};
