// ===== 推理题注册最终兜底 =====
// 目标：读档或模块顺序导致 E.deductions 为空时，点击推理入口仍能补登记，而不是提示“推理题尚未登记”。

(function installDeductionRegistryFinalFix() {
  function applyDeductionRegistryFinalFix() {
    if (typeof E === 'undefined') return;
    if (E.__deductionRegistryFinalFixPatched) return;

    const fallbackDeductions = {
      deduce_chen: {
        id: 'deduce_chen',
        question: '陈明远的真正死因最有可能是？',
        options: [
          'A. 因愧对学生而自杀',
          'B. 被陆小姐灭口——他发现了她的真实身份',
          'C. 被吴校长灭口——他发现学校有非法交易',
          'D. 因情感纠葛被苏晚亭牵连'
        ],
        correctIdx: 1,
        successNode: 'deduc_success',
        failNode: 'deduc_fail',
        requiredClues: ['陈明远坠楼案', '恐吓信', '陆小姐的笔记', '陈明远的信']
      },
      deduce_lu_zhao: {
        id: 'deduce_lu_zhao',
        question: '陆小姐与黑衣男人的真实关系是？',
        options: [
          'A. 情人与合谋——他们一起做敲诈生意',
          'B. 黑衣男人是陆小姐的上线——陆小姐受他指挥',
          'C. 黑衣男在追查陆小姐——沈玉兰雇他调查',
          'D. 没有关系——黑衣男只是恰好去过薛华立路'
        ],
        correctIdx: 2,
        successNode: 'deduc_lu_zhao_ok',
        failNode: 'deduc_lu_zhao_fail',
        requiredClues: ['跟踪黑衣男人', '神秘女子', '沈玉兰的妹妹', '翡翠镯']
      },
      deduce_fusheng: {
        id: 'deduce_fusheng',
        question: '福生仓与公董局的关联意味着什么？',
        options: [
          'A. 一场普通的商业纠纷',
          'B. 法租界高层有人利用学校掩护走私，陈老师和沈玉芳发现了真相',
          'C. 吴校长私自挪用学校资金',
          'D. 公董局要拆除光华小学建仓库'
        ],
        correctIdx: 1,
        successNode: 'deduc_fusheng_ok',
        failNode: 'deduc_fusheng_fail',
        requiredClues: ['王巡官遗留纸条', '陈明远的信', '恐吓信', '公董局公文纸', '教具箱走私']
      }
    };

    function findDeduction(id) {
      return Array.isArray(E.deductions) ? E.deductions.find(d => d && d.id === id) : null;
    }

    function registerFallback(id) {
      const spec = fallbackDeductions[id];
      if (!spec) return null;
      if (!Array.isArray(E.deductions)) E.deductions = [];
      const existing = findDeduction(id);
      if (existing) return existing;
      E.deductions.push({ ...spec, solved: false });
      return findDeduction(id);
    }

    function ensureDeduction(id) {
      if (!Array.isArray(E.deductions)) E.deductions = [];
      let d = findDeduction(id);
      if (d) return d;
      if (typeof E.registerAll === 'function') {
        try { E.registerAll(); } catch (err) {}
        d = findDeduction(id);
      }
      return d || registerFallback(id);
    }

    const oldEnsure = typeof E.ensureDeductionRegistered === 'function' ? E.ensureDeductionRegistered.bind(E) : null;
    E.ensureDeductionRegistered = function (id) {
      const d = oldEnsure ? oldEnsure(id) : null;
      return d || ensureDeduction(id);
    };

    const oldOpenDeductionSafe = typeof E.openDeductionSafe === 'function' ? E.openDeductionSafe.bind(E) : null;
    E.openDeductionSafe = function (id) {
      const d = ensureDeduction(id);
      if (!d) {
        this.toast('推理题尚未登记，请刷新页面后重试。');
        return false;
      }
      if (oldOpenDeductionSafe) {
        const before = !!(this.deducEl && this.deducEl.style && this.deducEl.style.display === 'flex');
        const result = oldOpenDeductionSafe(id);
        const opened = !!(this.deducEl && this.deducEl.style && this.deducEl.style.display === 'flex');
        if (result || opened || before) return result || opened || before;
      }
      if (typeof this.openDeduction === 'function') {
        this.openDeduction(id);
        return !!(this.deducEl && this.deducEl.style && this.deducEl.style.display === 'flex');
      }
      return false;
    };

    const oldOpenDeduction = typeof E.openDeduction === 'function' ? E.openDeduction.bind(E) : null;
    if (oldOpenDeduction) {
      E.openDeduction = function (id) {
        ensureDeduction(id);
        return oldOpenDeduction(id);
      };
    }

    E.__deductionRegistryFinalFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDeductionRegistryFinalFix);
})();