# 雾锁迷踪 · Mist-Locked Trail

**民国三十七年 · 暮秋 · 上海 — 一桩旧案 · 多条岔路 · 多种结局**

一场发生在1948年深秋上海法租界的文字侦探冒险。私家侦探沈先生接下一桩女学生失踪案，层层深入，牵出光华小学坠楼案与另一桩悬案……

🔗 **在线游玩：** https://moebyte.github.io/mist-locked-trail/

## 玩法

- 纯文字交互 · 分支选择驱动
- 线索收集 · 道具举证 · 三层推理谱
- 迷雾选项 · 时间压力 · 自动存档 · 多结局
- 关系图 · 推理墙 · 福生仓第三幕潜入
- 手机友好 · 离线可用

## 项目结构

```text
index.html        # 页面结构
src/styles.css    # 界面样式与氛围效果
src/engine.js     # 游戏引擎、存档、举证、推理、关系图、时间压力
src/story.js      # 剧情节点、分支、结局
src/main.js       # 启动入口
```

## 本地运行

```bash
# 浏览器直接打开
open index.html

# 或启动简易服务器
python3 -m http.server 8080
```

## 技术栈

静态 HTML/CSS/JavaScript，零外部依赖，可直接部署到 GitHub Pages。

## 许可

MIT
