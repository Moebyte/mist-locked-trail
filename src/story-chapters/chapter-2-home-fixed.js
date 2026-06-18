// ===== 章节剧情：第二章苏家固定支线 =====
// Phase 4d: 迁移苏家低风险固定支线节点。
// 约束：只登记既有 ch2_home_photo / ch2_home_ask_photo / ch2_home_showphoto；不迁移 ch2_home 入口或动态 choices 节点。

(function installChapter2HomeFixed() {
  function applyChapter2HomeFixed() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_home_photo: {
        title: '墙上的照片',
        text: () => `你走近细看那张全家福。照片里苏晚亭的父亲穿着长衫，面容和善，嘴角带着一丝拘谨的笑。苏晚亭大约十五六岁，站在他身侧，笑得很灿烂——和现在照片上那个倔强的女学生判若两人。

但你注意到一个细节——照片的角落里还有一个人，被裁剪掉了。

只剩下一只手臂，搭在苏晚亭的肩膀上。那只手臂的袖口上别着一枚徽章——看起来像是某种学校的校徽。袖口的布料是细纹绸，不是普通亲戚穿得起的。

你看不太清楚是什么学校。但那个手势——搭在肩上、微微收紧——像是在宝贝她，又像是在笼住她。`,
        effect: (s) => { E.addClue('裁切的照片', '全家福里有人被裁掉；袖口有校徽'); E.setFlag('asked_photo', true); },
        choices: [
          { text: '💬 问苏母——照片里还有谁？', goto: 'ch2_home_ask_photo' },
          { text: '🔙 回到苏家', goto: 'ch2_home' },
        ],
      },

      ch2_home_ask_photo: {
        title: '母亲的回避',
        text: () => `你指着照片上被裁掉的部分，装作不经意地问苏母。

<span class="sys">"这张照片——还有别人吧？"</span>

苏母的表情有一瞬间的僵硬。她低下头，沉默了一会儿。

<span class="sys">"那是……晚亭的一个表哥。很多年不来往了。裁了就裁了吧。"</span>

她的语气很平淡，但你觉得她在回避什么。你没有追问。

离开苏家的时候，你回头看了一眼那扇门——一个坐着轮椅的母亲，一个失踪的女儿，一张被裁掉的照片。这个家藏着的事，比表面上看到的要多。`,
        effect: (s) => { E.addClue('表哥', '照片上裁掉的人是苏晚亭的"表哥"；苏母不愿多谈'); E.setFlag('asked_mother_photo', true); },
        choices: [
          { text: '🔙 回到苏家', goto: 'ch2_home' },
        ],
      },

      ch2_home_showphoto: {
        title: '向苏母出示照片',
        weather: 0,
        effect: () => {
          E.addClue('苏母认出照片', '苏母看着照片说：这是她失踪前两个月拍的，她很珍惜。');
        },
        text: () => `你从怀里掏出那张照片，递给苏母。<br><br>她接过去的时候手是稳的——但看到照片的那一瞬间，眼泪毫无预兆地落了下来。她没有抬手去擦。<br><br><span class="sys">"这是……她失踪前两个月拍的。光启公园。她说那天天气好，非要拉我去，我没去成。"</span><br><br>她用手指轻轻摩挲照片边缘，像在抚摸女儿的脸。<br><br><span class="sys">"她拍完回来说：妈，这张照片我要留给明远。如果有一天我不见了，他至少有张照片可以找我。"</span><br><br>她说到这里，忽然停住了。<br><br>苏晚亭在拍照那天就已经想到了自己会失踪。这不是临时起意的出走——她在做准备。<br><br>她把照片还给你，声音很轻：<span class="sys">"找到她。不管在哪里，找到她。"</span><br><br>你点点头，把照片贴胸收好。`,
        choices: [
          { text: '🔙 回到苏家', goto: 'ch2_home' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_FIXED_READY = true;
      window.MLT_STORY_CHAPTER_2_HOME_FIXED_NODES = [
        'ch2_home_photo',
        'ch2_home_ask_photo',
        'ch2_home_showphoto',
      ];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeFixed);
})();
