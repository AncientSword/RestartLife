// pages/mine/mine.js
const store = require('../../utils/store.js');

Page({
  data: {
    subText: '',
    pct: 0,
    ringDeg: 0,
    streak: 0,
    totalDoneDays: 0,
    bars: [],
    heat: [],
    planInfo: '',
    todoDone: 0,
    todoTotal: 0,
    todoPending: 0,
    todoOverdue: 0,
    todoPct: 0,
    importVisible: false,
    importText: '',
  },

  onShow() { this.refresh(); },

  refresh() {
    const o = store.overallRate();
    const tasks = store.activeTasksList();
    const bars = tasks.map(t => {
      const r = store.taskProgressOverall(t);
      const pct = Math.round(r.rate * 100);
      return {
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        width: pct,
        pctText: pct + '%',
      };
    });

    const heat = [];
    for (let i = 1; i <= store.TOTAL_DAYS; i++) {
      const dt = store.addDays(store.getState().plan.start_date, i - 1);
      const tasks2 = store.activeTasksList().filter(t => store.isTargetDay(t, dt));
      const cks = store.getCheckinsOfDate(dt);
      const done = tasks2.filter(t => cks[t.id]).length;
      const total = tasks2.length;
      const r = total ? done / total : 0;
      let bg = '#ECECE6';
      if (r > 0) {
        const alpha = (0.3 + r * 0.7).toFixed(2);
        bg = `rgba(91,140,90,${alpha})`;
      }
      heat.push({ bg });
    }

    const plan = store.getState().plan;
    const planInfo = `开始于 ${store.fmtCN(plan.start_date)}，结束于 ${store.fmtCN(store.planEndDate())}`;

    // 任务进度统计
    const todos = store.getState().todos || [];
    const today = store.todayStr();
    const todoTotal = todos.length;
    const todoDone = todos.filter(t => t.completedAt).length;
    const todoPending = todoTotal - todoDone;
    const todoOverdue = todos.filter(t => !t.completedAt && t.dueDate && t.dueDate < today).length;
    const todoPct = todoTotal ? Math.round(todoDone / todoTotal * 100) : 0;

    this.setData({
      subText: `已完成 ${o.done} / ${o.total} 次打卡`,
      pct: Math.round(o.rate * 100),
      ringDeg: o.rate * 360,
      streak: store.streak(),
      totalDoneDays: store.totalDoneDays(),
      bars,
      heat,
      planInfo,
      todoDone,
      todoTotal,
      todoPending,
      todoOverdue,
      todoPct,
    });
  },

  onReset() {
    wx.showModal({
      title: '重置计划',
      content: '重置后将从今天重新开始 21 天计划，所有打卡和心得会清空，确定吗？',
      success: (r) => {
        if (!r.confirm) return;
        store.resetPlan();
        this.refresh();
        wx.showToast({ title: '已重置', icon: 'success' });
      },
    });
  },

  // 分享转发卡片：动态生成标题和描述
  onShareAppMessage() {
    const o = store.overallRate();
    const day = store.currentDayNumber();
    const st = store.streak();
    const todoDone = (store.getState().todos || []).filter(t => t.completedAt).length;
    const todoTotal = (store.getState().todos || []).length;
    return {
      title: `【重启人生·第${day}天】完成率${Math.round(o.rate * 100)}% · 连续${st}天`,
      path: '/pages/today/today',
    };
  },

  onExport() {
    const s = store.getState();
    const json = JSON.stringify({
      v: 4,
      plan: s.plan,
      tasks: s.tasks,
      checkins: s.checkins,
      notes: s.notes,
      todos: s.todos,
    });
    wx.setClipboardData({
      data: json,
      success: () => wx.showToast({ title: '数据已复制', icon: 'success' }),
    });
  },

  onImportTap() {
    this.setData({ importVisible: !this.data.importVisible });
  },

  onImportInput(e) {
    this.setData({ importText: e.detail.value });
  },

  onImport() {
    const raw = (this.data.importText || '').trim();
    if (!raw) { wx.showToast({ title: '请先粘贴数据', icon: 'none' }); return; }
    wx.showModal({
      title: '导入确认',
      content: '导入会覆盖现有所有数据，确定吗？',
      success: (r) => {
        if (!r.confirm) return;
        try {
          const obj = JSON.parse(raw);
          if (!obj.plan || !Array.isArray(obj.tasks)) {
            wx.showToast({ title: '数据格式不正确', icon: 'none' });
            return;
          }
          const s = store.getState();
          s.plan = obj.plan;
          s.tasks = obj.tasks.map(t => ({
            ...t,
            frequencyType: t.frequencyType || 'daily',
            targetDays: t.targetDays || null,
            makeupUsed: t.makeupUsed || 0,
          }));
          s.checkins = obj.checkins || {};
          s.notes = obj.notes || {};
          s.todos = (obj.todos || []).map(t => ({
            id: t.id, title: t.title, note: t.note || '',
            dueDate: t.dueDate || null, createdAt: t.createdAt || Date.now(),
            completedAt: t.completedAt || null, pinned: t.pinned || false,
          }));
          store.save && store.save();
          // 直接写本地存储
          wx.setStorageSync('restart_life_v4', s);
          this.setData({ importVisible: false, importText: '' });
          this.refresh();
          wx.showToast({ title: '导入成功', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: 'JSON 解析失败', icon: 'none' });
        }
      },
    });
  },
});