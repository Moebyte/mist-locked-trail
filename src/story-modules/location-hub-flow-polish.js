// ===== 地点调查面板化 =====
// 目标：圣约翰大学、苏家、光华小学采用“地点内连续调查”模式，避免每问一个问题就跳出再返回。

(function installLocationHubFlowPolish() {
  function applyLocationHubFlowPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__locationHubFlowPolishPatched) return;

    function addLine(lines, ok, text) {
      if (ok) lines.push(text);
    }

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function univAllDone() {
      return E.hasClue('舍监证词') && E.getFlag('asked_door') && E.hasClue('法租界地图');
    }

    function homeAllDone() {
      return E.hasClue('母亲证词') && E.getFlag('asked_photo') && E.getFlag('asked_mother_photo') && E.getFlag('shown_photo_to_mother');
    }

    function schoolBasicDone() {
      return E.getFlag('asked_about_chen') && E.getFlag('chen_su_link') && E.hasClue('陈老师与女子争吵') && E.getFlag('got_chen_evidence');
    }

    // —— 圣约翰大学：地点内连续调查 ——
    if (nodes.ch2_university) {
      nodes.ch2_university.text = function () {
        const lines = [];
        addLine(lines, E.hasClue('舍监证词'), '舍监说，苏晚亭失踪当天下午两点多出门，最近常外出，失踪前夜还曾在房里低声哭过。');
        addLine(lines, E.getFlag('asked_door'), '门房记得那个黑衣男人：四十岁上下，北方口音，左手食指戴一枚绿玉扳指。');
        addLine(lines, E.hasClue('法租界地图'), '论文草稿背面写着薛华立路 22 号，牛津字典里还夹着法租界地图和一页日记残页。');
        const progress = lines.length ? `<br><br><b>已查到：</b><br>${lines.map(x => `• ${x}`).join('<br>')}` : '';
        return `圣约翰大学的校园在这个季节很美。法国梧桐的叶子落了满地，踩上去沙沙响。<br><br>你站在苏晚亭宿舍门口。王舍监、门房、书桌上的论文草稿，都还等着你一一查清。${progress}`;
      };
      nodes.ch2_university.choices = function () {
        const opts = [];
        if (!E.hasClue('舍监证词')) {
          opts.push({
            text: '👩 问舍监——失踪那天的情况',
            effect: () => {
              E.addClue('舍监证词', '失踪当天下午两点出门，最近常外出，失踪前夜曾哭泣');
              E.setFlag('univ_matron_asked', true);
            },
            goto: 'ch2_university'
          });
        }
        if (!E.getFlag('asked_door')) {
          opts.push({
            text: '🚪 找门房——问黑衣男人的事',
            effect: () => {
              E.addClue('黑衣男人线索', '四十岁左右，北方口音，左手食指戴绿玉扳指');
              E.setFlag('asked_door', true);
            },
            goto: 'ch2_university'
          });
        }
        if (!E.hasClue('法租界地图')) {
          opts.push({
            text: '📄 检查她的论文草稿和字典',
            effect: () => {
              E.addClue('法租界地图', '薛华立路 22 号被圈出');
              E.addClue('铅笔清单', '薛华立路 22 号，周三下午三点，不要告诉任何人');
              E.addClue('苏晚亭日记残页', '她知道陈明远害怕，也知道沈玉芳和陆小姐都被卷进光华小学的秘密');
              E.addItem('法租界地图', '夹在牛津字典里的书签地图，薛华立路 22 号被铅笔圈出。');
              E.addItem('铅笔清单', '写在论文稿背面的轻淡字迹：薛华立路 22 号、周三下午三点、不要告诉任何人。');
              E.addItem('日记残页', '苏晚亭夹在牛津字典里的残页：她决定继续追查光华小学的秘密。');
              E.setFlag('univ_paper_checked', true);
            },
            goto: 'ch2_university'
          });
        }
        if (univAllDone()) opts.push({ text: '🔙 圣约翰大学查得差不多了，去下一站', goto: 'ch2_leave_univ' });
        return opts;
      };
    }

    // —— 苏家：地点内连续调查 ——
    if (nodes.ch2_home) {
      delete nodes.ch2_home.onPresent;
      nodes.ch2_home.presentFilter = () => false;
      nodes.ch2_home.text = function () {
        const lines = [];
        addLine(lines, E.hasClue('母亲证词'), '苏母说，晚亭这半年一直有心事，两个月前曾深夜淋雨回家，眼睛红得像哭过。');
        addLine(lines, E.getFlag('asked_photo'), '墙上的全家福被裁掉一角，只剩一只搭在苏晚亭肩上的手，袖口别着校徽。');
        addLine(lines, E.getFlag('asked_mother_photo'), '苏母说那是父亲那边的远房亲戚，但她明显不愿多谈。');
        addLine(lines, E.getFlag('shown_photo_to_mother'), '你把光启公园的照片给苏母看，她交给你一只刻着“亭”字的旧银发夹。');
        const progress = lines.length ? `<br><br><b>已问到：</b><br>${lines.map(x => `• ${x}`).join('<br>')}` : '';
        return `苏晚亭的家在闸北一条狭窄弄堂里。青石板路湿漉漉的，墙根长着青苔。<br><br>苏母坐在轮椅上，腿上盖着薄毯。她知道你是为晚亭来的，也知道有些话早晚要说。${progress}`;
      };
      nodes.ch2_home.choices = function () {
        const opts = [];
        if (!E.hasClue('母亲证词')) {
          opts.push({
            text: '💬 问苏晚亭最近有没有异常',
            effect: () => {
              E.addClue('母亲证词', '两个月前曾深夜淋雨回家，像哭过；这半年一直有心事');
              E.setFlag('home_talk_done', true);
            },
            goto: 'ch2_home'
          });
        }
        if (!E.getFlag('asked_photo')) {
          opts.push({
            text: '🖼️ 细看墙上的全家福',
            effect: () => {
              E.addClue('裁切的照片', '全家福里有人被裁掉；袖口有校徽');
              E.setFlag('asked_photo', true);
            },
            goto: 'ch2_home'
          });
        }
        if (E.getFlag('asked_photo') && !E.getFlag('asked_mother_photo')) {
          opts.push({
            text: '💬 问苏母——照片里被裁掉的是谁',
            effect: () => {
              E.addClue('表哥', '照片上裁掉的人是苏晚亭的“表哥”；苏母不愿多谈');
              E.addClue('苏家旧伤', '墙上全家福被裁掉的人只是苏家不愿多谈的旧关系，不像当前失踪案的直接线索。');
              E.setFlag('asked_mother_photo', true);
            },
            goto: 'ch2_home'
          });
        }
        if (E.hasItem('苏晚亭的照片') && !E.getFlag('shown_photo_to_mother')) {
          opts.push({
            text: '🖼️ 拿出苏晚亭的照片给苏母看',
            effect: () => {
              E.setFlag('shown_photo_to_mother', true);
              E.addClue('苏母认出照片', '苏母看着照片说：这是她失踪前两个月拍的，她很珍惜。');
              E.addItem('苏晚亭的银发夹', '苏母交给你的旧银发夹，内侧刻着一个很小的“亭”字。');
              E.addClue('苏母托付信物', '苏母把苏晚亭小时候常戴的银发夹交给你，说她认得这个东西。');
            },
            goto: 'ch2_home'
          });
        }
        if (homeAllDone() || (E.hasClue('母亲证词') && E.getFlag('asked_photo'))) opts.push({ text: '🔙 告辞，离开苏家', goto: 'ch2_leave_home' });
        return opts;
      };
    }

    // —— 光华小学：普通问询集中在校长办公室；正式质询仍是独立一次性场景 ——
    if (nodes.ch3_school) {
      nodes.ch3_school.text = function () {
        const lines = [];
        addLine(lines, E.getFlag('asked_about_chen'), '吴校长说陈明远在光华小学教了五年，出事当晚值夜；遗书写着“愧对学生，无颜苟活”，但他不信陈老师是自杀。');
        addLine(lines, E.getFlag('chen_su_link'), '吴校长认出苏晚亭：她曾在陈老师出事前一周数次来学校，说是找陈老师借书。');
        addLine(lines, E.hasClue('陈老师与女子争吵'), '陈老师出事前三天，夜里曾在操场和一个女人争吵；沈玉芳老师也在那段时间请病假后失踪。');
        addLine(lines, E.hasClue('沈玉芳与陈明远'), '沈玉芳和陈明远走得近，经常借书聊天；她失踪前心不在焉，最后一天匆忙离校，连办公桌上的东西都没带走。');
        addLine(lines, E.getFlag('got_chen_evidence'), '陈老师办公室夹层里有当票、未寄出的信和三人合影。');
        addLine(lines, E.getFlag('read_letter'), '陈明远的信写到傅启元、教具箱、管制药品和薛华立路 22 号 203 室。');
        const progress = lines.length ? `<br><br><b>已问到：</b><br>${lines.map(x => `• ${x}`).join('<br>')}` : '';
        return `吴校长办公室里有一股旧纸和粉笔灰的味道。窗外是操场，雨后的旗杆一动不动。<br><br>普通寒暄已经没意义。你要把陈明远、苏晚亭、沈玉芳和陆小姐一条条问清。${progress}`;
      };
      nodes.ch3_school.choices = function () {
        const opts = [];
        if (!E.getFlag('asked_about_chen')) {
          opts.push({
            text: '💬 问陈老师坠楼的事',
            effect: () => {
              E.addClue('陈明远坠楼案', '遗书称“做了不可原谅的事”；校长不信是自杀');
              E.discoverRelation('陈明远');
              E.setFlag('asked_about_chen', true);
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('asked_about_chen') && !E.getFlag('chen_su_link')) {
          opts.push({
            text: '💬 问陈老师跟苏晚亭的关系',
            effect: () => {
              E.addClue('苏晚亭与陈明远', '失踪前多次来学校找陈老师借书');
              E.setFlag('chen_su_link', true);
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('asked_about_chen') && !E.hasClue('陈老师与女子争吵')) {
          opts.push({ text: '💬 问学校最近有没有异常', goto: 'ch3_school_weird' });
        }
        if (E.getFlag('sister_case') && !E.hasClue('沈玉芳与陈明远')) {
          opts.push({
            text: '💬 问沈玉芳老师的事',
            effect: () => {
              E.addClue('沈玉芳与陈明远', '走得近，经常借书聊天；失踪前心不在焉，匆忙离开未带物品');
              E.setFlag('school_yufang_asked', true);
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('asked_about_chen') && !E.getFlag('got_chen_evidence')) {
          opts.push({
            text: '📖 查看陈老师办公室',
            effect: () => {
              E.addClue('陈老师遗物', '当票、给苏晚亭的信、三人合影');
              E.addClue('陈老师给苏晚亭的信', '“晚亭吾爱”开头——两人关系不一般');
              E.addItem('永昌当票', '民国三十七年九月，押翡翠镯一只，洋三百元。');
              E.addItem('未寄出的信', '陈明远写给苏晚亭的信，开头是“晚亭吾爱”。');
              E.addItem('三人合影', '陈明远、苏晚亭和陆小姐在光华小学门前的合影。');
              E.addClue('三人合影', '陈明远、苏晚亭和陆小姐在光华小学门前的合影。');
              E.setFlag('got_chen_evidence', true);
              E.setFlag('school_office_searched', true);
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('got_chen_evidence') && !E.getFlag('read_letter')) {
          opts.push({
            text: '📩 看陈明远那封未寄出的信',
            effect: () => {
              E.addClue('陈明远的信', '让苏晚亭去薛华立路22号203取真相；暗示有人要灭口');
              E.addClue('陈明远的退缩', '陈明远曾因恐吓选择沉默，后来才决定留下证据');
              E.addClue('傅启元夜运教具箱', '陈明远值夜时看到傅启元的人把“教学器材”箱搬进后楼');
              E.addClue('管制药品走私', '陈明远看到教具箱里装着药瓶、针剂和军用纱布');
              E.addItem('陈明远的信', '信里写着傅启元、教具箱、管制药品和薛华立路 22 号 203 室。');
              E.setFlag('read_letter', true);
            },
            goto: 'ch3_school'
          });
        }
        if ((E.getFlag('got_chen_evidence') || hasThing('恐吓信') || hasThing('日记残页')) && !E.getFlag('school_wu_confront_done') && !E.getFlag('school_wu_confront_closed')) {
          opts.push({ text: '🧾 普通问询到此为止，进入正式质询', goto: 'ch3_school_confront_wu' });
        }
        if (E.getFlag('school_wu_three_proofs')) opts.push({ text: '🔙 光华小学这条线暂时收住，回去整理', goto: 'ch3_wrapup' });
        return opts;
      };
    }

    E.__locationHubFlowPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLocationHubFlowPolish);
})();
