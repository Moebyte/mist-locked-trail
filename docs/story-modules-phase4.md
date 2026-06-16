# Phase 4：故事模块最终归宿

## 结论

当前阶段不再使用 `patches.js` 作为入口。

故事增强内容的正式入口是：

```text
src/story-modules.js
```

它是浏览器端唯一的故事模块入口，按依赖顺序加载稳定故事模块。

Phase 6 之后，稳定模块已经迁入：

```text
src/story-modules/
```

---

## 当前模块清单

```text
src/story-modules/consistency.js
src/story-modules/evidence.js
src/story-modules/evidence-polish.js
src/story-modules/narrative-depth.js
src/story-modules/ui-responsive.js
```

含义如下：

| 模块 | 职责 |
|---|---|
| `consistency.js` | 修复主线叙事一致性，例如傅启元对峙是否出现老孙支援 |
| `evidence.js` | 关键举证交互，例如沈玉芳、傅启元举证 |
| `evidence-polish.js` | 举证体验润色，例如老孙行动举证、周明远情感举证 |
| `narrative-depth.js` | 剧情密度增强，例如医院三方冲突、傅启元交易、自然结局分流 |
| `ui-responsive.js` | 响应式布局、正文分页、线索簿分页与主题切换 |

---

## 为什么不直接全部塞回 `story.js`

`story.js` 应逐步回归为基础故事底稿，但当前增强内容仍然承担运行时覆盖职责。

如果一次性全部回填到 `story.js`，风险包括：

- 大量长文本节点容易冲突；
- onPresent 链式举证容易断；
- 结局分流和压力系统可能互相影响；
- 回归测试定位会变难。

因此 Phase 4 先把模块从“补丁语义”升级为“正式模块语义”。Phase 6 再把稳定模块迁入正式目录，形成清晰边界。

---

## 加载顺序

浏览器入口：

```html
<script src="src/engine.js"></script>
<script src="src/story.js"></script>
<script src="src/main.js"></script>
<script src="src/story-modules.js"></script>
```

`story-modules.js` 内部再加载 `src/story-modules/` 下的稳定模块。

Node 测试侧通过 `scripts/story-module-loader.mjs` 读取同一份 `story-modules.js` 清单，保证测试和页面加载口径一致。

---

## 后续建议

后续不再新增 `src/v*.js` 版本补丁。

如果要继续新增内容，优先放入对应稳定模块：

- 一致性修复 → `src/story-modules/consistency.js`
- 举证交互 → `src/story-modules/evidence.js`
- 举证润色 → `src/story-modules/evidence-polish.js`
- 剧情密度 / 结局分流 → `src/story-modules/narrative-depth.js`
- UI / 阅读体验 → `src/story-modules/ui-responsive.js`

如果模块继续变大，再在 `src/story-modules/` 下按领域拆子目录。