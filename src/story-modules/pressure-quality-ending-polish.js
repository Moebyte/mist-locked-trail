// ===== 压力 / 案件质量 / 隐藏结局层级收束 =====
// 目标：压力决定是否赶得上救人；案件质量决定能否说清真相；隐藏结局分为“救出沈玉芳”和“救出苏晚亭”两档。

(function installPressureQualityEndingPolish() {
  function applyPressureQualityEndingPolish() {
    if (typeof E === 'undefined' || typeof nodes === 'undefined') return;
    if (E.__pressureQualityEndingPolishPatched) return;

    const oldQuality = typeof E.v07InvestigationQuality === 'function' ? E.v07InvestigationQuality.bind(E) : null;

    function heat() {
      return E.state?.pressure?.heat || 0;
    }

    function pressurePenaltyMinutes() {
      // 每 1 点热度折算 45 分钟风险窗口。高热度不一定立刻超时，但会让码头更快清场。
      return Math.max(0, heat()) * 45;
    }

    E.effectiveMinutesUntilDeadline = function () {
      return this.minutesUntilDeadline() - pressurePenaltyMinutes();
    };

    E.deadlinePhase = function () {
      const left = typeof this.effectiveMinutesUntilDeadline === 'function'
        ? this.effectiveMinutesUntilDeadline()
        : this.minutesUntilDeadline();
      if (left < 0) return 'expired';
      if (left < 180) return 'critical';
      if (left < 600) return 'tight';
      return 'safe';
    };

    E.deadlinePhaseLabel = function () {
      const label = ({ safe: '时间充裕', tight: '时间吃紧', critical: '只够救人', expired: '迟到一步' })[this.deadlinePhase()] || '时间不明';
      const h = heat();
      const risk = h >= 5 ? '风声很紧' : h >= 3 ? '已有惊动' : h >= 1 ? '略有风险' : '尚未惊动';
      return `${label} · ${risk}`;
    };

    E.pressureLabel = function () {
      const rawLeft = this.minutesUntilDeadline();
      const effectiveLeft = typeof this.effectiveMinutesUntilDeadline === 'function' ? this.effectiveMinutesUntilDeadline() : rawLeft;
      const h = heat();
      const heatLabel = h >= 5 ? '高危' : h >= 3 ? '紧张' : h >= 1 ? '可控' : '低';
      if (effectiveLeft < 0) return `已错过 · 热度${h}(${heatLabel})`;
      const hours = Math.floor(effectiveLeft / 60);
      const minutes = effectiveLeft % 60;
      return `${hours}时${String(minutes).padStart(2, '0')}分 · 热度${h}(${heatLabel})`;
    };

    E.addHeat = function (n, reason) {
      if (!this.state.pressure) this.state.pressure = { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };
      this.state.pressure.heat = Math.max(0, Math.min(8, (this.state.pressure.heat || 0) + (n || 0)));
      if (this.state.pressure.heat >= 5) this.setFlag('high_pressure', true);
      if (reason) this.toast(reason);
      return this.state.pressure.heat;
    };

    E.routeDockByPressure = function () {
      const phase = this.deadlinePhase();
      if (phase === 'expired') {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (phase === 'critical') return 'ch4_dock_rescue_only';
      if (phase === 'tight') return 'ch4_dock_limited_search';
      return 'ch4_dock_full_search';
    };

    E.routeDockDeepByPressure = function () {
      const phase = this.deadlinePhase();
      if (phase === 'expired') {
        this.setFlag('missed_deadline', true);
        return 'ch4_dock_cleared';
      }
      if (phase === 'critical') return 'ch4_dock_deep_rescue_only';
      if (phase === 'tight') return 'ch4_dock_deep_trace';
      return 'ch4_dock_deep_dual';
    };

    E.v07InvestigationQuality = function () {
      const q = oldQuality ? oldQuality() : { score: 0, reasons: [] };
      q.score = Number(q.score || 0);
      q.reasons = Array.isArray(q.reasons) ? q.reasons.slice() : [];

      if (this.getFlag('deduced_fusheng') && !q.reasons.includes('推明福生仓与公董局关联')) {
        q.score += 2;
        q.reasons.push('推明福生仓与公董局关联');
      }
      if (this.getFlag('fu_waybill_exposed') && !q.reasons.includes('福生仓货运单已曝光')) {
        q.score += 1;
        q.reasons.push('福生仓货运单已曝光');
      }
      if (this.getFlag('fu_clearance_exposed') && !q.reasons.includes('清场指令已曝光')) {
        q.score += 1;
        q.reasons.push('清场指令已曝光');
      }
      if (this.getFlag('v07_lu_confronted') && !q.reasons.includes('陆念薇已对峙')) {
        q.score += 1;
        q.reasons.push('陆念薇已对峙');
      }
      if (this.getFlag('v07_rejected_fu_deal') && !q.reasons.includes('拒绝傅启元交易')) {
        q.score += 1;
        q.reasons.push('拒绝傅启元交易');
      }
      if (this.getFlag('v07_witnesses_protected') && !q.reasons.includes('证人已保护')) {
        q.score += 1;
        q.reasons.push('证人已保护');
      }
      if (this.getFlag('school_wu_three_proofs') && !q.reasons.includes('光华小学三证物闭环完成')) {
        q.score += 1;
        q.reasons.push('光华小学三证物闭环完成');
      }
      if (this.getFlag('rescued_yufang') && !q.reasons.includes('沈玉芳作为活证人获救')) {
        q.score += 1;
        q.reasons.push('沈玉芳作为活证人获救');
      }
      if (this.getFlag('rescued_su') && !q.reasons.includes('苏晚亭本人获救')) {
        q.score += 2;
        q.reasons.push('苏晚亭本人获救');
      }
      if (!this.getFlag('rescued_yufang')) {
        q.score = Math.min(q.score, 8);
        q.reasons.push('沈玉芳没有被救出，缺少关键活证人，不能进入隐藏结局');
      }
      if (!this.getFlag('rescued_su')) {
        q.score = Math.min(q.score, 10);
        q.reasons.push('苏晚亭没有被救出，不能达到真·隐藏结局');
      }
      if (!this.getFlag('school_wu_three_proofs')) {
        q.score = Math.min(q.score, 8);
        q.reasons.push('光华小学三证物未闭环，真相链条不能完整落地');
      }
      if (this.getFlag('missed_deadline')) {
        q.score = Math.min(q.score, 5);
        q.reasons.push('福生仓行动迟到，人质线断裂');
      }
      return q;
    };

    E.v07ResolveEnding = function () {
      const quality = this.v07InvestigationQuality();
      if (this.getFlag('missed_deadline')) return 'end_too_late';
      if (quality.score >= 10 && this.getFlag('rescued_yufang') && this.getFlag('rescued_su') && this.getFlag('deduced_fusheng') && this.getFlag('school_wu_three_proofs')) {
        return 'end_true_hidden';
      }
      if (quality.score >= 8 && this.getFlag('rescued_yufang') && this.getFlag('deduced_fusheng') && this.getFlag('school_wu_three_proofs')) {
        return 'end_conspiracy_detail';
      }
      if (this.getFlag('rescued_su') || this.getFlag('v07_witnesses_protected')) return 'end_rescue';
      if (quality.score >= 6) return 'end_conspiracy';
      return 'end_archive';
    };

    if (nodes.end_conspiracy && !nodes.end_conspiracy.__paperTruthTextPatched) {
      const oldConspiracyText = nodes.end_conspiracy.text;
      nodes.end_conspiracy.text = function (state) {
        if (!E.getFlag('rescued_yufang') && !E.getFlag('rescued_su') && (E.getFlag('deduced_fusheng') || E.hasClue('推理结论：法租界利益链'))) {
          return `你没有急着写结案报告。<br><br>因为这一次，纸面上的真相太完整，也太冷。<br><br>陈明远不是自杀，光华小学不是普通学校，薛华立路 203 不是孤立租屋，福生仓也不是一间普通仓库。你甚至能把傅启元、公董局蓝封纸、教具箱货运单和王巡官留下的半张烟盒纸摆成一条清楚的线。<br><br>可问题在于：没有活人站出来。<br><br>沈玉芳没有被你带回来。苏晚亭也没有。<br><br>你把证据副本分成三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。你知道这足以让某些人睡不安稳，却不足以让所有门都被撞开。<br><br>两个月后，《申报》角落里刊出一篇不署名短文，影影绰绰提到“法租界学校与码头仓库之间的不明转运”。没有名字，没有照片，也没有证人。<br><br>你读完那篇短文，忽然觉得所谓真相，有时只是无人认领的一张纸。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局七 · 纸上真相 ——</div>`;
        }
        return typeof oldConspiracyText === 'function' ? oldConspiracyText(state) : oldConspiracyText;
      };
      nodes.end_conspiracy.__paperTruthTextPatched = true;
    }

    nodes.end_conspiracy_detail = {
      title: '结局 · 雨夜灯火',
      time: { d: 2, h: 23, m: 0 },
      weather: 0,
      effect: () => E.addClue('隐藏结局已解锁', '你完成光华小学三证物闭环，并救出了沈玉芳这个关键活证人。'),
      text: () => `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关进福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>你救出了沈玉芳。<br><br>这让案子第一次有了活人的声音。她能证明陈明远不是自杀，能证明教具箱不是教具，也能证明苏晚亭不是自行离开。<br><br>但苏晚亭没有被你带回来。<br><br>她在福生仓留下的学生证、字条或手表，足以说明她曾经在那里，却不足以把她从雾里拉出来。<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。报道没有写全所有名字，但足以让那张看不见的网第一次露出形状。<br><br>一个月后，老孙寄来一封短信。信里只有一句话：<br><br><span class="sys">“人还在找。沈先生，至少这一次，他们不能再说她是自己走的。”</span><br><br>窗外又下雨了。你泡了一壶新茶。雨水敲在窗沿上，像某种迟来的证词。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局九 · 雨夜灯火（隐藏结局）——</div>`,
      type: 'end'
    };

    nodes.end_true_hidden = {
      title: '结局 · 破晓之前',
      time: { d: 2, h: 23, m: 0 },
      weather: 0,
      effect: () => E.addClue('真隐藏结局已解锁', '你完成光华小学三证物闭环，救出沈玉芳，并在福生仓救出了苏晚亭。'),
      text: () => `所有的碎片都拼上了。<br><br>陈明远发现光华小学的管制药品走私——被灭口。<br>沈玉芳从他那里知道了一部分真相——被关进福生仓。<br>陆念薇是中间人——她被杭州旧案捏住脖子，不是主谋。<br>傅启元在码头亲自现身——蓝封公文夹终于有了主人。<br><br>而最重要的是：苏晚亭没有只剩下学生证、手表或半张字条。<br><br>她被你从福生仓带了出来。<br><br>在教会医院醒来后，她亲手写下了自己在福生仓听见的名字：傅启元。她的证词、沈玉芳的证词、光华货运单、清场指令和吴校长三证物质询，终于把那张看不见的网钉在了纸面上。<br><br>你没有只写一份报案材料。你写了三份：一份交给老孙，一份寄给《申报》，一份锁进银行保险柜。<br><br>三天后，《申报》头版刊出报道：《光华小学教具箱暗藏管制药品，法租界码头仓库涉非法转运》。<br><br>报道第一次点出了傅启元的名字。<br><br>又过了三天，福生仓被查封。傅启元以“协助调查”的名义被带走。公董局没有承认任何事，但他们也没能让这件事完全消失。<br><br>一个月后，你收到一封信。信上只有一行字：<br><br><span class="sys">“沈先生，谢谢你先找人，而不是先找凶手。——苏晚亭”</span><br><br>窗外又下雨了。你泡了一壶新茶。<br><br>民国三十七年的冬天，比往年来得都晚一些。但终究是来了。<br><br><div style="color:#666;font-style:italic;margin-top:20px">—— 结局十二 · 破晓之前（真·隐藏结局）——</div>`,
      type: 'end'
    };

    E.__pressureQualityEndingPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyPressureQualityEndingPolish);
})();
