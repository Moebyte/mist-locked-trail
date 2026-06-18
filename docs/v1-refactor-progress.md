# v1 Refactor Progress Checkpoint

This document tracks actual progress of `v1_refactor` against `docs/v1-refactor-framework.md`.

The framework remains the source of truth for phase order and migration discipline. This checkpoint records the current safe state and next step.

## Current branch

```text
v1_refactor
```

## Completed phases

```text
Phase 0: framework documents complete
Phase 1: styles.css split complete
Phase 2: chapter loading scaffold complete
Phase 3: endings runtime takeover complete
Phase 4: Chapter 2 runtime takeover and physical removal complete
Phase 5: Chapter 3 high-risk migration in progress
```

## Chapter 3 migration discipline

Chapter 3 must continue to use this sequence:

```text
runtime takeover -> focused runtime gate -> removal dry-run -> physical removal -> workflow收口
```

No direct Chapter 3 deletion should happen without a dedicated removal script and a focused runtime gate.

## Completed Chapter 3 physical removals

These Chapter 3 nodes have completed runtime takeover, focused gate coverage, removal dry-run, physical removal, and workflow收口:

```text
ch3_school_chen_su
ch3_school_weird
ch3_school_yufang
ch3_school_office
ch3_chen_letter
ch3_wu_present_threat
ch3_wu_present_photo
ch3_school_teacher
ch3_school
```

Current `src/story.js` physical removal footprint:

```text
src/story.js: -849 lines
```

## Completed Chapter 3 school hub migration

`ch3_school` has completed runtime takeover, focused runtime gate wiring, removal dry-run, physical removal, and workflow收口.

Files:

```text
src/story-chapters/chapter-3-guanghua.js
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-school-hub-runtime.mjs
scripts/remove-migrated-chapter3-school-hub-from-story.mjs
.github/workflows/chapter3-school-hub-physical-removal.yml
```

## Current Chapter 3 wrapup migration

`ch3_wrapup` has completed runtime takeover, focused runtime gate wiring, removal dry-run guard wiring, and temporary physical-removal workflow creation. The legacy definition remains in `src/story.js` until the workflow completes `--write`, reruns the full check, and commits the deletion.

Files:

```text
src/story-chapters/chapter-3-wrapup.js
src/story-chapters/chapter-3-wrapup-contract.js
scripts/check-story-chapter3-wrapup-runtime.mjs
scripts/remove-migrated-chapter3-wrapup-from-story.mjs
.github/workflows/chapter3-wrapup-physical-removal.yml
```

Behavior note:

```text
ch3_wrapup is affected by many final-flow and ending modules. The focused gate verifies final emitted targets, police/Fusheng/pawnshop/hidden-ending exits, hidden_end_unlocked effect, and closure-route availability without hard-coding a single complete choice list.
```

## Current Chapter 3 gates

Focused runtime gates:

```text
scripts/check-story-chapter3-runtime.mjs
scripts/check-story-chapter3-yufang-runtime.mjs
scripts/check-story-chapter3-office-runtime.mjs
scripts/check-story-chapter3-chen-letter-runtime.mjs
scripts/check-story-chapter3-wu-present-runtime.mjs
scripts/check-story-chapter3-school-teacher-runtime.mjs
scripts/check-story-chapter3-school-hub-runtime.mjs
scripts/check-story-chapter3-wrapup-runtime.mjs
```

Idempotent removal guards:

```text
scripts/remove-migrated-chapter3-first-batch-from-story.mjs
scripts/remove-migrated-chapter3-second-batch-from-story.mjs
scripts/remove-migrated-chapter3-yufang-batch-from-story.mjs
scripts/remove-migrated-chapter3-office-from-story.mjs
scripts/remove-migrated-chapter3-chen-letter-from-story.mjs
scripts/remove-migrated-chapter3-wu-present-from-story.mjs
scripts/remove-migrated-chapter3-school-teacher-from-story.mjs
scripts/remove-migrated-chapter3-school-hub-from-story.mjs
scripts/remove-migrated-chapter3-wrapup-from-story.mjs
```

Manual verification workflows already收口:

```text
.github/workflows/chapter3-first-batch-physical-removal.yml
.github/workflows/chapter3-second-batch-physical-removal.yml
.github/workflows/chapter3-yufang-physical-removal.yml
.github/workflows/chapter3-office-physical-removal.yml
.github/workflows/chapter3-chen-letter-physical-removal.yml
.github/workflows/chapter3-wu-present-physical-removal.yml
.github/workflows/chapter3-school-teacher-physical-removal.yml
.github/workflows/chapter3-school-hub-physical-removal.yml
```

Temporary physical-removal workflow awaiting bot deletion commit:

```text
.github/workflows/chapter3-wrapup-physical-removal.yml
```

## Full refactor health check

Available through:

```bash
node scripts/check-story-refactor-full.mjs
```

This full check includes Chapter 2 route smoke, Chapter 3 runtime gates, and all existing Chapter 3 removal guards.

## Current next step

Next safe step:

```text
Wait for GitHub Actions to run the ch3_wrapup physical-removal workflow and commit the src/story.js deletion.
```

After the bot commit appears:

```text
1. verify the bot commit only removes ch3_wrapup from src/story.js;
2. convert .github/workflows/chapter3-wrapup-physical-removal.yml to manual idempotent verification only;
3. update this checkpoint with the final src/story.js footprint;
4. close out Chapter 3 migration.
```

## Remaining Chapter 3 migration order

```text
1. ch3_wrapup workflow bot deletion commit
2. ch3_wrapup workflow收口
3. Chapter 3 migration closeout
```

`ch3_wrapup` is the final Chapter 3 专项迁移对象.
