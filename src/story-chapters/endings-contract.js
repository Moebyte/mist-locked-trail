// ===== 章节剧情：结局运行时契约 =====
// Phase 3b: 验证已迁移结局在运行时可用，且 ID / title / type 不变。

(function installStoryChapterEndingsContract() {
  function applyStoryChapterEndingsContract() {
    if (typeof nodes === 'undefined') return;

    const expectedEndings = {
      end_refuse: '结局 · 雨不停',
      end_archive: '结局 · 无声归档',
      end_too_late: '结局 · 迟到一步',
      end_boss_lu: '结局 · 面具之下',
      end_boss_zhao: '结局 · 提线木偶',
      end_boss_wu: '结局 · 师者',
      end_conspiracy: '结局 · 迷雾未尽',
      end_rescue: '结局 · 黎明灯火',
      end_conspiracy_detail: '结局 · 黎明灯火',
    };

    const errors = [];
    for (const [id, title] of Object.entries(expectedEndings)) {
      const node = nodes[id];
      if (!node) {
        errors.push(`missing migrated ending: ${id}`);
        continue;
      }
      if (node.title !== title) errors.push(`${id} title changed: ${node.title}`);
      if (node.type !== 'end') errors.push(`${id} type changed: ${node.type}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') {
        errors.push(`${id} has no renderable text`);
      }
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_ENDINGS_CONTRACT = {
        ids: Object.keys(expectedEndings),
        titles: expectedEndings,
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/endings] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyStoryChapterEndingsContract);
})();
