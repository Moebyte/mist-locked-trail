(function installChapter2HomeEntry() {
  function applyChapter2HomeEntry() {
    if (typeof nodes === 'undefined') return;

    const homeText = [
      '苏晚亭的家在闸北一条狭窄的弄堂里。青石板路面湿漉漉的，墙根长着青苔。',
      '',
      '你敲开门。苏母是个五十多岁的妇人，坐在轮椅上，腿上盖着一条薄毯。她脸色苍白，但眼神清亮。',
      '',
      '<span class="sys">"你是……周先生派来的人吧？"</span>她的声音很轻。<span class="sys">"明远跟我说过了。请进。"</span>',
      '',
      '屋里很小，但收拾得干净。墙上挂着一张全家福——苏晚亭大约十五六岁的时候，站在一个中年男人身边，笑得很灿烂。那大概是她父亲，已经过世了。',
      '',
      '苏母给你倒了一杯茶。',
    ].join('\n');

    Object.assign(nodes, {
      ch2_home: {
        title: '苏家',
        time: {d:1, h:17, m:30},
        weather: 0,
        onPresent: (item, s) => {
          if (item.name === '苏晚亭的照片' && !E.getFlag('shown_photo_to_mother')) {
            E.setFlag('shown_photo_to_mother', true);
            return { goto: 'ch2_home_showphoto' };
          }
          return null;
        },
        text: () => homeText,
        effect: (s) => { E.addContact('苏母'); E.discoverRelation('苏母'); },
        choices: (s) => {
          const opts = [];
          if (!E.hasClue('母亲证词')) opts.push({ text: '💬 问苏晚亭最近的情况', goto: 'ch2_home_talk' });
          if (!E.getFlag('asked_photo')) opts.push({ text: '🖼️ 注意墙上的照片', goto: 'ch2_home_photo' });
          if (E.hasClue('母亲证词') && E.getFlag('asked_photo')) opts.push({ text: '🔙 告辞', goto: 'ch2_leave_home' });
          return opts;
        },
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_ENTRY_READY = true;
      window.MLT_STORY_CHAPTER_2_HOME_ENTRY_NODES = ['ch2_home'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeEntry);
})();
