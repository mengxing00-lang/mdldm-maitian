import { filterItems, rowsFor } from './guyun-filter.js';
import { MODES, planDistribution, selectableIds } from './distribute.js';

const NAV = [['home', '工作台'], ['materials', '素材'], ['review', '待审核'], ['schedule', '发布排期'], ['records', '发布记录']];
const PN = { bilibili: 'B站', douyin: '抖音', xhs: '小红书', channels: '视频号', youtube: 'YouTube', x: 'X', instagram: 'Instagram', zsz: '知识站' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => { if (!iso) return ''; const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''; const p = (n) => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const scheduleIso = (value) => {
  const m = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

function worksOf(O) {
  return (O.episodes || []).filter((e) => e.guyun).map((e) => ({ id: e.id, name: e.name, review: e.guyun.review || '', fixture: e.guyun.fixture === true }));
}
function banner(O) {
  if (!O.fixture) return '';
  return '<div class="gy-banner">测试夹具：下面的条目只用来走分发演示，不是在售商品，也不是已接通的账号、经营数据或岗位。</div>';
}
function blocked() {
  return '<button class="btn" type="button" disabled>登录、采集、发布、通知均未接入</button>';
}
function filters(q, statuses) {
  const opts = [['', '全部状态'], ...statuses];
  const status = statuses.length ? `<label>状态 <select data-gy="status">${opts.map(([v, l]) => `<option value="${esc(v)}"${q.status === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : '';
  return `<div class="filters">${status}<label>名称 <input data-gy="q" value="${esc(q.q)}" placeholder="筛选名称"></label></div>`;
}
function tag(text, kind) {
  return `<span class="gy-tag${kind ? ' ' + kind : ''}">${esc(text)}</span>`;
}

function home(O) {
  const dist = O.distribution || {};
  const approved = (O.episodes || []).filter((e) => e.guyun && e.guyun.review === 'approved').length;
  const counts = {
    materials: rowsFor(O.episodes, 'materials').length,
    review: rowsFor(O.episodes, 'review').length,
    schedule: (dist.plan && dist.plan.tasks && dist.plan.tasks.length) || 0,
    records: (dist.records || []).length,
  };
  const label = (key, n) => {
    if (n) return O.fixture ? `测试夹具 ${n}` : String(n);
    if (O.fixture && key === 'schedule' && approved) return '测试夹具 · 可编排';
    return '未接入';
  };
  const cards = [['materials', '素材', counts.materials], ['review', '待审核', counts.review], ['schedule', '发布排期', counts.schedule], ['records', '发布记录', counts.records]];
  return `${banner(O)}<div class="h1">${esc(O.name || '古韵造物')}</div><p class="lead">账号、素材、经营和集成都还没有真实来源。空的地方写「未接入」，不用 0 代替未知。${O.fixture ? '带「测试夹具」的成片和文案，只用来演示分组、三种分发和草稿回写。' : ''}</p>
  <div class="gy-grid">${cards.map(([k, name, n]) => `<a class="panel gy-card" href="#/${k}"><b>${name}</b><div class="gy-miss">${esc(label(k, n))}</div><div class="gy-k">打开${name}</div></a>`).join('')}</div>
  <div class="gy-grid" style="margin-top:16px">
    <div class="panel"><h3>账号</h3><div class="gy-miss">未接入</div><p>没有平台登录。示例账号组只是名单，不是会话。</p></div>
    <div class="panel"><h3>经营</h3><div class="gy-miss">未接入</div><p>没有收入、粉丝、订单或库存。这些数字不是 0。</p></div>
    <div class="panel"><h3>集成</h3><div class="gy-miss">未接入</div><p>飞书、站点、隧道和外部通知都没有启用。</p></div>
    <div class="panel"><h3>岗位</h3><div class="gy-miss">未接入</div><p>内容、产品、视觉、数字都未接通，也不会自动派任务。</p></div>
  </div>
  <div class="btns" style="margin-top:16px">${blocked()}</div>
  <p class="gy-k">页面沿用开源项目麦田的本地结构。许可证见仓库 LICENSE。这里没有作者的课程、站点或示例内容。</p>`;
}

function materialsPage(O, q) {
  const rows = filterItems(rowsFor(O.episodes, 'materials'), q);
  const byId = Object.fromEntries((O.episodes || []).map((e) => [e.id, e]));
  const body = rows.length ? `<div class="panel">${rows.map((r) => {
    const e = byId[r.id], g = (e && e.guyun) || {};
    const gate = g.review === 'approved' ? tag('可进入分发', 'ok') : tag('不能分发', 'bad');
    return `<article class="gy-row"><div><b>${esc(r.name)}</b> ${tag('测试夹具', 'ex')} ${tag('示例', 'ex')}<div class="gy-k">${esc(g.kind || '素材')} · ${esc(g.reviewCn || '未接入')} · ${gate}</div><p class="gy-copy">${esc(g.copy || '')}</p><div class="gy-k">${g.file ? `夹具文件 ${esc(g.file)}。没有真实视频文件。` : '没有真实视频文件。'}不是在售商品。</div></div></article>`;
  }).join('')}</div>` : '<div class="panel gy-empty"><p>没有符合当前筛选的条目。</p></div>';
  return `${banner(O)}<div class="h1">素材</div><p class="lead">示例成片和文案放在这里。未点头、质检未过的，不能当预告，也不能挂讲解卡。</p>${filters(q, [])}${body}`;
}

function reviewPage(O, q) {
  const rows = filterItems(rowsFor(O.episodes, 'review'), q);
  const byId = Object.fromEntries((O.episodes || []).map((e) => [e.id, e]));
  const body = rows.length ? `<div class="panel">${rows.map((r) => {
    const g = ((byId[r.id] || {}).guyun) || {};
    const actions = g.review === 'awaiting_user'
      ? '<button class="btn" type="button" data-gy-review="' + esc(r.id) + '" data-gy-to="in_qc">点头，送去质检</button>'
      : g.review === 'in_qc'
        ? '<button class="btn" type="button" data-gy-review="' + esc(r.id) + '" data-gy-to="approved">质检通过</button><button class="btn" type="button" data-gy-review="' + esc(r.id) + '" data-gy-to="rejected">质检未过</button>'
        : '';
    const gate = g.review === 'approved' ? `${tag('可分发', 'ok')}<span class="gy-k">可以进入发布排期。仍不会发布。</span>` : `${tag('不能分发', 'bad')}<span class="gy-k">分发入口不可用。</span>`;
    return `<article class="gy-row"><div><b>${esc(r.name)}</b> ${tag('测试夹具', 'ex')}<div class="gy-k">${esc(g.kind || '')} · ${esc(g.reviewCn || r.stateCn)}</div><p class="gy-copy">${esc(g.copy || '')}</p><div class="gy-kv">${gate}</div><div class="btns" style="margin-top:8px">${actions}</div></div></article>`;
  }).join('')}</div>` : '<div class="panel gy-empty"><p>没有符合当前筛选的条目。</p></div>';
  return `${banner(O)}<div class="h1">待审核</div><p class="lead">这里仍是能不能分发的闸门。文案先点头，再质检；没通过的不能分发。点头和质检只改测试夹具，不会登录或发布。</p>${filters(q, [['awaiting_user', '待你点头'], ['in_qc', '质检中'], ['approved', '已通过'], ['rejected', '未通过']])}${body}<div class="btns" style="margin-top:16px">${blocked()}</div>`;
}

function schedulePage(O, dist) {
  const groups = (O.distribution && O.distribution.groups) || [];
  const group = groups.find((g) => g.id === dist.groupId) || groups[0];
  const works = worksOf(O);
  const picked = selectableIds(works, dist.workIds);
  const pickedSet = new Set(picked);
  const plan = group ? planDistribution({
    mode: dist.mode, groupId: group.id, works, workIds: picked,
    schedule: scheduleIso(dist.schedule),
    accountIntervalMin: dist.accountIntervalMin, fileIntervalMin: dist.fileIntervalMin,
  }) : { ok: false, error: '没有示例账号组', tasks: [] };
  const saved = O.distribution && O.distribution.plan;
  const picks = groups.map((g) => `<button type="button" class="gy-pick${g.id === (group && group.id) ? ' on' : ''}" data-gy-group="${esc(g.id)}"><b>${esc(g.name)}</b> ${tag('示例', 'ex')} ${tag('未登录', 'wait')}<span class="gy-k">${g.accounts.map((a) => esc(a.name)).join('、')}</span><span class="gy-k">${(g.tags || []).map(esc).join(' · ')}。名单，不是会话。</span></button>`).join('');
  const modes = MODES.map((m) => `<button type="button" class="gy-pick${m.id === dist.mode ? ' on' : ''}" data-gy-mode="${esc(m.id)}"><b>${esc(m.label)}</b><span class="gy-k">${esc(m.summary)}</span></button>`).join('');
  const workRows = (O.episodes || []).filter((e) => e.guyun).map((e) => {
    const on = e.guyun.review === 'approved';
    return `<label class="gy-check"><input type="checkbox" data-gy-work="${esc(e.id)}"${on ? '' : ' disabled'}${pickedSet.has(e.id) ? ' checked' : ''}><span><b>${esc(e.name)}</b><span class="gy-k">${esc(e.guyun.kind || '')} · ${esc(e.guyun.reviewCn || '')}</span></span>${on ? tag('可分发', 'ok') : tag('不能分发', 'bad')}</label>`;
  }).join('');
  const extra = plan.ok ? `${(plan.unassignedWorks || []).map((w) => `<div class="gy-k">未配对：${esc(w.name)}。一对一只按顺序对应，不会分给同一个号两次。</div>`).join('')}${(plan.unassignedAccounts || []).map((a) => `<div class="gy-k">这次不发：${esc(a.name)}（示例）</div>`).join('')}` : (plan.blocked || []).map((b) => `<div class="gy-k">${esc(b.name)} · ${esc(b.reviewCn || '未通过')} · 不能分发</div>`).join('');
  const tasks = plan.ok ? plan.tasks.map((t) => `<article class="gy-task"><div><b>${esc(t.workName)}</b> ${tag('测试夹具', 'ex')}</div><div class="gy-kv"><span>示例账号 ${esc(t.accountName)}</span><span>${esc(PN[t.platform] || t.platform)}</span><span>${esc(when(t.at))}</span><span>开始后 ${esc(t.offsetMin)} 分钟</span></div><div class="gy-kv">${tag('将入草稿箱', 'draft')}<span>不公开</span><span>账号间隔 ${esc(t.accountIntervalMin)} 分钟</span><span>文件间隔 ${esc(t.fileIntervalMin)} 分钟</span></div></article>`).join('') : '';
  const preview = `<div class="panel gy-preview"><div class="gy-draft">将入草稿箱</div><p class="gy-k">先进入各平台草稿，不公开。这一步只是演示，没有提交，也没有真实草稿箱。</p>${plan.ok ? `<p>${esc(plan.summary)}</p><p class="gy-k">${esc(plan.groupName)} · 示例 · 未登录</p>${tasks}${extra}` : `<p class="gy-err">${esc(plan.error || '还不能生成')}</p>${extra}`}</div>`;
  const savedNote = saved && saved.tasks ? `<p class="gy-k">已生成 ${saved.tasks.length} 条演示任务，按「已进草稿」写在<a href="#/records">发布记录</a>里。那是夹具回写，不是平台结果。</p>` : '';
  return `${banner(O)}<div class="h1">发布排期</div><p class="lead">选一个示例账号组，再选一种分发。开始时间、账号间隔和文件间隔只排在本机。生成之后仍是草稿，不会公开。</p>
  <div class="gy-split">
    <div>
      <div class="panel"><h3>账号组</h3><p class="gy-k">都标了「示例」。没有登录，也不会打开浏览器。</p><div class="gy-picks">${picks}</div></div>
      <div class="panel"><h3>分发方式</h3><div class="gy-picks">${modes}</div></div>
      <div class="panel"><h3>选用素材</h3><p class="gy-k">只有待审核里已通过的可以勾选。</p>${workRows}</div>
      <div class="panel"><h3>时间与间隔</h3><div class="filters">
        <label>开始时间 <input data-gy="schedule" type="text" inputmode="numeric" placeholder="2026-11-28 10:00" value="${esc(dist.schedule || '')}"></label>
        <label>账号间隔（分钟） <input data-gy="account-interval" type="number" min="0" max="1440" step="1" value="${esc(dist.accountIntervalMin)}"></label>
        <label>文件间隔（分钟） <input data-gy="file-interval" type="number" min="0" max="1440" step="1" value="${esc(dist.fileIntervalMin)}"></label>
      </div><p class="gy-k">账号间隔管账号和账号之间。文件间隔管作品和作品之间。算好的时间写在右边每一条上。</p>
      <div class="btns"><button class="btn pri" type="button" data-gy-commit ${plan.ok ? '' : 'disabled'}>生成分发任务（只做演示）</button></div>${savedNote}</div>
    </div>
    ${preview}
  </div>
  <div class="btns" style="margin-top:16px">${blocked()}</div>`;
}

function recordsPage(O, q) {
  const records = ((O.distribution && O.distribution.records) || []).map((r) => ({ ...r, name: r.workName, state: r.status, stateCn: r.statusCn }));
  const rows = filterItems(records, q);
  const body = rows.length ? `<div class="panel">${rows.map((r) => `<article class="gy-task"><div><b>${esc(r.workName)}</b> ${tag(r.seed === false ? '这次生成' : '示例回写', 'ex')} ${tag('测试夹具', 'ex')}</div><div class="gy-kv"><span>示例账号 ${esc(r.accountName)}</span><span>${esc(r.groupName || '')}</span><span>${esc(PN[r.platform] || '')}</span><span>${esc(when(r.at))}</span></div><div class="gy-kv">${tag(r.statusCn, r.status === 'failed' ? 'bad' : r.status === 'published' ? 'ok' : r.status === 'awaiting_click' ? 'wait' : 'draft')}${r.reason ? `<span>失败原因：${esc(r.reason)}</span>` : ''}${r.linkLabel ? `<span>链接：${esc(r.linkLabel)}</span>` : '<span>链接：无</span>'}</div><p class="gy-k">${esc(r.note || '')}</p></article>`).join('')}</div>` : '<div class="panel gy-empty"><p>没有符合当前筛选的条目。</p></div>';
  return `${banner(O)}<div class="h1">发布记录</div><p class="lead">按账号、按任务看回写的样子：已进草稿、等人点、已发布、失败原因、链接。这些都是测试夹具，不是平台返回的结果。</p>
  <div class="gy-kv" style="margin-bottom:14px">${tag('已进草稿', 'draft')}${tag('等人点', 'wait')}${tag('已发布', 'ok')}${tag('失败原因', 'bad')}${tag('链接', 'ex')}</div>
  ${filters(q, [['draft', '已进草稿'], ['awaiting_click', '等人点'], ['published', '已发布'], ['failed', '失败']])}${body}`;
}

function bucket(O, key, q) {
  const meta = {
    materials: ['素材', '素材目录未接入。接入前不会列出业务素材。', []],
    review: ['待审核', '没有待审条目。审核动作未接入。', [['awaiting_user', '待你点发布'], ['filled', '已填好']]],
    schedule: ['发布排期', '没有排期。不会自动排内容或产品。', [['scheduled', '已定时'], ['planned', '计划中']]],
    records: ['发布记录', '没有发布记录。发布动作未接入。', [['published', '已发布']]],
  }[key];
  const rows = filterItems(rowsFor(O.episodes, key), q);
  const list = !rows.length
    ? ''
    : `<div class="panel">${rows.map((r) => `<div class="gy-row"><div><b>${esc(r.name)}</b><div class="gy-k">${esc(PN[r.platform] || r.platform || '素材')}${r.stateCn ? ' · ' + esc(r.stateCn) : ''}${r.schedule ? ' · ' + esc(when(r.schedule)) : ''}</div></div></div>`).join('')}</div>`;
  const body = !(O.episodes || []).length
    ? `<div class="panel gy-empty"><div class="gy-miss">未接入</div><p>没有真实来源。筛选不会造出条目，也不会把未知写成 0。</p>${blocked()}</div>`
    : `${list || '<div class="panel gy-empty"><p>没有符合当前筛选的条目。</p></div>'}<div class="btns" style="margin-top:16px">${blocked()}</div>`;
  return `${banner(O)}<div class="h1">${meta[0]}</div><p class="lead">${O.fixture ? '当前只显示带「测试夹具」标记的条目。' : meta[1]}</p>${filters(q, meta[2])}${body}`;
}

function page(O, key, q, dist) {
  if (!(O.episodes || []).length || !O.fixture) return bucket(O, key, q);
  if (key === 'materials') return materialsPage(O, q);
  if (key === 'review') return reviewPage(O, q);
  if (key === 'schedule') return schedulePage(O, dist || {});
  if (key === 'records') return recordsPage(O, q);
  return bucket(O, key, q);
}

window.guyunWorks = worksOf;
window.guyunSelected = (O, picked) => selectableIds(worksOf(O), picked);
window.renderGuyun = (O, key, q, dist) => key === 'home' || !NAV.some(([k]) => k === key) ? home(O) : page(O, key, q || { status: '', q: '' }, dist);
window.dispatchEvent(new Event('gy-ready'));
