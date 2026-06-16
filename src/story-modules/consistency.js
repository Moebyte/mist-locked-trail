// ===== 故事一致性修复 =====
// 从 v0.6.1-fixes.js 稳定迁出，作为长期一致性模块保留。

function applyStoryConsistencyFixes() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  nodes.ch4_fu_confront = {
    title: '码头 · 正面对峙',
    weather: 5,
    effect: () => {
      E.setFlag('confronted_fu', true);
      E.addClue('傅启元正面对峙', '傅启元在福生仓门口试图阻止你带走证人');
    },
    text: () => {
      const hasSunSupport = E.getFlag('sun_support_available') || E.getFlag('sun_fast_support');
      if (hasSunSupport) {
        return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>老孙的人从雾里走出来，枪没有拔，却把路堵住了。<br><br><span class="sys">"傅秘书，今晚这两个人，得先跟我们走。"</span><br><br>傅启元看了你很久，最后让开半步。<br><br>这不是胜利，只是他暂时不愿在码头上开枪。`;
      }
      return `你把清场指令、光华货运单和蓝封纸角一件件摆出来。<br><br>傅启元的表情没有变，但你看到他握公文夹的手指收紧了。<br><br>你没有老孙的人，也没有巡捕房的公文。你手里的东西足以让傅启元忌惮，却不足以让他当场低头。<br><br><span class="sys">"沈先生，聪明人该知道什么时候闭嘴。"</span><br><br>远处守卫的脚步声越来越近。你意识到今晚不能在码头上硬碰，只能先把人带走，把证据留到天亮。`;
    },
    choices: () => {
      const hasSunSupport = E.getFlag('sun_support_available') || E.getFlag('sun_fast_support');
      if (hasSunSupport) {
        return [{ text: '🚕 立刻送她们离开码头', goto: 'ch4_dock_escape_finish' }];
      }
      return [{ text: '🌫️ 趁守卫合围前借雾撤走', goto: 'ch4_dock_escape_finish' }];
    }
  };
}

document.addEventListener('DOMContentLoaded', applyStoryConsistencyFixes);
