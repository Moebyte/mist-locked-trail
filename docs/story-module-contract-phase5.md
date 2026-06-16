# Phase 5：故事模块契约与收束规则

## 背景

Phase 4 已经把项目从 `patches.js` 补丁入口升级为正式的 `story-modules.js` 故事模块入口。

但测试与脚本层仍残留旧命名：

```text
patch-loader.mjs
check-patch-loading.mjs
runPatchScripts
readPatchSources
```

这些名字会误导后续维护者，以为当前系统仍然是“补丁堆”。

Phase 5 的目标是完成工程语义收口，并用 CI 质量门防止项目退回补丁模式。

---

## 本次收口内容

### 1. 正式故事模块加载器

新增：

```text
scripts/story-module-loader.mjs
```

提供正式函数：

```text
listStoryModuleScripts()
runStoryModuleScripts()
readStoryModuleSources()
```

它读取唯一入口：

```text
src/story-modules.js
```

---

### 2. 正式故事模块质量门

新增：

```text
scripts/check-story-modules.mjs
```

检查内容：

- `index.html` 必须加载 `src/story-modules.js`；
- `index.html` 不得加载 `src/patches.js`；
- `src/patches.js` 不得再次出现；
- `src/v*.js` 版本补丁不得再次出现；
- `story-modules.js` 清单必须与 loader 读取结果一致；
- 清单中的每个模块文件必须存在；
- 关键模块函数与节点必须加载成功。

---

### 3. 删除旧补丁脚本

删除：

```text
scripts/patch-loader.mjs
scripts/check-patch-loading.mjs
```

---

### 4. Workflow 更新

`.github/workflows/validate-story.yml` 的第一步从：

```text
Check patch loading consistency
```

改为：

```text
Check story module contract
```

执行：

```bash
node scripts/check-story-modules.mjs
```

---

## 后续规则

后续新增内容不应再使用版本补丁命名。

禁止新增：

```text
src/patches.js
src/v0.x-*.js
scripts/*patch*.mjs
```

推荐归属：

| 类型 | 归属 |
|---|---|
| 一致性修复 | `src/story-consistency.js` |
| 举证交互 | `src/story-evidence.js` |
| 举证润色 | `src/story-evidence-polish.js` |
| 剧情密度 / 结局分流 | `src/story-narrative-depth.js` |
| UI 与阅读体验 | `src/story-ui-responsive.js` |

如模块继续膨胀，再拆成目录：

```text
src/story-modules/consistency.js
src/story-modules/evidence.js
src/story-modules/evidence-polish.js
src/story-modules/narrative-depth.js
src/story-modules/ui-responsive.js
```

但目录化属于下一阶段，不在本次收口中强行移动。