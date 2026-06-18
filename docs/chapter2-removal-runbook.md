# Chapter 2 Removal Runbook

This runbook documents the safe path from runtime takeover to physical removal of migrated Chapter 2 nodes from `src/story.js`.

## Current state

Chapter 2 nodes are registered from `src/story-chapters/*` and loaded before later runtime polish modules through `src/story-modules.js`.

The legacy Chapter 2 definitions in `src/story.js` are still present as a migration fallback. They should not be removed by hand.

## Required checks before removal

Run the migration gate:

```bash
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

`check-story-refactor.mjs` is intentionally narrow. It checks the story module manifest and the final Chapter 2 runtime state. It does not run broad save, smoke, or fuzz checks.

The second command is a dry-run. It must report that all migrated Chapter 2 nodes can be removed and must list non-overlapping ranges.

## Optional full check

Use this when you want a broader refactor health check, not as a blocker for routine migration work:

```bash
node scripts/check-story-refactor-full.mjs
```

Save compatibility, route smoke tests, and fuzz tests may still be useful, but they are not part of the Chapter 2 physical-removal gate.

## Perform physical removal

Only after the migration gate and dry-run pass:

```bash
node scripts/remove-migrated-chapter2-from-story.mjs --write
```

Then immediately run:

```bash
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

The second command should fail after physical removal because migrated Chapter 2 nodes are no longer expected to exist in `src/story.js`. At that point, update or retire the removal script so it no longer assumes the legacy fallback is present.

## Do not

- Do not manually delete large ranges from `src/story.js`.
- Do not continue Chapter 3 physical removal until Chapter 2 removal has passed runtime audit.
- Do not treat runtime takeover as physical removal.
- Do not let broad VM/browser mock issues block the focused migration gate.

## Migration boundary

`remove-migrated-chapter2-from-story.mjs` is responsible only for migrated `ch2_*` node definitions. It must not touch Chapter 1, Chapter 3, Chapter 4, endings, engine code, or runtime polish modules.
