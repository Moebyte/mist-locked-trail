// ===== 薛华立路选项收口 =====
// 目标：让 22 号门口 / 永兴贸易商行 / 看门老头形成清晰顺序：观察、问老头、上203、去光华小学。
(function installXuehuaChoicePolish() {
  function applyXuehuaChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehuaChoicePolishPatched) return;

    function searched203Evidence() {
      return E.hasClue('三人合影') || E.hasItem('三人合影') || E.hasClue('恐吓信') || E.hasItem('恐吓信');
    }

    function baseXuehuaChoices() {
      const opts = [];
      if (!E.getFlag('saw_man')) opts.push({ text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' });
      if (!E.getFlag('asked_landlord')) {
        opts.push({ text: '🔍 问看门老头关于陆姓女子的事', goto: 'ch2_ask_landlord' });
      } else if (!searched203Evidence()) {
        opts.push({ text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' });
      }
      if (searched203Evidence()) opts.push({ text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' });
      return opts;
    }

    function afterLandlordChoices() {
      const opts = [];
      if (!searched203Evidence()) opts.push({ text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' });
      if (!E.getFlag('saw_man')) opts.push({ text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' });
      if (searched203Evidence()) opts.push({ text: '📚 去光华小学——那里是这一切的中心', goto: 'ch3_school' });
      return opts;
    }

    if (nodes.ch2_frenchtown) nodes.ch2_frenchtown.choices = baseXuehuaChoices;
    if (nodes.ch2_building_enter) nodes.ch2_building_enter.choices = baseXuehuaChoices;
    if (nodes.ch2_ask_landlord) nodes.ch2_ask_landlord.choices = afterLandlordChoices;
    if (nodes.ch2_landlord_map) nodes.ch2_landlord_map.choices = afterLandlordChoices;

    if (nodes.ch2_yulan_promise_echo) {
      nodes.ch2_yulan_promise_echo.choices = [
        { text: '🔎 回永兴贸易商行——继续查陆小姐住处', goto: 'ch2_building_enter' },
        { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' }
      ];
    }

    if (nodes.ch2_yulan_distance_echo) {
      nodes.ch2_yulan_distance_echo.choices = [
        { text: '🔎 回永兴贸易商行——继续查陆小姐住处', goto: 'ch2_building_enter' },
        { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' }
      ];
    }

    E.__xuehuaChoicePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehuaChoicePolish);
})();
