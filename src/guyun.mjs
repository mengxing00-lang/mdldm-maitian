// 古韵造物：空工作台。不写入作者示例、粉丝、课程或收入。
//   node src/guyun.mjs                 只在 http://127.0.0.1:8788/?key=guyun
//   node src/guyun.mjs --fixture       另加带「测试夹具」标记的条目，用来点导航和筛选
//   node src/guyun.mjs --reset         清空隔离目录后重来
// 数据默认在 demo 之外的目录，不碰 data/hub.db，也不改仓库根目录的 config.json。
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = process.env.MAITIAN_DEMO_DIR ? path.resolve(process.env.MAITIAN_DEMO_DIR) : path.join(ROOT, 'guyun-data');
const PROJ = path.join(D, 'projects');
const port = Number(process.env.MAITIAN_DEMO_PORT || 8788);
const fixture = process.argv.includes('--fixture');
if (process.argv.includes('--reset')) fs.rmSync(D, { recursive: true, force: true });
fs.mkdirSync(PROJ, { recursive: true });
const cfg = {
  name: '古韵造物', ui: 'guyun', learnLinks: false, demoIsolate: true, fixture, driver: 'direct', keepAlive: [],
  plugin: 'local', pluginDir: path.join(D, 'plugin-disabled'), chromeProfile: path.join(D, 'chrome-profile'),
  web: { port, key: 'guyun', host: '127.0.0.1' }, rootPath: PROJ,
};
fs.writeFileSync(path.join(D, 'config.json'), JSON.stringify(cfg, null, 2));
process.env.MAITIAN_DEMO = '1';
process.env.MAITIAN_BIND = process.env.MAITIAN_BIND || '127.0.0.1';
process.env.MAITIAN_CONFIG = path.join(D, 'config.json');
process.env.MAITIAN_DB = path.join(D, 'hub.db');

const { db, upsertEpisode, setTask, log } = await import('./db.mjs');
await import('./followers.mjs');
if (fixture && !db.prepare('SELECT COUNT(*) AS c FROM episodes').get().c) {
  const at = new Date(Date.now() + 864e5).toISOString();
  const add = (id, name, tasks) => {
    const dir = path.join(PROJ, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'publish.json'), JSON.stringify({ version: 1, id, name, platforms: {} }));
    upsertEpisode({ id, episode: null, name, dir, schedule: at });
    for (const [p, state] of tasks) setTask(id, p, state, '测试夹具', {});
    log(id, '', 'plan', '测试夹具');
  };
  add('fixture-review', '【测试夹具】待审条目', [['xhs', 'awaiting_user'], ['bilibili', 'scheduled']]);
  add('fixture-record', '【测试夹具】发布记录', [['bilibili', 'published']]);
  console.log('已写入测试夹具，不是古韵业务');
}

const { startWeb } = await import('./web.mjs');
const srv = startWeb();
try {
  await new Promise((res, rej) => {
    const onErr = (e) => rej(e);
    srv.once('error', onErr);
    srv.once('listening', () => { srv.off('error', onErr); res(); });
  });
} catch (e) {
  console.error('古韵造物没起来：' + e.message);
  process.exit(1);
}
console.log(`打开 http://127.0.0.1:${port}/?key=guyun （Ctrl+C 退出）`);
