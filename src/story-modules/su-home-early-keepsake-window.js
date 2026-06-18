// ===== 苏家早到信物窗口 =====
// 早去苏家：只能得到零散证词；带着苏晚亭近期照片回来，苏母才交出银发夹。
(function installSuHomeEarlyKeepsakeWindow() {
  function applySuHomeEarlyKeepsakeWindow() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__suHomeEarlyKeepsakeWindowPatched) return;

    function hasRecentSuPhoto() {
      return E.hasItem?.('苏晚亭的照片') || E.hasClue?.('苏晚亭藏起的照片') || E.hasClue?.('苏母认出照片') || E.getFlag?.('shown_photo_to_mother');
    }

    function homeAllDone() {
      return E.hasClue?.('母亲证词') && E.getFlag?.('asked_photo') && E.getFlag?.('asked_mother_photo') && E.getFlag?.('shown_photo_to_mother');
    }

    function addZhouFianceClues() {
      E.setFlag?.('su_mother_knows_zhou_fiance', true);
      E.addClue?.('苏母知道周怀安婚约', '苏母知道周怀安是苏晚亭的未婚夫，也知道女儿失踪后是周怀安在到处托人寻找。');
      E.addClue?.('为情而去说法存疑', '苏母承认周怀安与苏晚亭的婚约仍在；若只凭残信和疑似遗书断定苏晚亭为情而去，这个说法站不稳。');
    }

    function markEarlyVisit() {
      E.setFlag?.('su_home_early_without_photo', true);
      E.addClue?.('苏母的保留', '你第一次到苏家时，苏母只说出几句零散往事。她似乎还有东西没有拿出来。');
    }

    function giveKeepsake() {
      E.setFlag?.('shown_photo_to_mother', true);
      E.addClue?.('苏母认出照片', '苏母看着照片说：这是苏晚亭失踪前两个月拍的，她很珍惜。');
      E.addItem?.('苏晚亭的银发夹', '苏母交给你的旧银发夹，内侧刻着一个很小的“亭”字。');
      E.addClue?.('苏母托付信物', '苏母把苏晚亭小时候常戴的银发夹交给你，说她认得这个东西。');
      addZhouFianceClues();
    }

    function earlyVisitText() {
      return '苏家屋里很暗，窗帘垂着半边，雨水顺着窗框往下爬。<br><br>苏母坐在轮椅里，膝上搭着一条旧毯子。你报出周怀安的名字时，她的眼神动了一下，却没有立刻请你坐。<br><br><span class="sys">“周先生让你来的？”</span><br><br>她问得很轻，轻得不像质问，倒像是在确认自己还能不能相信别人。<br><br>你说起苏晚亭失踪前的事。她听着，手指慢慢攥住毯角。几次像是要开口，最后都只是把话咽了回去。<br><br><span class="sys">“她这半年……是有些不一样。”</span><br><span class="sys">“夜里回来过一次，衣服湿透了，眼睛也红。”</span><br><span class="sys">“我问她，她只说路上落雨。”</span><br><br>说到这里，苏母忽然看向里屋的旧柜子。柜门半掩着，里面压着几只旧木匣。她的手在轮椅扶手上停了一会儿，最终没有转过去。<br><br><span class="sys">“沈先生，我不是不想帮你。可我已经把晚亭弄丢一次了。”</span><br><br><span class="sys">“你若真见过她最近留下的东西，再来找我。”</span><br><br>雨声从窗外落下来。你知道她还有话没有说完，也还有东西没有拿出来。';
    }

    function keepsakeText() {
      const lead = E.getFlag?.('su_home_early_without_photo') ? '你第二次进苏家时，苏母没有立刻问你话。她像是早知道你会回来。' : '苏母坐在轮椅里，屋里很暗，只有窗外的雨光落在茶几上。';
      return lead + '<br><br>你把照片递过去。<br><br>苏母原本只是低头看了一眼，可下一刻，她的手忽然停住了。照片边缘被她捏得微微发弯，她像是怕看错，又把它举近了些。<br><br><span class="sys">“这是光启公园。”</span><br><br>她终于抬起头，眼里那层防备像被雨水慢慢冲开。<br><br><span class="sys">“她回来那天，说这张照片拍得好。还说……若是哪天她不在家，让我别急，她总会想办法留下些什么。”</span><br><br>苏母说到这里，轮椅轻轻一响。她转进里屋，打开那个你上次见过的旧柜子。<br><br>过了很久，她拿出一只用手帕包着的小银发夹。银面已经旧了，内侧却还刻着一个很小的<span class="sys">“亭”</span>字。<br><br><span class="sys">“你若真能见到她，把这个给她看。”</span><br><span class="sys">“她会知道，你来过家里。”</span><br><br>这一次，苏母没有再问你是不是周先生派来的。她只是看着你，把最后一句话说得很慢：<br><br><span class="sys">“把她带回来。”</span>';
    }

    function normalText() {
      const lines = [];
      if (E.hasClue?.('母亲证词')) lines.push('苏母说，晚亭这半年一直有心事，两个月前曾深夜淋雨回家，眼睛红得像哭过。');
      if (E.getFlag?.('asked_photo')) lines.push('墙上的全家福被裁掉一角，只剩一只搭在苏晚亭肩上的手，袖口别着校徽。');
      if (E.getFlag?.('asked_mother_photo')) lines.push('苏母说那是父亲那边的远房亲戚，但她明显不愿多谈。');
      if (E.getFlag?.('shown_photo_to_mother')) lines.push('你把光启公园的照片给苏母看，她交给你一只刻着“亭”字的旧银发夹。');
      const progress = lines.length ? '<br><br><b>已问到：</b><br>' + lines.map(x => '• ' + x).join('<br>') : '';
      return '苏晚亭的家在闸北一条狭窄弄堂里。青石板路湿漉漉的，墙根长着青苔。<br><br>苏母坐在轮椅上，腿上盖着薄毯。她知道你是为晚亭来的，也知道有些话早晚要说。' + progress;
    }

    if (nodes.ch2_home && !nodes.ch2_home.__earlyKeepsakeWindowPatched) {
      nodes.ch2_home.text = function () {
        if (E.getFlag?.('su_home_show_early_visit_scene')) { E.state.flags.su_home_show_early_visit_scene = false; return earlyVisitText(); }
        if (E.getFlag?.('su_home_show_keepsake_scene')) { E.state.flags.su_home_show_keepsake_scene = false; return keepsakeText(); }
        return normalText();
      };

      nodes.ch2_home.choices = function () {
        const opts = [];
        if (!E.hasClue?.('母亲证词')) opts.push({ text: '💬 问苏晚亭最近有没有异常', effect: () => { E.addClue?.('母亲证词', '两个月前曾深夜淋雨回家，像哭过；这半年一直有心事'); E.setFlag?.('home_talk_done', true); addZhouFianceClues(); if (!hasRecentSuPhoto()) { markEarlyVisit(); E.setFlag?.('su_home_show_early_visit_scene', true); } }, goto: 'ch2_home' });
        if (!E.getFlag?.('asked_photo')) opts.push({ text: '🖼️ 细看墙上的全家福', effect: () => { E.addClue?.('裁切的照片', '全家福里有人被裁掉；袖口有校徽'); E.setFlag?.('asked_photo', true); }, goto: 'ch2_home' });
        if (E.getFlag?.('asked_photo') && !E.getFlag?.('asked_mother_photo')) opts.push({ text: '💬 问苏母——照片里被裁掉的是谁', effect: () => { E.addClue?.('表哥', '照片上裁掉的人是苏晚亭的表哥；苏母不愿多谈'); E.addClue?.('苏家旧伤', '墙上全家福被裁掉的人只是苏家不愿多谈的旧关系，不像当前失踪案的直接线索。'); E.setFlag?.('asked_mother_photo', true); }, goto: 'ch2_home' });
        if (hasRecentSuPhoto() && !E.getFlag?.('shown_photo_to_mother')) opts.push({ text: E.getFlag?.('su_home_early_without_photo') ? '🖼️ 把苏晚亭留下的照片放到苏母面前' : '🖼️ 拿出苏晚亭的照片给苏母看', effect: () => { giveKeepsake(); E.setFlag?.('su_home_show_keepsake_scene', true); }, goto: 'ch2_home' });
        if (homeAllDone() || (E.hasClue?.('母亲证词') && E.getFlag?.('asked_photo')) || (E.hasClue?.('母亲证词') && E.getFlag?.('su_home_early_without_photo'))) opts.push({ text: '🔙 告辞，离开苏家', goto: 'ch2_leave_home' });
        return opts;
      };
      nodes.ch2_home.__earlyKeepsakeWindowPatched = true;
    }

    E.__suHomeEarlyKeepsakeWindowPatched = true;
  }
  document.addEventListener('DOMContentLoaded', applySuHomeEarlyKeepsakeWindow);
})();