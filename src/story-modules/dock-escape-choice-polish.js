// ===== 逃离码头选项语义收束 =====
// 目标：码头口遇见傅启元时，选项不直接决定结局，而是决定撤离方式、风险与是否留下正面对峙线索。
// 修正：“只带一个便衣”不能写成“正面压住傅启元”。

(function installDockEscapeChoicePolish() {
  function applyDockEscapeChoicePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__dockEscapeChoicePolishPatched) return;

    function fastSupportOnly() {
      return E.getFlag('sun_fast_support')
        && !E.getFlag('sun_full_support')
        && !E.getFlag('sun_wait_support')
        && !(E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function fullSupportAtDock() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || (E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function hardDockEvidenceReady() {
      return E.hasItem('清场指令')
        || E.hasItem('光华货运单')
        || E.hasClue('公董局公文纸')
        || E.hasClue('教具箱走私')
        || E.getFlag('fu_waybill_exposed')
        || E.getFlag('fu_clearance_exposed');
    }

    function supportPresent() {
      return E.getFlag('sun_support_available')
        || E.getFlag('sun_fast_support')
        || E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('sun_support_in_action');
    }

    if (nodes.ch4_dock_escape && !nodes.ch4_dock_escape.__escapeChoicePolished) {
      nodes.ch4_dock_escape.choices = function () {
        const opts = [];

        if (fastSupportOnly()) {
          opts.push({
            text: '🚓 让便衣护住后路，借雾把人先带走',
            effect: () => {
              E.setFlag('sun_fast_cover_escape', true);
              E.addClue('便衣掩护撤离', '老孙派来的便衣没有正面扣住傅启元，只护住后路，帮你先把人带走。');
            },
            goto: 'ch4_dock_escape_finish'
          });
        } else if (supportPresent() && (fullSupportAtDock() || hardDockEvidenceReady())) {
          opts.push({
            text: '🚓 让老孙的人亮明身份，正面压住傅启元',
            goto: 'ch4_fu_confront'
          });
        }

        opts.push({ text: '🌫️ 借雾绕开汽车，先把人带走', goto: 'ch4_dock_escape_finish' });
        opts.push({
          text: '⚠️ 当场质问傅启元',
          effect: () => E.addHeat(1, '你当场质问傅启元，局势变得危险。'),
          goto: 'ch4_fu_confront'
        });
        return opts;
      };
      nodes.ch4_dock_escape.__escapeChoicePolished = true;
    }

    if (nodes.ch4_fu_confront && !nodes.ch4_fu_confront.__fastSupportAwareTextPatched) {
      const oldEffect = nodes.ch4_fu_confront.effect;
      nodes.ch4_fu_confront.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (fastSupportOnly()) E.setFlag('fu_confront_fast_support_only', true);
      };
      nodes.ch4_fu_confront.text = () => {
        if (fastSupportOnly()) {
          return `你没有绕开那辆黑色汽车。<br><br>你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙派来的便衣从雾里站出来，枪没有拔，只把手按在腰间。一个人压不住傅启元，更扣不住整座码头，但足够让他不敢在这里开枪。<br><br><span class="sys">“傅秘书，今晚这两个人，我先带走。你要告我，明天去巡捕房写状子。”</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是你从他手里抢出了一个夜晚。`;
        }
        return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br><span class="sys">"傅秘书，今晚这两个人，得先跟我们走。"</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。`;
      };
      nodes.ch4_fu_confront.__fastSupportAwareTextPatched = true;
    }

    E.__dockEscapeChoicePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockEscapeChoicePolish);
})();
