// ===== 故事举证润色模块 =====
// 从 v0.6.3-evidence-polish.js 稳定迁出，负责老孙行动举证与周怀安情感举证。

function applyEvidencePolish() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  function chainPresent(nodeId, handler) {
    const node = nodes[nodeId];
    if (!node) return;
    const oldHandler = node.onPresent;
    node.onPresent = function (item, s) {
      const oldResult = typeof oldHandler === 'function' ? oldHandler(item, s) : null;
      return oldResult || handler(item, s);
    };
  }

  function presentOnce(item, itemName, flag) {
    if (typeof E.presentOnce === 'function') return E.presentOnce(item, itemName, flag);
    if (item && item.name === itemName && !E.getFlag(flag)) {
      E.setFlag(flag, true);
      return true;
    }
    return false;
  }

  function supportChoices() {
    return [
      { text: '🏃 立刻带人赶去福生仓', effect: () => E.setFlag('sun_fast_support', true), goto: 'ch4_dock_sun_fast_support' },
      { text: '🚓 调齐人手再行动', goto: 'ch4_dock_wait' },
      { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
    ];
  }

  chainPresent('ch4_sun_support', (item) => {
    if (presentOnce(item, '卷宗摘抄', 'presented_casefile_to_sun_support')) return { goto: 'ch4_sun_present_casefile' };
    if (presentOnce(item, '清场指令', 'presented_clearance_to_sun_support')) return { goto: 'ch4_sun_present_clearance' };
    if (presentOnce(item, '光华货运单', 'presented_waybill_to_sun_support')) return { goto: 'ch4_sun_present_waybill' };
    return null;
  });

  nodes.ch4_sun_present_casefile = {
    title: '举证 · 卷宗摘抄',
    weather: 4,
    effect: () => {
      E.addClue('老孙确认卷宗异常', '老孙确认苏晚亭失踪案和光华小学事件本应并案，卷宗被压下不是普通疏漏');
      E.setFlag('sun_casefile_alerted', true);
    },
    text: () => `你把卷宗摘抄推到老孙面前，指着那行铅笔批注：<br><br><span class="sys">"此案与光华小学事件有关联？建议并案——王"</span><br><br>老孙看了很久，指节在桌面上敲了两下。<br><br><span class="sys">"老王不会随便写这种话。他写了，就说明他已经见到脏东西了。"</span><br><br>他没有立刻答应出人，但办公室里的空气明显变了。你不是来讲故事的，你带来了他熟悉的笔迹。`,
    choices: [
      { text: '🧾 继续拿出更具体的福生仓证据', goto: 'ch4_sun_support' },
      { text: '🔙 先回去整理线索', goto: 'ch3_wrapup' }
    ]
  };

  nodes.ch4_sun_present_clearance = {
    title: '举证 · 清场指令',
    weather: 4,
    effect: () => {
      E.setFlag('sun_support_available', true);
      E.setFlag('sun_clearance_convinced', true);
      E.addClue('老孙被清场指令说服', '清场指令让老孙判断福生仓随时会被抹干净，因此愿意私下支援');
    },
    text: () => `你把清场指令摊开。蓝封纸角还沾着仓库里的灰。<br><br><span class="sys">"三日内清走，别留痕迹。"</span><br><br>老孙读完，脸色比刚才沉得多。<br><br><span class="sys">"这不是学生失踪案了。有人在用公文给他们擦地。"</span><br><br>他把门反锁，压低声音：<span class="sys">"我可以私下帮你。快，有快的代价；稳，有稳的代价。你选。"</span>`,
    choices: supportChoices
  };

  nodes.ch4_sun_present_waybill = {
    title: '举证 · 光华货运单',
    weather: 4,
    effect: () => {
      E.setFlag('sun_support_available', true);
      E.setFlag('sun_waybill_convinced', true);
      E.addClue('老孙确认货运链', '光华货运单让老孙确认学校、福生仓和码头货物之间存在直接链条');
    },
    text: () => `你把光华货运单放到桌上。老孙只看了抬头和收货地，眉头就拧了起来。<br><br><span class="sys">"光华小学教学器材，收货到福生仓三号？这账做得太干净，反而像假的。"</span><br><br>他用铅笔在货运单上圈出两个位置：发货名义，收货地点。<br><br><span class="sys">"有这张单子，我至少能叫人盯码头。但别指望走正式手续。正式手续会先通知他们。"</span>`,
    choices: supportChoices
  };

  chainPresent('ch4_revisit_zhou', (item) => {
    if (presentOnce(item, '日记残页', 'presented_diary_to_zhou')) return { goto: 'ch4_zhou_present_diary' };
    if (presentOnce(item, '陈明远的信', 'presented_letter_to_zhou')) return { goto: 'ch4_zhou_present_letter' };
    if (presentOnce(item, '三人合影', 'presented_photo_to_zhou')) return { goto: 'ch4_zhou_present_photo' };
    return null;
  });

  nodes.ch4_zhou_present_diary = {
    title: '举证 · 日记残页',
    weather: 5,
    effect: () => {
      E.addClue('周怀安理解苏晚亭选择', '周怀安读到日记后意识到苏晚亭不是任性失踪，而是在主动保护别人');
      E.setFlag('zhou_understands_wanting', true);
    },
    text: () => `你把日记残页递给周怀安。<br><br>他读到<span class="sys">"如果我不去，沈老师怎么办"</span>时，手指停住了。<br><br><span class="sys">"她从前也是这样。路上看见被雨淋湿的小猫，都要抱回去。可我总以为，长大了就该学会少管闲事。"</span><br><br>他把纸还给你，声音很轻：<span class="sys">"沈先生，找到她以后，别先骂她。她一定已经骂过自己很多遍了。"</span>`,
    choices: [{ text: '🔙 回去整理证据', goto: 'ch4_conclusion' }]
  };

  nodes.ch4_zhou_present_letter = {
    title: '举证 · 陈明远的信',
    weather: 5,
    effect: () => {
      E.addClue('周怀安面对陈明远的信', '周怀安确认自己并不完全了解苏晚亭与陈明远之间的秘密，也愿意优先救人');
      E.setFlag('zhou_accepts_chen_link', true);
    },
    text: () => `你把陈明远的信放在桌上。周怀安看见<span class="sys">"晚亭吾爱"</span>几个字时，脸色变了一下。<br><br>他沉默很久，没有问你他们是什么关系。<br><br><span class="sys">"我以为我很了解她。现在想想，我了解的只是她愿意让我看的那一面。"</span><br><br>他把信折好，推回你面前：<span class="sys">"这些以后再说。先把她找回来。活着，别的都可以慢慢问。"</span>`,
    choices: [{ text: '🔙 回去整理证据', goto: 'ch4_conclusion' }]
  };

  nodes.ch4_zhou_present_photo = {
    title: '举证 · 三人合影',
    weather: 5,
    effect: () => {
      E.addClue('周怀安认出光华合影', '周怀安确认苏晚亭曾提起光华小学，却把相关风险瞒了下来');
      E.setFlag('zhou_recognizes_guanghua_photo', true);
    },
    text: () => `你把三人合影放到灯下。<br><br>周怀安盯着照片里的校门，喃喃念出四个字：<span class="sys">"光华小学。"</span><br><br><span class="sys">"她说那里有个孩子写英文特别好，想借几本书。我还笑她，自己论文都写不完，还管小学生。"</span><br><br>他抬起头，眼底的血丝更重了：<span class="sys">"原来她那时候已经在查了。"</span>`,
    choices: [{ text: '🔙 回去整理证据', goto: 'ch4_conclusion' }]
  };
}

document.addEventListener('DOMContentLoaded', applyEvidencePolish);
