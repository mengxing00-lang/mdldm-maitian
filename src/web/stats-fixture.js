// 古韵数据统计 / 数据监控的测试夹具。
// 数字只服务界面演示，不代表平台回传。账号只来自已标明示例、未登录的分组。
import { GROUPS } from './distribute.js';

const PN = { xhs: '小红书', douyin: '抖音' };
const COLOR = { xhs: '#ff2442', douyin: '#1d1d1f' };
const FANS = {
  'xhs-guyun-main': [800, 10],
  'xhs-guyun-pattern': [420, 6],
  'dy-nishijin-main': [510, 8],
  'dy-nishijin-loom': [260, 4],
  'dy-guyun-main': [300, 5],
  'dy-guyun-tea': [180, 2],
  'dy-guyun-pattern': [90, 1],
};

export const MONITOR_CHANNELS = [
  { id: 'weixin', name: '微信', connected: false },
  { id: 'wecom', name: '企业微信', connected: false },
  { id: 'feishu', name: '飞书', connected: false },
  { id: 'dingtalk', name: '钉钉', connected: false },
];

const WORK_SEED = [
  { id: 'fixture-weave', name: '【测试夹具】西阵织纹样短片', platform: 'xhs', accountId: 'xhs-guyun-main', at: '2026-11-20T02:00:00.000Z', play: 900, playNew: 50, like: 40, likeNew: 8, favoriteNew: 5, comment: 6, commentNew: 2, share: 3, shareNew: 1, series: [4, 6, 8, 10, 7, 9, 6] },
  { id: 'fixture-tea', name: '【测试夹具】古韵茶席成片', platform: 'douyin', accountId: 'dy-nishijin-main', at: '2026-11-18T02:00:00.000Z', play: 600, playNew: 30, like: 22, likeNew: 4, favoriteNew: 2, comment: 3, commentNew: 1, share: 2, shareNew: 1, series: [3, 4, 5, 6, 4, 5, 3] },
  { id: 'fixture-album', name: '【测试夹具】京纹样册页', platform: 'douyin', accountId: 'dy-guyun-main', at: '2026-11-16T02:00:00.000Z', play: 360, playNew: 20, like: 15, likeNew: 3, favoriteNew: 1, comment: 2, commentNew: 1, share: 1, shareNew: 0, series: [2, 3, 3, 4, 2, 3, 3] },
];

export const WINDOW_GOODS = [
  { id: 'win-1', name: '示例橱窗：纹样册页', status: '在架', note: '不是在售商品。没有授权带货助手。' },
  { id: 'win-2', name: '示例橱窗：茶席', status: '已下架', note: '下架只写在夹具里，没有发出通知。' },
];

export const ORDER_ROWS = [
  { id: 'ord-1', accountName: '抖音古韵西阵织造物', shop: '示例小店', refreshedAt: '2026-11-27T02:10:00.000Z', amount: 18, refund: 0, orders: 1, returns: 0, unit: 18 },
  { id: 'ord-2', accountName: '小红书古韵造物', shop: '示例小店', refreshedAt: '2026-11-27T02:20:00.000Z', amount: 6, refund: 2, orders: 1, returns: 1, unit: 6 },
];

const sum = (rows, key) => rows.reduce((s, row) => s + (row[key] || 0), 0);

export function accountRows() {
  return GROUPS.flatMap((group) => group.accounts.map((account) => {
    const pair = FANS[account.id];
    if (!pair) throw new Error('示例账号缺少粉丝夹具：' + account.id);
    return {
      id: account.id, name: account.name, platform: account.platform, platformName: PN[account.platform] || account.platform,
      groupId: group.id, groupName: group.name, example: true, loggedIn: false, fixture: true,
      fans: pair[0], fansNew: pair[1],
    };
  }));
}

export function workRows() {
  const accounts = Object.fromEntries(accountRows().map((account) => [account.id, account]));
  return WORK_SEED.map((work) => {
    const account = accounts[work.accountId];
    if (!account) throw new Error('作品夹具挂到了未知账号：' + work.accountId);
    return { ...work, accountName: account.name, platformName: PN[work.platform], example: true, fixture: true, label: '测试夹具' };
  });
}

export function buildStats(updatedAt) {
  const accounts = accountRows();
  const works = workRows();
  const withPlay = accounts.map((account) => {
    const mine = works.filter((work) => work.accountId === account.id);
    return { ...account, play: mine.length ? sum(mine, 'play') : null, playNew: mine.length ? sum(mine, 'playNew') : null };
  });
  const byPlatform = ['douyin', 'xhs'].map((platform) => {
    const mineAccounts = withPlay.filter((account) => account.platform === platform);
    const mineWorks = works.filter((work) => work.platform === platform);
    return {
      platform, name: PN[platform], example: true, fixture: true,
      accountTotal: mineAccounts.length,
      play: sum(mineWorks, 'play'),
      fans: sum(mineAccounts, 'fans'),
      color: COLOR[platform],
    };
  }).sort((a, b) => b.play - a.play).map((row, index) => ({ ...row, rank: index + 1 }));
  const cards = [
    { key: 'playNew', label: '昨日新增播放数', value: sum(works, 'playNew') },
    { key: 'works', label: '作品总数', value: works.length },
    { key: 'fansNet', label: '昨日净增粉', value: sum(withPlay, 'fansNew') },
    { key: 'fans', label: '粉丝总数', value: sum(withPlay, 'fans'), accountTotal: withPlay.length },
    { key: 'likeNew', label: '昨日新增点赞数', value: sum(works, 'likeNew') },
    { key: 'favoriteNew', label: '昨日新增收藏数', value: sum(works, 'favoriteNew') },
    { key: 'commentNew', label: '昨日新增评论数', value: sum(works, 'commentNew') },
    { key: 'shareNew', label: '昨日新增转发数', value: sum(works, 'shareNew') },
  ].map((card) => ({ ...card, fixture: true, labelMark: '测试夹具' }));
  const orders = {
    fixture: true,
    demo: true,
    note: '演示，不是真实订单。没有连接带货助手。配图上还有今日、昨日、近 7 日，夹具没有按日拆开，所以这里只给一份示例合计。',
    accountTotal: new Set(ORDER_ROWS.map((row) => row.accountName)).size,
    amount: sum(ORDER_ROWS, 'amount'),
    orders: sum(ORDER_ROWS, 'orders'),
    refund: sum(ORDER_ROWS, 'refund'),
    rows: ORDER_ROWS.map((row) => ({ ...row, fixture: true, example: true })),
  };
  return {
    fixture: true, label: '测试夹具', updatedAt: updatedAt || '2026-11-27T02:00:00.000Z', title: '多平台总览',
    note: '这些数字是测试夹具，不是平台回传。未挂作品的示例账号，播放写「未计入」，不用 0 代替。',
    cards, platforms: byPlatform, accounts: withPlay, works, orders,
    windowGoods: WINDOW_GOODS.map((row) => ({ ...row, fixture: true, example: true })),
  };
}

export function playExtent(works) {
  if (!works || !works.length) return { high: null, low: null };
  const plays = works.map((work) => work.play);
  return { high: Math.max(...plays), low: Math.min(...plays) };
}

export function monitorSeed() {
  return {
    running: true,
    cleared: false,
    updatedAt: '2026-11-27T02:00:00.000Z',
    notices: [{
      id: 'seed-notice', at: '2026-11-27T02:00:00.000Z', delivered: false, fixture: true,
      text: '示例通知记录：没有发到微信、企业微信、飞书或钉钉。',
    }],
  };
}

export function orderSummary(stats) {
  return stats.orders;
}
