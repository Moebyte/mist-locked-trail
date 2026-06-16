# v0.7 Story Refactor Phase 2：测试 Harness

## 背景

Phase 1 已经解决补丁加载入口混乱问题：

- 浏览器端通过 `src/patches.js` 统一加载补丁；
- 测试侧通过 `scripts/patch-loader.mjs` 自动发现并加载补丁；
- `scripts/check-patch-loading.mjs` 确认页面和测试侧补丁口径一致。

Phase 2 继续处理测试脚本自身的重复问题。

此前多个 smoke 脚本都各自复制了一份：

- `freshState()`
- `E` 引擎 stub
- `document` stub
- VM 加载逻辑
- `renderNode()`
- `choicesOf()`
- `goByTarget()`
- flag / clue / item 断言

这些重复代码会导致：

- 一个引擎 stub 改动要同步多处；
- 部分脚本可能忘记加载新补丁；
- smoke 脚本越来越难读，真正的测试意图被样板代码淹没。

---

## 本次改动

### 1. 新增 `scripts/story-harness.mjs`

集中提供：

- `freshState()`
- `createEngineStub()`
- `createDocumentStub()`
- `loadStoryRuntime()`
- `renderNode()`
- `choicesOf()`
- `goByTarget()`
- `goByText()`
- `present()`
- `assertFlag()`
- `assertClue()`
- `assertItem()`
- `assertSceneContains()`
- `assertNode()`

`loadStoryRuntime()` 会自动执行：

```text
story.js → main.js → patch-loader 发现到的所有 src/v*.js → DOMContentLoaded handlers
```

也就是说，测试脚本不再需要手写补丁列表。

---

## 已迁移脚本

本阶段先迁移三类重复度最高的 smoke 脚本：

```text
scripts/smoke-evidence.mjs
scripts/smoke-evidence-polish.mjs
scripts/smoke-narrative-depth.mjs
```

迁移后，这些脚本只保留测试意图：

- 出示哪个证据；
- 预期跳到哪个节点；
- 预期写入哪些 flag / clue；
- 剧情路线应自然分流到哪个结局。

---

## 暂未迁移的脚本

本 PR 暂不迁移：

```text
scripts/validate-story.mjs
scripts/smoke-routes.mjs
scripts/check-patch-loading.mjs
```

原因：

- `validate-story.mjs` 是结构性全图扫描，逻辑比 smoke test 更复杂；
- `smoke-routes.mjs` 覆盖基础路线，可在下一轮单独迁移；
- `check-patch-loading.mjs` 本身就是补丁加载一致性检查，保留独立性更清晰。

---

## 后续建议

### Phase 2B

继续迁移：

```text
scripts/smoke-routes.mjs
```

### Phase 2C

最后评估是否迁移：

```text
scripts/validate-story.mjs
```

如果迁移成本过高，可以只让它复用 `patch-loader.mjs`，不强行抽完整 harness。

### Phase 3

开始把稳定补丁逐步回填到 `story.js`，推荐顺序：

1. `v0.6.1-fixes.js`
2. `v0.6.2-evidence.js`
3. `v0.6.3-evidence-polish.js`
4. `v0.7-narrative-depth.js`
5. `main.js` 中的大型节点覆盖
