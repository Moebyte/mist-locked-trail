# v0.7 Story Refactor Phase 2B：迁移路线烟测

## 背景

Phase 2A 已经新增 `scripts/story-harness.mjs`，并迁移了：

```text
scripts/smoke-evidence.mjs
scripts/smoke-evidence-polish.mjs
scripts/smoke-narrative-depth.mjs
```

本阶段继续迁移基础路线烟测：

```text
scripts/smoke-routes.mjs
```

该脚本原本自己维护一整套 VM / E / document stub，并且只手动加载到 `v0.6.1-fixes.js`。在 v0.7 之后，这种写法已经有风险：页面加载了完整补丁，但路线测试未必看到完整运行时。

---

## 本次改动

### 1. `smoke-routes.mjs` 使用 `story-harness`

现在脚本通过：

```js
import { loadStoryRuntime } from './story-harness.mjs';
```

统一加载：

```text
story.js → main.js → patch-loader 自动发现的所有 src/v*.js → DOMContentLoaded handlers
```

### 2. 保留原有 6 条路线语义

迁移后仍然覆盖：

1. 早到路线：完整搜证并救出苏晚亭和沈玉芳；
2. 晚到路线：有限搜查，只救沈玉芳，发现苏晚亭刚被转走；
3. 临界路线：只够救沈玉芳，只拿到苏晚亭手表；
4. 超期路线：福生仓清场，只剩残留字条；
5. 有老孙支援路线：傅启元对峙不丢失支援逻辑；
6. 无老孙支援路线：傅启元对峙后仍可撤走。

### 3. 测试意图更清晰

迁移前，脚本前半部分大量是运行时搭建代码；迁移后，主要内容只剩：

- 进入哪个节点；
- 预期压力分支跳到哪里；
- 选择哪个目标节点；
- 校验哪些 flag / clue / item。

---

## 暂未迁移

目前仍暂不迁移：

```text
scripts/validate-story.mjs
scripts/check-patch-loading.mjs
```

原因：

- `validate-story.mjs` 是全图结构扫描，后续可以只复用 patch-loader，不一定强行全量使用 harness；
- `check-patch-loading.mjs` 本身是加载一致性检查，保持独立更清楚。

---

## 后续建议

下一步进入 Phase 2C：

- 评估 `validate-story.mjs` 是否迁移到 harness；
- 或者只将其补丁加载部分改为复用 `patch-loader.mjs`，避免改动过大。

之后即可进入 Phase 3：逐步把稳定补丁回填到 `story.js`。
