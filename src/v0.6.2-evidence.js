// ===== v0.6.2 关键举证补全 =====
// 本补丁只补 onPresent 举证交互，不改主线推进结构。

function applyEvidenceImprovements() {
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

  chainPresent('ch4_dock_who_dual', (item) => {
    if (presentOnce(item, '三人合影', 'presented_photo_to_yufang_dual')) return { goto: 'ch4_yufang_present_photo_dual' };
    if (presentOnce(item, '陈明远的信', 'presented_letter_to_yufang_dual')) return { goto: 'ch4_yufang_present_letter_dual' };
    if (presentOnce(item, '未寄出的信', 'presented_unsent_letter_to_yufang_dual')) return { goto: 'ch4_yufang_present_letter_dual' };
    if (presentOnce(item, '日记残页', 'presented_diary_to_yufang_dual')) return { goto: 'ch4_yufang_present_diary_dual' };
    return null;
  });

  nodes.ch4_yufang_present_photo_dual = {
    title: '举证 · 三人合影',
    weather: 2,
    effect: () => E.addClue('沈玉芳认出三人合影', '沈玉芳确认陈明远、苏晚亭与陆念薇在光华小学已有交集'),
    text: () => `沈玉芳看见照片时，第一反应不是看陈明远，而是看苏晚亭。<br><br><span class="sys">"这张照片……是在光华门口拍的。那天陈老师本来不想拍，晚亭非说，要留下证据。她说，如果有一天大家都不敢说话，至少照片还会说话。"</span><br><br>苏晚亭靠在墙边，闭着眼，指尖却微微收紧。`,
    choices: [{ text: '🔙 继续带她们离开', goto: 'ch4_dock_escape' }]
  };

  nodes.ch4_yufang_present_letter_dual = {
    title: '举证 · 陈明远的信',
    weather: 2,
    effect: () => E.addClue('沈玉芳确认陈明远求助', '沈玉芳确认陈明远死前准备揭开走私链，并试图保护苏晚亭'),
    text: () => `沈玉芳接过信，读到一半就停住了。<br><br><span class="sys">"这是陈老师的字。他写信那天来找过我，说如果他第二天没到学校，就让我别再相信任何公文。"</span><br><br>她看向苏晚亭，声音低下去：<span class="sys">"晚亭就是因为这封信，才坚持要去查那些教具箱。"</span>`,
    choices: [{ text: '🔙 继续带她们离开', goto: 'ch4_dock_escape' }]
  };

  nodes.ch4_yufang_present_diary_dual = {
    title: '举证 · 日记残页',
    weather: 2,
    effect: () => E.addClue('沈玉芳读到苏晚亭日记', '沈玉芳确认苏晚亭不是被动卷入，而是主动追查光华小学的秘密'),
    text: () => `你把那张日记残页递给沈玉芳。她读得很慢。<br><br>读到<span class="sys">"如果我不去，沈老师怎么办"</span>时，她忽然捂住嘴，眼泪从指缝里落下来。<br><br><span class="sys">"我一直以为是我害了她。原来她从一开始就知道危险。"</span><br><br>苏晚亭没有完全醒来，但她像是听见了，眉头轻轻皱了一下。`,
    choices: [{ text: '🔙 继续带她们离开', goto: 'ch4_dock_escape' }]
  };

  chainPresent('ch4_fu_confront', (item) => {
    if (presentOnce(item, '福生仓地址', 'presented_address_to_fu')) return { goto: 'ch4_fu_present_address' };
    if (presentOnce(item, '光华货运单', 'presented_waybill_to_fu')) return { goto: 'ch4_fu_present_waybill' };
    if (presentOnce(item, '清场指令', 'presented_clearance_to_fu')) return { goto: 'ch4_fu_present_clearance' };
    return null;
  });

  nodes.ch4_fu_present_address = {
    title: '举证 · 福生仓地址',
    weather: 5,
    effect: () => E.addClue('傅启元与福生仓', '傅启元对福生仓地址没有表现出任何意外，说明他熟悉这个地点'),
    text: () => `你把写着福生仓三号仓库的纸条举到傅启元面前。<br><br>他没有问这是什么地方，也没有问你为什么会来。<br><br>这比任何否认都更糟。<br><br><span class="sys">"上海这样的仓库很多。沈先生，知道一个地址，不等于知道真相。"</span><br><br>他在退，但没有乱。这个地址只能证明你找到了门，还不能证明门后是谁。`,
    choices: [
      { text: '🧾 继续拿出更硬的证据', goto: 'ch4_fu_confront' },
      { text: '🌫️ 先带人撤走', goto: 'ch4_dock_escape_finish' }
    ]
  };

  nodes.ch4_fu_present_waybill = {
    title: '举证 · 光华货运单',
    weather: 5,
    effect: () => {
      E.addClue('傅启元货运单破绽', '光华小学教学器材名义的货运单直接指向福生仓三号仓库，傅启元难以当场撇清');
      E.setFlag('fu_waybill_exposed', true);
    },
    text: () => `你把货运单摊开，压在他的蓝封公文夹上。<br><br>发货名义是<span class="sys">"光华小学教学器材补充采购"</span>，收货地点却是<span class="sys">"福生仓三号"</span>。<br><br>傅启元终于不笑了。<br><br><span class="sys">"一张货运单，能说明很多事。也能什么都说明不了。"</span><br><br>他说得很稳，可你看到他把公文夹往身后收了一寸。那一寸，就是破绽。`,
    choices: [
      { text: '📄 再逼他看清场指令', goto: 'ch4_fu_confront' },
      { text: '🚕 带着证人和货运单离开', goto: 'ch4_dock_escape_finish' }
    ]
  };

  nodes.ch4_fu_present_clearance = {
    title: '举证 · 清场指令',
    weather: 5,
    effect: () => {
      E.addClue('傅启元清场指令破绽', '清场指令使用公董局蓝封纸，和傅启元手中公文夹形成对应');
      E.setFlag('fu_clearance_exposed', true);
    },
    text: () => `你把那张蓝封清场指令抖开。纸角在夜风里轻响。<br><br><span class="sys">"三日内清走，别留痕迹。"</span><br><br>傅启元手里的公文夹，也是同样的蓝封。<br><br>他终于看了老孙一眼，又看了看你背后的沈玉芳。<br><br><span class="sys">"沈先生，今晚你带走的是麻烦，不是证人。"</span><br><br>你知道他还没有倒下。但至少此刻，他不能在码头上把你们留下。`,
    choices: [
      { text: '🚕 立刻送证人离开码头', goto: 'ch4_dock_escape_finish' }
    ]
  };
}

document.addEventListener('DOMContentLoaded', applyEvidenceImprovements);
