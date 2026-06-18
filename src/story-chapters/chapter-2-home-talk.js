(function installChapter2HomeTalk() {
  function applyChapter2HomeTalk() {
    if (typeof nodes === 'undefined') return;

    const talkText = [
      '你问苏母，晚亭失踪前有没有什么异常。',
      '',
      '<span class="sys">"这孩子……"</span>苏母叹了口气，<span class="sys">"她从小就懂事，从来不让我操心。功课好，人也乖巧。可是最近这半年，她好像一直有心事。我问她，她总说没事。"</span>',
      '',
      '<span class="sys">"有一回——大概两个月前——她半夜突然跑回来，浑身湿透了，像是淋了雨。我问她怎么了，她说是图书馆关门了，走到半路下雨了。但我看到她眼睛红红的，像是哭过。她不说，我也不忍心追问。"</span>',
      '',
      '<span class="sys">"她爸爸走得早，我这条腿也不争气。这孩子扛了太多事了。"</span>',
      '',
      '你安慰了她几句，心里却在想——苏晚亭到底扛着什么事。',
    ].join('\n');

    Object.assign(nodes, {
      ch2_home_talk: {
        title: '母亲的证词',
        text: () => talkText,
        effect: (s) => { E.addClue('母亲证词', '两个月前曾深夜淋雨回家，像哭过；这半年一直有心事'); },
        choices: (s) => {
          const opts = [];
          if (!E.getFlag('asked_photo')) opts.push({ text: '🖼️ 墙上的照片里有什么线索？', goto: 'ch2_home_photo' });
          opts.push({ text: '🔙 回到苏家', goto: 'ch2_home' });
          return opts;
        },
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_TALK_READY = true;
      window.MLT_STORY_CHAPTER_2_HOME_TALK_NODES = ['ch2_home_talk'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeTalk);
})();
