// ===== 四字结局与动态尾声收束 =====
// 目标：主结局保持少量骨架，但根据证人/物证/医院/陆念薇/周怀安/公董局状态拼接不同尾声。
// 结局名尽量采用四字形式；早期未进入福生仓线的误判/停案结局也统一命名与尾声风格。

(function installDynamicEndingPolish() {
  function applyDynamicEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dynamicEndingPolishPatched) return;

    function wp() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : { count: 0, yufang: false, su: false, label: '证人缺席' };
    }

    function truth() {
      return typeof E.truthCompletenessTier === 'function'
        ? E.truthCompletenessTier()
        : { key: 'weak', score: 0, label: '证据链薄弱', hardEvidenceCount: 0, evidenceLabel: '零物证' };
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

    function hasActualLuOutcome() {
      return E.getFlag('v07_lu_to_sun') || E.getFlag('v07_lu_statement') || E.getFlag('v07_lu_as_informant');
    }

    function hasFormalLuOutcome() {
      return E.getFlag('v07_lu_to_sun');
    }

    function schoolHiddenGatePassed() {
      return E.getFlag('school_wu_three_proofs') && E.getFlag('school_wu_full_confront');
    }

    function hasAnyDockWitness() {
      const p = wp();
      return p.count > 0 || E.getFlag('rescued_yufang') || E.getFlag('rescued_su') || E.getFlag('found_yufang') || E.getFlag('found_su_at_dock');
    }

    function hasFullDockEvidence() {
      const t = truth();
      return Number(t.hardEvidenceCount || 0) >= 2;
    }

    function dockVisited() {
      return E.getFlag('dock_entry_committed') || E.getFlag('dock_solo_entry') || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_fast_support_entry') || E.getFlag('missed_both_at_dock') || E.getFlag('missed_both_due_to_return_tool')
        || E.hasClue?.('仓库暗室') || E.hasClue?.('光华货运单') || E.hasItem?.('光华货运单') || E.hasItem?.('清场指令');
    }

    function soloMode() {
      return E.getFlag('dock_solo_entry') || E.getFlag('dock_solo_waterline_escape')
        || E.getFlag('dock_solo_crate_screen') || E.getFlag('dock_solo_decoy_escape')
        || E.getFlag('dock_solo_hard_confront');
    }

    function fourCharTitle(nodeId, title) {
      const node = nodes[nodeId];
      if (!node) return;
      node.title = `结局 · ${title}`;
    }

    function endingFooter(title, tag = '') {
      return `<div style="color:#666;font-style:italic;margin-top:20px">—— 结局 · ${title}${tag ? `（${tag}）` : ''} ——</div>`;
    }

    function witnessParagraph() {
      const p = wp();
      if (p.count >= 2) return '沈玉芳和苏晚亭都活了下来。一个能证明陈明远为什么死，一个能证明傅启元为什么怕。她们的声音彼此照应，福生仓不再只是一处仓库，而是一段有人亲眼走出来的黑夜。';
      if (p.yufang || E.getFlag('rescued_yufang') || E.getFlag('found_yufang')) return '沈玉芳活了下来。她的证词让陈明远的死不再只是一页卷宗，也让福生仓第一次有了活人的声音。只是苏晚亭仍缺席，最深的一段黑夜没有人完整说完。';
      if (p.su || E.getFlag('rescued_su') || E.getFlag('found_su_at_dock')) return '苏晚亭活了下来。她能证明傅启元的名字曾在福生仓里出现，但沈玉芳缺席，陈明远死前那段线仍少了一个能接上的人。';
      return '没有人从福生仓里走出来。你能带回来的，只剩纸、货单、蓝封公文角，以及仓库地面上被拖过的痕迹。';
    }

    function evidenceParagraph() {
      const t = truth();
      const count = Number(t.hardEvidenceCount || 0);
      if (count >= 2) return '清场指令和光华货运单互相咬住：一张说明谁要清场，一张说明东西从哪里来、要往哪里去。纸面上的链条终于不再只靠猜。';
      if (count === 1) return '你手里只有一条硬证据线。它足够撕开雾气，却不足以把所有人都钉在纸面上。对方仍可以说这是误会、越权，或者一场仓促的私闯。';
      return '你缺少足够硬的码头物证。证人说出的话很重，但在公董局的印章面前，话有时会被拖成一团湿纸。';
    }

    function hospitalParagraph() {
      const h = hospital();
      if (h.key === 'stable') return '医院那一夜被稳住了。医生的记录、分开的病房和守住后门的人，让证词没有在黎明前散掉。';
      if (h.key === 'controlled') return '医院没有彻底乱起来。走廊里仍有争执，门外仍有人影，但证人至少撑到了可以说话的时候。';
      if (h.key === 'tense') return '医院里一直绷着一根线。证词能用，却带着颤音；每一句话都像是从傅启元和公董局的影子下抢出来的。';
      return '医院最终失控了。有人太早进来，有人太急着追问，也有人把程序的手伸进病房。证人活着，但证词被压得很薄。';
    }

    function luParagraph() {
      const l = lu();
      if (l.key === 'formal') return '陆念薇最后被交给老孙。她没有把自己洗成无辜的人，却把傅启元、公董局清场和南码头转运写进了正式口供。真相终于有了能进程序的一角。';
      if (l.key === 'private') return '陆念薇只留下了一份私下材料。她写下傅启元下一步的安排，却始终没有把自己完整交进巡捕房。真相更清楚了，但程序仍有缺口。';
      if (l.key === 'informant') return '你放陆念薇继续做内线。她也许还能带出更深的名字，但这一夜的结案材料因此少了一枚能正式落下的钉子。';
      if (l.key === 'withdrawn') return '陆念薇退缩了。她知道太多，也怕得太久。公董局那条线没有被她亲手补上，只在病房门外留下一个空位。';
      return '陆念薇没有成为这一夜的正式证人。她仍像一条暗线，存在，却没有完全落到纸面上。';
    }

    function zhouParagraph() {
      if (E.getFlag('hospital_triage_zhou_early')) return '周怀安太早进了病房。他不是坏意，但苏晚亭看见他时，刚刚从福生仓带出的恐惧又被扯开了一道口。';
      if ((E.getFlag('rescued_su') || E.getFlag('found_su_at_dock')) && E.getFlag('hospital_protect_witnesses') && E.getFlag('hospital_doctor_record')) {
        return '周怀安后来才被允许进去。他没有追问，只坐在病房外，把声音压得很低。对苏晚亭来说，那不是证词，却是一根能让她撑住的线。';
      }
      return '';
    }

    function bureauParagraph() {
      if (E.getFlag('hospital_bureau_forced_entry') || E.getFlag('fu_offer_bureau_intervention')) return '公董局强行介入了医院程序。后来的每一句证词，都像是在印章和枪口之间抢出来的。';
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) return '公董局已经出面。后来的每一步都不再只是查案，而是在抢手续、抢口径、抢谁有资格定义这一夜。';
      return '公董局还没来得及把所有手续压下来。这个短暂的空隙，让你们能把证词和物证先钉在一起。';
    }

    function dynamicTail() {
      return [witnessParagraph(), evidenceParagraph(), hospitalParagraph(), luParagraph(), zhouParagraph(), bureauParagraph()]
        .filter(Boolean)
        .join('<br><br>');
    }

    function scoreLine() {
      const t = truth();
      const h = hospital();
      const l = lu();
      return `<br><br><span class="sys">结案状态：${t.label || `${t.score || 0}分真相`}；${h.label || '医院线'}；陆念薇：${l.label || '未定'}。</span>`;
    }

    function makeEnd(nodeId, title, tag, body) {
      nodes[nodeId] = {
        title: `结局 · ${title}`,
        weather: 0,
        type: 'end',
        text: () => `${body}<br><br>${dynamicTail()}${scoreLine()}${endingFooter(title, tag)}`
      };
    }

    makeEnd('end_hidden_truth', '纸上余光', '隐藏', '你把所有材料摊在事务所的桌上。真相已经足够明亮，却还没有亮到能让所有人无处躲藏。<br><br>你知道傅启元会受伤，也知道公董局会否认。但至少这一夜以后，他们不能再把苏晚亭和沈玉芳写成两个自行消失的名字。');
    makeEnd('end_partial_truth', '缺口真相', '', '你没有赢得彻底。<br><br>有些证词还在发抖，有些纸面链条还缺一角，有些名字仍藏在公董局的印章背后。可是这一次，雾里至少出现了一道裂缝。');
    makeEnd('end_evidence_only', '空仓余证', '', '福生仓已经空了。<br><br>没有人回答你的问题，也没有人从暗室里走出来。你只带回了纸灰、货单、清场指令和地上的拖痕。它们很冷，却仍然指向同一个方向。');

    if (typeof E.v07ResolveEnding === 'function' && !E.__dynamicEndingResolvePatched) {
      const oldResolve = E.v07ResolveEnding.bind(E);
      E.v07ResolveEnding = function () {
        if (typeof this.fuWillSilenceAtDock === 'function' && this.fuWillSilenceAtDock()) return 'end_dock_silenced';
        if (this.getFlag('missed_deadline')) {
          if (!hasAnyDockWitness() && hasFullDockEvidence()) return 'end_evidence_only';
          return 'end_too_late';
        }
        if (dockVisited() && !hasAnyDockWitness()) {
          if (hasFullDockEvidence()) return 'end_evidence_only';
          return 'end_archive';
        }

        const t = truth();
        const h = hospital();
        const l = lu();
        const score = Number(t.score || 0);
        const hasWitness = hasAnyDockWitness();
        const hiddenGate = schoolHiddenGatePassed() || hasActualLuOutcome();
        const trueHiddenGate = schoolHiddenGatePassed() || hasFormalLuOutcome();

        if (h.key === 'unstable') {
          if (hasWitness) return 'end_rescue';
          return score >= 6 ? 'end_partial_truth' : 'end_archive';
        }

        if (trueHiddenGate && score >= 10 && (h.key === 'stable' || h.key === 'controlled') && l.key === 'formal' && !soloMode()) return 'end_true_hidden';
        if (hiddenGate && score >= 8 && h.key !== 'unstable') {
          if (l.key === 'formal' || l.key === 'private' || l.key === 'informant') return 'end_hidden_truth';
          return 'end_conspiracy_detail';
        }
        if (score >= 6) return 'end_partial_truth';
        if (hasWitness) return 'end_rescue';
        return oldResolve();
      };
      E.__dynamicEndingResolvePatched = true;
    }

    // 现有主结局改为四字名，并追加动态尾声。
    const titleMap = {
      end_true_hidden: ['破晓之前', '真隐藏'],
      end_conspiracy_detail: ['雨夜灯火', '隐藏'],
      end_rescue: ['生还之夜', ''],
      end_conspiracy: ['迷雾未尽', ''],
      end_archive: ['无声归档', ''],
      end_too_late: ['空仓余证', '']
    };
    for (const [id, [title]] of Object.entries(titleMap)) fourCharTitle(id, title);

    for (const [id, [title, tag]] of Object.entries(titleMap)) {
      const node = nodes[id];
      if (!node || node.__dynamicTailPatched) continue;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br>${dynamicTail()}${scoreLine()}${endingFooter(title, tag)}`;
      };
      node.__dynamicTailPatched = true;
    }

    for (const id of ['end_boss_lu', 'end_boss_zhao', 'end_boss_wu']) {
      const node = nodes[id];
      if (!node || node.__earlyNoDockTextPatched) continue;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br><span class="sys">这条结局发生在你未进入福生仓线之前。福生仓、医院证人和傅启元后巷交易都还没有真正展开。</span>`;
      };
      node.__earlyNoDockTextPatched = true;
    }

    E.__dynamicEndingPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDynamicEndingPolish);
})();