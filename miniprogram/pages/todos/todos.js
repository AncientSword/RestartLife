// pages/todos/todos.js
const store = require('../../utils/store.js');

Page({
data: {
    todos: [],
    filter: 'pending',
    emptyHint: '没有未完成任务',
    sheetVisible: false,
    sheetTitle: '新建任务',
    editingId: null,
    form: { title: '', note: '', dueDate: '' },
    dueMin: '',
    dueMax: '',
  },

  onShow() { this.refresh(); },

  refresh() {
    const filter = this.data.filter;
    // listTodos 仍返回所有未完成（showDone=true 全部），这里自己做三态过滤
    const all = store.listTodos(true);
    const filtered = all.filter(t => {
      const done = !!t.completedAt;
      if (filter === 'all') return true;
      if (filter === 'done') return done;
      return !done;
    });
    const emptyHint = filter === 'done' ? '还没有已完成任务'
      : filter === 'all' ? '还没有任务，加一个吧'
      : '没有未完成任务';
    const todos = filtered.map(t => {
      const done = !!t.completedAt;
      let dueText = '';
      let overdue = false;
      if (t.dueDate) {
        const d = store.parseDate(t.dueDate);
        const wk = ['日','一','二','三','四','五','六'];
        dueText = `截止 ${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')} 周${wk[d.getDay()]}`;
        if (!done && t.dueDate < store.todayStr()) {
          dueText = '已逾期 ' + dueText.replace('截止 ', '');
          overdue = true;
        }
      }
      return {
        id: t.id,
        title: t.title,
        note: t.note,
        done,
        dueText,
        overdue,
      };
    });
    this.setData({ todos, emptyHint });
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f });
    this.refresh();
  },

  onToggle(e) {
    store.toggleTodo(e.currentTarget.dataset.id);
    this.refresh();
    wx.showToast({ title: '已切换', icon: 'none' });
  },

  onAdd() {
    this.setData({
      sheetVisible: true,
      sheetTitle: '新建任务',
      editingId: null,
      dueMin: store.todayStr(),
      dueMax: store.planEndDate(),
      form: { title: '', note: '', dueDate: '' },
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const t = store.getState().todos.find(x => x.id === id);
    if (!t) return;
    this.setData({
      sheetVisible: true,
      sheetTitle: '编辑任务',
      editingId: id,
      dueMin: store.todayStr(),
      dueMax: store.planEndDate(),
      form: { title: t.title, note: t.note, dueDate: t.dueDate || '' },
    });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除任务',
      content: '确定删除这个任务？',
      success: (r) => {
        if (!r.confirm) return;
        store.deleteTodo(id);
        this.refresh();
        wx.showToast({ title: '已删除', icon: 'none' });
      },
    });
  },

  // 输入草稿只保存在逻辑层，避免每次输入又回写原生输入框，触发光标和键盘避让重排。
  onTitleInput(e) { this.data.form.title = e.detail.value; },
  onNoteInput(e) { this.data.form.note = e.detail.value; },
  onDueChange(e) { this.setData({ 'form.dueDate': e.detail.value }); },

  onSave() {
    const title = (this.data.form.title || '').trim();
    if (!title) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    const dueDate = this.data.form.dueDate || null;
    if (dueDate && (dueDate < store.todayStr() || dueDate > store.planEndDate())) {
      wx.showToast({ title: '截止日期须在今天至计划最后一天内', icon: 'none' });
      return;
    }
    const data = {
      title,
      note: this.data.form.note,
      dueDate,
    };
    if (this.data.editingId) {
      store.updateTodo(this.data.editingId, data);
    } else {
      store.addTodo(data);
    }
    this.setData({ sheetVisible: false });
    this.refresh();
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onMaskTap() { this.setData({ sheetVisible: false }); },
  noop() {},
});
