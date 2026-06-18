// ===== 福生仓现场证据确认面板 =====
// 目标：福生仓现场不是简单“调查按钮”，而是明确告诉玩家：现场已经确认过哪些关键证据。
// 证据项：
// 1) 清场指令 / 蓝封公文纸：程序压力与傅启元清场。
// 2) 光华教具箱 / 货运单：学校名义和福生仓货路。
// 3) 暗室痕迹：关押事实，不只是口供。
// 4) 傅启元/陆念薇对话或码头正面压制：人物链条。
// 本模块只补确认面板和统一 flag，不改变潜入热度/逃离机制。

(function installFushengSceneEvidencePanel() {
  function applyFushengSceneEvidencePanel() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__fushengSceneEvidencePanelPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function confirmClearance(prefix = '福生仓现场') {
      E.setFlag('scene_confirmed_clearance_order', true);
      E.setFlag('dock_clearance_seen_inside', true);
      E.setFlag('fu_clearance_exposed', true);
      E.addItem('清场指令', '三日内清走，别留痕迹。信纸带有公董局蓝封纸角。');
      E.addClue('公董局公文纸', `${prefix}确认清场指令写在公董局蓝封公文纸上。`);
      E.addClue('现场确认：清场指令', '你在福生仓现场确认有人要求三日内清走箱子和人，不留痕迹。');
    }

    function confirmWaybill(prefix = '福生仓现场') {
      E.setFlag('scene_confirmed_waybill_crates', true);
      E.setFlag('fu_waybill_exposed', true);
      E.addItem('光华货运单', '福生仓货箱夹层里的货运单，发货名义是光华小学教学器材。');
      E.addClue('教具箱走私', `${prefix}确认标着光华小学的教具箱里装的是洋酒和香烟，不是教学器材。`);
      E.addClue('现场确认：光华货运单', '你在福生仓现场确认光华小学名义的货运单接到了福生仓。');
    }

    function confirmDarkroom(prefix = '福生仓现场') {
      E.setFlag('scene_confirmed_darkroom_marks', true);
      E.addClue('仓库暗室', `${prefix}确认木箱后有暗门，里面被改造成囚室。`);
      E.addClue('现场确认：暗室关押痕迹', '暗室里的床、水桶、煤油灯和墙面刻痕证明这里长期关过人，不只是证人口供。');
      if (E.getFlag('dock_solo_entry') || E.getFlag('solo_darkroom_marks')) {
        E.setFlag('solo_darkroom_marks', true);
        E.addItem('暗室刻痕拓片', '暗室墙面刻痕的拓片，能证明有人曾被长期关在福生仓。');
      }
    }

    function confirmConversation(prefix = '福生仓现场') {
      E.setFlag('scene_confirmed_fu_lu_conversation', true);
      E.addClue('现场确认：傅启元与陆念薇对话', `${prefix}听见傅启元与陆念薇谈到清场、转运和知情人，人物链条不再只靠推测。`);
    }

    function confirmedSummary() {
      const parts = [];
      if (E.getFlag('scene_confirmed_clearance_order') || hasThing('清场指令') || hasThing('公董局公文纸')) parts.push('清场指令/蓝封公文纸');
      if (E.getFlag('scene_confirmed_waybill_crates') || hasThing('光华货运单') || hasThing('教具箱走私')) parts.push('光华教具箱/货运单');
      if (E.getFlag('scene_confirmed_darkroom_marks') || hasThing('仓库暗室') || hasThing('现场确认：暗室关押痕迹')) parts.push('暗室关押痕迹');
      if (E.getFlag('scene_confirmed_fu_lu_conversation') || E.getFlag('dock_sun_pressed_fu') || hasThing('现场确认：傅启元与陆念薇对话')) parts.push('傅启元/陆念薇人物链条');
      return parts.length ? parts.join('；') : '尚未确认任何现场核心证据';
    }

    function panelNotice() {
      return `<div class="notice"><b>福生仓现场确认</b><br>${confirmedSummary()}。</div>`;
    }

    function addPanelText(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__fushengScenePanelTextPatched) return;
      const oldText = node.text;
      node.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br>${panelNotice()}`;
      };
      node.__fushengScenePanelTextPatched = true;
    }

    function appendChoice(nodeId, choiceFactory, key) {
      const node = nodes[nodeId];
      if (!node || node[`__${key}Patched`]) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        const out = Array.isArray(base) ? base.slice() : [];
        const choice = choiceFactory();
        if (choice && !out.some(x => x.goto === choice.goto && x.text === choice.text)) out.unshift(choice);
        return out;
      };
      node[`__${key}Patched`] = true;
    }

    // 账房/蓝封纸节点：进入账房时原剧情已经读取并收好蓝封纸，不再额外塞“现场确认”按钮。
    for (const id of ['ch4_dock_inner_office', 'ch4_dock_inner_office_limited', 'ch4_dock_inside']) {
      if (nodes[id] && !nodes[id].__sceneClearanceEffectPatched) {
        const oldEffect = nodes[id].effect;
        nodes[id].effect = function (state) {
          if (typeof oldEffect === 'function') oldEffect(state);
          if (id === 'ch4_dock_inside') confirmClearance('福生仓入口处');
        };
        nodes[id].__sceneClearanceEffectPatched = true;
      }
      addPanelText(id);
    }

    // 教具箱节点：进入该节点时直接确认货运单，避免在货架页出现两个近似“检查教具箱”选项。
    if (nodes.ch4_dock_crates && !nodes.ch4_dock_crates.__sceneWaybillEffectPatched) {
      const oldEffect = nodes.ch4_dock_crates.effect;
      nodes.ch4_dock_crates.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        confirmWaybill('福生仓教具箱内');
      };
      nodes.ch4_dock_crates.__sceneWaybillEffectPatched = true;
    }
    addPanelText('ch4_dock_crates');

    // 货架核心区域：只补现场确认面板，不额外添加与“检查教具箱”重复的选项。
    for (const id of ['ch4_dock_shelf_approach', 'ch4_dock_shelf_approach_limited']) {
      addPanelText(id);
      appendChoice(id, () => E.getFlag('scene_confirmed_clearance_order') ? null : {
        text: '📄 回头看一眼账房里的蓝封纸',
        effect: () => confirmClearance('你回头在账房'),
        goto: id.includes('limited') ? 'ch4_dock_inner_office_limited' : 'ch4_dock_inner_office'
      }, 'sceneShelfClearanceChoice');
    }

    // 暗室痕迹只有进入暗室后才能确认；暗门还没撬开时不显示床、水桶、刻痕相关选项。
    for (const id of ['ch4_dock_deep', 'ch4_dock_who', 'ch4_dock_who_dual']) {
      addPanelText(id);
      appendChoice(id, () => E.getFlag('scene_confirmed_darkroom_marks') ? null : {
        text: '🕯️ 趁离开前记下暗室里的痕迹',
        effect: () => confirmDarkroom('你在暗室里'),
        goto: id
      }, 'sceneDarkroomChoice');
    }
    addPanelText('ch4_dock_locked_door');

    // 码头对峙 / 傅启元相关节点：确认人物链条。
    for (const id of ['ch4_fu_confront', 'ch4_dock_escape', 'ch4_dock_escape_finish']) {
      addPanelText(id);
      appendChoice(id, () => E.getFlag('scene_confirmed_fu_lu_conversation') ? null : {
        text: '🎙️ 记下傅启元和陆念薇露出的那几句话',
        effect: () => confirmConversation('你在码头'),
        goto: id
      }, 'sceneConversationChoice');
    }

    if (typeof E.v07InvestigationQuality === 'function' && !E.__fushengSceneQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const quality = oldQuality();
        let confirmed = 0;
        if (this.getFlag('scene_confirmed_clearance_order')) confirmed += 1;
        if (this.getFlag('scene_confirmed_waybill_crates')) confirmed += 1;
        if (this.getFlag('scene_confirmed_darkroom_marks')) confirmed += 1;
        if (this.getFlag('scene_confirmed_fu_lu_conversation')) confirmed += 1;
        if (confirmed >= 3) {
          quality.score += 1;
          quality.reasons.push('福生仓现场证据确认完整，物证、关押痕迹与人物链条互相咬合');
        }
        return quality;
      };
      E.__fushengSceneQualityPatched = true;
    }

    E.__fushengSceneEvidencePanelPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyFushengSceneEvidencePanel);
})();
