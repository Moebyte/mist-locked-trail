// ===== 203 室证据收束 =====
// 目标：203 室不再产出“三人合影”。三人合影改由陈明远办公室取得，作为回头对质吴校长的学校内部证物。

(function installXuehua203EvidencePolish() {
  function applyXuehua203EvidencePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__xuehua203EvidencePolishPatched) return;

    if (nodes.ch2_203_search) {
      nodes.ch2_203_search.text = () => `你快速但仔细地搜查了 203 室。<br><br>房间里没有多少生活痕迹，倒像一个临时落脚点：一只空衣箱，一瓶快干掉的墨水，桌上还有几道被人匆忙擦过的灰痕。<br><br>抽屉里压着一封没有封口的信。信纸只有一行字：<br><br><span class="sys">“我知道那晚你看到了什么。如果你不说，他们下一个就是你。——一个知情者”</span><br><br>这不是给苏晚亭看的情书，也不是陆小姐留下的随手便笺。它更像一只伸进房间里的手，提醒住在这里的人：有人一直盯着她。<br><br>你把抽屉整个抽出来，木板底部露出一层黑灰。有人曾在这里烧过东西。灰烬里剩下半张剪报，边缘卷曲，只能辨认出几个字：<br><br><span class="sys">“杭州……女嫌犯……陆念……诈骗案……在逃……”</span><br><br>剪报旁边还有一小片照片背纸，上面写着一个旧名字：<span class="sys">“陆念薇”</span>。<br><br>203 室没有给出完整答案，却把陆小姐从一个模糊的女人，变成了一条有旧案、有威胁、有追踪者的暗线。`;

      nodes.ch2_203_search.effect = () => {
        E.addClue('恐吓信', '203室抽屉里发现的无署名恐吓信：“如果你不说，他们下一个就是你”。');
        E.addClue('杭州旧案剪报', '203室灰烬中残留半张剪报，能辨认出“杭州”“陆念”“诈骗案”“在逃”等字样。');
        E.addClue('陆念薇旧名', '203室烧毁照片背纸上留下“陆念薇”这个旧名字。');
        E.addItem('恐吓信', '没有署名的信：如果你不说，他们下一个就是你。');
        E.addItem('烧毁的剪报', '203室抽屉暗格里的半张剪报，提到杭州旧案和陆念薇。');
        E.state.chapter = 3;
      };
    }

    E.__xuehua203EvidencePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyXuehua203EvidencePolish);
})();
