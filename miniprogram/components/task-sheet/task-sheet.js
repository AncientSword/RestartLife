// components/task-sheet/task-sheet.js
const store = require('../../utils/store.js');

Component({
  properties: {
    editingId: { type: String, value: null, observer: 'onIdChange' },
  },

  data: {
    titleText: '新建打卡项目',
    iconList: store.ICONS,
    colorList: store.COLORS,
    form: {
      name: '',
      icon: store.ICONS[0],
      color: store.COLORS[0],
      frequencyType: 'daily',
    },
    curTargetDays: [],
    tdCells: [],
    tdCount: 0,
  },

  lifetimes: {
    attached() {
      this.loadFromTask(this.data.editingId);
    },
  },

  methods: {
    noop() {},

    onIdChange(id) {
      if (this.data._ready) this.loadFromTask(id);
    },

    loadFromTask(id) {
      const t = id ? store.getState().tasks.find(x => x.id === id) : null;
      this.setData({
      titleText: id ? '编辑项目' : '新建打卡项目',
        form: {
          name: t ? t.name : '',
          icon: t ? t.icon : store.ICONS[0],
          color: t ? t.color : store.COLORS[0],
          frequencyType: t ? t.frequencyType : 'daily',
        },
        curTargetDays: (t && t.targetDays) ? t.targetDays.slice() : Array(store.TOTAL_DAYS).fill(false),
      });
      this.renderTdGrid();
    },

    onNameInput(e) {
      this.setData({ 'form.name': e.detail.value });
    },

    onIconPick(e) {
      this.setData({ 'form.icon': e.currentTarget.dataset.icon });
    },

    onColorPick(e) {
      this.setData({ 'form.color': e.currentTarget.dataset.color });
    },

    onFreqChange(e) {
      const val = e.currentTarget.dataset.val;
      this.setData({ 'form.frequencyType': val });
    },

    // 渲染21天勾选日历
    renderTdGrid() {
      const plan = store.getState().plan;
      const startWk = store.weekdayOf(plan.start_date);
      const today = store.todayStr();
      const cells = [];
      for (let i = 0; i < startWk; i++) cells.push({ key: 'pad-' + i, empty: true });
      for (let i = 1; i <= store.TOTAL_DAYS; i++) {
        const dt = store.addDays(plan.start_date, i - 1);
        cells.push({
          key: 'd-' + i,
          idx: i - 1,
          num: store.parseDate(dt).getDate(),
          selected: this.data.curTargetDays[i - 1],
          locked: store.isHistorical(dt),
          isToday: dt === today,
        });
      }
      this.setData({
        tdCells: cells,
        tdCount: this.data.curTargetDays.filter(Boolean).length,
      });
    },

    onToggleDay(e) {
      const idx = Number(e.currentTarget.dataset.idx);
      const arr = this.data.curTargetDays.slice();
      // 历史锁定，不允许切换
      const dt = store.addDays(store.getState().plan.start_date, idx);
      if (store.isHistorical(dt)) return;
      arr[idx] = !arr[idx];
      this.setData({ curTargetDays: arr });
      this.renderTdGrid();
    },

    onSave() {
      const name = (this.data.form.name || '').trim();
      if (!name) { wx.showToast({ title: '请输入项目名称', icon: 'none' }); return; }
      if (this.data.form.frequencyType === 'custom'
          && this.data.curTargetDays.filter(Boolean).length === 0) {
        wx.showModal({
          title: '提示',
          content: '当前未选任何目标日，该项目在今日列表中将不显示，确定保存？',
          success: (r) => {
            if (r.confirm) this.doSave(name);
          },
        });
        return;
      }
      this.doSave(name);
    },

    doSave(name) {
      const data = {
        name,
        icon: this.data.form.icon,
        color: this.data.form.color,
        frequencyType: this.data.form.frequencyType,
        targetDays: this.data.curTargetDays.slice(),
      };
      let ok;
      if (this.data.editingId) {
        ok = store.updateTask(this.data.editingId, data);
      } else {
        store.addTask(data);
        ok = true;
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      this.triggerEvent('saved');
    },

    onMaskTap() {
      this.triggerEvent('close');
    },
  },
});