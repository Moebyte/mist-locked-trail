# 🕵️ 雾锁迷踪 · 全面线路核查报告
> 生成时间: 2026-06-19 20:34:38

## 📊 总览

| 指标 | 数值 |
|------|:----:|
| 节点总数 | 86 |
| 结局数 | 9 |
| 可达节点 | 11/86 |
| 不可达节点 | 75 |
| 死路节点 | 11 |
| 悬空goto | 0 |
| 举证节点 | 7 |
| ≥5选项节点 | 0 |

## ❌ 错误
- 
❌ 死路节点：11个 - ch2_university(eval err), ch2_leave_univ(eval err), ch2_police_file(eval err), ch2_police_alt(eval err), ch2_home(eval err), ch2_home_talk(eval err), ch3_wrapup(eval err), ch4_suzhou_creek(eval err), ch4_dock_wait(eval err), ch4_dock_escape(eval err), ch4_dock_locked_door(eval err)
-   ❌ sun_waybill_convinced: 被读取4次但从未设置！
-   ❌ sun_clearance_convinced: 被读取4次但从未设置！
-   ❌ zhou_understands_wanting: 被读取2次但从未设置！
-   ❌ zhou_accepts_chen_link: 被读取2次但从未设置！

## ⚠️ 警告
- 
⚠️ 不可达节点（75个）：ch2_univ_matron, ch2_univ_door, ch2_univ_paper, ch2_police_alt, ch2_police_wang, ch2_home_talk, ch2_home_photo, ch2_home_ask_photo, ch2_leave_home, ch2_frenchtown

## ℹ️ 详细信息

📊 基础统计：86 个节点（77 普通 + 9 结局）
✅ 所有goto目标有效

📋 结局分析：
  end_refuse: 结局 · 雨不停 → 来源 2 处
  end_too_late: 结局 · 迟到一步 → 来源 2 处
  end_archive: 结局 · 无声归档 → 来源 0 处 ⚠️ 无路径！
  end_boss_lu: 结局 · 面具之下 → 来源 1 处
  end_boss_zhao: 结局 · 提线木偶 → 来源 1 处
  end_boss_wu: 结局 · 师者 → 来源 1 处
  end_rescue: 结局 · 黎明灯火 → 来源 0 处 ⚠️ 无路径！
  end_conspiracy_detail: 结局 · 黎明灯火 → 来源 2 处
  end_conspiracy: 结局 · 迷雾未尽 → 来源 2 处

🏷️ 关键flag核查：
  rescued_su: 设2次 | 读46次
  rescued_yufang: 设3次 | 读45次
  found_su_at_dock: 设1次 | 读34次
  su_moved_from_dock: 设5次 | 读9次
  su_trace_only: 设1次 | 读5次
  missed_deadline: 设11次 | 读18次
  deduced_fusheng: 设2次 | 读34次
  read_letter: 设5次 | 读15次
  sister_case: 设1次 | 读14次
  presented_threat_to_wu: 设3次 | 读12次
  presented_photo_to_wu: 设3次 | 读12次
  presented_note: 设1次 | 读1次
  presented_jade_to_zhou: 设4次 | 读4次
  hidden_end_unlocked: 设1次 | 读1次
  v07_witnesses_protected: 设1次 | 读13次
  v07_lu_confronted: 设1次 | 读5次
  v07_rejected_fu_deal: 设2次 | 读7次
  fu_waybill_exposed: 设3次 | 读15次
  fu_clearance_exposed: 设4次 | 读16次

🔢 选项数量（≥5个的节点）：
  无选项≥5的节点

🔍 举证（onPresent）节点：
  ch2_police: 可出示 [半张烟盒纸]
  ch2_home: 可出示 [苏晚亭的照片]
  ch2_building_enter: 可出示 [法租界地图]
  ch3_school_teacher: 可出示 [恐吓信, 三人合影]
  ch4_revisit_zhou: 可出示 [翡翠镯]
  ch4_dock_who: 可出示 []
  ch4_sun_support: 可出示 []
  共 7 个举证节点

🧩 推理节点：
  deduc_success: 推理 · 拼图合拢
  deduc_fail: 推理 · 岔路
  deduc_lu_zhao_ok: 推理 · 暗线浮出
  deduc_lu_zhao_fail: 推理 · 暗线模糊
  deduc_fusheng_ok: 推理 · 棋局
  deduc_fusheng_fail: 推理 · 无从下手