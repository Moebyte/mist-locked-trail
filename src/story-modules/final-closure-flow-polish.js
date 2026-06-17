// ===== 第三段推理后的终局收束 =====
// 目标：完成“福生仓与公董局”第三段推理后，玩家不应再在 wrapup / conclusion 中迷路。
// 规则：
// 1) deduced_fusheng 后显示“进入终局收束”。
// 2) 如果有人证且医院/陆念薇还没处理完，先导向医院/陆念薇。
// 3) 如果已经处理完，直接按 v07ResolveEnding() 写结案材料。
// 4) 零证人证据线也能直接收束到空仓余证/无声归档等动态结局。

(function installFinalClosureFlowPolish() {
  function applyFinalClosureFlowPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__finalClosureFlowPolishPatched) return;

    function hasWitness() {
      return E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.getFlag('found_su_at_dock')
        || E.getFlag('rescued_su');
    }

    function hasLuOutcome() {
      return E.getFlag('v07_lu_to_sun')
        || E.getFlag('v07_lu_statement')
        || E.getFlag('v07_lu_as_informant')
        || E.getFlag('v07_lu_withdrawn')
        || E.getFlag('v07_lu_formal_blocked');
    }

    function hospitalStarted() {
      return E.getFlag('v07_choice_protect_witnesses')
        || E.getFlag('hospital_protect_witnesses')
        || E.getFlag('hospital_doctor_record')
        || E.getFlag('v07_choice_hold_blockade')
        || E.getFlag('v07_choice_late_blockade')
        || E.getFlag('v07_choice_pressure_fu')
        || E.getFlag('v07_choice_blockade_after_interference')
        || E.getFlag('v07_choice_draw_lu');
    }

    function shouldShowFinalClosure() {
      return E.getFlag('deduced_fusheng');
    }

    function nextFinalStep() {
      if (!shouldShowFinalClosure()) return 'ch3_wrapup';
      if (hasWitness() && !hospitalStarted()) return 'ch4_hospital_conflict';
      if (hasWitness() && !hasLuOutcome()) return 'ch4_lu_confrontation';
      if (typeof E.v07ResolveEnding === 'function') return E.v07ResolveEnding();
      return 'ch4_conclusion';
    }

    function finalStatusText() {
      const parts = [];
      parts.push(E.getFlag('deduced_fusheng') ? '福生仓与公董局链条已经推明' : '第三段推理尚未完成');
      if (hasWitness()) parts.push('活证人已进入后续保护流程');
      else parts.push('无人证线将按证据收束');
      if (hasWitness() && !hospitalStarted()) parts.push('医院线尚未处理');
      else if (hasWitness() && !hasLuOutcome()) parts.push('陆念薇口供尚未定型');
      else parts.push('可以写最终结案材料');
      return parts.join('；');
    }

    nodes.ch4_final_closure = {
      title: '终局 · 收束',
      weather: 0,
      text: () => {
        const truth = typeof E.truthCompletenessTier === 'function' ? E.truthCompletenessTier() : null;
        const hospital = typeof E.hospitalOutcomeTier === 'function' ? E.hospitalOutcomeTier() : null;
        const lu = typeof E.luOutputTier === 'function' ? E.luOutputTier() : null;
        const detail = [
          truth ? `真相完整度：${truth.label}` : '',
          hospital && hasWitness() ? `医院状态：${hospital.label}` : '',
          lu && hasWitness() ? `陆念薇：${lu.label}` : ''
        ].filter(Boolean).join('<br>');
        return `你把第三段推理写完，钢笔在“公董局”三个字上停了很久。<br><br>现在案件已经不再是“谁杀了陈明远”，也不只是“苏晚亭去了哪里”。福生仓把学校、码头、傅启元和公董局手续链连在了一起。<br><br><span class="sys">${finalStatusText()}。</span>${detail ? `<br><br><div class="notice">${detail}</div>` : ''}<br><br>剩下的不是再找一个新地点，而是把这一夜造成的后果正式收束。`;
      },
      choices: () => {
        if (hasWitness() && !hospitalStarted()) {
          return [{ text: '🏥 先去医院，处理证人保护与后续口供', goto: 'ch4_hospital_conflict' }];
        }
        if (hasWitness() && !hasLuOutcome()) {
          return [{ text: '🕯️ 先处理陆念薇，让程序链条落地', goto: 'ch4_lu_confrontation' }];
        }
        return [
          { text: '🧾 写下最终结案材料', goto: () => E.v07ResolveEnding() },
          { text: '🔙 暂不收束，回到线索整理', goto: 'ch3_wrapup' }
        ];
      }
    };

    function patchChoicesToClosure(nodeId, matcher, replacementText) {
      const node = nodes[nodeId];
      if (!node || node.__finalClosureChoicesPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(base)) return base;
        if (!shouldShowFinalClosure()) return base;
        let replaced = false;
        const out = base.map(choice => {
          const text = choice.text || choice.fogText || '';
          const goto = typeof choice.goto === 'function' ? choice.goto(state) : choice.goto;
          if (matcher(choice, text, goto)) {
            replaced = true;
            return { text: replacementText, goto: 'ch4_final_closure' };
          }
          return choice;
        });
        if (!replaced && !out.some(choice => choice.goto === 'ch4_final_closure')) {
          out.unshift({ text: replacementText, goto: 'ch4_final_closure' });
        }
        return out;
      };
      node.__finalClosureChoicesPatched = true;
    }

    if (nodes.deduc_fusheng_ok && !nodes.deduc_fusheng_ok.__finalClosurePatched) {
      nodes.deduc_fusheng_ok.choices = [
        { text: '🧾 第三段推理完成，进入终局收束', goto: 'ch4_final_closure' },
        { text: '🔙 暂时回到线索整理', goto: 'ch3_wrapup' }
      ];
      nodes.deduc_fusheng_ok.__finalClosurePatched = true;
    }

    patchChoicesToClosure(
      'ch3_wrapup',
      (choice, text, goto) => goto === 'ch4_conclusion' || text.includes('回顾所有证据') || text.includes('准备收束'),
      '🧾 第三段推理已完成，进入终局收束'
    );

    patchChoicesToClosure(
      'ch4_conclusion',
      (choice, text) => text.includes('按证据链自然收束') || text.includes('结案') || text.includes('收束'),
      '🧾 写下最终结案材料'
    );

    E.__finalClosureFlowPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFinalClosureFlowPolish);
})();
