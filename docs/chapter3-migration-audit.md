# Chapter 3 Migration Audit

Chapter 3 belongs to Phase 5 in `docs/v1-refactor-framework.md`, so it must not be migrated as a low-risk batch.

This document records the safe pre-migration process for `ch3_*` nodes.

## Current rule

Do not move or physically remove any `ch3_*` node until the audit output has been reviewed.

Chapter 3 migration must follow this order:

```text
1. audit remaining ch3_* nodes in src/story.js;
2. identify patch sources in src/story-modules/;
3. classify low / medium / high risk nodes;
4. choose one small first batch;
5. add runtime takeover for that batch;
6. add a focused Chapter 3 runtime gate;
7. only then consider physical removal for that selected batch.
```

## Audit command

```bash
node scripts/audit-story-chapter3.mjs
```

The same audit is included in:

```bash
node scripts/check-story-refactor-full.mjs
```

and in GitHub Actions:

```text
Actions → Story Refactor Full Check
```

## What the audit reports

The audit reports each remaining `ch3_*` node in `src/story.js` with:

```text
id
source line range
approximate character footprint
whether it has effect
whether it has onPresent
whether it has dynamic choices
number of goto edges
runtime patch sources
recommended migration batch
```

## Audit findings

The current Chapter 3 surface is smaller than Chapter 2, but it is more risky because `src/story-modules/guanghua-school-flow-polish.js` owns much of the final runtime behavior.

High-risk or patch-owned nodes:

```text
ch3_school                  patched hub choices
ch3_school_teacher          patched onPresent and choices
ch3_school_yufang           patched choices
ch3_school_weird            patched choices
ch3_school_office           patched text/effect/choices
ch3_chen_letter             patched choices
ch3_wu_present_threat       patched effect/choices
ch3_wu_present_photo        patched effect/choices
ch3_wrapup                  patched gate choices; high-risk hub
```

Additional runtime-only nodes are created by `guanghua-school-flow-polish.js` and should not be treated as legacy `story.js` removal candidates:

```text
ch3_school_confront_wu
ch3_wu_present_university
ch3_school_after_confront
```

## Batch meaning

```text
batch-1: low-risk nodes, usually no dynamic choices, no onPresent, no multi-patch ownership
batch-2: medium-risk nodes, possible effect or one patch source, but not a major hub
batch-3: high-risk nodes, dynamic choices, onPresent, hub behavior, or multiple patch sources
```

## Completed first batch

```text
ch3_school_chen_su
```

Reason:

```text
1. no onPresent;
2. no dynamic choices;
3. no known story-modules patch source;
4. not a hub;
5. only writes the localized clue 苏晚亭与陈明远 and flag chen_su_link;
6. choices point back into already-existing Chapter 3 nodes.
```

Target file:

```text
src/story-chapters/chapter-3-guanghua.js
```

Companion files:

```text
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-runtime.mjs
scripts/remove-migrated-chapter3-first-batch-from-story.mjs
```

Status:

```text
runtime takeover complete
focused runtime gate complete
physical removal complete
```

## Selected second batch

```text
ch3_school_weird
```

Reason:

```text
1. no onPresent;
2. no dynamic choices in the legacy base node;
3. not a hub;
4. writes one localized clue: 陈老师与女子争吵;
5. choices are patch-owned by guanghua-school-flow-polish.js, so final runtime choices must be checked after the full module load;
6. physical removal is not allowed until the focused runtime gate passes with the polished choices active.
```

Target file:

```text
src/story-chapters/chapter-3-guanghua.js
```

Companion files:

```text
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-runtime.mjs
```

Status:

```text
runtime takeover complete
focused runtime gate updated
physical removal pending
```

## Next physical removal rule

The next removal script must only target `ch3_school_weird`.

Do not broaden the existing first-batch removal script without renaming or documenting the batch boundary. The safer path is a dedicated second-batch removal script.

## Remaining caution

The next batch after `ch3_school_weird` must be selected from the remaining `ch3_*` nodes after re-running the audit.

Because most remaining Chapter 3 nodes are patch-owned by `guanghua-school-flow-polish.js`, no remaining node should be physically removed until its final runtime behavior has been made explicit in `src/story-chapters/chapter-3-guanghua.js` and covered by `scripts/check-story-chapter3-runtime.mjs`.
