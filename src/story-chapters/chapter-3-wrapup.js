(function installChapter3Wrapup() {
  function applyChapter3Wrapup() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch3_wrapup: {
        title: '线索整理',
        time: {d:2, h:11, m:30},
        weather: 3,
        text: (s) => {
          const clues = s.clues.map(c => `• ${c.name}：${c.desc}`).join('\n');
          const checklist = [];
          checklist.push((E.getFlag('got_wang_note') ? '✅' : '⚫') + ' 王巡官纸条');
          checklist.push((E.hasClue('三人合影') ? '✅' : '⚫') + ' 三人合影');
          checklist.push((E.getFlag('read_letter') ? '✅' : '⚫') + ' 陈老师的信');
          checklist.push((E.hasItem('翡翠镯') ? '✅' : '⚫') + ' 翡翠镯');
          checklist.push((E.getFlag('found_yufang') ? '✅' : '⚫') + ' 福生仓');
          const checklistText = checklist.join('  ');
          const phase = E.deadlinePhase ? E.deadlinePhase() : 'safe';
          const timeHint = phase === 'critical' ? '⚠️ 时间只够最后一次行动了。' : phase === 'tight' ? '⏰ 时间吃紧——苏晚亭可能撑不了太久。' : '';
          return `你在办公室里坐了一会儿，把所有线索串起来。\n\n目前掌握的证据：\n\n${clues || '暂时还没有关键线索。'}\n\n<div style="border:1px solid var(--line);padding:8px;border-radius:4px;margin:6px 0"><b>调查进度</b><br>${checklistText}</div>\n${timeHint ? timeHint + '<br>' : ''}现在你掌握的信息足够去追查真相了。但关键人物陆小姐已经失踪，黑衣男人身份不明，陈老师死了，苏晚亭和沈玉芳都下落不明。`;
        },
        choices: (s) => {
          const opts = [];
          if (E.getFlag('got_case_file') && !E.getFlag('got_wang_note')) opts.push({ text: '📎 回巡捕房追查王巡官的批注', goto: 'ch2_police_wang' });
          if (!E.getFlag('found_yufang') && !E.getFlag('missed_deadline') && (E.getFlag('got_wang_note') || E.hasClue('福生仓位置'))) opts.push({ text: '⛵ 去苏州河废弃码头——查福生仓', goto: 'ch4_suzhou_creek' });
          if (E.canDeduce('deduce_chen') && !E.getFlag('deduced_chen') && !E.getFlag('deduced_wrong')) {
            opts.push({ text: '🧩 拼合线索——推理陈明远之死', effect: (s) => { E.openDeduction('deduce_chen'); } });
          }
          if (E.canDeduce('deduce_lu_zhao') && E.getFlag('deduced_chen') && !E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_lu_zhao_fail')) {
            opts.push({ text: '🧩 推理——黑衣男人与陆小姐的关系', effect: (s) => { E.openDeduction('deduce_lu_zhao'); } });
          }
          if (E.canDeduce('deduce_fusheng') && E.getFlag('deduced_lu_zhao') && !E.getFlag('deduced_fusheng') && !E.getFlag('deduced_fusheng_fail')) {
            opts.push({ text: '🧩 推理——福生仓与公董局的真相', effect: (s) => { E.openDeduction('deduce_fusheng'); } });
          }
          if (E.getFlag('deduced_fusheng') && E.getFlag('rescued_yufang') && !E.getFlag('missed_deadline') && !E.getFlag('hidden_end_unlocked')) {
            opts.push({ text: '🌟 完整拼图——直指法租界幕后', effect: (s) => { E.setFlag('hidden_end_unlocked', true); }, goto: 'end_conspiracy_detail' });
          }
          opts.push({ text: '🏛️ 去当铺——查当票上的翡翠镯', goto: 'ch4_pawnshop' });
          opts.push({ text: '🔙 回顾所有证据，做出推断', goto: 'ch4_conclusion' });
          return opts;
        },
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_3_WRAPUP_READY = true;
      window.MLT_STORY_CHAPTER_3_WRAPUP_NODES = ['ch3_wrapup'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter3Wrapup);
})();
