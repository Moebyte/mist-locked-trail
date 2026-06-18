// ===== 前期结局连贯性清理 =====
// 目标：前期结局不是“系统判失败”，而是一个看似能写进案卷的表层答案。
// 规则：
// 1) 前期结案页不再用开发者式“证据不足”压玩家，而是呈现案卷正在形成的几种写法。
// 2) 前期冒然指认结局不得反向剧透后期真相。
// 3) 《吾爱晚亭》仍作为残信+疑似遗书路线的特殊错误收束；若苏家线确认周怀安婚约，则该收束被反证挡住。
// 4) 三个错误指认必须有各自前置证据；学校办公室固定产出的当票/合影只能作弱材料，不能单独开启陆小姐方向。

(function installEarlyEndingContinuityPolish() {
  function applyEarlyEndingContinuityPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__earlyEndingContinuityPolishPatched) return;

    function hasThing(name) {
      return E.hasClue?.(name) || E.hasItem?.(name) || E.getFlag?.(name);
    }

    function hasWitness() {
      return E.getFlag('found_yufang') || E.getFlag('rescued_yufang') || E.getFlag('found_su_at_dock') || E.getFlag('rescued_su');
    }

    function hasAlteredPacket() {
      return E.getFlag('chen_letter_packet_altered') || E.hasItem?.('陈明远残信') || E.hasItem?.('苏晚亭疑似遗书');
    }

    function knowsZhouFianceFromSuHome() {
      if (typeof E.knowsZhouFianceFromSuHome === 'function') return E.knowsZhouFianceFromSuHome();
      return E.getFlag('su_mother_knows_zhou_fiance') || E.hasClue?.('苏母知道周怀安婚约') || E.hasClue?.('为情而去说法存疑');
    }

    function canOfferWuaiWanting() {
      return hasAlteredPacket() && !knowsZhouFianceFromSuHome();
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

    function hasSchoolCommonLuMaterial() {
      return hasThing('永昌当票') || hasThing('陈老师遗物') || hasThing('三人合影');
    }

    function hasExternalLuCorroboration() {
      return hasThing('杭州旧案剪报')
        || hasThing('陆念薇旧名')
        || hasThing('陆小姐身份线索')
        || hasThing('203 室烧毁照片')
        || hasThing('203 室恐吓信')
        || hasThing('恐吓信')
        || hasThing('陆小姐的笔记')
        || hasThing('周怀安识出陆念')
        || hasThing('翡翠镯');
    }

    function hasLuAccuseBasis() {
      // 光华小学办公室每次都能拿到当票/合影，它们只能说明“陆小姐可疑”。
      // 陆小姐错误指认必须再有学校外部印证：203、旧名、剪报、笔记、翡翠镯实物等。
      return hasSchoolCommonLuMaterial() && hasExternalLuCorroboration();
    }

    function hasZhaoAccuseBasis() {
      // 赵先生方向必须来自学校外的行动线，不能靠光华小学统一线索凭空生成。
      const zhao = hasThing('跟踪黑衣男人') || hasThing('黑衣男人线索') || hasThing('黑衣男人') || hasThing('鸿运茶楼') || hasThing('黑衣男人姓赵') || E.getFlag('deduced_lu_zhao');
      const motive = hasThing('沈玉兰的妹妹') || hasThing('沈玉芳') || hasThing('沈玉芳请假失踪') || hasThing('推理结论：黑衣男是暗线');
      return zhao && motive;
    }

    function hasWuAccuseBasis() {
      // 吴校长方向是“学校内部材料解释不了外部世界”时最容易出现的表层归因。
      // 它不需要 203/旧名等外部印证，恰恰因为缺外部印证，玩家更容易把学校当成秘密本身。
      const school = E.getFlag('school_incomplete_closure') || E.getFlag('school_truth_partial_only') || hasThing('光华小学箱子异常') || hasThing('光华小学采购疑点') || hasThing('吴校长补充证词') || hasThing('光华小学不完整结论');
      const pressure = hasThing('三人合影') || hasThing('陈明远的信') || hasThing('陈明远残信') || hasThing('陈明远的退缩') || hasThing('推理结论：陈明远被灭口');
      return school && pressure;
    }

    function accusationChoices() {
      const out = [];
      if (hasLuAccuseBasis()) {
        out.push({ text: '🔍 陆小姐——203、旧名和当票都能指向她', goto: 'end_boss_lu' });
      }
      if (hasZhaoAccuseBasis()) {
        out.push({ text: '🔍 赵先生——黑衣男人与沈玉芳这条线能指向他', goto: 'end_boss_zhao' });
      }
      if (hasWuAccuseBasis()) {
        out.push({ text: '🔍 吴校长——学校口径最能把事情压下去', goto: 'end_boss_wu' });
      }
      return out;
    }

    function knownPiecesText() {
      const pieces = [];
      if (E.getFlag('deduced_chen') || E.hasClue?.('推理结论：陈明远被灭口')) pieces.push('陈明远之死不像自杀');
      if (E.hasClue?.('203 室恐吓信') || E.hasClue?.('恐吓信')) pieces.push('203 室留下过威胁');
      if (E.hasClue?.('三人合影') || E.hasItem?.('三人合影')) pieces.push('苏晚亭、陆小姐和陈老师曾在光华小学同框');
      if (E.hasItem?.('永昌当票')) pieces.push('陈老师办公室里那张当票把陆小姐的影子引向当铺');
      if (E.hasClue?.('苏晚亭日记残页') || E.hasItem?.('日记残页')) pieces.push('苏晚亭曾主动靠近学校里的秘密');
      if (E.hasClue?.('光华小学箱子异常')) pieces.push('学校后楼的箱子不像普通教具');
      if (hasAlteredPacket() && knowsZhouFianceFromSuHome()) pieces.push('残信和疑似遗书像在诱导“为情而去”，但苏家的婚约证词让这个说法站不稳');
      else if (hasAlteredPacket()) pieces.push('残信和疑似遗书给出一种“为情而去”的说法');
      return pieces.length ? pieces.join('；') : '陈明远、苏晚亭、陆小姐和光华小学之间有几条未接上的线';
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__earlyContinuityPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        if (!isEarlyClosure()) return typeof oldText === 'function' ? oldText(state) : oldText;
        const acc = accusationChoices();
        const romanceLine = canOfferWuaiWanting()
          ? '一种把案子写成私情与逃离，'
          : hasAlteredPacket()
            ? '那封疑似遗书本来能把案子写成私情与逃离，但苏家线让这个说法露出了破绽；'
            : '';
        const accuseLine = acc.length
          ? `${romanceLine}一种把责任压到某个最容易被现有证据指到的人身上，还有一种只是把材料封起来，承认你还没走到雾的深处。`
          : `${romanceLine}还有一种只是把材料封起来，承认你还没走到雾的深处。现在的材料甚至还不足以稳稳指向某个责任人。`;
        return `你回到事务所，把材料一件件摊开。<br><br>窗外的雾贴着玻璃，像有人把整座城的边界都擦淡了。<br><br>现在能写进案卷的东西并不少：${knownPiecesText()}。<br><br>可这些材料仍然没有把苏晚亭带回来，也没有把学校背后的那层关系完全摁到纸面上。<br><br>桌上的线索正在形成几种不同的写法：${accuseLine}<br><br>你知道，无论选哪一种，都不是完整答案。只是有些答案，比继续追下去更容易被人接受。`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        if (!isEarlyClosure()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = [];
        if (canOfferWuaiWanting()) {
          out.push({ text: '🏮 带着残信和疑似遗书去见周怀安', goto: 'ch4_revisit_zhou' });
        }
        if (hasAlteredPacket() && knowsZhouFianceFromSuHome()) {
          out.push({ text: '🏮 暂不把疑似遗书交给周怀安——苏家的说法对不上', goto: 'ch4_conclusion' });
        }
        out.push({ text: '📁 承认线索只到这里，暂时归档', goto: 'end_archive' });
        if (accusationChoices().length) {
          out.push({ text: '⚠️ 把现有材料压成一份指认', goto: 'ch4_accuse' });
        }
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
        const acc = accusationChoices();
        if (!acc.length) {
          return `你把现有材料重新排了一遍。<br><br>每一条线都还只是半截，连一个最容易承受案卷的人都指不稳。<br><br>现在不是指认的时候。你只能暂时归档，或者回去继续看线索。`;
        }
        return `你把现有材料重新排了一遍。<br><br>有些名字已经被线索照到，但光照得很偏。它们能支撑一份表层指认，却支撑不起完整真相。<br><br>如果一定要把案子写成“有人该负责”，你只能选择那个最能承受现有证据的人。<br><br>这不是破案，更像是在雾里给案卷找一个能落下去的名字。`;
      };
      nodes.ch4_accuse.choices = function (state) {
        if (!isEarlyClosure()) return typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = accusationChoices();
        out.push({ text: '🔙 不急着指认，回去整理证据', goto: 'ch4_conclusion' });
        return out;
      };
      nodes.ch4_accuse.__earlyContinuityPatched = true;
    }

    function patchEarlyEnding(nodeId, title, body) {
      const node = nodes[nodeId];
      if (!node || node.__earlyEndingTextPatched) return;
      node.text = () => `${body}<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · ${title} ——</div>`;
      node.__earlyEndingTextPatched = true;
    }

    patchEarlyEnding('end_boss_lu', '面具之下', `你把案卷写成了一个关于陆小姐的故事。<br><br>203 室、旧名、当票、合影——这些线索足够让她成为最容易被写进去的人。<br><br>报告送出去以后，所有人都松了一口气。因为这份说法把陈明远之死、苏晚亭失踪和光华小学的阴影，都收进了一个女人的旧身份里。<br><br>可你知道，案卷里仍有太多空白：学校后楼的箱子没有说清，黑衣男人的来意没有说清，那些沉默的人也没有真正开口。<br><br>这份报告可以成立。<br><br>但它没有把雾拨开。`);

    patchEarlyEnding('end_boss_zhao', '提线木偶', `你把案卷写成了一个关于赵先生的故事。<br><br>黑衣男人、跟踪、沈玉兰的妹妹——这些线索足够让他成为最像操盘者的人。<br><br>报告里，他成了牵线的人，成了那些校外阴影的名字。<br><br>可你知道，案卷里仍有太多空白：光华小学为什么沉默，陈明远为什么恐惧，苏晚亭为什么一定要追下去。<br><br>这份报告能让许多人点头。<br><br>但它没有让真相完整。`);

    patchEarlyEnding('end_boss_wu', '师者无声', `你把案卷写成了一个关于吴校长的故事。<br><br>学校、箱子、沉默、那间办公室里的迟疑——这些线索足够让他成为最能承受责任的人。<br><br>报告里，光华小学成了所有秘密的中心，吴校长成了最该开口却始终闭嘴的人。<br><br>可你知道，案卷里仍有太多空白：校外那些人为什么能进出学校，陈明远究竟碰到了什么，苏晚亭又追到了哪里。<br><br>这份报告能把事情压住。<br><br>但它没有真正结束。`);

    E.__earlyEndingContinuityPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyEarlyEndingContinuityPolish);
})();
