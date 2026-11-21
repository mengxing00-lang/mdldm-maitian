import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import net from 'node:net';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PORT = 18791;

function start(dir) {
  const child = spawn(process.execPath, ['src/demo.mjs'], {
    cwd: ROOT,
    env: { ...process.env, MAITIAN_DEMO_DIR: dir, MAITIAN_DEMO_PORT: String(PORT), MAITIAN_BIND: '127.0.0.1', MAITIAN_DEMO: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let buf = '';
  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('demo 没起来\n' + buf)), 25000);
    const on = (d) => { buf += d; if (buf.includes(`麦田网页：http://127.0.0.1:${PORT}/`)) { clearTimeout(t); resolve(buf); } };
    child.stdout.on('data', on); child.stderr.on('data', on);
    child.on('exit', (c) => { if (!buf.includes(`麦田网页：http://127.0.0.1:${PORT}/`)) { clearTimeout(t); reject(new Error('exit ' + c + '\n' + buf)); } });
  });
  return { child, ready };
}
const stop = (child) => new Promise((resolve) => { if (child.exitCode != null) return resolve(); child.once('exit', () => resolve()); child.kill('SIGTERM'); setTimeout(() => { if (child.exitCode == null) child.kill('SIGKILL'); }, 3000); });

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
const canConnect = (host, port) => new Promise((resolve) => {
  const s = net.connect({ host, port });
  const done = (v) => { s.destroy(); resolve(v); };
  s.setTimeout(800, () => done('timeout'));
  s.on('connect', () => done('open'));
  s.on('error', (e) => done(e.code || 'error'));
});

function listenAddrs(pid, port) {
  const hexPort = port.toString(16).toUpperCase().padStart(4, '0');
  const v4 = [], v6 = [];
  const parse = (file, into, width) => {
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)) {
      const [local, , st] = line.trim().split(/\s+/).slice(1, 4);
      const [ip, p] = local.split(':');
      if (!p || p.toUpperCase() !== hexPort || st !== '0A') continue;
      if (width === 4) {
        const n = Number.parseInt(ip, 16);
        into.push([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255].join('.'));
      } else into.push(ip);
    }
  };
  parse(`/proc/${pid}/net/tcp`, v4, 4);
  parse(`/proc/${pid}/net/tcp6`, v6, 16);
  return { v4, v6 };
}

function ownInodes(pid) {
  const inodes = new Set();
  for (const fd of fs.readdirSync(`/proc/${pid}/fd`)) {
    try {
      const m = fs.readlinkSync(`/proc/${pid}/fd/${fd}`).match(/^socket:\[(\d+)\]$/);
      if (m) inodes.add(m[1]);
    } catch { /* fd 在读取时关掉 */ }
  }
  return inodes;
}
function foreignSockets(pid) {
  const inodes = ownInodes(pid);
  const out = [];
  for (const file of ['tcp', 'tcp6', 'udp', 'udp6']) {
    const p = `/proc/${pid}/net/${file}`;
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').trim().split('\n').slice(1)) {
      const parts = line.trim().split(/\s+/);
      const inode = parts[9];
      if (!inodes.has(inode)) continue;
      const [local, rem] = parts.slice(1, 3);
      const ip = rem.split(':')[0];
      const loop = ip === '00000000' || ip === '0100007F' || /^0{31}1$/.test(ip) || ip === '00000000000000000000000000000000' || ip === '0000000000000000FFFF00000100007F';
      if (!loop) out.push(`${file} ${local} -> ${rem}`);
    }
  }
  return out;
}

test('假数据 demo 只绑 loopback，重启仍在，且拒绝真实动作', { timeout: 60000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-demo-'));
  const a = start(dir);
  try {
    await a.ready;
    const listen = listenAddrs(a.child.pid, PORT);
    assert.deepEqual(listen.v4, ['127.0.0.1']);
    assert.deepEqual(listen.v6, []);
    assert.equal(await canConnect('127.0.0.1', PORT), 'open');
    const ext = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
    if (ext) assert.equal(await canConnect(ext.address, PORT), 'ECONNREFUSED');

    const login = await json(PORT, '/?key=demo');
    assert.equal(login.status, 302);
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    assert.match(cookie, /^mt_key=demo$/);
    const ov = await json(PORT, '/api/overview', { cookie });
    assert.equal(ov.status, 200);
    assert.equal(ov.body.learn, '');
    assert.equal(ov.body.episodes.length, 8);
    assert.equal(ov.body.health.chrome, false);
    const waiting = ov.body.episodes.find((e) => e.id === 'demo-7');
    const planned = ov.body.episodes.find((e) => e.id === 'demo-8');
    assert.equal(waiting.tasks.find((t) => t.platform === 'xhs').state, 'awaiting_user');
    assert.equal(waiting.tasks.find((t) => t.platform === 'bilibili').state, 'scheduled');
    assert.ok(planned.tasks.every((t) => t.state === 'planned'));

    for (const hit of [
      ['/api/action', { type: 'metrics' }],
      ['/api/action', { type: 'login', platform: 'bilibili' }],
      ['/api/action', { type: 'doctor' }],
      ['/api/integrations/feishu/test', { webhook: 'https://example.invalid/hook' }],
      ['/api/integrations/site/test', { base: 'https://example.com' }],
      ['/api/integrations/feishu', { webhook: 'https://example.invalid/hook', login: true }],
    ]) {
      const r = await json(PORT, hit[0], { method: 'POST', cookie, body: hit[1] });
      assert.equal(r.status, 403, hit[0]);
      assert.equal(r.body.isolated, true);
    }
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
    assert.equal(cfg.feishuWebhook, undefined);
    assert.equal(cfg.learnLinks, false);
    assert.equal(cfg.tunnel, undefined);
    const ps = execFileSync('ps', ['-eo', 'args'], { encoding: 'utf8' });
    assert.doesNotMatch(ps, /src\/hub\.mjs/);
    const fds = fs.readdirSync(`/proc/${a.child.pid}/fd`).map((fd) => { try { return fs.readlinkSync(`/proc/${a.child.pid}/fd/${fd}`); } catch { return ''; } }).join('\n');
    assert.doesNotMatch(fds, /google-chrome|Chrome|Cookies|publish-hub|Login Data/i);
    assert.deepEqual(foreignSockets(a.child.pid), []);
    const dbStat = fs.statSync(path.join(dir, 'hub.db'));
    assert.ok(dbStat.size > 0);
  } finally { await stop(a.child); }

  const b = start(dir);
  try {
    await b.ready;
    const login = await json(PORT, '/?key=demo');
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const ov = await json(PORT, '/api/overview', { cookie });
    assert.equal(ov.body.episodes.length, 8);
    const waiting = ov.body.episodes.find((e) => e.id === 'demo-7');
    assert.equal(waiting.tasks.find((t) => t.platform === 'xhs').state, 'awaiting_user');
    assert.equal(waiting.tasks.find((t) => t.platform === 'bilibili').state, 'scheduled');
    assert.deepEqual(foreignSockets(b.child.pid), []);
  } finally { await stop(b.child); }
  assert.notEqual(await canConnect('127.0.0.1', PORT), 'open');
});
