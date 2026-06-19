// ===== 第三章 · 光华小学 / 收束 =====
Object.assign(nodes, {
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
      { text: '🔙 回到校长办公室', goto: 'ch3_school' },
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
      { text: '🔙 回到校长办公室', goto: 'ch3_school' },
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
      { text: '🔙 回到校长办公室', goto: 'ch3_school' },
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
      { text: '🔙 回到校长办公室', goto: 'ch3_school' },
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
    text: () => `
你展开信纸。陈老师的字迹方正而清秀：

<span class="sys">"晚亭吾爱：

写这封信的时候，我的手在发抖。

十月十二日深夜，我在学校值夜。教学楼后门的锁坏了，我本想过去看看。可当我走近，月光照见两个人影——不是学生，不是工友。是两个穿黑衣服的男人，抬着一只木箱，从后门往操场走。木箱上贴着'光华小学教具'的标签，可那分量不像粉笔和尺子。他们走路的样子，像是怕惊醒什么。

我躲在冬青丛后面，大气不敢出。等他们走远，我摸到后门边，地上掉了一张纸——是出货单。上面写着'福生仓三号，教具补充，三日清'。我认得那个笔迹，是董事会傅秘书的。

晚亭，那晚你也在。你躲在图书馆的窗后，什么都看见了。你第二天跑来问我，眼睛里全是恐惧。我本该让你立刻离开上海，可我舍不得。我以为我能护住你。

现在我知道我护不住了。那些人不是我能招惹的，更不是你能招惹的。他们昨天派人来找我，左手食指上戴着一枚玉扳指，绿得发亮。他说：'陈老师，有些事看见了，就要学会看不见。'我听见他袖子里有金属的声音。

我写这封信，是因为我知道他们不会放过我。我唯一的愿望就是你能平安离开这个旋涡。不要来找我。也不要相信任何人——包括你最亲近的人。我已经把证据藏在薛华立路 22 号 203 室，枕头底下。如果你有机会，把它交给值得信任的人。

晚亭，我这一生最幸运的事，就是在光启公园的那张长椅上遇见你。你穿着学生装，捧着一本《简·奥斯汀》，阳光落在你倔强的眉梢上。那一刻我就知道，我这辈子完了。

永别了。

明远
民国三十七年十月"</span>

信纸上有干涸的水渍，像是写信时滴落的泪，又像是雨。你把它折好，收进大衣内袋。这封信没有寄出去——陈明远写完这封信后不久就"坠楼"了。而苏晚亭拿到了这封信——她正是按照信中的指示，去了薛华立路 22 号。`,
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
      const checklist = [];
      checklist.push((E.getFlag('got_wang_note') ? '✅' : '⚫') + ' 王巡官纸条');
      checklist.push((E.hasClue('三人合影') ? '✅' : '⚫') + ' 三人合影');
      checklist.push((E.getFlag('read_letter') ? '✅' : '⚫') + ' 陈老师的信');
      checklist.push((E.hasItem('翡翠镯') ? '✅' : '⚫') + ' 翡翠镯');
      checklist.push((E.getFlag('found_yufang') ? '✅' : '⚫') + ' 福生仓');
      const checklistText = checklist.join('  ');
      const phase = E.deadlinePhase ? E.deadlinePhase() : 'safe';
      const timeHint = phase === 'critical' ? '⚠️ 时间只够最后一次行动了。' : phase === 'tight' ? '⏰ 时间吃紧——苏晚亭可能撑不了太久。' : '';
      return `你在办公室里坐了一会儿，把所有线索串起来。\n\n目前掌握的证据：\n\n${clues || '暂时还没有关键线索。'}\n\n<div style="border:1px solid var(--line);padding:8px;border-radius:4px;margin:6px 0"><b>调查进度</b><br>${checklistText}</div>\n${timeHint ? timeHint + '<br>' : ''}现在你掌握的信息足够去追查真相了。但关键人物陆小姐已经失踪，黑衣男人身份不明，陈老师死了，苏晚亭和沈玉芳都下落不明。`;
    },
    choices: (s) => {
      const opts = [];
      if (E.getFlag('got_case_file') && !E.getFlag('got_wang_note')) opts.push({ text: '📎 回巡捕房追查王巡官的批注', goto: 'ch2_police_wang' });
      if (!E.getFlag('found_yufang') && !E.getFlag('missed_deadline') && (E.getFlag('got_wang_note') || E.hasClue('福生仓位置'))) opts.push({ text: '⛵ 去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
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
});
  nodes.ch3_chen_letter = {
    title: '一封未寄出的信',
    text: () => `你展开信纸。陈老师的字迹方正而清秀，但有几处墨迹洇开，像是写信的人把笔停在纸上太久。<br><br><span class="sys">"晚亭吾爱：<br><br>写这封信的时候，我的手还在发抖。<br><br>那晚我值夜，原本只是回办公室取书。可我看见傅启元的人把十几只写着‘光华小学教学器材’的箱子搬进后楼。箱子开了一角，里面不是粉笔，也不是地球仪，是药瓶、针剂和封好的军用纱布。<br><br>我本该立刻报官。可第二天，恐吓信就放在我的讲义里。信上写着：如果我多说一个字，你、沈老师，还有那些孩子，都会变成我的罪。<br><br>我承认，我怕了。我怕得像个懦夫。<br><br>后来沈老师也看见了那些箱子。她来问我，我却叫她装作不知道。那一刻我就明白，我所谓的保护，不过是把别人推到更危险的地方。<br><br>如果我出了事，不要相信学校董事会，也不要相信第一通打来的电话。薛华立路22号203室，有我留下的东西。陆念薇知道一部分真相，但她不是最上面的人。她也怕。<br><br>晚亭，别替我原谅我。<br><br>明远<br>民国三十七年十月"</span><br><br>你把信纸慢慢折回去。<br><br>陈明远不是没有选择。他选择过沉默，也选择过最后一次开口。悲剧正在于，他醒悟得太晚。`,
    effect: () => {
      E.addClue('陈明远的信', '让苏晚亭去薛华立路22号203取真相；暗示有人要灭口');
      E.addClue('陈明远的退缩', '陈明远曾因恐吓选择沉默，后来才决定留下证据');
      E.addClue('傅启元夜运教具箱', '陈明远值夜时看到傅启元的人把“教学器材”箱搬进后楼');
      E.addClue('管制药品走私', '陈明远看到教具箱里装着药瓶、针剂和军用纱布');
      E.addItem('陈明远的信', '信里写着傅启元、教具箱、管制药品和薛华立路 22 号 203 室。');
      E.setFlag('read_letter', true);
    },
    choices: [{ text: '🔙 案件脉络已经清晰了', goto: 'ch3_wrapup' }]
  };
