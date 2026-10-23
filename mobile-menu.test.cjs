const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const startMarker = 'createParticles();';
const start = html.indexOf(startMarker) + startMarker.length;
const end = html.indexOf('// Show the loader initially', start);
assert.ok(start >= startMarker.length && end > start, 'mobile menu script exists');
const menuScript = html.slice(start, end);

function classList() {
  const classes = new Set();
  return {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
    toggle(name) {
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
  };
}

function setup() {
  const menu = { style: { display: 'none' }, classList: classList() };
  const hamburger = { classList: classList() };
  const timers = new Map();
  let now = 0;
  let nextId = 0;
  const context = vm.createContext({
    document: {
      getElementById(id) {
        assert.equal(id, 'mobileMenu');
        return menu;
      },
      querySelector(selector) {
        assert.equal(selector, '.hamburger');
        return hamburger;
      },
    },
    setTimeout(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, time: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  });
  vm.runInContext(menuScript, context);
  return {
    menu,
    hamburger,
    toggle: () => context.toggleMenu(),
    tick(duration) {
      const target = now + duration;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].time - b[1].time)[0];
        if (!next || next[1].time > target) break;
        timers.delete(next[0]);
        now = next[1].time;
        next[1].callback();
      }
      now = target;
    },
  };
}

test('opens the menu after its animation delay', () => {
  const app = setup();
  app.toggle();
  assert.equal(app.menu.style.display, 'block');
  app.tick(10);
  assert.equal(app.menu.classList.contains('show'), true);
  assert.equal(app.hamburger.classList.contains('active'), true);
});

test('closes the menu after the existing transition duration', () => {
  const app = setup();
  app.toggle();
  app.tick(10);
  app.toggle();
  assert.equal(app.menu.classList.contains('show'), false);
  assert.equal(app.hamburger.classList.contains('active'), false);
  app.tick(299);
  assert.equal(app.menu.style.display, 'block');
  app.tick(1);
  assert.equal(app.menu.style.display, 'none');
});

test('reopening during a close transition cancels the stale hide callback', () => {
  const app = setup();
  app.toggle();
  app.tick(10);
  app.toggle();
  app.tick(100);
  app.toggle();
  app.tick(300);
  assert.equal(app.menu.style.display, 'block');
  assert.equal(app.menu.classList.contains('show'), true);
  assert.equal(app.hamburger.classList.contains('active'), true);
});

test('two clicks before the opening delay leave the menu closed', () => {
  const app = setup();
  app.toggle();
  app.toggle();
  app.tick(10);
  assert.equal(app.menu.classList.contains('show'), false);
  assert.equal(app.hamburger.classList.contains('active'), false);
  app.tick(300);
  assert.equal(app.menu.style.display, 'none');
});
