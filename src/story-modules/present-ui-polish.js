// ===== 举证菜单收束 =====
// 目标：出示弹窗默认只展示实物道具；同名线索/道具合并，避免“陈明远的信”等关键证据重复出现。
// 特定场景可通过 node.presentClueWhitelist / node.presentFilter 放开少量线索出示。

(function installPresentUiPolish() {
  function applyPresentUiPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__presentUiPolishPatched) return;

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function hasLandlordFushengLead() {
      return E.getFlag('shown_map_to_landlord')
        || E.hasClue('福生仓标识')
        || E.hasClue('福生仓位置')
        || E.hasItem('福生仓地址');
    }

    function hasWangNote() {
      return E.getFlag('got_wang_note') || E.hasClue('王巡官遗留纸条') || E.hasItem('半张烟盒纸');
    }

    function isBadRouteLocked() {
      return !hasUniversityXuehuaLead() || !hasLandlordFushengLead() || !hasWangNote();
    }

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function snapshotFlags(state) {
      return state && state.flags ? { ...state.flags } : {};
    }

    function restoreFlags(state, flags) {
      if (!state) return;
      state.flags = { ...flags };
      if (typeof E !== 'undefined' && E.state === state) E.state.flags = state.flags;
    }

    function displayThing(thing) {
      if (!thing) return thing;
      if (thing.name === '苏晚亭的伪造遗书') {
        return { ...thing, name: '苏晚亭疑似遗书', desc: thing.desc || '字迹像苏晚亭，却安静得像有人替所有人把结论写好。' };
      }
      return thing;
    }

    function cloneThing(type, thing) {
      return displayThing({ type, name: thing.name, desc: thing.desc });
    }

    function clueAllowedByNode(node, clue, state) {
      if (!node) return false;
      if (node.presentClueWhitelist === true) return true;
      if (Array.isArray(node.presentClueWhitelist) && node.presentClueWhitelist.includes(clue.name)) return true;
      if (typeof node.presentClueFilter === 'function') return !!node.presentClueFilter(clue, state);
      return false;
    }

    function passesSceneFilter(node, thing, state) {
      if (!node || typeof node.presentFilter !== 'function') return true;
      return !!node.presentFilter(thing, state);
    }

    function getCandidateThings(node, state) {
      const items = Array.isArray(state.items) ? state.items : [];
      const clues = Array.isArray(state.clues) ? state.clues : [];
      const itemNames = new Set(items.map(i => i.name));
      const out = [];

      // 实物优先：同名线索/道具只展示🎒道具，避免同一证据重复出现。
      for (const item of items) out.push(cloneThing('item', item));
      for (const clue of clues) {
        if (itemNames.has(clue.name)) continue;
        if (clueAllowedByNode(node, clue, state)) out.push(cloneThing('clue', clue));
      }

      const seen = new Set();
      return out.filter(thing => {
        if (!thing || !thing.name || seen.has(thing.name)) return false;
        seen.add(thing.name);
        return passesSceneFilter(node, thing, state);
      });
    }

    function triggersPresentResponse(node, thing, state) {
      const flags = snapshotFlags(state);
      try {
        const r = typeof node.onPresent === 'function' ? node.onPresent(thing, state) : node.onPresent;
        return !!(r && (r.goto || r.text));
      } catch (e) {
        return false;
      } finally {
        restoreFlags(state, flags);
      }
    }

    E.getPresentableThings = function (node, state) {
      if (!node || !node.onPresent || !state) return [];
      return getCandidateThings(node, state).filter(thing => triggersPresentResponse(node, thing, state));
    };

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
      btn.textContent = '🔍 出示关键物证';
      btn.style.cssText = 'width:100%';
      btn.onclick = () => this.openPresentModal();

      wrap.appendChild(btn);
      this.choicesEl.appendChild(wrap);
    };

    E.openPresentModal = function () {
      const state = this.state;
      const nodeId = state.currentScene;
      const node = nodes[nodeId];
      if (!node || !node.onPresent) { this.toast('当前没有可以出示的东西。'); return; }

      const validThings = this.getPresentableThings(node, state);
      if (!validThings.length) { this.toast('没有能在此处出示的关键物证。'); return; }

      const mask = document.createElement('div');
      mask.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px';

      const box = document.createElement('div');
      box.style.cssText = 'background:#0f0f1e;border:1px solid #3a3a58;border-radius:12px;max-width:460px;width:100%;max-height:70vh;padding:20px;overflow:auto';
      box.innerHTML = '<h3 style="color:#c8a87c;font-size:16px;margin-bottom:12px">选择要出示的关键物证</h3>';

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

    if (nodes.ch4_revisit_zhou && !nodes.ch4_revisit_zhou.__presentUiFilterPatched) {
      const oldFilter = nodes.ch4_revisit_zhou.presentFilter;
      nodes.ch4_revisit_zhou.presentFilter = function (thing, state) {
        if (isBadRouteLocked()) {
          return thing.type === 'item'
            && ['陈明远的信', '苏晚亭的遗书', '苏晚亭疑似遗书'].includes(displayThing(thing).name);
        }
        return typeof oldFilter === 'function' ? oldFilter(thing, state) : true;
      };
      nodes.ch4_revisit_zhou.__presentUiFilterPatched = true;
    }

    if (nodes.ch4_pawnshop && !nodes.ch4_pawnshop.__presentUiChoicePolished) {
      const oldChoices = nodes.ch4_pawnshop.choices;
      nodes.ch4_pawnshop.choices = function (state) {
        const base = choicesOf(oldChoices, state);
        if (!Array.isArray(base)) return base;
        return base.map(choice => {
          if (isBadRouteLocked() && choice.goto === 'ch4_revisit_zhou') {
            return { ...choice, text: '🏮 回访周怀安——带去两封信' };
          }
          return choice;
        });
      };
      nodes.ch4_pawnshop.__presentUiChoicePolished = true;
    }

    E.__presentUiPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPresentUiPolish);
})();
