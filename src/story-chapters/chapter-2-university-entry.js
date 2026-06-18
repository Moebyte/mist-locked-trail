(function installChapter2UniversityEntry() {
  function applyChapter2UniversityEntry() {
    if (typeof nodes === 'undefined') return;

    const universityText = [
      '圣约翰大学的校园在这个季节很美。法国梧桐的叶子落了满地，金黄色的，踩上去沙沙响。',
      '',
      '你找到了苏晚亭的宿舍——一栋红砖小楼。舍监是个四十多岁的胖女人，姓王，警惕地打量了你半天才放你进去。',
      '',
      '苏晚亭的寝室在二楼，靠窗。房间里收拾得很干净，书桌上摆着几本英文小说和一沓稿纸。你翻了翻——是她的论文草稿，批注密密麻麻。',
    ].join('\n');

    Object.assign(nodes, {
      ch2_university: {
        title: '圣约翰大学',
        time: {d:1, h:15, m:0},
        weather: 0,
        text: (s) => {
          let extra = '';
          if (E.hasClue('黑衣男人')) extra += '\n\n你记起周怀安说的黑衣男人——你要找门房聊聊。';
          return `${universityText}\n\n${extra}`;
        },
        choices: (s) => {
          const opts = [];
          if (!E.hasClue('舍监证词')) opts.push({ text: '👩 问舍监——失踪那天的情况', goto: 'ch2_univ_matron' });
          if (!E.hasClue('黑衣男人') || !E.getFlag('asked_door')) opts.push({ text: '🚪 找门房——问黑衣男人的事', goto: 'ch2_univ_door' });
          if (!E.hasClue('法租界地图')) opts.push({ text: '📄 检查她的论文草稿', goto: 'ch2_univ_paper' });
          if (E.hasClue('舍监证词') && E.getFlag('asked_door') && E.hasClue('法租界地图')) opts.push({ text: '🔙 已经查得差不多了，去下一个地方', goto: 'ch2_leave_univ' });
          return opts;
        },
      },

      ch2_leave_univ: {
        title: '下一步调查',
        text: () => {
          let summary = '';
          if (E.hasClue('铅笔清单') || E.hasClue('法租界地图')) {
            summary = '苏晚亭失踪前频繁外出，有人来找过她，她去过法租界的薛华立路 22 号，失踪前夜在哭泣。铅笔清单上那行"不要告诉任何人"像一根细针扎在记忆里。';
          } else if (E.getFlag('got_case_file')) {
            summary = '巡捕房的卷宗里有一行铅笔批注——“此案与光华小学事件有关联？”写批注的王巡官已经被调走。老孙说那不是巧合。';
          } else {
            summary = '苏晚亭失踪四天了。巡捕房没有进展，周怀安急得团团转。你手里还没有多少线索。';
          }
          const transition = E.getFlag('got_case_file') ? '你走出巡捕房。夜色已经漫上法租界的街道。' : '你走出校门。梧桐叶在脚下发出沙沙声，远处传来电车的叮当声。';
          return `你把线索整理了一下。${summary}\n\n${transition}你心里的图还缺太多拼图块。\n\n去哪？`;
        },
        choices: (s) => {
          const opts = [];
          if (!E.hasClue('法租界地图')) opts.push({ text: '🔙 回圣约翰大学继续调查', goto: 'ch2_university' });
          opts.push({ text: '🏛️ 去薛华立路 22 号（地址浮出水面）', goto: 'ch2_frenchtown' });
          opts.push({ text: '📋 去巡捕房查卷宗', goto: 'ch2_police_alt' });
          opts.push({ text: '🏠 去苏家看她母亲', goto: 'ch2_home' });
          return opts;
        },
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_UNIVERSITY_ENTRY_READY = true;
      window.MLT_STORY_CHAPTER_2_UNIVERSITY_ENTRY_NODES = ['ch2_university', 'ch2_leave_univ'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2UniversityEntry);
})();
