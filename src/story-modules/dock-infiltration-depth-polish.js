// ===== 福生仓潜入层次强化 =====
// 目标：进入福生仓后不要立刻跳到“教具箱/敲击声”二选一。
// 正确节奏：码头外围 → 东窗潜入 → 账房/封条 → 货架推进 → 木箱区 → 暗门。
// 潜入阶段增加多个 heat 坑：冒进会累积 heat，但不会单次必然失败。

(function installDockInfiltrationDepthPolish() {
  function applyDockInfiltrationDepthPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockInfiltrationDepthPolishPatched) return;

    function addHeat(n, reason, flag) {
      if (typeof E.addDockHeat === 'function') E.addDockHeat(n, reason, flag);
      else {
        E.addHeat(n, reason);
        if (flag) E.setFlag(flag, true);
      }
    }

    function addDockPaperEvidence(prefix) {
      E.addClue('公董局公文纸', `${prefix}清场指令写在公董局蓝封公文纸上`);
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
      E.setFlag('dock_clearance_seen_inside', true);
    }

    if (nodes.ch4_dock_full_search && !nodes.ch4_dock_full_search.__infiltrationDepthPatched) {
      nodes.ch4_dock_full_search.effect = () => {
        E.setFlag('dock_full_search', true);
        E.setFlag('dock_entered_by_east_window', true);
        E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
        E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      };
      nodes.ch4_dock_full_search.text = () => `你踩着废木箱，从东侧窗户翻进福生仓。<br><br>脚刚落地，木板就轻轻响了一声。你立刻伏低身子，等外面的手电光从窗框上移开。<br><br>仓库里比外面看起来更深：前面是临时账房，桌上压着蓝封公文夹；右侧是一排排货架和麻袋；更深处，才隐约传来很轻的敲击声。<br><br>你已经进来了，但还没有真正摸到核心区域。`;
      nodes.ch4_dock_full_search.choices = [
        { text: '🗂️ 先摸进临时账房查看桌上的公文夹', goto: 'ch4_dock_inner_office' },
        { text: '🚶 贴着货架慢慢往仓库深处移动', effect: () => E.setFlag('dock_moved_slowly', true), goto: 'ch4_dock_shelf_approach' },
        { text: '⚠️ 趁货架阴影，快速穿过中间通道', effect: () => addHeat(1, '你快速穿过中间通道，鞋底在木板上擦出一声轻响。', 'dock_shelf_shortcut'), goto: 'ch4_dock_shelf_approach' }
      ];
      nodes.ch4_dock_full_search.__infiltrationDepthPatched = true;
    }

    if (nodes.ch4_dock_limited_search && !nodes.ch4_dock_limited_search.__infiltrationDepthPatched) {
      nodes.ch4_dock_limited_search.effect = () => {
        E.setFlag('dock_limited_search', true);
        E.setFlag('dock_entered_by_east_window', true);
        E.addClue('福生仓位置', '苏州河下游废弃码头第三号仓库');
        E.addItem('福生仓地址', '福生仓位于苏州河下游废弃码头第三号仓库。');
      };
      nodes.ch4_dock_limited_search.text = () => `你从东侧窗户翻进去时，仓库已经搬走一半。<br><br>外面的货车还没熄火，铁链拖过地面的声音一阵一阵传进来。<br><br>前面的临时账房还亮着一盏灯，桌上有蓝封纸角；右侧货架后面，是一排标着“光华小学”的木箱。更深处传来断续敲击声。<br><br>你能做的事不多，但每一步都不能浪费。`;
      nodes.ch4_dock_limited_search.choices = [
        { text: '🗂️ 先摸进临时账房看桌上的蓝封纸', goto: 'ch4_dock_inner_office_limited' },
        { text: '🚶 贴着货架慢慢往仓库深处移动', effect: () => E.setFlag('dock_moved_slowly', true), goto: 'ch4_dock_shelf_approach_limited' },
        { text: '⚠️ 趁装车声盖住脚步，直接穿过中间通道', effect: () => addHeat(1, '你趁装车声快步穿过通道，但木箱被衣角带得晃了一下。', 'dock_shelf_shortcut'), goto: 'ch4_dock_shelf_approach_limited' }
      ];
      nodes.ch4_dock_limited_search.__infiltrationDepthPatched = true;
    }

    nodes.ch4_dock_inner_office = {
      title: '福生仓 · 临时账房',
      weather: 2,
      cost: { h: 0, m: 5, reason: '你摸进临时账房查看公文夹' },
      effect: () => addDockPaperEvidence('福生仓账房里的'),
      text: () => `临时账房只是用木板隔出来的一角。桌上压着一只蓝封公文夹，边角沾了雨水，纸页已经卷起。<br><br>你翻开最上面一页，只看见几行字：<span class="sys">“三日内清走，别留痕迹。”</span><br><br>落款没有名字，只有公董局常用的蓝封纸角。<br><br>你把这页纸收好。就在这时，货架后面传来木箱轻碰的声音。有人还在仓库里。`,
      choices: [
        { text: '🚶 放慢脚步，贴着货架继续往深处移动', effect: () => E.setFlag('dock_moved_slowly', true), goto: 'ch4_dock_shelf_approach' },
        { text: '⚠️ 不再耽搁，直接穿过账房旁的空道', effect: () => addHeat(1, '你从账房旁的空道快步穿过，门板轻轻撞了一下墙。', 'dock_inner_office_rushed'), goto: 'ch4_dock_shelf_approach' }
      ]
    };

    nodes.ch4_dock_inner_office_limited = {
      title: '福生仓 · 临时账房',
      weather: 4,
      cost: { h: 0, m: 6, reason: '你冒险摸进临时账房查看蓝封纸' },
      effect: () => addDockPaperEvidence('福生仓临时账房残留的'),
      text: () => `账房里的灯还热着，椅子被人推倒在地。<br><br>桌上只剩半张蓝封纸角，被压在墨水瓶下面。你抽出来，看见上面写着：<span class="sys">“三日内清走，别留痕迹。”</span><br><br>外面有人催促装车，脚步声离窗户越来越近。你不能在这里久留。`,
      choices: [
        { text: '🚶 贴着货架继续往深处移动', effect: () => E.setFlag('dock_moved_slowly', true), goto: 'ch4_dock_shelf_approach_limited' },
        { text: '⚠️ 把蓝封纸塞进怀里，立刻穿过空道', effect: () => addHeat(1, '你匆忙离开账房，椅脚在地上刮出一声短响。', 'dock_inner_office_rushed'), goto: 'ch4_dock_shelf_approach_limited' }
      ]
    };

    nodes.ch4_dock_shelf_approach = {
      title: '福生仓 · 货架之间',
      weather: 2,
      cost: { h: 0, m: 6, reason: '你沿着货架向仓库深处移动' },
      effect: () => E.setFlag('dock_reached_crate_area', true),
      text: () => `你贴着货架往里走。麻袋、油布和空木箱把通道切成几段，稍不留神就会碰出声响。<br><br>穿过第二排货架后，你终于看见那排标着“光华小学·教学器材”的木箱。箱盖有被撬过的痕迹，旁边散着草绳和钉子。<br><br>敲击声就在木箱后面的墙里。<br><br>现在你才真正到了仓库核心。`,
      choices: [
        { text: '📦 先检查旁边的教具箱', goto: 'ch4_dock_crates' },
        { text: '🔦 先循着敲击声去仓库深处', effect: () => addHeat(1, '你绕过木箱直接去找声音来源，脚步节奏变得急了。', 'skipped_crates_for_sound'), goto: 'ch4_dock_locked_door' },
        { text: '⚠️ 直接跨过散落草绳，抢到木箱后面', effect: () => addHeat(1, '你跨过草绳时踢到一枚钉子，声音在货架间弹了一下。', 'dock_reached_crate_area_fast'), goto: 'ch4_dock_locked_door' },
        { text: '🗂️ 回头看一眼临时账房里的公文夹', when: () => !E.getFlag('dock_clearance_seen_inside'), goto: 'ch4_dock_inner_office' }
      ]
    };

    nodes.ch4_dock_shelf_approach_limited = {
      title: '福生仓 · 货架之间',
      weather: 4,
      cost: { h: 0, m: 6, reason: '你沿着半空的货架向仓库深处移动' },
      effect: () => E.setFlag('dock_reached_crate_area', true),
      text: () => `货架已经空了一半，地上拖着新鲜车辙和草绳。<br><br>你弯腰穿过油布，听见外面有人喊“快点”。<br><br>右侧还有几只没搬走的木箱，上面仍写着“光华小学·教学器材”。更深处的敲击声断断续续，像是随时会被外面的装车声盖住。`,
      choices: [
        { text: '📦 冒险翻查旁边的教具箱', goto: 'ch4_dock_crates' },
        { text: '🔦 先循着敲击声去仓库深处', effect: () => addHeat(1, '你绕过木箱直接去找声音来源，脚步节奏变得急了。', 'skipped_crates_for_sound'), goto: 'ch4_dock_locked_door' },
        { text: '⚠️ 直接跨过散落草绳，抢到木箱后面', effect: () => addHeat(1, '你跨过草绳时踢到一枚钉子，声音在货架间弹了一下。', 'dock_reached_crate_area_fast'), goto: 'ch4_dock_locked_door' },
        { text: '🗂️ 回头看一眼账房里的蓝封纸', when: () => !E.getFlag('dock_clearance_seen_inside'), goto: 'ch4_dock_inner_office_limited' }
      ]
    };

    E.__dockInfiltrationDepthPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockInfiltrationDepthPolish);
})();
