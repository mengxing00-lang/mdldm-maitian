// 古韵四个入口共用的筛选。没有真实来源时由页面显示「未接入」，这里不把空列表写成 0。
export function rowsFor(episodes, bucket) {
  const eps = episodes || [];
  if (bucket === 'materials') return eps.map((e) => ({ id: e.id, name: e.name, platform: '', state: 'material', stateCn: (e.guyun && e.guyun.kind) || '素材', schedule: e.schedule || '', detail: (e.guyun && e.guyun.copy) || '' }));
  if (bucket === 'review') {
    const rows = [];
    for (const e of eps) {
      if (e.guyun && e.guyun.review) rows.push({ id: e.id, name: e.name, platform: '', state: e.guyun.review, stateCn: e.guyun.reviewCn || e.guyun.review, schedule: e.schedule || '', detail: e.guyun.copy || '' });
      else for (const t of e.tasks || []) if (['awaiting_user', 'filled'].includes(t.state)) rows.push({ id: e.id, name: e.name, platform: t.platform, state: t.state, stateCn: t.stateCn || t.state, schedule: e.schedule || '', detail: t.detail || '' });
    }
    return rows;
  }
  const want = { schedule: ['scheduled', 'planned'], records: ['published'] }[bucket] || [];
  const rows = [];
  for (const e of eps) {
    if (e.guyun && e.guyun.review) continue;
    for (const t of e.tasks || []) if (want.includes(t.state)) rows.push({ id: e.id, name: e.name, platform: t.platform, state: t.state, stateCn: t.stateCn || t.state, schedule: e.schedule || '', detail: t.detail || '' });
  }
  return rows;
}

export function filterItems(items, { status = '', q = '' } = {}) {
  const query = String(q || '').trim();
  return (items || []).filter((it) => (!status || it.state === status) && (!query || String(it.name || '').includes(query)));
}
