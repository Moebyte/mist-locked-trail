# 🕵️ 雾锁迷踪 · 全面线路核查报告
> 生成时间: 2026-06-16 13:41:42

## 📊 总览

| 指标 | 数值 |
|------|:----:|
| 节点总数 | 85 |
| 结局数 | 9 |
| 可达节点 | 37/85 |
| 不可达节点 | 48 |
| 死路节点 | 7 |
| 悬空goto | 0 |
| 举证节点 | 6 |
| ≥5选项节点 | 1 |

## ❌ 错误
- 
❌ 死路节点：7个 - ch2_university(eval err), ch2_home_talk(eval err), ch3_wrapup(eval err), ch4_suzhou_creek(eval err), ch4_dock_wait(eval err), ch4_dock_escape(eval err), ch4_dock_locked_door(eval err)

## ⚠️ 警告
- 
⚠️ 不可达节点（48个）：ch2_univ_matron, ch2_univ_door, ch2_univ_paper, ch4_pawnshop, ch4_revisit_zhou, ch4_zhou_present_jade, ch4_conclusion, ch4_accuse, end_too_late, end_archive
- 
⚠️ 1 个节点选项≥5，需考虑是否合并或分层

## ℹ️ 详细信息

📊 基础统计：85 个节点（76 普通 + 9 结局）
✅ 所有goto目标有效

📋 结局分析：
  end_refuse: 结局 · 雨不停 → 来源 2 处
  end_too_late: 结局 · 迟到一步 → 来源 2 处
  end_archive: 结局 · 无声归档 → 来源 2 处
  end_boss_lu: 结局 · 面具之下 → 来源 1 处
  end_boss_zhao: 结局 · 提线木偶 → 来源 1 处
  end_boss_wu: 结局 · 师者 → 来源 1 处
  end_rescue: 结局 · 雨夜灯火 → 来源 0 处 ⚠️ 无路径！
  end_conspiracy_detail: 结局 · 雨夜灯火 → 来源 2 处
  end_conspiracy: 结局 · 迷雾未尽 → 来源 2 处

🏷️ 关键flag核查：
  rescued_su: 设2次 | 读11次
  rescued_yufang: 设3次 | 读6次
  found_su_at_dock: 设2次 | 读6次
  su_moved_from_dock: 设2次 | 读6次
  su_trace_only: 设2次 | 读4次
  missed_deadline: 设8次 | 读8次
  deduced_fusheng: 设3次 | 读5次
  read_letter: 设3次 | 读1次
  sister_case: 设1次 | 读2次
  presented_threat_to_wu: 设1次 | 读1次
  presented_photo_to_wu: 设1次 | 读1次
  presented_note: 设1次 | 读1次
  presented_jade_to_zhou: 设1次 | 读1次
  hidden_end_unlocked: 设1次 | 读1次
  v07_witnesses_protected: 设1次 | 读4次
  v07_lu_confronted: 设1次 | 读2次
  v07_rejected_fu_deal: 设1次 | 读2次
  fu_waybill_exposed: 设1次 | 读3次
  fu_clearance_exposed: 设1次 | 读3次
  sun_waybill_convinced: 设1次 | 读2次
  sun_clearance_convinced: 设1次 | 读2次
  zhou_understands_wanting: 设1次 | 读2次
  zhou_accepts_chen_link: 设1次 | 读2次

🔢 选项数量（≥5个的节点）：
  ch4_conclusion (真相的边缘): 6个选项

🔍 举证（onPresent）节点：
  ch2_police: 可出示 [半张烟盒纸]
  ch2_home: 可出示 [苏晚亭的照片]
  ch3_school_teacher: 可出示 [恐吓信, 三人合影]
  ch4_revisit_zhou: 可出示 [翡翠镯]
  ch4_dock_who: 可出示 []
  ch4_sun_support: 可出示 []
  共 6 个举证节点

🧩 推理节点：
  deduc_success: 推理 · 拼图合拢
  deduc_fail: 推理 · 岔路
  deduc_lu_zhao_ok: 推理 · 暗线浮出
  deduc_lu_zhao_fail: 推理 · 暗线模糊
  deduc_fusheng_ok: 推理 · 棋局
  deduc_fusheng_fail: 推理 · 无从下手