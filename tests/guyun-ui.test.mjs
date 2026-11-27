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
  const gated = [{ id: 'b', name: '【测试夹具】未核预告', schedule: '', guyun: { review: 'awaiting_user', reviewCn: '待你点头', copy: '不能发', kind: '成片' }, tasks: [{ platform: 'xhs', state: 'scheduled', stateCn: '已定时' }] }];
  assert.equal(rowsFor(gated, 'review')[0].state, 'awaiting_user');
  assert.equal(rowsFor(gated, 'schedule').length, 0);
  assert.equal(rowsFor(gated, 'records').length, 0);
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
    assert.equal(ov.body.distribution.fixture, false);
    assert.equal(ov.body.distribution.connected, false);
    assert.deepEqual(ov.body.distribution.groups, []);
    assert.equal(ov.body.distribution.plan, null);
    assert.deepEqual(ov.body.distribution.records, []);
    assert.equal(ov.body.stats.fixture, false);
    assert.equal(ov.body.stats.cards, undefined);
    assert.equal(ov.body.monitor.fixture, false);
    assert.equal(ov.body.monitor.delivered, false);
    const blocked = await json(port, '/api/action', { method: 'POST', cookie, body: { type: 'metrics' } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.isolated, true);
    const noStats = await json(port, '/api/guyun/stats', { method: 'POST', cookie, body: { op: 'refresh' } });
    assert.equal(noStats.status, 403);
    assert.equal(noStats.body.code, 'no_fixture');
    assert.equal(noStats.body.delivered, false);
    const noSend = await json(port, '/api/guyun/monitor', { method: 'POST', cookie, body: { op: 'notice', feishu: 'https://example.invalid/hook' } });
    assert.equal(noSend.status, 403);
    assert.equal(noSend.body.isolated, true);
    const noFixture = await json(port, '/api/guyun/distribute', { method: 'POST', cookie, body: { mode: 'many-to-one', groupId: 'dy-nishijin', workIds: ['fixture-weave'], schedule: '2026-11-28T02:00:00.000Z', accountIntervalMin: 15, fileIntervalMin: 30, commit: true } });
    assert.equal(noFixture.status, 403);
    assert.equal(noFixture.body.code, 'no_fixture');
    assert.equal(noFixture.body.isolated, true);
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

test('测试夹具单独标明，未过审不能分发，生成的任务只是草稿回写', { timeout: 40000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gyf-'));
  const port = 18794;
  const a = start(dir, port, ['--fixture']);
  try {
    await a.ready;
    const login = await json(port, '/?key=guyun');
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const ov = await json(port, '/api/overview', { cookie });
    assert.equal(ov.body.fixture, true);
    assert.ok(ov.body.episodes.every((e) => e.name.startsWith('【测试夹具】') && e.guyun && e.guyun.fixture === true && e.guyun.sale === false));
    assert.equal(ov.body.site.days.length, 0);
    assert.equal(ov.body.followers.length, 0);
    const review = filterItems(rowsFor(ov.body.episodes, 'review'), { status: 'awaiting_user' });
    assert.equal(review.length, 1);
    assert.equal(review[0].name, '【测试夹具】未核预告');
    assert.equal(ov.body.distribution.connected, false);
    assert.equal(ov.body.distribution.plan, null);
    assert.deepEqual(ov.body.distribution.groups.map((g) => g.name), ['小红书古韵造物', '抖音京都名家西阵织', '抖音古韵西阵织造物']);
    assert.ok(ov.body.distribution.groups.every((g) => g.example === true && g.loggedIn === false && g.accounts.every((account) => account.example === true)));
    const shown = new Set(ov.body.distribution.records.map((r) => r.statusCn));
    for (const s of ['已进草稿', '等人点', '已发布', '失败']) assert.equal(shown.has(s), true, s);
    assert.equal(ov.body.distribution.records.some((r) => r.reason === '示例：未登录，夹具没有提交'), true);
    assert.equal(ov.body.distribution.records.some((r) => r.linkLabel === '示例链接 · 未接入'), true);
    assert.equal(ov.body.stats.fixture, true);
    assert.equal(ov.body.stats.cards.find((card) => card.key === 'fans').value, 2560);
    assert.equal(ov.body.stats.cards.find((card) => card.key === 'works').value, 3);
    assert.equal(ov.body.stats.cards.find((card) => card.key === 'playNew').value, 100);
    assert.ok(ov.body.stats.platforms.every((row) => row.example === true));
    assert.ok(ov.body.stats.accounts.some((account) => account.play == null));
    assert.equal(ov.body.monitor.running, true);
    assert.equal(ov.body.monitor.delivered, false);
    assert.ok(ov.body.monitor.channels.every((channel) => channel.connected === false));
    const refreshed = await json(port, '/api/guyun/stats', { method: 'POST', cookie, body: { op: 'refresh' } });
    assert.equal(refreshed.status, 200);
    assert.equal(refreshed.body.delivered, false);
    assert.equal(refreshed.body.isolated, true);
    assert.notEqual(refreshed.body.updatedAt, '2026-11-27T02:00:00.000Z');
    const stopped = await json(port, '/api/guyun/monitor', { method: 'POST', cookie, body: { op: 'stop' } });
    assert.equal(stopped.status, 200);
    assert.equal(stopped.body.monitor.running, false);
    assert.equal(stopped.body.delivered, false);
    const leaked = await json(port, '/api/guyun/monitor', { method: 'POST', cookie, body: { op: 'notice', webhook: 'https://example.invalid/hook' } });
    assert.equal(leaked.status, 403);
    assert.equal(leaked.body.isolated, true);
    const noted = await json(port, '/api/guyun/monitor', { method: 'POST', cookie, body: { op: 'notice' } });
    assert.equal(noted.body.delivered, false);
    assert.equal(noted.body.monitor.notices[0].delivered, false);
    assert.match(noted.body.monitor.notices[0].text, /没有发到/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8')).feishuWebhook, undefined);
    const blob = JSON.stringify(ov.body);
    for (const s of ['课程站', 'mdldm.club', 'example.com']) assert.equal(blob.includes(s), false);
    const body = { mode: 'many-to-one', groupId: 'dy-nishijin', workIds: ['fixture-weave', 'fixture-preview'], schedule: '2026-11-28T02:00:00.000Z', accountIntervalMin: 15, fileIntervalMin: 30, commit: true };
    const blockedMix = await json(port, '/api/guyun/distribute', { method: 'POST', cookie, body });
    assert.equal(blockedMix.status, 403);
    assert.equal(blockedMix.body.code, 'not_approved');
    assert.equal(blockedMix.body.isolated, true);
    assert.deepEqual(blockedMix.body.tasks, []);
    const sneak = await json(port, '/api/guyun/distribute', { method: 'POST', cookie, body: { publish: true, mode: 'many-to-one', groupId: 'dy-nishijin', workIds: ['fixture-weave'] } });
    assert.equal(sneak.status, 403);
    assert.equal(sneak.body.isolated, true);
    const skip = await json(port, '/api/guyun/review', { method: 'POST', cookie, body: { id: 'fixture-preview', review: 'approved' } });
    assert.equal(skip.status, 400);
    const nod = await json(port, '/api/guyun/review', { method: 'POST', cookie, body: { id: 'fixture-preview', review: 'in_qc' } });
    assert.equal(nod.status, 200);
    const pass = await json(port, '/api/guyun/review', { method: 'POST', cookie, body: { id: 'fixture-preview', review: 'approved' } });
    assert.equal(pass.status, 200);
    const made = await json(port, '/api/guyun/distribute', { method: 'POST', cookie, body: { mode: 'one-to-one', groupId: 'dy-guyun', workIds: ['fixture-weave', 'fixture-tea', 'fixture-album'], schedule: '2026-11-28T02:00:00.000Z', accountIntervalMin: 15, fileIntervalMin: 30, commit: true } });
    assert.equal(made.status, 200);
    assert.equal(made.body.committed, true);
    assert.equal(made.body.plan.isPublic, false);
    assert.equal(made.body.plan.destinationCn, '将入草稿箱');
    assert.ok(made.body.plan.tasks.length > 0);
    assert.ok(made.body.plan.tasks.every((t) => t.isPublic === false && t.destination === 'draft' && t.example === true));
    const again = await json(port, '/api/overview', { cookie });
    assert.equal(again.body.episodes.find((e) => e.id === 'fixture-weave').tasks.length, 0);
    assert.equal(again.body.episodes.find((e) => e.id === 'fixture-preview').guyun.review, 'approved');
    assert.equal(again.body.distribution.records.some((r) => r.seed === false && r.statusCn === '已进草稿' && r.note.includes('没有提交')), true);
    const still = await json(port, '/api/action', { method: 'POST', cookie, body: { type: 'login', platform: 'douyin' } });
    assert.equal(still.status, 403);
    assert.equal(still.body.isolated, true);
    const qc = await json(port, '/api/guyun/distribute', { method: 'POST', cookie, body: { mode: 'even', groupId: 'xhs-guyun', workIds: ['fixture-qc'], schedule: '2026-11-28T02:00:00.000Z', accountIntervalMin: 10, fileIntervalMin: 10, commit: true } });
    assert.equal(qc.status, 403);
    assert.equal(qc.body.code, 'not_approved');
  } finally { await stop(a.child); }
});
