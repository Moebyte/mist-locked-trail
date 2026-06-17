// ===== 终局总结显示收束 =====
// 目标：不要把内部叠加分直接显示成 18 分；玩家看到的是明确维度的 10 分制与压力指数。
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

    function waybillReady() {
      return E.getFlag('fu_waybill_exposed') || E.getFlag('sun_waybill_convinced') || hasThing('光华货运单');
    }

    function clearanceReady() {
      return E.getFlag('fu_clearance_exposed') || E.getFlag('sun_clearance_convinced') || hasThing('清场指令');
    }

    function luLineReady() {
      return E.getFlag('v07_lu_confronted') || E.getFlag('v07_lu_statement') || E.getFlag('v07_lu_to_sun');
    }

    function finalPressureProfile() {
      let pressure = E.state?.pressure?.heat || 0;
      const notes = [];

      if (E.getFlag('v07_choice_late_blockade')) {
        pressure += 1;
        notes.push('码头封锁迟一步');
      }
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) {
        pressure += 2;
        notes.push('公董局已经插手');
      }
      if (E.getFlag('v07_choice_blockade_after_interference')) notes.push('补封码头受阻');
      if (E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')) notes.push('封锁线仍在');
      if (E.getFlag('v07_witnesses_protected')) notes.push('证人暂时安全');
      if (E.getFlag('v07_accepted_fu_card')) {
        pressure += 2;
        notes.push('傅启元交易留下污点');
      }
      if (E.getFlag('v07_rejected_fu_deal') || E.getFlag('v07_fu_bluffed_with_press')) notes.push('傅启元被反制');

      let label = '可控';
      if (pressure >= 7) label = '临界';
      else if (pressure >= 5) label = '高压';
      else if (pressure >= 3) label = '紧张';

      return { value: Math.max(0, Math.min(8, pressure)), label, notes };
    }

    function finalCaseQuality() {
      const factors = [
        ['沈玉芳获救', E.getFlag('rescued_yufang')],
        ['苏晚亭获救', E.getFlag('rescued_su')],
        ['光华三证物闭环', E.getFlag('school_wu_three_proofs')],
        ['福生仓真相推理', E.getFlag('deduced_fusheng')],
        ['货运单曝光', waybillReady()],
        ['清场指令曝光', clearanceReady()],
        ['保护了证人', E.getFlag('v07_witnesses_protected')],
        ['陆念薇对质/口供', luLineReady()],
        ['码头封锁有效', E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')],
        ['拒绝傅启元交易', E.getFlag('v07_rejected_fu_deal') || E.getFlag('v07_fu_bluffed_with_press')],
      ];

      let points = factors.reduce((sum, [, ok]) => sum + (ok ? 1 : 0), 0);
      const penalties = [];

      if (E.getFlag('v07_choice_late_blockade')) {
        points -= 1;
        penalties.push('封码头迟一步');
      }
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) {
        points -= 1;
        penalties.push('公董局已插手');
      }
      if ((E.state?.pressure?.heat || 0) >= 5) {
        points -= 1;
        penalties.push('行动热度过高');
      }
      if (E.getFlag('v07_accepted_fu_card')) {
        points -= 2;
        penalties.push('接下傅启元交易名片');
      }

      points = Math.max(0, Math.min(10, points));
      let label = '证据不足';
      if (points >= 9) label = '证据成链';
      else if (points >= 7) label = '主线清楚';
      else if (points >= 5) label = '线索可用';
      else if (points >= 3) label = '仍有缺口';

      return { points, label, factors, penalties };
    }

    E.finalCaseQuality = finalCaseQuality;
    E.finalPressureProfile = finalPressureProfile;

    function stripOldSummary(html) {
      return String(html || '')
        .replace(/<br><br><div style="border:1px solid var\(--line\);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结 · 调查质量[\s\S]*?选择"按证据链自然收束"将根据你的调查质量自动得出最优结局。/g, '')
        .replace(/<br><br><div style="border:1px solid var\(--line\);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结[\s\S]*?<\/div><br>选择"按证据链自然收束"将根据你的调查质量自动得出最优结局。/g, '')
        .replace(/<br><br><div style="border:1px solid var\(--line\);padding:10px;border-radius:4px;margin:8px 0"><b>📋 案件总结[\s\S]*?<\/div><br>选择“按手头证据结案”将根据当前调查质量自动得出最合适结局。/g, '');
    }

    function check(name, ok) {
      return `${ok ? '✅' : '⚫'} ${name}`;
    }

    function qualityLine(q) {
      const positives = q.factors.filter(([, ok]) => ok).map(([name]) => name);
      const gaps = q.factors.filter(([, ok]) => !ok).map(([name]) => name);
      const gapText = gaps.length ? `<br><span class="sys">缺口：${gaps.slice(0, 3).join('、')}${gaps.length > 3 ? '等' : ''}。</span>` : '';
      const penaltyText = q.penalties.length ? `<br><span class="sys">扣分：${q.penalties.join('、')}。</span>` : '';
      return `<b>📋 案件质量 · ${q.label} · ${q.points}/10</b><br><span class="sys">已闭合：${positives.join('、') || '暂无'}。</span>${gapText}${penaltyText}`;
    }

    function pressureLine(p) {
      const notes = p.notes.length ? ` · ${Array.from(new Set(p.notes)).join(' / ')}` : '';
      return `<b>⚠️ 压力指数 · ${p.label} · ${p.value}/8</b><br><span class="sys">${p.label === '临界' ? '对方已经开始压证据和证人，公开查明真相会明显受阻。' : p.label === '高压' ? '局势已经被惊动，后续每一步都会影响证据保全。' : p.label === '紧张' ? '对方已有风声，但局面仍可控制。' : '行动仍在可控范围内。'}${notes}</span>`;
    }

    function summaryHtml() {
      const q = finalCaseQuality();
      const p = finalPressureProfile();
      const checks = [
        check('沈玉芳获救', E.getFlag('rescued_yufang')),
        check('苏晚亭获救', E.getFlag('rescued_su')),
        check('福生仓真相推理', E.getFlag('deduced_fusheng')),
        check('货运单曝光', waybillReady()),
        check('清场指令曝光', clearanceReady()),
        check('保护了证人', E.getFlag('v07_witnesses_protected')),
        check('陆念薇对质/口供', luLineReady()),
        check('封锁线有效', E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')),
      ].join('  ');

      const hint = !E.getFlag('deduced_fusheng') && dockEvidenceReady()
        ? '<br><span class="sys">福生仓现场证据已经到手。现在还差最后一步：推理福生仓与公董局的真相。</span>'
        : '';

      return `<br><br><div style="border:1px solid var(--line);padding:10px;border-radius:4px;margin:8px 0">${qualityLine(q)}<br><br>${pressureLine(p)}<br>${checks}${hint}</div><br>选择“按手头证据结案”将根据当前案件质量与压力状态得出最合适结局。`;
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
