// pages/today/today.js
const store = require('../../utils/store.js');

Page({
  data: {
    todaySub: '',
    dayNumber: 1,
    pct: 0,
    doneCount: 0,
    totalCount: 0,
    streak: 0,
    ringDeg: 0,
    tasks: [],
    dayDots: [],
    upcoming: [],
    note: { content: '', mood: '' },
    moods: [
      { key: 'happy', label: '😊' },
      { key: 'ok',     label: '😐' },
      { key: 'tired',  label: '😴' },
      { key: 'sad',    label: '😢' },
      { key: 'fire',   label: '🔥' },
    ],
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const cur = store.currentDayNumber();
    const dn = cur < 1 ? 1 : (cur > store.TOTAL_DAYS ? store.TOTAL_DAYS : cur);
    const tasks = store.todayTasks();
    const cks = store.getCheckinsOfDate(store.todayStr());
    const doneCount = tasks.filter(t => cks[t.id]).length;
    const totalCount = tasks.length;
    const pct = totalCount ? Math.round(doneCount / totalCount * 100) : 0;

    // 21 个进度点
    const dayDots = [];
    for (let i = 1; i <= store.TOTAL_DAYS; i++) {
      const dt = store.addDays(store.getState().plan.start_date, i - 1);
      dayDots.push({
        current: i === dn,
        done: store.doneCountOfDate(dt) > 0,
      });
    }

    this.setData({
      todaySub: store.fmtCNDay(store.todayStr()),
      dayNumber: dn,
      tasks: tasks.map(t => ({
        id: t.id, name: t.name, icon: t.icon, color: t.color,
        colorBg: hexBg(t.color),
        done: !!cks[t.id],
      })),
      doneCount,
      totalCount,
      pct,
      streak: store.streak(),
      ringDeg: pct / 100 * 360,
      dayDots,
      upcoming: this.computeUpcoming(),
      note: store.getState().notes[store.todayStr()] || { content: '', mood: '' },
    });
  },

  // 未完成任务：按截止日期升序（已逾期在前，最近截止在前）
  computeUpcoming() {
    const today = store.todayStr();
    const all = (store.getState().todos || [])
      .filter(t => !t.completedAt && t.dueDate)
      .map(t => ({ t, days: store.diffDays(t.dueDate, today) }))
      .sort((a, b) => a.days - b.days);
    return all.map(({ t, days }) => {
      let badge, overdue = false;
      if (days < 0) { badge = `已逾期 ${-days} 天`; overdue = true; }
      else if (days === 0) { badge = '今天截止'; overdue = true; }
      else if (days === 1) badge = '明天截止';
      else badge = `${days} 天后截止`;
      return { id: t.id, title: t.title, badge, overdue };
    });
  },

  goTodos() {
    wx.switchTab({ url: '/pages/todos/todos' });
  },

  onQuickToggle(e) {
    const id = e.currentTarget.dataset.id;
    store.toggleTodo(id);
    this.setData({ upcoming: this.computeUpcoming() });
    wx.showToast({ title: '已完成', icon: 'success' });
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id;
    store.toggleCheck(id);
    this.refresh();
    // 全部完成庆祝
    if (store.todayTasks().length > 0 && store.isDaySatisfied(store.todayStr())) {
      wx.showToast({ title: '全部完成！🎉', icon: 'none', duration: 1500 });
    }
  },

  onNoteInput(e) {
    store.setNote(e.detail.value, undefined);
    // 输入时不重渲染整页，避免输入法抖动
    this.data.note.content = e.detail.value;
  },

  onMood(e) {
    const mood = e.currentTarget.dataset.mood;
    store.setNote(undefined, mood);
    this.setData({ 'note.mood': mood });
  },

  onSaveNote() {
    store.setNote(this.data.note.content || '', this.data.note.mood || '');
    wx.showToast({ title: '心得已保存', icon: 'success' });
  },
});

// #fff 转 rgba 背景（约 10% 透明度）
function hexBg(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
