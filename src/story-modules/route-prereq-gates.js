// ===== 主线路径前置条件 =====
// 目标：把“福生仓入口”和“沈玉芳施救识别”拆成两个独立门槛。
// 1) 王巡官纸条负责解锁福生仓入口。
// 2) 薛华立路/沈玉兰线负责让玩家知道沈玉芳这条人质线；否则即使进入仓库，也不会找到暗室。
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
          } else if (!out.some(c => (c.text || c.fogText || '').includes('旧仓太多'))) {
            out.push({
              text: '⛵ 去苏州河废弃码头查福生仓',
              goto: 'ch4_suzhou_creek',
              when: () => false,
              fogText: '🌫️ 苏州河边旧仓太多，还找不到福生仓',
              fogHint: '你还缺那半张能指向福生仓的纸。也许老孙知道王巡官留下了什么。'
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
        text: () => `你知道苏晚亭和光华小学之间有一条暗线，却还没有拿到王巡官留下的那半张纸。<br><br>没有<span class="sys">“福生仓，三日清”</span>这几个字，苏州河边的旧仓库太多，贸然去找只会把时间耗光。<br><br>这时去苏州河，只会在一排排旧仓库之间白白耗掉时间。你必须先去巡捕房，问清王巡官调离前到底留下了什么。`,
        choices: [
          { text: '📋 回巡捕房追问王巡官留下了什么', goto: 'ch2_police' },
          { text: '🔙 先回去把手头线索再摊一遍', goto: 'ch3_wrapup' }
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

    if (!nodes.ch4_dock_no_darkroom) {
      nodes.ch4_dock_no_darkroom = {
        title: '福生仓 · 搜查断线',
        weather: 5,
        effect: () => {
          E.setFlag('yufang_context_missing_at_dock', true);
          E.addHeat(1, '你在仓库里耽搁太久，却没有找到真正关人的地方。');
          E.addClue('福生仓搜查断线', '你进入福生仓后只找到货箱、蓝封纸角和清场痕迹；因没有追到沈玉芳线，没有发现暗室');
        },
        text: () => `你把仓库前后搜了一遍。<br><br>木箱、货运单、蓝封纸角、临时搬空的车辙——这些都说明福生仓不是普通仓库。可除此之外，仓库深处只有潮气和霉味。<br><br>你没有听见敲击声，也没有想到这里会被人改出一间暗室。<br><br>如果你之前见过沈玉兰，知道她有个妹妹沈玉芳也失踪在这条线上，也许你会把“仓库”当成关人的地方来查。可现在，你只把它当成转运点。<br><br>等你意识到这里可能还藏着活人时，外面的脚步声已经近了。`,
        choices: [
          { text: '📦 把货运单和蓝封纸角收好，先撤出去', goto: 'ch3_wrapup' },
          { text: '🔍 回事务所，把几个人的关系重新摊开', goto: 'ch4_conclusion' }
        ]
      };
    }

    function patchDockSearchNode(nodeId, textWithoutContext, choicesWithoutContext) {
      const node = nodes[nodeId];
      if (!node || node.__routePrereqNoYufangSearchPatched) return;
      const oldText = node.text;
      const oldChoices = node.choices;
      node.text = function (state) {
        if (hasWangFushengLead() && !knowsYufangForRescue()) return textWithoutContext(state);
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };
      node.choices = function (state) {
        if (hasWangFushengLead() && !knowsYufangForRescue()) return choicesWithoutContext(state);
        return choicesOf(oldChoices, state);
      };
      node.__routePrereqNoYufangSearchPatched = true;
    }

    patchDockSearchNode(
      'ch4_dock_full_search',
      () => `你先观察换班，再从东侧窗户进入。时间尚算充裕，仓库里还有一排排标着<span class="sys">“光华小学·教学器材”</span>的木箱。<br><br>你查到了转运痕迹，却没有明确的“找人”目标。这里太大，货箱太多，潮气把细小声音全压进了木板和墙缝里。<br><br>你没有听见敲击声，也没有发现暗门。`,
      () => [
        { text: '📦 翻开教具箱，看看里面到底装了什么', goto: 'ch4_dock_crates' },
        { text: '🔍 再往仓库深处摸一段', goto: 'ch4_dock_no_darkroom' }
      ]
    );

    patchDockSearchNode(
      'ch4_dock_limited_search',
      () => `仓库已经搬走一半。你只能抢下蓝封纸角和几张货运单。<br><br>你知道这里有问题，却不知道这里还可能关着人。仓库深处一片死寂，只有外面搬货的脚步声越来越近。<br><br>没有沈玉芳这条线，你不会把那些旧木箱后面的夹墙当成重点。`,
      () => [
        { text: '📦 冒险翻开旁边的教具箱', goto: 'ch4_dock_crates' },
        { text: '🔍 再往仓库深处摸一段', goto: 'ch4_dock_no_darkroom' }
      ]
    );

    patchDockSearchNode(
      'ch4_dock_rescue_only',
      () => `货箱大多已经搬空，外面的车随时会走。<br><br>你赶到得太晚，又没有沈玉芳这条人质线作指引。眼前只剩清场痕迹和残留纸灰。你能判断这里是转运点，却找不到它真正用来藏人的地方。`,
      () => [
        { text: '🔍 抢时间再往仓库深处找一遍', goto: 'ch4_dock_no_darkroom' }
      ]
    );

    if (nodes.ch4_dock_crates && !nodes.ch4_dock_crates.__routePrereqNoYufangCratesPatched) {
      const oldChoices = nodes.ch4_dock_crates.choices;
      nodes.ch4_dock_crates.choices = function (state) {
        if (hasWangFushengLead() && !knowsYufangForRescue()) {
          return [
            { text: '📦 躲进空木箱，等守卫过去', goto: 'ch4_dock_hide' },
            { text: '🔍 把货运单塞进怀里，继续往深处找', goto: 'ch4_dock_no_darkroom' }
          ];
        }
        return choicesOf(oldChoices, state);
      };
      nodes.ch4_dock_crates.__routePrereqNoYufangCratesPatched = true;
    }

    if (nodes.ch4_dock_locked_door && !nodes.ch4_dock_locked_door.__routePrereqNoYufangLockedDoorPatched) {
      const oldText = nodes.ch4_dock_locked_door.text;
      const oldChoices = nodes.ch4_dock_locked_door.choices;
      nodes.ch4_dock_locked_door.text = function (state) {
        if (hasWangFushengLead() && !knowsYufangForRescue()) return nodes.ch4_dock_no_darkroom.text(state);
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };
      nodes.ch4_dock_locked_door.choices = function (state) {
        if (hasWangFushengLead() && !knowsYufangForRescue()) return nodes.ch4_dock_no_darkroom.choices;
        return choicesOf(oldChoices, state);
      };
      nodes.ch4_dock_locked_door.__routePrereqNoYufangLockedDoorPatched = true;
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
          if (!knowsYufangForRescue()) return 'ch4_dock_no_darkroom';
          return oldRouteDockDeepByPressure();
        };
      }
      E.__routePrereqRoutePatched = true;
    }

    E.__routePrereqGatesPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyRoutePrereqGates);
})();
