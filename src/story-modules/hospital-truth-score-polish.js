// ===== 医院线真相分数模型 =====
// 目标：把“证人 + 物证”的真相底分，与医院状态分开计算。
// 底分来自证人数量与核心物证数量；医院线负责修正/封顶，而不是凭空替代缺失证据。
// 参考矩阵：
// 双证人+全物证=10；单证人+全物证=8；双证人+单物证=8；单证人+单物证=7；双证人+零物证=6；零证人+全物证=6。

(function installHospitalTruthScorePolish() {
  function applyHospitalTruthScorePolish() {
    if (typeof E === 'undefined') return;
    if (E.__hospitalTruthScorePolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function clearanceEvidenceReady() {
      return hasThing('清场指令')
        || hasThing('公董局公文纸')
        || hasThing('福生仓公董局公文纸')
        || hasThing('福生仓清场')
        || E.getFlag('fu_clearance_exposed');
    }

    function waybillEvidenceReady() {
      return hasThing('光华货运单')
        || hasThing('教具箱走私')
        || hasThing('管制药品走私')
        || hasThing('傅启元货运单破绽')
        || hasThing('光华小学采购疑点')
        || E.getFlag('fu_waybill_exposed');
    }

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    E.hospitalEvidenceProfile = function () {
      const witness = typeof this.hospitalWitnessProfile === 'function'
        ? this.hospitalWitnessProfile()
        : { count: 0, yufang: false, su: false, label: '证人缺席' };
      const clearance = clearanceEvidenceReady();
      const waybill = waybillEvidenceReady();
      const hardEvidenceCount = (clearance ? 1 : 0) + (waybill ? 1 : 0);
      return {
        witness,
        witnessCount: witness.count || 0,
        clearance,
        waybill,
        hardEvidenceCount,
        evidenceLabel: hardEvidenceCount >= 2 ? '全物证' : hardEvidenceCount === 1 ? '单物证' : '零物证'
      };
    };

    E.truthBaseScore = function () {
      const p = this.hospitalEvidenceProfile();
      const w = p.witnessCount;
      const e = p.hardEvidenceCount;

      if (w >= 2 && e >= 2) return 10;
      if (w === 1 && e >= 2) return 8;
      if (w >= 2 && e === 1) return 8;
      if (w === 1 && e === 1) return 7;
      if (w >= 2 && e === 0) return 6;
      if (w === 0 && e >= 2) return 6;
      if (w === 1 && e === 0) return 5;
      if (w === 0 && e === 1) return 4;
      return 2;
    };

    E.truthScoreDetails = function () {
      const p = this.hospitalEvidenceProfile();
      const base = this.truthBaseScore();
      const hospital = typeof this.hospitalOutcomeTier === 'function'
        ? this.hospitalOutcomeTier()
        : { key: 'controlled', label: '可控医院线' };
      const modifiers = [];
      let score = base;

      if (this.getFlag('hospital_doctor_record') && p.witnessCount > 0) {
        score += 1;
        modifiers.push({ key: 'doctor_record', delta: 1, label: '医院伤情记录补强证词可信度' });
      }
      if (this.getFlag('v07_lu_to_sun')) {
        score += 1;
        modifiers.push({ key: 'lu_formal', delta: 1, label: '陆念薇正式转交老孙，补齐公董局链条' });
      } else if (this.getFlag('v07_lu_statement')) {
        score += 1;
        modifiers.push({ key: 'lu_statement', delta: 1, label: '陆念薇补充证词，补强傅启元链条' });
      }

      if (hospital.key === 'tense') {
        score -= 1;
        modifiers.push({ key: 'hospital_tense', delta: -1, label: '医院线紧张，证词可用但稳定性受损' });
      }
      if (hospital.key === 'unstable') {
        score -= 2;
        modifiers.push({ key: 'hospital_unstable', delta: -2, label: '医院线失控，证词质量明显受损' });
      }

      let cap = 10;
      const capReasons = [];
      if (p.witnessCount === 0) {
        cap = Math.min(cap, 6);
        capReasons.push('零证人最多只能靠全物证撑到 6 分真相');
      } else if (p.witnessCount === 1) {
        cap = Math.min(cap, 9);
        capReasons.push('单证人路线不能伪装成双证人完整真相');
      }
      if (p.hardEvidenceCount === 0) {
        cap = Math.min(cap, 6);
        capReasons.push('零物证路线缺少码头硬证据，上限为 6');
      }
      if (hospital.key === 'tense') {
        cap = Math.min(cap, 9);
        capReasons.push('医院线紧张，真隐藏资格受限');
      }
      if (hospital.key === 'unstable') {
        cap = Math.min(cap, 7);
        capReasons.push('医院线失控，证词程序价值被压低');
      }

      score = clamp(score, 0, cap);
      return {
        score,
        base,
        cap,
        capReasons,
        modifiers,
        hospital,
        witnessCount: p.witnessCount,
        hardEvidenceCount: p.hardEvidenceCount,
        witnessLabel: p.witness.label,
        evidenceLabel: p.evidenceLabel,
        clearance: p.clearance,
        waybill: p.waybill
      };
    };

    E.truthCompletenessTier = function () {
      const d = this.truthScoreDetails();
      if (d.score >= 10) return { key: 'complete', label: '10分真相 / 真相完整', ...d };
      if (d.score >= 8) return { key: 'solid', label: `${d.score}分真相 / 真相较完整`, ...d };
      if (d.score >= 6) return { key: 'partial', label: `${d.score}分真相 / 真相可成立`, ...d };
      return { key: 'weak', label: `${d.score}分真相 / 证据链薄弱`, ...d };
    };

    E.__hospitalTruthScorePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalTruthScorePolish);
})();
