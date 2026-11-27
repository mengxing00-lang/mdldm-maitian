// 古韵分发演示。只实现公开的三种分法、定时和间隔。
// 账号组是标明「示例」的名单，没有登录态。任务一律先标成草稿，不公开，也不提交。

export const REVIEW = {
  awaiting_user: '待你点头',
  in_qc: '质检中',
  approved: '已通过',
  rejected: '未通过',
};

export const MODES = [
  { id: 'many-to-one', label: '多对一', summary: '同一条作品发到所选组里的每一个示例账号。' },
  { id: 'one-to-one', label: '一对一', summary: '不同作品按顺序一一对应到不同示例账号。对不上的剩下，不硬塞。' },
  { id: 'even', label: '均分', summary: '一批作品按顺序轮流分给组内示例账号，条数尽量一样多。' },
];

export const GROUPS = [
  {
    id: 'xhs-guyun', name: '小红书古韵造物', example: true, loggedIn: false,
    tags: ['示例', '小红书', '古韵造物'],
    accounts: [
      { id: 'xhs-guyun-main', name: '小红书古韵造物', platform: 'xhs', example: true, tags: ['示例', '主名单'] },
      { id: 'xhs-guyun-pattern', name: '小红书古韵造物·纹样', platform: 'xhs', example: true, tags: ['示例', '纹样'] },
    ],
  },
  {
    id: 'dy-nishijin', name: '抖音京都名家西阵织', example: true, loggedIn: false,
    tags: ['示例', '抖音', '京都名家'],
    accounts: [
      { id: 'dy-nishijin-main', name: '抖音京都名家西阵织', platform: 'douyin', example: true, tags: ['示例'] },
      { id: 'dy-nishijin-loom', name: '抖音京都名家西阵织·机杼', platform: 'douyin', example: true, tags: ['示例', '机杼'] },
    ],
  },
  {
    id: 'dy-guyun', name: '抖音古韵西阵织造物', example: true, loggedIn: false,
    tags: ['示例', '抖音', '古韵造物'],
    accounts: [
      { id: 'dy-guyun-main', name: '抖音古韵西阵织造物', platform: 'douyin', example: true, tags: ['示例'] },
      { id: 'dy-guyun-tea', name: '抖音古韵西阵织造物·茶席', platform: 'douyin', example: true, tags: ['示例', '茶席'] },
      { id: 'dy-guyun-pattern', name: '抖音古韵西阵织造物·纹样', platform: 'douyin', example: true, tags: ['示例', '纹样'] },
    ],
  },
];

const fail = (code, error, extra = {}) => ({ ok: false, code, error, tasks: [], ...extra });

function interval(value) {
  if (typeof value === 'boolean' || value == null || value === '') return null;
  const n = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);
  if (!Number.isInteger(n) || n < 0 || n > 1440) return null;
  return n;
}

function stamp(start, minutes) {
  return new Date(start + minutes * 60000).toISOString();
}

function makeTask(mode, work, account, group, start, offset, accountIntervalMin, fileIntervalMin, index) {
  return {
    id: `${mode}:${work.id}:${account.id}:${index}`,
    label: '测试夹具',
    example: true,
    workId: work.id,
    workName: work.name,
    accountId: account.id,
    accountName: account.name,
    platform: account.platform,
    groupId: group.id,
    groupName: group.name,
    at: stamp(start, offset),
    offsetMin: offset,
    accountIntervalMin,
    fileIntervalMin,
    destination: 'draft',
    destinationCn: '将入草稿箱',
    isPublic: false,
  };
}

export function selectableIds(works, picked) {
  const approved = (works || []).filter((w) => w.review === 'approved' && w.fixture !== false).map((w) => w.id);
  if (picked == null) return approved;
  const allow = new Set(approved);
  return picked.filter((id) => allow.has(id));
}

export function nextReview(from, to) {
  const allowed = { awaiting_user: ['in_qc'], in_qc: ['approved', 'rejected'] };
  if (!(allowed[from] || []).includes(to)) return { ok: false, code: 'bad_review', error: '这一步不能改审核' };
  return { ok: true, review: to, reviewCn: REVIEW[to] };
}

function summarize(mode, modeLabel, works, accounts, tasks, counts, unassignedWorks, unassignedAccounts) {
  let text = `${modeLabel}：${works.length} 条作品，${accounts.length} 个示例账号，生成 ${tasks.length} 条任务。全部将入草稿箱，不公开。`;
  if (mode === 'many-to-one') text += '同一条作品发到组里每一个示例账号。';
  if (mode === 'one-to-one' && unassignedWorks.length) text += `多出 ${unassignedWorks.length} 条作品没有对应账号，不会硬塞到同一个号。`;
  if (mode === 'one-to-one' && unassignedAccounts.length) text += `空出 ${unassignedAccounts.length} 个示例账号，这次不发。`;
  if (mode === 'even') text += `各账号 ${counts.map((c) => c.n).join('、')} 条。`;
  return text;
}

export function planDistribution({ mode, groupId, works, workIds, schedule, accountIntervalMin, fileIntervalMin } = {}) {
  const group = GROUPS.find((g) => g.id === groupId);
  if (!group || group.example !== true || group.loggedIn !== false) return fail('bad_group', '没有这个示例账号组');
  const spec = MODES.find((m) => m.id === mode);
  if (!spec) return fail('bad_mode', '分发方式只能是多对一、一对一或均分');
  const accountGap = interval(accountIntervalMin);
  const fileGap = interval(fileIntervalMin);
  if (accountGap == null) return fail('bad_interval', '账号间隔须是 0 到 1440 的整数分钟');
  if (fileGap == null) return fail('bad_interval', '文件间隔须是 0 到 1440 的整数分钟');
  const start = Date.parse(schedule);
  if (!schedule || Number.isNaN(start)) return fail('bad_schedule', '先填开始时间');
  if (!Array.isArray(workIds) || workIds.some((id) => typeof id !== 'string')) return fail('empty', '先选至少一条已通过的素材');
  if (!workIds.length) return fail('empty', '先选至少一条已通过的素材');
  const byId = new Map((works || []).map((w) => [w.id, w]));
  if (workIds.some((id) => !byId.has(id))) return fail('not_found', '有素材不在这批测试夹具里');
  const chosen = workIds.map((id) => byId.get(id));
  if (chosen.some((w) => w.fixture === false)) return fail('not_fixture', '只能分发标明测试夹具的条目');
  const blocked = chosen.filter((w) => w.review !== 'approved');
  if (blocked.length) {
    return fail('not_approved', '未通过审核的条目不能分发', {
      blocked: blocked.map((w) => ({ id: w.id, name: w.name, review: w.review || '', reviewCn: REVIEW[w.review] || '未通过' })),
    });
  }
  const accounts = group.accounts;
  if (!accounts.length) return fail('bad_group', '这个示例组里没有名单');

  const tasks = [];
  let unassignedWorks = [];
  let unassignedAccounts = [];
  if (mode === 'many-to-one') {
    const step = (accounts.length - 1) * accountGap + fileGap;
    chosen.forEach((work, w) => accounts.forEach((account, a) => {
      tasks.push(makeTask(mode, work, account, group, start, w * step + a * accountGap, accountGap, fileGap, tasks.length));
    }));
  } else if (mode === 'one-to-one') {
    const n = Math.min(chosen.length, accounts.length);
    for (let i = 0; i < n; i++) tasks.push(makeTask(mode, chosen[i], accounts[i], group, start, i * (accountGap + fileGap), accountGap, fileGap, i));
    unassignedWorks = chosen.slice(n).map((w) => ({ id: w.id, name: w.name }));
    unassignedAccounts = accounts.slice(n).map((a) => ({ id: a.id, name: a.name }));
  } else {
    chosen.forEach((work, i) => {
      const a = i % accounts.length;
      const k = Math.floor(i / accounts.length);
      tasks.push(makeTask(mode, work, accounts[a], group, start, a * accountGap + k * fileGap, accountGap, fileGap, i));
    });
  }
  tasks.sort((a, b) => a.offsetMin - b.offsetMin || a.workName.localeCompare(b.workName, 'zh') || a.accountName.localeCompare(b.accountName, 'zh'));
  const counts = accounts.map((account) => ({ accountId: account.id, accountName: account.name, n: tasks.filter((t) => t.accountId === account.id).length }));
  return {
    ok: true,
    mode,
    modeLabel: spec.label,
    groupId: group.id,
    groupName: group.name,
    example: true,
    loggedIn: false,
    accountIntervalMin: accountGap,
    fileIntervalMin: fileGap,
    destination: 'draft',
    destinationCn: '将入草稿箱',
    isPublic: false,
    tasks,
    counts,
    unassignedWorks,
    unassignedAccounts,
    summary: summarize(mode, spec.label, chosen, accounts, tasks, counts, unassignedWorks, unassignedAccounts),
    note: '只生成演示任务，不进入平台草稿箱，也不公开',
  };
}

export function seedRecords() {
  const row = (id, workName, accountName, groupName, platform, status, statusCn, extra) => ({
    id, seed: true, fixture: true, label: '测试夹具', example: true, isPublic: false,
    workName, accountName, groupName, platform, status, statusCn,
    reason: '', linkLabel: '', note: '', at: '2026-11-27T02:00:00.000Z', destination: 'draft', destinationCn: '将入草稿箱',
    ...extra,
  });
  return [
    row('seed-draft', '【测试夹具】西阵织纹样短片', '小红书古韵造物', '小红书古韵造物', 'xhs', 'draft', '已进草稿', {
      note: '示例回写：看起来像已进草稿。没有进入真实草稿箱。',
    }),
    row('seed-wait', '【测试夹具】古韵茶席成片', '抖音京都名家西阵织', '抖音京都名家西阵织', 'douyin', 'awaiting_click', '等人点', {
      at: '2026-11-27T02:30:00.000Z',
      note: '示例回写：国内平台要等人核对后再点。这里没有打开 App。',
    }),
    row('seed-pub', '【测试夹具】京纹样册页', '抖音古韵西阵织造物', '抖音古韵西阵织造物', 'douyin', 'published', '已发布', {
      at: '2026-11-27T03:00:00.000Z',
      linkLabel: '示例链接 · 未接入',
      note: '示例回写：看起来像已发布。没有真实发布，链接也未接入。',
    }),
    row('seed-fail', '【测试夹具】西阵织纹样短片', '抖音古韵西阵织造物·纹样', '抖音古韵西阵织造物', 'douyin', 'failed', '失败', {
      at: '2026-11-27T03:30:00.000Z',
      reason: '示例：未登录，夹具没有提交',
      note: '示例回写：失败原因只写在夹具里，没有向平台提交。',
    }),
  ];
}
