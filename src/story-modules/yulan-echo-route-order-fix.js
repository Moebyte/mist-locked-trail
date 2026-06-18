// ===== 沈玉兰托付后的路线顺序修正 =====
// 目标：沈玉兰抛出沈玉芳/光华小学线后，先引导玩家回 203 室确认陆小姐住处，
// 再去光华小学；避免“刚听到光华小学”就跳过 203 室关键证据。
(function installYulanEchoRouteOrderFix() {
  function applyYulanEchoRouteOrderFix() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__yulanEchoRouteOrderFixPatched) return;

    function hasSearched203() {
      return E.getFlag('searched_203')
        || E.hasClue('203 室的陆姓女子')
        || E.hasClue('陆小姐的笔记')
        || E.hasClue('203 室恐吓信')
        || E.hasClue('杭州旧案剪报')
        || E.hasClue('陆念薇旧名')
        || E.hasItem('恐吓信')
        || E.hasItem('烧毁的剪报');
    }

    function choicesAfterYulanEcho() {
      if (!hasSearched203()) {
        return [
          { text: '🔎 先回203室——继续搜查陆小姐住处', goto: 'ch2_building_enter' }
        ];
      }
      return [
        { text: '📚 去光华小学——查沈玉芳和陈老师的线索', goto: 'ch3_school' },
        { text: '🔎 回203室——再检查陆小姐住处', goto: 'ch2_building_enter' }
      ];
    }

    for (const id of ['ch2_yulan_promise_echo', 'ch2_yulan_distance_echo']) {
      const node = nodes[id];
      if (!node || node.__yulanEchoRouteOrderFixPatched) continue;
      node.choices = choicesAfterYulanEcho;
      node.__yulanEchoRouteOrderFixPatched = true;
    }

    E.__yulanEchoRouteOrderFixPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyYulanEchoRouteOrderFix);
})();