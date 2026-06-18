// ===== 章节剧情：第二章永兴贸易商行入口运行时契约 =====
// Phase 4h: 验证 ch2_building_enter 及其 onPresent 逻辑在运行时可用。

(function installChapter2BuildingEnterContract() {
  function applyChapter2BuildingEnterContract() {
    if (typeof nodes === 'undefined') return;

    const errors = [];
    const node = nodes.ch2_building_enter;

    if (!node) {
      errors.push('missing migrated building entry node: ch2_building_enter');
    } else {
      if (node.title !== '永兴贸易商行') errors.push(`ch2_building_enter title changed: ${node.title}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') {
        errors.push('ch2_building_enter has no renderable text');
      }
      if (typeof node.effect !== 'function') errors.push('ch2_building_enter should keep its effect function');
      if (typeof node.onPresent !== 'function') {
        errors.push('ch2_building_enter should keep its onPresent function');
      } else {
        const originalE = typeof E !== 'undefined' ? {
          getFlag: E.getFlag,
          setFlag: E.setFlag,
        } : null;
        if (originalE) {
          try {
            E.getFlag = (name) => name === 'shown_map_to_landlord' ? false : false;
            E.setFlag = () => {};
            const result = node.onPresent({ name: '法租界地图' }, {});
            if (!result || result.goto !== 'ch2_landlord_map') {
              errors.push('ch2_building_enter onPresent should route 法租界地图 to ch2_landlord_map');
            }
          } catch (error) {
            errors.push(`ch2_building_enter onPresent check threw: ${error.message}`);
          } finally {
            E.getFlag = originalE.getFlag;
            E.setFlag = originalE.setFlag;
          }
        }
      }

      const choices = Array.isArray(node.choices) ? node.choices : [];
      const gotos = choices.map(choice => choice && choice.goto).filter(Boolean);
      for (const goto of ['ch2_203_door', 'ch2_ask_landlord']) {
        if (!gotos.includes(goto)) errors.push(`ch2_building_enter missing goto ${goto}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_BUILDING_ENTER_CONTRACT = {
        ids: ['ch2_building_enter'],
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-building-enter] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2BuildingEnterContract);
})();
