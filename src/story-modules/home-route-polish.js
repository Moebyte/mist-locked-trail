// ===== 苏家回流收口 =====
// 目标：苏家作为补叙节点，不应把玩家困回已完成地点。
// 离开苏家时根据当前缺口回流：大学线、巡捕房卷宗、薛华立路/203、王巡官纸条、光华小学。
(function installHomeRoutePolish() {
  function applyHomeRoutePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__homeRoutePolishPatched) return;

    const askedDoorFlag = ['asked', 'door'].join('_');

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function isUniversityComplete() {
      if (typeof E.isUniversityComplete === 'function') return E.isUniversityComplete();
      return E.hasClue('舍监证词') && E.getFlag(askedDoorFlag) && hasUniversityXuehuaLead();
    }

    function hasPoliceCaseFile() {
      return E.getFlag('got_case_file') || E.hasClue('光华小学事件') || E.hasItem('卷宗摘抄');
    }

    function searched203Evidence() {
      return E.hasClue('三人合影') || E.hasItem('三人合影') || E.hasClue('恐吓信') || E.hasItem('恐吓信');
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
      if (typeof E.isHomeComplete === 'function') return E.isHomeComplete();
      return E.hasClue('母亲证词') && E.getFlag('asked_photo');
    }

    function nextAfterHomeChoices() {
      const opts = [];

      if (!isUniversityComplete()) {
        opts.push({ text: '📚 去圣约翰大学调查——补齐薛华立路来源', goto: 'ch2_university' });
      }

      if (!hasPoliceCaseFile()) {
        opts.push({ text: '📋 去巡捕房查卷宗——补齐案卷关键线', goto: 'ch2_police' });
      }

      if (hasUniversityXuehuaLead() && (!searched203Evidence() || !hasLandlordFushengLead())) {
        const text = searched203Evidence()
          ? '🏛️ 回薛华立路 22 号——向老头核对地图标记'
          : '🏛️ 回薛华立路 22 号——继续查陆小姐住处';
        opts.push({ text, goto: 'ch2_frenchtown' });
      }

      if (hasLandlordFushengLead() && !hasWangNote()) {
        opts.push({ text: '📋 回巡捕房——追问仓库与王巡官留下的线索', goto: 'ch2_police_alt' });
      }

      if (hasWangNote()) {
        opts.push({ text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' });
      }

      if (!opts.length && isHomeComplete()) {
        opts.push({ text: '📚 去圣约翰大学重新整理线索', goto: 'ch2_university' });
        opts.push({ text: '📋 回巡捕房再核对卷宗', goto: 'ch2_police_alt' });
      }

      return opts;
    }

    if (nodes.ch2_leave_home) {
      nodes.ch2_leave_home.choices = nextAfterHomeChoices;
    }

    E.__homeRoutePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHomeRoutePolish);
})();
