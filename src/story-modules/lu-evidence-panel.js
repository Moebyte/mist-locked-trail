// ===== 医院 · 陆念薇举证面板 =====
// 目标：陆念薇是否能正式留名，不再只是隐藏分数；
// 玩家能看见自己用哪些证据压住她：货运单、清场指令、证人、老孙支援、医生记录。
// 处理方式：不废除 lu-procedure-truth-polish 的程序选择，而是在其前面追加可见举证层。

(function installLuEvidencePanel() {
  function applyLuEvidencePanel() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__luEvidencePanelPatched) return;

    function hasThing(name) {
      return E.hasItem?.(name) || E.hasClue?.(name);
    }

    function witnessProfile() {
      return typeof E.hospitalWitnessProfile === 'function'
        ? E.hospitalWitnessProfile()
        : {
            yufang: E.getFlag('rescued_yufang') || E.getFlag('found_yufang'),
            su: E.getFlag('rescued_su') || E.getFlag('found_su_at_dock'),
            count: (E.getFlag('rescued_yufang') || E.getFlag('found_yufang') ? 1 : 0) + (E.getFlag('rescued_su') || E.getFlag('found_su_at_dock') ? 1 : 0),
            label: '证人状态未知'
          };
    }

    function hasWaybill() {
      return hasThing('光华货运单') || hasThing('教具箱走私') || hasThing('管制药品走私') || E.getFlag('fu_waybill_exposed');
    }

    function hasClearance() {
      return hasThing('清场指令') || hasThing('公董局公文纸') || E.getFlag('fu_clearance_exposed');
    }

    function hasSunProcedureBackstop() {
      return E.getFlag('sun_full_support')
        || E.getFlag('sun_wait_support')
        || E.getFlag('dock_full_support_entry')
        || E.getFlag('dock_sun_pressed_fu')
        || E.getFlag('v07_choice_hold_blockade')
        || E.getFlag('sun_support_in_action');
    }

    function hasDoctorRecord() {
      return E.getFlag('hospital_doctor_record') || hasThing('医院医生记录') || hasThing('医生记录');
    }

    function evidenceCount() {
      return [
        'lu_presented_waybill',
        'lu_presented_clearance',
        'lu_presented_witnesses',
        'lu_presented_sun_backstop',
        'lu_presented_doctor_record'
      ].filter(flag => E.getFlag(flag)).length;
    }

    function evidenceSummary() {
      const parts = [];
      if (E.getFlag('lu_presented_waybill')) parts.push('货运单证明光华小学教具箱和福生仓货路能接上');
      if (E.getFlag('lu_presented_clearance')) parts.push('清场指令把傅启元手里的蓝封公文和公董局压力接上');
      if (E.getFlag('lu_presented_witnesses')) parts.push('沈玉芳/苏晚亭的证词让她不再是唯一会说话的人');
      if (E.getFlag('lu_presented_sun_backstop')) parts.push('老孙已经能接住程序，不是你一个人在病房里逼供');
      if (E.getFlag('lu_presented_doctor_record')) parts.push('医生记录能证明证人状态，不容易被反咬成临时编造');
      return parts.length ? parts.join('；') : '你还没有把能压住陆念薇的东西摆到她面前';
    }

    function evidenceChoices() {
      const out = [];
      if (hasWaybill() && !E.getFlag('lu_presented_waybill')) {
        out.push({
          text: '📦 拿出光华货运单——学校只是干净招牌',
          effect: () => {
            E.setFlag('lu_presented_waybill', true);
            E.setFlag('fu_waybill_exposed', true);
            E.addClue('陆念薇看到货运单', '陆念薇看到光华小学教学器材名义的货运单，明白学校与福生仓货路已经被你接上。');
          },
          goto: 'ch4_lu_present_waybill'
        });
      }
      if (hasClearance() && !E.getFlag('lu_presented_clearance')) {
        out.push({
          text: '📄 拿出清场指令——傅启元已经准备灭口清场',
          effect: () => {
            E.setFlag('lu_presented_clearance', true);
            E.setFlag('fu_clearance_exposed', true);
            E.addClue('陆念薇看到清场指令', '陆念薇看到公董局蓝封清场指令，知道傅启元准备把知情人和痕迹一起清走。');
          },
          goto: 'ch4_lu_present_clearance'
        });
      }
      const wp = witnessProfile();
      if ((wp.yufang || wp.su || E.hasYufangTestimonyBoost?.()) && !E.getFlag('lu_presented_witnesses')) {
        out.push({
          text: '👩‍🏫 提到沈玉芳和苏晚亭——她不是唯一会说话的人',
          effect: () => {
            E.setFlag('lu_presented_witnesses', true);
            E.addClue('陆念薇知道证人已活着脱身', '陆念薇知道沈玉芳或苏晚亭已经能作证，继续沉默只会让傅启元把责任推到她身上。');
          },
          goto: 'ch4_lu_present_witnesses'
        });
      }
      if (hasSunProcedureBackstop() && !E.getFlag('lu_presented_sun_backstop')) {
        out.push({
          text: '🚓 告诉她老孙已经接手——口供有人能接住',
          effect: () => {
            E.setFlag('lu_presented_sun_backstop', true);
            E.addClue('陆念薇知道老孙接手', '陆念薇知道老孙已经介入，明白这份口供不是落在沈先生一个人的口袋里。');
          },
          goto: 'ch4_lu_present_sun_backstop'
        });
      }
      if (hasDoctorRecord() && !E.getFlag('lu_presented_doctor_record')) {
        out.push({
          text: '🩺 提到医生记录——证人状态不是临时编造',
          effect: () => {
            E.setFlag('lu_presented_doctor_record', true);
            E.setFlag('hospital_doctor_record', true);
            E.addClue('陆念薇看到医生记录', '医生记录让陆念薇明白，证人的状态和伤情可以进入医院程序，不容易被公董局反压成伪证。');
          },
          goto: 'ch4_lu_present_doctor_record'
        });
      }
      return out;
    }

    function afterEvidenceChoices() {
      return [{ text: '🔙 继续和陆念薇谈条件', goto: 'ch4_lu_confrontation' }];
    }

    nodes.ch4_lu_present_waybill = {
      title: '举证 · 光华货运单',
      weather: 1,
      text: () => `你把光华货运单摊在病房小桌上。<br><br>发货名义是<span class="sys">“光华小学教学器材补充采购”</span>，收货地点却落到福生仓。<br><br>陆念薇只看了一眼，手指便从桌沿退开。<br><br><span class="sys">“你已经知道货是怎么从学校名义出去的。”</span><br><br>你没有回答。你知道她听懂了：学校不再只是一个干净招牌。`,
      choices: afterEvidenceChoices
    };

    nodes.ch4_lu_present_clearance = {
      title: '举证 · 清场指令',
      weather: 1,
      text: () => `你把蓝封清场指令压在货运单旁边。<br><br><span class="sys">“三日内清走，别留痕迹。”</span><br><br>陆念薇的脸色终于变了。<br><br><span class="sys">“他连我也不会留。”</span><br><br>她说这句话时声音很轻。你知道，傅启元准备清掉的不只是仓库，还有所有能把仓库说清楚的人。`,
      choices: afterEvidenceChoices
    };

    nodes.ch4_lu_present_witnesses = {
      title: '举证 · 证人还活着',
      weather: 1,
      text: () => {
        const wp = witnessProfile();
        if (wp.yufang && wp.su) {
          return `你告诉她，沈玉芳和苏晚亭都还活着。<br><br>陆念薇猛地抬头。<br><br><span class="sys">“她们两个都出来了？”</span><br><br>你点头。<br><br>这句话比任何威胁都更有效。她终于明白，今晚不再只有她一个人能说出傅启元做过什么。`;
        }
        if (wp.yufang) {
          return `你告诉她，沈玉芳已经脱身。<br><br>陆念薇沉默很久。<br><br><span class="sys">“沈老师知道得不全。”</span><br><br>你说：<span class="sys">“所以才需要你把剩下的补上。”</span>`;
        }
        return `你告诉她，苏晚亭还活着。<br><br>陆念薇的眼神晃了一下，像是某个她以为已经被清掉的名字，重新站到了病房门口。<br><br><span class="sys">“她不该还在这里。”</span><br><br>你说：<span class="sys">“所以你最好在傅启元之前开口。”</span>`;
      },
      choices: afterEvidenceChoices
    };

    nodes.ch4_lu_present_sun_backstop = {
      title: '举证 · 程序承接',
      weather: 1,
      text: () => `你告诉陆念薇，老孙已经接手，码头那边至少有人能把口供接进巡捕房程序。<br><br>她看着你，第一次没有立刻反驳。<br><br><span class="sys">“如果我写下来，公董局的人会说这是你逼的。”</span><br><br><span class="sys">“所以不能只写在我手里。”</span>你说，<span class="sys">“要有人接，要有人封，要有人能证明今晚不是我一个人在编故事。”</span>`,
      choices: afterEvidenceChoices
    };

    nodes.ch4_lu_present_doctor_record = {
      title: '举证 · 医生记录',
      weather: 1,
      text: () => `你把医生记录放到桌上。<br><br>上面写着证人的伤情、失温和惊厥反应。那些字不像口供，却比口供更难被轻易抹掉。<br><br>陆念薇看完后，终于低声说：<br><br><span class="sys">“如果她们的状态已经进了医院记录，傅启元就不能再说她们根本没有被关过。”</span>`,
      choices: afterEvidenceChoices
    };

    if (nodes.ch4_lu_confrontation && !nodes.ch4_lu_confrontation.__luEvidencePanelPatched) {
      const oldText = nodes.ch4_lu_confrontation.text;
      const oldChoices = nodes.ch4_lu_confrontation.choices;
      nodes.ch4_lu_confrontation.text = function (state) {
        const base = typeof oldText === 'function' ? oldText(state) : oldText;
        const tier = typeof E.luOutputTier === 'function' ? E.luOutputTier() : { label: '未知', credibility: 0, risk: 0 };
        return `${base}<br><br><div class="notice"><b>陆念薇当前压力</b><br>${evidenceSummary()}。<br><br>可信度：${tier.credibility ?? '—'}；程序风险：${tier.risk ?? '—'}；状态：${tier.label || '未知'}。</div>`;
      };
      nodes.ch4_lu_confrontation.choices = function (state) {
        const out = evidenceChoices();
        const procedure = typeof oldChoices === 'function' ? oldChoices(state) : oldChoices;
        if (Array.isArray(procedure)) {
          for (const choice of procedure) out.push(choice);
        }
        return out;
      };
      nodes.ch4_lu_confrontation.__luEvidencePanelPatched = true;
    }

    E.__luEvidencePanelPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyLuEvidencePanel);
})();
