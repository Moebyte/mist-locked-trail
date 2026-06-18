// URLSearchParams is available in browsers, but some VM-based test harnesses may omit it.
// Keep this module before dev-mode-panel.js in story-modules.js.
(function installUrlSearchParamsPolyfill() {
  if (typeof globalThis === 'undefined') return;
  if (typeof globalThis.URLSearchParams !== 'undefined') return;

  globalThis.URLSearchParams = class URLSearchParamsPolyfill {
    constructor(search = '') {
      this.map = new Map();
      const raw = String(search || '').replace(/^\?/, '');
      if (!raw) return;
      for (const pair of raw.split('&')) {
        if (!pair) continue;
        const [rawKey, rawValue = ''] = pair.split('=');
        const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
        const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
        if (!this.map.has(key)) this.map.set(key, []);
        this.map.get(key).push(value);
      }
    }

    get(name) {
      const values = this.map.get(String(name));
      return values && values.length ? values[0] : null;
    }

    has(name) {
      return this.map.has(String(name));
    }
  };
})();
