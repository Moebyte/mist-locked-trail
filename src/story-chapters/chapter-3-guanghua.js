(function installChapter3GuanghuaFirstBatch() {
  function applyChapter3GuanghuaFirstBatch() {
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
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_3_GUANGHUA_READY = true;
      window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES = ['ch3_school_chen_su'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter3GuanghuaFirstBatch);
})();
