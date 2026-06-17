// ===== 薛华立路选项收口 =====
// 目标：让 22 号门口 / 永兴贸易商行 / 看门老头 / 203 室形成清晰顺序，避免回到门口造成循环。
// 地图只在 203 证据后用于核对福生仓标记，不在入口处作为通用出示项。
(function installXuehuaChoicePolish() {
  function applyXuehuaChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehuaChoicePolishPatched) return;

    function searched203Evidence() {
      return E.hasClue('三人合影') || E.hasItem('三人合影') || E.hasClue('恐吓信') || E.hasItem('恐吓信');
    }

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

    function after203EvidenceChoices() {
      if (!hasLandlordFushengLead() && hasUniversityXuehuaLead()) {
        return [{ text: '🗺️ 向看门老头出示地图——核对仓库标记', goto: 'ch2_landlord_map' }];
      }
      if (!hasWangNote()) {
        return [{ text: '📋 回巡捕房——追问福生仓与王巡官留下的线索', goto: 'ch2_police_alt' }];
      }
      return [{ text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' }];
    }

    function yulanEchoChoices() {
      const opts = [{ text: '🔎 回永兴贸易商行——继续查陆小姐住处', goto: 'ch2_building_enter' }];
      if (hasWangNote()) opts.push({ text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' });
      return opts;
    }

    function baseXuehuaChoices() {
      const opts = [];
      if (!E.getFlag('saw_man')) opts.push({ text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' });
      if (!E.getFlag('asked_landlord')) {
        opts.push({ text: '🔍 问看门老头关于陆姓女子的事', goto: 'ch2_ask_landlord' });
      } else if (!searched203Evidence()) {
        opts.push({ text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' });
      }
      if (searched203Evidence()) opts.push(...after203EvidenceChoices());
      return opts;
    }

    function afterLandlordChoices() {
      const opts = [];
      if (!searched203Evidence()) opts.push({ text: '⬆️ 上二楼，敲 203 的门', goto: 'ch2_203_door' });
      if (!E.getFlag('saw_man')) opts.push({ text: '🔍 先在周围观察一下', goto: 'ch2_building_stakeout' });
      if (searched203Evidence()) opts.push(...after203EvidenceChoices());
      return opts;
    }

    function room203Choices() {
      const opts = [];
      if (!searched203Evidence()) opts.push({ text: '📖 仔细搜查房间', goto: 'ch2_203_search' });
      if (searched203Evidence()) opts.push(...after203EvidenceChoices());
      return opts;
    }

    if (nodes.ch2_frenchtown) nodes.ch2_frenchtown.choices = baseXuehuaChoices;
    if (nodes.ch2_building_enter) {
      delete nodes.ch2_building_enter.onPresent;
      nodes.ch2_building_enter.presentFilter = () => false;
      nodes.ch2_building_enter.choices = baseXuehuaChoices;
    }
    if (nodes.ch2_ask_landlord) nodes.ch2_ask_landlord.choices = afterLandlordChoices;
    if (nodes.ch2_landlord_map) nodes.ch2_landlord_map.choices = afterLandlordChoices;
    if (nodes.ch2_203_door) nodes.ch2_203_door.choices = room203Choices;
    if (nodes.ch2_203_search) nodes.ch2_203_search.choices = after203EvidenceChoices;

    if (nodes.ch2_building_stakeout) {
      nodes.ch2_building_stakeout.choices = [
        { text: '🕵️ 跟踪黑衣男人', goto: 'ch2_tail' },
        { text: '🚶 不跟了，进永兴贸易商行看看', goto: 'ch2_building_enter' }
      ];
    }

    if (nodes.ch2_tail) {
      nodes.ch2_tail.choices = [
        { text: '☕ 找个角落坐下，继续监视他', effect: () => { E.setFlag('tailing', true); E.addClue('鸿运茶楼', '黑衣男人在等人'); }, goto: 'ch2_tea_monitor' },
        { text: '🔙 放弃尾随，回永兴贸易商行继续搜查', goto: 'ch2_building_enter' }
      ];
    }

    if (nodes.ch2_tea_monitor) {
      nodes.ch2_tea_monitor.choices = [
        { text: '👩 走向那个女人', effect: () => { E.setFlag('approach_woman', true); }, goto: 'ch2_talk_woman' },
        { text: '🔙 不接触她，回永兴贸易商行继续搜查', goto: 'ch2_building_enter' }
      ];
    }

    if (nodes.ch2_talk_woman) {
      nodes.ch2_talk_woman.choices = [
        { text: '💬 详细问她妹妹的事', goto: 'ch2_woman_detail' },
        { text: '🔙 留下联系方式，回永兴贸易商行继续搜查', goto: 'ch2_building_enter' }
      ];
    }

    if (nodes.ch2_yulan_promise_echo) nodes.ch2_yulan_promise_echo.choices = yulanEchoChoices;
    if (nodes.ch2_yulan_distance_echo) nodes.ch2_yulan_distance_echo.choices = yulanEchoChoices;

    E.__xuehuaChoicePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehuaChoicePolish);
})();
