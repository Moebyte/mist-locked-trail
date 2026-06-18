# `src/story.js` 拆分计划

> 分支：`v1_refactor`  
> 目标：把 1600+ 行的 `src/story.js` 逐步拆成章节文件，同时保持剧情行为等价。  
> 原则：没有迁移表，不移动节点；每次只迁移一组节点。

---

## 1. 拆分目标

当前 `story.js` 的问题不是单纯“行数多”，而是它同时承担了：

```text
剧情节点库
推理节点库
结局节点库
路线跳转
线索发放
物品发放
flag 设置
章节衔接
```

最终目标：

```text
src/story.js 降到 50～200 行以内。
```

最终职责：

```js
const nodes = {};
window.nodes = nodes;
```

或者保留等价兼容壳，但不再承载大段剧情文本。

---

## 2. 目标章节结构

```text
src/story-chapters/
  index.js
  chapter-1-opening.js
  chapter-2-home-xuehua.js
  chapter-3-guanghua.js
  chapter-4-fusheng.js
  chapter-5-hospital.js
  endings.js
```

### 文件职责

```text
chapter-1-opening.js
  开场、委托、照片、初始调查入口。

chapter-2-home-xuehua.js
  圣约翰大学、苏家、薛华立路、203 室、当铺相关基础节点。

chapter-3-guanghua.js
  光华小学、陈明远、吴校长、第一/第二/第三段推理前后的学校线。

chapter-4-fusheng.js
  苏州河、福生仓、码头、暗室、救援、傅启元码头对峙前后。

chapter-5-hospital.js
  医院、陆念薇、医生记录、证人安置、最终结案前。

endings.js
  所有 type:end 结局节点。
```

---

## 3. 迁移方式

每个章节文件都采用“挂载节点”的方式，避免改变 `nodes` 对象身份。

建议模式：

```js
(function installChapter1Opening() {
  function applyChapter1Opening() {
    if (typeof nodes === 'undefined') return;
    Object.assign(nodes, {
      ch1_open: {
        title: '...',
        text: () => `...`,
        choices: [...]
      }
    });
  }

  document.addEventListener('DOMContentLoaded', applyChapter1Opening);
})();
```

迁移期规则：

```text
1. 新文件先定义节点。
2. story-modules.js 或章节入口加载新文件。
3. 确认新节点覆盖旧节点行为一致。
4. 再从 story.js 删除对应旧节点。
5. 跑 smoke / validate。
```

不要一次性从 `story.js` 删除大量节点。

---

## 4. 节点风险分级

### 低风险

特征：

```text
纯文本 + 固定 choices
很少被 story-modules patch
不参与复杂 scoring
不是 hub
```

适合早迁移。

### 中风险

特征：

```text
有 effect
会 addClue / addItem / setFlag
但不是多模块 patch 核心
```

迁移时需要 smoke 覆盖。

### 高风险

特征：

```text
被多个 story-modules patch
choices 是动态函数
会影响结局质量或路线开放
是章节 hub
```

必须最后迁移。

---

## 5. 重点高风险 hub

这些节点迁移前必须先查 patch 来源，不可直接搬：

```text
ch3_wrapup
ch4_revisit_zhou
ch4_sun_support
ch4_dock_escape
ch4_dock_escape_finish
ch4_dock_who_dual
ch4_lu_confrontation
ch4_conclusion
```

原因：

```text
这些节点承担路线汇流、举证入口、结局质量、证人状态、程序风险等核心职责。
```

---

## 6. 初步迁移分组

> 这里先给出目标分组。实际迁移前需要用脚本生成更精确节点清单。

### Group A：结局节点 → `endings.js`

目标：先把 `type: 'end'` 的节点迁移出去。

可能包括：

```text
end_archive
end_late
end_dock_silenced
end_true
end_good
end_bad
end_mist
end_*
```

验收：

```text
node scripts/smoke-ending-reachability.mjs
node scripts/smoke-dynamic-endings.mjs
node scripts/smoke-final-closure-flow.mjs
node scripts/validate-story.mjs
```

风险：中。

原因：结局文本长，但逻辑相对独立；先拆可以显著降低 `story.js` 行数。

---

### Group B：第一章开场 → `chapter-1-opening.js`

可能包括：

```text
ch1_open
ch1_accept
ch1_decline 或早期中断节点
ch1_* 初始调查入口
```

验收：

```text
node scripts/smoke-routes.mjs
node scripts/validate-story.mjs
```

风险：低。

---

### Group C：圣约翰大学 / 苏家 / 薛华立路 → `chapter-2-home-xuehua.js`

可能包括：

```text
ch2_university
ch2_univ_* 
ch2_home
ch2_home_* 
ch2_xuehua
ch2_203_search
pawnshop / 当铺相关节点
```

注意：

```text
ch2_home 相关节点被 su-home-trust-gate.js、location-hub-flow-polish.js patch，迁移前必须确认最终行为由哪个模块负责。
```

验收：

```text
node scripts/smoke-evidence-polish.mjs
node scripts/smoke-wuai-wanting-altered-packet.mjs
node scripts/validate-story.mjs
```

风险：中。

---

### Group D：光华小学 / 陈明远 / 推理节点 → `chapter-3-guanghua.js`

可能包括：

```text
ch3_school
ch3_chen_letter
ch3_wrapup
deduc_success
deduc_fail
deduc_lu_zhao_ok
deduc_lu_zhao_fail
deduc_fusheng_ok
deduc_fusheng_fail
```

注意：

```text
ch3_wrapup 是最高风险 hub，被 wrapup-priority-guidance、fusheng-progress、premature-conclusion 等模块影响。
```

验收：

```text
node scripts/smoke-wrapup-priority.mjs
node scripts/smoke-wrapup-fusheng-deduction-opens.mjs
node scripts/smoke-deduction-prereq-groups.mjs
node scripts/smoke-deduction-retry-no-early-ending.mjs
node scripts/validate-story.mjs
```

风险：高。

---

### Group E：福生仓 / 码头 / 暗室 → `chapter-4-fusheng.js`

可能包括：

```text
ch4_suzhou_creek
ch4_dock_watch
ch4_dock_wait
ch4_dock_inside
ch4_dock_crates
ch4_dock_deep
ch4_dock_who
ch4_dock_who_dual
ch4_dock_escape
ch4_dock_escape_finish
ch4_fu_confront
```

注意：

```text
这组是最高风险之一。
它同时被 dock-heat、dock-hide、fusheng-scene、darkroom、sun-support、dock-exit-hospital 等模块影响。
```

验收：

```text
node scripts/smoke-routes.mjs
node scripts/smoke-dock-heat-system.mjs
node scripts/smoke-dock-escape-choices.mjs
node scripts/smoke-dock-exit-hospital-crisis.mjs
node scripts/smoke-fusheng-scene-evidence-panel.mjs
node scripts/smoke-darkroom-evidence-panel.mjs
node scripts/validate-story.mjs
```

风险：高。

---

### Group F：医院 / 陆念薇 / 结案前 → `chapter-5-hospital.js`

可能包括：

```text
ch4_hospital_*
ch4_lu_confrontation
ch4_lu_present_*
ch4_conclusion
final closure 相关节点
```

注意：

```text
ch4_lu_confrontation 被 lu-procedure-truth-polish.js 和 lu-evidence-panel.js 共同影响。
```

验收：

```text
node scripts/smoke-hospital-flow.mjs
node scripts/smoke-hospital-pressure-witness.mjs
node scripts/smoke-hospital-truth-score.mjs
node scripts/smoke-lu-procedure-truth.mjs
node scripts/smoke-lu-evidence-panel.mjs
node scripts/smoke-conclusion-summary.mjs
node scripts/validate-story.mjs
```

风险：高。

---

## 7. 迁移顺序

推荐顺序：

```text
1. 建立 story-chapters/index.js 空入口
2. 迁移 endings.js
3. 迁移 chapter-1-opening.js
4. 迁移 chapter-2 中低风险节点
5. 迁移 chapter-3 中非 ch3_wrapup 节点
6. 迁移 chapter-4 中非 hub 节点
7. 迁移 chapter-5 中非 ch4_lu_confrontation 节点
8. 单独处理 ch3_wrapup
9. 单独处理 ch4_dock_who_dual / ch4_dock_escape
10. 单独处理 ch4_lu_confrontation
```

---

## 8. 每次迁移提交模板

每次提交必须能回答：

```text
从哪里迁出：src/story.js 的哪些节点
迁到哪里：src/story-chapters/xxx.js
行为是否等价：是
改了哪些测试：xxx smoke
是否改剧情：否
```

提交名建议：

```text
Move ending nodes out of story.js
Move opening nodes to chapter module
Move university nodes to chapter module
```

---

## 9. 禁止事项

```text
禁止一次迁移多个章节。
禁止一边迁移一边改剧情文本。
禁止迁移 hub 时顺便改路由。
禁止删除旧节点后不跑 validate。
禁止为了减少行数而丢弃兼容 flag。
```

---

## 10. 后续需要补的工具

建议新增：

```text
scripts/audit-story-js-nodes.mjs
```

用途：

```text
1. 输出 story.js 当前节点列表
2. 按 ch1/ch2/ch3/ch4/end 前缀分组
3. 标记 type:end 节点
4. 搜索 story-modules 中 patch 过的节点
5. 生成迁移候选表
```

这一步应在真正迁移节点前完成。
