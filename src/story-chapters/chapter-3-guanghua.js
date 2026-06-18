(function installChapter3Guanghua() {
  function applyChapter3Guanghua() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch3_school_chen_su: {
        title: '陈老师与苏晚亭',
        text: () => `你拿出苏晚亭的照片给吴校长看。

<span class="sys">"这个女孩子，你认识吗？"</span>

吴校长一看照片，表情就变了。<span class="sys">"她……她来过。陈老师出事前一个星期，她来过学校几次，说是陈老师的朋友。"</span>

<span class="sys">"她来做什么？"</span>

<span class="sys">"说是来借书。陈老师藏书很多，尤其是教育类的。她说她在写论文，需要参考资料。我也没多想。"</span>

<span class="sys">"陈老师出事后，她还来过吗？"</span>

吴校长摇了摇头。<span class="sys">"没有。再也没来过。"</span>

你没有告诉他苏晚亭失踪的事。`,
        effect: (s) => { E.addClue('苏晚亭与陈明远', '失踪前多次来学校找陈老师借书'); E.setFlag('chen_su_link', true); },
        choices: [
          { text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' },
          { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
          { text: '🔙 回到校长办公室', goto: 'ch3_school' },
        ],
      },

      ch3_school_yufang: {
        title: '问沈玉芳的事',
        text: () => `你从怀里掏出沈玉兰给的那张照片——她妹妹沈玉芳，梳着齐耳短发，穿一件素色旗袍，站在光华小学门口，笑得很安静。

吴校长接过照片，脸色沉了下来。

<span class="sys">"沈老师……她是我们学校的数学老师，教五年级。来了三年了，课讲得好，学生都喜欢她。"</span>

<span class="sys">"她失踪前有什么异常吗？"</span>

吴校长摘下眼镜擦了擦。<span class="sys">"说实话——她出事前那段时间确实不对劲。总是心不在焉，上课有时候会走神。我找她谈过一次话，她说家里有事。她说她姐姐身体不好……现在看来，可能是另一个意思。"</span>

<span class="sys">"她跟陈老师关系怎么样？"</span>

吴校长想了想。<span class="sys">"走得挺近的。陈老师藏书多，沈老师也爱看书，经常去他办公室借书。有时候放学了还看到他们在办公室里聊到很晚。但也就是普通同事——我当时是这么以为的。"</span>

他说"我当时是这么以为的"的时候，语气里有一丝迟来的不安。

<span class="sys">"她失踪前最后一天——有什么特别的事吗？"</span>

<span class="sys">"最后一天……她上了一节早课，然后说人不舒服，提前走了。那之后再也没有回来。她办公桌上的东西都没带走——书本、茶杯、一张学生的成绩单——到现在还原封不动放着。"</span>

你心里记下了这一点——沈玉芳离开得很匆忙，连随身物品都没拿。不像是计划好的离开。`,
        effect: (s) => { E.addClue('沈玉芳与陈明远', '走得近，经常借书聊天；失踪前心不在焉，匆忙离开未带物品'); },
        choices: [
          { text: '💬 问陈老师的事', goto: 'ch3_school_teacher' },
          { text: '💬 学校还有什么异常？', goto: 'ch3_school_weird' },
          { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
          { text: '🔙 回到校长办公室', goto: 'ch3_school' },
        ],
      },

      ch3_school_weird: {
        title: '学校的异常',
        text: () => `你问吴校长，最近学校有没有什么不寻常的事。

他犹豫了一下。

<span class="sys">"有两件事……我不知道有没有关系。"</span>

<span class="sys">"第一件。陈老师出事前三天，有人看到他在操场上跟一个人在吵架。天已经黑了，看不清是谁，但听声音是个女人。"</span>

<span class="sys">"第二件。沈玉芳老师——她在陈老师出事前一个星期就不来上课了。请了病假，但一直没回来。我派人去她家看过，门锁着，没有人。她是教数学的，一直很负责……突然不来，不太正常。"</span>

沈玉芳——沈玉兰的妹妹。她也失踪了。`,
        effect: (s) => { E.addClue('陈老师与女子争吵', '出事前三天；沈玉芳同时请假失踪'); },
        choices: [
          { text: '📖 看陈老师的办公室', goto: 'ch3_school_office' },
          { text: '🔙 回到校长办公室', goto: 'ch3_school' },
        ],
      },

      ch3_school_office: {
        title: '陈老师的办公室',
        text: () => `吴校长带你来到一楼拐角的一间办公室。门上贴着"陈明远老师"的名牌，已经有些褪色。

办公室已经被收拾过了——书架上空了一大半，桌面干净得像没人用过一样。

但你还是发现了一些东西。

在书桌最底层的抽屉里，有一个夹层——你摸到了。撬开夹层，里面有一个牛皮纸信封。

信封里装着三样东西：

<b>一、</b>一张当票——"永昌当铺 · 民国三十七年九月 · 押：翡翠镯一只 · 洋三百元"。

<b>二、</b>一封没有寄出的信。开头是："晚亭吾爱……"

<b>三、</b>一张黑白照片——陈老师、苏晚亭，还有一个穿旗袍的女人。三个人站在一座教堂前。那个女人你在茶楼见过——沈玉兰。`,
        effect: (s) => { E.addClue('陈老师遗物', '当票、给苏晚亭的信、三人合影'); E.addClue('陈老师给苏晚亭的信', '"晚亭吾爱"开头——两人关系不一般'); E.addItem('永昌当票', '民国三十七年九月，押翡翠镯一只，洋三百元。'); E.addItem('未寄出的信', '陈明远写给苏晚亭的信，开头是"晚亭吾爱"。'); E.setFlag('got_chen_evidence', true); },
        choices: [
          { text: '📩 看那封信的内容', goto: 'ch3_chen_letter' },
          { text: '🔙 整理线索，准备结案', goto: 'ch3_wrapup' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_3_GUANGHUA_READY = true;
      window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES = ['ch3_school_chen_su', 'ch3_school_yufang', 'ch3_school_weird', 'ch3_school_office'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter3Guanghua);
})();
