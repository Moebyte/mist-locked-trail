// ===== 地点调查正文切换 =====
// 目标：地点仍留在同一页，但正文切换为刚选中的原剧情文本，而不是累积摘要。

(function installLocationHubDetailTextPolish() {
  function applyLocationHubDetailTextPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__locationHubDetailTextPolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function nodeText(id) {
      const node = nodes[id];
      if (!node || !node.text) return '';
      return typeof node.text === 'function' ? node.text(E.state) : node.text;
    }

    function univDone() {
      return E.hasClue('舍监证词') && E.getFlag('asked_door') && E.hasClue('法租界地图');
    }

    function homeCanLeave() {
      return E.hasClue('母亲证词') && E.getFlag('asked_photo') && E.getFlag('asked_mother_photo');
    }

    function setHubDetail(hub, detail) {
      E.setFlag(`${hub}_last_detail`, detail);
    }

    function baseUniversityText() {
      return `圣约翰大学的校园在这个季节很美。法国梧桐的叶子落了满地，金黄色的，踩上去沙沙响。<br><br>你找到了苏晚亭的宿舍。房间里收拾得很干净，书桌上摆着英文小说和一沓论文草稿。王舍监、门房、书桌上的纸张，都还等着你一一查清。`;
    }

    function baseHomeText() {
      return `苏晚亭的家在闸北一条狭窄弄堂里。青石板路面湿漉漉的，墙根长着青苔。<br><br>苏母坐在轮椅上，腿上盖着一条薄毯。她脸色苍白，但眼神清亮。屋里很小，却收拾得干净。墙上挂着一张全家福——照片边角被人裁过，像这个家里有些话一直没有说完。`;
    }

    function baseSchoolText() {
      return `吴校长办公室里有一股旧纸和粉笔灰的味道。窗外是操场，雨后的旗杆一动不动。<br><br>普通寒暄已经没意义。你要把陈明远、苏晚亭、沈玉芳和陆小姐一条条问清。`;
    }

    if (nodes.ch2_university) {
      nodes.ch2_university.text = function () {
        const detail = E.getFlag('university_last_detail');
        if (detail === 'matron') return nodeText('ch2_univ_matron');
        if (detail === 'door') return nodeText('ch2_univ_door');
        if (detail === 'paper') return nodeText('ch2_univ_paper');
        return baseUniversityText();
      };
      nodes.ch2_university.choices = function () {
        const opts = [];
        if (!E.hasClue('舍监证词')) {
          opts.push({
            text: '👩 问舍监——失踪那天的情况',
            effect: () => {
              E.addClue('舍监证词', '失踪当天下午两点出门，最近常外出，失踪前夜曾哭泣');
              E.setFlag('univ_matron_asked', true);
              setHubDetail('university', 'matron');
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
              setHubDetail('university', 'door');
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
              setHubDetail('university', 'paper');
            },
            goto: 'ch2_university'
          });
        }
        if (univDone()) opts.push({ text: '🔙 圣约翰大学查得差不多了，去下一站', goto: 'ch2_leave_univ' });
        return opts;
      };
    }

    if (nodes.ch2_home) {
      delete nodes.ch2_home.onPresent;
      nodes.ch2_home.presentFilter = () => false;
      nodes.ch2_home.text = function () {
        const detail = E.getFlag('home_last_detail');
        if (detail === 'talk') return nodeText('ch2_home_talk');
        if (detail === 'photo') return nodeText('ch2_home_photo');
        if (detail === 'ask_photo') return nodeText('ch2_home_ask_photo');
        if (detail === 'showphoto') return nodeText('ch2_home_showphoto');
        return baseHomeText();
      };
      nodes.ch2_home.choices = function () {
        const opts = [];
        if (!E.hasClue('母亲证词')) {
          opts.push({
            text: '💬 问苏晚亭最近有没有异常',
            effect: () => {
              E.addClue('母亲证词', '两个月前曾深夜淋雨回家，像哭过；这半年一直有心事');
              E.setFlag('home_talk_done', true);
              setHubDetail('home', 'talk');
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
              setHubDetail('home', 'photo');
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
              setHubDetail('home', 'ask_photo');
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
              setHubDetail('home', 'showphoto');
            },
            goto: 'ch2_home'
          });
        }
        if (homeCanLeave()) opts.push({ text: '🔙 告辞，离开苏家', goto: 'ch2_leave_home' });
        return opts;
      };
    }

    if (nodes.ch3_school) {
      nodes.ch3_school.text = function () {
        const detail = E.getFlag('school_last_detail');
        if (detail === 'teacher') return nodeText('ch3_school_teacher');
        if (detail === 'chen_su') return nodeText('ch3_school_chen_su');
        if (detail === 'weird') return nodeText('ch3_school_weird');
        if (detail === 'yufang') return nodeText('ch3_school_yufang');
        if (detail === 'office') return nodeText('ch3_school_office');
        if (detail === 'letter') return nodeText('ch3_chen_letter');
        return baseSchoolText();
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
              setHubDetail('school', 'teacher');
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
              setHubDetail('school', 'chen_su');
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('asked_about_chen') && !E.hasClue('陈老师与女子争吵')) {
          opts.push({
            text: '💬 问学校最近有没有异常',
            effect: () => {
              E.addClue('陈老师与女子争吵', '出事前三天；沈玉芳同时请假失踪');
              E.addClue('沈玉芳请假失踪', '光华小学数学老师，陈明远出事前一周请病假，此后一直没有回来。');
              E.addContact('沈玉芳');
              setHubDetail('school', 'weird');
            },
            goto: 'ch3_school'
          });
        }
        if (E.getFlag('sister_case') && !E.hasClue('沈玉芳与陈明远')) {
          opts.push({
            text: '💬 问沈玉芳老师的事',
            effect: () => {
              E.addClue('沈玉芳与陈明远', '走得近，经常借书聊天；失踪前心不在焉，匆忙离开未带物品');
              E.setFlag('school_yufang_asked', true);
              setHubDetail('school', 'yufang');
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
              setHubDetail('school', 'office');
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
              setHubDetail('school', 'letter');
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

    E.__locationHubDetailTextPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLocationHubDetailTextPolish);
})();
