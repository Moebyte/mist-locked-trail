// ===== 主线路径前置条件 =====
// 目标：把“福生仓入口”和“沈玉芳施救识别”拆成两个独立门槛。
// 1) 王巡官纸条负责解锁福生仓入口。
// 2) 薛华立路/沈玉兰线负责让玩家认识沈玉芳，否则进了福生仓也无法完成施救。
(function installRoutePrereqGates() {
  function applyRoutePrereqGates() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__routePrereqGatesPatched) return;

    function hasWangFushengLead() {
      return E.getFlag('got_wang_note')
        || E.hasClue('王巡官遗留纸条')
        || E.hasItem('半张烟盒纸');
    }

    function canVisitXuehua() {
      return E.hasClue('法租界地图')
        || E.hasItem('法租界地图')
        || hasWangFushengLead();
    }

    function knowsYufangForRescue() {
      return E.getFlag('sister_case')
        || E.getFlag('talked_to_woman')
        || E.hasClue('沈玉芳')
        || E.hasClue('沈玉兰的妹妹')
        || E.hasClue('沈玉芳与陈明远');
    }

    E.hasWangFushengLead = hasWangFushengLead;
    E.canVisitXuehua = canVisitXuehua;
    E.knowsYufangForRescue = knowsYufangForRescue;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function isXuehuaChoice(choice) {
      const text = choice?.text || choice?.fogText || '';
      const goto = choice?.goto;
      return goto === 'ch2_frenchtown' || text.includes('薛华立路') || text.includes('法租界');
    }

    function filterEarlyChoices(choices) {
      if (canVisitXuehua()) return choices;
      return choices.filter(choice => !isXuehuaChoice(choice));
    }

    for (const nodeId of ['ch2_leave_home', 'ch2_leave_univ', 'ch2_police_file', 'ch2_police_alt', 'ch2_police_wang']) {
      const node = nodes[nodeId];
      if (!node || node.__routePrereqEarlyPatched) continue;
      const oldChoices = node.choices;
      node.choices = function (state) {
        return filterEarlyChoices(choicesOf(oldChoices, state));
      };
      node.__routePrereqEarlyPatched = true;
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__routePrereqFushengPatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const choices = choicesOf(oldChoices, state);
        const out = [];
        for (const choice of choices) {
          const text = choice.text || '';
          const isFushengEntry = choice.goto === 'ch4_suzhou_creek' || text.includes('苏州河废弃码头') || text.includes('福生仓');
          if (!isFushengEntry) {
            out.push(choice);
            continue;
          }
          if (hasWangFushengLead()) {
            out.push(choice);
          } else if (!out.some(c => (c.text || c.fogText || '').includes('福生仓入口未确认'))) {
            out.push({
              text: '⛵ 去苏州河废弃码头——查福生仓',
              goto: 'ch4_suzhou_creek',
              when: () => false,
              fogText: '🔒 福生仓入口未确认（需要王巡官纸条）',
              fogHint: '缺少王巡官留下的“福生仓，三日清”。先去巡捕房追问老孙。'
            });
          }
        }
        return out;
      };
      nodes.ch3_wrapup.__routePrereqFushengPatched = true;
    }

    if (!nodes.ch4_fusheng_locked_by_wang) {
      nodes.ch4_fusheng_locked_by_wang = {
        title: '福生仓 · 入口未明',
        weather: 2,
        text: () => `你知道苏晚亭和光华小学之间有一条暗线，却还没有拿到王巡官留下的那半张纸。<br><br>没有<span class="sys">“福生仓，三日清”</span>这几个字，苏州河边的旧仓库太多，贸然去找只会把时间耗光。<br><br>这条线现在锁死了。你必须先去巡捕房，问清王巡官调离前到底留下了什么。`,
        choices: [
          { text: '📋 回巡捕房追问王巡官纸条', goto: 'ch2_police' },
          { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
        ]
      };
    }

    if (nodes.ch4_suzhou_creek && !nodes.ch4_suzhou_creek.__routePrereqWangPatched) {
      const oldText = nodes.ch4_suzhou_creek.text;
      const oldChoices = nodes.ch4_suzhou_creek.choices;
      nodes.ch4_suzhou_creek.text = function (state) {
        if (!hasWangFushengLead()) return nodes.ch4_fusheng_locked_by_wang.text(state);
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };
      nodes.ch4_suzhou_creek.choices = function (state) {
        if (!hasWangFushengLead()) return nodes.ch4_fusheng_locked_by_wang.choices;
        return choicesOf(oldChoices, state);
      };
      nodes.ch4_suzhou_creek.__routePrereqWangPatched = true;
    }

    if (!nodes.ch4_dock_unknown_yufang) {
      nodes.ch4_dock_unknown_yufang = {
        title: '福生仓 · 身份断线',
        weather: 5,
        effect: () => {
          E.setFlag('yufang_identity_missed', true);
          E.addHeat(1, '你进入暗室，却没有足够的人物线索建立信任。');
          E.addClue('暗室身份断线', '你在福生仓暗室找到被关押的女教师，但因没有追到沈玉芳线，无法当场确认身份并完成施救');
        },
        text: () => `暗门后是一间不足十平米的小房间。床边蜷缩着一个穿灰旗袍的年轻女人，床上还散着学生证和半张字条。<br><br>她看见你，第一反应不是求救，而是往墙角缩。<br><br><span class="sys">“你是谁？你们又想把我带到哪里去？”</span><br><br>你能判断她与光华小学有关，却叫不出她的名字，也不知道沈玉兰是谁。没有照片，没有姐姐的托付，也没有吴校长关于沈老师的证词。<br><br>脚步声已经靠近。你意识到：你进了福生仓，却没有带着能让她相信你的那条线。现在强行带人，只会把她和你一起推到更危险的地方。`,
        choices: [
          { text: '⚠️ 无法确认身份，先带着现场证据撤出', goto: 'ch3_wrapup' },
          { text: '🔍 回事务所重新梳理人物关系', goto: 'ch4_conclusion' }
        ]
      };
    }

    if (!E.__routePrereqRoutePatched) {
      if (typeof E.routeDockByPressure === 'function') {
        const oldRouteDockByPressure = E.routeDockByPressure.bind(E);
        E.routeDockByPressure = function () {
          if (!hasWangFushengLead()) return 'ch4_fusheng_locked_by_wang';
          return oldRouteDockByPressure();
        };
      }
      if (typeof E.routeDockDeepByPressure === 'function') {
        const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
        E.routeDockDeepByPressure = function () {
          if (!hasWangFushengLead()) return 'ch4_fusheng_locked_by_wang';
          if (!knowsYufangForRescue()) return 'ch4_dock_unknown_yufang';
          return oldRouteDockDeepByPressure();
        };
      }
      E.__routePrereqRoutePatched = true;
    }

    E.__routePrereqGatesPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyRoutePrereqGates);
})();
