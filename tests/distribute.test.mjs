import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, planDistribution, nextReview, selectableIds } from '../src/web/distribute.js';

const T = '2026-11-28T02:00:00.000Z';
const plus = (m) => new Date(Date.parse(T) + m * 60000).toISOString();
const works = [
  { id: 'a', name: '【测试夹具】甲', review: 'approved', fixture: true },
  { id: 'b', name: '【测试夹具】乙', review: 'approved', fixture: true },
  { id: 'c', name: '【测试夹具】丙', review: 'approved', fixture: true },
  { id: 'd', name: '【测试夹具】丁', review: 'approved', fixture: true },
];
const base = { schedule: T, accountIntervalMin: 15, fileIntervalMin: 30 };
const pair = (plan, workId, accountId) => plan.tasks.find((t) => t.workId === workId && t.accountId === accountId);

test('账号组只是示例名单', () => {
  assert.deepEqual(GROUPS.map((g) => g.name), ['小红书古韵造物', '抖音京都名家西阵织', '抖音古韵西阵织造物']);
  assert.ok(GROUPS.every((g) => g.example === true && g.loggedIn === false && g.accounts.length >= 2 && g.accounts.every((a) => a.example === true)));
  const blob = JSON.stringify(GROUPS).toLowerCase();
  for (const s of ['password', 'cookie', 'token', 'session', 'proxy', 'webhook']) assert.equal(blob.includes(s), false, s);
});

test('多对一：同一条作品发到组里每一个示例账号', () => {
  const group = GROUPS.find((g) => g.id === 'dy-nishijin');
  const plan = planDistribution({ ...base, mode: 'many-to-one', groupId: group.id, works, workIds: ['a', 'b', 'c'] });
  assert.equal(plan.ok, true);
  assert.equal(plan.modeLabel, '多对一');
  assert.equal(plan.isPublic, false);
  assert.equal(plan.destinationCn, '将入草稿箱');
  assert.equal(plan.tasks.length, 6);
  assert.equal(plan.summary.includes('将入草稿箱'), true);
  for (const work of ['a', 'b', 'c']) for (const account of group.accounts) assert.ok(pair(plan, work, account.id), work + account.id);
  assert.equal(pair(plan, 'a', group.accounts[0].id).at, plus(0));
  assert.equal(pair(plan, 'a', group.accounts[1].id).at, plus(15));
  assert.equal(pair(plan, 'b', group.accounts[0].id).at, plus(45));
  assert.equal(pair(plan, 'c', group.accounts[1].id).at, plus(105));
  assert.ok(plan.tasks.every((t) => t.example === true && t.isPublic === false && t.destination === 'draft' && t.label === '测试夹具'));
});

test('一对一：不同作品按顺序对应不同账号，多出来的不配对', () => {
  const group = GROUPS.find((g) => g.id === 'dy-guyun');
  const plan = planDistribution({ ...base, mode: 'one-to-one', groupId: group.id, works, workIds: ['a', 'b', 'c', 'd'] });
  assert.equal(plan.ok, true);
  assert.equal(plan.modeLabel, '一对一');
  assert.equal(plan.tasks.length, 3);
  assert.deepEqual(plan.tasks.map((t) => [t.workId, t.accountId]), group.accounts.map((account, i) => [works[i].id, account.id]));
  assert.equal(plan.tasks[1].at, plus(45));
  assert.deepEqual(plan.unassignedWorks.map((w) => w.id), ['d']);
  assert.deepEqual(plan.unassignedAccounts, []);
  assert.equal(new Set(plan.tasks.map((t) => t.workId)).size, plan.tasks.length);
  assert.equal(new Set(plan.tasks.map((t) => t.accountId)).size, plan.tasks.length);
  const short = planDistribution({ ...base, mode: 'one-to-one', groupId: 'dy-nishijin', works, workIds: ['a'] });
  assert.equal(short.tasks.length, 1);
  assert.equal(short.unassignedAccounts.length, 1);
  assert.equal(short.tasks[0].workId, 'a');
});

test('均分：一轮一轮分，条数最多差 1', () => {
  const cases = [['dy-nishijin', ['a', 'b', 'c']], ['dy-guyun', ['a', 'b', 'c', 'd']], ['dy-guyun', ['a', 'b', 'c', 'd', 'a']]];
  const five = [...works, { id: 'e', name: '【测试夹具】戊', review: 'approved', fixture: true }];
  for (const [groupId, ids] of [['dy-nishijin', ['a', 'b', 'c']], ['dy-guyun', ['a', 'b', 'c', 'd']], ['xhs-guyun', ['a', 'b', 'c', 'd', 'e']]]) {
    const group = GROUPS.find((g) => g.id === groupId);
    const pool = ids.includes('e') ? five : works;
    const plan = planDistribution({ ...base, mode: 'even', groupId, works: pool, workIds: ids });
    assert.equal(plan.ok, true, groupId);
    assert.equal(plan.modeLabel, '均分');
    assert.equal(plan.tasks.length, ids.length);
    assert.equal(new Set(plan.tasks.map((t) => t.workId + ':' + t.id)).size, ids.length);
    const counts = plan.counts.map((c) => c.n);
    assert.equal(Math.max(...counts) - Math.min(...counts) <= 1, true, counts.join(','));
    assert.equal(counts.reduce((s, n) => s + n, 0), ids.length);
    assert.equal(plan.tasks.every((t) => t.destinationCn === '将入草稿箱' && t.isPublic === false), true);
  }
  const group = GROUPS.find((g) => g.id === 'dy-nishijin');
  const plan = planDistribution({ ...base, mode: 'even', groupId: group.id, works, workIds: ['a', 'b', 'c'] });
  assert.equal(pair(plan, 'a', group.accounts[0].id).at, plus(0));
  assert.equal(pair(plan, 'b', group.accounts[1].id).at, plus(15));
  assert.equal(pair(plan, 'c', group.accounts[0].id).at, plus(30));
  assert.deepEqual(plan.counts.map((c) => c.n), [2, 1]);
  assert.equal(cases.length, 3);
});

test('未通过审核的不能分发，也不会夹在已通过的里面一起生成', () => {
  const mixed = [
    works[0],
    { id: 'hold', name: '【测试夹具】未核预告', review: 'awaiting_user', fixture: true },
    { id: 'qc', name: '【测试夹具】待质检', review: 'in_qc', fixture: true },
    { id: 'no', name: '【测试夹具】未过', review: 'rejected', fixture: true },
    { id: 'bare', name: '【测试夹具】没状态', fixture: true },
  ];
  for (const id of ['hold', 'qc', 'no', 'bare']) {
    const plan = planDistribution({ ...base, mode: 'many-to-one', groupId: 'xhs-guyun', works: mixed, workIds: ['a', id] });
    assert.equal(plan.ok, false, id);
    assert.equal(plan.code, 'not_approved');
    assert.deepEqual(plan.tasks, []);
    assert.equal(plan.blocked.some((b) => b.id === id), true);
  }
  const alone = planDistribution({ ...base, mode: 'even', groupId: 'dy-guyun', works: mixed, workIds: ['hold'] });
  assert.equal(alone.ok, false);
  assert.equal(selectableIds(mixed, null).includes('hold'), false);
  assert.deepEqual(selectableIds(mixed, ['a', 'hold', 'qc']), ['a']);
  assert.equal(nextReview('awaiting_user', 'approved').ok, false);
  assert.equal(nextReview('awaiting_user', 'in_qc').review, 'in_qc');
  assert.equal(nextReview('in_qc', 'approved').review, 'approved');
  assert.equal(nextReview('in_qc', 'rejected').review, 'rejected');
  assert.equal(nextReview('approved', 'rejected').ok, false);
});
