// ===== 早期迷雾视角去剧透 =====
// 目标：福生仓线之前，男主只能拿到零碎线索，不能提前知道完整链条。
// 处理重点：
// 1) 陈明远的信不再直接点名傅启元、走私、管制药品、陆念薇层级。
// 2) 203 与大学线的导向不再说“中心/真相”，只说“下一处可疑地点”。
// 3) 第一、第二段推理成功文本只给阶段性结论，不提前讲后期完整链条。
// 4) 保留推理所需的软线索名，避免流程被卡死。

(function installEarlyMistPerspectivePolish() {
  function applyEarlyMistPerspectivePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__earlyMistPerspectivePolishPatched) return;

    if (nodes.ch2_univ_paper && !nodes.ch2_univ_paper.__earlyMistPerspectivePatched) {
      const oldEffect = nodes.ch2_univ_paper.effect;
      nodes.ch2_univ_paper.text = () => `你翻看苏晚亭的论文稿纸。<br><br>她的字很漂亮，英文流畅，批注逻辑清晰——确实是一个好学生的水准。但你注意到一些奇怪的东西。<br><br>有几页稿纸的背面有铅笔写的草稿，像是某种清单：<br><br><span class="sys">“法租界 · 薛华立路 22 号”</span><br><span class="sys">“周三下午三点”</span><br><span class="sys">“不要告诉任何人”</span><br><br>另外，在她的牛津字典里夹着一张书签——不是普通书签，是一张法租界的地图。地图上用铅笔圈了一个位置：<b>薛华立路 22 号</b>。<br><br>你正要合上字典，却发现书脊里还夹着一张撕下来的日记残页。纸边被揉皱了，像是写完又后悔，最后还是留下了：<br><br><span class="sys">“陈先生说，有些门打开以后，就不能假装没看见。可他自己却在怕。我第一次看见一个大人怕成那样。不是怕死，是怕害了别人。<br><br>他让我别再去光华。我答应了。可是如果我不去，沈老师怎么办？那个姓陆的女人又怎么办？她看起来像坏人，可她说话的时候，眼睛里全是求救。<br><br>我不敢告诉明远。他会让我报警。可我知道，有些电话打出去，先到的未必是巡捕。”</span><br><br>这不是线索簿里的冷字句，而是苏晚亭自己的声音。你还不知道她究竟看见了什么，只知道她在害怕，也在往前走。`;
      nodes.ch2_univ_paper.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.addClue('苏晚亭日记残页', '苏晚亭知道陈明远害怕，也知道沈玉芳和一名陆姓女子都被卷入光华小学附近的事。');
        E.addItem('日记残页', '苏晚亭夹在牛津字典里的残页：她决定继续追查光华小学附近的异常。');
      };
      nodes.ch2_univ_paper.__earlyMistPerspectivePatched = true;
    }

    if (nodes.ch2_203_search && !nodes.ch2_203_search.__earlyMistPerspectivePatched) {
      const oldEffect = nodes.ch2_203_search.effect;
      nodes.ch2_203_search.text = () => `你快速但仔细地搜查了房间。<br><br>在枕头底下，你找到了一张照片——是三个人的合影：两个年轻女人和一个男人。背景是一所学校的大门，你能看到校牌上写着“光华小学”。<br><br>其中一个女人你认出来了——就是苏晚亭。另一个应该就是陆小姐。而那个男人……三十多岁，戴眼镜，文质彬彬。<br><br>照片背面写着：<span class="sys">“陈老师 · 晚亭 · 我 · 民国三十六年春”</span><br><br>在抽屉里，你还找到了一封信，没有封口。信纸只有一行字：<br><br><span class="sys">“我知道那晚你看到了什么。如果你不说，他们下一个就是你。——一个知情者”</span><br><br>你把抽屉整个抽出来，木板底部露出一层黑灰。有人曾在这里烧过东西。灰烬里剩下半张剪报，边缘卷曲，只能辨认出几个字：<br><br><span class="sys">“杭州……女嫌犯……陆念……诈骗案……在逃……”</span><br><br>剪报旁边还有一小片照片背纸，上面写着一个旧名字：<span class="sys">“陆念薇”</span>。<br><br>这些东西还拼不成完整答案。它们只把你的目光重新拉回那所学校。`;
      nodes.ch2_203_search.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.addClue('203 室恐吓信', '信上只有一句话：如果你不说，他们下一个就是你。');
      };
      // Do not override ch2_203_search.choices here. xuehua-choice-polish owns the
      // post-203 route matrix so the player can still return to police or Su home.
      nodes.ch2_203_search.__earlyMistPerspectivePatched = true;
    }

    if (nodes.ch3_chen_letter && !nodes.ch3_chen_letter.__earlyMistPerspectivePatched) {
      nodes.ch3_chen_letter.text = () => `你展开信纸。陈老师的字迹方正而清秀，但有几处墨迹洇开，像是写信的人把笔停在纸上太久。<br><br><span class="sys">“晚亭吾爱：<br><br>写这封信的时候，我的手还在发抖。<br><br>那晚我值夜，原本只是回办公室取书。可我看见后楼有人在搬箱子。箱子外面写着‘光华小学教学器材’，可声音不像书，也不像粉笔。有人叫我不要看，我还是看见了一角。<br><br>我本该立刻报官。可第二天，恐吓信就放在我的讲义里。信上写着：如果我多说一个字，你、沈老师，还有那些孩子，都会变成我的罪。<br><br>我承认，我怕了。我怕得像个懦夫。<br><br>后来沈老师也像是知道了什么。她来问我，我却叫她装作不知道。那一刻我就明白，我所谓的保护，不过是把别人推到更危险的地方。<br><br>如果我出了事，不要相信学校里最先递来的说法，也不要相信第一通打来的电话。薛华立路22号203室，有我留下的东西。那个姓陆的女人知道一部分，但她也怕。<br><br>晚亭，别替我原谅我。<br><br>明远<br>民国三十七年十月”</span><br><br>你把信纸慢慢折回去。<br><br>这封信没有给出答案。它只证明陈明远不是毫无缘由地害怕，而他害怕的东西，藏在学校、箱子和一通不该相信的电话之间。`;
      nodes.ch3_chen_letter.effect = function () {
        E.addClue('陈明远的信', '陈明远让苏晚亭去薛华立路 22 号 203 室取东西，并暗示学校里的箱子和一通“不该相信的电话”有关。');
        E.addClue('陈明远的退缩', '陈明远曾因恐吓选择沉默，后来才决定留下证据。');
        E.addClue('光华小学箱子异常', '陈明远值夜时看见后楼有人搬运写着“教学器材”的箱子，但他没有在信里写清里面究竟是什么。');
        E.addItem('陈明远的信', '陈明远留给苏晚亭的未寄出信。信里提到光华小学后楼的箱子、恐吓信、薛华立路 22 号 203 室，以及一通不该相信的电话。');
        E.setFlag('read_letter', true);
      };
      nodes.ch3_chen_letter.choices = [{ text: '🔙 这些碎片还得回去重新拼', goto: 'ch3_wrapup' }];
      nodes.ch3_chen_letter.__earlyMistPerspectivePatched = true;
    }

    if (nodes.deduc_success && !nodes.deduc_success.__earlyMistPerspectivePatched) {
      nodes.deduc_success.effect = () => {
        E.setFlag('deduced_chen', true);
        E.addClue('推理结论：陈明远被灭口', '陈明远发现光华小学后楼的箱子异常，并因留下证据与遭到威胁而被灭口。');
      };
      nodes.deduc_success.text = () => `你把所有线索摊在桌上。<br><br>恐吓信、薛华立路203室的碎片、苏晚亭的日记残页、陈明远不敢寄出的信……<br><br>它们指向的不是一个单纯的情杀，也不是一个教师的自杀。<br><br><b>陈明远撞见了光华小学后楼的箱子。</b>他曾经沉默，后来留下证据，于是被人灭口。<br><br>至于陆小姐，你现在能确定的还不是完整档案，而是几个互相咬合的碎片：${E.truthFragmentText()}。<br><br>这些碎片说明，她的“陆小姐”身份很可能是假的；“陆念薇”这个名字，也许才是通往旧案的钥匙。<br><br>你已经摸到了雾里的第一根线。它还没有告诉你终点在哪里，只告诉你：光华小学里有人在怕，陈明远不是第一个被逼退的人。`;
      nodes.deduc_success.__earlyMistPerspectivePatched = true;
    }

    if (nodes.deduc_lu_zhao_ok && !nodes.deduc_lu_zhao_ok.__earlyMistPerspectivePatched) {
      nodes.deduc_lu_zhao_ok.effect = () => {
        E.setFlag('deduced_lu_zhao', true);
        E.addClue('推理结论：黑衣男是暗线', '黑衣男人并非普通侦探，他在盯陆小姐与光华小学之间未说清的联系。');
      };
      nodes.deduc_lu_zhao_ok.text = () => `你把沈玉兰的证词、薛华立路的监视记录和陆念薇的旧案碎片放在一起。<br><br>黑衣男人——那个在鸿运茶楼被伙计叫做“赵先生”的人——不是沈玉兰请来的普通侦探。他当然拿了她的钱，但他的目光一直不在沈玉芳身上。<br><br>他更像是在盯陆小姐：她见过谁，收过什么，又会不会在害怕时说出不该说的话。<br><br>陆念薇不是这团雾的中心。她身上背着旧案，也被人用旧名牵着走。她替人办过事，替人传过话，却也像随时会被丢出去挡刀的人。<br><br>你还不知道那只手从哪里伸来，只知道它已经碰到了学校、203室和失踪的人。`;
      nodes.deduc_lu_zhao_ok.__earlyMistPerspectivePatched = true;
    }

    E.__earlyMistPerspectivePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyEarlyMistPerspectivePolish);
})();
