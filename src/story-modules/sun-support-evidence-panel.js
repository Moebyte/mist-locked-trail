// ===== 福生仓前 · 老孙支援举证面板 =====
// 目标：找老孙支援不应只是路线按钮，而应变成“拿硬证据说服他”的小型举证环节。
// 可出示证据控制在 3+1：
// 1) 王巡官纸条/半张烟盒纸：官方内部警告，最强。
// 2) 陈明远的信：说明学校教具箱和灭口动机。
// 3) 福生仓位置/标识/地图线：说明行动地点。
// 4) 203 室恐吓信：辅助说明有人在威胁知情者。
// 不把翡翠镯、陆念、疑似遗书列为老孙支援主证据。

(function installSunSupportEvidencePanel() {
  function applySunSupportEvidencePanel() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__sunSupportEvidencePanelPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasWangNote() {
      return hasThing('半张烟盒纸') || hasThing('王巡官遗留纸条') || E.getFlag('got_wang_note');
    }

    function hasChenLetter() {
      return hasThing('陈明远的信') || hasThing('陈明远残信') || hasThing('未寄出的信');
    }

    function hasFushengLocation() {
      return hasThing('福生仓标识') || hasThing('福生仓位置') || hasThing('福生仓地址') || hasThing('法租界地图') || E.getFlag('shown_map_to_landlord');
    }

    function hasThreatLetter() {
      return hasThing('恐吓信') || hasThing('203 室恐吓信');
    }

    function shownCount() {
      return [
        'sun_presented_wang_note',
        'sun_presented_chen_letter',
        'sun_presented_fusheng_location',
        'sun_presented_threat_letter'
      ].filter(flag => E.getFlag(flag)).length;
    }

    function hasCoreSupport() {
      return E.getFlag('sun_presented_wang_note')
        && (E.getFlag('sun_presented_chen_letter') || E.getFlag('sun_presented_fusheng_location'));
    }

    function hasStrongSupport() {
      return E.getFlag('sun_presented_wang_note')
        && E.getFlag('sun_presented_chen_letter')
        && E.getFlag('sun_presented_fusheng_location');
    }

    function supportSummary() {
      const parts = [];
      if (E.getFlag('sun_presented_wang_note')) parts.push('王巡官纸条证明巡捕房内部有人留下警告');
      if (E.getFlag('sun_presented_chen_letter')) parts.push('陈明远的信把光华小学教具箱和灭口联系起来');
      if (E.getFlag('sun_presented_fusheng_location')) parts.push('福生仓位置已经能落到行动地点');
      if (E.getFlag('sun_presented_threat_letter')) parts.push('203 室恐吓信说明知情者正在被逼闭嘴');
      return parts.length ? parts.join('；') : '桌上还空着。老孙只听你说，还没看见能让他动起来的东西';
    }

    function evidenceChoices() {
      const out = [];
      if (hasWangNote() && !E.getFlag('sun_presented_wang_note')) {
        out.push({ text: '🧾 把王巡官留下的半张烟盒纸推过去', goto: 'ch4_sun_present_wang_note' });
      }
      if (hasChenLetter() && !E.getFlag('sun_presented_chen_letter')) {
        out.push({ text: '📩 把陈明远的信递给老孙', goto: 'ch4_sun_present_chen_letter' });
      }
      if (hasFushengLocation() && !E.getFlag('sun_presented_fusheng_location')) {
        out.push({ text: '📍 在地图上点出福生仓的位置', goto: 'ch4_sun_present_fusheng_location' });
      }
      if (hasThreatLetter() && !E.getFlag('sun_presented_threat_letter')) {
        out.push({ text: '📄 把 203 室那封恐吓信摊开', goto: 'ch4_sun_present_threat' });
      }
      return out;
    }

    function supportChoices() {
      const out = evidenceChoices();
      if (hasCoreSupport()) {
        out.push({
          text: '🚓 压低声音：“派一个信得过的人跟我走。”',
          effect: () => {
            E.setFlag('sun_support_available', true);
            E.setFlag('sun_fast_support', true);
            E.setFlag('sun_support_in_action', true);
          },
          goto: 'ch4_dock_sun_fast_support'
        });
      }
      if (hasStrongSupport()) {
        out.push({
          text: '🚨 对老孙说：“今晚得把福生仓两头封住。”',
          effect: () => {
            E.setFlag('sun_support_available', true);
            E.setFlag('sun_full_support', true);
            E.setFlag('sun_support_in_action', true);
          },
          goto: 'ch4_dock_wait'
        });
      }
      out.push({ text: '🔦 不等了，自己先去福生仓', goto: 'ch4_suzhou_creek' });
      out.push({ text: '🔙 先回去把线索再摊一遍', goto: 'ch3_wrapup' });
      return out;
    }

    nodes.ch4_sun_support = {
      title: '巡捕房 · 老孙',
      weather: 1,
      text: () => {
        const count = shownCount();
        const attitude = count === 0
          ? '老孙靠在窗边抽烟，听你说到“福生仓”三个字时，眉头先皱了一下。'
          : count < 3
            ? '桌上的烟灰已经积了一截。老孙没有打断你，只是把你摆出的东西一件件排开。'
            : '老孙把办公室的门反锁，又把窗帘拉严。你知道，他已经认真起来了。';
        return `${attitude}<br><br><span class="sys">“沈先生，去码头不是查一间空屋子。你要我带人，就得让我知道：第一，地方在哪；第二，为什么现在就得动；第三，这事不能按普通失踪案办。”</span><br><br><b>桌上已经摆出的东西：</b>${supportSummary()}。<br><br>接下来，你把什么推过去？`;
      },
      choices: supportChoices
    };

    nodes.ch4_sun_present_wang_note = {
      title: '举证 · 王巡官纸条',
      weather: 1,
      effect: () => {
        E.setFlag('sun_presented_wang_note', true);
        E.addClue('老孙看到王巡官纸条', '老孙看到“福生仓，三日清；别信公董局来的电话”，确认这不是普通失踪案。');
      },
      text: () => `你把半张烟盒纸推过去。<br><br><span class="sys">“福生仓，三日清；别信公董局来的电话。”</span><br><br>老孙的烟停在半空。<br><br><span class="sys">“王巡官的字。”</span><br><br>他没有再问这东西从哪来，只是把纸压在手掌下。<br><br><span class="sys">“这张纸够重，但还不够让我知道该带人去哪、怎么带。”</span>`,
      choices: supportChoices
    };

    nodes.ch4_sun_present_chen_letter = {
      title: '举证 · 陈明远的信',
      weather: 1,
      effect: () => {
        E.setFlag('sun_presented_chen_letter', true);
        E.addClue('老孙看到陈明远的信', '老孙看到陈明远写下光华小学教具箱和灭口风险，确认陈明远之死与学校后楼异常有关。');
      },
      text: () => `你把陈明远的信递过去。<br><br>老孙读到“教具箱”和“不要相信第一通电话”时，脸色沉了下来。<br><br><span class="sys">“一个教书先生能怕成这样，说明他看见的不是小偷小摸。”</span><br><br>他把信折好。<br><br><span class="sys">“这能说明为什么要查，但还得有行动地点。”</span>`,
      choices: supportChoices
    };

    nodes.ch4_sun_present_fusheng_location = {
      title: '举证 · 福生仓位置',
      weather: 1,
      effect: () => {
        E.setFlag('sun_presented_fusheng_location', true);
        E.addClue('老孙确认福生仓位置', '你向老孙说明福生仓位置和地图标记，他确认可以派人低调靠近码头。');
      },
      text: () => `你把地图、仓库名和苏州河边的路线说明清楚。<br><br>老孙用铅笔在纸上点了点。<br><br><span class="sys">“这里不是巡捕房说进就能进的地方。码头、仓库、货主，背后都有关系。”</span><br><br>他看向你。<br><br><span class="sys">“但至少现在，我知道该往哪里派人。”</span>`,
      choices: supportChoices
    };

    nodes.ch4_sun_present_threat = {
      title: '举证 · 203 室恐吓信',
      weather: 1,
      effect: () => {
        E.setFlag('sun_presented_threat_letter', true);
        E.addClue('老孙看到恐吓信', '老孙看到 203 室恐吓信，确认陈明远、苏晚亭和沈玉芳这些知情者都处在威胁之下。');
      },
      text: () => `你拿出 203 室那封恐吓信。<br><br><span class="sys">“我知道那晚你看到了什么。如果你不说，他们下一个就是你。”</span><br><br>老孙骂了一句脏话。<br><br><span class="sys">“这不是一个人失踪，是有人在清理知情者。”</span><br><br>这封信不能单独决定行动，但它足够说明：再拖下去，会有人被继续灭口。`,
      choices: supportChoices
    };

    E.__sunSupportEvidencePanelPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applySunSupportEvidencePanel);
})();
