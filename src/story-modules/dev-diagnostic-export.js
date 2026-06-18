// ===== 开发者诊断包导出 =====
// 目标：比纯 state 更适合发给 AI/开发者排障；导出本身必须尽量无副作用。
(function installDevDiagnosticExport() {
  function applyDevDiagnosticExport() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined' || typeof document === 'undefined') return;
    if (E.__devDiagnosticExportPatched) return;

    const params = new URLSearchParams(window.location?.search || '');
    const enabled = params.get('dev') === '1' || window.location?.hash === '#dev' || localStorage.getItem('mlt_dev_mode') === '1';
    if (!enabled) return;

    const fallbackDeductions = {
      deduce_chen: {
        id: 'deduce_chen', question: '陈明远的真正死因最有可能是？',
        options: ['A. 因愧对学生而自杀', 'B. 被陆小姐灭口——他发现了她的真实身份', 'C. 被吴校长灭口——他发现学校有非法交易', 'D. 因情感纠葛被苏晚亭牵连'],
        correctIdx: 1, successNode: 'deduc_success', failNode: 'deduc_fail',
        requiredClues: ['陈明远坠楼案', '恐吓信', '陆小姐的笔记', '陈明远的信']
      },
      deduce_lu_zhao: {
        id: 'deduce_lu_zhao', question: '陆小姐与黑衣男人的真实关系是？',
        options: ['A. 情人与合谋——他们一起做敲诈生意', 'B. 黑衣男人是陆小姐的上线——陆小姐受他指挥', 'C. 黑衣男在追查陆小姐——沈玉兰雇他调查', 'D. 没有关系——黑衣男只是恰好去过薛华立路'],
        correctIdx: 2, successNode: 'deduc_lu_zhao_ok', failNode: 'deduc_lu_zhao_fail',
        requiredClues: ['跟踪黑衣男人', '神秘女子', '沈玉兰的妹妹', '翡翠镯']
      },
      deduce_fusheng: {
        id: 'deduce_fusheng', question: '福生仓与公董局的关联意味着什么？',
        options: ['A. 一场普通的商业纠纷', 'B. 法租界高层有人利用学校掩护走私，陈老师和沈玉芳发现了真相', 'C. 吴校长私自挪用学校资金', 'D. 公董局要拆除光华小学建仓库'],
        correctIdx: 1, successNode: 'deduc_fusheng_ok', failNode: 'deduc_fusheng_fail',
        requiredClues: ['王巡官遗留纸条', '陈明远的信', '恐吓信', '公董局公文纸', '教具箱走私']
      }
    };

    function safeCall(fn, fallback = null) {
      try { return typeof fn === 'function' ? fn() : fallback; } catch (err) { return fallback; }
    }

    function clone(obj) {
      try { return JSON.parse(JSON.stringify(obj)); } catch (err) { return obj; }
    }

    function withStateSnapshot(fn, fallback = null) {
      const stateSnap = clone(E.state);
      const deductionsSnap = clone(E.deductions);
      try { return fn(); }
      catch (err) { return fallback; }
      finally {
        E.state = stateSnap;
        E.deductions = deductionsSnap;
      }
    }

    function findDeduction(id) {
      return Array.isArray(E.deductions) ? E.deductions.find(d => d && d.id === id) : null;
    }

    function repairDeductionRegistryForDiagnostic() {
      if (typeof E.repairDeductionRegistry === 'function') {
        safeCall(() => E.repairDeductionRegistry(), null);
      }
      if (!Array.isArray(E.deductions)) E.deductions = [];
      for (const [id, spec] of Object.entries(fallbackDeductions)) {
        if (!findDeduction(id)) E.deductions.push({ ...spec, solved: false });
      }
      const solvedMap = { deduce_chen: 'deduced_chen', deduce_lu_zhao: 'deduced_lu_zhao', deduce_fusheng: 'deduced_fusheng' };
      for (const [id, flag] of Object.entries(solvedMap)) {
        const d = findDeduction(id);
        if (d && E.getFlag?.(flag)) d.solved = true;
      }
    }

    function textOnly(html) {
      const div = document.createElement('div');
      div.innerHTML = String(html || '');
      return div.textContent.replace(/\s+/g, ' ').trim();
    }

    function currentChoices() {
      const id = E.state?.currentScene;
      const node = id ? nodes[id] : null;
      if (!node) return [];
      const raw = withStateSnapshot(() => typeof node.choices === 'function' ? node.choices(E.state) : node.choices, []);
      return (raw || []).map(choice => withStateSnapshot(() => {
        const locked = !!(choice.when && !choice.when(E.state));
        const goto = typeof choice.goto === 'function' ? safeCall(() => choice.goto(E.state), '[function error]') : choice.goto;
        return {
          text: choice.text || choice.fogText || '',
          locked,
          goto: goto || null,
          hasEffect: typeof choice.effect === 'function',
          fogHint: locked ? (choice.fogHint || '') : ''
        };
      }, { text: choice?.text || choice?.fogText || '', locked: false, goto: null, hasEffect: typeof choice?.effect === 'function', fogHint: '' }));
    }

    function sceneSummary() {
      const id = E.state?.currentScene;
      const node = id ? nodes[id] : null;
      if (!node) return { id, title: '', text: '', choices: [] };
      const rawText = withStateSnapshot(() => typeof node.text === 'function' ? node.text(E.state) : node.text, '');
      return { id, title: node.title || '', text: textOnly(rawText).slice(0, 1200), choices: currentChoices() };
    }

    function deductionSnapshot() {
      repairDeductionRegistryForDiagnostic();
      const ids = ['deduce_chen', 'deduce_lu_zhao', 'deduce_fusheng'];
      return ids.map(id => {
        const d = findDeduction(id);
        return {
          id,
          registered: !!d,
          solved: !!d?.solved || !!E.getFlag?.(id === 'deduce_chen' ? 'deduced_chen' : id === 'deduce_lu_zhao' ? 'deduced_lu_zhao' : 'deduced_fusheng'),
          canDeduce: withStateSnapshot(() => E.canDeduce(id), false),
          missing: withStateSnapshot(() => typeof E.deductionMissingFor === 'function' ? E.deductionMissingFor(id) : [], [])
        };
      });
    }

    function metricSnapshot() {
      const fns = [
        'dockSupportMode', 'dockExposureScore', 'dockDelayScore', 'dockHeatScore', 'dockHeatTier',
        'routeDockByPressure', 'routeDockDeepByPressure', 'routeSoloDockDeepByHeatDelay',
        'hospitalWitnessProfile', 'hospitalOutcomeTier', 'truthCompletenessTier', 'finalPressureProfile',
        'fuOfferLeverageScore', 'fuOfferPressureScore', 'fuOfferConsequenceTier', 'v07ResolveEnding'
      ];
      const out = {};
      for (const name of fns) {
        if (typeof E[name] === 'function') out[name] = withStateSnapshot(() => E[name](), '[error]');
      }
      return out;
    }

    function routeTail() {
      const log = Array.isArray(E.state?.sceneLog) ? E.state.sceneLog : [];
      return log.slice(-25).map(id => ({ id, title: nodes[id]?.title || id }));
    }

    function keyFlags() {
      const flags = E.state?.flags || {};
      const important = Object.keys(flags).filter(k => flags[k] === true && /deduced|dock|hospital|lu_|v07|fu_|school_|echo_|rescued|found|missed|sun_|solo|yufang|su_|wang|fusheng/i.test(k));
      return important.sort();
    }

    function buildDiagnosticPackage() {
      repairDeductionRegistryForDiagnostic();
      return {
        meta: { kind: 'mist-locked-trail-dev-diagnostic', exportedAt: new Date().toISOString(), url: location.href, userAgent: navigator.userAgent, saveVersion: E.state?.saveVersion || null },
        scene: sceneSummary(),
        counts: {
          clues: E.state?.clues?.length || 0,
          items: E.state?.items?.length || 0,
          contacts: E.state?.contacts?.length || 0,
          endings: E.state?.endings?.length || 0,
          flags: Object.keys(E.state?.flags || {}).length,
          deductions: Array.isArray(E.deductions) ? E.deductions.length : 0
        },
        chapter: E.state?.chapter,
        atmosphere: E.state?.atmosphere,
        pressure: E.state?.pressure,
        keyFlags: keyFlags(),
        deductions: deductionSnapshot(),
        metrics: metricSnapshot(),
        routeTail: routeTail(),
        state: E.state
      };
    }

    function copyText(text, okMsg) {
      const box = document.getElementById('dev-state-box');
      if (box) box.value = text;
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => E.toast(okMsg)).catch(() => E.toast('诊断包已生成，请手动复制文本框内容。'));
      else E.toast('诊断包已生成，请手动复制文本框内容。');
    }

    function exportDiagnostic() { copyText(JSON.stringify(buildDiagnosticPackage(), null, 2), '诊断包已复制。'); }
    function exportCompactDiagnostic() { const pkg = buildDiagnosticPackage(); delete pkg.state; copyText(JSON.stringify(pkg, null, 2), '精简诊断包已复制。'); }

    function addQuickButton() {
      if (document.getElementById('btn-dev-diagnostic')) return;
      const top = document.getElementById('top-actions');
      if (!top) return;
      const btn = document.createElement('button');
      btn.className = 'tool-btn primary';
      btn.id = 'btn-dev-diagnostic';
      btn.textContent = '📋 复制诊断';
      btn.onclick = exportDiagnostic;
      top.appendChild(btn);
    }

    function addPanelButtons() {
      const body = document.getElementById('dev-panel-body');
      if (!body || document.getElementById('dev-diagnostic-actions')) return;
      const row = document.createElement('div');
      row.id = 'dev-diagnostic-actions';
      row.className = 'dev-row dev-inline';
      row.innerHTML = '<button class="tool-btn primary" data-dev-diag="full">复制完整诊断包</button><button class="tool-btn" data-dev-diag="compact">复制精简诊断包</button><span class="panel-note">包含当前场景、选项、推理注册、关键评分与最近足迹。</span>';
      body.insertBefore(row, body.firstChild);
      row.addEventListener('click', ev => { const type = ev.target?.dataset?.devDiag; if (type === 'full') exportDiagnostic(); if (type === 'compact') exportCompactDiagnostic(); });
    }

    const oldOpen = window.MLT_DEV?.open;
    if (window.MLT_DEV) {
      window.MLT_DEV.exportDiagnostic = () => JSON.stringify(buildDiagnosticPackage(), null, 2);
      window.MLT_DEV.copyDiagnostic = exportDiagnostic;
      window.MLT_DEV.copyCompactDiagnostic = exportCompactDiagnostic;
      window.MLT_DEV.open = function () { if (typeof oldOpen === 'function') oldOpen(); setTimeout(addPanelButtons, 0); };
    }

    addQuickButton();
    document.addEventListener('click', () => setTimeout(addPanelButtons, 0), true);

    E.__devDiagnosticExportPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDevDiagnosticExport);
})();