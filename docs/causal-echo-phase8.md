# Phase 8：跨章节因果追溯

## 背景

前几阶段完成了模块入口、目录边界、运行时契约和存档兼容收束。

Phase 8 开始回到玩法体验本身：让早期选择不只影响当前章节，而是在后续章节以人物态度、额外台词和行动方式回响。

目标是让玩家感到：

```text
我几章前说过的话，后来真的回来找我了。
```

---

## 新增模块

```text
src/story-modules/causal-echo.js
```

该模块不改基础故事底稿，而是在模块层追加：

- 深层 flag；
- 新的过渡节点；
- 后续章节文本回响；
- 回响摘要 `E.causalEchoSummary()`。

---

## 本阶段三条因果链

### 1. 周明远委托线

早期选择：

```text
ch1_open：直接接下委托
ch1_ask：先问清楚再接下委托
```

写入：

```text
echo_zhou_quick_trust
echo_zhou_questioned_first
```

后续回响：

```text
ch4_conclusion
```

效果：

- 直接接案：回响为“承诺一路走到这里才真正成立”；
- 先问再接：回响为“当初多问几句，才让线索更早露出裂缝”。

---

### 2. 沈玉兰信任线

早期选择：

```text
ch2_woman_detail：我会尽力把沈玉芳也找出来
ch2_woman_detail：我不能保证，但会记下这条线
```

写入：

```text
echo_yulan_promise
echo_yulan_distance
```

新增过渡节点：

```text
ch2_yulan_promise_echo
ch2_yulan_distance_echo
```

后续回响：

```text
ch4_dock_who_dual
```

效果：

- 承诺线：沈玉芳在福生仓暗室听见你的名字后，先想起姐姐仍在找她；
- 边界线：沈玉芳会先问你当时如何回答沈玉兰，信任来得更慢。

---

### 3. 老孙协作线

早期选择：

```text
ch2_police_present：我信你，之后走私下这条线
ch2_police_present：巡捕房这次还要装不知道吗
```

写入：

```text
echo_sun_private_trust
echo_sun_public_pressure
```

新增过渡节点：

```text
ch2_sun_pressure_echo
```

后续回响：

```text
ch4_sun_support
```

效果：

- 私下默契：老孙更愿意用“不挂巡捕房名头”的方式帮忙；
- 公事压力：老孙仍会帮，但会强调“今晚我可以不装，但也只能做到今晚”。

---

## 回响摘要

新增：

```text
E.causalEchoSummary()
```

返回玩家当前已经形成的深层选择摘要。

这个接口为后续 Phase 9“结局卷宗”预留：结局卷宗可以直接列出玩家本轮调查中的关键因果回响。

---

## 新增测试

新增：

```text
scripts/smoke-causal-echo.mjs
```

Workflow 新增：

```text
Smoke test causal echo
```

覆盖：

- 早期选择是否写入深层 flag；
- 新增回响节点是否可达；
- 后续章节文本是否根据 flag 变化；
- `E.causalEchoSummary()` 是否能返回记录。

---

## 后续扩展规则

新增跨章节因果时，不建议直接散落在剧情节点里。

推荐格式：

```text
早期选择节点
  → 写入 echo_xxx flag
  → 可选过渡节点
  → 后续章节 text / choices 根据 flag 回响
  → smoke-causal-echo.mjs 增加测试
```

命名建议：

```text
echo_<人物或主题>_<选择倾向>
```

例如：

```text
echo_lu_mercy
echo_fu_confronted_early
echo_su_first_priority
```

---

## 不处理内容

Phase 8 不做：

- 结局卷宗；
- 剧情树视图；
- if only 闪回；
- 大规模重写主线。

这些适合放在后续阶段。