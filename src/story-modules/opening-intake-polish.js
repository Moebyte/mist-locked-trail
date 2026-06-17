// ===== 接案问询收束 =====
// 目标：接案前必须先问清最低限度信息，避免主角在不知道委托人姓名、失踪者背景和基本线索时直接接案。
// 调整：周怀安不再直接交出苏晚亭照片；照片改由后续调查取得，避免苏家信物线过早直给。

(function installOpeningIntakePolish() {
  function applyOpeningIntakePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__openingIntakePolishPatched) return;

    function acceptCaseBase() {
      E.addContact('周怀安');
      E.addClue('黑衣男人', '失踪前有一个穿黑衣服的男人到学校找过苏晚亭。');
    }

    if (nodes.ch1_open) {
      const oldOpenText = nodes.ch1_open.text;
      nodes.ch1_open.text = function (state) {
        const base = typeof oldOpenText === 'function' ? oldOpenText(state) : oldOpenText;
        // 替换照片描述：周怀安不再直接交出照片
        return base
          .replace(/中年人从怀里掏出一张照片放在桌上。照片被一层薄纸包着，像是怕被雨水打湿。他小心翼翼地展开——照片上是一个年轻女人，容貌端正，穿着民国女学生的制服，白上衣黑裙子，眉目之间带着一丝倔强。照片边角有些卷曲，被人反复摩挲过。/g, '中年人从怀里掏出一个信封放在桌上。信封不大，被雨水打湿了一角。他没有打开，只是用手按住，像是在犹豫该不该交给你。')
          .replace(/你看着照片上的苏晚亭，她望着镜头之外的某个方向，眼神清澈而执拗，像是早已知道有人在找她。/g, '你没有见过苏晚亭本人。但周怀安说话时，手指无意识地敲着桌面的节奏，让你觉得他描述的那双眼睛，大概也是这种神色——清澈而执拗，像是早已知道有人在找她。');
      };
      nodes.ch1_open.choices = [
        { text: '❓ 先问清楚来龙去脉', goto: 'ch1_ask' },
        { text: '🚪 这个案子我不接', goto: 'end_refuse' }
      ];
    }

    if (nodes.end_refuse) {
      nodes.end_refuse.title = '结局 · 雨落无声';
      nodes.end_refuse.text = () => `你把信封推回去。<br><br><span class="sys">“抱歉。这个案子我接不了。你另请高明吧。”</span><br><br>男人愣了一下。他看着你，像是还想再说几句，最后只是把银元收回怀里。<br><br><span class="sys">“……我明白了。打扰了，沈先生。”</span><br><br>他站起来，鞠了一躬，走进雨里。<br><br>你又叫了一壶茶。窗外的雨没有要停的意思。你看着对面的空椅子，心想：上海每天都有人失踪，你管不过来，也不想管。<br><br>——三个月后。<br><br>你在《申报》的社会版角落里看到一则简短的报道：「圣约翰大学女生苏某失踪案因线索不足，已由巡捕房归档。家属未再提出申诉。」<br><br>报道旁边是一条皮鞋广告。<br><br>你把报纸翻了过去，继续喝你的茶。<br><br>雨还在下。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局一 · 雨落无声 ——</div>`;
    }

    // 只保留一个“雨落无声”结局记录，避免 end_refuse / end_refuse_named 被统计成两个结局。
    delete nodes.end_refuse_named;

    nodes.ch1_ask = {
      title: '听雨茶馆',
      text: () => `你没有立刻收下信封。<br><br><span class="sys">“先说清楚。你叫什么，和苏小姐是什么关系？她什么时候不见的？失踪前有没有异常？”</span><br><br>男人像是这才想起自己还没有报上姓名，抹了一把脸上的雨水。<br><br><span class="sys">“我叫周怀安，在商务印书馆做编辑。晚亭是我的未婚妻。”</span><br><br>他说，苏晚亭是圣约翰大学英文系学生，四天前说去图书馆还书，此后再也没有回来。巡捕房立了案，但只说“也许是自行离开”。<br><br><span class="sys">“她不会自己走。她母亲卧病在床，她每周都要回去看。她若真要离开，至少会留句话。”</span><br><br>你继续问她最近有没有异常。<br><br>周怀安沉默了一会儿。<br><br><span class="sys">“有。失踪前半个月，她常常很晚才回宿舍。我问她去哪，她只说在准备毕业论文。可她是英文系，论文题目是《简·奥斯汀作品中的女性意识》——不需要到外面查什么资料。”</span><br><br>他顿了顿，声音更低。<br><br><span class="sys">“还有一个穿黑衣服的男人。失踪前两天，那人到学校找过她。门房说那人大概四十岁，戴宽檐帽，看不清脸。晚亭跟他说了几句话，回来以后脸色很不好。”</span><br><br>这几句话给了你方向：圣约翰大学、苏家、巡捕房，还有那个黑衣男人。至于能让苏家真正相信你的东西，还得从晚亭自己的生活里找。`,
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
        { text: '🚪 听完了，但这个案子我不接', goto: 'end_refuse' }
      ]
    };

    nodes.ch1_ask_detail = {
      title: '听雨茶馆 · 追问',
      text: () => `你把茶盏往旁边推了推。<br><br><span class="sys">“她最后一次确定出现在哪里？谁最后见过她？巡捕房为什么判断她可能自己走？”</span><br><br>周怀安终于坐直了一些。他说，苏晚亭最后一次被同学看见，是在圣约翰大学宿舍楼附近。舍监记得她那天下午出门，神色不太好。<br><br><span class="sys">“巡捕房问了几句，就说成年女学生自己离开也不是没有可能。可晚亭最近不是想走，她像是在怕什么。”</span><br><br>你问他有没有可以证明她身份、方便去学校问话的东西。<br><br>周怀安摇摇头。<br><br><span class="sys">“她平时不爱照相。我手里没有近照。她说过，有些东西放在宿舍里，安全些。”</span><br><br>他停了一下，声音低下去：<br><br><span class="sys">“沈先生，我不求你立刻给我答案，只求你别像巡捕房那样，把她写成一句‘自行离开’。”</span><br><br>你已经知道从哪里动手了。`,
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
        { text: '🚪 问清楚了，但这个案子我不接', goto: 'end_refuse' }
      ]
    };

    if (nodes.ch1_take) {
      const oldTakeText = nodes.ch1_take.text;
      nodes.ch1_take.text = function (state) {
        const base = typeof oldTakeText === 'function' ? oldTakeText(state) : oldTakeText;
        // 不论哪条路径，ch1_take 都不应该提到照片
        if (E.getFlag('echo_zhou_questioned_first')) {
          return base
            .replace(/然后你拿起桌上的照片[^。]*。/g, '然后你在心里回想周怀安刚才的描述。')
            .replace(/照片上的女学生穿着制服[^。]*。/g, '')
            .replace(/你把照片翻过来[^。]*。/g, '')
            .replace(/然后你把它揣进大衣内袋[^。]*。/g, '然后你把信封揣进大衣内袋，贴着银元放着。')
            .replace(/照片边缘的硬角[^。]*。/g, '')
            .replace(/你重新把照片从内袋里取出来[^。]*。/g, '')
            .replace(/照片背面那行小字[^。]*。/g, '')
            .replace(/你把照片翻回正面[^。]*。/g, '')
            .replace(/那个叫苏晚亭的女学生仍然看着你[^。]*。/g, '')
            .replace(/照片上的目光也是凉的。/g, '')
            + '你没有她的近照。周怀安说她不常照相，学校才是第一站。';
        }
        // 快速接案路径
        if (E.getFlag('echo_zhou_quick_trust')) {
          return base
            .replace(/然后你拿起桌上的照片[^。]*。/g, '然后你在心里回想周怀安刚才说的几句话。')
            .replace(/照片上的女学生穿着制服[^。]*。/g, '')
            .replace(/你把照片翻过来[^。]*。/g, '')
            .replace(/然后你把它揣进大衣内袋[^。]*。/g, '然后你把信封揣进大衣内袋，贴着银元放着。')
            .replace(/照片边缘的硬角[^。]*。/g, '')
            .replace(/你重新把照片从内袋里取出来[^。]*。/g, '')
            .replace(/照片背面那行小字[^。]*。/g, '')
            .replace(/你把照片翻回正面[^。]*。/g, '')
            .replace(/那个叫苏晚亭的女学生仍然看着你[^。]*。/g, '')
            .replace(/照片上的目光也是凉的。/g, '')
            + '你没有她的近照——学校是第一站。';
        }
        return base;
      };
    }

    E.__openingIntakePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyOpeningIntakePolish);
})();
