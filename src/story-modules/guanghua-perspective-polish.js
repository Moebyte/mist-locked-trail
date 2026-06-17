// ===== 光华小学玩家视角收束 =====
// 目标：学校问询不提前泄露玩家尚未知道的人物关系。

(function installGuanghuaPerspectivePolish() {
  function applyGuanghuaPerspectivePolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__guanghuaPerspectivePolishPatched) return;

    if (nodes.ch3_school_weird) {
      const oldEffect = nodes.ch3_school_weird.effect;
      nodes.ch3_school_weird.text = () => {
        let tail;
        if (E.getFlag('sister_case') || E.hasClue('沈玉芳')) {
          tail = '沈玉芳——沈玉兰的妹妹。她也失踪了。';
        } else if (E.getFlag('talked_to_woman') || E.hasClue('沈玉兰的妹妹')) {
          tail = '沈玉兰说过，她妹妹也失踪了。现在，你第一次从吴校长口中听到这个名字：沈玉芳。';
        } else {
          tail = '沈玉芳。一个此前没有出现在你案卷里的名字。她也失踪了。';
        }

        return `你问吴校长，最近学校有没有什么不寻常的事。

他犹豫了一下。

<span class="sys">"有两件事……我不知道有没有关系。"</span>

<span class="sys">"第一件。陈老师出事前三天，有人看到他在操场上跟一个人在吵架。天已经黑了，看不清是谁，但听声音是个女人。"</span>

<span class="sys">"第二件。沈玉芳老师——她在陈老师出事前一个星期就不来上课了。请了病假，但一直没回来。我派人去她家看过，门锁着，没有人。她是教数学的，一直很负责……突然不来，不太正常。"</span>

${tail}`;
      };
      nodes.ch3_school_weird.effect = function (state) {
        if (typeof oldEffect === 'function') oldEffect(state);
        E.addContact('沈玉芳');
        if (!E.hasClue('沈玉芳请假失踪')) {
          E.addClue('沈玉芳请假失踪', '光华小学数学老师，陈明远出事前一周请病假，此后一直没有回来。');
        }
      };
    }

    E.__guanghuaPerspectivePolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyGuanghuaPerspectivePolish);
})();
