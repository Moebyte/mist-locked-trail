# Phase 7：运行时契约与存档兼容收束

## 背景

Phase 4 到 Phase 6 已经完成：

- 故事模块入口正式化；
- 测试与质量门从 patch 语义收束为 story module 语义；
- 稳定模块迁入 `src/story-modules/` 目录。

接下来最需要保护的是玩家侧数据：存档与运行时状态。

如果后续继续扩展剧情、线索、结局或 UI，但没有明确状态契约，旧存档很容易出现：

- 字段缺失；
- 字段类型变化；
- 旧数组格式无法读取；
- 结局记录丢失；
- 读档失败后污染当前运行状态。

---

## 本次改动

### 1. 新增运行时契约模块

新增：

```text
src/story-modules/runtime-contract.js
```

它负责：

- `saveVersion` 存档版本号；
- `migrateSaveState()` 旧存档迁移；
- `validateStateShape()` 状态结构校验；
- `serializeState()` 安全序列化；
- 包装 `saveGame()`；
- 包装 `loadGame()`；
- 包装 `readSavedEndings()`。

---

## 当前存档版本

```text
saveVersion = 7
```

新存档会自动写入：

```json
{
  "saveVersion": 7
}
```

旧存档没有 `saveVersion` 也可以迁移。

---

## 状态契约字段

当前运行时状态至少包含：

```text
saveVersion
clues
items
contacts
flags
chapter
sceneLog
currentScene
visitedNodes
endings
inGameTime
pressure
weatherIdx
atmosphere
```

其中：

| 字段 | 类型 | 说明 |
|---|---|---|
| `clues` | Array<{name, desc}> | 关键线索 |
| `items` | Array<{name, desc}> | 可出示物品 |
| `contacts` | string[] | 已发现人物 |
| `flags` | object | 剧情判断标记 |
| `sceneLog` | string[] | 足迹记录 |
| `visitedNodes` | object | 节点访问次数 |
| `endings` | Array<{id,title,at}> | 已解锁结局 |
| `inGameTime` | {day,hour,minute} | 案件内时间 |
| `pressure` | {heat,deadline} | 调查压力 |

---

## 迁移策略

`migrateSaveState()` 会：

- 将字符串线索迁移为 `{name, desc}`；
- 将字符串物品迁移为 `{name, desc}`；
- 过滤无效线索、物品、人物；
- 对人物列表去重；
- 保留合法结局记录；
- 修复缺失的 `inGameTime`；
- 修复缺失的 `pressure.deadline`；
- 从 `sceneLog` 回填 `currentScene`；
- 给迁移后的状态写入当前 `saveVersion`。

---

## 新增测试

新增：

```text
scripts/check-save-compat.mjs
```

覆盖：

- 无版本号旧存档；
- 字段类型混乱的部分损坏存档；
- `freshState()` 新状态契约；
- 结局记录保留。

Workflow 新增步骤：

```text
Check save compatibility
```

执行：

```bash
node scripts/check-save-compat.mjs
```

---

## 后续规则

以后新增状态字段时，应遵守：

1. 先给 `freshState()` 增加默认值；
2. 再在 `migrateSaveState()` 中给旧存档补默认值；
3. 如字段参与判断，应在 `validateStateShape()` 中检查；
4. 为旧存档场景补充 `check-save-compat.mjs` 测试；
5. 不直接在读档时 `Object.assign(freshState(), data)` 后跳过迁移。

---

## 不处理的内容

Phase 7 不改：

- 剧情文本；
- 结局分流；
- UI 样式；
- 人物关系图；
- 线索簿分页策略。

本阶段只收束运行时契约和存档兼容。