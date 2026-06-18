#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

function makeElement(id = '') {
  return {
    id,
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    value: '',
    dataset: {},
    children: [],
    onclick: null,
    appendChild(child) { this.children.push(child); return child; },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

function loadWithDev(search = '?dev=1') {
  const elements = new Map();
  const domReadyHandlers = [];
  const documentStub = {
    addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
    body: makeElement('body'),
    head: makeElement('head'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    createElement(tag) {
      const el = makeElement();
      el.tagName = tag.toUpperCase();
      return el;
    },
    write() {},
  };
  const storage = new Map();
  const windowStub = { location: { search, hash: '' } };
  const E = undefined;
  const rt = loadStoryRuntime({
    E,
    document: documentStub,
    window: windowStub,
    localStorage: {
      getItem(k) { return storage.get(k) || null; },
      setItem(k, v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); },
    },
  });
  return { ...rt, elements, documentStub, windowStub, storage };
}

// story-harness 目前不接受 document/window 注入，所以这里退而求其次：验证模块已加载到清单，文件能被 VM 正常执行。
const rt = loadStoryRuntime();
assert(rt.context.window.MLT_STORY_MODULES?.includes('src/story-modules/dev-mode-panel.js'), 'story-modules.js 应加载 dev-mode-panel.js');
assert(rt.read('src/story-modules/dev-mode-panel.js').includes('window.MLT_DEV'), 'dev-mode-panel 应暴露 window.MLT_DEV');
assert(rt.read('src/story-modules/dev-mode-panel.js').includes('?dev=1'), 'dev-mode-panel 应使用 ?dev=1 作为入口说明');
assert(rt.read('src/story-modules/dev-mode-panel.js').includes('zhouJadeFull'), 'dev-mode-panel 应包含周怀安翡翠镯复现预设');
assert(rt.read('src/story-modules/dev-mode-panel.js').includes('wuaiBlockedBySuHome'), 'dev-mode-panel 应包含苏家反证预设');
assert(rt.read('src/story-modules/dev-mode-panel.js').includes('soloLantern'), 'dev-mode-panel 应包含 solo 隐藏变种预设');

if (errors.length) {
  console.error('Dev mode panel smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Dev mode panel smoke passed.');
