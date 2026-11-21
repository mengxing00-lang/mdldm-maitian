import { filterItems, rowsFor } from './guyun-filter.js';

const NAV = [['home', '工作台'], ['materials', '素材'], ['review', '待审核'], ['schedule', '发布排期'], ['records', '发布记录']];
const PN = { bilibili: 'B站', douyin: '抖音', xhs: '小红书', channels: '视频号', youtube: 'YouTube', x: 'X', instagram: 'Instagram', zsz: '知识站' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => { if (!iso) return ''; const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''; const p = (n) => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };

function banner(O) {
  if (!O.fixture) return '';
  return '<div class="gy-banner">测试夹具：下面的条目只用来验证导航和筛选，不是古韵业务，也不是已接通的账号、经营数据或岗位。</div>';
}
function blocked() {
  return '<button class="btn" type="button" disabled>登录、采集、发布、通知均未接入</button>';
}
function filters(q, statuses) {
  const opts = [['', '全部状态'], ...statuses];
  const status = statuses.length ? `<label>状态 <select data-gy="status">${opts.map(([v, l]) => `<option value="${esc(v)}"${q.status === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : '';
  return `<div class="filters">${status}<label>名称 <input data-gy="q" value="${esc(q.q)}" placeholder="筛选名称"></label></div>`;
}
function list(rows) {
  if (!rows.length) return '<div class="panel gy-empty"><p>没有符合当前筛选的条目。</p></div>';
  return `<div class="panel">${rows.map((r) => `<div class="gy-row"><div><b>${esc(r.name)}</b><div class="gy-k">${esc(PN[r.platform] || r.platform || '素材')}${r.stateCn ? ' · ' + esc(r.stateCn) : ''}${r.schedule ? ' · ' + esc(when(r.schedule)) : ''}</div></div></div>`).join('')}</div>`;
}

function home(O) {
  const cards = [['materials', '素材', rowsFor(O.episodes, 'materials').length], ['review', '待审核', rowsFor(O.episodes, 'review').length], ['schedule', '发布排期', rowsFor(O.episodes, 'schedule').length], ['records', '发布记录', rowsFor(O.episodes, 'records').length]];
  const label = (n) => n ? (O.fixture ? `测试夹具 ${n}` : String(n)) : '未接入';
  return `${banner(O)}<div class="h1">${esc(O.name || '古韵造物')}</div><p class="lead">账号、素材、经营和集成都还没有真实来源。空的地方写「未接入」，不用 0 代替未知。</p>
  <div class="gy-grid">${cards.map(([k, name, n]) => `<a class="panel gy-card" href="#/${k}"><b>${name}</b><div class="gy-miss">${esc(label(n))}</div><div class="gy-k">打开${name}</div></a>`).join('')}</div>
  <div class="gy-grid" style="margin-top:16px">
    <div class="panel"><h3>账号</h3><div class="gy-miss">未接入</div><p>没有平台登录，也不会打开浏览器去登录。</p></div>
    <div class="panel"><h3>经营</h3><div class="gy-miss">未接入</div><p>没有收入、粉丝、订单或库存。这些数字不是 0。</p></div>
    <div class="panel"><h3>集成</h3><div class="gy-miss">未接入</div><p>飞书、站点、隧道和外部通知都没有启用。</p></div>
    <div class="panel"><h3>岗位</h3><div class="gy-miss">未接入</div><p>内容、产品、视觉、数字都未接通，也不会自动派任务。</p></div>
  </div>
  <div class="btns" style="margin-top:16px">${blocked()}</div>
  <p class="gy-k">页面沿用开源项目麦田的本地结构。许可证见仓库 LICENSE。这里没有作者的课程、站点或示例内容。</p>`;
}

function bucket(O, key, q) {
  const meta = {
    materials: ['素材', '素材目录未接入。接入前不会列出业务素材。', []],
    review: ['待审核', '没有待审条目。审核动作未接入。', [['awaiting_user', '待你点发布'], ['filled', '已填好']]],
    schedule: ['发布排期', '没有排期。不会自动排内容或产品。', [['scheduled', '已定时'], ['planned', '计划中']]],
    records: ['发布记录', '没有发布记录。发布动作未接入。', [['published', '已发布']]],
  }[key];
  const rows = filterItems(rowsFor(O.episodes, key), q);
  const body = !(O.episodes || []).length
    ? `<div class="panel gy-empty"><div class="gy-miss">未接入</div><p>没有真实来源。筛选不会造出条目，也不会把未知写成 0。</p>${blocked()}</div>`
    : `${list(rows)}<div class="btns" style="margin-top:16px">${blocked()}</div>`;
  return `${banner(O)}<div class="h1">${meta[0]}</div><p class="lead">${O.fixture ? '当前只显示带「测试夹具」标记的条目。' : meta[1]}</p>${filters(q, meta[2])}${body}`;
}

window.renderGuyun = (O, key, q) => key === 'home' || !NAV.some(([k]) => k === key) ? home(O) : bucket(O, key, q || { status: '', q: '' });
window.dispatchEvent(new Event('gy-ready'));
