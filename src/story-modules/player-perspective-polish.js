// ===== 玩家视角文案收束 =====
// 目标：所有玩家可见文本尽量保持“侦探当下判断”口吻，避免开发者视角、路线术语或过度剧透提示。

(function installPlayerPerspectivePolish() {
  function applyPlayerPerspectivePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__playerPerspectivePolishPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function rewriteChoiceText(text) {
      const map = new Map([
        ['🔙 回顾现有证据（证据链仍不完整）', '🔙 回顾现有证据（仍有疑点没有合上）'],
        ['📁 证据不足，暂时归档此案', '📁 先把案卷封起，不再追下去'],
        ['📁 暂时归档此案（证据仍不足）', '📁 先把案卷封起，暂时不追了'],
        ['⚠️ 证据不足，仍要冒然指认嫌疑人', '⚠️ 线索还没合上，仍要指认一个人'],
        ['⛵ 证据还差福生仓——继续追查', '⛵ 福生仓还没查清——继续追下去'],
        ['✍️ 按证据链自然收束此案', '✍️ 按手头证据结案'],
        ['🔍 推理——指认幕后真凶', '🔍 推理——指出最可疑的人'],
        ['🌟 完整拼图——直指法租界幕后', '🌟 把最后几块碎片拼起来'],
        ['🏮 回访周怀安——带去陈明远的信和苏晚亭的遗书', '🏮 回访周怀安——把两封信交给他看'],
        ['🕯️ 把两封信并在一起，听周怀安说完', '🕯️ 把两封信并在一起，听他说完'],
        ['📨 继续出示另一封信', '📨 再拿出另一封信']
      ]);
      return map.get(text) || text;
    }

    function patchChoices(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__playerChoiceTextPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.map(choice => ({ ...choice, text: rewriteChoiceText(choice.text || '') }));
      };
      node.__playerChoiceTextPatched = true;
    }

    ['ch3_wrapup', 'ch4_conclusion', 'ch4_pawnshop', 'ch4_revisit_zhou', 'ch4_zhou_present_jade', 'ch4_zhou_present_jade_premature', 'ch4_zhou_present_chen_letter', 'ch4_zhou_present_su_last_letter'].forEach(patchChoices);

    if (nodes.ch4_accuse && !nodes.ch4_accuse.__playerPerspectivePatched) {
      nodes.ch4_accuse.title = '最后指认';
      nodes.ch4_accuse.text = () => `你摊开所有材料，在灯下重新梳理了一遍。<br><br>三个人的名字从不同方向浮出来。每一个人都像在雾里伸过手，但你只能先抓住最可疑的那一个。<br><br>你决定指向谁？`;
      nodes.ch4_accuse.choices = [
        { text: '🔍 指认陆小姐', goto: 'end_boss_lu' },
        { text: '🔍 指认赵先生', goto: 'end_boss_zhao' },
        { text: '🔍 指认吴校长', goto: 'end_boss_wu' },
        { text: '🔙 再想想', goto: 'ch4_conclusion' }
      ];
      nodes.ch4_accuse.__playerPerspectivePatched = true;
    }

    if (nodes.ch4_pawnshop && !nodes.ch4_pawnshop.__playerTextPatched) {
      const oldText = nodes.ch4_pawnshop.text;
      nodes.ch4_pawnshop.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return String(base)
          .replace('当铺只是旁证，不是这条坏路线的前置。', '这只镯子只是旁证，还不能替你回答她到底去了哪里。')
          .replace('它们比这只镯子更应该先给周怀安看；', '它们比这只镯子更能碰到周怀安心里那块地方；');
      };
      nodes.ch4_pawnshop.__playerTextPatched = true;
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__playerTextPatched) {
      const oldText = nodes.ch4_conclusion.text;
      nodes.ch4_conclusion.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return String(base)
          .replace('<b>⚠️ 证据链不足</b>', '<b>⚠️ 仍有疑点未合</b>')
          .replace('现在回头已经来不及了：关键线索没有在正确时间接上。你可以整理手头材料，但这只会得到一个不完整甚至错误的收束。', '你知道有几处线还没有接上。若现在收手，这个案子只会留下一个说得过去、却未必站得住的结论。')
          .replace('现在还不是结案的时候：福生仓线索已经浮出水面，继续追查才是正路。', '你心里清楚：福生仓已经浮出水面，现在收手太早。')
          .replace('<b>⛵ 仍可继续追查</b><br>翡翠镯只能证明陆念这条旁线，真正决定案子走向的是福生仓。现在应回到线索整理，继续去码头或找老孙支援。', '<b>⛵ 雾还没散</b><br>翡翠镯只能照亮陆念这条旁线，福生仓那扇门还没打开。你还可以去码头，或者先找老孙商量。')
          .replace('<b>调查进度</b>', '<b>案头记号</b>')
          .replace('现在你掌握的信息足够去追查真相了。', '现在你掌握的信息已经足够继续往雾里走。');
      };
      nodes.ch4_conclusion.__playerTextPatched = true;
    }

    if (typeof E.getPresentableThings === 'function' && !E.__presentTextPlayerPatched) {
      E.showPresentBtn = function () {
        const existing = document.getElementById('present-btn-wrapper');
        if (existing) return;
        const nodeId = this.state.currentScene;
        const node = nodes[nodeId];
        if (!node || !node.onPresent) return;

        const validThings = this.getPresentableThings(node, this.state);
        if (!validThings.length) return;

        const wrap = document.createElement('div');
        wrap.id = 'present-btn-wrapper';
        wrap.style.cssText = 'margin-top:10px;border-top:1px dashed #2a2a48;padding-top:12px';

        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        btn.textContent = '🔍 出示手中物件';
        btn.style.cssText = 'width:100%';
        btn.onclick = () => this.openPresentModal();

        wrap.appendChild(btn);
        this.choicesEl.appendChild(wrap);
      };

      E.openPresentModal = function () {
        const state = this.state;
        const nodeId = state.currentScene;
        const node = nodes[nodeId];
        if (!node || !node.onPresent) { this.toast('现在没有合适的东西可以拿出来。'); return; }

        const validThings = this.getPresentableThings(node, state);
        if (!validThings.length) { this.toast('你想了想，暂时没有合适的东西拿出来。'); return; }

        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px';

        const box = document.createElement('div');
        box.style.cssText = 'background:#0f0f1e;border:1px solid #3a3a58;border-radius:12px;max-width:460px;width:100%;max-height:70vh;padding:20px;overflow:auto';
        box.innerHTML = '<h3 style="color:#c8a87c;font-size:16px;margin-bottom:12px">选择要拿出来的东西</h3>';

        validThings.forEach(t => {
          const card = document.createElement('div');
          card.style.cssText = 'background:#171727;border:1px solid #282846;border-radius:8px;padding:10px 12px;margin:6px 0;cursor:pointer;transition:.12s';
          card.innerHTML = `<b style="color:#d8bd8e">${t.type === 'item' ? '🎒' : '🔍'} ${t.name}</b><br><span style="color:#999;font-size:13px">${t.desc}</span>`;
          card.onmouseenter = () => { card.style.borderColor = '#6f86c8'; card.style.background = '#1c1c30'; };
          card.onmouseleave = () => { card.style.borderColor = '#282846'; card.style.background = '#171727'; };
          card.onclick = () => {
            mask.remove();
            this.handlePresent(t);
          };
          box.appendChild(card);
        });

        const close = document.createElement('button');
        close.className = 'tool-btn';
        close.textContent = '取消';
        close.style.cssText = 'margin-top:10px';
        close.onclick = () => mask.remove();
        box.appendChild(close);

        mask.appendChild(box);
        document.body.appendChild(mask);
      };

      E.__presentTextPlayerPatched = true;
    }

    E.__playerPerspectivePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPlayerPerspectivePolish);
})();
