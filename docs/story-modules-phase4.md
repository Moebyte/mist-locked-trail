# Phase 4：故事模块最终归宿

## 结论

当前阶段不再使用 `patches.js` 作为入口。

故事增强内容的正式归宿是：

```text
src/story-modules.js
```

它是浏览器端唯一的故事模块入口，按依赖顺序加载稳定故事模块。

---

## 当前模块清单

```text
src/story-consistency.js
src/story-evidence.js
src/story-evidence-polish.js
src/story-narrative-depth.js
```

含义如下：

| 模块 | 职责 |
|---|---|
| `story-consistency.js` | 修复主线叙事一致性，例如傅启元对峙是否出现老孙支援 |
| `story-evidence.js` | 关键举证交互，例如沈玉芳、傅启元举证 |
| `story-evidence-polish.js` | 举证体验润色，例如老孙行动举证、周明远情感举证 |
| `story-narrative-depth.js` | 剧情密度增强，例如医院三方冲突、傅启元交易、自然结局分流 |

---

## 为什么不直接全部塞回 `story.js`

`story.js` 应逐步回归为基础故事底稿，但当前增强内容仍然承担运行时覆盖职责。

如果一次性全部回填到 `story.js`，风险包括：

- 大量长文本节点容易冲突；
- onPresent 链式举证容易断；
- 结局分流和压力系统可能互相影响；
- 回归测试定位会变难。

因此 Phase 4 先把模块从“补丁语义”升级为“正式模块语义”。后续如需继续收敛，可以按模块逐个回填。

---

## 加载顺序

浏览器入口：

```html
<script src="src/engine.js"></script>
<script src="src/story.js"></script>
<script src="src/main.js"></script>
<script src="src/story-modules.js"></script>
```

`story-modules.js` 内部再加载稳定模块。

Node 测试侧通过 `scripts/patch-loader.mjs` 读取同一份 `story-modules.js` 清单，保证测试和页面加载口径一致。

---

## 后续建议

后续不再新增 `src/v*.js` 版本补丁。

如果要继续新增内容，优先放入对应稳定模块：

- 一致性修复 → `story-consistency.js`
- 举证交互 → `story-evidence.js`
- 举证润色 → `story-evidence-polish.js`
- 剧情密度 / 结局分流 → `story-narrative-depth.js`

如果模块继续变大，再拆为目录结构：

```text
src/story-modules/consistency.js
src/story-modules/evidence.js
src/story-modules/evidence-polish.js
src/story-modules/narrative-depth.js
```

但这属于下一阶段，不在本次 PR 中一次性移动大文件。
