import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import net from 'node:net';
import { filterItems, rowsFor } from '../src/web/guyun-filter.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const AUTHOR = ['用 AI 做一支产品宣传片', '课程站', 'mdldm.club', 'example.com', '飞书'];

function start(dir, port, args = []) {
  const child = spawn(process.execPath, ['src/guyun.mjs', ...args], {
    cwd: ROOT,
    env: { ...process.env, MAITIAN_DEMO_DIR: dir, MAITIAN_DEMO_PORT: String(port), MAITIAN_BIND: '127.0.0.1', MAITIAN_DEMO: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let buf = '';
  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('没起来\n' + buf)), 20000);
    const on = (d) => { buf += d; if (buf.includes(`古韵造物：http://127.0.0.1:${port}/`)) { clearTimeout(t); resolve(buf); } };
    child.stdout.on('data', on); child.stderr.on('data', on);
    child.on('exit', (c) => { if (!buf.includes(`127.0.0.1:${port}`)) { clearTimeout(t); reject(new Error('exit ' + c + '\n' + buf)); } });
  });
  return { child, ready };
}
const stop = (child) => new Promise((resolve) => {
  if (!child || child.exitCode != null) return resolve();
  child.once('exit', () => resolve());
  child.kill('SIGTERM');
  setTimeout(() => { if (child.exitCode == null) child.kill('SIGKILL'); }, 3000);
});
async function json(port, pathname, opts = {}) {
  const r = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: opts.method || 'GET', redirect: 'manual',
    headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.body ? { 'content-type': 'application/json' } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  let body = text; try { body = JSON.parse(text); } catch {}
  return { status: r.status, headers: r.headers, body };
}
const can = (host, port) => new Promise((resolve) => {
  const s = net.connect({ host, port });
  const done = (v) => { s.destroy(); resolve(v); };
  s.setTimeout(800, () => done('timeout'));
  s.on('connect', () => done('open'));
  s.on('error', (e) => done(e.code || 'error'));
});

test('筛选只按状态和名称，空列表仍是空的', () => {
  const eps = [{ id: 'a', name: '【测试夹具】待审条目', schedule: '', tasks: [{ platform: 'xhs', state: 'awaiting_user', stateCn: '待你点发布' }, { platform: 'bilibili', state: 'scheduled', stateCn: '已定时' }] }];
  assert.deepEqual(rowsFor([], 'review'), []);
  assert.equal(filterItems(rowsFor(eps, 'review'), { status: 'awaiting_user' }).length, 1);
  assert.equal(filterItems(rowsFor(eps, 'review'), { q: '不存在' }).length, 0);
  assert.equal(filterItems(rowsFor(eps, 'records'), {}).length, 0);
  assert.equal(rowsFor(eps, 'materials')[0].state, 'material');
});

test('默认古韵界面没有作者示例，未知不是 0，重启仍为空', { timeout: 40000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gy-'));
  const port = 18793;
  const a = start(dir, port);
  try {
    await a.ready;
    assert.equal(await can('127.0.0.1', port), 'open');
    const ext = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
    if (ext) assert.equal(await can(ext.address, port), 'ECONNREFUSED');
    const login = await json(port, '/?key=guyun');
    assert.equal(login.status, 302);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const home = await json(port, '/', { cookie });
    assert.match(home.body, /古韵造物/);
    assert.match(home.body, /guyun\.js/);
    assert.doesNotMatch(home.body, /icon-180/);
    const ov = await json(port, '/api/overview', { cookie });
    assert.equal(ov.body.name, '古韵造物');
    assert.equal(ov.body.ui, 'guyun');
    assert.equal(ov.body.fixture, false);
    assert.equal(ov.body.learn, '');
    assert.equal(ov.body.siteOn, false);
    assert.equal(ov.body.episodes.length, 0);
    assert.equal(ov.body.followers.length, 0);
    assert.equal(ov.body.site.days.length, 0);
    const blob = JSON.stringify(ov.body);
    for (const s of AUTHOR) assert.equal(blob.includes(s), false, s);
    const blocked = await json(port, '/api/action', { method: 'POST', cookie, body: { type: 'metrics' } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.isolated, true);
    assert.doesNotMatch(execFileSync('ps', ['-eo', 'args'], { encoding: 'utf8' }), /src\/hub\.mjs/);
  } finally { await stop(a.child); }
  const b = start(dir, port);
  try {
    await b.ready;
    const login = await json(port, '/?key=guyun');
    const ov = await json(port, '/api/overview', { cookie: login.headers.get('set-cookie').split(';')[0] });
    assert.equal(ov.body.episodes.length, 0);
    assert.equal(ov.body.followers.length, 0);
  } finally { await stop(b.child); }
});

test('测试夹具单独标明，并能筛出待审', { timeout: 30000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gyf-'));
  const port = 18794;
  const a = start(dir, port, ['--fixture']);
  try {
    await a.ready;
    const login = await json(port, '/?key=guyun');
    const ov = await json(port, '/api/overview', { cookie: login.headers.get('set-cookie').split(';')[0] });
    assert.equal(ov.body.fixture, true);
    assert.ok(ov.body.episodes.every((e) => e.name.startsWith('【测试夹具】')));
    assert.equal(ov.body.site.days.length, 0);
    assert.equal(ov.body.followers.length, 0);
    const review = filterItems(rowsFor(ov.body.episodes, 'review'), { status: 'awaiting_user' });
    assert.equal(review.length, 1);
    assert.equal(review[0].name, '【测试夹具】待审条目');
    const blob = JSON.stringify(ov.body);
    for (const s of ['课程站', 'mdldm.club', 'example.com']) assert.equal(blob.includes(s), false);
  } finally { await stop(a.child); }
});
