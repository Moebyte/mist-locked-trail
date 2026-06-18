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

## Batch meaning

```text
batch-1: low-risk nodes, usually no dynamic choices, no onPresent, no multi-patch ownership
batch-2: medium-risk nodes, possible effect or one patch source, but not a major hub
batch-3: high-risk nodes, dynamic choices, onPresent, hub behavior, or multiple patch sources
```

## First batch selection rule

The first Chapter 3 migration batch should be small and boring.

Prefer nodes that satisfy:

```text
risk=low
patchSources=none
onPresent=no
dynamicChoices=no
goto count <= 2
```

Avoid in the first batch:

```text
ch3_wrapup
hub nodes
nodes with deduction or conclusion routing
nodes patched by story-modules
nodes that write core truth flags
```

## Required before runtime takeover

Before adding `src/story-chapters/chapter-3-guanghua.js`, document the selected first batch in this file under `Selected first batch`.

## Selected first batch

Pending audit output.
