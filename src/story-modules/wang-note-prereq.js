// ===== 王巡官纸条前置条件 =====
// 目标：王巡官纸条不再由巡捕房凭空给出。
// 玩家需要先在薛华立路向看门老头出示法租界地图，让“福生仓”这个仓库名浮出水面，
// 再回巡捕房追问王巡官，老孙才会翻出那半张烟盒纸。
// 调整：巡捕房第一次看到光华小学批注后，不直接开放光华小学主线；先要求玩家查清薛华立路/福生仓地点，避免路线跳段。
(function installWangNotePrereq() {
  function applyWangNotePrereq() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__wangNotePrereqPatched) return;

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

    function canGoGuanghuaFromPolice() {
      // 只在“王巡官批注”有了可追问的上下文之后，才让玩家直接去光华小学。
      // 否则玩家会从一行批注直接跳到学校，绕过薛华立路与王巡官纸条这条关键桥。
      return hasWangNote() || hasLandlordFushengLead() || E.hasClue('光华小学事件');
    }

    function nextPoliceChoices() {
      const opts = [];
      if (!hasWangNote()) {
        if (hasLandlordFushengLead()) {
          opts.push({ text: '📎 追问王巡官调离前留下的仓库线索', goto: 'ch2_police_wang' });
        } else {
          opts.push({
            text: '🌫️ 这行铅笔字暂时问不下去',
            goto: 'ch2_police_wang_missing',
            when: () => false,
            fogText: '🌫️ 这行铅笔字暂时问不下去',
            fogHint: '你还缺少能让老孙开口的具体地点线索。先从大学地图指向的地方查起。'
          });
        }
      }
      if (hasUniversityXuehuaLead() && !hasLandlordFushengLead()) {
        opts.push({ text: '🏛️ 回薛华立路 22 号——查清地图上的标记', goto: 'ch2_frenchtown' });
      }
      if (!E.hasClue('母亲证词') || !E.getFlag('asked_photo')) opts.push({ text: '🏠 去苏家', goto: 'ch2_home' });
      if (canGoGuanghuaFromPolice()) opts.push({ text: '📚 去光华小学', goto: 'ch3_school' });
      return opts;
    }

    for (const nodeId of ['ch2_police_file', 'ch2_police_alt', 'ch2_police_wang']) {
      const node = nodes[nodeId];
      if (!node || node.__wangNotePrereqChoicesPatched) continue;
      node.choices = nextPoliceChoices;
      node.__wangNotePrereqChoicesPatched = true;
    }

    if (!nodes.ch2_police_wang_missing) {
      nodes.ch2_police_wang_missing = {
        title: '巡捕房 · 雾未散',
        weather: 1,
        text: () => `你把卷宗边角那行铅笔批注推到老孙面前。<br><br><span class="sys">“这个王巡官，为什么会觉得苏晚亭的案子和光华小学有关？”</span><br><br>老孙看着那行字，沉默了一会儿，却没有立刻回答。<br><br><span class="sys">“老王疑心重，他查过的地方很多。你现在只拿着一行批注来问，我没法判断你问的是哪一条线。”</span><br><br>他把卷宗合上。<br><br><span class="sys">“先把地图上那个被圈出的地方查清楚。拿着具体地点再来问，我才知道你问的是哪件事。”</span>`,
        choices: () => {
          const opts = [];
          if (hasUniversityXuehuaLead()) opts.push({ text: '🏛️ 去薛华立路 22 号——查清地图标记', goto: 'ch2_frenchtown' });
          if (canGoGuanghuaFromPolice()) opts.push({ text: '📚 去光华小学查陈老师的事', goto: 'ch3_school' });
          return opts;
        }
      };
    }

    if (nodes.ch2_police_wang && !nodes.ch2_police_wang.__wangNotePrereqTextPatched) {
      const oldText = nodes.ch2_police_wang.text;
      const oldEffect = nodes.ch2_police_wang.effect;
      nodes.ch2_police_wang.text = function (state) {
        if (!hasLandlordFushengLead()) return nodes.ch2_police_wang_missing.text(state);
        return typeof oldText === 'function' ? oldText(state) : oldText;
      };
      nodes.ch2_police_wang.effect = function (state) {
        if (!hasLandlordFushengLead()) {
          E.setFlag('wang_note_blocked_without_fusheng', true);
          E.addClue('铅笔批注暂时问不下去', '老孙要求你先查清地图上被圈出的具体地点，再追问王巡官那行铅笔字。');
          return;
        }
        if (typeof oldEffect === 'function') oldEffect(state);
      };
      nodes.ch2_police_wang.__wangNotePrereqTextPatched = true;
    }

    E.__wangNotePrereqPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyWangNotePrereq);
})();