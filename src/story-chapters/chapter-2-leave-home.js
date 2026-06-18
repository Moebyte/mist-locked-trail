(function installChapter2LeaveHome() {
  function applyChapter2LeaveHome() {
    if (typeof nodes === 'undefined') return;

    const leaveHomeText = [
      '你站在弄堂口，秋风吹起地上的落叶。身后苏家的门轻轻关上了，你还是能听见苏母轮椅在屋里移动的声音——很慢，很轻，像是在怕惊醒什么。',
      '',
      '弄堂口的梧桐树掉了一大半叶子，堆在青石板缝里，踩上去发出脆响。一个卖烤红薯的老太太推车经过，看了你一眼，没说话。',
      '',
      '你在心里盘算下一步。苏晚亭的线索指向三个方向——巡捕房、法租界、苏家。你的时间不多。',
    ].join('\n');

    Object.assign(nodes, {
      ch2_leave_home: {
        title: '闸北街头',
        text: () => leaveHomeText,
        choices: [
          { text: '🏛️ 去薛华立路 22 号', when: (s) => E.hasClue('法租界地图') || E.getFlag('got_wang_note'), goto: 'ch2_frenchtown' },
          { text: '📋 去巡捕房查卷宗', when: (s) => !E.getFlag('got_case_file'), goto: 'ch2_police' },
          { text: '📚 去圣约翰大学调查', when: (s) => !E.hasClue('铅笔清单'), goto: 'ch2_university' },
        ],
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_LEAVE_HOME_READY = true;
      window.MLT_STORY_CHAPTER_2_LEAVE_HOME_NODES = ['ch2_leave_home'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2LeaveHome);
})();
