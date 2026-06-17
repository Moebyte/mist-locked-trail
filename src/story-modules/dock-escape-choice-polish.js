// ===== 逃离码头选项语义收束 =====
// 目标：码头口遇见傅启元时，选项按“人手规模”分流。
// 只有一个便衣：只能护送撤离；当场质问并亮证据会触发码头坏结局。
// 老孙带队：可以正面压制傅启元；也可以趁乱撤离，但公董局会出面干预，影响后续真相质量。

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

    function fullSupportCanPressFu() {
      return supportPresent() && fullSupportAtDock();
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
          opts.push({
            text: '⚠️ 当场质问傅启元，拿出货运单和清场指令',
            effect: () => {
              E.setFlag('dock_fast_confront_bad', true);
              E.addHeat(3, '你在人手不足时当场亮出关键证据，傅启元动了灭口的念头。');
            },
            goto: 'end_dock_silenced'
          });
          return opts;
        }

        if (fullSupportCanPressFu()) {
          opts.push({
            text: '🚓 让老孙正面压制傅启元，质问并出示证据',
            effect: () => {
              E.setFlag('dock_sun_pressed_fu', true);
              E.addClue('码头正面压制傅启元', '老孙带队压住码头局面，你得以当场质问傅启元并出示货运单、清场指令。');
            },
            goto: 'ch4_fu_confront'
          });
          opts.push({
            text: '🌫️ 趁乱带人撤离，不在码头硬碰傅启元',
            effect: () => {
              E.setFlag('dock_escaped_during_sun_standoff', true);
              E.addClue('公董局干预码头', '老孙试图压住傅启元时，公董局的人出面阻拦。你趁乱先把人带走，但正式查明真相会更困难。');
              E.addHeat(1, '码头冲突被公董局察觉，后续公开指控难度上升。');
            },
            goto: 'ch4_dock_escape_finish'
          });
          return opts;
        }

        if (supportPresent() && hardDockEvidenceReady()) {
          opts.push({
            text: '🚓 让老孙的人护住出口，先把人带走',
            effect: () => {
              E.setFlag('sun_support_cover_escape', true);
              E.addClue('支援掩护撤离', '老孙的人手不足以当场扣住傅启元，但足以护住你们撤离。');
            },
            goto: 'ch4_dock_escape_finish'
          });
        }

        opts.push({ text: '🌫️ 借雾绕开汽车，先把人带走', goto: 'ch4_dock_escape_finish' });
        opts.push({
          text: '⚠️ 当场质问傅启元',
          effect: () => E.addHeat(1, '你当场质问傅启元，局势变得危险。'),
          goto: supportPresent() ? 'ch4_fu_confront' : 'end_dock_silenced'
        });
        return opts;
      };
      nodes.ch4_dock_escape.__escapeChoicePolished = true;
    }

    nodes.end_dock_silenced = {
      title: '结局 · 雾中枪声',
      time: { d: 2, h: 23, m: 30 },
      weather: 5,
      type: 'end',
      effect: () => E.addClue('码头灭口', '人手不足时当场亮出关键证据，傅启元选择灭口，证人和证据线断裂。'),
      text: () => `你没有绕开那辆黑色汽车。<br><br>你把光华货运单、清场指令和蓝封纸角一件件摆出来。<br><br>傅启元的笑意慢慢收了回去。<br><br>老孙派来的便衣从雾里站出来，枪没有拔，只把手按在腰间。一个人挡得住一条巷子，挡不住整座码头。<br><br>傅启元看了看你背上的苏晚亭，又看了看沈玉芳手里的那封信，忽然轻轻叹了口气。<br><br><span class="sys">“沈先生，你最大的问题，是把证据当成护身符。”</span><br><br>下一秒，码头上的灯同时灭了。<br><br>雾里响起两声短促的枪响。便衣倒下时，手还没摸到枪。你只来得及把苏晚亭往木箱后一推，沈玉芳的尖叫就被汽车发动声吞没。<br><br>等老孙真正带人赶到时，福生仓已经空了。地上只剩一滩血、一枚被踩碎的银发夹，还有半张被雨水泡开的货运单。<br><br>三天后，巡捕房卷宗写着：私家侦探沈某擅闯码头，引发不明枪击。福生仓涉嫌走私一事，因证据灭失，暂缓侦办。<br><br>你终于明白，有些真相不能只靠勇气说出口。说出口之前，必须有人能让对方不敢开枪。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局十二 · 雾中枪声 ——</div>`
    };

    if (nodes.ch4_fu_confront && !nodes.ch4_fu_confront.__supportAwareTextPatched) {
      const oldEffect = nodes.ch4_fu_confront.effect;
      nodes.ch4_fu_confront.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        if (fullSupportCanPressFu()) E.setFlag('fu_confront_with_full_support', true);
      };
      nodes.ch4_fu_confront.text = () => {
        if (fullSupportCanPressFu()) {
          return `你没有绕开那辆黑色汽车。<br><br>老孙带着人从雾里压出来，没拔枪，却把码头两头都封住了。<br><br>你把清场指令、光华货运单和蓝封纸角一件件摆在车灯前。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br><span class="sys">“傅秘书，今晚这两个人，得先跟我们走。”</span>老孙说。<br><br>几名公董局的人很快赶到，试图用“越权办案”压住老孙。但老孙没有退，他只是把烟咬在嘴里，冲你偏了偏头。<br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。你们必须趁这个缝隙把人带走。`;
        }
        return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br><span class="sys">"傅秘书，今晚这两个人，得先跟我们走。"</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。`;
      };
      nodes.ch4_fu_confront.choices = [{ text: '🚕 趁傅启元让开的半步，立刻送她们离开码头', goto: 'ch4_dock_escape_finish' }];
      nodes.ch4_fu_confront.__supportAwareTextPatched = true;
    }

    if (typeof E.v07InvestigationQuality === 'function' && !E.__dockEscapeQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const quality = oldQuality();
        if (this.getFlag('dock_sun_pressed_fu')) {
          quality.score += 1;
          quality.reasons.push('老孙带队压住傅启元，码头对峙留下正式压力记录');
        }
        if (this.getFlag('dock_escaped_during_sun_standoff')) {
          quality.score = Math.min(quality.score, 9);
          quality.reasons.push('公董局出面干预码头，你趁乱撤离，公开查明真相难度上升');
        }
        return quality;
      };
      E.__dockEscapeQualityPatched = true;
    }

    E.__dockEscapeChoicePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDockEscapeChoicePolish);
})();
