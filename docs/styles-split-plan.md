# `src/styles.css` 拆分计划

> 分支：`v1_refactor`  
> 目标：把 1100+ 行的 `src/styles.css` 拆成职责清晰的样式模块。  
> 原则：只拆结构，不改视觉；`index.html` 继续只引用 `src/styles.css`。

---

## 1. 拆分目标

当前 `styles.css` 的问题不是样式多，而是所有职责都堆在一个文件中：

```text
reset
主题变量
白天/夜晚主题
全局背景
标题页
顶部按钮
日志
场景卡片
选项按钮
线索簿面板
推理弹窗
人物关系图弹窗
toast
天气/复古滤镜
桌面端布局
移动端布局
```

最终目标：

```text
src/styles.css 只做 @import 聚合。
```

入口保持不变：

```html
<link rel="stylesheet" href="src/styles.css">
```

---

## 2. 目标文件结构

```text
src/styles.css
src/styles/
  base.css
  theme.css
  layout.css
  title.css
  scene.css
  choices.css
  panel.css
  modals.css
  status.css
  responsive.css
  effects.css
```

其中：

```text
base.css
  reset、html/body 基础、字体、通用隐藏/显示。

theme.css
  :root 变量、theme-day、theme-night、颜色、阴影、纸面变量。

layout.css
  #app、#top-actions、工具按钮、整体容器布局。

title.css
  #title-screen、开始按钮、继续按钮、标题装饰。

scene.css
  #log、.entry、#scene-card、#scene-title、#scene-text。

choices.css
  #choices、.choice-btn、.locked、.choices-grid、.ending-choices、.deduc-btn。

panel.css
  #side-panel、#panel-mask、#panel-body、#panel-head、#panel-content、线索簿列表、卡片。

modals.css
  #deduction-modal、#graph-panel、graph-svg、弹窗内部布局。

status.css
  #status-bar、.stat、toast。

responsive.css
  @media(min-width:1080px)、@media(max-width:1079px)、@media(max-width:640px)。

effects.css
  rainDrop、cardIn、vintage、weather body.w* 相关效果。
```

---

## 3. 目标 `src/styles.css`

最终入口文件应类似：

```css
@import "./styles/base.css";
@import "./styles/theme.css";
@import "./styles/layout.css";
@import "./styles/title.css";
@import "./styles/scene.css";
@import "./styles/choices.css";
@import "./styles/panel.css";
@import "./styles/modals.css";
@import "./styles/status.css";
@import "./styles/responsive.css";
@import "./styles/effects.css";
```

注意：

```text
@import 顺序很重要。
base / theme 必须在最前。
responsive 必须靠后。
effects 可最后。
```

---

## 4. 拆分顺序

不要一次性拆完，按低风险到高风险分批。

### Step 1：抽 theme.css

迁移：

```text
:root
body.theme-day
主题变量
```

风险：低。

验收：

```text
暗色主题正常
白天主题正常
按钮颜色正常
线索簿颜色正常
```

---

### Step 2：抽 base.css

迁移：

```text
* reset
html
body 基础字体 / overflow / min-height
通用 body::before 基础背景
```

风险：低。

---

### Step 3：抽 title.css + layout.css

迁移：

```text
#app
#title-screen
#start-btn
#continue-btn
#top-actions
.tool-btn
```

风险：低到中。

验收：

```text
标题页居中
开始按钮样式不变
顶部工具按钮样式不变
```

---

### Step 4：抽 scene.css + choices.css

迁移：

```text
#log
.entry
#scene-card
#scene-title
#scene-text
#choices
.choice-btn
.ending-choices
.deduc-btn
```

风险：中。

原因：

```text
这是玩家最常看的主界面，视觉偏差容易被感知。
```

---

### Step 5：抽 panel.css + status.css

迁移：

```text
#side-panel
#panel-mask
#panel-body
#panel-head
#panel-content
#status-bar
.toast
```

风险：中。

验收：

```text
线索簿能打开/关闭
桌面端侧边栏正常
移动端底部面板正常
toast 正常显示
```

---

### Step 6：抽 modals.css

迁移：

```text
#deduction-modal
#graph-panel
.graph-svg
```

风险：中。

注意：

```text
index.html 里目前有大量 inline style，第一阶段不动 inline style。
只有已经在 styles.css 里的弹窗样式才迁移。
```

---

### Step 7：抽 responsive.css

迁移：

```text
@media(min-width:1080px)
@media(max-width:1079px)
@media(max-width:640px)
```

风险：中到高。

原因：

```text
移动端布局依赖覆盖顺序，必须最后迁移。
```

---

### Step 8：抽 effects.css

迁移：

```text
@keyframes rainDrop
@keyframes cardIn
body.w0 / body.w1 / weather effects
body.vintage
```

风险：低到中。

---

## 5. 验收清单

每次拆分后人工检查：

```text
标题页
开始按钮 / 继续按钮
顶部工具栏
当前场景卡片
普通选项按钮
锁定选项按钮
线索簿面板
状态栏
toast
推理弹窗
人物关系图弹窗
桌面端 1080px 以上布局
平板布局
手机布局
```

自动化至少运行：

```text
node scripts/check-story-modules.mjs
node scripts/validate-story.mjs
```

说明：CSS 拆分本身不会被剧情 smoke 完整验证，所以需要人工视觉检查。

---

## 6. 禁止事项

```text
禁止拆 CSS 时顺手改 HTML 结构。
禁止拆 CSS 时顺手改 JS。
禁止拆 CSS 时改颜色、字号、边距。
禁止把 responsive 规则提前到基础样式之前。
禁止把 theme 变量放到依赖它们的文件之后。
```

---

## 7. 提交粒度

建议提交：

```text
Split CSS theme variables
Split CSS base and title layers
Split CSS scene and choice layers
Split CSS panel and status layers
Split CSS responsive and effects layers
```

每个提交只迁移一组样式，不做视觉调整。

---

## 8. 后续优化，不在第一轮做

第一轮只是拆分，不做美化。

后续可以单独做：

```text
去掉 index.html 里的 inline modal style
建立统一 button class
建立统一 card / notice / panel component class
减少重复 color-mix
整理移动端状态栏显示规则
```

这些都不能混进第一轮拆分。
