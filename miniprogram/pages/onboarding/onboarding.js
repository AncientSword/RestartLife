const store = require('../../utils/store.js');

Page({
  data: {
    step: 1,
    startDate: '',
    today: '',
    endDate: '',
    selectedTasks: [],
    selectedTodos: [],
    habits: [
      { id: 'sleep', name: '早睡', icon: '🌙', color: '#4A90A4', schedule: 'daily' },
      { id: 'wake', name: '早起', icon: '☀️', color: '#E8B04B', schedule: 'daily' },
      { id: 'exercise', name: '运动', icon: '💪', color: '#D87171', schedule: 'alternate' },
      { id: 'read', name: '阅读', icon: '📖', color: '#5B8C5A', schedule: 'alternate' },
    ],
    suggestions: ['居家大扫除', '去附近的公园散步', '看一场美术展', '培养一个新爱好'],
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    saving: false,
  },

  onLoad() {
    if (store.getState().onboardingCompleted) {
      wx.switchTab({ url: '/pages/today/today' });
      return;
    }
    const today = store.todayStr();
    this.setData({ startDate: today, today, endDate: store.addDays(today, 20) });
    this.renderTargetDays();
  },

  onDateChange(e) {
    const startDate = e.detail.value;
    this.setData({ startDate, endDate: store.addDays(startDate, 20) });
    this.renderTargetDays();
  },
  onTasksChange(e) { this.setData({ selectedTasks: e.detail.value }); },
  onTodosChange(e) { this.setData({ selectedTodos: e.detail.value }); },
  onScheduleChange(e) {
    const habits = this.data.habits.map(h => h.id === e.currentTarget.dataset.id
      ? { ...h, schedule: e.detail.value } : h);
    this.setData({ habits });
  },
  renderTargetDays() {
    const habits = this.data.habits.map(h => {
      const targetDays = h.targetDays || Array(store.TOTAL_DAYS).fill(false);
      const padding = Array.from({ length: store.weekdayOf(this.data.startDate) }, (_, index) => ({
        key: 'padding-' + index, empty: true,
      }));
      const cells = padding.concat(targetDays.map((selected, index) => {
        const date = store.addDays(this.data.startDate, index);
        return { key: 'day-' + index, index, selected, label: Number(date.slice(5, 7)) + '/' + Number(date.slice(8, 10)) };
      }));
      return { ...h, targetDays, cells, targetCount: targetDays.filter(Boolean).length };
    });
    this.setData({ habits });
  },
  onToggleTargetDay(e) {
    const { id, index } = e.currentTarget.dataset;
    const day = Number(index);
    if (!Number.isInteger(day) || day < 0 || day >= store.TOTAL_DAYS) return;
    const habits = this.data.habits.map(h => {
      if (h.id !== id) return h;
      const targetDays = h.targetDays.slice();
      targetDays[day] = !targetDays[day];
      return { ...h, targetDays };
    });
    this.setData({ habits });
    this.renderTargetDays();
  },
  validateTargets() {
    const missing = this.data.habits.find(h => this.data.selectedTasks.includes(h.id)
      && h.schedule === 'custom' && !h.targetDays.some(Boolean));
    if (!missing) return true;
    wx.showToast({ title: '请为' + missing.name + '选择目标日', icon: 'none' });
    return false;
  },
  onNext() {
    if (this.data.step === 2 && !this.validateTargets()) return;
    this.setData({ step: Math.min(3, this.data.step + 1) });
  },
  onBack() { this.setData({ step: Math.max(1, this.data.step - 1) }); },
  onStart() {
    if (this.data.saving) return;
    if (!this.validateTargets()) return;
    this.setData({ saving: true });
    try {
      const tasks = this.data.habits.filter(h => this.data.selectedTasks.includes(h.id))
        .map((h, i) => ({
          id: 'guide-' + h.id, name: h.name, icon: h.icon, color: h.color,
          sort: i, is_default: true, makeupUsed: 0,
          frequencyType: h.schedule === 'daily' ? 'daily' : 'custom',
          targetDays: h.schedule === 'daily' ? null
            : h.schedule === 'custom' ? h.targetDays.slice()
              : Array.from({ length: store.TOTAL_DAYS }, (_, day) => day % 2 === 0),
        }));
      const todos = this.data.selectedTodos.map((title, i) => ({
        id: 'guide-todo-' + i, title, note: '', dueDate: null,
        createdAt: Date.now() + i, completedAt: null, pinned: false,
      }));
      store.completeOnboarding({ startDate: this.data.startDate, tasks, todos });
      wx.switchTab({ url: '/pages/today/today' });
    } catch (error) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },
});
