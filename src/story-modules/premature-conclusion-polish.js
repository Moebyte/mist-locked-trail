// ===== 证据不足路线收口 =====
// 目标：玩家过早从光华小学回到线索整理时，不再用“正常破案”口吻误导。
// 1) 王巡官纸条缺失时，线索整理按真实缺口回流：大学 / 薛华立路 / 巡捕房。
// 2) 证据链不足时，结案页明确这是“证据不足的归档 / 冒然指认”，而不是正常收束。
(function installPrematureConclusionPolish() {
  function applyPrematureConclusionPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__prematureConclusionPolishPatched) return;

    function choicesOf(source, state) {
      if (!source) return [];
      return typeof source === 'function' ? source(state) : source;
    }

    function hasUniversityXuehuaLead() {
      return E.hasClue('法租界地图') || E.hasItem('法租界地图') || E.hasClue('铅笔清单') || E.hasItem('铅笔清单');
    }

    function hasLandlordFushengLead() {
      return E.getFlag('shown_map_to_landlord')
        || E.hasClue('福生仓标识')
        || E.hasClue('福生仓位置')
        || E.hasItem('福生仓地址');
    }

    function hasWangNote() {
      return E.getFlag('got_wang_note') || E.hasClue('王巡官遗留纸条') || E.hasItem('半张烟盒纸');
    }

    function hasReachedFushengCore() {
      return E.getFlag('deduced_fusheng')
        || E.getFlag('found_yufang')
        || E.getFlag('rescued_yufang')
        || E.hasClue('推理结论：法租界利益链');
    }

    function isPrematureConclusion() {
      return !hasWangNote() || !hasReachedFushengCore();
    }

    function recoveryChoice() {
      if (!hasUniversityXuehuaLead()) {
        return { text: '📚 回圣约翰大学——再查晚亭失踪前的线索', goto: 'ch2_university' };
      }
      if (!hasLandlordFushengLead()) {
        return { text: '🏛️ 回薛华立路 22 号——查清地图上的仓库标记', goto: 'ch2_frenchtown' };
      }
      if (!hasWangNote()) {
        return { text: '📋 回巡捕房——追问福生仓与王巡官留下的线索', goto: 'ch2_police_alt' };
      }
      return null;
    }

    if (nodes.ch3_wrapup && !nodes.ch3_wrapup.__prematureWrapupPatched) {
      const oldChoices = nodes.ch3_wrapup.choices;
      nodes.ch3_wrapup.choices = function (state) {
        const out = [];
        let insertedRecovery = false;
        for (const choice of choicesOf(oldChoices, state)) {
          const text = choice.text || choice.fogText || '';
          const isOldWangShortcut = choice.goto === 'ch2_police_wang' || text.includes('王巡官的批注');
          const isConclusion = choice.goto === 'ch4_conclusion' || text.includes('回顾所有证据');

          if (isOldWangShortcut) {
            if (!insertedRecovery && !hasWangNote()) {
              const next = recoveryChoice();
              if (next) out.push(next);
              insertedRecovery = true;
            }
            continue;
          }

          if (isConclusion && isPrematureConclusion()) {
            out.push({ ...choice, text: '🔙 回顾现有证据（证据链仍不完整）' });
            continue;
          }

          out.push(choice);
        }
        return out;
      };
      nodes.ch3_wrapup.__prematureWrapupPatched = true;
    }

    if (nodes.ch4_conclusion && !nodes.ch4_conclusion.__prematureConclusionChoicesPatched) {
      const oldText = nodes.ch4_conclusion.text;
      const oldChoices = nodes.ch4_conclusion.choices;

      nodes.ch4_conclusion.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (!isPrematureConclusion()) return base;
        let missing = '';
        if (!hasUniversityXuehuaLead()) missing = '你还没有回到圣约翰大学补齐苏晚亭失踪前的行动线。';
        else if (!hasLandlordFushengLead()) missing = '你还没有查清薛华立路地图标记背后的仓库名。';
        else if (!hasWangNote()) missing = '你还没有拿到王巡官留下的半张烟盒纸，福生仓线索仍然接不上。';
        else missing = '你还没有推明白福生仓与光华小学、公董局之间的关系。';
        return `${base}<br><br><div class="notice"><b>⚠️ 证据链不足</b><br>${missing}<br>现在结案，只能得到一个不完整甚至错误的收束。</div>`;
      };

      nodes.ch4_conclusion.choices = function (state) {
        const choices = choicesOf(oldChoices, state);
        if (!isPrematureConclusion()) return choices;
        const out = [];
        const recovery = recoveryChoice();
        if (recovery) out.push({ text: `🔎 先不结案，${recovery.text.replace(/^[^\s]+\s*/, '')}`, goto: recovery.goto });
        out.push({ text: '📁 证据不足，暂时归档此案', goto: 'end_archive' });
        out.push({ text: '⚠️ 证据不足，仍要冒然指认嫌疑人', goto: 'ch4_accuse' });
        return out;
      };
      nodes.ch4_conclusion.__prematureConclusionChoicesPatched = true;
    }

    E.__prematureConclusionPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPrematureConclusionPolish);
})();
