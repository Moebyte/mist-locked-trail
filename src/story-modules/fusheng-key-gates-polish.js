// ===== 福生仓钥匙机制统一收束 =====
// 目标：把“能否进福生仓 / 能否发现暗门 / 能否救出苏晚亭”从单纯质量分中拆出。
// 三把钥匙：
// 1) 王巡官纸条：入口钥匙。没有它，不能有效锁定福生仓。
// 2) 沈玉兰/沈玉芳线：暗门识别钥匙。没有它，只会把福生仓当转运点，找不到关人的暗室。
// 3) 苏母信物：苏晚亭信任钥匙。没有它，哪怕见到苏晚亭，也无法把她从码头带走。

(function installFushengKeyGatesPolish() {
  function applyFushengKeyGatesPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fushengKeyGatesPolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function entryKey() {
      return E.getFlag('got_wang_note')
        || hasThing('王巡官遗留纸条')
        || hasThing('半张烟盒纸')
        || hasThing('福生仓地址')
        || hasThing('福生仓位置');
    }

    function darkroomKey() {
      return E.getFlag('sister_case')
        || E.getFlag('talked_to_woman')
        || hasThing('沈玉芳')
        || hasThing('沈玉兰的妹妹')
        || hasThing('沈玉芳与陈明远')
        || hasThing('沈玉芳人质线');
    }

    function suTrustToken() {
      return E.getFlag('shown_photo_to_mother')
        || hasThing('苏母认出照片')
        || hasThing('苏母托付信物')
        || hasThing('苏晚亭的银发夹');
    }

    function suTrustProof() {
      return E.getFlag('presented_su_keepsake')
        || hasThing('苏晚亭认出银发夹');
    }

    E.fushengKeyState = function () {
      const entry = !!entryKey();
      const darkroom = !!darkroomKey();
      const token = !!suTrustToken();
      const proof = !!suTrustProof();
      return {
        entry,
        darkroom,
        suTrustToken: token,
        suTrustProof: proof,
        canEnterFusheng: entry,
        canFindDarkroom: entry && darkroom,
        canRescueYufang: entry && darkroom,
        canRescueSu: entry && darkroom && proof,
        labels: {
          entry: entry ? '福生仓入口已锁定' : '福生仓入口未确认',
          darkroom: darkroom ? '沈玉芳人质线已确认' : '沈玉芳人质线缺失',
          suTrust: proof ? '苏晚亭已认可信物' : token ? '苏母信物在手，尚未出示' : '缺少苏母信物'
        }
      };
    };

    E.hasWangFushengLead = function () {
      return !!entryKey();
    };

    E.knowsYufangForRescue = function () {
      return !!darkroomKey();
    };

    E.hasSuHomeTrustToken = function () {
      return !!suTrustToken();
    };

    E.hasSuHomeTrustProof = function () {
      return !!suTrustProof();
    };

    E.fushengKeySummary = function () {
      const k = this.fushengKeyState();
      return `${k.labels.entry} / ${k.labels.darkroom} / ${k.labels.suTrust}`;
    };

    if (typeof E.routeDockDeepByPressure === 'function' && !E.__fushengKeyRouteDeepPatched) {
      const oldRouteDockDeepByPressure = E.routeDockDeepByPressure.bind(E);
      E.routeDockDeepByPressure = function () {
        const k = this.fushengKeyState();
        if (k.entry && !k.darkroom) return 'ch4_dock_no_darkroom';
        return oldRouteDockDeepByPressure();
      };
      E.__fushengKeyRouteDeepPatched = true;
    }

    function keyBadge() {
      if (typeof E.fushengKeySummary !== 'function') return '';
      return `<br><br><span class="sys">福生仓钥匙：${E.fushengKeySummary()}</span>`;
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    if (nodes.ch4_suzhou_creek && !nodes.ch4_suzhou_creek.__fushengKeyTextPatched) {
      const oldText = nodes.ch4_suzhou_creek.text;
      nodes.ch4_suzhou_creek.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const k = E.fushengKeyState();
        if (!k.entry) return `${base}`;
        if (!k.darkroom) {
          return `${base}<br><br>你能锁定福生仓，却还不知道这里藏着“人”。没有沈玉芳这条线，仓库在你眼里仍像一处转运点，而不是囚室。`;
        }
        if (!k.suTrustToken) {
          return `${base}<br><br>你知道沈玉芳可能就在这里，也知道苏晚亭卷进了同一条线。但如果真在暗室里见到苏晚亭，你手里还缺一样能让她相信你的东西。`;
        }
        return `${base}`;
      };
      nodes.ch4_suzhou_creek.__fushengKeyTextPatched = true;
    }

    if (nodes.ch4_dock_no_darkroom && !nodes.ch4_dock_no_darkroom.__fushengKeyTextPatched) {
      const oldText = nodes.ch4_dock_no_darkroom.text;
      nodes.ch4_dock_no_darkroom.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br>你不是不够聪明，而是少了一把钥匙：没有沈玉兰和沈玉芳这条人质线，你不会把福生仓的夹墙当成关人的地方。`;
      };
      nodes.ch4_dock_no_darkroom.__fushengKeyTextPatched = true;
    }

    if (nodes.ch4_dock_deep_dual && !nodes.ch4_dock_deep_dual.__fushengKeyTextPatched) {
      const oldText = nodes.ch4_dock_deep_dual.text;
      nodes.ch4_dock_deep_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const k = E.fushengKeyState();
        if (!k.suTrustToken) {
          return `${base}<br><br>沈玉芳终于相信了你的证件，可苏晚亭不一样。她太虚弱，也太警惕。你能叫出她的名字，却没有任何东西能证明你真的去过她家。`;
        }
        if (!k.suTrustProof) {
          return `${base}<br><br>你想起苏母交给你的银发夹。现在拿出来，才可能让苏晚亭相信你不是又一个来“转移”她的人。`;
        }
        return `${base}`;
      };
      nodes.ch4_dock_deep_dual.__fushengKeyTextPatched = true;
    }

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__fushengKeyChoicesPatched) {
      const oldText = nodes.ch4_dock_who_dual.text;
      const oldChoices = nodes.ch4_dock_who_dual.choices;
      nodes.ch4_dock_who_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const k = E.fushengKeyState();
        if (!k.suTrustToken) {
          return `${base}<br><br><span class="sys">你没有苏母托付的信物。苏晚亭看着你，像看着雾里的另一个陌生人。你可以强行带她走，但她未必撑得过码头这段路。</span>`;
        }
        if (!k.suTrustProof) {
          return `${base}<br><br><span class="sys">银发夹就在你身上。这不是普通证物，而是把苏晚亭从恐惧里拉出来的唯一凭据。</span>`;
        }
        return base;
      };
      nodes.ch4_dock_who_dual.choices = function (state) {
        const k = E.fushengKeyState();
        const base = choicesOf(oldChoices, state).slice();
        if (k.suTrustToken && !k.suTrustProof && !base.some(choice => (choice.text || '').includes('银发夹'))) {
          base.unshift({
            text: '🪮 把苏母托付的银发夹拿给苏晚亭看',
            effect: () => E.setFlag('presented_su_keepsake', true),
            goto: 'ch4_su_present_keepsake'
          });
        }
        if (!k.suTrustToken) {
          return base.map(choice => {
            const text = choice.text || '';
            if (choice.goto === 'ch4_dock_escape' || text.includes('立刻带她们') || text.includes('带苏晚亭和沈玉芳')) {
              return {
                ...choice,
                text: '⚠️ 没有信物，仍然强行带她们离开暗室'
              };
            }
            return choice;
          });
        }
        return base;
      };
      nodes.ch4_dock_who_dual.__fushengKeyChoicesPatched = true;
    }

    if (nodes.ch4_dock_escape && !nodes.ch4_dock_escape.__fushengKeyTextPatched) {
      const oldText = nodes.ch4_dock_escape.text;
      nodes.ch4_dock_escape.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const k = E.fushengKeyState();
        if (E.getFlag('found_su_at_dock') && !k.suTrustProof) {
          return `${base}<br><br>苏晚亭的脚步一直跟不上。她不是不想活，而是不敢再相信任何说“跟我走”的人。没有苏母信物，她会在码头撤退中成为最脆弱的一环。`;
        }
        return `${base}`;
      };
      nodes.ch4_dock_escape.__fushengKeyTextPatched = true;
    }

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__fushengKeyOutcomePatched) {
      const oldEffect = nodes.ch4_dock_escape_finish.effect;
      const oldText = nodes.ch4_dock_escape_finish.text;
      nodes.ch4_dock_escape_finish.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (E.getFlag('found_su_at_dock') && !suTrustProof()) {
          E.setFlag('su_rescue_failed_no_home_trust', true);
          E.setFlag('su_lost_without_home_trust', true);
          E.setFlag('su_moved_from_dock', true);
          E.setFlag('rescued_su', false);
          E.addClue('苏晚亭未能救出', '你在福生仓见到了苏晚亭，但没有苏母信物让她信任你。码头混乱中，她被重新转移，双救失败。');
        }
      };
      nodes.ch4_dock_escape_finish.text = function (state) {
        if (E.getFlag('found_su_at_dock') && !suTrustProof()) {
          return `黄包车的铃铛在深夜街道上响起。<br><br>沈玉芳蜷在车座一角，手指死死攥着你的衣袖。苏晚亭曾经就在你背后不远处，可码头乱起来的那一刻，她没有跟上来。<br><br>她太虚弱，也太警惕。你说自己是周怀安请来的侦探，可她只是看着你，像隔着一层很厚的雾。<br><br>如果你把苏母托付的银发夹拿给她看，也许她会相信你。<br><br>可你没有。<br><br>傅启元的人趁乱把她重新拖上车。你只来得及抢回沈玉芳，和苏晚亭曾经还活着的证明。<br><br><span class="sys">双救路线关闭：没有苏母信物，苏晚亭无法在码头撤离中信任你。</span>`;
        }
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}`;
      };
      nodes.ch4_dock_escape_finish.__fushengKeyOutcomePatched = true;
    }

    if (typeof E.truthCompletenessTier === 'function' && !E.__fushengKeyTruthPatched) {
      const oldTruth = E.truthCompletenessTier.bind(E);
      E.truthCompletenessTier = function () {
        const t = oldTruth();
        if (this.getFlag('su_rescue_failed_no_home_trust') || this.getFlag('su_lost_without_home_trust')) {
          t.score = Math.min(Number(t.score || 0), 6);
          if (t.score >= 6) return { key: 'solid', label: '真相较完整', score: t.score };
          if (t.score >= 4) return { key: 'partial', label: '真相残缺但可结案', score: t.score };
          return { key: 'weak', label: '证据链薄弱', score: t.score };
        }
        return t;
      };
      E.__fushengKeyTruthPatched = true;
    }

    E.__fushengKeyGatesPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengKeyGatesPolish);
})();
