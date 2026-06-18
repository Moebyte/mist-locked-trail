// ===== 暗室 · 苏晚亭 / 沈玉芳举证面板 =====
// 目标：暗室不再依赖玩家猜“该用出示系统拿什么”。
// 面板顺序：
// 1) 有苏母银发夹：先给苏晚亭看，建立信任，这是救出苏晚亭的硬门槛。
// 2) 有合影/陈明远信/日记残页：快速帮沈玉芳确认关键关系，这是证词质量加成。
// 3) 离开暗室：如果没建立苏晚亭信任，后续逃离会降档为只救出沈玉芳。

(function installDarkroomEvidencePanel() {
  function applyDarkroomEvidencePanel() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__darkroomEvidencePanelPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function hasSuHomeTrustToken() {
      return typeof E.hasSuHomeTrustToken === 'function'
        ? E.hasSuHomeTrustToken()
        : E.getFlag('shown_photo_to_mother') || hasThing('苏母认出照片') || hasThing('苏晚亭的银发夹');
    }

    function hasSuHomeTrustProof() {
      return typeof E.hasSuHomeTrustProof === 'function'
        ? E.hasSuHomeTrustProof()
        : E.getFlag('presented_su_keepsake') || hasThing('苏晚亭认出银发夹');
    }

    function yufangEvidenceProfile() {
      if (typeof E.yufangEvidenceProfile === 'function') return E.yufangEvidenceProfile();
      const photo = hasThing('三人合影') || hasThing('沈玉芳认出三人合影') || hasThing('沈玉芳确认三人合影');
      const letter = hasThing('陈明远的信') || hasThing('未寄出的信') || hasThing('沈玉芳确认陈明远求助');
      const diary = hasThing('日记残页') || hasThing('苏晚亭日记残页') || hasThing('沈玉芳读到苏晚亭日记') || hasThing('沈玉芳确认苏晚亭主动追查');
      const count = (photo ? 1 : 0) + (letter ? 1 : 0) + (diary ? 1 : 0);
      return { photo, letter, diary, count };
    }

    function hasYufangBoost() {
      return typeof E.hasYufangTestimonyBoost === 'function'
        ? E.hasYufangTestimonyBoost()
        : E.getFlag('yufang_testimony_confirmed') || E.getFlag('yufang_testimony_quick_confirmed');
    }

    function applySuKeepsakeProof() {
      E.setFlag('presented_su_keepsake', true);
      E.addClue('苏晚亭认出银发夹', '苏晚亭认出母亲托你带来的银发夹，终于确认你确实去过苏家。');
    }

    function applyYufangBoost() {
      const p = yufangEvidenceProfile();
      E.setFlag('yufang_testimony_quick_confirmed', true);
      E.setFlag('yufang_testimony_confirmed', true);
      if (p.photo) {
        E.setFlag('presented_photo_to_yufang_dual', true);
        E.setFlag('yufang_confirmed_photo', true);
        E.addClue('沈玉芳确认三人合影', '沈玉芳确认陈明远、苏晚亭与陆念薇在光华小学已有交集。');
      }
      if (p.letter) {
        E.setFlag('presented_letter_to_yufang_dual', true);
        E.setFlag('yufang_confirmed_chen_letter', true);
        E.addClue('沈玉芳确认陈明远求助', '沈玉芳确认陈明远死前准备揭开走私链，并试图保护苏晚亭。');
      }
      if (p.diary) {
        E.setFlag('presented_diary_to_yufang_dual', true);
        E.setFlag('yufang_confirmed_su_agency', true);
        E.addClue('沈玉芳确认苏晚亭主动追查', '沈玉芳确认苏晚亭不是被动卷入，而是主动追查光华小学的秘密。');
      }
      E.addClue('沈玉芳暗室证词强化', '你在暗室里用已有证据帮沈玉芳快速确认陈明远、苏晚亭与光华小学之间的关系。');
    }

    function evidenceLine() {
      const parts = [];
      if (hasSuHomeTrustProof()) parts.push('苏晚亭已经认出银发夹，愿意把你当作从家里来的人。');
      else if (hasSuHomeTrustToken()) parts.push('你手里有苏母托付的银发夹，还没有给苏晚亭看。');
      else parts.push('你没有任何能证明自己去过苏家的东西，苏晚亭仍然不敢完全相信你。');

      const p = yufangEvidenceProfile();
      if (hasYufangBoost()) parts.push('沈玉芳已经确认了关键关系，证词不再只是惊恐中的碎片。');
      else if (p.count > 0) {
        const names = [];
        if (p.photo) names.push('三人合影');
        if (p.letter) names.push('陈明远的信');
        if (p.diary) names.push('日记残页');
        parts.push(`你还可以用${names.join('、')}帮沈玉芳快速确认关系。`);
      } else {
        parts.push('你手里暂时没有适合在暗室里让沈玉芳快速确认的证物。');
      }
      return parts.join('<br>');
    }

    function darkroomChoices(oldChoices, state) {
      const out = [];
      if (hasSuHomeTrustToken() && !hasSuHomeTrustProof()) {
        out.push({
          text: '🪮 把银发夹递给苏晚亭：“你母亲让我带来的。”',
          effect: applySuKeepsakeProof,
          goto: 'ch4_su_present_keepsake'
        });
      }

      const p = yufangEvidenceProfile();
      if (p.count > 0 && !hasYufangBoost()) {
        out.push({
          text: '🧾 把合影、信和日记残页摊开：“这些人，你认得吗？”',
          effect: applyYufangBoost,
          goto: 'ch4_yufang_quick_testimony'
        });
      }

      if (!hasSuHomeTrustProof() && !hasSuHomeTrustToken()) {
        out.push({ text: '⚠️ 外面有脚步声，顾不上解释，先把沈玉芳带出去', goto: 'ch4_dock_escape' });
      } else if (!hasSuHomeTrustProof()) {
        out.push({ text: '⚠️ 外面有脚步声，顾不上解释，先带她们冲出去', goto: 'ch4_dock_escape' });
      } else {
        out.push({ text: '🚕 带苏晚亭和沈玉芳离开暗室', goto: 'ch4_dock_escape' });
      }

      // 保留旧 choices 中不重复的特殊撤离/返回选项，避免其他后续补丁失效。
      const old = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
      if (Array.isArray(old)) {
        for (const choice of old) {
          const text = choice.text || choice.fogText || '';
          if (!choice?.goto) continue;
          if (choice.goto === 'ch4_dock_escape') continue;
          if (text.includes('快速确认') || text.includes('出示') || text.includes('银发夹')) continue;
          if (!out.some(x => x.goto === choice.goto && x.text === text)) out.push(choice);
        }
      }
      return out;
    }

    if (nodes.ch4_su_present_keepsake && !nodes.ch4_su_present_keepsake.__darkroomPanelPatched) {
      const oldEffect = nodes.ch4_su_present_keepsake.effect;
      nodes.ch4_su_present_keepsake.effect = function (state) {
        applySuKeepsakeProof();
        if (typeof oldEffect === 'function') oldEffect(state);
      };
      nodes.ch4_su_present_keepsake.choices = function () {
        const out = [];
        const p = yufangEvidenceProfile();
        if (p.count > 0 && !hasYufangBoost()) {
          out.push({
            text: '🧾 把合影、信和日记残页摊开：“这些人，你认得吗？”',
            effect: applyYufangBoost,
            goto: 'ch4_yufang_quick_testimony'
          });
        }
        out.push({ text: '🚕 带她们离开暗室', goto: 'ch4_dock_escape' });
        return out;
      };
      nodes.ch4_su_present_keepsake.__darkroomPanelPatched = true;
    }

    if (nodes.ch4_yufang_quick_testimony && !nodes.ch4_yufang_quick_testimony.__darkroomPanelPatched) {
      const oldText = nodes.ch4_yufang_quick_testimony.text;
      const oldEffect = nodes.ch4_yufang_quick_testimony.effect;
      nodes.ch4_yufang_quick_testimony.effect = function (state) {
        applyYufangBoost();
        if (typeof oldEffect === 'function') oldEffect(state);
      };
      nodes.ch4_yufang_quick_testimony.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br><span class="sys">外面的脚步声近了。苏晚亭若还不肯信你，那枚银发夹也许是最后一句解释。</span>`;
      };
      nodes.ch4_yufang_quick_testimony.choices = function () {
        const out = [];
        if (hasSuHomeTrustToken() && !hasSuHomeTrustProof()) {
          out.push({
            text: '🪮 把银发夹递给苏晚亭：“你母亲让我带来的。”',
            effect: applySuKeepsakeProof,
            goto: 'ch4_su_present_keepsake'
          });
        }
        if (hasSuHomeTrustProof()) out.push({ text: '🚕 带苏晚亭和沈玉芳离开暗室', goto: 'ch4_dock_escape' });
        else out.push({ text: '⚠️ 外面有脚步声，顾不上解释，先把沈玉芳带出去', goto: 'ch4_dock_escape' });
        out.push({ text: '🔙 回到暗室内再判断一次', goto: 'ch4_dock_who_dual' });
        return out;
      };
      nodes.ch4_yufang_quick_testimony.__darkroomPanelPatched = true;
    }

    if (nodes.ch4_dock_who_dual && !nodes.ch4_dock_who_dual.__darkroomPanelPatched) {
      const oldText = nodes.ch4_dock_who_dual.text;
      const oldChoices = nodes.ch4_dock_who_dual.choices;
      nodes.ch4_dock_who_dual.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        return `${base}<br><br><div class="notice"><b>暗室内可用证据</b><br>${evidenceLine()}</div>`;
      };
      nodes.ch4_dock_who_dual.choices = function (state) {
        return darkroomChoices(oldChoices, state);
      };
      // 本节点已经把可用物件写成剧情选项，关闭通用“出示手中物件”入口，避免重复展示。
      nodes.ch4_dock_who_dual.onPresent = null;
      nodes.ch4_dock_who_dual.presentFilter = () => false;
      nodes.ch4_dock_who_dual.__darkroomPanelPatched = true;
    }

    E.__darkroomEvidencePanelPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyDarkroomEvidencePanel);
})();
