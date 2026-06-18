(function installChapter2PoliceDynamic() {
  function applyChapter2PoliceDynamic() {
    if (typeof nodes === 'undefined') return;

    Object.assign(nodes, {
      ch2_police: {
        title: '上海法租界巡捕房',
        time: {d:1, h:16, m:0},
        weather: 1,
        onPresent: (item, s) => {
          if (item.name === '半张烟盒纸' && !E.getFlag('presented_note')) {
            E.setFlag('presented_note', true);
            return { goto: 'ch2_police_present' };
          }
          return null;
        },
        text: () => `巡捕房坐落在薛华立路上，灰扑扑的建筑，门口挂着青天白日旗。

你认识这里的一个探长——<b>老孙</b>，孙国栋，跟你打过几次交道。他正坐在办公桌前抽烟，看到你来了也不意外。

<span class="sys">"我就知道你会来。周怀安那小子去找你了吧？"</span>

他吐了个烟圈，从抽屉里抽出一个文件夹丢在桌上。

<span class="sys">"苏晚亭的案子。说实话，没什么东西。女学生失踪，十有八九是自己跑了——但周怀安不死心，我也不能拦着他花钱。"</span>

你翻开卷宗。`,
        effect: (s) => { E.addContact('孙国栋探长'); E.discoverRelation('孙国栋'); E.setFlag('met_police', true); },
        choices: [
          { text: '📖 仔细翻看卷宗', goto: 'ch2_police_file' },
        ],
      },

      ch2_police_file: {
        title: '失踪案卷宗',
        text: () => `卷宗很薄，记录平平无奇。

但你的目光被一行小字吸引——在记录页的边缘，有人用铅笔写了一行批注。字迹潦草，跟正式记录的不是同一只手：

<span class="sys">"此案与光华小学事件有关联？建议并案——王"</span>

你抬头看老孙。

<span class="sys">"光华小学？"</span>

老孙掐灭了烟，表情有些微妙。<span class="sys">"那是上个月的事了。光华小学有个男老师跳楼了。三十七岁，姓陈。留了一封遗书，说是'愧对学生，无颜苟活'。当时定性为自杀，案子就结了。"</span>

<span class="sys">"那个姓陈的老师……跟苏晚亭有什么关系？"</span>

老孙耸耸肩。<span class="sys">"不知道。写这备注的同事姓王，上个月调走了。你要是想查，得自己去挖。"</span>`,
        effect: (s) => { E.addClue('光华小学事件', '男教师跳楼自杀；备注提到与苏案可能有关'); E.addItem('卷宗摘抄', '苏晚亭失踪案卷宗边缘有铅笔批注：此案与光华小学事件有关联？'); E.addContact('王巡官（已调离）'); E.setFlag('got_case_file', true); },
        choices: (s) => {
          const opts = [];
          opts.push({ text: '📎 追问王巡官调离前留下了什么', goto: 'ch2_police_wang' });
          if (E.getFlag('got_wang_note')) {
            opts.push({ text: '🏛️ 去薛华立路 22 号——老孙说王巡官查过这里', goto: 'ch2_frenchtown' });
            opts.push({ text: '🏠 去苏家看她母亲', goto: 'ch2_home' });
          }
          return opts;
        },
      },

      ch2_police_alt: {
        title: '上海法租界巡捕房',
        text: () => `老孙还坐在那里抽烟，看你来了把卷宗推过来。<br><br><span class="sys">"你倒是勤快。卷宗我给你翻出来了——别问我为什么又给你翻，反正你迟早自己来拿。"</span><br><br>卷宗里有一行铅笔批注引起了你的注意：<span class="sys">"此案与光华小学事件有关联？建议并案——王"</span><br><br>你问了老孙才知道，光华小学上个月有个男老师跳楼自杀了，姓陈，三十七岁。现场留了一封遗书，写的是"愧对学生，无颜苟活"。当时定性为自杀，案子已结。<br><br><span class="sys">"写批注的那个王巡官，后来调走了。调走的原因嘛……你自己猜。"</span>老孙把烟掐灭了，像是不想再多说。`,
        effect: (s) => { E.addContact('孙国栋探长'); E.addClue('光华小学事件', '男教师跳楼自杀；备注提到与苏案可能有关'); E.addItem('卷宗摘抄', '苏晚亭失踪案卷宗边缘有铅笔批注：此案与光华小学事件有关联？'); E.setFlag('got_case_file', true); },
        choices: (s) => {
          const opts = [];
          opts.push({ text: '📎 追问王巡官调离前留下了什么', goto: 'ch2_police_wang' });
          if (E.getFlag('got_wang_note')) {
            opts.push({ text: '🏛️ 去薛华立路 22 号——王巡官的线索指向这里', goto: 'ch2_frenchtown' });
            opts.push({ text: '🏠 去苏家', goto: 'ch2_home' });
          }
          return opts;
        },
      },
    });

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_POLICE_DYNAMIC_READY = true;
      window.MLT_STORY_CHAPTER_2_POLICE_DYNAMIC_NODES = ['ch2_police', 'ch2_police_file', 'ch2_police_alt'];
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2PoliceDynamic);
})();
