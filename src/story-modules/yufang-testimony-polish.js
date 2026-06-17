// ===== 沈玉芳暗室证词强化 =====
// 目标：暗室里向沈玉芳出示证据有价值，但不是救援硬门槛。
// 做法：把三人合影 / 陈明远的信 / 日记残页汇总成一个“快速确认证词”节点。
// 结果：提升医院 witness、truthCompleteness、终局质量分；不影响能不能救沈玉芳，也不替代苏晚亭信物。

(function installYufangTestimonyPolish() {
  function applyYufangTestimonyPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__yufangTestimonyPolishPatched) return;

    function hasThing(name) {
      return E.hasItem(name) || E.hasClue(name);
    }

    function yufangEvidenceProfile() {
      const photo = hasThing('三人合影') || hasThing('沈玉芳认出三人合影');
      const letter = hasThing('陈明远的信') || hasThing('未寄出的信') || hasThing('沈玉芳确认陈明远求助');
      const diary = hasThing('日记残页') || hasThing('苏晚亭日记残页') || hasThing('沈玉芳读到苏晚亭日记');
      const count = (photo ? 1 : 0) + (letter ? 1 : 0) + (diary ? 1 : 0);
      return { photo, letter, diary, count };
    }

    E.yufangEvidenceProfile = yufangEvidenceProfile;

    E.hasYufangTestimonyBoost = function () {
      return this.getFlag('yufang_testimony_confirmed') || this.getFlag('yufang_testimony_quick_confirmed');
    };

    function applyYufangTestimonyBoost() {
      const p = yufangEvidenceProfile();
      E.setFlag('yufang_testimony_quick_confirmed', true);
      E.setFlag('yufang_testimony_confirmed', true);
      if (p.photo) {
        E.setFlag('yufang_confirmed_photo', true);
        E.addClue('沈玉芳确认三人合影', '沈玉芳确认陈明远、苏晚亭与陆念薇在光华小学已有交集。');
      }
      if (p.letter) {
        E.setFlag('yufang_confirmed_chen_letter', true);
        E.addClue('沈玉芳确认陈明远求助', '沈玉芳确认陈明远死前准备揭开走私链，并试图保护苏晚亭。');
      }
      if (p.diary) {
        E.setFlag('yufang_confirmed_su_agency', true);
        E.addClue('沈玉芳确认苏晚亭主动追查', '沈玉芳确认苏晚亭不是被动卷入，而是主动追查光华小学的秘密。');
      }
      E.addClue('沈玉芳暗室证词强化', '你在暗室里用已有证据帮沈玉芳快速确认陈明远、苏晚亭与光华小学之间的关系。');
    }

    function boostChoice() {
      const p = yufangEvidenceProfile();
      if (E.hasYufangTestimonyBoost()) return null;
      if (p.count <= 0) return null;
      return {
        text: '🧾 用手头证据帮沈玉芳快速确认关键关系',
        effect: applyYufangTestimonyBoost,
        goto: 'ch4_yufang_quick_testimony'
      };
    }

    nodes.ch4_yufang_quick_testimony = {
      title: '暗室 · 证词确认',
      weather: 2,
      text: () => {
        const p = yufangEvidenceProfile();
        const parts = [];
        if (p.photo) parts.push('你把三人合影递过去，沈玉芳第一眼就认出了光华小学门口的那天。陈明远、苏晚亭和陆念薇并不是偶然相遇。');
        if (p.letter) parts.push('你拿出陈明远留下的信。沈玉芳看见字迹后，手指抖了一下：那是陈老师准备求助前留下的最后线索。');
        if (p.diary) parts.push('你提到苏晚亭的日记残页。沈玉芳沉默很久，终于承认：苏晚亭不是被动卷进来，她原本就想把光华小学的秘密揭开。');
        if (!parts.length) parts.push('你没有多余证物能在暗室里让沈玉芳立刻确认。她仍然能跟你走，但这份证词要等医院里慢慢补全。');
        return `${parts.join('<br><br>')}<br><br>暗室外还有脚步声。沈玉芳没有因此更安全，但她的证词已经不再只是惊恐中的碎片。<br><br><span class="sys">沈玉芳证词已强化：后续医院 witness 与真相完整度提高，但救援成败仍由撤离和苏晚亭信物决定。</span>`;
      },
      choices: [{ text: '🔙 不能再耽搁，继续处理撤离', goto: 'ch4_dock_who_dual' }]
    };

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__yufangTestimonyChoicePatched) {
      const oldText = nodes.ch4_dock_who_dual.text;
      const oldChoices = nodes.ch4_dock_who_dual.choices;
      nodes.ch4_dock_who_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (E.hasYufangTestimonyBoost()) {
          return `${base}<br><br><span class="sys">沈玉芳已经确认了你手里的关键证据。接下来最要紧的是把人带出暗室。</span>`;
        }
        if (yufangEvidenceProfile().count > 0) {
          return `${base}<br><br><span class="sys">你手里的部分证据可以帮沈玉芳更快说清关系，但暗室外已经有脚步声。是否在这里多问一句，取决于你愿不愿意用一点时间换更稳的证词。</span>`;
        }
        return base;
      };
      nodes.ch4_dock_who_dual.choices = function (state) {
        const out = [];
        const add = boostChoice();
        if (add) out.push(add);
        return out.concat(typeof oldChoices === 'function' ? oldChoices(state) : oldChoices);
      };
      nodes.ch4_dock_who_dual.__yufangTestimonyChoicePatched = true;
    }

    if (typeof E.witnessStabilityScore === 'function' && !E.__yufangWitnessPatched) {
      const oldWitness = E.witnessStabilityScore.bind(E);
      E.witnessStabilityScore = function () {
        let score = oldWitness();
        if (this.hasYufangTestimonyBoost()) score += 1;
        return Math.max(0, Math.min(10, score));
      };
      E.__yufangWitnessPatched = true;
    }

    if (typeof E.truthCompletenessTier === 'function' && !E.__yufangTruthPatched) {
      const oldTruth = E.truthCompletenessTier.bind(E);
      E.truthCompletenessTier = function () {
        const t = oldTruth();
        if (!this.hasYufangTestimonyBoost()) return t;
        const score = Math.min(10, Number(t.score || 0) + 1);
        if (score >= 8) return { key: 'complete', label: '真相完整', score };
        if (score >= 6) return { key: 'solid', label: '真相较完整', score };
        if (score >= 4) return { key: 'partial', label: '真相残缺但可结案', score };
        return { key: 'weak', label: '证据链薄弱', score };
      };
      E.__yufangTruthPatched = true;
    }

    if (typeof E.v07InvestigationQuality === 'function' && !E.__yufangQualityPatched) {
      const oldQuality = E.v07InvestigationQuality.bind(E);
      E.v07InvestigationQuality = function () {
        const q = oldQuality();
        q.score = Number(q.score || 0);
        q.reasons = Array.isArray(q.reasons) ? q.reasons.slice() : [];
        if (this.hasYufangTestimonyBoost()) {
          q.score += 1;
          q.reasons.push('暗室内沈玉芳证词被关键证据快速稳住');
        }
        return q;
      };
      E.__yufangQualityPatched = true;
    }

    E.__yufangTestimonyPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyYufangTestimonyPolish);
})();
