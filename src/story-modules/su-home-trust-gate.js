// ===== 苏家信任门槛 =====
// 目标：苏家不只是补叙。救苏晚亭时，需要苏母照片/托付作为信任凭据。
// 没有去苏家，仍可找到苏晚亭，但无法在码头局势中成功带走她，完美救援降档。
(function installSuHomeTrustGate() {
  function applySuHomeTrustGate() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__suHomeTrustGatePatched) return;

    function hasSuHomeTrustProof() {
      return E.getFlag('shown_photo_to_mother')
        || E.hasClue('苏母认出照片')
        || E.hasClue('母亲证词')
        || E.getFlag('asked_mother_photo')
        || E.getFlag('asked_photo');
    }

    E.hasSuHomeTrustProof = hasSuHomeTrustProof;

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
          E.addClue('苏晚亭救援失之交臂', '你在福生仓见到了苏晚亭，但缺少能让她确认你可信的苏家凭据；码头混乱中，她被傅启元的人转走。');
          return;
        }
        if (typeof oldEffect === 'function') oldEffect(state);
      };

      nodes.ch4_dock_escape_finish.text = function (state) {
        if (E.getFlag('found_su_at_dock') && !hasSuHomeTrustProof()) {
          return `黄包车的铃铛在深夜街道上响起。<br><br>沈玉芳蜷在车座一角，手指死死攥着你的衣袖。苏晚亭曾经就在你背后不远处，可码头乱起来的那一刻，她没有跟上来。<br><br>她太虚弱，也太警惕。你说自己是周怀安请来的侦探，可她只是看着你，像隔着一层很厚的雾。<br><br>如果你去过苏家，带着苏母认出的照片，或者哪怕带来一句只有她母亲才会说的话，也许她会相信你。<br><br>可你没有。<br><br>傅启元的人趁乱把她重新拖上车。你只来得及抢回沈玉芳，和苏晚亭曾经还活着的证明。`;
        }
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };

      nodes.ch4_dock_escape_finish.__suHomeTrustGatePatched = true;
    }

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__suHomeTrustHintPatched) {
      const oldText = nodes.ch4_dock_who_dual.text;
      nodes.ch4_dock_who_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!hasSuHomeTrustProof()) {
          return `${base}<br><br><span class="sys">苏晚亭看向你的眼神仍然很远。你手里有证件，有线索，却没有来自苏家的任何凭据。她不知道你是不是又一个来“带她走”的人。</span>`;
        }
        return `${base}<br><br><span class="sys">你提到苏母认出那张照片，也提到她临别时说的那句“找到她”。苏晚亭的睫毛颤了一下，像终于从雾里听见了家的声音。</span>`;
      };
      nodes.ch4_dock_who_dual.__suHomeTrustHintPatched = true;
    }

    E.__suHomeTrustGatePatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySuHomeTrustGate);
})();
