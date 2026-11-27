import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS } from '../src/web/distribute.js';
import { buildStats, playExtent, monitorSeed, MONITOR_CHANNELS } from '../src/web/stats-fixture.js';

const card = (stats, key) => stats.cards.find((item) => item.key === key);

test('统计夹具只覆盖示例账号，卡片和排名能对上', () => {
  const stats = buildStats('2026-11-27T02:00:00.000Z');
  const ids = GROUPS.flatMap((group) => group.accounts.map((account) => account.id));
  assert.deepEqual(stats.accounts.map((account) => account.id), ids);
  assert.ok(stats.accounts.every((account) => account.example === true && account.loggedIn === false && account.fixture === true));
  assert.deepEqual([...new Set(stats.accounts.map((account) => account.platform))].sort(), ['douyin', 'xhs']);
  assert.equal(card(stats, 'fans').value, stats.accounts.reduce((sum, account) => sum + account.fans, 0));
  assert.equal(card(stats, 'fans').accountTotal, stats.accounts.length);
  assert.equal(card(stats, 'fansNet').value, stats.accounts.reduce((sum, account) => sum + account.fansNew, 0));
  assert.equal(card(stats, 'works').value, stats.works.length);
  assert.equal(card(stats, 'playNew').value, stats.works.reduce((sum, work) => sum + work.playNew, 0));
  assert.equal(card(stats, 'likeNew').value, stats.works.reduce((sum, work) => sum + work.likeNew, 0));
  assert.equal(card(stats, 'favoriteNew').value, stats.works.reduce((sum, work) => sum + work.favoriteNew, 0));
  assert.equal(card(stats, 'commentNew').value, stats.works.reduce((sum, work) => sum + work.commentNew, 0));
  assert.equal(card(stats, 'shareNew').value, stats.works.reduce((sum, work) => sum + work.shareNew, 0));
  assert.equal(stats.platforms.reduce((sum, row) => sum + row.play, 0), stats.works.reduce((sum, work) => sum + work.play, 0));
  assert.equal(stats.platforms.reduce((sum, row) => sum + row.fans, 0), card(stats, 'fans').value);
  assert.equal(stats.platforms.reduce((sum, row) => sum + row.accountTotal, 0), stats.accounts.length);
  assert.ok(stats.platforms.every((row, index) => row.rank === index + 1 && row.example === true));
  assert.ok(stats.platforms[0].play >= stats.platforms[1].play);
  assert.ok(stats.accounts.some((account) => account.play == null));
  assert.equal(stats.accounts.some((account) => account.play === 0), false);
  assert.deepEqual(playExtent(stats.works), { high: 900, low: 360 });
  assert.equal(stats.works.every((work) => work.series.reduce((sum, n) => sum + n, 0) === work.playNew), true);
});

test('监控渠道默认都不接通，订单夹具标明不是真实订单', () => {
  const stats = buildStats();
  assert.ok(MONITOR_CHANNELS.every((channel) => channel.connected === false));
  assert.equal(monitorSeed().notices[0].delivered, false);
  assert.equal(stats.orders.demo, true);
  assert.match(stats.orders.note, /不是真实订单/);
  assert.equal(stats.orders.amount, stats.orders.rows.reduce((sum, row) => sum + row.amount, 0));
  assert.equal(stats.orders.orders, stats.orders.rows.reduce((sum, row) => sum + row.orders, 0));
  assert.equal(stats.windowGoods.length, 2);
  assert.match(JSON.stringify(stats), /未计入|测试夹具/);
  for (const word of ['password', 'cookie', 'token', 'webhook', 'proxy']) assert.equal(JSON.stringify(stats).toLowerCase().includes(word), false, word);
});
