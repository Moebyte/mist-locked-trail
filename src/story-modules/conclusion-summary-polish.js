// ===== 终局总结显示收束 =====
// 目标：不要把内部叠加分直接显示成 18 分；玩家看到的是 10 分制/等级。
// 同时把“查明福生仓”改成“福生仓真相推理”，并在可推理时优先给出推理入口。

(function installConclusionSummaryPolish() {
  function applyConclusionSummaryPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__conclusionSummaryPolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function dockEvidenceReady() {
      return hasThing('公董局公文纸')
        || hasThing('清场指令')
        || hasThing('光华货运单')
        || hasThing('教具箱走私')
        || E.getFlag('fu_waybill_exposed')
        || E.getFlag('fu_clearance_exposed')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock');
    }

    function normalizedQuality() {
      const raw = typeof E.v07InvestigationQuality === 'function'
        ? Number(E.v07InvestigationQuality().score || 0)
        : 0;
      const points = Math.max(0, Math.min(10, Math.round(raw / 2)));
      let label = '证据不足';
      if (points >= 9) label = '证据成链';
      else if (points >= 7) label = '主线清楚';
      else if (points >= 5) label = '线索可疑';
      return { raw, points, label };
    }

    function stripOldSummary(html) {
      return String(html || '')
        .replace(/<br><br><div style="border:1px solid var\(--line\);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结 · 调查质量[\s\S]*?选择"按证据链自然收束"将根据你的调查质量自动得出最优结局。/g, '')
        .replace(/<br><br><div style="border:1px solid var\(--line\);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结[\s\S]*?<\/div><br>选择"按证据链自然收束"将根据你的调查质量自动得出最优结局。/g, '');
    }

    function check(name, ok) {
      return `${ok ? '✅' : '⚫'} ${name}`;
    }

    function summaryHtml() {
      const q = normalizedQuality();
      const checks = [
        check('沈玉芳获救', E.getFlag('rescued_yufang')),
        check('苏晚亭获救', E.getFlag('rescued_su')),
        check('福生仓真相推理', E.getFlag('deduced_fusheng')),
        check('货运单曝光', E.getFlag('fu_waybill_exposed') || E.getFlag('sun_waybill_convinced') || hasThing('光华货运单')),
        check('清场指令曝光', E.getFlag('fu_clearance_exposed') || E.getFlag('sun_clearance_convinced') || hasThing('清场指令')),
        check('保护了证人', E.getFlag('v07_witnesses_protected')),
        check('陆念薇对质', E.getFlag('v07_lu_confronted')),
      ].join('  ');

      const hint = !E.getFlag('deduced_fusheng') && dockEvidenceReady()
        ? '<br><span class="sys">福生仓现场证据已经到手。现在还差最后一步：推理福生仓与公董局的真相。</span>'
        : '';

      return `<br><br><div style="border:1px solid var(--line);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结 · ${q.label} · ${q.points}/10</b><br>${checks}${hint}</div><br>选择“按手头证据结案”将根据当前调查质量自动得出最合适结局。`;
    }

    function hasFushengDeductionChoice(choices) {
      return choices.some(choice => (choice.text || choice.fogText || '').includes('福生仓与公董局'));
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__conclusionSummaryPolishPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        const base = stripOldSummary(typeof oldText === 'function' ? oldText(state) : oldText);
        return `${base}${summaryHtml()}`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        const opts = choicesOf(oldChoices, state).slice();
        if (!E.getFlag('deduced_fusheng') && dockEvidenceReady() && E.canDeduce && E.canDeduce('deduce_fusheng') && !hasFushengDeductionChoice(opts)) {
          opts.unshift({ text: '🧩 先推理——福生仓与公董局的真相', effect: () => E.openDeduction('deduce_fusheng') });
        }
        return opts;
      };

      nodes.ch4_conclusion.__conclusionSummaryPolishPatched = true;
    }

    E.__conclusionSummaryPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyConclusionSummaryPolish);
})();
