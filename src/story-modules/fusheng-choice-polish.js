// ===== 福生仓选项与结局收口 =====
// 目标：收束福生仓后段选项，并让同一结局按实际路线显示不同文案。
(function installFushengChoicePolish() {
  function applyFushengChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

    const escapeNode = nodes.ch4_dock_escape;
    if (escapeNode && !escapeNode.__fushengChoicePolishPatched) {
      function fullSupportAtDock() {
        return E.getFlag('sun_full_support')
          || E.getFlag('sun_wait_support')
          || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
      }

      const oldChoices = escapeNode.choices;
      escapeNode.choices = function (state) {
        const choices = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(choices)) return [];
        if (!fullSupportAtDock()) return choices;

        return choices.filter(choice => {
          const text = choice.text || '';
          return !(choice.goto === 'ch4_fu_confront'
            && text.includes('老孙的人')
            && text.includes('亮明身份'));
        });
      };

      escapeNode.__fushengChoicePolishPatched = true;
    }

    const titleMap = [
      ['end_refuse', '雨声不停', '雨不停'],
      ['end_archive', '无声归档', '无声归档'],
      ['end_too_late', '迟到一步', '迟到一步'],
      ['end_boss_lu', '面具之下', '面具之下'],
      ['end_boss_zhao', '提线木偶', '提线木偶'],
      ['end_boss_wu', '师者无声', '师者'],
      ['end_conspiracy', '迷雾未尽', '迷雾未尽'],
      ['end_rescue', '黎明灯火', '黎明灯火']
    ];

    function patchEndingTitle(nodeId, title, legacyFooterTitle) {
      const node = nodes[nodeId];
      if (!node || node.__fourCharTitlePatched) return;
      node.title = `结局 · ${title}`;
      if (typeof node.text === 'function' && legacyFooterTitle && legacyFooterTitle !== title) {
        const oldText = node.text;
        node.text = (state) => String(oldText(state)).replace(new RegExp(`结局([一二三四五六七八九十]+) · ${legacyFooterTitle}`, 'g'), `结局$1 · ${title}`);
      }
      node.__fourCharTitlePatched = true;
    }

    for (const [nodeId, title, legacyFooterTitle] of titleMap) {
      patchEndingTitle(nodeId, title, legacyFooterTitle);
    }

    const hiddenEnding = nodes.end_conspiracy_detail;
    if (hiddenEnding && !hiddenEnding.__routeAwareLetterPatched) {
      hiddenEnding.title = '结局 · 雨夜灯火';
      hiddenEnding.text = () => `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关在福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>苏晚亭在医院醒来后，亲手写下了她在福生仓听见的名字：傅启元。<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》头版刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。<br><br>报道第一次点出了傅启元的名字。<br><br>又过了三天，福生仓被查封。傅启元以“协助调查”的名义被带走。公董局没有承认任何事，但他们也没能让这件事完全消失。<br><br>一个月后，周怀安替苏晚亭送来一封信。信上只有一行字：<br><br><span class="sys">"沈先生，谢谢你先找人，而不是先找凶手。——苏晚亭"</span><br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局九 · 雨夜灯火（隐藏结局）——</div>`;
      hiddenEnding.__routeAwareLetterPatched = true;
    }

    if (!nodes.end_conspiracy_trace) {
      nodes.end_conspiracy_trace = {
        title: '结局 · 雾后回声',
        time: { d: 2, h: 23, m: 0 },
        weather: 0,
        effect: () => E.addClue('结局已解锁', '隐藏结局已解锁：雾后回声'),
        text: () => `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关在福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>你没有把苏晚亭从福生仓救出来。你找到的，是她曾被关在那里、又被匆忙转走的证据：学生证、半张字条，以及来不及擦干净的痕迹。<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》头版刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。<br><br>报道第一次点出了傅启元的名字。<br><br>又过了三天，福生仓被查封。傅启元以“协助调查”的名义被带走。公董局没有承认任何事，但他们也没能让这件事完全消失。<br><br>一个月后，周怀安来找你。<br><br>他说，苏晚亭后来被人从转移线上救回，但伤得很重，暂时不能露面，也不能写信。她没有见过你，只知道有人把福生仓这条线捅到了光下。<br><br>周怀安把帽檐压得很低，只留下一句话：<br><br><span class="sys">"她还活着。至于谢意，等她真正安全那天，再让她自己说吧。"</span><br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局十 · 雾后回声（隐藏结局）——</div>`,
        type: 'end'
      };
    }

    if (!E.__splitHiddenEndingResolverPatched && typeof E.v07ResolveEnding === 'function') {
      const oldResolver = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        const quality = this.v07InvestigationQuality();
        if (this.getFlag('missed_deadline')) return 'end_too_late';
        if (quality.score >= 10 && this.getFlag('rescued_yufang') && this.getFlag('rescued_su')) return 'end_conspiracy_detail';
        if (quality.score >= 10 && this.getFlag('rescued_yufang') && this.getFlag('su_moved_from_dock')) return 'end_conspiracy_trace';
        return oldResolver();
      };
      E.__splitHiddenEndingResolverPatched = true;
    }

    const wrapupNode = nodes.ch3_wrapup;
    if (wrapupNode && !wrapupNode.__hiddenRouteResolverPatched) {
      const oldChoices = wrapupNode.choices;
      wrapupNode.choices = function (state) {
        const choices = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(choices)) return [];
        return choices.map(choice => {
          if (choice.goto === 'end_conspiracy_detail' && choice.text && choice.text.includes('完整拼图')) {
            return { ...choice, goto: () => E.v07ResolveEnding() };
          }
          return choice;
        });
      };
      wrapupNode.__hiddenRouteResolverPatched = true;
    }

    const mistEnding = nodes.end_conspiracy;
    if (mistEnding && !mistEnding.__routeAwarePostcardPatched) {
      mistEnding.text = () => {
        let extra = '';
        if (E.getFlag('read_letter')) extra += '\n\n你把陈老师的信又看了一遍。你意识到他说的"全部的真相"可能不只是这一桩案子的真相——而是涉及更大层面的事。';
        if (E.getFlag('sister_case')) extra += '\n\n而沈玉芳的失踪，显然与这个案子有关。天知道她发现了什么。';

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

但有一件事是好的——春天的时候，周怀安托人给你送来一张明信片。寄自杭州西湖，正面是"三潭印月"的风景照。

他说，那张明信片先寄到了他那里，没有署名，没有回信地址。背面只有一行字，是女人的笔迹：

<span class="sys">"我还活着。谢谢。"</span>

你没有问周怀安是不是认得那笔迹。他也没有说。

你只是把明信片收进了抽屉里，跟那张学生装的照片放在了一起。

你和苏晚亭从没真正见过面。可是至少这一次，你知道她没有被这片雾吞掉。

<div style="color:#666;font-style:italic;margin-top:20px">—— 结局七 · 迷雾未尽 ——</div>`;
      };
      mistEnding.__routeAwarePostcardPatched = true;
    }
  }

  document.addEventListener('DOMContentLoaded', applyFushengChoicePolish);
})();
