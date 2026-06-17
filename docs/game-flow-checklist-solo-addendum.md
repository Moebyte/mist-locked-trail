# 《雾锁迷踪》SOLO 线流程核查增补

> 说明：上一版 `docs/game-flow-checklist.md` 漏写了 SOLO 线。本增补专门用于核查“独自行动”路线。
>
> SOLO 线不是简单的“没有老孙支援”，而是一条独立流程：**不找支援 → 独自从东侧窗户潜入 → 自己处理巡灯 → 孤身撤离 → 医院无人守门 → 影响医院压力、证人稳定度和结局质量**。

---

## 0. SOLO 线定位

| 项目 | 内容 | 实现状态 |
|---|---|---|
| 路线名称 | SOLO / 孤身码头线 / 不找支援独自潜入 | 🧪 待核查 |
| 所属阶段 | 福生仓行动与医院后续 | 🧪 待核查 |
| 核心差异 | 没有便衣、没有老孙封路、没有医院后门守卫，玩家必须自己处理潜入、撤离和医院控场 | 🧪 待核查 |
| 主要风险 | 暴露增加、拖延增加、撤离紧张度增加、医院压力增加、证人稳定度下降 | 🧪 待核查 |

SOLO 线应与以下路线并列：

| 路线 | 入口 | 特点 | 实现状态 |
|---|---|---|---|
| 老孙快速支援 | 说服老孙，只带一个便衣 | 快，但人手少 | 🧪 待核查 |
| 老孙完整支援 | 调齐人手 | 稳，但慢，容易惊动对方 | 🧪 待核查 |
| SOLO 独自潜入 | 不找支援，独自从东侧窗户潜入 | 快，但无人掩护，后果由玩家独自承担 | 🧪 待核查 |

---

## 1. SOLO 入口

### 1.1 入口文案

玩家在福生仓外或傅启元/陆念薇观察后，应能看到明确 SOLO 选项：

```text
🔦 不找支援，独自从东侧窗户潜入
```

核查点：

| 核查项 | 预期结果 | 实现状态 |
|---|---|---|
| 选项文案明确包含“不找支援/独自” | 玩家能清楚知道这是 SOLO 线，不会误以为是普通潜入 | 🧪 待核查 |
| 点击后设置 `dock_force_solo_entry` | 后续路由强制识别为 SOLO | 🧪 待核查 |
| 点击后设置 `dock_solo_entry_requested` | 记录玩家主动选择 SOLO | 🧪 待核查 |
| 点击后清除老孙/便衣支援 flag | 防止 SOLO 被误判为支援线 | 🧪 待核查 |
| 路由进入 `ch4_dock_solo_infiltration` | 不应进入普通 `ch4_dock_full_search` 或支援线入口 | 🧪 待核查 |

需要清除的支援 flag 包括：

```text
sun_fast_support
sun_fast_support_active
sun_fast_cover_escape
dock_fast_support_entry
sun_full_support
sun_wait_support
sun_support_in_action
dock_full_support_entry
dock_full_support_tradeoff
dock_blockade_record
```

---

## 2. SOLO 潜入阶段

### 2.1 独自潜入入口

进入节点：

```text
ch4_dock_solo_infiltration
```

应有后续选项：

```text
🔦 贴近东窗，先看清守卫巡灯
```

核查点：

| 核查项 | 预期结果 | 实现状态 |
|---|---|---|
| 进入 SOLO 专属潜入节点 | 标题/文本应体现无人支援 | 🧪 待核查 |
| 点击后进入 `ch4_dock_solo_window_crisis` | 不应直接进入普通仓库搜索 | 🧪 待核查 |

### 2.2 东窗巡灯危机

进入节点：

```text
ch4_dock_solo_window_crisis
```

场景含义：玩家独自攀上东侧窗框，后门手电扫过来。因为无人看风，必须自己处理巡灯。

应有三个选择：

| 选项 | flag/效果 | 风险含义 | 实现状态 |
|---|---|---|---|
| `🤫 压低身子，等巡灯从窗框上移开` | `dock_solo_waited_patrol` | 暴露较低，但拖延增加 | 🧪 待核查 |
| `🧺 扯一块油布挡住窗影，马上翻进去` | `dock_solo_window_screen` | 小幅增加暴露，但节省时间 | 🧪 待核查 |
| `⚠️ 不停下来，趁装车声直接翻进仓库` | `dock_solo_forced_window` | 暴露明显增加，但最快 | 🧪 待核查 |

核查点：

| 核查项 | 预期结果 | 实现状态 |
|---|---|---|
| 三个选项都能进入后续仓库搜索 | 应通过 `routeDockSearchByTime()` 分流 | 🧪 待核查 |
| `dock_solo_waited_patrol` 增加拖延分 | 影响 `dockDelayScore()` | 🧪 待核查 |
| `dock_solo_window_screen` 增加暴露分 | 影响 `dockExposureScore()` | 🧪 待核查 |
| `dock_solo_forced_window` 增加更高暴露分 | 影响 `dockExposureScore()` | 🧪 待核查 |
| 文本显示潜入风险 badge | 应能看到暴露/拖延提示 | 🧪 待核查 |

---

## 3. SOLO 仓库搜索与救人

SOLO 进入仓库后，主体搜索逻辑仍应复用福生仓现场分流，但核查时要确认它没有误吃支援线 flag。

| 搜索结果 | SOLO 下预期 | 实现状态 |
|---|---|---|
| safe | 仍可完整搜查，有机会找到苏晚亭和沈玉芳 | 🧪 待核查 |
| tight | 可能只能找到沈玉芳和苏晚亭刚被转走的痕迹 | 🧪 待核查 |
| critical | 只够救人/只拿痕迹，证据弱 | 🧪 待核查 |
| expired | 福生仓清场，SOLO 线应退化为迟到结局或低质量结案 | 🧪 待核查 |

关键核查：

| 核查项 | 预期结果 | 实现状态 |
|---|---|---|
| SOLO 不应自动获得老孙支援 | 不应出现老孙封路、便衣亮身份等文本 | 🧪 待核查 |
| SOLO 仍能拿教具箱证据 | 可获得 `教具箱走私`、`管制药品走私`、`光华货运单`、`铁钎` | 🧪 待核查 |
| SOLO 仍能开暗门 | 可进入暗室并救人/发现痕迹 | 🧪 待核查 |
| SOLO 的暴露/拖延会影响后续风险 | 不是纯文本变化 | 🧪 待核查 |

---

## 4. SOLO 撤离阶段

### 4.1 撤离判断节点

SOLO 模式下，`ch4_dock_exit_assess` 的选择应被替换为 SOLO 专属撤离选项。

应有四个选择：

| 选项 | flag/效果 | 后果 | 实现状态 |
|---|---|---|---|
| `🌫️ 沿水边栈道绕开黑车，先把人带走` | `dock_solo_waterline_escape`，获得线索 `水边栈道撤离` | 低调撤离，但医院压力略增 | 🧪 待核查 |
| `🧱 推倒空木箱挡住车灯，争出几步空隙` | `dock_solo_crate_screen`，加 heat，获得线索 `木箱遮灯撤离` | 动静更大，撤离紧张度上升 | 🧪 待核查 |
| `⚠️ 让证人先藏进货车阴影，自己引开视线` | `dock_solo_decoy_escape`，加 heat，获得线索 `孤身引开视线` | 对医院压力和证人稳定有负面影响 | 🧪 待核查 |
| `⚠️ 站到车灯前，当场拿出货运单和清场指令` | `dock_solo_hard_confront`、`dock_fast_confront_hard_evidence`、`dock_confront_fu`，大幅加 heat | 可能进入 `end_dock_silenced`，否则进入傅启元对峙 | 🧪 待核查 |

关键核查：

| 核查项 | 预期结果 | 实现状态 |
|---|---|---|
| SOLO 撤离时不应出现“老孙的人亮明身份” | 因为玩家没有支援 | 🧪 待核查 |
| 水边撤离能直接到 `ch4_dock_escape_finish` | 低调但不是无代价 | 🧪 待核查 |
| 木箱遮灯应增加 heat | 后续结局质量可能下降 | 🧪 待核查 |
| 自己引开视线应影响医院压力/证人稳定 | 不应只是加一条线索 | 🧪 待核查 |
| 孤身硬对峙可能触发灭口结局 | `fuWillSilenceAtDock()` 为真时进入 `end_dock_silenced` | 🧪 待核查 |

---

## 5. SOLO 医院阶段

SOLO 撤离后进入医院时，应表现为：后门没有便衣，巷口没有巡捕，病房外没有老孙的人。玩家只能依靠医院内部控场。

### 5.1 医院分诊节点

节点：

```text
ch4_hospital_triage
```

SOLO 模式下文本应额外提示：

```text
你这时才真正感觉到孤身行动的代价：后门没有便衣，巷口没有巡捕，病房外也没有老孙的人。
```

应有四个选择：

| 选项 | flag/效果 | 后果 | 实现状态 |
|---|---|---|---|
| `🛏️ 先把证人送进病房，压低声音等医生` | `hospital_triage_settle_witness`，获得线索 `医院后门安置` | 稳定证人，低调 | 🧪 待核查 |
| `🚪 托值夜护士锁住后门，先别让外人进来` | `hospital_triage_solo_lock_backdoor`，获得线索 `护士锁住医院后门` | 降低医院压力，提高控制 | 🧪 待核查 |
| `⚠️ 让周怀安立刻进来认人` | `hospital_triage_zhou_early`，加 heat | 情绪冲击，可能影响证人稳定 | 🧪 待核查 |
| `🚶 直接去走廊面对所有人的争执` | `hospital_triage_direct_corridor`、`hospital_triage_solo_no_guard` | 无守卫、压力上升 | 🧪 待核查 |

### 5.2 医院状态评分

SOLO 线应影响以下评分：

| 评分函数 | SOLO 影响 | 实现状态 |
|---|---|---|
| `hospitalPressureScore()` | 水边撤离、木箱遮灯、引开视线可能增加压力；护士锁后门降低压力；无人守门增加压力 | 🧪 待核查 |
| `hospitalControlScore()` | 护士锁后门提高控制 | 🧪 待核查 |
| `witnessStabilityScore()` | 引开视线降低稳定；护士锁门提高稳定 | 🧪 待核查 |
| `truthCompletenessTier()` | 应与证据完整度联动，不应因 SOLO 自动降为低质量 | 🧪 待核查 |

关键核查：

- SOLO 医院文本是否真的出现。
- SOLO 医院选择是否替换普通医院选择。
- 护士锁后门是否能改善后续证人安全/结局质量。
- 周怀安过早认人是否会造成明显风险，而不是无后果。

---

## 6. SOLO 线对结局的影响

SOLO 不应该天然等于坏结局，但应产生更高风险和更多取舍。

| 情况 | 预期结局倾向 | 实现状态 |
|---|---|---|
| SOLO 低调潜入 + 水边撤离 + 医院锁后门 | 可进入较高质量结局，甚至隐藏结局条件之一 | 🧪 待核查 |
| SOLO 强行翻窗 + 木箱遮灯 + 周怀安过早认人 | 结局质量下降，证人稳定度受损 | 🧪 待核查 |
| SOLO 孤身硬对峙傅启元 | 可能触发 `end_dock_silenced` 或严重降低结局质量 | 🧪 待核查 |
| SOLO 证据充分但没有老孙封锁记录 | 仍能揭露真相，但公开施压能力弱于完整支援线 | 🧪 待核查 |
| SOLO 成功救出苏晚亭/沈玉芳并保护证人 | 应可进入救援/高质量结局 | 🧪 待核查 |

---

## 7. SOLO 线必须统一的 flag

| flag | 含义 | 实现状态 |
|---|---|---|
| `dock_force_solo_entry` | 强制进入 SOLO 路由 | 🧪 待核查 |
| `dock_solo_entry_requested` | 玩家主动选择独自潜入 | 🧪 待核查 |
| `dock_solo_entry` | SOLO 状态识别之一 | 🧪 待核查 |
| `dock_solo_waited_patrol` | 等巡灯，增加拖延 | 🧪 待核查 |
| `dock_solo_window_screen` | 油布遮窗影，增加暴露 | 🧪 待核查 |
| `dock_solo_forced_window` | 强行翻窗，显著增加暴露 | 🧪 待核查 |
| `dock_solo_waterline_escape` | 水边栈道撤离 | 🧪 待核查 |
| `dock_solo_crate_screen` | 木箱遮灯撤离 | 🧪 待核查 |
| `dock_solo_decoy_escape` | 自己引开视线撤离 | 🧪 待核查 |
| `dock_solo_hard_confront` | 孤身硬对峙傅启元 | 🧪 待核查 |
| `hospital_triage_solo_lock_backdoor` | 护士锁后门 | 🧪 待核查 |
| `hospital_triage_solo_no_guard` | 医院无人守门 | 🧪 待核查 |

---

## 8. SOLO 线高危卡点

| 卡点 | 风险描述 | 实现状态 |
|---|---|---|
| SOLO 入口不明显 | 玩家看不出这是独自行动路线 | 🧪 待核查 |
| 支援 flag 残留 | 明明选 SOLO，却被误判成老孙/便衣支援线 | 🧪 待核查 |
| `routeDockByPressure()` 没优先识别 SOLO | 选了独自潜入却进入普通仓库搜索 | 🧪 待核查 |
| `ch4_dock_solo_infiltration` 不存在或无选项 | 进入 SOLO 后卡死 | 🧪 待核查 |
| `routeDockSearchByTime()` 不存在 | 东窗巡灯后三个选项跳转报错 | 🧪 待核查 |
| SOLO 撤离没替换普通撤离 | 出现“老孙的人亮明身份”等不合理选项 | 🧪 待核查 |
| `fuWillSilenceAtDock()` 不存在 | 孤身硬对峙选项报错 | 🧪 待核查 |
| 医院 SOLO 文本未出现 | 玩家感受不到“无人守门”的后果 | 🧪 待核查 |
| 医院评分未联动 | SOLO 选择对结局没有实质影响 | 🧪 待核查 |

---

## 9. 推荐人工核查路线：SOLO 完整线

```text
听雨茶馆
→ 接委托
→ 圣约翰大学补齐大学线索
→ 巡捕房拿王巡官纸条
→ 薛华立路 22 号
→ 搜 203 室
→ 光华小学完成三证物质询
→ 推理陈明远之死
→ 当铺拿翡翠镯
→ 推理黑衣男人与陆小姐
→ 线索整理
→ 去福生仓
→ 不找支援，独自从东侧窗户潜入
→ 贴近东窗，先看清守卫巡灯
→ 三选一测试：等巡灯 / 油布遮影 / 强行翻窗
→ 仓库搜索
→ 查教具箱
→ 开暗门救人
→ 撤离判断
→ 四选一测试：水边撤离 / 木箱遮灯 / 自己引开视线 / 孤身硬对峙
→ 医院分诊
→ 四选一测试：病房安置 / 护士锁门 / 周怀安认人 / 直接走廊争执
→ 结论页
→ 检查结局质量是否受 SOLO 选择影响
```

---

## 10. 无头巡检器应增加的 SOLO 测试

建议在 `tools/game-flow-runner.mjs` 后续增加独立策略：

```bash
node tools/game-flow-runner.mjs --strategy=solo --max-depth=180
```

SOLO 策略应优先选择关键词：

```text
不找支援
独自从东侧窗户潜入
贴近东窗
油布挡住窗影
查教具箱
暗门
沿水边栈道
护士锁住后门
按证据链自然收束
```

并检查以下断言：

| 断言 | 预期 |
|---|---|
| `dock_force_solo_entry === true` | 玩家确实进入 SOLO |
| `sun_fast_support !== true` | 没有便衣线残留 |
| `sun_full_support !== true` | 没有完整支援线残留 |
| 到达过 `ch4_dock_solo_window_crisis` | SOLO 潜入节点有效 |
| 到达过 `ch4_hospital_triage` | SOLO 医院后续有效 |
| 不出现缺失节点错误 | 无硬卡死 |
| 结局质量随 SOLO 选择变化 | SOLO 有实际后果 |

---

## 11. 与主流程清单的关系

这份 SOLO 增补应插入主清单的：

```text
8. 福生仓行动
```

之后，作为：

```text
8A. SOLO 独自码头线
```

并影响：

```text
10. 终局结案与结局
```

中的结局质量判断。
