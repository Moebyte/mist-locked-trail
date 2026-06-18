// ===== 第三段推理作为最终结局门 =====
// 目标：第三段推理“福生仓与公董局”必须是结局前最后一道门。
// 流程：
// 1) 有证人：先完成医院线与陆念薇线，再开放第三段推理。
// 2) 无证人：直接开放第三段推理。
// 3) 第三段推理完成后，直接写最终结案材料并进入结局。

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

    function hospitalDone() {
      return E.getFlag('v07_choice_protect_witnesses')
        || E.getFlag('hospital_protect_witnesses')
        || E.getFlag('hospital_doctor_record')
        || E.getFlag('v07_choice_hold_blockade')
        || E.getFlag('v07_choice_late_blockade')
        || E.getFlag('v07_choice_pressure_fu')
        || E.getFlag('v07_choice_blockade_after_interference')
        || E.getFlag('v07_choice_draw_lu');
    }

    function thirdDeductionReady() {
      if (!E.getFlag('deduced_lu_zhao')) return false;
      if (!hasWitness()) return true;
      return hospitalDone() && hasLuOutcome();
    }

    function finalStatusText() {
      const parts = [];
      parts.push('第三段推理已经完成');
      if (hasWitness()) parts.push('医院线与陆念薇线已经定型');
      else parts.push('无人证路线按证据链收束');
      parts.push('可以写最终结案材料');
      return parts.join('；');
    }

    nodes.ch4_final_closure = {
      title: '终局 · 落笔',
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
        return `你把第三段推理写完，钢笔在“公董局”三个字上停了很久。<br><br>现在案件已经不再是“谁杀了陈明远”，也不只是“苏晚亭去了哪里”。福生仓把学校、码头、傅启元和公董局手续链连在了一起。<br><br><span class="sys">${finalStatusText()}。</span>${detail ? `<br><br><div class="notice">${detail}</div>` : ''}<br><br>剩下的不是再找一个新地点，而是把这一夜造成的后果写进最终结案材料。`;
      },
      choices: () => [
        { text: '🧾 写下最终结案材料', goto: () => E.v07ResolveEnding() },
        { text: '🔙 暂不落笔，回到线索整理', goto: 'ch3_wrapup' }
      ]
    };

    function patchChoices(nodeId, transform) {
      const node = nodes[nodeId];
      if (!node || node.__finalClosureChoicesPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(base)) return base;
        return transform(base, state);
      };
      node.__finalClosureChoicesPatched = true;
    }

    // 第三段推理成功后，直接进入最终落笔；不再回补医院/陆念薇。
    if (nodes.deduc_fusheng_ok && !nodes.deduc_fusheng_ok.__finalClosurePatched) {
      nodes.deduc_fusheng_ok.choices = [
        { text: '🧾 第三段推理完成，写下最终结案材料', goto: 'ch4_final_closure' },
        { text: '🔙 暂时回到线索整理', goto: 'ch3_wrapup' }
      ];
      nodes.deduc_fusheng_ok.__finalClosurePatched = true;
    }

    // 有证人时，第三段推理入口前置检查医院/陆念薇；无证人时直接允许第三段推理。
    patchChoices('ch3_wrapup', (base, state) => {
      let out = base.slice();

      if (E.getFlag('deduced_fusheng')) {
        const hasClosure = out.some(choice => choice.goto === 'ch4_final_closure');
        out = out.filter(choice => {
          const text = choice.text || choice.fogText || '';
          const goto = typeof choice.goto === 'function' ? choice.goto(state) : choice.goto;
          return goto !== 'ch4_conclusion' && !text.includes('回顾所有证据') && !text.includes('准备收束');
        });
        if (!hasClosure) out.unshift({ text: '🧾 第三段推理已完成，写下最终结案材料', goto: 'ch4_final_closure' });
        return out;
      }

      if (hasWitness() && !hospitalDone()) {
        out = out.filter(choice => {
          const text = choice.text || choice.fogText || '';
          return !text.includes('福生仓与公董局') && !text.includes('deduce_fusheng');
        });
        if (!out.some(choice => choice.goto === 'ch4_hospital_conflict')) {
          out.unshift({ text: '🏥 先完成医院线，再做第三段推理', goto: 'ch4_hospital_conflict' });
        }
        return out;
      }

      if (hasWitness() && hospitalDone() && !hasLuOutcome()) {
        out = out.filter(choice => {
          const text = choice.text || choice.fogText || '';
          return !text.includes('福生仓与公董局') && !text.includes('deduce_fusheng');
        });
        if (!out.some(choice => choice.goto === 'ch4_lu_confrontation')) {
          out.unshift({ text: '🕯️ 先处理陆念薇，再做第三段推理', goto: 'ch4_lu_confrontation' });
        }
        return out;
      }

      if (thirdDeductionReady() && !out.some(choice => (choice.text || '').includes('福生仓与公董局'))) {
        out.unshift({ text: '🧩 第三段推理——福生仓与公董局', effect: () => E.openDeductionSafe ? E.openDeductionSafe('deduce_fusheng') : E.openDeduction('deduce_fusheng') });
      }

      return out;
    });

    patchChoices('ch4_conclusion', (base, state) => {
      if (!E.getFlag('deduced_fusheng')) return base;
      let replaced = false;
      const out = base.map(choice => {
        const text = choice.text || choice.fogText || '';
        if (text.includes('按证据链自然收束') || text.includes('结案') || text.includes('收束')) {
          replaced = true;
          return { text: '🧾 写下最终结案材料', goto: () => E.v07ResolveEnding() };
        }
        return choice;
      });
      if (!replaced) out.unshift({ text: '🧾 写下最终结案材料', goto: () => E.v07ResolveEnding() });
      return out;
    });

    E.__finalClosureFlowPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFinalClosureFlowPolish);
})();