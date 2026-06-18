// ===== 终局总结显示收束 =====
// 目标：终局前只显示玩家已经掌握的案卷状态，不显示内部评分、路线名或开发者式“真相完整度”。
// 同时把“查明福生仓”改成“整理福生仓案卷”，并在可推理时优先给出推理入口。

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
        notes.push('码头封锁迟了一步');
      }
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) {
        pressure += 2;
        notes.push('对方已经惊动');
      }
      if (E.getFlag('v07_choice_blockade_after_interference')) notes.push('补封码头遇阻');
      if (E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')) notes.push('码头封锁线还在');
      if (E.getFlag('v07_witnesses_protected')) notes.push('证人暂时安全');
      if (E.getFlag('v07_accepted_fu_card')) {
        pressure += 2;
        notes.push('你接下了傅启元的名片');
      }
      if (E.getFlag('v07_rejected_fu_deal') || E.getFlag('v07_fu_bluffed_with_press')) notes.push('傅启元暂时退了一步');

      let label = '可控';
      if (pressure >= 7) label = '临界';
      else if (pressure >= 5) label = '高压';
      else if (pressure >= 3) label = '紧张';

      return { value: Math.max(0, Math.min(8, pressure)), label, notes };
    }

    function finalCaseQuality() {
      const factors = [
        ['沈玉芳已经带出福生仓', E.getFlag('rescued_yufang')],
        ['苏晚亭已经带出福生仓', E.getFlag('rescued_su')],
        ['光华小学旧案已经对上三样物证', E.getFlag('school_wu_three_proofs')],
        ['福生仓这条线已经整理清楚', E.getFlag('deduced_fusheng')],
        ['光华货运单已经到手', waybillReady()],
        ['清场指令已经到手', clearanceReady()],
        ['证人已经安置妥当', E.getFlag('v07_witnesses_protected')],
        ['陆念薇已经说出她知道的事', luLineReady()],
        ['码头封锁线还在', E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')],
        ['你没有接傅启元递来的台阶', E.getFlag('v07_rejected_fu_deal') || E.getFlag('v07_fu_bluffed_with_press')],
      ];

      let points = factors.reduce((sum, [, ok]) => sum + (ok ? 1 : 0), 0);
      const penalties = [];

      if (E.getFlag('v07_choice_late_blockade')) {
        points -= 1;
        penalties.push('封码头迟了一步');
      }
      if (E.getFlag('dock_escaped_during_sun_standoff') || E.getFlag('v07_choice_blockade_after_interference')) {
        points -= 1;
        penalties.push('对方已经惊动');
      }
      if ((E.state?.pressure?.heat || 0) >= 5) {
        points -= 1;
        penalties.push('你之前闹出的动静太大');
      }
      if (E.getFlag('v07_accepted_fu_card')) {
        points -= 2;
        penalties.push('傅启元留下了可以拿捏你的东西');
      }

      points = Math.max(0, Math.min(10, points));
      let label = '案卷仍薄';
      if (points >= 9) label = '案卷很稳';
      else if (points >= 7) label = '主线已清';
      else if (points >= 5) label = '能往下写';
      else if (points >= 3) label = '缺口不少';

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
      return `${ok ? '✓' : '·'} ${name}`;
    }

    function qualityLine(q) {
      const positives = q.factors.filter(([, ok]) => ok).map(([name]) => name);
      const gaps = q.factors.filter(([, ok]) => !ok).map(([name]) => name);
      const positivesText = positives.length ? positives.slice(0, 5).join('；') : '桌上还没有足够能落笔的东西';
      const gapText = gaps.length ? `<br><span class="sys">还没完全落稳的地方：${gaps.slice(0, 3).join('；')}${gaps.length > 3 ? '等' : ''}。</span>` : '';
      const penaltyText = q.penalties.length ? `<br><span class="sys">麻烦在于：${q.penalties.join('；')}。</span>` : '';
      return `<b>📋 案卷状态 · ${q.label}</b><br><span class="sys">已经能写进案卷的：${positivesText}。</span>${gapText}${penaltyText}`;
    }

    function pressureLine(p) {
      const notes = p.notes.length ? ` ${Array.from(new Set(p.notes)).join('；')}。` : '';
      const line = p.label === '临界'
        ? '对方已经开始压证据和证人，公开追下去会很难。'
        : p.label === '高压'
          ? '局势已经被惊动，后续每一步都会影响证据和证人。'
          : p.label === '紧张'
            ? '对方已有风声，但局面还没有完全失控。'
            : '行动还在可控范围内。';
      return `<b>⚠️ 外面的风声 · ${p.label}</b><br><span class="sys">${line}${notes}</span>`;
    }

    function summaryHtml() {
      const q = finalCaseQuality();
      const p = finalPressureProfile();
      const checks = [
        check('沈玉芳', E.getFlag('rescued_yufang')),
        check('苏晚亭', E.getFlag('rescued_su')),
        check('福生仓案卷', E.getFlag('deduced_fusheng')),
        check('货运单', waybillReady()),
        check('清场纸', clearanceReady()),
        check('证人安置', E.getFlag('v07_witnesses_protected')),
        check('陆念薇', luLineReady()),
        check('码头封锁', E.getFlag('dock_sun_pressed_fu') || E.getFlag('v07_choice_hold_blockade')),
      ].join('　');

      const hint = !E.getFlag('deduced_fusheng') && dockEvidenceReady()
        ? '<br><span class="sys">福生仓现场的东西已经摆在桌上。还差一次把它们串起来的判断。</span>'
        : '';

      return `<br><br><div style="border:1px solid var(--line);padding:10px;border-radius:4px;margin:8px 0">${qualityLine(q)}<br><br>${pressureLine(p)}<br>${checks}${hint}</div><br>现在落笔，结局会顺着你手里这份案卷走。`;
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
        if (!E.getFlag('deduced_fusheng') && dockEvidenceReady() && !hasFushengDeductionChoice(opts)) {
          opts.unshift({ text: '🧩 把福生仓、货运单和清场纸串起来', effect: () => E.openDeduction('deduce_fusheng') });
        }
        return opts;
      };

      nodes.ch4_conclusion.__conclusionSummaryPolishPatched = true;
    }

    E.__conclusionSummaryPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyConclusionSummaryPolish);
})();
