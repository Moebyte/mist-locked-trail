# v1 Refactor Progress Checkpoint

This document tracks the actual progress of `v1_refactor` against `docs/v1-refactor-framework.md`.

The framework remains the source of truth for phase order and migration discipline. This checkpoint only records what has already been completed and what the next safe step is.

## Current branch

```text
v1_refactor
```

## Completed phases and milestones

### Phase 0 — framework documents

Status: complete.

Completed documents:

```text
docs/v1-refactor-framework.md
docs/story-js-split-plan.md
docs/styles-split-plan.md
```

### Phase 1 — split `styles.css`

Status: complete.

`src/styles.css` has been reduced to an import-style entry, with style layers moved into:

```text
src/styles/base.css
src/styles/theme.css
src/styles/layout.css
src/styles/scene.css
src/styles/choices.css
src/styles/panel.css
src/styles/modals.css
src/styles/responsive.css
src/styles/effects.css
```

### Phase 2 — chapter loading scaffold

Status: complete.

Chapter loading now uses:

```text
src/story-chapters/index.js
src/story-modules.js
```

Chapter modules can register nodes into the shared `nodes` registry.

### Phase 3 — endings migration

Status: runtime takeover complete.

Endings have been moved into:

```text
src/story-chapters/endings.js
src/story-chapters/endings-contract.js
```

Runtime ending audit is available through:

```text
scripts/check-story-endings.mjs
scripts/audit-story-endings.mjs
```

### Phase 4 — low-risk chapter migration

Status: partially complete.

Completed:

```text
src/story-chapters/chapter-1-opening.js
src/story-chapters/chapter-1-opening-contract.js
```

Chapter 2 has moved beyond runtime takeover and has completed physical removal from `src/story.js`.

Migrated Chapter 2 files:

```text
src/story-chapters/chapter-2-university-entry.js
src/story-chapters/chapter-2-university-entry-contract.js
src/story-chapters/chapter-2-home-xuehua.js
src/story-chapters/chapter-2-home-xuehua-contract.js
src/story-chapters/chapter-2-home-entry.js
src/story-chapters/chapter-2-home-entry-contract.js
src/story-chapters/chapter-2-home-fixed.js
src/story-chapters/chapter-2-home-fixed-contract.js
src/story-chapters/chapter-2-home-talk.js
src/story-chapters/chapter-2-home-talk-contract.js
src/story-chapters/chapter-2-leave-home.js
src/story-chapters/chapter-2-leave-home-contract.js
src/story-chapters/chapter-2-police-dynamic.js
src/story-chapters/chapter-2-police-dynamic-contract.js
src/story-chapters/chapter-2-frenchtown-entry.js
src/story-chapters/chapter-2-frenchtown-entry-contract.js
src/story-chapters/chapter-2-frenchtown-tail.js
src/story-chapters/chapter-2-frenchtown-tail-contract.js
src/story-chapters/chapter-2-building-enter.js
src/story-chapters/chapter-2-building-enter-contract.js
src/story-chapters/chapter-2-xuehua-203.js
src/story-chapters/chapter-2-xuehua-203-contract.js
```

Physical removal result:

```text
src/story.js: -619 lines
```

Post-removal guard:

```text
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

The second script is now an idempotent regression check. It should report that no migrated Chapter 2 node definitions remain in `src/story.js`.

## Current gate setup

### Lightweight migration gate

Used by GitHub Actions:

```text
.github/workflows/story-refactor-check.yml
```

Runs:

```bash
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

This gate is intentionally narrow and focused on migration safety.

### Full refactor health check

Available but not used as the routine migration blocker:

```bash
node scripts/check-story-refactor-full.mjs
```

Also available in GitHub Actions:

```text
.github/workflows/story-refactor-full-check.yml
```

This full check includes the Chapter 3 pre-migration audit.

## Current next step

Next phase: Phase 5 pre-migration audit for Chapter 3.

Do not migrate Chapter 3 nodes yet. First run and review:

```bash
node scripts/audit-story-chapter3.mjs
```

Audit details are documented in:

```text
docs/chapter3-migration-audit.md
```

Purpose:

```text
1. list remaining ch3_* nodes in src/story.js;
2. identify runtime patch sources;
3. classify risk by effect / onPresent / dynamic choices / hub behavior;
4. recommend migration batches;
5. decide the first small batch before any runtime takeover.
```

## Chapter 3 migration rule

Chapter 3 belongs to Phase 5 high-risk migration in the framework.

Before moving any `ch3_*` node:

```text
1. confirm patch sources;
2. define the target chapter file, likely src/story-chapters/chapter-3-guanghua.js;
3. add a focused runtime audit for the selected batch;
4. keep legacy story.js definitions until runtime takeover passes;
5. only then consider physical removal for that batch.
```

No direct Chapter 3 physical deletion should happen without a Chapter 3 removal script and a focused Chapter 3 migration gate.
