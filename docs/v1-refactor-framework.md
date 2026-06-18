# 《雾锁迷踪》v1 重构框架设计

> 分支：`v1_refactor`  
> 原则：先定框架，再动代码；先等价收束，再继续扩写。  
> 本文档是重构准入文件。未完成本文约定前，不进行大规模模块合并。

---

## 1. 重构目标

当前游戏已经具备完整剧情、证据链、多结局、举证面板、状态分流和 smoke/fuzzer 保护，但实现方式偏向后置补丁：大量 `*-polish.js`、`*-fix.js`、`*-panel.js` 反复 patch 同一个 `nodes` 节点。

v1 重构不是重写游戏，也不是新增剧情，而是把已经稳定下来的内容整理成可维护结构。

目标只有四个：

1. **剧情行为等价**：玩家可见剧情、路线、结局、关键 flag 不应改变。
2. **模块职责清晰**：每个文件只负责一个领域，不再让十几个补丁同时改同一个枢纽。
3. **状态有登记**：关键 flags / clues / items / endings 必须有归属。
4. **测试先行保护**：每一步合并模块前后，必须保持 smoke / fuzzer / story graph 通过。

---

## 2. 不做什么

本阶段明确不做：

- 不新增剧情章节。
- 不新增结局。
- 不改主线真相。
- 不改玩家已经习惯的关键路线。
- 不为了“漂亮架构”推倒重来。
- 不一次性重写 `story.js`。
- 不删除 smoke / fuzzer。

如果发现剧情 bug，可以单独记录，但不混进结构重构提交。

---

## 3. 重构后的目录结构

目标结构如下：

```text
src/
  engine.js
  main.js
  story.js                     # 原始剧情节点逐步瘦身，最终只保留基础章节节点
  story-modules.js              # 模块入口，最终只保留少量领域模块

  story-core/
    registry.js                 # flags / clues / items / panels / endings 注册表
    state-helpers.js             # hasThing、presentOnce、support 判断等共用函数
    route-guards.js              # 通用路线门槛
    quality-model.js             # 真相完整度、证人稳定、调查质量等评分

  story-chapters/
    chapter-1-opening.js
    chapter-2-home-xuehua.js
    chapter-3-guanghua.js
    chapter-4-fusheng.js
    chapter-5-hospital.js
    endings.js

  story-panels/
    zhou-evidence-panel.js
    sun-support-panel.js
    darkroom-evidence-panel.js
    lu-evidence-panel.js
    fusheng-scene-panel.js

  story-systems/
    deduction-system.js
    evidence-system.js
    dock-heat-system.js
    hospital-pressure-system.js
    conclusion-system.js
    dev-mode-system.js
```

说明：

- `story-core/` 放通用状态和规则。
- `story-chapters/` 放章节叙事节点。
- `story-panels/` 放举证/确认面板。
- `story-systems/` 放跨章节机制。
- `story-modules/` 在迁移期继续存在，逐步减少。

---

## 4. 五大面板转正目标

当前最需要转正的是五个高价值面板。

### 4.1 周怀安举证面板

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

不应再由多个模块 patch `ch4_revisit_zhou`。

---

### 4.2 老孙支援举证面板

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

合并来源：

```text
sun-support-evidence-panel.js
sun-fast-support-polish.js 中和支援入口相关的部分
```

职责：

- 王巡官纸条、陈明远信、福生仓位置、203 恐吓信的说服流程。
- 低调支援 / 调齐人手的解锁。
- 支援 flag 的统一写入。

---

### 4.3 暗室举证面板

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

合并来源：

```text
su-home-trust-gate.js 中暗室信任部分
yufang-testimony-polish.js
darkroom-evidence-panel.js
```

职责：

- 银发夹建立苏晚亭信任。
- 三人合影、陈明远信、日记残页稳住沈玉芳证词。
- 明确“不出示信物会导致苏晚亭救援降档”。

---

### 4.4 陆念薇程序举证面板

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

合并来源：

```text
lu-procedure-truth-polish.js
lu-evidence-panel.js
```

职责：

- 把可信度和程序风险转成可见压力。
- 货运单、清场指令、证人、老孙、医生记录的举证。
- 正式口供 / 私下口供 / 内线 / 退缩的程序选择。

---

### 4.5 福生仓现场确认面板

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

合并来源：

```text
dock-infiltration-depth-polish.js 中现场节点相关部分
fusheng-scene-evidence-panel.js
```

职责：

- 清场指令 / 蓝封公文纸确认。
- 光华教具箱 / 货运单确认。
- 暗室关押痕迹确认。
- 傅启元 / 陆念薇人物链条确认。

---

## 5. 状态注册表设计

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

- 先登记核心状态。
- 不一次性登记全部小状态。
- 注册表不作为运行时强依赖，先作为检查和文档源。
- 每合并一个面板，补齐该面板状态登记。

---

## 6. 模块合并顺序

重构不能按文件顺序乱合并，应按风险从低到高推进。

### Phase 0：框架文档与准入检查

只提交文档和检查脚本，不改剧情行为。

产物：

```text
docs/v1-refactor-framework.md
```

### Phase 1：只读注册表

新增：

```text
src/story-core/registry.js
scripts/check-story-registry.mjs
```

要求：

- 不接入剧情运行链。
- 只用于检查重复登记、缺少 owner、面板归属。

### Phase 2：共用 helper 收束

新增：

```text
src/story-core/state-helpers.js
```

迁移：

```text
hasThing
presentOnce
fullSupportAtDock
fastSupportOnly
witnessProfile
```

要求：

- 先双写：旧模块仍可用，helper 只做复用。
- 不改变任何 flag 名称。

### Phase 3：五大面板逐个转正

顺序：

```text
1. 老孙支援面板
2. 周怀安举证面板
3. 福生仓现场确认面板
4. 暗室举证面板
5. 陆念薇程序举证面板
```

原因：

- 老孙面板相对独立，风险最低。
- 周怀安面板目标清晰。
- 福生仓现场涉及路径多，但大多是确认 flag。
- 暗室影响救援降档，风险较高。
- 陆念薇影响结案质量和程序风险，最后做。

每转正一个面板，必须：

- 新建目标文件。
- 保持旧 smoke 通过。
- 新增或更新对应 smoke。
- 删除或瘦身旧 patch 文件。
- 更新 `story-modules.js`。
- 更新注册表。

### Phase 4：章节文件拆分

只有五大面板转正后，才开始拆章节。

优先拆：

```text
chapter-4-fusheng.js
chapter-5-hospital.js
```

暂不拆：

```text
story.js 全量
```

### Phase 5：清理遗留 polish/fix 命名

最后再做：

- 删除空壳 patch 文件。
- 将仍保留的系统模块改名为正式系统名。
- 更新文档和模块清单。

---

## 7. 每一步必须满足的不变量

每次提交都必须满足：

```text
1. 所有 nodes 的 goto 指向存在。
2. 所有新选项必须有 smoke 覆盖。
3. 同一 hub 节点不允许新增第三个 patch 层。
4. 关键 flag 名称不改，除非有迁移兼容层。
5. 旧存档不应因缺 flag 崩溃。
6. 不删除已存在结局。
7. 不改变 main 的可玩稳定线。
```

---

## 8. 测试矩阵

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

CI 中已存在的其他 smoke 不得移除。

---

## 9. 提交粒度

每个提交只做一种事。

推荐提交类型：

```text
Document v1 refactor framework
Add story registry check
Extract shared state helpers
Consolidate Sun support panel
Consolidate Zhou evidence panel
Consolidate Fusheng scene panel
Consolidate darkroom evidence panel
Consolidate Lu evidence panel
```

禁止：

```text
重构一堆东西
优化代码
修复若干问题
update
```

---

## 10. 当前建议的第一阶段任务

下一步应该做：

```text
Phase 1：只读注册表 + 检查脚本
```

不是直接改运行时代码。

具体产物：

```text
src/story-core/registry.js
scripts/check-story-registry.mjs
```

验收标准：

- 注册表不接入 `story-modules.js`。
- 运行时不加载它。
- 只用于 Node 检查。
- 先登记五大面板相关状态。
- 检查重复 id、空 owner、空 group。

只有这个通过后，再进入 helper 收束。
