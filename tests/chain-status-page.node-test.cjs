const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const freshSnapshot = (overrides = {}) => ({
  status: 'fresh', observed_at: '2026-09-21T20:00:00.000Z',
  age_seconds: 45, max_age_seconds: 60,
  data: { block_count: 2, transaction_count: 3, latest_block: null },
  ...overrides,
});

async function pageFixture(responses) {
  const source = readFileSync(resolve(__dirname, '../landing-pages/darcloud-blockchain.js'), 'utf8');
  const { default: page } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const response = await page.fetch(new Request('https://blockchain.darcloud.host/'));
  const html = await response.text();
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const listeners = new Map();
  const timers = new Map();
  let time = Date.parse('2026-09-21T20:00:45.000Z');
  let nextTimer = 0;
  const getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', disabled: false,
      addEventListener(event, callback) { listeners.set(id + ':' + event, callback); },
    });
    return elements.get(id);
  };
  const document = {
    getElementById,
    hidden: false,
    addEventListener(event, callback) { listeners.set('document:' + event, callback); },
  };
  const context = vm.createContext({
    document,
    Date: { now: () => time },
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, due: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch: async () => {
      const next = responses.shift();
      if (next instanceof Error) throw next;
      if (!next) throw new Error('Unexpected fetch');
      return { json: async () => next };
    },
  });
  vm.runInContext(script, context);
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  return {
    element: getElementById, timers,
    async clickRefresh() { await listeners.get('refresh:click')(); },
    advance(ms, runTimers = true) {
      time += ms;
      if (!runTimers) return;
      for (const [id, timer] of [...timers]) {
        if (timer.due <= time) { timers.delete(id); timer.callback(); }
      }
    },
    show() { listeners.get('document:visibilitychange')?.(); },
  };
}

test('a displayed fresh observation expires locally using the API age budget', async () => {
  const page = await pageFixture([freshSnapshot()]);
  assert.equal(page.element('status').textContent, 'Ledger observation available');
  page.advance(14_999);
  assert.equal(page.element('status').textContent, 'Ledger observation available');
  page.advance(1);
  assert.equal(page.element('status').textContent, 'Stale ledger observation');
  assert.match(page.element('message').textContent, /historical/);
  assert.equal(page.element('blocks').textContent, '2');
  assert.equal(page.element('observed').textContent, '2026-09-21T20:00:00.000Z');
});

test('refresh replaces the expiry timer and a failed refresh clears previous data', async () => {
  const page = await pageFixture([
    freshSnapshot(), freshSnapshot({ age_seconds: 0, observed_at: '2026-09-21T20:00:50.000Z' }),
    new Error('Offline'),
  ]);
  page.advance(5_000);
  await page.clickRefresh();
  page.advance(10_000);
  assert.equal(page.element('status').textContent, 'Ledger observation available');
  assert.equal(page.timers.size, 1);
  await page.clickRefresh();
  assert.equal(page.element('status').textContent, 'Ledger unavailable');
  for (const id of ['blocks', 'transactions', 'observed', 'latest']) {
    assert.equal(page.element(id).textContent, 'Unavailable');
  }
  assert.equal(page.timers.size, 0);
  page.advance(120_000);
  assert.equal(page.element('status').textContent, 'Ledger unavailable');
});

test('returning to a suspended tab expires an old observation before another fetch', async () => {
  const page = await pageFixture([freshSnapshot()]);
  page.advance(30_000, false);
  page.show();
  assert.equal(page.element('status').textContent, 'Stale ledger observation');
});
