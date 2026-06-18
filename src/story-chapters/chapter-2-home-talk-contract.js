(function installChapter2HomeTalkContract() {
  function applyChapter2HomeTalkContract() {
    if (typeof nodes === 'undefined') return;

    const errors = [];
    const node = nodes.ch2_home_talk;

    function withFlag(value, fn) {
      if (typeof E === 'undefined') return null;
      const originalGetFlag = E.getFlag;
      try {
        E.getFlag = (name) => name === 'asked_photo' ? value : false;
        return fn();
      } finally {
        E.getFlag = originalGetFlag;
      }
    }

    function choiceGotos(flagValue) {
      return withFlag(flagValue, () => {
        const raw = typeof node.choices === 'function' ? node.choices({}) : node.choices;
        if (!Array.isArray(raw)) return [];
        return raw.map(choice => choice && choice.goto).filter(Boolean);
      }) || [];
    }

    if (!node) {
      errors.push('missing migrated Su home talk node: ch2_home_talk');
    } else {
      if (node.title !== '母亲的证词') errors.push(`ch2_home_talk title changed: ${node.title}`);
      if (typeof node.text !== 'function' && typeof node.text !== 'string') errors.push('ch2_home_talk has no renderable text');
      if (typeof node.effect !== 'function') errors.push('ch2_home_talk should keep its effect function');
      if (typeof node.choices !== 'function') errors.push('ch2_home_talk should keep dynamic choices');

      const beforePhoto = choiceGotos(false);
      if (!beforePhoto.includes('ch2_home_photo')) errors.push('ch2_home_talk should offer ch2_home_photo before asked_photo');
      if (!beforePhoto.includes('ch2_home')) errors.push('ch2_home_talk should always offer ch2_home');

      const afterPhoto = choiceGotos(true);
      if (afterPhoto.includes('ch2_home_photo')) errors.push('ch2_home_talk should hide ch2_home_photo after asked_photo');
      if (!afterPhoto.includes('ch2_home')) errors.push('ch2_home_talk should still offer ch2_home after asked_photo');
    }

    if (typeof window !== 'undefined') {
      window.MLT_STORY_CHAPTER_2_HOME_TALK_CONTRACT = {
        ids: ['ch2_home_talk'],
        ok: errors.length === 0,
        errors,
      };
    }

    if (errors.length && typeof console !== 'undefined') {
      console.error('[story-chapters/chapter-2-home-talk] contract failed', errors);
    }
  }

  document.addEventListener('DOMContentLoaded', applyChapter2HomeTalkContract);
})();
