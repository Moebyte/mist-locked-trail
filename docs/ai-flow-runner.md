# AI 无头流程巡检器设计

## 目标

这个工具用于让 AI、开发者或 CI 自动跑《雾锁迷踪》的主流程，尽早发现：

- 场景丢失：选项跳到了不存在的 node。
- 按钮失效：选项没有 goto，也没有有效 effect。
- 推理题失效：推理题未登记、答案节点缺失、条件矛盾。
- 死路：非结局节点没有可点击选项。
- 旧补丁残留：例如旧节点名 `ch4_dock_inside` 仍被后加载模块引用。
- 不可达结局：BFS 跑不到的结局需要人工确认是设计如此还是 BUG。

## 为什么先用 Node，而不是 Python

当前游戏逻辑不是纯剧情 JSON，而是大量 JS 函数：

- `nodes.xxx.choices` 是函数。
- `nodes.xxx.effect` 会直接改 `E.state`。
- 多个 `story-modules/*.js` 会在运行时覆盖节点和引擎方法。

如果用 Python，就需要重新实现一套 JS 解释器或把剧情抽象成 JSON，成本高、容易和真实游戏行为不一致。

因此第一版采用零依赖 Node VM：

```bash
node tools/game-flow-runner.mjs
```

它不启动浏览器，只伪造最小 DOM 和 localStorage，然后直接加载现有前端脚本。

## 使用方式

### 跑黄金主线

```bash
node tools/game-flow-runner.mjs --strategy=golden --max-depth=160
```

黄金主线会按关键词优先选择主线选项，目标是模拟一个“认真查案玩家”的完整通关路线。

输出：

```text
tmp/flow-report-golden.json
tmp/flow-report-golden.md
```

### 跑 BFS 广度巡检

```bash
node tools/game-flow-runner.mjs --strategy=bfs --max-depth=80 --max-states=3000
```

BFS 会探索大量分支，用于发现隐藏的缺失节点、死路、错误跳转。

输出：

```text
tmp/flow-report-bfs.json
tmp/flow-report-bfs.md
```

## 报告怎么看

### JSON 报告

AI 优先读 JSON，因为结构稳定：

```json
{
  "summary": {
    "ok": false,
    "errorCount": 1,
    "warningCount": 2,
    "transitionCount": 58
  },
  "errors": [],
  "warnings": [],
  "transitions": []
}
```

重点字段：

- `errors`：必须修。
- `warnings`：可能是设计问题，也可能是未覆盖到的旧逻辑。
- `transitions`：每一步点击从哪个场景到哪个场景。
- `path`：黄金主线实际走过的场景。
- `reachedScenes` / `reachedEndings`：BFS 可达节点和可达结局。

### Markdown 报告

人类快速阅读用：

```text
tmp/flow-report-golden.md
```

## 当前工具能测什么

第一版已经覆盖：

- 加载 `engine.js`、`story.js`、`main.js`。
- 读取 `story-modules.js` 中登记的所有模块。
- 模拟 `DOMContentLoaded`。
- 模拟 `E.start()`、`E.go()`、选项点击。
- 自动回答三道推理题：
  - `deduce_chen` → B
  - `deduce_lu_zhao` → C
  - `deduce_fusheng` → B
- 检查静态字符串 goto 是否存在。
- 检查 deduction success/fail node 是否存在。
- 生成 JSON 和 Markdown 报告。

## 后续增强建议

### 1. 场景快照模式

给每个关键节点生成状态快照，例如：

```json
{
  "scene": "ch3_wrapup",
  "requiredFlags": ["read_letter", "school_wu_three_proofs"],
  "requiredClues": ["恐吓信", "三人合影", "苏晚亭日记残页"]
}
```

这样 AI 可以从任意节点开始测试，不必每次从头跑。

### 2. 流程契约文件

新增：

```text
docs/flow-contract.yaml
```

示例：

```yaml
must_reach:
  - ch3_wrapup
  - ch4_pawnshop
  - ch4_suzhou_creek
  - ch4_conclusion
must_not_missing:
  - ch4_dock_inside
critical_deductions:
  - deduce_chen
  - deduce_lu_zhao
  - deduce_fusheng
```

巡检器根据契约判断是否 PASS。

### 3. AI 修复闭环

推荐流程：

```bash
node tools/game-flow-runner.mjs --strategy=bfs --max-depth=80 --max-states=3000
```

然后把 `tmp/flow-report-bfs.json` 交给 AI：

> 请根据这份流程巡检报告，修复所有 errors，并解释哪些 warnings 是设计如此。

AI 修完后再跑一遍，直到 `summary.ok = true`。

## 注意

这个工具不是浏览器 E2E，不检查 CSS、真实 DOM 排版、移动端点击体验。

它解决的是更底层的问题：

> 剧情状态机有没有卡死？节点有没有丢？推理题能不能打开？主线能不能走到结局？
