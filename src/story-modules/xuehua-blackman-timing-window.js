// ===== 薛华立路黑衣男时间窗口 =====
// 目标：薛华立路可以早去，但如果未先查巡捕房卷宗，街对面观察不会撞见黑衣男与沈玉兰会面。
// 这是轻坑：早到不锁路线，仍可问看门老头/搜 203；但会错过“赵先生—沈玉兰”证人链。
(function installXuehuaBlackmanTimingWindow() {
  function applyXuehuaBlackmanTimingWindow() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehuaBlackmanTimingWindowPatched) return;

    function hasPoliceContext() {
      return E.getFlag?.('got_case_file') || E.hasClue?.('光华小学事件') || E.hasItem?.('卷宗摘抄');
    }

    function missedWindow() {
      return E.getFlag?.('xuehua_blackman_window_missed');
    }

    function isStakeoutChoice(choice) {
      const text = choice?.text || choice?.fogText || '';
      return choice?.goto === 'ch2_building_stakeout' || text.includes('周围观察');
    }

    function filterStakeoutIfMissed(choices) {
      if (!Array.isArray(choices)) return choices;
      if (!missedWindow()) return choices;
      return choices.filter(choice => !isStakeoutChoice(choice));
    }

    function patchChoiceFilter(nodeId) {
      const node = nodes[nodeId];
      if (!node || node.__xuehuaTimingChoiceFilterPatched) return;
      const oldChoices = node.choices;
      node.choices = function (state) {
        const raw = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        return filterStakeoutIfMissed(raw || []);
      };
      node.__xuehuaTimingChoiceFilterPatched = true;
    }

    for (const id of ['ch2_frenchtown', 'ch2_building_enter', 'ch2_ask_landlord', 'ch2_landlord_map']) patchChoiceFilter(id);

    const stakeout = nodes.ch2_building_stakeout;
    if (stakeout && !stakeout.__xuehuaTimingWindowPatched) {
      const oldText = stakeout.text;
      const oldEffect = stakeout.effect;
      const oldChoices = stakeout.choices;

      stakeout.text = function (state) {
        if (hasPoliceContext()) return typeof oldText === 'function' ? oldText(state) : oldText;
        return `你在街对面的香烟摊买了一包烟，假装点烟，盯着 22 号那栋灰色小楼。<br><br>暮色还没完全压下来，铺子门口只偶尔有人经过。一个卖报的孩子从梧桐树下跑过去，鞋底溅起薄薄的水花；楼上窗帘垂着，二楼那扇窗始终没有亮灯。<br><br>你站了大约二十分钟，除了看门老头掀帘出来倒了一盆水，什么人也没有出现。<br><br>这个地址确实可疑，但现在太安静了。安静得像你来早了半步。<br><br>继续守下去未必有结果。比起在街对面等一个还没出现的人，不如先进楼里问清 203 室到底住着谁。`;
      };

      stakeout.effect = function (state) {
        if (hasPoliceContext()) {
          if (typeof oldEffect === 'function') oldEffect(state);
          return;
        }
        E.setFlag?.('xuehua_blackman_window_missed', true);
        E.addClue?.('薛华立路来得太早', '你在街对面守了一阵，没有等到黑衣男人。这个地址仍然可疑，但会面窗口还没有出现。');
      };

      stakeout.choices = function (state) {
        if (hasPoliceContext()) return typeof oldChoices === 'function' ? oldChoices(state) : (oldChoices || []);
        return [{ text: '🚶 先进永兴贸易商行看看', goto: 'ch2_building_enter' }];
      };

      stakeout.__xuehuaTimingWindowPatched = true;
    }

    E.__xuehuaBlackmanTimingWindowPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehuaBlackmanTimingWindow);
})();