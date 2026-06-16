// ===== 故事剧情密度模块 =====
// 从 v0.7-narrative-depth.js 稳定迁出，负责三方冲突、傅启元交易与自然结局分流。

function applyNarrativeDepthV07() {
  if (typeof E === 'undefined' || typeof nodes === 'undefined') return;

  E.v07InvestigationQuality = function () {
    let score = 0;
    const reasons = [];
    const add = (ok, n, reason) => {
      if (ok) {
        score += n;
        reasons.push(reason);
      }
    };

    add(this.getFlag('rescued_yufang'), 2, '沈玉芳获救并能作证');
    add(this.getFlag('rescued_su'), 3, '苏晚亭被活着带出福生仓');
    add(this.getFlag('su_moved_from_dock') || this.getFlag('su_trace_only'), 1, '找到苏晚亭曾被关押的直接痕迹');
    add(this.getFlag('deduced_fusheng'), 2, '你推明白福生仓与公董局的关系');
    add(this.getFlag('fu_waybill_exposed') || this.getFlag('sun_waybill_convinced'), 2, '货运单把学校与码头连成证据链');
    add(this.getFlag('fu_clearance_exposed') || this.getFlag('sun_clearance_convinced'), 2, '清场指令暴露幕后擦痕迹的动作');
    add(this.getFlag('v07_witnesses_protected'), 1, '你优先保护了活人证词');
    add(this.getFlag('v07_lu_confronted'), 1, '陆念薇线索与沈玉芳、苏晚亭线真正交汇');
    add(this.getFlag('v07_rejected_fu_deal'), 1, '你拒绝傅启元的私下交易');
    add(this.getFlag('zhou_understands_wanting') || this.getFlag('zhou_accepts_chen_link'), 1, '周明远理解苏晚亭的选择，不再只是委托人');

    return { score, reasons };
  };

  E.v07ResolveEnding = function () {
    const quality = this.v07InvestigationQuality();
    if (this.getFlag('missed_deadline')) return 'end_too_late';
    if (quality.score >= 10 && this.getFlag('rescued_yufang') && (this.getFlag('rescued_su') || this.getFlag('su_moved_from_dock'))) {
      return 'end_conspiracy_detail';
    }
    if (this.getFlag('rescued_su') || this.getFlag('v07_witnesses_protected')) return 'end_rescue';
    if (quality.score >= 6) return 'end_conspiracy';
    return 'end_archive';
  };

  if (nodes.ch4_dock_escape_finish) {
    const oldEscapeText = nodes.ch4_dock_escape_finish.text;
    nodes.ch4_dock_escape_finish.text = () => `${typeof oldEscapeText === 'function' ? oldEscapeText() : oldEscapeText}<br><br>车子没有直接回事务所，而是先拐进一家教会医院的后门。老孙的人守在巷口，周明远站在走廊尽头，脸色白得像墙灰。<br><br>你知道，真正难的不是把人从仓库里带出来，而是决定接下来牺牲什么、保护什么。`;
    nodes.ch4_dock_escape_finish.choices = [
      { text: '🏥 去医院走廊，面对所有人的争执', goto: 'ch4_hospital_conflict' },
      { text: '🔙 暂时回事务所整理证词和证据', goto: 'ch3_wrapup' }
    ];
  }

  nodes.ch4_hospital_conflict = {
    title: '教会医院 · 走廊里的三方争执',
    weather: 5,
    effect: () => {
      E.addClue('医院走廊冲突', '救人之后，周明远、老孙和沈玉芳对下一步产生直接冲突');
      E.setFlag('v07_triangle_conflict_seen', true);
    },
    text: () => {
      const suLine = E.getFlag('rescued_su')
        ? '苏晚亭躺在病房里，隔着一扇门，你能听见她很轻的咳声。'
        : '苏晚亭仍然不在这里，沈玉芳手里攥着那张学生证，像攥着一块会割手的玻璃。';
      return `医院走廊很窄，消毒水的味道压住了码头带来的潮腥。<br><br>${suLine}<br><br>周明远第一个开口，声音压得很低：<span class="sys">"先别问了。她们刚逃出来。先让她们睡一觉。"</span><br><br>老孙把帽子夹在腋下，脸色很难看：<span class="sys">"睡一觉？天亮以前，傅启元的人就能把码头账本烧干净。活人要保，证据也要保。"</span><br><br>沈玉芳坐在长椅上，突然抬头：<span class="sys">"你们都在说傅启元，可陆念薇呢？她不是清白的。她知道箱子里是什么，也知道陈老师会死。"</span><br><br>三条线终于撞在同一条走廊里：苏晚亭要救，沈玉芳要活，陆念薇要交代。你不可能同时让所有人满意。`;
    },
    choices: [
      { text: '🛏️ 先保住活人证词，任何审问等天亮以后', effect: () => E.setFlag('v07_choice_protect_witnesses', true), goto: 'ch4_hospital_protect_witnesses' },
      { text: '🚓 让老孙立刻封码头，趁傅启元还没擦干净', effect: () => E.setFlag('v07_choice_pressure_fu', true), goto: 'ch4_hospital_pressure_fu' },
      { text: '🕯️ 逼陆念薇现身，让三条线当面对质', effect: () => E.setFlag('v07_choice_draw_lu', true), goto: 'ch4_lu_confrontation' }
    ]
  };

  nodes.ch4_hospital_protect_witnesses = {
    title: '教会医院 · 先保活人',
    weather: 5,
    effect: () => {
      E.setFlag('v07_witnesses_protected', true);
      E.addClue('证人被保护', '你选择先保护苏晚亭和沈玉芳，证词更完整，但给了傅启元清理现场的时间');
      E.addHeat(1, '你选择先保人，码头证据可能被转移。');
    },
    text: () => `你挡在病房门口。<br><br><span class="sys">"今晚谁也不进去逼问。老孙，你的人守前后门。周先生，你去找医生。沈老师，你只回答一个问题：还有没有第二个关人的地方？"</span><br><br>沈玉芳看着你，像是终于确认你不是来交换证词的。<br><br>她低声说：<span class="sys">"傅启元不只一个仓库。但福生仓是中转点。陆念薇知道下一站。"</span><br><br>老孙没有再反对，只是咬着烟没有点。你看得出他在算时间。你也在算。每多保护一个活人，就可能少抓住一张纸。`,
    choices: [
      { text: '🕯️ 根据沈玉芳的话，逼陆念薇现身', goto: 'ch4_lu_confrontation' },
      { text: '🔙 带着完整证词回去写结案材料', goto: 'ch4_conclusion' }
    ]
  };

  nodes.ch4_hospital_pressure_fu = {
    title: '教会医院 · 趁夜压码头',
    weather: 5,
    effect: () => {
      E.setFlag('v07_pressed_fu_network', true);
      E.addClue('连夜压码头', '你说服老孙立刻封锁码头，但这会让傅启元提前意识到你掌握了关键证人');
      E.addHeat(2, '老孙连夜动人，傅启元也会立刻得到风声。');
    },
    text: () => `老孙听完你的判断，终于把烟点着。<br><br><span class="sys">"好。我调两个人去码头，不走公文。出了事，我没来过医院。"</span><br><br>周明远猛地抬头：<span class="sys">"那病房怎么办？傅启元的人如果来呢？"</span><br><br>你看向走廊尽头。那里有一扇半开的窗，夜雾正从窗缝里渗进来。<br><br>你突然意识到：傅启元不一定要回码头。他更可能直接来医院，找最不能被留下的人。`,
    choices: [
      { text: '🚬 出门等傅启元来谈条件', goto: 'ch4_fu_private_offer' },
      { text: '🕯️ 先设法找陆念薇，让她补上缺口', goto: 'ch4_lu_confrontation' }
    ]
  };

  nodes.ch4_lu_confrontation = {
    title: '教会医院 · 陆念薇现身',
    weather: 5,
    effect: () => {
      E.setFlag('v07_lu_confronted', true);
      E.addClue('陆念薇医院现身', '陆念薇来到医院，沈玉芳当面指认她知道教具箱和傅启元的安排');
    },
    text: () => `半小时后，后门传来两短一长的敲门声。<br><br>陆念薇站在门外，披着一件不合身的黑色大衣，眼底有很深的青影。<br><br>沈玉芳一看见她就站了起来：<span class="sys">"你还敢来？陈老师死前去找过你。晚亭也是因为信了你，才去查箱子。"</span><br><br>陆念薇没有反驳。她看向病房门，声音发紧：<span class="sys">"傅启元要把最后一批货从南码头送走。人如果还在他手里，也会一起走。"</span><br><br>周明远往前一步：<span class="sys">"那你为什么现在才说？"</span><br><br>陆念薇看着他，又像是在看另一个早就死掉的人：<span class="sys">"因为我一直以为，沉默至少能让一个人活着。后来我发现，沉默只是让他们更方便地挑下一个。"</span><br><br>这不是和解。是三条线终于互相咬住。`,
    choices: [
      { text: '🚓 把陆念薇交给老孙，换正式口供', effect: () => E.setFlag('v07_lu_to_sun', true), goto: 'ch4_conclusion' },
      { text: '🧾 让她写下傅启元的下一步安排', effect: () => { E.setFlag('v07_lu_statement', true); E.addClue('陆念薇补充口供', '陆念薇写下傅启元南码头转运安排'); }, goto: 'ch4_fu_private_offer' },
      { text: '🌫️ 放她走，让她继续做内线', effect: () => { E.setFlag('v07_lu_as_informant', true); E.addHeat(1, '你放走陆念薇，留下了内线，也留下了风险。'); }, goto: 'ch4_conclusion' }
    ]
  };

  nodes.ch4_fu_private_offer = {
    title: '医院后巷 · 傅启元的交易',
    weather: 5,
    effect: () => {
      E.setFlag('v07_fu_private_offer_seen', true);
      E.addClue('傅启元私下交易', '傅启元没有只靠威胁，而是试图用事务所、周明远和苏母的安全与你交易');
    },
    text: () => `你在医院后巷等了不到十分钟，黑色汽车就停在了巷口。<br><br>傅启元没有带太多人。他下车时甚至还替你挡了一下风，像一个体面的上司在照顾下属。<br><br><span class="sys">"沈先生，你很会找人。这样的人，不该只开一家靠寻猫找债活着的小事务所。"</span><br><br>他递来一张名片，背面写着一个数字。足够买下你半辈子的安稳。<br><br><span class="sys">"明天早上，周明远会继续做他的编辑。苏太太会继续在闸北养病。你会得到一笔钱。至于陆念薇，她本来就是在逃犯。让她承担一切，所有人都轻松。"</span><br><br>他终于把刀递到你手里。不是杀人的刀，是让你替他选择谁该被牺牲。`,
    choices: [
      { text: '💼 接下名片，假装答应交易', effect: () => { E.setFlag('v07_accepted_fu_card', true); E.addClue('傅启元名片', '傅启元亲自递出交易名片，试图让陆念薇背下全部罪名'); }, goto: 'ch4_conclusion' },
      { text: '🧾 拒绝交易，把货运单和清场指令压回他手里', effect: () => { E.setFlag('v07_rejected_fu_deal', true); E.addClue('拒绝傅启元交易', '你拒绝让陆念薇背下全部罪名，坚持追查傅启元本人'); }, goto: 'ch4_conclusion' },
      { text: '📰 告诉他材料已寄给《申报》和老孙', when: () => E.getFlag('fu_waybill_exposed') || E.getFlag('fu_clearance_exposed') || E.getFlag('v07_lu_statement'), effect: () => { E.setFlag('v07_fu_bluffed_with_press', true); E.addClue('反制傅启元', '你用多份材料和报馆线索反制傅启元，让他无法当场灭口'); }, goto: 'ch4_conclusion' }
    ]
  };

  if (nodes.ch4_conclusion) {
    const oldConclusionText = nodes.ch4_conclusion.text;
    const originalConclusionChoices = nodes.ch4_conclusion.choices;
    const oldConclusionChoices = typeof originalConclusionChoices === 'function'
      ? originalConclusionChoices
      : () => originalConclusionChoices || [];

    nodes.ch4_conclusion.text = (s) => {
      const base = typeof oldConclusionText === 'function' ? oldConclusionText(s) : oldConclusionText;
      const quality = E.v07InvestigationQuality();
      const reasonText = quality.reasons.length
        ? quality.reasons.map(r => `• ${r}`).join('<br>')
        : '• 你的证据还散着，能写成报告，但很难逼任何人低头。';
      return `${base}<br><br><b>调查质量：</b>${quality.score} 分<br>${reasonText}<br><br>这一刻，结论不再只是选择一个嫌疑人名字，而是看你救下了谁、保住了什么证据、有没有让关键人物当面对质。`;
    };
  }
}

document.addEventListener('DOMContentLoaded', applyNarrativeDepthV07);
