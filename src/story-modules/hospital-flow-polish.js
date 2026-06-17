// ===== 医院终章流程收束 =====
// 目标：福生仓救人后不能直接跳回事务所。
// 正确节奏：码头逃离 → 教会医院冲突 → 陆念薇/证词选择 → 傅启元后巷交易 → 事务所结案。
// 医院第二选项“封码头”根据码头撤离方式动态变化，避免和前一段分支矛盾。

(function installHospitalFlowPolish() {
  function applyHospitalFlowPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__hospitalFlowPolishPatched) return;

    function fastSupportOnly() {
      return E.getFlag('sun_fast_support')
        && !E.getFlag('sun_full_support')
        && !E.getFlag('sun_wait_support')
        && !(E.getFlag('sun_support_in_action') && !E.getFlag('sun_fast_support'));
    }

    function pressureDockChoice() {
      if (E.getFlag('dock_sun_pressed_fu')) {
        return {
          text: '🚓 让老孙守住码头封锁线，别让傅启元擦痕迹',
          effect: () => {
            E.setFlag('v07_choice_hold_blockade', true);
            E.setFlag('v07_pressed_fu_network', true);
            E.addClue('老孙守住码头封锁线', '老孙已经在码头正面压过傅启元，此时继续守住封锁线，能保住更多现场证据。');
          },
          goto: 'ch4_hospital_hold_blockade'
        };
      }

      if (E.getFlag('dock_escaped_during_sun_standoff')) {
        return {
          text: '⚠️ 让老孙补封码头，但公董局已经插手',
          effect: () => {
            E.setFlag('v07_choice_blockade_after_interference', true);
            E.addClue('补封码头受阻', '你们在码头趁乱撤离后，公董局的人已经插手，老孙再去封码头会遇到正式阻力。');
            E.addHeat(1, '公董局已经介入，补封码头会让对方更快统一口径。');
          },
          goto: 'ch4_hospital_blockade_blocked'
        };
      }

      if (E.getFlag('sun_fast_cover_escape') || fastSupportOnly()) {
        return {
          text: '📞 让老孙连夜补人手去封码头',
          effect: () => {
            E.setFlag('v07_choice_late_blockade', true);
            E.addClue('迟一步封码头', '你们只有一个便衣护送撤离，老孙必须临时补人手，码头封锁会迟一步。');
            E.addHeat(1, '补人手需要时间，傅启元可能已经开始清理现场。');
          },
          goto: 'ch4_hospital_late_blockade'
        };
      }

      return {
        text: '🚓 让老孙立刻封码头，趁傅启元还没擦干净',
        effect: () => E.setFlag('v07_choice_pressure_fu', true),
        goto: 'ch4_hospital_pressure_fu'
      };
    }

    if (nodes.ch4_dock_escape_finish && !nodes.ch4_dock_escape_finish.__hospitalOnlyPatched) {
      const oldText = nodes.ch4_dock_escape_finish.text;
      nodes.ch4_dock_escape_finish.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        if (String(base).includes('车子没有直接回事务所')) return base;
        return `${base}<br><br>车子没有直接回事务所，而是先拐进一家教会医院的后门。老孙的人守在巷口，周怀安站在走廊尽头，脸色白得像墙灰。<br><br>你知道，真正难的不是把人从仓库里带出来，而是决定接下来保护谁、追谁、牺牲什么。`;
      };
      nodes.ch4_dock_escape_finish.choices = [
        { text: '🏥 去医院走廊，面对所有人的争执', goto: 'ch4_hospital_conflict' }
      ];
      nodes.ch4_dock_escape_finish.__hospitalOnlyPatched = true;
    }

    if (nodes.ch4_hospital_conflict && !nodes.ch4_hospital_conflict.__dynamicDockPressureChoicePatched) {
      nodes.ch4_hospital_conflict.choices = function () {
        return [
          { text: '🛏️ 先保住活人证词，任何审问等天亮以后', effect: () => E.setFlag('v07_choice_protect_witnesses', true), goto: 'ch4_hospital_protect_witnesses' },
          pressureDockChoice(),
          { text: '🕯️ 逼陆念薇现身，让三条线当面对质', effect: () => E.setFlag('v07_choice_draw_lu', true), goto: 'ch4_lu_confrontation' }
        ];
      };
      nodes.ch4_hospital_conflict.__dynamicDockPressureChoicePatched = true;
    }

    nodes.ch4_hospital_late_blockade = {
      title: '教会医院 · 迟一步封码头',
      weather: 5,
      text: () => `老孙听完你的判断，脸色沉下去。<br><br><span class="sys">“我刚才只派了一个便衣给你。现在要封码头，得重新叫人。”</span><br><br>他转身去打电话。电话线那头传来一阵杂音，你隔着走廊都能听见他压着火气说话。<br><br>二十分钟后，老孙回来，烟夹在指间没点。<br><br><span class="sys">“人能叫，但码头那边恐怕已经动了。傅启元不会等我们。”</span><br><br>这不是不能补救，只是你们已经错过了最干净的封锁窗口。现在最需要的，是有人能补上傅启元下一步的安排。`,
      choices: [
        { text: '🕯️ 先逼陆念薇现身，补上傅启元下一步', goto: 'ch4_lu_confrontation' }
      ]
    };

    nodes.ch4_hospital_hold_blockade = {
      title: '教会医院 · 守住封锁线',
      weather: 5,
      text: () => `老孙没有立刻反驳。<br><br>码头那边他已经压过一次傅启元，现在要做的不是重新出击，而是守住那条来之不易的封锁线。<br><br><span class="sys">“我让人留在福生仓外面，不准任何人搬箱子，也不准公董局的人单独进去。”</span><br><br>这会让傅启元很难受，也会让公董局更快出面。你们需要在对方正式压下来之前，把陆念薇这块缺口补上。`,
      choices: [
        { text: '🕯️ 趁封锁线还在，逼陆念薇现身', goto: 'ch4_lu_confrontation' }
      ]
    };

    nodes.ch4_hospital_blockade_blocked = {
      title: '教会医院 · 封锁受阻',
      weather: 5,
      text: () => `老孙听你说完码头上的混乱，沉默了很久。<br><br><span class="sys">“公董局的人已经露面了？”</span><br><br>他把帽子往桌上一扣。<br><br><span class="sys">“那我现在去封码头，就不是封傅启元，是和公董局抢手续。能抢，但不会好看。”</span><br><br>你明白他的意思：人救出来了，但码头已经不是单纯的现场。接下来每一句证词、每一张纸，都可能被对方说成越权、伪证或者私闯仓库。<br><br>要重新咬住傅启元，需要陆念薇把下一步写出来。`,
      choices: [
        { text: '🕯️ 找陆念薇，让她补上傅启元下一步安排', goto: 'ch4_lu_confrontation' }
      ]
    };

    if (nodes.ch4_hospital_protect_witnesses && !nodes.ch4_hospital_protect_witnesses.__forceLuPatched) {
      nodes.ch4_hospital_protect_witnesses.choices = [
        { text: '🕯️ 根据沈玉芳的话，逼陆念薇现身', goto: 'ch4_lu_confrontation' }
      ];
      nodes.ch4_hospital_protect_witnesses.__forceLuPatched = true;
    }

    if (nodes.ch4_lu_confrontation && !nodes.ch4_lu_confrontation.__forceFuPatched) {
      nodes.ch4_lu_confrontation.choices = [
        {
          text: '🚓 把陆念薇交给老孙，换正式口供',
          effect: () => {
            E.setFlag('v07_lu_to_sun', true);
            E.addClue('陆念薇正式口供', '陆念薇被交给老孙后，愿意写下傅启元与福生仓转运安排。');
          },
          goto: 'ch4_fu_private_offer'
        },
        {
          text: '🧾 让她写下傅启元的下一步安排',
          effect: () => {
            E.setFlag('v07_lu_statement', true);
            E.addClue('陆念薇补充口供', '陆念薇写下傅启元南码头转运安排。');
          },
          goto: 'ch4_fu_private_offer'
        },
        {
          text: '🌫️ 放她走，让她继续做内线',
          effect: () => {
            E.setFlag('v07_lu_as_informant', true);
            E.addHeat(1, '你放走陆念薇，留下了内线，也留下了风险。');
          },
          goto: 'ch4_fu_private_offer'
        }
      ];
      nodes.ch4_lu_confrontation.__forceFuPatched = true;
    }

    if (nodes.ch4_fu_private_offer && !nodes.ch4_fu_private_offer.__hospitalClosurePatched) {
      const oldChoices = nodes.ch4_fu_private_offer.choices;
      nodes.ch4_fu_private_offer.choices = function (state) {
        const base = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (!Array.isArray(base)) return base;
        return base.map(choice => {
          if (choice.goto === 'ch4_conclusion') {
            return { ...choice, text: `${choice.text}，再回事务所整理结案材料` };
          }
          return choice;
        });
      };
      nodes.ch4_fu_private_offer.__hospitalClosurePatched = true;
    }

    E.__hospitalFlowPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyHospitalFlowPolish);
})();
