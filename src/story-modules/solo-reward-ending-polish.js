// ===== solo 线奖励与四字变种结局 =====
// 目标：solo 线风险最高，应奖励高手玩家；但奖励不等同于老孙线的正式程序最优。
// 新增：
// 1) 暗室刻痕：solo 低风险进入暗室时获得的独有细节线索。
// 2) 醒后信任：solo 亲自救出苏晚亭后，医院证人稳定小幅提升。
// 3) 孤灯照雾：solo 高质量路线的四字隐藏变种结局。

(function installSoloRewardEndingPolish() {
  function applySoloRewardEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__soloRewardEndingPolishPatched) return;

    function wp() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : { count: 0, yufang: false, su: false, label: '证人缺席' };
    }

    function truth() {
      return typeof E.truthCompletenessTier === 'function'
        ? E.truthCompletenessTier()
        : { key: 'weak', score: 0, label: '证据链薄弱', hardEvidenceCount: 0 };
    }

    function hospital() {
      return typeof E.hospitalOutcomeTier === 'function'
        ? E.hospitalOutcomeTier()
        : { key: 'controlled', label: '可控医院线' };
    }

    function lu() {
      return typeof E.luOutputTier === 'function'
        ? E.luOutputTier()
        : { key: 'none', label: '未形成陆念薇口供' };
    }

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function isSoloRoute() {
      return E.getFlag('dock_solo_entry') && !E.getFlag('dock_fast_support_entry') && !E.getFlag('dock_full_support_entry');
    }

    function soloExitedCorrectly() {
      return E.getFlag('dock_exit_side_lane') && !E.getFlag('dock_no_support_confront') && !E.getFlag('dock_no_support_witness_exposed');
    }

    function bothWitnessesFound() {
      const p = wp();
      return p.count >= 2
        || ((p.yufang || E.getFlag('found_yufang') || E.getFlag('rescued_yufang'))
          && (p.su || E.getFlag('found_su_at_dock') || E.getFlag('rescued_su')));
    }

    function fullDockEvidence() {
      const t = truth();
      return Number(t.hardEvidenceCount || 0) >= 2
        || ((hasThing('清场指令') || hasThing('公董局公文纸')) && (hasThing('光华货运单') || hasThing('教具箱走私')));
    }

    function canGrantSoloDarkroomMarks() {
      if (!isSoloRoute()) return false;
      if (E.getFlag('solo_darkroom_marks')) return false;
      if (E.getFlag('missed_both_at_dock') || E.getFlag('missed_both_due_to_return_tool')) return false;
      if (typeof E.dockHeatTier === 'function' && E.dockHeatTier().key === 'high') return false;
      return true;
    }

    function grantSoloDarkroomMarks(nodeId) {
      if (!canGrantSoloDarkroomMarks()) return;
      E.setFlag('solo_darkroom_marks', true);
      E.addClue('暗室刻痕', '福生仓暗室门背后有两排刻痕：深的一排像沈玉芳刻下的日期，浅的一排像苏晚亭后来补上的记号，最后一格旁边有一个几乎看不清的“陆”字。');
      E.addItem('暗室刻痕拓片', '你用纸轻轻拓下暗室门背后的刻痕。它不是硬物证，却能说明苏晚亭和沈玉芳曾在同一间暗室里互相撑过一段时间。');
      if (nodeId === 'ch4_dock_deep_dual' || E.getFlag('solo_outcome_no_evidence_dual_rescue') || E.getFlag('found_su_at_dock') || E.getFlag('rescued_su')) {
        E.setFlag('solo_rescuer_trust', true);
      }
    }

    function patchDarkroomNode(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__soloRewardDarkroomPatched) return;
      const oldEffect = node.effect;
      const oldText = node.text;
      node.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        grantSoloDarkroomMarks(nodeId);
      };
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!E.getFlag('solo_darkroom_marks')) return base;
        return `${base}<br><br>你最后看了一眼暗门背后。木板内侧有两排刻痕：一排深，一排浅。深的像是沈玉芳刻下的日期，浅的像是苏晚亭后来补上的记号。最末一格旁边，还有一个几乎看不清的“陆”字。<br><br>没有旁人催你，也没有制服堵在门口。正因为你是一个人进来的，才有这一秒能把它拓下来。`;
      };
      node.__soloRewardDarkroomPatched = true;
    }

    patchDarkroomNode('ch4_dock_deep_dual');
    patchDarkroomNode('ch4_dock_deep_trace');

    E.__soloTrustWitnessStabilityPatched = true;
    // BAKED into hospital-pressure-witness-polish

    if (typeof E.luCredibilityScore === 'function' && !E.__soloDarkroomLuCredibilityPatched) {
      const oldLuCredibility = E.luCredibilityScore.bind(E);
      E.luCredibilityScore = function () {
        let score = oldLuCredibility();
        if (this.getFlag('solo_darkroom_marks')) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__soloDarkroomLuCredibilityPatched = true;
    }

    function soloEndingEligible() {
      const t = truth();
      const h = hospital();
      const l = lu();
      const score = Number(t.score || 0);
      return isSoloRoute()
        && soloExitedCorrectly()
        && bothWitnessesFound()
        && fullDockEvidence()
        && score >= 9
        && (h.key === 'stable' || h.key === 'controlled')
        && (l.key === 'formal' || l.key === 'private' || l.key === 'informant' || l.key === 'formal_ready' || l.key === 'private_ready')
        && !E.getFlag('dock_no_support_confront');
    }

    nodes.end_solo_lantern = {
      title: '结局 · 孤灯照雾',
      weather: 0,
      type: 'end',
      text: () => {
        const t = truth();
        const h = hospital();
        const l = lu();
        const luText = l.key === 'formal'
          ? '陆念薇最终把名字落进了老孙的口供里。她补上的不是全部真相，却让公董局那条线第一次有了可追的手续。'
          : l.key === 'private'
            ? '陆念薇只留下私下材料。她仍旧不敢完全站出来，但她写下的南码头转运安排，足够让傅启元睡不安稳。'
            : l.key === 'informant'
              ? '你放陆念薇继续做内线。她没有让这一夜立刻闭合，却把更深处的名字留给了后来的雾。'
              : '陆念薇没有完全站出来。她像一条未收束的暗线，证明真相仍有一段没有进入正式程序。';
        const zhouText = E.getFlag('solo_rescuer_trust')
          ? '苏晚亭醒来后，没有先看见巡捕，也没有看见一排陌生制服。她记得雾里只有一个人的脚步声，也记得是你把她从暗室里带出来。周怀安后来进病房时，她已经能把手从被角里伸出来。'
          : '医院的灯亮了很久。你把人送到这里，却仍然没有一支能替你压住全部程序的队伍。';
        return `你没有等老孙，也没有带便衣。<br><br>你一个人从东侧窗户翻进福生仓，一个人摸过账房、货架和暗门，也一个人把沈玉芳和苏晚亭从雾里带了出来。<br><br>卷宗上不会这样写。卷宗只会写“现场取得关键材料”“证人获救”“部分程序待补”。可你知道，那一夜真正亮着的，只有你手里那盏不敢举高的灯。<br><br>清场指令和光华货运单互相咬住，沈玉芳和苏晚亭的证词彼此照应。暗室门背后的刻痕被你拓在纸上，像两个人在黑暗里互相确认：我还在。<br><br>${zhouText}<br><br>${luText}<br><br><span class="sys">结案状态：${t.label || `${t.score || 0}分真相`}；${h.label || '医院线'}；陆念薇：${l.label || '未定'}。solo 线完成高质量收束，但缺少现场正式封锁，因此它是“孤灯照雾”，不是“破晓之前”。</span><br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · 孤灯照雾（solo变种） ——</div>`;
      }
    };

    if (typeof E.v07ResolveEnding === 'function' && !E.__soloRewardResolvePatched) {
      const oldResolve = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        if (soloEndingEligible()) return 'end_solo_lantern';
        return oldResolve();
      };
      E.__soloRewardResolvePatched = true;
    }

    E.__soloRewardEndingPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySoloRewardEndingPolish);
})();