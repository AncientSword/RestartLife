// pages/tasks/tasks.js
const store = require('../../utils/store.js');

Page({
  data: {
    tasks: [],
    sheetVisible: false,
    editingId: null,
  },

  onShow() { this.refresh(); },

  refresh() {
    const tasks = store.activeTasksList().map(t => {
      const r = store.taskProgressOverall(t);
      const freqText = t.frequencyType === 'custom' ? '自由选择' : '每天';
      let extra = '';
      if (t.frequencyType === 'custom') {
        const targetCount = (t.targetDays || []).filter(Boolean).length;
        extra = ` · 目标 ${targetCount} 天`;
      }
      const remain = store.makeupRemaining(t);
      extra += ` · 补打卡 ${remain}/${store.MAX_MAKEUPS}`;
      return {
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        colorBg: hexBg(t.color),
        freqText,
        rateText: Math.round(r.rate * 100) + '%',
        extra,
      };
    });
    this.setData({ tasks });
  },

  onAdd() {
    this.setData({ sheetVisible: true, editingId: null });
  },

  onEdit(e) {
    this.setData({ sheetVisible: true, editingId: e.currentTarget.dataset.id });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除项目',
      content: '删除该项目？后续不再显示，历史记录保留。',
      success: (r) => {
        if (!r.confirm) return;
        store.deleteTask(id);
        this.refresh();
        wx.showToast({ title: '已删除', icon: 'none' });
      },
    });
  },

  onSheetClose() { this.setData({ sheetVisible: false, editingId: null }); },

  onSheetSaved() {
    this.setData({ sheetVisible: false, editingId: null });
    this.refresh();
  },
});

function hexBg(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}