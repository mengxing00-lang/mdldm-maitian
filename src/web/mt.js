// 麦田下钻页的公共部分：格式化、Logo、顶栏、提示、图表
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => n == null ? '–' : Math.round(n).toLocaleString('en-US');
const sgn = (n) => (n > 0 ? '+' : '') + fmt(n);
const pad = (n) => String(n).padStart(2, '0');
const pct = (a, b, d = 0) => b ? (a / b * 100).toFixed(d) + '%' : '–';
const sum = (arr, k) => arr.reduce((s, r) => s + (r[k] || 0), 0);
const PL_ALL = ['bilibili', 'douyin', 'xhs', 'channels', 'youtube', 'x', 'instagram', 'zsz'];
let PL = PL_ALL;
const PN = { bilibili: 'B站', douyin: '抖音', xhs: '小红书', channels: '视频号', youtube: 'YouTube', x: 'X', instagram: 'Instagram', zsz: '知识站' };
const LOGO = {"bilibili": {"d": "M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z", "bg": "#00a1d6"}, "douyin": {"d": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z", "bg": "#16161a", "dark": 1}, "xhs": {"d": "M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z", "bg": "#ff2442"}, "channels": {"stroke": "M12 12c-2.4-3.9-4.6-5.8-6.9-5.8-2.2 0-3.6 2.2-3.6 5.8s1.4 5.8 3.6 5.8c2.3 0 4.5-1.9 6.9-5.8zm0 0c2.4 3.9 4.6 5.8 6.9 5.8 2.2 0 3.6-2.2 3.6-5.8s-1.4-5.8-3.6-5.8c-2.3 0-4.5 1.9-6.9 5.8z", "bg": "#fa9d3b"}, "youtube": {"d": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", "bg": "#ff0033"}, "x": {"d": "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z", "bg": "#16161a", "dark": 1}, "instagram": {"stroke": "M7 2.5h10A4.5 4.5 0 0 1 21.5 7v10a4.5 4.5 0 0 1-4.5 4.5H7A4.5 4.5 0 0 1 2.5 17V7A4.5 4.5 0 0 1 7 2.5zM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8zM17.3 6.7h.01", "bg": "#d6246e"}, "zsz": {"d": "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", "bg": "#5e5ce6"}};
const logo = (p) => { const l = LOGO[p]; if (!l) return ''; return `<span class="lg" style="--bg:${l.bg}">${l.img ? `<img src="${l.img}" alt="">` : `<svg viewBox="0 0 24 24">${l.stroke ? `<path d="${l.stroke}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` : `<path d="${l.d}" fill="#fff"/>`}</svg>`}</span>`; };
const safeUrl = (u) => /^https?:\/\//.test(u || '') ? esc(u) : '';
const when = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? esc(iso) : `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? '刚刚' : m < 60 ? m + ' 分钟前' : m < 1440 ? Math.round(m / 60) + ' 小时前' : Math.round(m / 1440) + ' 天前'; };
const inter = (m) => m ? (m.likes || 0) + (m.comments || 0) + (m.favorites || 0) + (m.shares || 0) : 0;
const chip = (t) => `<span class="st-chip ${esc(t.state)}"><i>${({ published: '✓', scheduled: '◷', awaiting_user: '!', filled: '!', failed: '✕', not_logged_in: '✕', running: '…', planned: '◌' })[t.state] || '○'}</i>${esc(t.stateCn)}</span>`;
const delta = (a, b) => { if (!b) return '<span style="color:var(--t3)">前 7 天没有数据</span>'; const p = (a - b) / b * 100; return `<span class="pill ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '↑' : '↓'} ${Math.abs(p).toFixed(0)}%</span><span style="color:var(--t3)">较前 7 天 ${fmt(b)}</span>`; };
async function api(p) { const r = await fetch(p); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status); return r.json(); }
function toast(t, ms = 2600) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), ms); }
// 平台登录灯：只看没停用的平台；没检查过不算掉线（原来只看 keepAlive 那一家，视频号正常就报绿）
function loginLight(h) {
  const ps = (h.platforms || []).filter(p => !p.disabled);
  const bad = ps.filter(p => p.state && p.state !== 'ok').length, none = !ps.length || ps.every(p => !p.state);
  if (bad) return ['bad', `平台登录 ${bad} 家掉线`];
  if (none) return ['warn', '平台登录 还没检'];
  return ['ok', '平台登录 正常'];
}
const platformSummary = (h) => loginLight(h)[1].replace(/^平台登录 /, '');
function topbar(O, on) {
  const h = O.health, n = new Date(), [lc, lt] = loginLight(h);
  if (O.ui === 'guyun') {
    const nav = [['#/home', '工作台', 'home'], ['#/materials', '素材', 'materials'], ['#/review', '待审核', 'review'], ['#/schedule', '发布排期', 'schedule'], ['#/records', '发布记录', 'records'], ['#/stats', '数据统计', 'stats'], ['#/monitor/flow', '数据监控', 'monitor']];
    const key = ['home', 'materials', 'review', 'schedule', 'records', 'stats', 'monitor'].includes(on) ? on : 'home';
    return `<div class="top"><a class="logo" href="#/home">${esc(O.name || '古韵造物')}</a><div class="tag">工作台</div><div class="nav">${nav.map(([u, t, k]) => `<a class="${k === key ? 'on' : ''}" href="${u}">${t}</a>`).join('')}</div>
      <div class="lights">${O.fixture ? '<span class="light warn">测试夹具</span>' : ''}<span class="light warn">账号 未接入</span><span class="light warn">经营 未接入</span><span class="light warn">集成 未接入</span></div>
      <div class="clock"><small>${n.getMonth() + 1}/${n.getDate()} 周${'日一二三四五六'[n.getDay()]}</small>${pad(n.getHours())}:${pad(n.getMinutes())}</div></div>`;
  }
  const nav = [['/', '大屏', 'board'], ['/p#/traffic', '流量', 'traffic'], ['/p#/calendar', '日历', 'calendar'], ['/p#/convert', '转化', 'convert'], ['/p#/archive', '档案', 'archive'], ['/p#/system', '系统', 'system']];
  return `<div class="top"><a class="logo" href="/">麦<i>田</i></a><div class="tag">内容与粉丝监控</div><div class="nav">${nav.map(([u, t, k]) => `<a class="${k === on ? 'on' : ''}" href="${u}">${t}</a>`).join('')}</div>
    <div class="lights"><span class="light ok">守护进程 运行中</span><span class="light ${h.nas ? 'ok' : 'bad'}">NAS ${h.nas ? '已挂载' : '读不到'}</span><span class="light ${h.chrome ? 'ok' : 'bad'}">专用浏览器 ${h.chrome ? '在线' : '没开'}</span><span class="light ${lc}">${lt}</span></div>
    <div class="clock"><small>${n.getMonth() + 1}/${n.getDate()} 周${'日一二三四五六'[n.getDay()]}</small>${pad(n.getHours())}:${pad(n.getMinutes())}</div></div>`;
}
window.mt = { $, esc, when, chip, PN, pad };
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1)))); const m = v / p; return (m <= 1 ? 1 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 7.5 ? 7.5 : 10) * p; }
// 按天的柱图；最后 7 根更亮
function drawCols(el, rows, unit = '') {
  const w = el.clientWidth, h = el.clientHeight; if (w < 60 || h < 60 || !rows.length) return;
  const L = 52, R = 6, T = 18, B = 20, n = rows.length, pw = w - L - R, ph = h - T - B, band = pw / n, bw = Math.min(24, Math.max(2, band - 4));
  const top = niceMax(Math.max(...rows.map(r => r.y), 1)), Y = (v) => T + ph - v / top * ph, id = 'g' + Math.random().toString(36).slice(2, 7);
  let s = `<svg width="${w}" height="${h}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0071e3"/><stop offset="1" stop-color="#0071e3" stop-opacity=".45"/></linearGradient></defs>`;
  for (const t of [0, top / 2, top]) s += `<line x1="${L}" x2="${w - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="rgba(0,0,0,.07)"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end">${unit}${t >= 10000 ? t / 10000 + '万' : fmt(t)}</text>`;
  rows.forEach((r, i) => {
    const x = L + i * band + (band - bw) / 2, bh = r.y / top * ph, y = Y(r.y), rr = Math.min(5, bh, bw / 2);
    if (r.y > 0) s += `<path class="bar" style="animation-delay:${i * 14}ms" opacity="${i >= n - 7 ? 1 : .42}" d="M${x.toFixed(1)},${(T + ph).toFixed(1)} V${(y + rr).toFixed(1)} q0,${-rr} ${rr},${-rr} h${(bw - 2 * rr).toFixed(1)} q${rr},0 ${rr},${rr} V${(T + ph).toFixed(1)} Z" fill="url(#${id})"/>`;
    if ((i % 5 === 0 && n - 1 - i > 4) || i === n - 1) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 5}" text-anchor="${i === n - 1 ? 'end' : 'middle'}">${esc(r.x)}</text>`;
    s += `<rect x="${(L + i * band).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ph}" fill="transparent" data-tip="${esc(r.x)}  ${unit}${fmt(r.y)}"/>`;
  });
  const mx = rows.reduce((a, r, i) => r.y > rows[a].y ? i : a, 0);
  if (rows[mx].y > 0) s += `<text x="${(L + mx * band + band / 2).toFixed(1)}" y="${Y(rows[mx].y) - 5}" text-anchor="middle" style="fill:var(--t1);font-weight:600">${unit}${fmt(rows[mx].y)}</text>`;
  el.innerHTML = s + '</svg>';
}
// 多条线（按时间）：series = [{ name, pts: [[t, y]] }]，越靠前的线越亮
function drawLines(el, series) {
  const w = el.clientWidth, h = el.clientHeight; let all = series.flatMap(s => s.pts); if (w < 60 || h < 60) return;
  series = series.filter(s => s.pts.length >= 2); const span = all.length ? Math.max(...all.map(p => p[0])) - Math.min(...all.map(p => p[0])) : 0;
  if (!series.length || span < 3600e3) { el.innerHTML = '<div class="empty">采样还不够，攒到两次以上（间隔几小时）这里会画出每个平台的走势</div>'; return; }
  all.length = 0; all.push(...series.flatMap(s => s.pts));
  const L = 52, R = 70, T = 14, B = 22, x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), top = niceMax(Math.max(...all.map(p => p[1]), 1));
  const X = (t) => L + (t - x0) / (x1 - x0) * (w - L - R), Y = (v) => T + (h - T - B) - v / top * (h - T - B);
  let s = `<svg width="${w}" height="${h}">`;
  for (const t of [0, top / 2, top]) s += `<line x1="${L}" x2="${w - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="rgba(42,54,200,.2)"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end">${t >= 10000 ? t / 10000 + '万' : fmt(t)}</text>`;
  series.forEach((sr, i) => { if (!sr.pts.length) return; const op = Math.max(.3, 1 - i * .17), last = sr.pts[sr.pts.length - 1];
    s += `<polyline points="${sr.pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}" fill="none" stroke="var(--p-${Object.keys(PN).find(k => PN[k] === sr.name)})" stroke-opacity="1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(last[0]).toFixed(1)}" cy="${Y(last[1]).toFixed(1)}" r="4" fill="var(--p-${Object.keys(PN).find(k => PN[k] === sr.name)})" stroke="#fff" stroke-width="2" data-tip="${esc(sr.name)}  ${fmt(last[1])}"/><text x="${(X(last[0]) + 8).toFixed(1)}" y="${(Y(last[1]) + 4).toFixed(1)}" style="fill:var(--t2)">${esc(sr.name)}</text>`; });
  const f = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:00`; };
  s += `<text x="${L}" y="${h - 5}">${f(x0)}</text><text x="${w - R}" y="${h - 5}" text-anchor="end">${f(x1)}</text>`;
  el.innerHTML = s + '</svg>';
}
(() => {
  const tip = document.createElement('div'); tip.id = 'tip'; document.addEventListener('DOMContentLoaded', () => document.body.append(tip));
  document.addEventListener('mousemove', (e) => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t) { tip.style.display = 'none'; return; } tip.textContent = t.dataset.tip; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 14) + 'px'; tip.style.top = Math.max(8, e.clientY - 34) + 'px'; });
})();
