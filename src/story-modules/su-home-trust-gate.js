// ===== 苏家信任门槛 =====
// 目标：苏家不只是补叙。救苏晚亭时，需要“向苏母出示照片”换得的贴身信物，
// 并在暗室里把信物出示给苏晚亭。没有这一步，仍可找到苏晚亭，但无法成功带走她。
// 追加：苏家线可确认苏母知道周怀安是晚亭未婚夫，从而削弱“为情而去”的疑似遗书解释，避免《吾爱晚亭》误收束。
(function installSuHomeTrustGate() {
  function applySuHomeTrustGate() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__suHomeTrustGatePatched) return;

    function presentOnce(item, itemName, flag) {
      if (typeof E.presentOnce === 'function') return E.presentOnce(item, itemName, flag);
      if (item && item.name === itemName && !E.getFlag(flag)) {
        E.setFlag(flag, true);
        return true;
      }
      return false;
    }

    function markZhouFianceKnown() {
      E.setFlag('su_mother_knows_zhou_fiance', true);
      E.addClue('苏母知道周怀安婚约', '苏母知道周怀安是苏晚亭的未婚夫，也知道女儿失踪后是周怀安在到处托人寻找。');
      E.addClue('为情而去说法存疑', '苏母承认周怀安与苏晚亭的婚约仍在；若只凭残信和疑似遗书断定苏晚亭“为情而去”，这个说法站不稳。');
    }

    function hasSuHomeTrustToken() {
      return E.getFlag('shown_photo_to_mother') || E.hasClue('苏母认出照片') || E.hasItem('苏晚亭的银发夹');
    }

    function hasSuHomeTrustProof() {
      return E.getFlag('presented_su_keepsake') || E.hasClue('苏晚亭认出银发夹');
    }

    E.hasSuHomeTrustToken = hasSuHomeTrustToken;
    E.hasSuHomeTrustProof = hasSuHomeTrustProof;
    E.knowsZhouFianceFromSuHome = function () {
      return E.getFlag('su_mother_knows_zhou_fiance') || E.hasClue('苏母知道周怀安婚约') || E.hasClue('为情而去说法存疑');
    };

    if (nodes.ch2_home_talk && !nodes.ch2_home_talk.__zhouFiancePatched) {
      const oldEffect = nodes.ch2_home_talk.effect;
      const oldText = nodes.ch2_home_talk.text;
      nodes.ch2_home_talk.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        markZhouFianceKnown();
      };
      nodes.ch2_home_talk.text = () => `你问苏母，晚亭失踪前有没有什么异常。<br><br><span class="sys">“这孩子……”</span>苏母叹了口气，<span class="sys">“她从小就懂事，从来不让我操心。功课好，人也乖巧。可是最近这半年，她好像一直有心事。我问她，她总说没事。”</span><br><br><span class="sys">“有一回——大概两个月前——她半夜突然跑回来，浑身湿透了，像是淋了雨。我问她怎么了，她说是图书馆关门了，走到半路下雨了。但我看到她眼睛红红的，像是哭过。她不说，我也不忍心追问。”</span><br><br>你提到周怀安。<br><br>苏母抬起头，像是终于听见一个还能抓住的名字。<br><br><span class="sys">“周先生是个好人。晚亭父亲走得早，我这条腿又不争气，这门亲事原本是我点头的。晚亭也没有反对。”</span><br><br>她停了停，声音低下去。<br><br><span class="sys">“她失踪以后，周先生来过几次。每次都说一定会找她回来。他不像会害她的人。”</span><br><br>这句话让你记住了。若以后有人把苏晚亭的失踪写成一段简单的私情出走，至少苏家这里，还有一个说不通的地方。`;
      nodes.ch2_home_talk.__zhouFiancePatched = true;
    }

    if (nodes.ch2_home_showphoto && !nodes.ch2_home_showphoto.__suKeepsakePatched) {
      const oldEffect = nodes.ch2_home_showphoto.effect;
      nodes.ch2_home_showphoto.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        markZhouFianceKnown();
        E.addItem('苏晚亭的银发夹', '苏母交给你的旧银发夹，内侧刻着一个很小的“亭”字。');
        E.addClue('苏母托付信物', '苏母把苏晚亭小时候常戴的银发夹交给你，说她认得这个东西。');
      };
      nodes.ch2_home_showphoto.text = () => `你从怀里掏出那张照片，递给苏母。<br><br>她接过去的时候手是稳的——但看到照片的一瞬间，眼泪毫无预兆地落了下来。她没有抬手去擦。<br><br><span class="sys">“这是……她失踪前两个月拍的。光启公园。她说那天天气好，非要拉我去，我没去成。”</span><br><br>她用手指轻轻摩挲照片边缘，像在抚摸女儿的脸。<br><br><span class="sys">“她拍完回来说：妈，这张照片我要留给周先生。如果有一天我不见了，至少他知道该拿什么找我。”</span><br><br>你问她，周先生是不是周怀安。<br><br>苏母点点头。<br><br><span class="sys">“他是晚亭的未婚夫。晚亭嘴上不常说，可她心里是认这门亲事的。她若真要走，不会一句话都不留给他，也不会把我一个人丢在这里。”</span><br><br>她说到这里，忽然停住了。她扶着轮椅转进里屋，过了很久，拿出一只用旧手帕包着的小银发夹。发夹内侧刻着一个很小的<span class="sys">“亭”</span>字。<br><br><span class="sys">“这是她小时候常戴的。后来长大了，说太孩子气，就收起来了。你要是真能见到她，把这个给她看。她会知道，你来过家里。”</span><br><br>苏晚亭在拍照那天就已经想到了自己会失踪。这不是临时起意的出走——她在做准备。<br><br>苏母把发夹放到你手里，声音很轻：<span class="sys">“找到她。不管在哪里，找到她。”</span><br><br>你点点头，把照片和发夹一起贴胸收好。`;
      nodes.ch2_home_showphoto.__suKeepsakePatched = true;
    }

    if (nodes.ch2_home_ask_photo && !nodes.ch2_home_ask_photo.__cousinWeakenedPatched) {
      const oldEffect = nodes.ch2_home_ask_photo.effect;
      nodes.ch2_home_ask_photo.text = () => `你指着照片上被裁掉的部分，装作不经意地问苏母。<br><br><span class="sys">“这张照片——还有别人吧？”</span><br><br>苏母的表情有一瞬间的僵硬。她低下头，沉默了一会儿。<br><br><span class="sys">“那是……晚亭父亲那边一个远房亲戚。很多年不来往了。裁了就裁了吧。”</span><br><br>她的语气很平淡，但你觉得她不是在隐瞒一个凶手，而是在避开一个不愿再提的家族旧伤。<br><br>离开苏家的时候，你回头看了一眼那扇门——一个坐着轮椅的母亲，一个失踪的女儿，一张被裁掉的照片。这个家藏着伤口，但眼下最要紧的，仍是把苏晚亭找回来。`;
      nodes.ch2_home_ask_photo.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.addClue('苏家旧伤', '墙上全家福被裁掉的人只是苏家不愿多谈的旧关系，不像当前失踪案的直接线索。');
      };
      nodes.ch2_home_ask_photo.__cousinWeakenedPatched = true;
    }

    nodes.ch4_su_present_keepsake = {
      title: '举证 · 银发夹',
      weather: 2,
      effect: () => {
        E.addClue('苏晚亭认出银发夹', '苏晚亭认出母亲托你带来的银发夹，终于确认你确实去过苏家。');
      },
      text: () => `你把那只银发夹摊在掌心。<br><br>苏晚亭原本涣散的目光忽然停住了。她伸出手，却没有立刻碰它，像是怕一碰就会醒。<br><br><span class="sys">“这是我小时候的东西。”</span><br><br>她的声音很轻，轻得几乎被暗室外的脚步声吞掉。<br><br><span class="sys">“我母亲……她还好吗？”</span><br><br>你告诉她，苏母认出了照片，也把这只发夹交给你。她闭了闭眼，再睁开时，终于不再把你当成又一个来带她走的人。<br><br>沈玉芳还靠在墙边，强撑着没有倒下。你可以趁离开前，再用一两件关键证据确认她知道的事；也可以先把两个人带出去。`,
      choices: [
        { text: '🧾 再向沈玉芳核对合影或陈明远的信', goto: 'ch4_dock_who_dual' },
        { text: '🔙 立刻带她们离开暗室', goto: 'ch4_dock_escape' }
      ]
    };

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__suDockPresentWhitelistPatched) {
      const oldOnPresent = nodes.ch4_dock_who_dual.onPresent;
      nodes.ch4_dock_who_dual.onPresent = function (item, state) {
        if (presentOnce(item, '苏晚亭的银发夹', 'presented_su_keepsake')) return { goto: 'ch4_su_present_keepsake' };
        const oldResult = typeof oldOnPresent === 'function' ? oldOnPresent(item, state) : null;
        if (oldResult) return oldResult;
        if (presentOnce(item, '三人合影', 'presented_photo_to_yufang_dual')) return { goto: 'ch4_yufang_present_photo_dual' };
        if (presentOnce(item, '陈明远的信', 'presented_letter_to_yufang_dual')) return { goto: 'ch4_yufang_present_letter_dual' };
        if (presentOnce(item, '未寄出的信', 'presented_unsent_letter_to_yufang_dual')) return { goto: 'ch4_yufang_present_letter_dual' };
        if (presentOnce(item, '日记残页', 'presented_diary_to_yufang_dual')) return { goto: 'ch4_yufang_present_diary_dual' };
        if (presentOnce(item, '苏晚亭日记残页', 'presented_diary_to_yufang_dual')) return { goto: 'ch4_yufang_present_diary_dual' };
        return null;
      };
      nodes.ch4_dock_who_dual.__suDockPresentWhitelistPatched = true;
    }

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__suHomeTrustGatePatched) {
      const oldEffect = nodes.ch4_dock_escape_finish.effect;
      const oldText = nodes.ch4_dock_escape_finish.text;

      nodes.ch4_dock_escape_finish.effect = function (state) {
        const foundSu = E.getFlag('found_su_at_dock');
        if (foundSu && !hasSuHomeTrustProof()) {
          E.setFlag('rescued_yufang', true);
          E.setFlag('su_rescue_failed_no_home_trust', true);
          E.setFlag('su_moved_from_dock', true);
          E.addClue('沈玉芳证词', '陈老师死前曾向她求助，说发现了学校利用教具箱走私管制药品。她被关在福生仓近一个月。');
          E.addClue('苏晚亭救援失之交臂', '你在福生仓见到了苏晚亭，但没有把苏母信物出示给她；码头混乱中，她被傅启元的人转走。');
          return;
        }
        if (typeof oldEffect === 'function') oldEffect(state);
      };

      nodes.ch4_dock_escape_finish.text = function (state) {
        if (E.getFlag('found_su_at_dock') && !hasSuHomeTrustProof()) {
          return `黄包车的铃铛在深夜街道上响起。<br><br>沈玉芳蜷在车座一角，手指死死攥着你的衣袖。苏晚亭曾经就在你背后不远处，可码头乱起来的那一刻，她没有跟上来。<br><br>她太虚弱，也太警惕。你说自己是周怀安请来的侦探，可她只是看着你，像隔着一层很厚的雾。<br><br>如果你把苏母托付的银发夹拿给她看，也许她会相信你。<br><br>可你没有。<br><br>傅启元的人趁乱把她重新拖上车。你只来得及抢回沈玉芳，和苏晚亭曾经还活着的证明。`;
        }
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };

      nodes.ch4_dock_escape_finish.__suHomeTrustGatePatched = true;
    }

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__suHomeTrustHintPatched) {
      const oldText = nodes.ch4_dock_who_dual.text;
      nodes.ch4_dock_who_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!hasSuHomeTrustToken()) {
          return `${base}<br><br><span class="sys">苏晚亭看向你的眼神仍然很远。你手里有证件，有线索，却没有任何能证明你去过苏家的东西。她不知道你是不是又一个来“带她走”的人。</span>`;
        }
        if (!hasSuHomeTrustProof()) {
          return `${base}<br><br><span class="sys">你想起苏母交给你的银发夹。现在把它拿出来，也许能让苏晚亭相信你确实从家里来。</span>`;
        }
        return `${base}<br><br><span class="sys">苏晚亭把银发夹攥在掌心，像终于从雾里听见了家的声音。沈玉芳仍在等你问完最后几个问题；时间不多，但这两件证据也许能让她更快说清楚。</span>`;
      };
      nodes.ch4_dock_who_dual.__suHomeTrustHintPatched = true;
    }

    E.__suHomeTrustGatePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySuHomeTrustGate);
})();
