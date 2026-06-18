# 《雾锁迷踪》v1 重构框架设计

> 分支：`v1_refactor`  
> 原则：先定框架，再动代码；先拆大文件，再收补丁；先等价收束，再继续扩写。  
> 本文档是 v1 重构准入文件。未完成文档约定前，不进行大规模代码迁移。

---

## 1. 现状判断

当前游戏已经具备完整剧情、证据链、多结局、举证面板、状态分流和 smoke/fuzzer 保护，但实现方式已经进入“补丁堆叠期”。主要问题不只是 `story-modules/` 里补丁多，而是几个核心文件已经承担了过多职责。

当前高风险大文件：

```text
src/story.js       约 1600+ 行：剧情节点、推理、结局、状态变化混在一起
src/styles.css     约 1100+ 行：主题、布局、场景、面板、弹窗、响应式全堆一起
src/main.js        563 行：名义是启动入口，实际塞了玩法增强和剧情节点覆盖
src/engine.js      516 行：引擎、渲染、状态、存档、推理弹窗、关系图混在一起
```

因此，v1 重构不能只做“五大面板转正”。真正的主线应调整为：

```text
先拆大文件
再建立规则层
再转正面板
最后清理补丁
```

---

## 2. 重构目标

v1 重构不是重写游戏，也不是新增剧情，而是把已经稳定下来的内容整理成可维护结构。

目标只有五个：

1. **剧情行为等价**：玩家可见剧情、路线、结局、关键 flag 不应改变。
2. **大文件瘦身**：优先处理 `story.js`、`styles.css`、`main.js`、`engine.js` 的职责过载。
3. **模块职责清晰**：每个文件只负责一个领域，不再让十几个补丁同时改同一个枢纽。
4. **状态有登记**：关键 flags / clues / items / endings 必须有归属。
5. **测试先行保护**：每一步迁移前后，必须保持 smoke / fuzzer / story graph 通过。

---

## 3. 不做什么

本阶段明确不做：

- 不新增剧情章节。
- 不新增结局。
- 不改主线真相。
- 不改玩家已经习惯的关键路线。
- 不为了“漂亮架构”推倒重来。
- 不一次性重写 `story.js`。
- 不一次性重写 `engine.js`。
- 不删除 smoke / fuzzer。
- 不在没有迁移表的情况下移动节点。

如果发现剧情 bug，可以单独记录，但不混进结构重构提交。

---

## 4. 最终目录结构

目标结构如下：

```text
src/
  engine.js                         # 迁移期保留；最终只做引擎聚合入口
  main.js                           # 只负责启动，不再承载剧情节点和玩法规则
  story.js                          # 迁移期兼容壳；最终只创建 nodes 容器
  story-modules.js                  # 迁移期模块入口；最终只加载少量正式模块
  styles.css                        # 迁移期样式入口；最终只做 @import 聚合

  engine/
    state.js                        # 状态初始化、时间、压力、存档兼容
    render.js                       # 场景渲染、选项渲染、日志
    panel.js                        # 线索簿与侧边栏
    deduction-ui.js                 # 推理弹窗 UI
    relation-graph.js               # 人物关系图
    status.js                       # 状态栏

  styles/
    base.css                        # reset、字体、基础标签
    theme.css                       # 颜色变量、白天/夜晚主题
    layout.css                      # app、顶部按钮、状态栏、整体布局
    scene.css                       # 当前场景卡片、文本、日志
    choices.css                     # 选项按钮、锁定态、网格
    panel.css                       # 线索簿、侧边面板、列表、卡片
    modals.css                      # 推理弹窗、人物图弹窗
    responsive.css                  # 桌面/移动端适配
    effects.css                     # 雨、雾、vintage、动画

  story-core/
    registry.js                     # flags / clues / items / panels / endings 注册表
    state-helpers.js                # hasThing、presentOnce、support 判断等共用函数
    route-guards.js                 # 通用路线门槛
    quality-model.js                # 真相完整度、证人稳定、调查质量评分

  story-chapters/
    index.js                        # 章节节点统一挂载入口，可选
    chapter-1-opening.js            # 开局、委托、基础调查
    chapter-2-home-xuehua.js        # 圣约翰大学、苏家、薛华立路、203 室、当铺
    chapter-3-guanghua.js           # 光华小学、陈明远、吴校长、前三段推理衔接
    chapter-4-fusheng.js            # 苏州河、福生仓、码头、暗室、救援
    chapter-5-hospital.js           # 医院、陆念薇、傅启元后续、结案前
    endings.js                      # 所有结局节点集中管理

  story-panels/
    zhou-evidence-panel.js          # 周怀安举证面板
    sun-support-panel.js            # 老孙支援举证面板
    darkroom-evidence-panel.js      # 暗室：苏晚亭 / 沈玉芳举证
    lu-evidence-panel.js            # 医院：陆念薇程序举证
    fusheng-scene-panel.js          # 福生仓现场证据确认

  story-systems/
    deduction-system.js             # 三段推理系统
    evidence-system.js              # 出示证据、举证兜底
    deadline-system.js              # 时间压力
    dock-route-system.js            # 福生仓入口路由
    dock-heat-system.js             # 码头 heat / delay
    hospital-pressure-system.js     # 医院压力、证人稳定
    conclusion-system.js            # 结案总结、真相完整度
    dev-mode-system.js              # 开发者模式、测试预设

  story-modules/                    # 迁移期保留区，逐步减少
    *-polish.js
    *-fix.js
    *-panel.js
```

---

## 5. 大文件瘦身目标

### 5.1 `story.js`

当前问题：

```text
剧情节点、推理节点、结局节点、线索发放、物品发放、路线跳转都混在一个 1600+ 行文件里。
```

目标：

```text
story.js 最终降到 50～200 行以内。
```

最终职责：

```js
const nodes = {};
window.nodes = nodes;
```

或保留等价兼容壳。真正剧情节点迁移到 `story-chapters/`。

详细迁移见：

```text
docs/story-js-split-plan.md
```

---

### 5.2 `styles.css`

当前问题：

```text
主题变量、基础布局、按钮、场景、线索簿、弹窗、桌面端、移动端、天气效果全部在一个 1100+ 行文件里。
```

目标：

```text
styles.css 最终只做 @import 聚合。
```

目标入口：

```css
@import "./styles/base.css";
@import "./styles/theme.css";
@import "./styles/layout.css";
@import "./styles/scene.css";
@import "./styles/choices.css";
@import "./styles/panel.css";
@import "./styles/modals.css";
@import "./styles/responsive.css";
@import "./styles/effects.css";
```

详细迁移见：

```text
docs/styles-split-plan.md
```

---

### 5.3 `main.js`

当前问题：

```text
名义是启动入口，实际包含 presentOnce、deadlinePhase、routeDockByPressure、truthFragmentText、chainPresent，以及大量剧情节点覆盖。
```

目标：

```text
main.js 最终只负责 DOMContentLoaded 启动。
```

可迁移方向：

```text
presentOnce / hasThing           → story-core/state-helpers.js
deadlinePhase / 时间压力          → story-systems/deadline-system.js
routeDockByPressure              → story-systems/dock-route-system.js
chainPresent / onPresent 兜底     → story-systems/evidence-system.js
剧情节点覆盖                     → story-chapters/ 或 story-panels/
```

---

### 5.4 `engine.js`

当前问题：

```text
引擎对象 E 既管状态，又管渲染、存档、线索簿、推理弹窗、关系图和状态栏。
```

目标：

```text
engine.js 最后再拆，不作为第一阶段对象。
```

原因：

```text
engine.js 牵一发动全身，必须在剧情、样式、main.js 先收束后再动。
```

最终可拆成：

```text
engine/state.js
engine/render.js
engine/save.js
engine/panel.js
engine/deduction-ui.js
engine/relation-graph.js
engine/status.js
```

---

## 6. 五大面板转正目标

五大面板仍然重要，但顺序后移。原因是：面板大量 patch `story.js` 中的旧节点，如果章节边界没有先确定，面板转正仍然会围绕旧大文件打补丁。

### 6.1 周怀安举证面板

目标文件：

```text
src/story-panels/zhou-evidence-panel.js
```

接管节点：

```text
ch4_revisit_zhou
ch4_zhou_present_jade
ch4_zhou_present_jade_premature
ch4_zhou_present_chen_letter
ch4_zhou_present_su_last_letter
ch4_zhou_present_wang_note
ch4_zhou_present_threat
```

合并来源：

```text
present-flow-cleanup.js
zhou-jade-present-node-fix.js
```

职责：

- 明确“不是让周怀安认手镯，而是追问陆念”。
- 管理周怀安连续举证入口。
- 保证所有出示目标节点存在。
- 控制过早追问和完整追问的区别。

---

### 6.2 老孙支援举证面板

目标文件：

```text
src/story-panels/sun-support-panel.js
```

接管节点：

```text
ch4_sun_support
ch4_sun_present_wang_note
ch4_sun_present_chen_letter
ch4_sun_present_fusheng_location
ch4_sun_present_threat
```

职责：

- 王巡官纸条、陈明远信、福生仓位置、203 恐吓信的说服流程。
- 低调支援 / 调齐人手的解锁。
- 支援 flag 的统一写入。

---

### 6.3 暗室举证面板

目标文件：

```text
src/story-panels/darkroom-evidence-panel.js
```

接管节点：

```text
ch4_dock_who_dual
ch4_su_present_keepsake
ch4_yufang_quick_testimony
ch4_yufang_present_photo_dual
ch4_yufang_present_letter_dual
ch4_yufang_present_diary_dual
```

职责：

- 银发夹建立苏晚亭信任。
- 三人合影、陈明远信、日记残页稳住沈玉芳证词。
- 明确“不出示信物会导致苏晚亭救援降档”。

---

### 6.4 陆念薇程序举证面板

目标文件：

```text
src/story-panels/lu-evidence-panel.js
```

接管节点：

```text
ch4_lu_confrontation
ch4_lu_present_waybill
ch4_lu_present_clearance
ch4_lu_present_witnesses
ch4_lu_present_sun_backstop
ch4_lu_present_doctor_record
```

职责：

- 把可信度和程序风险转成可见压力。
- 货运单、清场指令、证人、老孙、医生记录的举证。
- 正式口供 / 私下口供 / 内线 / 退缩的程序选择。

---

### 6.5 福生仓现场确认面板

目标文件：

```text
src/story-panels/fusheng-scene-panel.js
```

接管节点：

```text
ch4_dock_inside
ch4_dock_inner_office
ch4_dock_inner_office_limited
ch4_dock_shelf_approach
ch4_dock_shelf_approach_limited
ch4_dock_crates
ch4_dock_deep
ch4_dock_who
ch4_dock_who_dual
ch4_dock_escape
ch4_dock_escape_finish
ch4_fu_confront
```

职责：

- 清场指令 / 蓝封公文纸确认。
- 光华教具箱 / 货运单确认。
- 暗室关押痕迹确认。
- 傅启元 / 陆念薇人物链条确认。

---

## 7. 状态注册表设计

重构后需要建立：

```text
src/story-core/registry.js
```

注册表不直接改变游戏状态，只负责登记。

建议结构：

```js
export const FLAGS = {
  deduced_chen: {
    group: 'deduction',
    owner: 'deduction-system',
    meaning: '第一段推理完成',
  },
};

export const CLUES = {
  '现场确认：清场指令': {
    group: 'fusheng-scene',
    owner: 'fusheng-scene-panel',
  },
};

export const ITEMS = {
  '光华货运单': {
    group: 'fusheng-scene',
    owner: 'fusheng-scene-panel',
  },
};
```

迁移原则：

- 注册表先作为只读检查源，不接入运行时。
- 先登记核心状态，不一次性登记全部小状态。
- 每迁移一个章节或面板，补齐该范围内状态登记。

---

## 8. 新版重构阶段

### Phase 0：框架文档修订

产物：

```text
docs/v1-refactor-framework.md
docs/story-js-split-plan.md
docs/styles-split-plan.md
```

要求：

- 不改运行时代码。
- 不迁移节点。
- 只确定边界、顺序和验收标准。

---

### Phase 1：拆 `styles.css`

原因：

```text
样式拆分风险低，不影响剧情状态，也能快速降低项目混乱度。
```

产物：

```text
src/styles/base.css
src/styles/theme.css
src/styles/layout.css
src/styles/scene.css
src/styles/choices.css
src/styles/panel.css
src/styles/modals.css
src/styles/responsive.css
src/styles/effects.css
src/styles.css
```

要求：

- `index.html` 仍只引用 `src/styles.css`。
- 拆分前后视觉应保持等价。
- 不混入 JS 或剧情修改。

---

### Phase 2：建立章节加载机制

产物：

```text
src/story-chapters/index.js
```

要求：

- 可先只加载空章节模块。
- 不迁移节点。
- 确认 `nodes` 可以被章节模块安全扩展。

---

### Phase 3：迁移 `endings.js`

原因：

```text
结局节点大多是 type:end，行为相对独立，适合作为第一批剧情迁移对象。
```

产物：

```text
src/story-chapters/endings.js
```

要求：

- 所有结局 ID 不变。
- 结局标题不变。
- ending reachability smoke 通过。

---

### Phase 4：迁移低风险章节节点

顺序：

```text
chapter-1-opening.js
chapter-2-home-xuehua.js 中未被多模块 patch 的节点
```

要求：

- 每次只迁移一组节点。
- 迁移后 `story.js` 删除对应节点定义。
- 相关 smoke 保持通过。

---

### Phase 5：迁移高风险章节节点

顺序：

```text
chapter-3-guanghua.js
chapter-4-fusheng.js
chapter-5-hospital.js
```

高风险节点包括：

```text
ch3_wrapup
ch4_revisit_zhou
ch4_sun_support
ch4_dock_who_dual
ch4_lu_confrontation
ch4_dock_escape
```

要求：

- 迁移前先看 patch 来源。
- 迁移后 smoke 必须覆盖。
- 不允许新增第三层 patch。
- 高风险节点必须按“小批量 runtime takeover → focused gate → removal dry-run → physical removal → workflow 收口”的顺序推进。
- 每一批都必须有独立的迁移边界；不要把后续批次塞进上一批 removal script。

#### Phase 5 当前后半段策略：第三章剩余节点

第三章已经进入高风险后半段。后续不再按“低风险节点批量迁移”的方式推进，而是按节点责任和 patch 复杂度逐个收束。

已完成并允许视为迁移样板的节点：

```text
ch3_school_chen_su
ch3_school_weird
ch3_school_yufang
```

推荐后续顺序：

```text
1. ch3_school_office
2. ch3_chen_letter
3. ch3_wu_present_threat / ch3_wu_present_photo
4. ch3_school_teacher
5. ch3_school
6. ch3_wrapup
```

处理原则：

- `ch3_school_office` 可作为下一批优先对象，但必须检查关键证据、道具和 `got_chen_evidence` flag。
- `ch3_chen_letter` 应在办公室节点稳定后迁移，因为它依赖办公室搜证后的叙事出口。
- `ch3_wu_present_threat` 与 `ch3_wu_present_photo` 属于举证结果节点，必须单独处理，不能混入普通学校节点批次。
- `ch3_school_teacher` 含 `onPresent`，应等两个举证结果节点稳定后再迁。
- `ch3_school` 是光华小学入口 hub，受多个 location / region / flow 模块影响，不能提前迁。
- `ch3_wrapup` 是结案和结局前置 hub，必须最后作为专项迁移，不得混入普通节点迁移。

`ch3_wrapup` 专项迁移前必须补充：

```text
wrapup audit
wrapup contract
wrapup runtime gate
结局出口检查
证据条件检查
质量门检查
旧存档兼容检查
```

---

### Phase 6：拆 `main.js`

顺序：

```text
state helpers
deadline system
dock route system
evidence present system
剧情覆盖节点回迁到 chapters / panels
```

目标：

```text
main.js 只保留启动。
```

---

### Phase 7：五大面板转正

顺序：

```text
1. 老孙支援面板
2. 周怀安举证面板
3. 福生仓现场确认面板
4. 暗室举证面板
5. 陆念薇程序举证面板
```

每转正一个面板，必须：

- 新建目标文件。
- 保持旧 smoke 通过。
- 新增或更新对应 smoke。
- 删除或瘦身旧 patch 文件。
- 更新 `story-modules.js`。
- 更新注册表。

---

### Phase 8：整理 `engine.js`

最后再做。

原因：

```text
engine.js 是运行核心，等剧情、样式、main.js 收束后再拆风险最低。
```

---

### Phase 9：删除旧 polish / fix / panel 补丁

最后清理：

- 删除空壳 patch 文件。
- 将仍保留的系统模块改名为正式系统名。
- 更新文档和模块清单。

---

## 9. 每一步必须满足的不变量

每次提交都必须满足：

```text
1. 所有 nodes 的 goto 指向存在。
2. 所有新选项必须有 smoke 覆盖。
3. 同一 hub 节点不允许新增第三个 patch 层。
4. 关键 flag 名称不改，除非有迁移兼容层。
5. 旧存档不应因缺 flag 崩溃。
6. 不删除已存在结局。
7. 不改变 main 的可玩稳定线。
8. 每次迁移都必须能解释“从哪里搬到哪里”。
9. 大文件拆分不得混入剧情改写。
```

---

## 10. 测试矩阵

每个阶段至少运行：

```text
node scripts/check-story-modules.mjs
node scripts/check-save-compat.mjs
node scripts/validate-story.mjs
node scripts/smoke-routes.mjs
node scripts/fuzz-story-states.mjs
```

对应面板还要运行：

```text
node scripts/smoke-sun-support-evidence-panel.mjs
node scripts/smoke-zhou-jade-present-node.mjs
node scripts/smoke-darkroom-evidence-panel.mjs
node scripts/smoke-lu-evidence-panel.mjs
node scripts/smoke-fusheng-scene-evidence-panel.mjs
```

CSS 拆分后至少人工检查：

```text
标题页
普通场景页
线索簿
推理弹窗
人物图弹窗
桌面端布局
移动端布局
```

CI 中已存在的 smoke 不得移除。

---

## 11. 提交粒度

每个提交只做一种事。

推荐提交类型：

```text
Revise v1 refactor framework around large-file split
Add story.js split plan
Add styles.css split plan
Split CSS theme and base layers
Add chapter module loading scaffold
Move endings to chapter endings module
Move opening nodes to chapter module
Extract main state helpers
Consolidate Sun support panel
```

禁止：

```text
重构一堆东西
优化代码
修复若干问题
update
```

---

## 12. 当前下一步

当前下一步不是写代码，而是完成 Phase 0 文档：

```text
docs/v1-refactor-framework.md
docs/story-js-split-plan.md
docs/styles-split-plan.md
```

Phase 0 完成后，才进入：

```text
Phase 1：拆 styles.css
```

理由：

```text
styles.css 拆分风险最低，可先验证“只做结构迁移，不改行为”的工作纪律。
```
