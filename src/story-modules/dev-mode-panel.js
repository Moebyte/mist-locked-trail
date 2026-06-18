// ===== 浏览器开发者模式 =====
// 入口：在地址后加 ?dev=1 或 #dev；关闭：?dev=0 或在控制台 localStorage.removeItem('mlt_dev_mode')。
// 功能：跳场景、套用预设、勾选常用线索/道具/flag、导出/导入状态。

(function installDevModePanel() {
  function applyDevModePanel() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined' || typeof document === 'undefined') return;
    if (E.__devModePanelPatched) return;

    const params = new URLSearchParams(window.location?.search || '');
    if (params.get('dev') === '1') localStorage.setItem('mlt_dev_mode', '1');
    if (params.get('dev') === '0') localStorage.removeItem('mlt_dev_mode');
    const enabled = params.get('dev') === '1' || window.location?.hash === '#dev' || localStorage.getItem('mlt_dev_mode') === '1';
    if (!enabled) return;

    const DEV_CLUES = [
      '苏母知道周怀安婚约', '为情而去说法存疑', '苏母认出照片', '苏母托付信物',
      '陈明远的信', '陈明远残信', '苏晚亭疑似遗书', '陈明远的退缩', '光华小学箱子异常',
      '203 室恐吓信', '三人合影', '杭州旧案剪报', '陆念薇旧名', '陆小姐的笔记',
      '苏晚亭日记残页', '黑衣男人线索', '沈玉兰的妹妹', '推理结论：黑衣男是暗线',
      '推理结论：陈明远被灭口', '光华小学不完整结论', '王巡官遗留纸条', '福生仓标识',
      '公董局公文纸', '教具箱走私', '光华货运单', '沈玉芳证词'
    ];

    const DEV_ITEMS = [
      '苏晚亭的照片', '苏晚亭的银发夹', '陈明远的信', '陈明远残信', '苏晚亭疑似遗书',
      '永昌当票', '翡翠镯', '三人合影', '日记残页', '法租界地图', '半张烟盒纸',
      '光华货运单', '清场指令', '暗室刻痕拓片'
    ];

    const DEV_FLAGS = [
      'deduced_chen', 'deduced_lu_zhao', 'deduced_fusheng',
      'school_incomplete_closure', 'school_truth_partial_only', 'school_wu_three_proofs',
      'chen_letter_packet_altered', 'su_mother_knows_zhou_fiance', 'shown_photo_to_mother',
      'got_wang_note', 'shown_map_to_landlord', 'presented_jade_to_zhou', 'presented_jade_to_zhou_premature',
      'found_yufang', 'rescued_yufang', 'found_su_at_dock', 'rescued_su', 'presented_su_keepsake',
      'dock_solo_entry', 'dock_exit_side_lane', 'solo_darkroom_marks', 'solo_rescuer_trust'
    ];

    const PRESETS = {
      empty: {
        label: '空状态', scene: 'ch1_open', clues: [], items: [], flags: {}
      },
      guanghuaIncompleteWu: {
        label: '非三证 · 吴校长方向', scene: 'ch4_conclusion',
        clues: ['推理结论：陈明远被灭口', '光华小学箱子异常', '光华小学不完整结论', '三人合影'],
        items: ['永昌当票'],
        flags: { deduced_chen: true, school_incomplete_closure: true, school_truth_partial_only: true }
      },
      wuaiWithoutSuHome: {
        label: '吾爱晚亭 · 未查苏家', scene: 'ch4_conclusion',
        clues: ['陈明远残信', '苏晚亭疑似遗书', '推理结论：陈明远被灭口'],
        items: ['陈明远残信', '苏晚亭疑似遗书'],
        flags: { deduced_chen: true, chen_letter_packet_altered: true, school_incomplete_closure: true }
      },
      wuaiBlockedBySuHome: {
        label: '吾爱晚亭反证 · 已查苏家', scene: 'ch4_conclusion',
        clues: ['陈明远残信', '苏晚亭疑似遗书', '苏母知道周怀安婚约', '为情而去说法存疑'],
        items: ['陈明远残信', '苏晚亭疑似遗书'],
        flags: { deduced_chen: true, chen_letter_packet_altered: true, school_incomplete_closure: true, su_mother_knows_zhou_fiance: true }
      },
      zhouJadeFull: {
        label: '当铺后 · 周怀安翡翠镯', scene: 'ch4_revisit_zhou',
        clues: ['法租界地图', '福生仓标识', '王巡官遗留纸条', '陈明远的信', '陆念薇旧名'],
        items: ['翡翠镯', '半张烟盒纸', '陈明远的信'],
        flags: { deduced_chen: true, shown_map_to_landlord: true, got_wang_note: true }
      },
      fushengReady: {
        label: '福生仓前 · 全前置', scene: 'ch3_wrapup',
        clues: ['推理结论：陈明远被灭口', '推理结论：黑衣男是暗线', '陈明远的信', '203 室恐吓信', '三人合影', '苏晚亭日记残页', '福生仓标识', '王巡官遗留纸条'],
        items: ['陈明远的信', '三人合影', '日记残页', '半张烟盒纸'],
        flags: { deduced_chen: true, deduced_lu_zhao: true, shown_map_to_landlord: true, got_wang_note: true, school_wu_three_proofs: true }
      },
      hospitalFull: {
        label: '医院/陆小姐前 · 双证人', scene: 'ch4_hospital_conflict',
        clues: ['推理结论：法租界利益链', '沈玉芳证词', '公董局公文纸', '教具箱走私'],
        items: ['光华货运单', '清场指令'],
        flags: { deduced_chen: true, deduced_lu_zhao: true, deduced_fusheng: true, found_yufang: true, rescued_yufang: true, found_su_at_dock: true, rescued_su: true }
      },
      soloLantern: {
        label: 'Solo · 孤灯照雾候选', scene: 'ch4_final_closure',
        clues: ['推理结论：法租界利益链', '沈玉芳证词', '公董局公文纸', '教具箱走私', '暗室刻痕'],
        items: ['光华货运单', '清场指令', '暗室刻痕拓片'],
        flags: { deduced_chen: true, deduced_lu_zhao: true, deduced_fusheng: true, dock_solo_entry: true, dock_exit_side_lane: true, found_yufang: true, rescued_yufang: true, found_su_at_dock: true, rescued_su: true, solo_darkroom_marks: true, solo_rescuer_trust: true, hospital_stable: true, lu_private: true }
      }
    };

    function ensureArray(name) {
      if (!Array.isArray(E.state[name])) E.state[name] = [];
      return E.state[name];
    }

    function upsertByName(listName, name, desc = '开发者模式添加') {
      const list = ensureArray(listName);
      if (!list.some(x => x.name === name)) list.push({ name, desc });
    }

    function removeByName(listName, name) {
      E.state[listName] = ensureArray(listName).filter(x => x.name !== name);
    }

    function setFlag(name, checked) {
      if (!E.state.flags) E.state.flags = {};
      if (checked) E.state.flags[name] = true;
      else delete E.state.flags[name];
    }

    function safeGo(sceneId) {
      const id = String(sceneId || '').trim();
      if (!id) return E.toast('请输入场景 ID。');
      if (!nodes[id]) return E.toast(`场景不存在：${id}`);
      document.getElementById('title-screen').style.display = 'none';
      document.getElementById('log').style.display = 'block';
      document.getElementById('scene-card').style.display = 'block';
      document.getElementById('top-actions').style.display = 'flex';
      document.getElementById('status-bar').style.display = 'flex';
      E.go(id);
    }

    function applyPreset(key) {
      const preset = PRESETS[key];
      if (!preset) return E.toast(`未知预设：${key}`);
      const endings = Array.isArray(E.state?.endings) ? E.state.endings : [];
      E.state = E.freshState();
      E.state.endings = endings;
      for (const clue of preset.clues || []) upsertByName('clues', clue);
      for (const item of preset.items || []) upsertByName('items', item);
      E.state.flags = { ...(preset.flags || {}) };
      E.state.chapter = 3;
      E.state.currentScene = preset.scene;
      E.updateStatus();
      refreshDevPanel();
      safeGo(preset.scene);
      E.toast(`已套用预设：${preset.label}`);
    }

    function exportState() {
      const text = JSON.stringify(E.state, null, 2);
      const box = document.getElementById('dev-state-box');
      if (box) box.value = text;
      navigator.clipboard?.writeText(text).catch(() => {});
      E.toast('当前状态已导出。');
    }

    function importState() {
      const box = document.getElementById('dev-state-box');
      if (!box) return;
      try {
        const data = JSON.parse(box.value);
        E.state = E.migrateSaveState ? E.migrateSaveState(data) : Object.assign(E.freshState(), data);
        E.updateStatus();
        refreshDevPanel();
        if (E.state.currentScene && nodes[E.state.currentScene]) safeGo(E.state.currentScene);
        E.toast('状态已导入。');
      } catch (err) {
        console.error(err);
        E.toast('导入失败：JSON 不合法。');
      }
    }

    function checkbox(name, type) {
      const checked = type === 'clue' ? E.hasClue(name) : type === 'item' ? E.hasItem(name) : !!E.getFlag(name);
      return `<label class="dev-check"><input type="checkbox" data-dev-${type}="${name.replace(/"/g, '&quot;')}" ${checked ? 'checked' : ''}>${name}</label>`;
    }

    function refreshDevPanel() {
      const panel = document.getElementById('dev-panel-body');
      if (!panel) return;
      const current = E.state?.currentScene || '—';
      panel.innerHTML = `
        <div class="dev-row"><b>当前场景：</b><code>${current}</code></div>
        <div class="dev-row dev-inline">
          <input id="dev-scene-id" placeholder="输入场景 ID，如 ch4_revisit_zhou" value="${current !== '—' ? current : ''}">
          <button class="tool-btn" data-dev-action="goto">跳转</button>
          <button class="tool-btn" data-dev-action="rerender">重渲染</button>
        </div>
        <div class="dev-row dev-inline">
          <select id="dev-preset-select">
            ${Object.entries(PRESETS).map(([key, p]) => `<option value="${key}">${p.label}</option>`).join('')}
          </select>
          <button class="tool-btn primary" data-dev-action="preset">套用预设</button>
        </div>
        <details open><summary>常用线索</summary><div class="dev-grid">${DEV_CLUES.map(name => checkbox(name, 'clue')).join('')}</div></details>
        <details><summary>常用道具</summary><div class="dev-grid">${DEV_ITEMS.map(name => checkbox(name, 'item')).join('')}</div></details>
        <details><summary>常用 Flag</summary><div class="dev-grid">${DEV_FLAGS.map(name => checkbox(name, 'flag')).join('')}</div></details>
        <details><summary>状态导入 / 导出</summary>
          <div class="dev-row dev-inline">
            <button class="tool-btn" data-dev-action="export">导出状态</button>
            <button class="tool-btn" data-dev-action="import">导入状态</button>
            <button class="tool-btn" data-dev-action="save">保存当前状态</button>
          </div>
          <textarea id="dev-state-box" spellcheck="false" placeholder="这里会显示 JSON 状态，也可以粘贴导入"></textarea>
        </details>
      `;
    }

    function ensureDevUi() {
      if (document.getElementById('btn-dev-mode')) return;
      const top = document.getElementById('top-actions');
      if (top) {
        const btn = document.createElement('button');
        btn.className = 'tool-btn primary';
        btn.id = 'btn-dev-mode';
        btn.textContent = '🛠 开发者';
        btn.onclick = () => openDevPanel();
        top.appendChild(btn);
      }

      const wrap = document.createElement('div');
      wrap.id = 'dev-panel';
      wrap.style.display = 'none';
      wrap.innerHTML = `
        <div id="dev-mask"></div>
        <div id="dev-panel-card">
          <div id="dev-panel-head"><h2>开发者模式</h2><button class="tool-btn" id="btn-close-dev">关闭</button></div>
          <div class="notice">仅在 <code>?dev=1</code> / <code>#dev</code> 下显示。可用于快速复现路线，不会影响正式入口。</div>
          <div id="dev-panel-body"></div>
        </div>`;
      document.body.appendChild(wrap);
      document.getElementById('dev-mask').onclick = closeDevPanel;
      document.getElementById('btn-close-dev').onclick = closeDevPanel;
      wrap.addEventListener('change', ev => {
        const t = ev.target;
        if (t?.dataset?.devClue) { t.checked ? upsertByName('clues', t.dataset.devClue) : removeByName('clues', t.dataset.devClue); E.updateStatus(); }
        if (t?.dataset?.devItem) { t.checked ? upsertByName('items', t.dataset.devItem) : removeByName('items', t.dataset.devItem); E.updateStatus(); }
        if (t?.dataset?.devFlag) { setFlag(t.dataset.devFlag, t.checked); E.updateStatus(); }
      });
      wrap.addEventListener('click', ev => {
        const action = ev.target?.dataset?.devAction;
        if (!action) return;
        if (action === 'goto') safeGo(document.getElementById('dev-scene-id')?.value);
        if (action === 'rerender') safeGo(E.state.currentScene);
        if (action === 'preset') applyPreset(document.getElementById('dev-preset-select')?.value);
        if (action === 'export') exportState();
        if (action === 'import') importState();
        if (action === 'save') E.saveGame(true);
      });

      const style = document.createElement('style');
      style.textContent = `
        #dev-panel{position:fixed;inset:0;z-index:80;align-items:center;justify-content:center;padding:18px}
        #dev-panel[style*="flex"]{display:flex!important}
        #dev-mask{position:absolute;inset:0;background:rgba(0,0,0,.68)}
        #dev-panel-card{position:relative;width:min(920px,96vw);max-height:88vh;overflow:auto;background:var(--surface);border:1px solid var(--line2);box-shadow:var(--shadow);padding:16px;border-radius:6px}
        #dev-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--line);padding-bottom:10px}
        #dev-panel-head h2{font-size:18px;color:var(--gold);letter-spacing:3px;font-weight:normal}
        .dev-row{margin:10px 0}.dev-inline{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        #dev-panel input,#dev-panel select,#dev-panel textarea{background:var(--surface2);border:1px solid var(--line);color:var(--text);font-family:inherit;padding:8px;border-radius:3px}
        #dev-scene-id{min-width:300px;flex:1}#dev-state-box{width:100%;min-height:180px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.5}
        #dev-panel summary{cursor:pointer;color:var(--gold2);padding:10px 0;border-top:1px solid var(--line);margin-top:8px}
        .dev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:6px 10px}.dev-check{font-size:13px;color:var(--text2);display:flex;gap:6px;align-items:center;line-height:1.5}
      `;
      document.head.appendChild(style);
    }

    function openDevPanel() {
      ensureDevUi();
      refreshDevPanel();
      document.getElementById('dev-panel').style.display = 'flex';
    }

    function closeDevPanel() {
      const el = document.getElementById('dev-panel');
      if (el) el.style.display = 'none';
    }

    ensureDevUi();
    window.MLT_DEV = {
      open: openDevPanel,
      close: closeDevPanel,
      preset: applyPreset,
      goto: safeGo,
      addClue: name => { upsertByName('clues', name); E.updateStatus(); refreshDevPanel(); },
      addItem: name => { upsertByName('items', name); E.updateStatus(); refreshDevPanel(); },
      setFlag: (name, value = true) => { setFlag(name, !!value); E.updateStatus(); refreshDevPanel(); },
      exportState: () => JSON.stringify(E.state, null, 2),
      importState: json => { E.state = JSON.parse(json); E.updateStatus(); refreshDevPanel(); },
    };

    E.__devModePanelPatched = true;
    console.info('[MLT_DEV] 开发者模式已启用。使用 MLT_DEV.open() 打开面板。');
  }

  document.addEventListener('DOMContentLoaded', applyDevModePanel);
})();
