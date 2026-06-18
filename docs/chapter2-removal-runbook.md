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

The second command is a dry-run. Before physical removal, it must report that all migrated Chapter 2 nodes can be removed and must list non-overlapping ranges.

The same checks also run in GitHub Actions:

```text
Actions → Story Refactor Migration Gate → Run workflow → v1_refactor
```

## Optional full check

Use this when you want a broader refactor health check, not as a blocker for routine migration work:

```bash
node scripts/check-story-refactor-full.mjs
```

Save compatibility, route smoke tests, and fuzz tests may still be useful, but they are not part of the Chapter 2 physical-removal gate.

## Perform physical removal

Preferred path: use the manual GitHub Actions workflow.

```text
Actions → Chapter 2 Physical Removal → Run workflow → v1_refactor
```

The workflow will:

1. run the migration gate before removal;
2. run the Chapter 2 removal dry-run;
3. execute `node scripts/remove-migrated-chapter2-from-story.mjs --write`;
4. run the migration gate again;
5. verify that the removal script is idempotent after removal;
6. commit the resulting `src/story.js` change back to `v1_refactor`.

Local equivalent:

```bash
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
node scripts/remove-migrated-chapter2-from-story.mjs --write
node scripts/check-story-refactor.mjs
node scripts/remove-migrated-chapter2-from-story.mjs
```

After physical removal, the final command should pass by reporting that no migrated Chapter 2 node definitions remain in `src/story.js`. If only some migrated nodes are missing and others remain, the script treats that as a partial-removal error.

## Do not

- Do not manually delete large ranges from `src/story.js`.
- Do not continue Chapter 3 physical removal until Chapter 2 removal has passed runtime audit.
- Do not treat runtime takeover as physical removal.
- Do not let broad VM/browser mock issues block the focused migration gate.

## Migration boundary

`remove-migrated-chapter2-from-story.mjs` is responsible only for migrated `ch2_*` node definitions. It must not touch Chapter 1, Chapter 3, Chapter 4, endings, engine code, or runtime polish modules.
