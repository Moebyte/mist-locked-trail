// ===== 接案问询收束 =====
// 目标：接案前必须先问清最低限度信息，避免主角在不知道委托人姓名、失踪者背景和基本线索时直接接案。

(function installOpeningIntakePolish() {
  function applyOpeningIntakePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__openingIntakePolishPatched) return;

    function acceptCaseBase() {
      E.addContact('周怀安');
      E.addItem('苏晚亭的照片', '光启公园留影，照片背面写着"民国三十七年九月 · 光启公园 · 晚亭"。');
      E.addClue('黑衣男人', '失踪前有一个穿黑衣服的男人到学校找过苏晚亭。');
    }

    if (nodes.ch1_open) {
      nodes.ch1_open.choices = [
        { text: '❓ 先问清楚来龙去脉', goto: 'ch1_ask' },
        { text: '🚪 这个案子我不接', goto: 'end_refuse' }
      ];
    }

    if (nodes.end_refuse) {
      nodes.end_refuse.text = () => `你把信封推回去。<br><br><span class="sys">“抱歉。这个案子我接不了。你另请高明吧。”</span><br><br>男人愣了一下。他看着你，像是还想再说几句，最后只是把银元收回怀里。<br><br><span class="sys">“……我明白了。打扰了，沈先生。”</span><br><br>他站起来，鞠了一躬，走进雨里。<br><br>你又叫了一壶茶。窗外的雨没有要停的意思。你看着对面的空椅子，心想：上海每天都有人失踪，你管不过来，也不想管。<br><br>——三个月后。<br><br>你在《申报》的社会版角落里看到一则简短的报道：「圣约翰大学女生苏某失踪案因线索不足，已由巡捕房归档。家属未再提出申诉。」<br><br>报道旁边是一条皮鞋广告。<br><br>你把报纸翻了过去，继续喝你的茶。<br><br>雨还在下。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局一 · 雨不停 ——</div>`;
    }

    nodes.end_refuse_named = {
      title: '结局 · 雨不停',
      weather: 0,
      text: () => `你把信封推回去。<br><br><span class="sys">“周先生，这个案子我接不了。你另请高明吧。”</span><br><br>周怀安愣了一下。他看着你，像是想说什么，最后只是把银元收回怀里。<br><br><span class="sys">“……我明白了。打扰了，沈先生。”</span><br><br>他站起来，鞠了一躬，走进雨里。<br><br>你又叫了一壶茶。窗外的雨没有要停的意思。你看着对面的空椅子，心想：上海每天都有人失踪，你管不过来，也不想管。<br><br>——三个月后。<br><br>你在《申报》的社会版角落里看到一则简短的报道：「圣约翰大学女生苏某失踪案因线索不足，已由巡捕房归档。家属未再提出申诉。」<br><br>报道旁边是一条皮鞋广告。<br><br>你把报纸翻了过去，继续喝你的茶。<br><br>雨还在下。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局一 · 雨不停 ——</div>`,
      type: 'end'
    };

    nodes.ch1_ask = {
      title: '听雨茶馆',
      text: () => `你没有立刻收下信封，只是把照片按在桌面上。<br><br><span class="sys">“先说清楚。你叫什么，和苏小姐是什么关系？她什么时候不见的？失踪前有没有异常？”</span><br><br>男人像是这才想起自己还没有报上姓名，抹了一把脸上的雨水。<br><br><span class="sys">“我叫周怀安，在商务印书馆做编辑。晚亭是我的未婚妻。”</span><br><br>他说，苏晚亭是圣约翰大学英文系学生，四天前说去图书馆还书，此后再也没有回来。巡捕房立了案，但只说“也许是自行离开”。<br><br><span class="sys">“她不会自己走。她母亲卧病在床，她每周都要回去看。她若真要离开，至少会留句话。”</span><br><br>你继续问她最近有没有异常。<br><br>周怀安沉默了一会儿。<br><br><span class="sys">“有。失踪前半个月，她常常很晚才回宿舍。我问她去哪，她只说在准备毕业论文。可她是英文系，论文题目是《简·奥斯汀作品中的女性意识》——不需要到外面查什么资料。”</span><br><br>他顿了顿，声音更低。<br><br><span class="sys">“还有一个穿黑衣服的男人。失踪前两天，那人到学校找过她。门房说那人大概四十岁，戴宽檐帽，看不清脸。晚亭跟他说了几句话，回来以后脸色很不好。”</span><br><br>这几句话终于让这张照片有了方向：圣约翰大学、苏家、巡捕房，还有那个黑衣男人。`,
      choices: [
        {
          text: '💵 好，这委托我接了',
          effect: (s) => {
            s.chapter = 1;
            acceptCaseBase();
            E.setFlag('echo_zhou_quick_trust', true);
            E.addClue('周怀安的第一印象', '你问清基本情况后很快接下委托。周怀安记住了这份干脆。');
          },
          goto: 'ch1_take'
        },
        { text: '🧾 再问清几个细节', goto: 'ch1_ask_detail' },
        { text: '🚪 听完了，但这个案子我不接', goto: 'end_refuse_named' }
      ]
    };

    nodes.ch1_ask_detail = {
      title: '听雨茶馆 · 追问',
      text: () => `你把茶盏往旁边推了推。<br><br><span class="sys">“她最后一次确定出现在哪里？谁最后见过她？巡捕房为什么判断她可能自己走？”</span><br><br>周怀安终于坐直了一些。他说，苏晚亭最后一次被同学看见，是在圣约翰大学宿舍楼附近。舍监记得她那天下午出门，神色不太好。<br><br><span class="sys">“巡捕房问了几句，就说成年女学生自己离开也不是没有可能。可晚亭最近不是想走，她像是在怕什么。”</span><br><br>你问他有没有可以证明身份、方便去学校问话的东西。<br><br>周怀安把照片推得更近些。照片背面有一行娟秀小字：<span class="sys">“民国三十七年九月 · 光启公园 · 晚亭”</span>。<br><br><span class="sys">“学校里的人认得这张照片。她母亲也认得。沈先生，我不求你立刻给我答案，只求你别像巡捕房那样，把她写成一句‘自行离开’。”</span><br><br>你已经知道从哪里动手了。`,
      choices: [
        {
          text: '💵 接下委托',
          effect: (s) => {
            s.chapter = 1;
            acceptCaseBase();
            E.setFlag('echo_zhou_questioned_first', true);
            E.addClue('周怀安的第一印象', '你先问清苏晚亭失踪前后的细节，再接下委托。周怀安记住了这份谨慎。');
          },
          goto: 'ch1_take'
        },
        { text: '🚪 问清楚了，但这个案子我不接', goto: 'end_refuse_named' }
      ]
    };

    E.__openingIntakePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyOpeningIntakePolish);
})();
