# Phase 6：模块目录化与边界定型

## 背景

Phase 4 将浏览器入口从 `src/patches.js` 升级为正式的 `src/story-modules.js`。

Phase 5 将测试、CI 和加载器从 `patch` 语义收束为 `story module` 语义。

Phase 6 进一步解决模块文件平铺在 `src/` 根目录的问题，让项目结构更清晰。

---

## 本次调整

将原来平铺在 `src/` 下的稳定故事模块：

```text
src/story-consistency.js
src/story-evidence.js
src/story-evidence-polish.js
src/story-narrative-depth.js
src/story-ui-responsive.js
```

移动到：

```text
src/story-modules/consistency.js
src/story-modules/evidence.js
src/story-modules/evidence-polish.js
src/story-modules/narrative-depth.js
src/story-modules/ui-responsive.js
```

`src/story-modules.js` 仍然作为唯一故事模块入口，但它现在只负责加载 `src/story-modules/` 目录下的稳定模块。

---

## Phase 7 后的当前边界

```text
src/engine.js                         基础引擎能力
src/story.js                          基础故事底稿
src/main.js                           运行时主流程
src/story-modules.js                  浏览器端故事模块清单入口
src/story-modules/runtime-contract.js 运行时契约与存档兼容
src/story-modules/                    稳定故事模块目录
scripts/                              自动化校验、烟测、加载器
docs/                                 阶段文档与维护规范
```

---

## 模块职责

| 模块 | 职责 |
|---|---|
| `src/story-modules/runtime-contract.js` | 存档版本号、旧存档迁移、状态结构校验、安全读写 |
| `src/story-modules/consistency.js` | 主线一致性修复，例如傅启元对峙是否出现老孙支援 |
| `src/story-modules/evidence.js` | 关键举证交互，例如沈玉芳、傅启元举证 |
| `src/story-modules/evidence-polish.js` | 举证体验润色，例如老孙行动举证、周明远情感举证 |
| `src/story-modules/narrative-depth.js` | 剧情密度增强，例如医院三方冲突、傅启元交易、自然结局分流 |
| `src/story-modules/ui-responsive.js` | UI、响应式布局、正文分页、线索簿分页、日夜主题 |

---

## 质量门同步

`node scripts/check-story-modules.mjs` 已同步检查目录化后的模块路径。

Phase 7 后还新增：

```bash
node scripts/check-save-compat.mjs
```

用于检查旧存档迁移与状态结构兼容。

---

## 后续规则

后续新增稳定模块时，应优先放入：

```text
src/story-modules/
```

并在：

```text
src/story-modules.js
```

中登记加载顺序。

不要再新增：

```text
src/patches.js
src/v0.x-*.js
scripts/*patch*.mjs
```

---

## 后续可选方向

如果后续模块继续膨胀，可以进入更细颗粒拆分，例如：

```text
src/story-modules/evidence/
  yufang.js
  fu.js
  sun.js
  zhou.js
```

但当前阶段先保持一级目录，避免过度重构。