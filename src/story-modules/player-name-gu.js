// ===== 玩家称呼统一：顾先生 =====
// 目标：将玩家角色从“沈先生”统一为“顾先生”，避免与其他沈姓角色混淆。

(function installPlayerNameGu() {
  const FROM = '沈先生';
  const TO = '顾先生';

  function replacePlayerName(value) {
    return typeof value === 'string' ? value.replaceAll(FROM, TO) : value;
  }

  function wrapTextFunction(fn) {
    if (typeof fn !== 'function' || fn.__playerNameGuWrapped) return fn;
    const wrapped = function (...args) {
      return replacePlayerName(fn.apply(this, args));
    };
    wrapped.__playerNameGuWrapped = true;
    return wrapped;
  }

  function patchObject(obj, seen = new WeakSet()) {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
    seen.add(obj);

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (typeof value === 'string') {
        obj[key] = replacePlayerName(value);
        continue;
      }

      if (typeof value === 'function' && key === 'text') {
        obj[key] = wrapTextFunction(value);
        continue;
      }

      if (value && typeof value === 'object') {
        patchObject(value, seen);
      }
    }
  }

  function applyPlayerNameGu() {
    if (typeof nodes !== 'undefined') patchObject(nodes);

    // 兜底处理：若后续运行时渲染仍出现旧称呼，在进入 DOM 前统一替换。
    if (typeof E !== 'undefined' && E && !E.__playerNameGuRenderPatched) {
      const originalRender = E.render;
      if (typeof originalRender === 'function') {
        E.render = function (...args) {
          const result = originalRender.apply(this, args);
          document.querySelectorAll('.story, .choices, #story, #choices').forEach((el) => {
            if (el.innerHTML.includes(FROM)) {
              el.innerHTML = el.innerHTML.replaceAll(FROM, TO);
            }
          });
          return result;
        };
        E.__playerNameGuRenderPatched = true;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', applyPlayerNameGu);
})();
