import type { CoordinationEvent, Task } from './types'
export const DAYS = ['10/28', '10/29', '10/30', '10/31', '11/01', '11/02', '11/03', '11/04', '11/05', '11/06']
export const CURRENT_USER = '林晓'
export const INITIAL_TASKS: Task[] = [
  { id: 'decision', project: '支付体验改版', title: '超时策略确认', owner: '林晓', participants: ['陈宇', '王敏'], status: '已完成', start: 0, end: 0, completedAt: '2026-10-28T15:00:00+01:00', deps: [] },
  { id: 'api', project: '支付体验改版', title: '接口定义交接', owner: '陈宇', participants: ['林晓', '赵晨'], status: '进行中', start: 1, end: 1, deps: ['decision'] },
  { id: 'design', project: '支付体验改版', title: '设计规范交接', owner: '苏禾', participants: ['林晓', '赵晨'], status: '进行中', start: 0, end: 6, deps: [] },
  { id: 'front', project: '支付体验改版', title: '前端实现与联调', owner: '赵晨', participants: ['林晓', '陈宇'], status: '待开始', start: 7, end: 8, deps: ['api', 'design'] },
  { id: 'qa', project: '支付体验改版', title: '上线验收', owner: '李悦', participants: ['林晓'], status: '待开始', start: 9, end: 9, deps: ['front'] },
  { id: 'prototype', project: '支付体验改版', title: '支付流程原型评审', owner: '林晓', participants: ['苏禾', '陈宇'], status: '已完成', start: 0, end: 1, deps: ['decision'] },
  { id: 'copy', project: '支付体验改版', title: '支付文案与错误提示', owner: '苏禾', participants: ['林晓'], status: '进行中', start: 2, end: 4, deps: ['design'] },
  { id: 'integration', project: '支付体验改版', title: '支付回调联调', owner: '陈宇', participants: ['赵晨'], status: '待开始', start: 5, end: 7, deps: ['api'] },
  { id: 'tracking', project: '支付体验改版', title: '埋点方案核对', owner: '王敏', participants: ['林晓', '赵晨'], status: '待开始', start: 4, end: 6, deps: ['design'] },
  { id: 'regression', project: '支付体验改版', title: '回归测试用例整理', owner: '李悦', participants: ['陈宇'], status: '待开始', start: 7, end: 8, deps: ['integration', 'front'] },
  { id: 'release', project: '支付体验改版', title: '发布检查与复盘', owner: '林晓', participants: ['全员'], status: '待开始', start: 9, end: 9, deps: ['qa', 'regression'] },
  { id: 'campaign', project: '增长活动', title: '活动规则确认', owner: '王敏', participants: ['周宁'], status: '待开始', start: 8, end: 9, deps: [] },
]
export const INITIAL_EVENTS: CoordinationEvent[] = [
  { id: 'delay', task: 'api', title: '接口交付预计顺延一天', source: '后端项目群 · 陈宇 · 10/28 10:52', quote: '错误码还没对齐，接口定义预计周五提供。', pending: true },
  { id: 'submitted', task: 'design', title: '设计规范 v4 已提交，等待前端接收', source: '设计任务 DS-018 · 苏禾 · 10/28 10:20', quote: '交付稿已更新，请确认材料完整性。' },
  { id: 'meeting', task: 'decision', title: '评审待确认超时重试策略', source: '方案评审 · 录音 18:32–19:10', quote: '产品需要明确超时后的重试规则，再完成接口定稿。' },
  { id: 'rule', task: 'campaign', title: '活动规则变更为指定商品满减', source: '活动任务 EVT-042 · 评论 #18', quote: '规则已更新，请确认页面文案。' },
]
export const INITIAL_PROJECTS = ['支付体验改版', '增长活动']
export const STORAGE_KEY = 'workbase-coordination-v3'
