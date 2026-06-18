// ===== 薛华立路 203 路线解锁 =====
// 目标：203 搜查后不再被锁死到光华小学，保留返回 hub 与未完成支线入口。
(function installXuehua203RouteUnlock() {
  function applyXuehua203RouteUnlock() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehua203RouteUnlockPatched) return;

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

    function isHomeComplete() {
      return typeof E.isHomeComplete === 'function'
        ? E.isHomeComplete()
        : (E.hasClue('母亲证词') && E.getFlag('asked_photo'));
    }

    function after203EvidenceChoices() {
      const opts = [];
      if (!hasLandlordFushengLead() && hasUniversityXuehuaLead()) {
        opts.push({ text: '🗺️ 向看门老头出示地图——核对仓库标记', goto: 'ch2_landlord_map' });
      }
      if (!hasWangNote()) {
        opts.push({ text: '📋 回巡捕房——追问福生仓与王巡官留下的线索', goto: 'ch2_police_alt' });
      } else {
        opts.push({ text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' });
        opts.push({ text: '📋 去巡捕房', goto: 'ch2_police_alt' });
      }
      if (!isHomeComplete()) {
        opts.push({ text: '🏠 去苏家', goto: 'ch2_home' });
      }
      return opts;
    }

    if (nodes.ch2_203_search) nodes.ch2_203_search.choices = after203EvidenceChoices;
    E.__xuehua203RouteUnlockPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehua203RouteUnlock);
})();
