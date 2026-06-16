// ===== 启动与玩法增强 =====
function applyGameplayImprovements() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  E.presentOnce = function (item, itemName, flag) {
    if (item && item.name === itemName && !this.getFlag(flag)) {
      this.setFlag(flag, true);
      return true;
    }
    return false;
  };

  const oldSetTime = E.setTime.bind(E);
  E.setTime = function (day, hour, minute) {
    const next = { day: day ?? 1, hour: hour ?? 14, minute: minute ?? 0 };
    const current = this.timeToMinutes(this.state.inGameTime || { day: 1, hour: 14, minute: 0 });
    const target = this.timeToMinutes(next);
    if (target < current) {
      this.state.atmosphere = this.renderAtmosphere();
      return false;
    }
    oldSetTime(next.day, next.hour, next.minute);
    return true;
  };

  E.deadlinePhase = function () {
    const left = this.minutesUntilDeadline();
    if (left < 0) return 'expired';
    if (left < 180) return 'critical';
    if (left < 600) return 'tight';
    return 'safe';
  };

  E.deadlinePhaseLabel = function () {
    return ({ safe: '时间充裕', tight: '时间吃紧', critical: '只够救人', expired: '迟到一步' })[this.deadlinePhase()];
  };

  E.routeDockByPressure = function () {
    const phase = this.deadlinePhase();
    if (phase === 'expired') {
      this.setFlag('missed_deadline', true);
      return 'ch4_dock_cleared';
    }
    if (phase === 'critical') return 'ch4_dock_rescue_only';
    if (phase === 'tight') return 'ch4_dock_limited_search';
    return 'ch4_dock_full_search';
  };

  E.routeDockDeepByPressure = function () {
    const phase = this.deadlinePhase();
    if (phase === 'expired') {
      this.setFlag('missed_deadline', true);
      return 'ch4_dock_cleared';
    }
    if (phase === 'critical') return 'ch4_dock_deep_rescue_only';
    if (phase === 'tight') return 'ch4_dock_deep_trace';
    return 'ch4_dock_deep_dual';
  };

  E.truthFragmentText = function () {
    const parts = [];
    if (this.hasClue('杭州旧案剪报')) parts.push('烧毁的杭州剪报');
    if (this.hasClue('翡翠镯')) parts.push('刻着“陆念”的翡翠镯');
    if (this.hasClue('看门人证词')) parts.push('看门人说她常在深夜出入');
    if (this.hasClue('陆小姐的笔记')) parts.push('203室笔记边缘的“光华——陈——对不起”');
    return parts.length ? parts.join('、') : '你手里那些还不完整的碎片';
  };

  function chainPresent(nodeId, handler) {
    const node = nodes[nodeId];
    if (!node) return;
    const oldHandler = node.onPresent;
    node.onPresent = function (item, s) {
      const oldResult = typeof oldHandler === 'function' ? oldHandler(item, s) : null;
      return oldResult || handler(item, s);
    };
  }

  nodes.ch2_univ_paper = {
    title: '论文草稿',
    text: () => `你翻看苏晚亭的论文稿纸。<br><br>她的字很漂亮，英文流畅，批注逻辑清晰——确实是一个好学生的水准。但你注意到一些奇怪的东西。<br><br>有几页稿纸的背面有铅笔写的草稿，像是某种清单：<br><br><span class="sys">"法租界 · 薛华立路 22 号"</span><br><span class="sys">"周三下午三点"</span><br><span class="sys">"不要告诉任何人"</span><br><br>另外，在她的牛津字典里夹着一张书签——不是普通书签，是一张法租界的地图。地图上用铅笔圈了一个位置：<b>薛华立路 22 号</b>。<br><br>你正要合上字典，却发现书脊里还夹着一张撕下来的日记残页。纸边被揉皱了，像是写完又后悔，最后还是留下了：<br><br><span class="sys">"陈先生说，有些门打开以后，就不能假装没看见。可他自己却在怕。我第一次看见一个大人怕成那样。不是怕死，是怕害了别人。<br><br>他让我别再去光华。我答应了。可是如果我不去，沈老师怎么办？陆小姐又怎么办？她看起来像坏人，可她说话的时候，眼睛里全是求救。<br><br>我不敢告诉明远。他会让我报警。可我知道，有些电话打出去，先到的未必是巡捕。"</span><br><br>这不是线索簿里的冷字句，而是苏晚亭自己的声音。你第一次感觉到：她不是被卷进去的，她是自己走进了雾里。`,
    effect: () => {
      E.addClue('法租界地图', '薛华立路 22 号被圈出');
      E.addClue('铅笔清单', '薛华立路 22 号，周三下午三点，不要告诉任何人');
      E.addClue('苏晚亭日记残页', '她知道陈明远害怕，也知道沈玉芳和陆小姐都被卷进光华小学的秘密');
      E.addItem('法租界地图', '夹在牛津字典里的书签地图，薛华立路 22 号被铅笔圈出。');
      E.addItem('铅笔清单', '写在论文稿背面的轻淡字迹：薛华立路 22 号、周三下午三点、不要告诉任何人。');
      E.addItem('日记残页', '苏晚亭夹在牛津字典里的残页：她决定继续追查光华小学的秘密。');
    },
    choices: [{ text: '🔙 差不多了，去下一站', goto: 'ch2_leave_univ' }]
  };

  nodes.ch2_203_search = {
    title: '搜查 203',
    text: () => `你快速但仔细地搜查了房间。<br><br>在枕头底下，你找到了一张照片——是三个人的合影：两个年轻女人和一个男人。背景是一所学校的大门，你能看到校牌上写着"光华小学"。<br><br>其中一个女人你认出来了——就是苏晚亭。另一个应该就是陆小姐。而那个男人……三十多岁，戴眼镜，文质彬彬。<br><br>照片背面写着：<span class="sys">"陈老师 · 晚亭 · 我 · 民国三十六年春"</span><br><br>在抽屉里，你还找到了一封信，没有封口。信纸只有一行字：<br><br><span class="sys">"我知道那晚你看到了什么。如果你不说，他们下一个就是你。——一个知情者"</span><br><br>你把抽屉整个抽出来，木板底部露出一层黑灰。有人曾在这里烧过东西。灰烬里剩下半张剪报，边缘卷曲，只能辨认出几个字：<br><br><span class="sys">"杭州……女嫌犯……陆念……诈骗案……在逃……"</span><br><br>剪报旁边还有一小片照片背纸，上面写着一个旧名字：<span class="sys">"陆念薇"</span>。<br><br>这不是完整答案，却足够让你知道：陆小姐不是第一次换名字。`,
    effect: () => {
      E.addClue('三人合影', '苏晚亭、陆小姐、陈老师的合影');
      E.addClue('恐吓信', '"如果你不说，他们下一个就是你"');
      E.addClue('杭州旧案剪报', '203室灰烬中残留半张剪报，能辨认出“杭州”“陆念”“诈骗案”“在逃”等字样');
      E.addItem('三人合影', '苏晚亭、陆小姐、陈老师在光华小学门前的合影。');
      E.addItem('恐吓信', '没有署名的信：如果你不说，他们下一个就是你。');
      E.addItem('烧毁的剪报', '203室抽屉暗格里的半张剪报，提到杭州旧案和陆念薇。');
      E.state.chapter = 3;
    },
    choices: [{ text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' }]
  };

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

  nodes.deduc_success = {
    title: '推理 · 拼图合拢',
    weather: 0,
    effect: () => {
      E.setFlag('deduced_chen', true);
      E.addClue('推理结论：陈明远被灭口', '陈明远发现光华小学教具箱背后的走私链，因留下证据而被灭口');
    },
    text: () => `你把所有线索摊在桌上。<br><br>恐吓信、当票、薛华立路203室的笔记本、苏晚亭的日记残页、陈明远不敢寄出的信……<br><br>它们指向的不是一个单纯的情杀，也不是一个教师的自杀。<br><br><b>陈明远撞见了光华小学的“教具箱”。</b>他曾经沉默，后来留下证据，于是被人灭口。<br><br>至于陆小姐，你现在能确定的还不是完整档案，而是几个互相咬合的碎片：${E.truthFragmentText()}。<br><br>这些碎片说明，她的“陆小姐”身份很可能是假的；“陆念薇”这个名字，也许才是通往旧案的钥匙。<br><br>你已经触摸到了真相的形状。但还缺一块：福生仓。`,
    choices: [{ text: '🔙 带着这个判断继续调查', goto: 'ch3_wrapup' }]
  };

  nodes.deduc_lu_zhao_ok = {
    title: '推理 · 暗线浮出',
    weather: 4,
    effect: () => {
      E.setFlag('deduced_lu_zhao', true);
      E.addClue('推理结论：黑衣男是暗线', '黑衣男人不是普通侦探，他在监视陆念薇和光华小学之间的联系');
    },
    text: () => `你把沈玉兰的证词、薛华立路的监视记录和陆念薇的旧案碎片放在一起。<br><br>黑衣男人——赵先生——不是沈玉兰请来的普通侦探。他当然拿了她的钱，但他的目光一直不在沈玉芳身上，而在陆念薇身上。<br><br>他盯的是陆念薇知道多少，盯的是她会不会把上面的人拖下水。<br><br>陆念薇不是最上面的人。她更像一个被旧案拴住的中间人：替人联络，替人收钱，也替人处理“麻烦”。<br><br>王巡官在卷宗边缘写下“别信公董局来的电话”，说明调查还没真正开始，压力就已经从上面落下来了。`,
    choices: [{ text: '🔙 带着这个判断继续调查', goto: 'ch3_wrapup' }]
  };

  nodes.deduc_fusheng_ok = {
    title: '推理 · 棋局',
    weather: 5,
    effect: () => {
      E.setFlag('deduced_fusheng', true);
      E.addClue('推理结论：法租界利益链', '有人利用光华小学教具采购掩护管制药品走私，傅启元与公董局线索相互咬合');
    },
    text: () => `王巡官留下的那半张烟盒纸上写着："福生仓，三日清；别信公董局来的电话。"<br><br>福生仓不是普通仓库。光华小学名义上的“教具采购”，最后被送到那里；陈明远信里提到的药瓶、针剂和军用纱布，也指向那里。<br><br>你终于看清楚了。<br><br>有人利用学校作为干净招牌，把战时管制药品藏进“粉笔”和“地球仪”的名义里，再从法租界码头转出去。<br><br>陈明远不是因为知道陆念薇的旧名而死。他死于更危险的东西：他看见了这条链是怎么运转的。<br><br>沈玉芳从他那里知道了一部分真相。苏晚亭又从沈玉芳和陈明远那里知道了另一部分。<br><br>所以她们都必须消失。`,
    choices: [{ text: '🔙 推演完毕', goto: 'ch3_wrapup' }]
  };

  if (nodes.ch4_suzhou_creek) {
    delete nodes.ch4_suzhou_creek.time;
    nodes.ch4_suzhou_creek.cost = { h: 0, m: 45, reason: '你赶往苏州河废弃码头' };
    nodes.ch4_suzhou_creek.text = () => {
      const phase = E.deadlinePhase();
      const intro = {
        safe: '你提前赶到苏州河，福生仓仍在装货，门口还有人影往来。',
        tight: '你赶到时暮色已深，福生仓外的货车正在加紧装箱。',
        critical: '你赶到时只剩最后一辆货车，仓库深处仍有细微声响。',
        expired: '你赶到时仓库已经清空，只剩车辙、草绳和纸灰。'
      }[phase];
      return `${intro}<br><br><span class="sys">王巡官写过：福生仓，三日清。现在是：${E.deadlinePhaseLabel()}。</span>`;
    };
    nodes.ch4_suzhou_creek.choices = () => {
      if (E.deadlinePhase() === 'expired') return [
        { text: '🕯️ 检查清空后的仓库', goto: 'ch4_dock_cleared' },
        { text: '🔙 回事务所整理线索', goto: 'ch3_wrapup' }
      ];
      return [
        { text: '🕵️ 先绕到后门观察换班', goto: 'ch4_dock_watch' },
        { text: '⚠️ 趁雾直接潜入仓库', effect: () => E.addHeat(1, '冒险行动让码头风险升高。'), goto: () => E.routeDockByPressure() },
        { text: '🚓 先找老孙支援', goto: 'ch4_dock_wait' },
        { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
      ];
    };
  }

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

  const wrap = nodes.ch3_wrapup;
  if (wrap && typeof wrap.choices === 'function') {
    const oldChoices = wrap.choices;
    wrap.choices = function (s) {
      const opts = oldChoices(s) || [];
      const canAskSun = !E.getFlag('sun_support_available') && !E.getFlag('missed_deadline') && (E.hasItem('福生仓地址') || E.hasItem('半张烟盒纸') || E.hasClue('王巡官遗留纸条') || E.hasClue('福生仓位置'));
      if (canAskSun) opts.unshift({ text: '🚓 去巡捕房找老孙商量福生仓', goto: 'ch4_sun_support' });
      return opts;
    };
  }

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

  chainPresent('ch4_dock_who', (item) => {
    if (E.presentOnce(item, '三人合影', 'presented_photo_to_yufang')) return { goto: 'ch4_yufang_present_photo' };
    if (E.presentOnce(item, '陈明远的信', 'presented_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    if (E.presentOnce(item, '未寄出的信', 'presented_unsent_letter_to_yufang')) return { goto: 'ch4_yufang_present_letter' };
    return null;
  });

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

  if (nodes.ch4_conclusion) {
    const oldConclusionChoices = nodes.ch4_conclusion.choices;
    nodes.ch4_conclusion.text = () => {
      const strength = E.caseStrength();
      const suStatus = E.getFlag('rescued_su')
        ? '苏晚亭已经被你从福生仓救出。她还很虚弱，但终于有了自己的声音。'
        : E.getFlag('su_moved_from_dock')
          ? '你没有救出苏晚亭，但你找到了她曾被关在福生仓的直接证据。她刚被转走不久。'
          : E.getFlag('su_trace_only')
            ? '你只找到了苏晚亭的手表。她是否还活着，仍然压在你心口。'
            : '苏晚亭在哪，她是否还活着，仍是案子的核心问题。';
      return `你回到自己的事务所，把所有材料铺在桌上。<br><br>窗外灯火初上，法租界的霓虹灯在夜雾中晕成一片暧昧的光。<br><br>事情的脉络你已经大致摸清了——陈明远不是自杀，光华小学的教具箱不是教具，陆念薇不是主谋，傅启元也不只是一个名字。<br><br><b>${suStatus}</b><br><br>你翻开线索簿，给当前案情写下四个字：<b>${strength.name}</b>。<br><br>${strength.desc}<br><br>你要怎么结这个案？`;
    };
    nodes.ch4_conclusion.choices = oldConclusionChoices;
  }

  nodes.end_conspiracy_detail = {
    title: '结局 · 黎明灯火',
    time: { d: 2, h: 23, m: 0 },
    weather: 0,
    effect: () => E.addClue('结局已解锁', '隐藏结局已解锁'),
    text: () => {
      const suLine = E.getFlag('rescued_su')
        ? '苏晚亭在医院醒来后，亲手写下了她在福生仓听见的名字：傅启元。'
        : '苏晚亭仍在转移途中，但她留在福生仓的学生证和字条，足以证明她不是自行离沪。';
      return `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关在福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>${suLine}<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》头版刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。<br><br>报道第一次点出了傅启元的名字。<br><br>又过了三天，福生仓被查封。傅启元以“协助调查”的名义被带走。公董局没有承认任何事，但他们也没能让这件事完全消失。<br><br>一个月后，你收到一封信。信上只有一行字：<br><br><span class="sys">"沈先生，谢谢你先找人，而不是先找凶手。——苏晚亭"</span><br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局九 · 雨夜灯火（隐藏结局）——</div>`;
    },
    type: 'end'
  };

  nodes.end_rescue = {
    title: '结局 · 黎明灯火',
    text: () => `你没有急着写报告。<br><br>你先把人送去了医院。<br><br>沈玉芳在病床上睡了整整一天。苏晚亭如果被你从福生仓带出，也一直到第二天清晨才真正醒来。她醒来后的第一句话仍是：<br><br><span class="sys">"陈老师……他是不是已经死了？"</span><br><br>你点了点头。<br><br>她没有哭。只是把脸转向窗外，过了很久才说：<span class="sys">"那就别让他白死。"</span><br><br>陆念薇跑了，赵先生也跑了，傅启元仍然会找办法把自己洗干净。但这一次，他们没来得及灭口。<br><br>两个月后，苏晚亭离开上海。她临走前托周怀安给你送来一封信，信里只有一句话：<br><br><span class="sys">"沈先生，谢谢你先找人，而不是先找凶手。"</span><br><br>案子没有真正结束。但那一夜，至少有两盏灯没有灭。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局八 · 黎明灯火 ——</div>`,
    type: 'end'
  };
}

document.addEventListener('DOMContentLoaded', () => {
  applyGameplayImprovements();
  E.init();
});
