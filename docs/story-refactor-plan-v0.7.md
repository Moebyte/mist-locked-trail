# v0.7 Story Refactor 路线图

## 背景

当前项目已经完成：

- 工程拆分：`index + engine + story + main + css`。
- 剧情增强：苏晚亭日记、傅启元登场、福生仓重写、医院三方冲突、自然结局分流。
- 举证系统：吴校长、沈玉芳、周明远、傅启元、老孙等关键 NPC 均已有有效举证。
- 自动化测试：剧情图校验、关键路线烟测、举证烟测、剧情密度烟测。

当前主要问题不是功能缺失，而是维护结构：

```text
story.js              原始节点
main.js               运行时覆盖 / 玩法增强
v0.6.1-fixes.js        一致性补丁
v0.6.2-evidence.js     举证补丁
v0.6.3-evidence-polish.js 举证润色补丁
v0.7-narrative-depth.js 剧情密度补丁
```

补丁层越多，后续接手者越需要理解覆盖顺序。

---

## Phase 1：补丁加载集中化（本 PR）

目标：先减少入口混乱，不做大规模故事迁移。

### 改动

- 新增 `src/patches.js`，统一登记并加载全部运行时补丁。
- `index.html` 只加载：

```html
<script src="src/patches.js"></script>
```

- 新增 `scripts/patch-loader.mjs`，测试侧自动发现 `src/v*.js` 补丁并按版本排序。
- 新增 `scripts/check-patch-loading.mjs`，检查：
  - `index.html` 不再直接加载单个补丁；
  - `src/patches.js` 的清单与测试侧自动发现的补丁一致；
  - 实际加载后能看到 v0.7 关键函数与节点。

### 收益

- 新增/删除补丁时有统一入口。
- 页面和测试的补丁认知开始收敛。
- 先把“入口问题”解决，再做“内容回填”。

---

## Phase 2：测试脚本共用 harness

目标：减少 5 个 smoke 脚本里重复的 VM/E/document stub。

建议新增：

```text
scripts/story-harness.mjs
```

集中提供：

- `loadStoryRuntime()`
- `renderNode()`
- `choicesOf()`
- `goByTarget()`
- `goByText()`
- `assertFlag()`
- `assertClue()`

然后逐步改造：

```text
validate-story.mjs
smoke-routes.mjs
smoke-evidence.mjs
smoke-evidence-polish.mjs
smoke-narrative-depth.mjs
```

---

## Phase 3：回填稳定补丁到 story.js

目标：减少运行时覆盖。

建议优先回填顺序：

1. `v0.6.1-fixes.js`：体量小，风险低。
2. `v0.6.2-evidence.js`：举证节点相对独立。
3. `v0.6.3-evidence-polish.js`：同属举证，可与 Phase 2 一起验证。
4. `v0.7-narrative-depth.js`：影响结局和主线分流，最后回填。
5. `main.js` 中的大规模节点覆盖：最后处理。

每次回填一类补丁，保持所有 Actions 通过后再合并。

---

## Phase 4：main.js 只保留启动与玩法增强

最终目标：

```text
story.js   只放故事节点
engine.js  只放引擎
main.js    只做启动、UI 绑定、少量全局增强
patches.js 临时为空或删除
```

完成后，项目结构会更接近长期可维护版本。
