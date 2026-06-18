// ===== 医院证人压力兼容兜底 =====
// 目标：在医院/陆念薇/证词强化多个模块叠加后，保持医院主流程 smoke 的稳定语义。
// 1) 医院冲突页必须能看见“伤情记录”和“双救时苏晚亭立刻指认”。
// 2) 双证人 + 两样硬物证 + 陆念薇正式口供，不应被旧真相模型降回 solid。

(function installHospitalPressureWitnessCompatFix() {
  function applyHospitalPressureWitnessCompatFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalPressureWitnessCompatFixed) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function witnessProfile() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : {
            yufang: E.getFlag('rescued_yufang') || E.getFlag('found_yufang'),
            su: E.getFlag('rescued_su') || E.getFlag('found_su_at_dock'),
            count: (E.getFlag('rescued_yufang') || E.getFlag('found_yufang') ? 1 : 0) + (E.getFlag('rescued_su') || E.getFlag('found_su_at_dock') ? 1 : 0)
          };
    }

    function hasFullHardEvidence() {
      const clearance = hasThing('清场指令') || hasThing('公董局公文纸') || E.getFlag('fu_clearance_exposed');
      const waybill = hasThing('光华货运单') || hasThing('教具箱走私') || hasThing('管制药品走私') || E.getFlag('fu_waybill_exposed');
      return clearance && waybill;
    }

    function explicitSoloMode() {
      return E.getFlag('dock_solo_entry')
        || E.getFlag('dock_solo_waterline_escape')
        || E.getFlag('dock_solo_crate_screen')
        || E.getFlag('dock_solo_decoy_escape')
        || E.getFlag('dock_solo_hard_confront');
    }

    function doctorRecordChoice() {
      return {
        text: '🩺 先让医生写下伤情记录和关押痕迹',
        effect: () => {
          E.setFlag('hospital_doctor_record', true);
          E.addClue?.('医院伤情记录', '教会医院医生记录了沈玉芳与苏晚亭的伤情和长期拘禁痕迹。');
        },
        goto: 'ch4_hospital_doctor_record'
      };
    }

    function suIdentifyChoice() {
      return {
        text: '⚠️ 苏晚亭立刻指认车里的人',
        effect: () => E.setFlag('hospital_force_su_identify', true),
        goto: 'ch4_hospital_su_identify'
      };
    }

    if (nodes.ch4_hospital_conflict && !nodes.ch4_hospital_conflict.__pressureWitnessCompatPatched) {
      const oldChoices = nodes.ch4_hospital_conflict.choices;
      nodes.ch4_hospital_conflict.choices = function (state) {
        let out = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(out)) return out;
        out = out.slice();

        // SOLO 医院线保留“护士锁门/自行处理”的独立节奏，不强塞老孙/医生结构。
        if (explicitSoloMode()) return out;

        let hasDoctor = false;
        out = out.map(choice => {
          const text = choice.text || choice.fogText || '';
          if (choice.goto === 'ch4_hospital_doctor_record' || text.includes('伤情记录')) {
            hasDoctor = true;
            return { ...choice, text: text.includes('伤情记录') ? text : '🩺 先让医生写下伤情记录和关押痕迹' };
          }
          return choice;
        });
        if (!hasDoctor) out.splice(1, 0, doctorRecordChoice());

        const wp = witnessProfile();
        if (wp.su && !out.some(choice => String(choice.text || choice.fogText || '').includes('苏晚亭立刻指认'))) {
          const insertAt = Math.min(out.length, 3);
          out.splice(insertAt, 0, suIdentifyChoice());
        }
        return out;
      };
      nodes.ch4_hospital_conflict.__pressureWitnessCompatPatched = true;
    }

    if (typeof E.truthCompletenessTier === 'function' && !E.__hospitalTruthCompleteCompatPatched) {
      const oldTruth = E.truthCompletenessTier.bind(E);
      E.truthCompletenessTier = function () {
        const t = oldTruth();
        const wp = witnessProfile();
        if (wp.yufang && wp.su && hasFullHardEvidence() && this.getFlag('v07_lu_to_sun')) {
          return { ...(t || {}), key: 'complete', label: '真相完整', score: Math.max(10, Number(t?.score || 0)) };
        }
        return t;
      };
      E.__hospitalTruthCompleteCompatPatched = true;
    }

    E.__hospitalPressureWitnessCompatFixed = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalPressureWitnessCompatFix);
})();