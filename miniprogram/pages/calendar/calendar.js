// pages/calendar/calendar.js
const store = require('../../utils/store.js');

Page({
  data: {
    rangeText: '',
    cells: [],
    weekdays: [],
    selected: null,
  },

  onShow() {
    this.renderCal();
    if (this.data.selected) {
      const { date, dayNum } = this.data.selected;
      if (store.validDayNumber(date) === dayNum) this.openDayDrawer(date, dayNum);
      else this.setData({ selected: null });
    }
  },

  renderCal() {
    const plan = store.getState().plan;
    const s = store.parseDate(plan.start_date);
    const e = store.parseDate(store.planEndDate());
    const pad = (n) => String(n).padStart(2, '0');
    const rangeText = `${s.getMonth()+1}.${pad(s.getDate())}  -  ${e.getMonth()+1}.${pad(e.getDate())}`;

    const cells = [];
    const startWk = store.weekdayOf(plan.start_date);
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const weekdays = labels.map((_, i) => labels[(startWk + i) % 7]);

    const curDay = store.currentDayNumber();
    for (let i = 1; i <= store.TOTAL_DAYS; i++) {
      const dt = store.addDays(plan.start_date, i - 1);
      const done = store.doneCountOfDate(dt);
      const tasks = store.activeTasksList().filter(t => store.isTargetDay(t, dt));
      const total = tasks.length;
      let cls = '';
      if (total > 0 && store.isDaySatisfied(dt)) cls = 'full';
      else if (done > 0) cls = 'partial';
      if (i > curDay) cls += ' future';
      if (dt === store.todayStr()) cls += ' current';
      const d = store.parseDate(dt);
      cells.push({
        key: 'd-' + i,
        date: dt,
        dayNum: i,
        num: d.getDate(),
        cls: cls.trim(),
      });
    }

    this.setData({ rangeText, cells, weekdays });
  },

  onCellTap(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    const dayNum = Number(e.currentTarget.dataset.day);
    this.openDayDrawer(date, dayNum);
  },

  openDayDrawer(date, dayNum) {
    const tasks = store.activeTasksList().filter(t => store.isTargetDay(t, date));
    const cks = store.getCheckinsOfDate(date);
    const isHist = store.isHistorical(date);
    const list = tasks.map(t => {
      const ok = !!cks[t.id];
      let sub = '';
      let met = false;
      let btnMakeup = false;
      if (ok) sub = '已打卡';
      else if (isHist) {
        const remain = store.makeupRemaining(t);
        if (remain > 0) btnMakeup = true;
        else sub = '已漏打';
      } else sub = '待打卡';
      return {
        id: t.id, name: t.name, icon: t.icon, color: t.color,
        colorBg: hexBg(t.color), done: ok, sub, met, btnMakeup, date,
        remain: store.makeupRemaining(t),
      };
    });
    const note = store.getState().notes[date];
    const todos = (store.getState().todos || []).filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      if (Number.isNaN(completed.getTime())) return false;
      const pad = n => String(n).padStart(2, '0');
      const completedDate = `${completed.getFullYear()}-${pad(completed.getMonth() + 1)}-${pad(completed.getDate())}`;
      return completedDate === date;
    }).map(t => ({ id: t.id, title: t.title, note: t.note || '' }));
    this.setData({
      selected: {
        date,
        dayNum,
        dateText: store.fmtCN(date),
        tasks: list,
        todos,
        mood: note ? ({ happy: '😊', ok: '😐', tired: '😴', sad: '😢', fire: '🔥' }[note.mood] || '') : '',
        note: (note && note.content) ? note.content : '这一天没有心得记录',
      },
    });
  },

  onMakeup(e) {
    const { id, date } = e.currentTarget.dataset;
    wx.showModal({
      title: '补打卡',
      content: '将消耗 1 次补打卡机会，确认补打？',
      success: (r) => {
        if (!r.confirm) return;
        const ok = store.doMakeup(id, date);
        if (ok) {
          wx.showToast({ title: '已补打卡', icon: 'success' });
          const dayNum = store.validDayNumber(date);
          this.openDayDrawer(date, dayNum);
        } else {
          wx.showToast({ title: '次数已用完', icon: 'none' });
        }
      },
    });
  },
});

function hexBg(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
