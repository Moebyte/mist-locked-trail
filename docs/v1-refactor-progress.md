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
src/styles/status.css
src/styles/title.css
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

Completed Chapter 1 runtime takeover:

```text
src/story-chapters/chapter-1-opening.js
src/story-chapters/chapter-1-opening-contract.js
```

Chapter 2 has completed runtime takeover and physical removal from `src/story.js`.

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

Chapter 2 physical removal guard:

```text
scripts/remove-migrated-chapter2-from-story.mjs
```

The script is now an idempotent regression check. It should report that no migrated Chapter 2 node definitions remain in `src/story.js`.

## Phase 5 — Chapter 3 high-risk migration

Status: in progress.

Chapter 3 must continue to use the high-risk migration discipline:

```text
runtime takeover -> focused runtime gate -> removal dry-run -> physical removal -> workflow收口
```

### Completed Chapter 3 physical removals

These Chapter 3 nodes have completed runtime takeover, focused gate coverage, removal dry-run, physical removal, and workflow收口:

```text
ch3_school_chen_su
ch3_school_weird
ch3_school_yufang
ch3_school_office
ch3_chen_letter
```

Current `src/story.js` physical removal footprint:

```text
src/story.js: -748 lines
```

### Completed Chapter 3 Chen letter migration

`ch3_chen_letter` has completed runtime takeover, focused runtime gate alignment, removal dry-run, physical removal, and workflow收口.

Files:

```text
src/story-chapters/chapter-3-guanghua.js
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-chen-letter-runtime.mjs
scripts/remove-migrated-chapter3-chen-letter-from-story.mjs
.github/workflows/chapter3-chen-letter-physical-removal.yml
```

Important behavior note:

```text
ch3_chen_letter is affected by guanghua-school-flow-polish.js,
region-gates.js, and premature-conclusion-polish.js.
The focused gate therefore verifies the owned effect and verifies that all emitted
runtime targets exist, instead of hard-coding a single final outbound pair.
```

### Current Chapter 3 runtime takeover

`ch3_wu_present_threat` and `ch3_wu_present_photo` have completed runtime takeover and focused runtime gate wiring.

Files:

```text
src/story-chapters/chapter-3-guanghua.js
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-wu-present-runtime.mjs
```

Important behavior note:

```text
ch3_wu_present_threat and ch3_wu_present_photo are affected by
guanghua-school-flow-polish.js and guanghua-confront-choice-cleanup.js.
The focused gate verifies the owned effects plus the final emitted runtime targets
after the confrontation cleanup patch rewrites the choices.
```

Legacy definitions remain in `src/story.js`. Do not physically remove them until the runtime gate passes green and a dedicated removal dry-run guard has been added.

### Current Chapter 3 gates and removal guards

Focused runtime gates:

```text
scripts/check-story-chapter3-runtime.mjs
scripts/check-story-chapter3-yufang-runtime.mjs
scripts/check-story-chapter3-office-runtime.mjs
scripts/check-story-chapter3-chen-letter-runtime.mjs
scripts/check-story-chapter3-wu-present-runtime.mjs
```

Idempotent removal guards:

```text
scripts/remove-migrated-chapter3-first-batch-from-story.mjs
scripts/remove-migrated-chapter3-second-batch-from-story.mjs
scripts/remove-migrated-chapter3-yufang-batch-from-story.mjs
scripts/remove-migrated-chapter3-office-from-story.mjs
scripts/remove-migrated-chapter3-chen-letter-from-story.mjs
```

Manual verification workflows already收口:

```text
.github/workflows/chapter3-first-batch-physical-removal.yml
.github/workflows/chapter3-second-batch-physical-removal.yml
.github/workflows/chapter3-yufang-physical-removal.yml
.github/workflows/chapter3-office-physical-removal.yml
.github/workflows/chapter3-chen-letter-physical-removal.yml
```

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

Available through:

```bash
node scripts/check-story-refactor-full.mjs
```

Also available in GitHub Actions:

```text
.github/workflows/story-refactor-full-check.yml
```

This full check currently includes Chapter 3 runtime gates and all existing Chapter 3 removal guards, including the Wu present runtime gate.

## Current next step

Next safe step:

```text
Wait for GitHub Actions to go green on the ch3_wu_present_threat / ch3_wu_present_photo runtime takeover.
```

After that:

```text
1. add a dedicated ch3_wu_present removal script;
2. wire it into check-story-refactor-full.mjs as dry-run only;
3. wait for GitHub Actions green;
4. then enter the physical removal workflow for the two Wu present nodes.
```

Do not physically remove `ch3_wu_present_threat` or `ch3_wu_present_photo` until runtime takeover, focused gate, and removal dry-run have all passed green.

## Remaining Chapter 3 migration order

Recommended remaining order:

```text
1. ch3_wu_present_threat / ch3_wu_present_photo physical removal
2. ch3_school_teacher
3. ch3_school
4. ch3_wrapup
```

Do not migrate `ch3_wrapup` yet. It must remain the final Chapter 3 专项迁移对象.

## Chapter 3 migration rule

Chapter 3 belongs to Phase 5 high-risk migration in the framework.

Before moving any additional `ch3_*` node:

```text
1. confirm patch sources;
2. define the target chapter file;
3. add or update a focused runtime audit for the selected batch;
4. keep legacy story.js definitions until runtime takeover passes;
5. only then consider physical removal for that batch.
```

No direct Chapter 3 physical deletion should happen without a Chapter 3 removal script and a focused Chapter 3 migration gate.
