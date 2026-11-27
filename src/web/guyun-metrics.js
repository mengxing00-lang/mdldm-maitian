const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tag = (text, kind) => `<span class="gy-tag${kind ? ' ' + kind : ''}">${esc(text)}</span>`;
const num = (n) => n == null ? '未计入' : String(n);
const stamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function banner() {
  return '<div class="gy-banner">测试夹具：下面的数字只用来看界面，不是平台回传，也不是已接通的账号。</div>';
}

function donut(parts) {
  const total = parts.reduce((sum, part) => sum + part.play, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = parts.map((part) => {
    const len = part.play / total * c;
    const node = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${esc(part.color)}" stroke-width="18" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    offset += len;
    return node;
  }).join('');
  const legend = parts.map((part) => `<div class="gy-legend"><i style="background:${esc(part.color)}"></i>${esc(part.name)} ${esc(part.play)} <span class="gy-k">测试夹具</span></div>`).join('');
  return `<div class="gy-donut"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="播放总数分布">${arcs}</svg><div>${legend}</div></div>`;
}

function spark(series) {
  const max = Math.max(...series, 1);
  const w = 140;
  const h = 32;
  const pts = series.map((value, index) => {
    const x = series.length === 1 ? 0 : (index / (series.length - 1)) * w;
    const y = h - 4 - (value / max) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="gy-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#0071e3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function rankRows(platforms, sort) {
  const key = sort === 'fans' ? 'fans' : sort === 'accounts' ? 'accountTotal' : 'play';
  return [...platforms].sort((a, b) => b[key] - a[key]).map((row, index) => ({ ...row, rank: index + 1 }));
}

export function statsPage(O, extra) {
  const stats = O.stats;
  const sub = (extra && extra.sub) || '';
  const sort = (extra && extra.stat && extra.stat.sort) || 'play';
  const cards = stats.cards.map((card) => `<div class="panel gy-stat"><div class="gy-k">${esc(card.label)}</div><b>${esc(card.value)}</b>${card.accountTotal != null ? `<div class="gy-k">账号总数：${esc(card.accountTotal)}</div>` : ''}<div class="gy-k">${tag('测试夹具', 'ex')}</div></div>`).join('');
  const head = `<div class="gy-stat-head"><div><div class="h1">${esc(stats.title)}</div><p class="lead">汇总示例账号的粉丝、播放总量和新增。不带夹具时这里是「未接入」。没有做官网没写的趋势分析页。</p></div><div class="gy-stat-side"><div class="gy-k">最后更新：${esc(stamp(stats.updatedAt))}</div><button class="btn pri" type="button" data-gy-stats="refresh">刷新数据</button><div class="gy-k">只刷新夹具，不请求平台。</div></div></div>`;
  const tabs = `<div class="gy-sub gy-sub-inline"><a class="${sub !== 'accounts' ? 'on' : ''}" href="#/stats">数据汇总</a><a class="${sub === 'accounts' ? 'on' : ''}" href="#/stats/accounts">按账号</a></div>`;
  if (sub === 'accounts') {
    const rows = stats.accounts.map((account) => `<tr><td>${esc(account.name)} ${tag('示例', 'ex')}</td><td>${esc(account.platformName)}</td><td>${esc(account.fans)}</td><td>${esc(account.fansNew)}</td><td>${esc(num(account.play))}</td><td>${esc(num(account.playNew))}</td></tr>`).join('');
    return `${banner()}${head}${tabs}<div class="panel"><p class="gy-k">${esc(stats.note)}</p><div class="gy-scroll"><table class="gy-table"><thead><tr><th>账号</th><th>平台</th><th>粉丝总量</th><th>粉丝新增</th><th>播放总量</th><th>播放新增</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  const rows = rankRows(stats.platforms, sort).map((row) => `<tr><td>${esc(row.rank)}</td><td>${esc(row.name)} ${tag('示例', 'ex')}</td><td>${esc(row.accountTotal)}</td><td>${esc(row.play)}</td><td>${esc(row.fans)}</td></tr>`).join('');
  const sortBtn = (id, label) => `<button type="button" class="gy-sort${sort === id ? ' on' : ''}" data-gy-sort="${esc(id)}">${esc(label)}</button>`;
  return `${banner()}${head}${tabs}<div class="gy-cards">${cards}</div>
  <div class="gy-split gy-stat-split">
    <div class="panel"><h3>平台排名</h3><p class="gy-k">平台只含当前示例账号组里的小红书和抖音。${esc(stats.note)}</p><div class="gy-scroll"><table class="gy-table"><thead><tr><th>排名</th><th>平台</th><th>${sortBtn('accounts', '账号总数')}</th><th>${sortBtn('play', '播放总数')}</th><th>${sortBtn('fans', '粉丝总数')}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="panel"><h3>播放总数分布</h3>${donut(stats.platforms)}</div>
  </div>`;
}

function workCard(work, view) {
  const inc = view.incremental;
  const play = inc ? work.playNew : work.play;
  const like = inc ? work.likeNew : work.like;
  const comment = inc ? work.commentNew : work.comment;
  const share = inc ? work.shareNew : work.share;
  return `<article class="gy-work"><div class="gy-ph">无封面<br>测试夹具</div><div><b>${esc(work.name)}</b> ${tag('测试夹具', 'ex')}${inc ? ' ' + tag('增量', 'draft') : ''}<div class="gy-kv"><span>播放 ${esc(play)}</span><span>点赞 ${esc(like)}</span><span>评论 ${esc(comment)}</span><span>转发 ${esc(share)}</span></div>${view.chart ? spark(work.series) : ''}<div class="gy-k">${esc(work.platformName)} · 示例账号 ${esc(work.accountName)} · ${esc(stamp(work.at))}</div></div></article>`;
}

function monitorBar(mon) {
  const running = mon.running ? tag('运行中', 'ok') : tag('已停止', 'wait');
  return `<div class="panel gy-mon-bar"><div class="gy-kv"><span>账号数：${esc(mon.accountTotal)}</span><span>作品数：${mon.cleared ? '已清空' : esc(mon.workTotal)}</span>${running}<span>最后刷新：${esc(stamp(mon.updatedAt))}</span><span>最高播放：${esc(num(mon.highPlay))}</span><span>最低播放：${esc(num(mon.lowPlay))}</span></div>
  <div class="btns"><button class="btn" type="button" data-gy-mon="refresh">刷新</button><button class="btn" type="button" data-gy-mon="clear">清空数据</button><button class="btn" type="button" data-gy-mon="notices">通知记录</button><button class="btn" type="button" data-gy-mon="settings">打开设置</button><button class="btn" type="button" data-gy-mon="${mon.running ? 'stop' : 'start'}">${mon.running ? '停止监控' : '开始监控'}</button></div>
  <p class="gy-k">这些按钮只改本机夹具。不会向微信、企业微信、飞书、钉钉或平台发任何东西。</p></div>`;
}

function settingsPanel(mon) {
  if (!mon) return '';
  const channels = (mon.channels || []).map((channel) => `<label class="gy-check"><input type="checkbox" disabled><span><b>${esc(channel.name)}</b><span class="gy-k">未接入。不能打开，也不能填写地址。</span></span>${tag('未接入', 'bad')}</label>`).join('');
  return `<div class="panel"><h3>打开设置</h3><p class="gy-k">通知外发未接入。下面的渠道都是关着的示例，服务端会拒绝外发。</p>${channels}</div>`;
}

function noticePanel(mon) {
  const rows = (mon.notices || []).map((notice) => `<article class="gy-task"><b>${esc(stamp(notice.at))}</b> ${tag('未外发', 'ex')}<p class="gy-k">${esc(notice.text)}</p></article>`).join('');
  return `<div class="panel"><h3>通知记录</h3><p class="gy-k">只存在这份夹具里。</p>${rows || '<p>还没有记录。</p>'}<button class="btn" type="button" data-gy-mon="notice">记一条示例通知</button></div>`;
}

export function monitorPage(O, extra) {
  const mon = O.monitor;
  const view = (extra && extra.mon) || {};
  const sub = (extra && extra.sub) || 'flow';
  const current = ['flow', 'works', 'accounts', 'window', 'orders'].includes(sub) ? sub : 'flow';
  const links = [['flow', '播放流速'], ['works', '作品监控'], ['accounts', '账号监控'], ['window', '橱窗商品'], ['orders', '订单监控']];
  const nav = `<div class="gy-sub">${links.map(([id, label]) => `<a class="${current === id ? 'on' : ''}" href="#/monitor/${id}">${label}</a>`).join('')}</div>`;
  const openSettings = view.settings ? settingsPanel(mon) : '';
  const openNotices = view.notices ? noticePanel(mon) : '';
  let body = '';
  if (current === 'accounts') {
    const rows = (mon.accounts || []).map((account) => `<tr><td>${esc(account.name)} ${tag('示例', 'ex')} ${tag('未登录', 'wait')}</td><td>${esc(account.platformName)}</td><td>${esc(account.fans)}</td><td>${esc(account.fansNew)}</td><td>${esc(num(account.play))}</td></tr>`).join('');
    body = `<div class="panel"><h3>账号监控</h3><p class="gy-k">官网列出了账号监控，配图没有单独画面。这里只用数据统计里已经出现的粉丝和播放，不另造指标。</p><div class="gy-scroll"><table class="gy-table"><thead><tr><th>账号</th><th>平台</th><th>粉丝总量</th><th>粉丝新增</th><th>播放总量</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  } else if (current === 'window') {
    const rows = (mon.windowGoods || []).map((good) => `<article class="gy-task"><b>${esc(good.name)}</b> ${tag('示例', 'ex')} ${tag(good.status, good.status === '已下架' ? 'wait' : 'ok')}<p class="gy-k">${esc(good.note)}</p></article>`).join('');
    body = `<div class="panel"><h3>橱窗商品</h3><p class="gy-k">官网写的是视频号橱窗。当前示例组没有视频号登录，所以这是占位，不是已授权的橱窗。</p>${rows}<button class="btn" type="button" data-gy-mon="notice">记下架提醒（只写夹具）</button></div>`;
  } else if (current === 'orders') {
    const orders = mon.orders || {};
    const cards = [['账号数', orders.accountTotal], ['订单金额', orders.amount], ['订单数', orders.orders], ['退款金额', orders.refund]].map(([label, value]) => `<div class="panel gy-stat"><div class="gy-k">${esc(label)}</div><b>${esc(value)}</b><div class="gy-k">${tag('测试夹具', 'ex')}</div></div>`).join('');
    const rows = (orders.rows || []).map((row) => `<tr><td>${esc(row.accountName)} ${tag('示例', 'ex')}</td><td>${esc(row.shop)}</td><td>${esc(stamp(row.refreshedAt))}</td><td>${esc(row.amount)}</td><td>${esc(row.refund)}</td><td>${esc(row.orders)}</td><td>${esc(row.returns)}</td><td>${esc(row.unit)}</td></tr>`).join('');
    body = `<div class="gy-banner">演示，不是真实订单。没有连接带货助手，也没有出单提醒外发。</div><p class="gy-k">${esc(orders.note || '')}</p><div class="gy-cards gy-cards-4">${cards}</div><div class="panel"><div class="gy-scroll"><table class="gy-table"><thead><tr><th>订单账号</th><th>店铺</th><th>最后刷新</th><th>成交金额</th><th>退款</th><th>订单数</th><th>退单</th><th>客单价</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  } else {
    const works = (mon.works || []).filter((work) => (!view.platform || work.platform === view.platform) && (!view.account || work.accountId === view.account));
    const sorted = [...works].sort((a, b) => view.sort === 'play' ? b.play - a.play : Date.parse(b.at) - Date.parse(a.at));
    const platforms = [...new Map((mon.works || []).map((work) => [work.platform, work.platformName])).entries()];
    const accounts = [...new Map((mon.works || []).filter((work) => !view.platform || work.platform === view.platform).map((work) => [work.accountId, work.accountName])).entries()];
    const controls = `<div class="filters">
      <label>平台 <select data-gy="mon-platform"><option value="">请选择平台</option>${platforms.map(([id, name]) => `<option value="${esc(id)}"${view.platform === id ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <label>账号 <select data-gy="mon-account"><option value="">请选择账号</option>${accounts.map(([id, name]) => `<option value="${esc(id)}"${view.account === id ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <button class="btn${view.incremental ? ' pri' : ''}" type="button" data-gy-mon="incremental">增量流速</button>
      <button class="btn" type="button" data-gy-mon="points">30个点 · 示例</button>
      <button class="btn" type="button" data-gy-mon="hidden">显示隐藏项(0)</button>
      <button class="btn" type="button" data-gy-mon="chart">${view.chart ? '关闭图表' : '打开图表'}</button>
      <button class="btn" type="button" data-gy-mon="columns">${view.columns === 1 ? '单列' : '双列'}</button>
      <button class="btn" type="button" data-gy-mon="sort">${view.sort === 'time' ? '按时间排序' : '按播放排序'}</button>
    </div>${view.pointsNote ? '<p class="gy-k">配图上有「30个点」。它和更新说明里的「聚合 30 个账号」是不是一回事，这里不写成规则，也不改变统计口径。</p>' : ''}`;
    const title = current === 'works' ? '作品监控' : '播放流速';
    const lead = current === 'works'
      ? '看每条示例作品的播放、点赞、评论、转发。不是平台回传。'
      : '跟踪示例作品的播放流速。增量按钮只切换夹具里的新增数。';
    const grid = mon.cleared
      ? '<div class="panel gy-empty"><div class="gy-miss">已清空</div><p>夹具显示已清空。没有请求平台。点「刷新」会把示例填回来。</p></div>'
      : `<div class="gy-works${view.columns === 1 ? ' one' : ''}">${sorted.map((work) => workCard(work, view)).join('') || '<div class="panel gy-empty"><p>这个筛选下没有示例作品。</p></div>'}</div>`;
    body = `<div class="panel"><h3>${title}</h3><p class="gy-k">${lead}</p>${controls}</div>${grid}`;
  }
  const stopped = mon.running ? '' : '<div class="gy-banner">已停止。监控没有在跑，也没有外发。</div>';
  return `${banner()}${stopped}<div class="h1">数据监控</div><p class="lead">对应官网列出的播放流速、作品监控、账号监控、橱窗商品、订单监控。全部是测试夹具。</p><div class="gy-side">${nav}<div>${monitorBar(mon)}${openSettings}${openNotices}${body}</div></div>`;
}
