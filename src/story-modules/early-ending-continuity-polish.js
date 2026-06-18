// ===== 前期结局连贯性清理 =====
// 目标：前期结局不是“系统判失败”，而是一个看似能写进案卷的表层答案。
// 规则：
// 1) 前期结案页不再用开发者式“证据不足”压玩家，而是呈现案卷正在形成的几种写法。
// 2) 前期冒然指认结局不得反向剧透后期真相。
// 3) 《吾爱晚亭》仍作为残信+疑似遗书路线的特殊错误收束。

(function installEarlyEndingContinuityPolish() {
  function applyEarlyEndingContinuityPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__earlyEndingContinuityPolishPatched) return;

    function hasWitness() {
      return E.getFlag('found_yufang') || E.getFlag('rescued_yufang') || E.getFlag('found_su_at_dock') || E.getFlag('rescued_su');
    }

    function hasAlteredPacket() {
      return E.getFlag('chen_letter_packet_altered') || E.hasItem?.('陈明远残信') || E.hasItem?.('苏晚亭疑似遗书');
    }

    function isEarlyClosure() {
      return !E.getFlag('deduced_fusheng')
        && !hasWitness()
        && (E.getFlag('school_incomplete_closure')
          || E.getFlag('school_truth_partial_only')
          || hasAlteredPacket()
          || E.getFlag('deduced_chen')
          || E.getFlag('deduced_lu_zhao'));
    }

    function knownPiecesText() {
      const pieces = [];
      if (E.getFlag('deduced_chen') || E.hasClue?.('推理结论：陈明远被灭口')) pieces.push('陈明远之死不像自杀');
      if (E.hasClue?.('203 室恐吓信') || E.hasClue?.('恐吓信')) pieces.push('203 室留下过威胁');
      if (E.hasClue?.('三人合影') || E.hasItem?.('三人合影')) pieces.push('苏晚亭、陆小姐和陈老师曾在光华小学同框');
      if (E.hasClue?.('苏晚亭日记残页') || E.hasItem?.('日记残页')) pieces.push('苏晚亭曾主动靠近学校里的秘密');
      if (E.hasClue?.('光华小学箱子异常')) pieces.push('学校后楼的箱子不像普通教具');
      if (hasAlteredPacket()) pieces.push('残信和疑似遗书给出一种“为情而去”的说法');
      return pieces.length ? pieces.join('；') : '陈明远、苏晚亭、陆小姐和光华小学之间有几条未接上的线';
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__earlyContinuityPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        if (!isEarlyClosure()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `你回到事务所，把材料一件件摊开。<br><br>窗外的雾贴着玻璃，像有人把整座城的边界都擦淡了。<br><br>现在能写进案卷的东西并不少：${knownPiecesText()}。<br><br>可这些材料仍然没有把苏晚亭带回来，也没有把学校背后的那层关系完全摁到纸面上。<br><br>桌上的线索正在形成几种不同的写法：一种把案子写成私情与逃离，一种把责任压到某个最容易被指认的人身上，还有一种只是把材料封起来，承认你还没走到雾的深处。<br><br>你知道，无论选哪一种，都不是完整答案。只是有些答案，比继续追下去更容易被人接受。`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        if (!isEarlyClosure()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = [];
        if (hasAlteredPacket()) {
          out.push({ text: '🏮 带着残信和疑似遗书去见周怀安', goto: 'ch4_revisit_zhou' });
        }
        out.push({ text: '📁 承认线索只到这里，暂时归档', goto: 'end_archive' });
        out.push({ text: '⚠️ 把现有材料压成一份指认', goto: 'ch4_accuse' });
        out.push({ text: '🔙 不落笔，再回去看一遍线索', goto: 'ch3_wrapup' });
        return out;
      };
      nodes.ch4_conclusion.__earlyContinuityPatched = true;
    }

    if (nodes.ch4_accuse && !nodes.ch4_accuse.__earlyContinuityPatched) {
      const oldText = nodes.ch4_accuse.text;
      const oldChoices = nodes.ch4_accuse.choices;
      nodes.ch4_accuse.text = function (state) {
        if (!isEarlyClosure()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `你把现有材料重新排了一遍。<br><br>每一条线都能指向一个人，但每一条线又都在半路断开。<br><br>如果一定要把案子写成“有人该负责”，你只能选择那个最能承受现有证据的人。<br><br>这不是破案，更像是在雾里给案卷找一个能落下去的名字。`;
      };
      nodes.ch4_accuse.choices = function (state) {
        if (!isEarlyClosure()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return [
          { text: '🔍 陆小姐——旧名、当票和203室都能指向她', goto: 'end_boss_lu' },
          { text: '🔍 赵先生——他一直在盯陆小姐和沈玉芳', goto: 'end_boss_zhao' },
          { text: '🔍 吴校长——学校口径最能把事情压下去', goto: 'end_boss_wu' },
          { text: '🔙 不急着指认，回去整理证据', goto: 'ch4_conclusion' }
        ];
      };
      nodes.ch4_accuse.__earlyContinuityPatched = true;
    }

    function patchEarlyEnding(nodeId, title, body) {
      const node = nodes[nodeId];
      if (!node || node.__earlyContinuityPatched) return;
      const oldText = node.text;
      node.title = title;
      node.text = function (state) {
        if (!isEarlyClosure()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return body();
      };
      node.__earlyContinuityPatched = true;
    }

    patchEarlyEnding('end_boss_lu', '结局 · 面具之下', () => `你把案子写成陆小姐的故事。<br><br>她的旧名、203室烧过的剪报、那只刻着“陆念”的翡翠镯，都足够让她成为案卷里最醒目的名字。<br><br>报告交上去以后，老孙没有立刻反驳。他只是问你：<span class="sys">“那苏晚亭呢？”</span><br><br>你说不出答案。<br><br>陆小姐确实有秘密，也确实在害怕。可她的秘密是不是足够解释陈明远的死、学校后楼的箱子、那封被重新压平过的信封，你没有证据。<br><br>几天后，薛华立路 22 号 203 室被查封。房间已经空了，墙角只剩一点烧过纸的黑灰。<br><br>案卷上写着：陆姓女子畏罪潜逃。<br><br>这个结论能让许多人点头，也能让巡捕房暂时合上卷宗。<br><br>只是很多年后你再想起她，想起的不是“真凶”，而是一张在雾里不断换名字的脸。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 面具之下 ——</div>`);

    patchEarlyEnding('end_boss_zhao', '结局 · 提线木偶', () => `你把案子写成赵先生的故事。<br><br>他收沈玉兰的钱，却始终盯着陆小姐；他出现在茶楼、街角和薛华立路附近，像一根看不见的线，牵着几个人往同一个方向走。<br><br>这份报告很顺。顺到老孙看完后，只问了一句：<span class="sys">“线头在他手里，还是他也被别人牵着？”</span><br><br>你没有回答。<br><br>因为你也知道，赵先生像一个能解释许多事的人，却不像能解释所有事的人。陈明远的恐惧、学校后楼的箱子、苏晚亭的去向，都还隔着一层雾。<br><br>赵先生后来消失了。有人说他去了虹口，有人说他换了名字，也有人说他从一开始就不是这个案子的真正名字。<br><br>案卷上写着：黑衣男子涉案在逃。<br><br>这不是错案里最坏的一种。它至少承认有人在拉线。<br><br>只是你始终没有看见那只手。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 提线木偶 ——</div>`);

    patchEarlyEnding('end_boss_wu', '结局 · 师者无声', () => `你把案子写成吴校长的故事。<br><br>光华小学是所有线索反复回到的地方。照片在那里，陈明远在那里，苏晚亭也在那里留下过痕迹。吴校长的沉默，足够让人相信他知道得比他说的多。<br><br>报告交到巡捕房时，老孙翻得很慢。最后他把纸放下，说：<span class="sys">“学校可以藏秘密，但学校未必就是秘密本身。”</span><br><br>你明白他的意思。<br><br>吴校长当然在遮掩。他替学校遮丑，替董事会挡风，也替自己保住体面。可他是不是能决定陈明远的死，能不能让苏晚亭从上海消失，你没有压得住的证据。<br><br>几天后，光华小学照常上课。校门口重新刷了漆，晨读声从围墙里飘出来，像什么都没有发生过。<br><br>案卷上写着：校方管理失当，另案待查。<br><br>很多人都满意这个写法。它没有抓住真相，却保住了许多人的安静。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 师者无声 ——</div>`);

    E.__earlyEndingContinuityPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyEarlyEndingContinuityPolish);
})();
