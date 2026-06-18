# Chapter 2 Removal Runbook

This runbook documents the safe path from runtime takeover to physical removal of migrated Chapter 2 nodes from `src/story.js`.

## Current state

Chapter 2 nodes are registered from `src/story-chapters/*` and loaded before later runtime polish modules through `src/story-modules.js`.

The legacy Chapter 2 definitions in `src/story.js` are still present as a migration fallback. They should not be removed by hand.

## Required checks before removal

Run:

```bash
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

The second command is a dry-run. It must report that all migrated Chapter 2 nodes can be removed and must list non-overlapping ranges.

## Perform physical removal

Only after the dry-run and runtime checks pass:

```bash
node scripts/remove-migrated-chapter2-from-story.mjs --write
```

Then immediately run:

```bash
node scripts/check-story-refactor.mjs
node scripts/validate-story.mjs
node scripts/smoke-routes.mjs
node scripts/fuzz-story-states.mjs
```

If optional scripts are not present, run the available subset and rely on the GitHub Actions workflow for the standard refactor checks.

## Do not

- Do not manually delete large ranges from `src/story.js`.
- Do not continue Chapter 3 physical removal until Chapter 2 removal has passed runtime audit.
- Do not treat runtime takeover as physical removal.

## Migration boundary

`remove-migrated-chapter2-from-story.mjs` is responsible only for migrated `ch2_*` node definitions. It must not touch Chapter 1, Chapter 3, Chapter 4, endings, engine code, or runtime polish modules.
