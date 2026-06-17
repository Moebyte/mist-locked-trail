// ===== 福生仓木箱潜伏后果 =====
// 目标：“检查教具箱 / 躲进木箱”不再只是气氛选项，而是潜入成败关键。
// 不检查教具箱就没有铁钎，只能砸锁；不躲守卫或砸锁都会触发追击。
// 砸锁/不躲会错失苏晚亭；摸到暗门后再回头找工具，则会错过两名人质。

(function installDockHideConsequencePolish() {
  function applyDockHideConsequencePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockHideConsequencePolishPatched) return;

    if (nodes.ch4_dock_full_search && !nodes.ch4_dock_full_search.__directSearchWarningPatched) {
      nodes.ch4_dock_full_search.choices = [
        { text: '📦 先检查教具箱，找能开暗门的工具', goto: 'ch4_dock_crates' },
        {
          text: '🔦 直接顺着声音找人（没有工具，可能只能砸锁）',
          effect: () => E.setFlag('skipped_crates_for_sound', true),
          goto: 'ch4_dock_locked_door'
        }
      ];
      nodes.ch4_dock_full_search.__directSearchWarningPatched = true;
    }

    if (nodes.ch4_dock_limited_search && !nodes.ch4_dock_limited_search.__directSearchWarningPatched) {
      nodes.ch4_dock_limited_search.choices = [
        { text: '📦 冒险检查教具箱，找工具和货运证据', goto: 'ch4_dock_crates' },
        {
          text: '🔦 立刻顺着声音找人（没有工具，可能只能砸锁）',
          effect: () => E.setFlag('skipped_crates_for_sound', true),
          goto: 'ch4_dock_locked_door'
        }
      ];
      nodes.ch4_dock_limited_search.__directSearchWarningPatched = true;
    }

    if (nodes.ch4_dock_crates && !nodes.ch4_dock_crates.__hideConsequenceChoicesPatched) {
      nodes.ch4_dock_crates.choices = [
        { text: '📦 躲进空木箱，等守卫过去', goto: 'ch4_dock_hide' },
        {
          text: '⚠️ 不躲了，拿上铁钎立刻去开暗门',
          effect: () => {
            E.setFlag('skipped_dock_hide', true);
            E.addHeat(2, '你没有躲避守卫，仓库里的脚步声立刻追了上来。');
          },
          goto: 'ch4_dock_guard_chase'
        }
      ];
      nodes.ch4_dock_crates.__hideConsequenceChoicesPatched = true;
    }

    nodes.ch4_dock_return_for_tool = {
      title: '福生仓 · 回头找工具',
      weather: 4,
      cost: { h: 0, m: 12, reason: '你从暗门前折回教具箱，重新寻找能撬锁的工具' },
      effect: () => {
        E.setFlag('returned_for_door_tool', true);
        E.setFlag('missed_both_due_to_return_tool', true);
        E.addHeat(2, '你从暗门前折回教具箱，最关键的救人窗口被拖过去了。');
        E.addClue('折回寻找工具', '你先顺着声音找到了暗门，但因为没有工具，只能折回教具箱找铁钎。');
        E.addClue('教具箱走私', '标着光华小学的教具箱里装的是盘尼西林、吗啡针剂和军用纱布，不是教学器材');
        E.addClue('管制药品走私', '福生仓木箱内发现战时管制药品');
        E.addItem('光华货运单', '福生仓货箱夹层里的货运单，发货名义是光华小学教学器材。');
        E.addItem('铁钎', '你从教具箱边找到一根撬箱用的铁钎。');
        E.setFlag('found_door_tool', true);
      },
      text: () => `你看着那把旧锁，终于忍住了砸门的冲动。<br><br>声音还在门后，很轻，很急。<br><br>你转身往教具箱那边折回。仓库里空得厉害，脚步声踩在木地板上，连你自己都觉得太响。<br><br>你很快撬开木箱，找到了铁钎，也看见了箱底夹着的货运单。<br><br>但等你握着铁钎往暗门赶回去时，门后的敲击声已经停了。<br><br>不是变弱。<br><br>是彻底停了。`,
      choices: [{ text: '🚪 带着铁钎赶回暗门', goto: 'ch4_dock_empty_after_return' }]
    };

    nodes.ch4_dock_empty_after_return = {
      title: '福生仓 · 空暗室',
      weather: 5,
      cost: { h: 0, m: 10, reason: '你撬开暗门后，只来得及查看被清空的暗室' },
      effect: () => {
        E.setFlag('missed_yufang_at_dock', true);
        E.setFlag('su_moved_from_dock', true);
        E.setFlag('yufang_moved_from_dock', true);
        E.setFlag('missed_both_at_dock', true);
        E.addClue('暗室刚被清空', '你折回找工具后再打开暗门，里面已经没有沈玉芳和苏晚亭，只剩刚被带走的痕迹。');
        E.addClue('沈玉芳曾在暗室', '暗室墙边有沈玉芳留下的半截粉笔和一道反复刻出的“沈”字。');
        E.addClue('苏晚亭曾在暗室', '暗室床缝里有苏晚亭的学生证和半张写给母亲的字条，她也曾被关在这里。');
        E.addItem('苏晚亭学生证', '暗室床缝里找到的学生证，边角被水泡软。');
        E.addItem('沈玉芳半截粉笔', '暗室墙边捡到的半截粉笔，旁边刻着一个反复划出的“沈”字。');
      },
      text: () => `旧锁被铁钎撬开的瞬间，门里没有喊声。<br><br>你推开暗门，只看见一间不足十平米的小房间：一张行军床，一个水桶，一盏快熄灭的煤油灯。<br><br>床还温着。水桶边倒着半只搪瓷杯。墙角有半截粉笔，旁边划着一个反复写坏的“沈”字。<br><br>你在床缝里摸到一张学生证。边角被水泡软，名字却还清楚：<b>苏晚亭</b>。<br><br>旁边压着半张字条：<span class="sys">“妈，如果我回不去，请不要怪明远。”</span><br><br>门外传来汽车发动的声音。你冲出去时，只看见雾里两道红色尾灯一闪而没。<br><br>你没有救出沈玉芳。<br><br>也没有救出苏晚亭。<br><br>这一次，真相还在，活人的声音却被你迟了一步地错过了。`,
      choices: [
        { text: '📄 带着残留证据撤出福生仓', goto: 'ch3_wrapup' }
      ]
    };

    nodes.ch4_dock_guard_chase = {
      title: '福生仓 · 守卫追击',
      weather: 5,
      cost: { h: 0, m: 18, reason: '你被守卫发现，在仓库里绕行甩开追击' },
      effect: () => {
        E.setFlag('dock_guard_chase_no_hide', true);
        E.setFlag('su_moved_due_to_chase', true);
        E.addClue('仓库守卫追击', '你没有躲进木箱，被守卫发现后绕行甩开追击，耽误了打开暗门的最佳时机。');
      },
      text: () => `你抓起铁钎，刚要往仓库深处走，手电光已经扫到木箱边缘。<br><br><span class="sys">“谁在那里？”</span><br><br>你来不及躲进木箱，只能压低身子绕过货架。脚步声从身后追来，铁门被撞得哐当作响。<br><br>你穿过一排标着“光华小学·教学器材”的木箱，险些被倒下的麻袋绊住。等你终于甩开守卫，仓库深处那阵微弱的敲击声已经停过一次。<br><br>你还来得及开暗门。<br><br>但你心里知道，刚才这十几分钟，足够他们把最不能留下的人转走。`,
      choices: [{ text: '🔦 带着铁钎，继续去找暗门', goto: 'ch4_dock_locked_door' }]
    };

    nodes.ch4_dock_break_lock_chase = {
      title: '福生仓 · 砸锁惊动守卫',
      weather: 5,
      cost: { h: 0, m: 20, reason: '你没有找到工具，只能砸锁并甩开守卫追击' },
      effect: () => {
        E.setFlag('dock_broke_lock_no_tool', true);
        E.setFlag('dock_guard_chase_no_hide', true);
        E.setFlag('su_moved_due_to_chase', true);
        E.addHeat(3, '砸锁声在仓库里炸开，守卫立刻朝暗门方向追来。');
        E.addClue('砸锁惊动守卫', '你没有检查教具箱找铁钎，只能砸锁。守卫追击耽误了时间，苏晚亭被转走。');
      },
      text: () => `你把肩膀撞上旧锁，铁锈和木屑一起落下来。<br><br>第一下，锁没开。<br><br>第二下，仓库另一头已经传来喊声：<span class="sys">“暗门那边有人！”</span><br><br>你咬牙又砸了一下，锁终于断开。可手电光已经从货架缝隙里扫过来，你只能先拖开一排木箱，绕进黑暗里。<br><br>等你甩开追上来的守卫，再回到暗门前，里面的敲击声已经变了。<br><br>不是两个人求救的声音。<br><br>只剩一个人。`,
      choices: [{ text: '🚪 推开暗门', goto: 'ch4_dock_deep_trace' }]
    };

    if (nodes.ch4_dock_locked_door && !nodes.ch4_dock_locked_door.__breakLockConsequencePatched) {
      const oldText = nodes.ch4_dock_locked_door.text;
      nodes.ch4_dock_locked_door.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.hasItem('铁钎')) return base;
        const reason = E.getFlag('skipped_crates_for_sound')
          ? '<br><br><span class="sys">你刚才直接顺着声音过来，没有检查教具箱。现在门就在眼前，但你手里没有能安静撬锁的工具。</span>'
          : '';
        return `${base}${reason}`;
      };
      nodes.ch4_dock_locked_door.choices = function () {
        if (E.hasItem('铁钎')) {
          return [{ text: '🧰 用铁钎撬开暗门', goto: () => E.routeDockDeepByPressure() }];
        }
        return [
          { text: '⚠️ 没有工具，强行砸锁开门', goto: 'ch4_dock_break_lock_chase' },
          { text: '📦 回头检查教具箱找工具（耗时，可能错过两名人质）', goto: 'ch4_dock_return_for_tool' }
        ];
      };
      nodes.ch4_dock_locked_door.__breakLockConsequencePatched = true;
    }

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__dockHideConsequenceDeepRoutePatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        if (this.getFlag('missed_both_due_to_return_tool')) return 'ch4_dock_empty_after_return';
        if (this.getFlag('dock_guard_chase_no_hide') || this.getFlag('dock_broke_lock_no_tool')) {
          this.setFlag('su_moved_due_to_chase', true);
          return 'ch4_dock_deep_trace';
        }
        return oldRouteDockDeepByPressure();
      };
      E.__dockHideConsequenceDeepRoutePatched = true;
    }

    E.__dockHideConsequencePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockHideConsequencePolish);
})();
