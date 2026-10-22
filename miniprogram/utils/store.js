// utils/store.js
// 数据层 - 完整移植自原型 prototype/index.html，把 localStorage 换成 wx.getStorageSync

const STORAGE_KEY = 'restart_life_v3';
const TOTAL_DAYS = 21;
const MAX_MAKEUPS = 3;

const ICONS = ['📵','🌙','☀️','💪','📖','🧘','💧','🥗','✍️','🏃','🎵','🚭','💊','🌳','🧹','🙏'];
const COLORS = ['#5B8C5A','#4A90A4','#E8B04B','#9B7EBD','#D87171','#3AA0A0','#C97B5B','#6B7BB0'];

// 频率类型：daily = 每天必打；custom = 自由选择目标日
const DEFAULT_TASKS = [
  { id: 't1', name: '远离电子设备', icon: '📵', color: '#9B7EBD', is_default: true, sort: 0, frequencyType: 'daily' },
  { id: 't2', name: '早睡',        icon: '🌙', color: '#4A90A4', is_default: true, sort: 1, frequencyType: 'daily' },
  { id: 't3', name: '早起',        icon: '☀️', color: '#E8B04B', is_default: true, sort: 2, frequencyType: 'daily' },
  { id: 't4', name: '运动',        icon: '💪', color: '#D87171', is_default: true, sort: 3, frequencyType: 'custom' },
  { id: 't5', name: '阅读',        icon: '📖', color: '#5B8C5A', is_default: true, sort: 4, frequencyType: 'custom' },
];

let state = null;

/* ----------------- 读写 ----------------- */
function init() {
  state = load();
  state.todos = state.todos || [];
  return state;
}

function load() {
  // v2 → v3 迁移
  const oldV2 = wx.getStorageSync('restart_life_v2');
  if (oldV2 && !wx.getStorageSync(STORAGE_KEY)) {
    try {
      const v2 = oldV2;
      const migrated = {
        plan: v2.plan || { start_date: todayStr(), status: 'active' },
        tasks: (v2.tasks || []).map(t => ({
          id: t.id, name: t.name, icon: t.icon, color: t.color,
          is_default: t.is_default, sort: t.sort,
          frequencyType: t.frequencyType === 'weekly' ? 'custom' : 'daily',
          targetDays: t.frequencyType === 'weekly'
            ? Array(TOTAL_DAYS).fill(false).map((_, i) => i % 7 < t.frequencyTarget)
            : null,
          makeupUsed: 0,
        })),
        checkins: v2.checkins || {},
        notes: v2.notes || {},
        editingTaskId: null,
      };
      wx.setStorageSync(STORAGE_KEY, migrated);
    } catch (e) {
      console.warn('迁移 v2 失败', e);
    }
  }
  // v1 → v3
  const oldV1 = wx.getStorageSync('restart_life_v1');
  if (oldV1 && !wx.getStorageSync(STORAGE_KEY)) {
    try {
      const v1 = oldV1;
      const migrated = {
        plan: v1.plan || { start_date: todayStr(), status: 'active' },
        tasks: (v1.tasks || []).map(t => ({
          ...t,
          frequencyType: 'daily',
          targetDays: null,
          makeupUsed: 0,
        })),
        checkins: v1.checkins || {},
        notes: v1.notes || {},
        editingTaskId: null,
      };
      wx.setStorageSync(STORAGE_KEY, migrated);
    } catch (e) {
      console.warn('迁移 v1 失败', e);
    }
  }
  const raw = wx.getStorageSync(STORAGE_KEY);
  if (raw) return raw;

  const today = todayStr();
  return {
    plan: { start_date: today, status: 'active' },
    tasks: DEFAULT_TASKS,
    checkins: {},
    notes: {},
    editingTaskId: null,
  };
}

function save() {
  wx.setStorageSync(STORAGE_KEY, state);
}

function getState() { return state; }

/* ----------------- 常量导出 ----------------- */
function totalDays() { return TOTAL_DAYS; }
function maxMakeups() { return MAX_MAKEUPS; }
function icons() { return ICONS; }
function colors() { return COLORS; }

/* ----------------- 日期工具 ----------------- */
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function parseDate(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function dateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}
function diffDays(a, b) {
  return Math.round((parseDate(a) - parseDate(b)) / 86400000);
}
function weekdayOf(s) {
  return (parseDate(s).getDay() + 6) % 7;
}
function fmtCN(s) {
  const d = parseDate(s);
  const wk = ['日','一','二','三','四','五','六'];
  return `${d.getMonth()+1}月${d.getDate()}日 周${wk[d.getDay()]}`;
}
function fmtCNDay(s) {
  const d = parseDate(s);
  const wk = ['日','一','二','三','四','五','六'];
  return `${pad(d.getMonth()+1)}.${pad(d.getDate())} 周${wk[d.getDay()]}`;
}

/* ----------------- 计划/周期 ----------------- */
function currentDayNumber() {
  return diffDays(todayStr(), state.plan.start_date) + 1;
}
function planEndDate() {
  return addDays(state.plan.start_date, TOTAL_DAYS - 1);
}
function validDayNumber(dateStr) {
  const n = diffDays(dateStr, state.plan.start_date) + 1;
  return n >= 1 && n <= TOTAL_DAYS ? n : null;
}

/* ----------------- 目标日 / 历史锁定 ----------------- */
function isTargetDay(task, date) {
  const dayNum = validDayNumber(date);
  if (dayNum === null) return false;
  if (task.frequencyType === 'daily') return true;
  if (!task.targetDays) return false;
  return task.targetDays[dayNum - 1] === true;
}

function isHistorical(date) {
  return date < todayStr();
}

function makeupRemaining(task) {
  return Math.max(0, MAX_MAKEUPS - (task.makeupUsed || 0));
}

function canMakeup(task, date) {
  if (!isHistorical(date)) return false;
  return makeupRemaining(task) > 0;
}

/* ----------------- 查询 ----------------- */
function getCheckinsOfDate(date) {
  return state.checkins[date] || {};
}
function activeTasks() {
  return state.tasks.slice().sort((a,b) => a.sort - b.sort);
}
function get(id) { return state.tasks.find(x => x.id === id); }

function todayTasks() {
  const today = todayStr();
  return activeTasks().filter(t => isTargetDay(t, today));
}
function doneCountOfDate(date) {
  const c = getCheckinsOfDate(date);
  return activeTasks().filter(t => isTargetDay(t, date) && c[t.id]).length;
}

function streak() {
  let s = 0;
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dt = addDays(todayStr(), -i);
    const n = validDayNumber(dt);
    if (n === null) break;
    const c = getCheckinsOfDate(dt);
    if (activeTasks().some(t => isTargetDay(t, dt) && c[t.id])) {
      s++;
    } else {
      if (dt === todayStr()) continue;
      break;
    }
  }
  return s;
}
function totalDoneDays() {
  let n = 0;
  for (let i = 1; i <= TOTAL_DAYS; i++) {
    const dt = addDays(state.plan.start_date, i - 1);
    if (dt > todayStr()) break;
    const c = getCheckinsOfDate(dt);
    if (activeTasks().some(t => isTargetDay(t, dt) && c[t.id])) n++;
  }
  return n;
}

// 单项目目标日感知进度
function taskProgressOverall(task) {
  const curDay = currentDayNumber();
  if (curDay < 1) return { done: 0, total: 0, rate: 0 };
  const elapsed = Math.min(curDay, TOTAL_DAYS);
  let done = 0, total = 0;
  for (let i = 0; i < elapsed; i++) {
    const dt = addDays(state.plan.start_date, i);
    if (isTargetDay(task, dt)) {
      total++;
      if (state.checkins[dt] && state.checkins[dt][task.id]) done++;
    }
  }
  return { done, total, rate: total ? done / total : 0 };
}
function overallRate() {
  const curDay = currentDayNumber();
  const elapsed = Math.min(Math.max(curDay, 0), TOTAL_DAYS);
  if (elapsed <= 0) return { done: 0, total: 0, rate: 0 };
  let done = 0, total = 0;
  activeTasks().forEach(t => {
    const r = taskProgressOverall(t);
    done += r.done;
    total += r.total;
  });
  return { done, total, rate: total ? done / total : 0 };
}
function taskRate(taskId) {
  const t = get(taskId);
  if (!t) return 0;
  return taskProgressOverall(t).rate;
}

// 当日达成判定（用于日历着色、庆祝弹窗）
function isDaySatisfied(date) {
  const cks = getCheckinsOfDate(date);
  const tasks = activeTasks().filter(t => isTargetDay(t, date));
  if (tasks.length === 0) return false;
  return tasks.every(t => cks[t.id]);
}

/* ----------------- 数据操作 ----------------- */
function toggleCheck(taskId) {
  const date = todayStr();
  if (!state.checkins[date]) state.checkins[date] = {};
  if (state.checkins[date][taskId]) {
    delete state.checkins[date][taskId];
  } else {
    state.checkins[date][taskId] = true;
  }
  save();
}

function doMakeup(taskId, date) {
  const t = get(taskId);
  if (!t) return false;
  if (!canMakeup(t, date)) return false;
  if (!state.checkins[date]) state.checkins[date] = {};
  state.checkins[date][taskId] = true;
  t.makeupUsed = (t.makeupUsed || 0) + 1;
  save();
  return true;
}

function setNote(content, mood) {
  const d = todayStr();
  if (!state.notes[d]) state.notes[d] = { content: '', mood: '' };
  if (content !== undefined) state.notes[d].content = content;
  if (mood !== undefined) state.notes[d].mood = mood;
  save();
}

// 项目增删改
function addTask(data) {
  const id = 't' + Date.now();
  state.tasks.push({
    id, name: data.name, icon: data.icon, color: data.color,
    is_default: false, sort: state.tasks.length,
    frequencyType: data.frequencyType,
    targetDays: data.frequencyType === 'custom' ? data.targetDays.slice() : null,
    makeupUsed: 0,
  });
  save();
  return id;
}

function updateTask(id, data) {
  const t = get(id);
  if (!t) return false;
  t.name = data.name;
  t.icon = data.icon;
  t.color = data.color;
  t.frequencyType = data.frequencyType;
  if (data.frequencyType === 'daily') {
    t.targetDays = null;
  } else {
    // 历史目标日锁定，仅今天及未来用新值覆盖
    const today = todayStr();
    const todayIdx = diffDays(today, state.plan.start_date);
    const merged = (t.targetDays || Array(TOTAL_DAYS).fill(false)).slice();
    for (let i = Math.max(0, todayIdx); i < TOTAL_DAYS; i++) {
      merged[i] = data.targetDays[i];
    }
    t.targetDays = merged;
  }
  save();
  return true;
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
}

function resetPlan() {
  const t = todayStr();
  state.plan = { start_date: t, status: 'active' };
  state.checkins = {};
  state.notes = {};
  // todos 保留：一次性任务独立于计划重置
  save();
}

/* ============ 任务（Todo）相关 ============ */
function listTodos(showDone) {
  const todos = state.todos.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 0;
    if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 0;
    return b.createdAt - a.createdAt;
  });
  return todos.filter(t => showDone ? true : !t.completedAt);
}

function addTodo(data) {
  validateTodoDueDate(data.dueDate);
  state.todos.push({
    id: 'todo' + Date.now(),
    title: data.title,
    note: data.note || '',
    dueDate: data.dueDate || null,
    createdAt: Date.now(),
    completedAt: null,
    pinned: false,
  });
  save();
}

function updateTodo(id, data) {
  validateTodoDueDate(data.dueDate);
  const t = state.todos.find(x => x.id === id);
  if (!t) return false;
  t.title = data.title;
  t.note = data.note || '';
  t.dueDate = data.dueDate || null;
  save();
  return true;
}

function toggleTodo(id) {
  const t = state.todos.find(x => x.id === id);
  if (!t) return;
  if (t.completedAt) {
    t.completedAt = null;
  } else {
    t.completedAt = Date.now();
  }
  save();
}

function validateTodoDueDate(dueDate) {
  if (dueDate && (dueDate < todayStr() || dueDate > planEndDate())) {
    throw new Error('截止日期须在今天至计划最后一天内');
  }
}

function toggleTodoPin(id) {
  const t = state.todos.find(x => x.id === id);
  if (!t) return;
  t.pinned = !t.pinned;
  save();
}

function deleteTodo(id) {
  state.todos = state.todos.filter(x => x.id !== id);
  save();
}

module.exports = {
  // 常量
  TOTAL_DAYS, MAX_MAKEUPS, ICONS, COLORS,
  // 初始化
  init, getState,
  // 日期
  todayStr, parseDate, addDays, diffDays, weekdayOf, fmtCN, fmtCNDay,
  // 计划
  currentDayNumber, planEndDate, validDayNumber,
  // 目标日/历史锁定
  isTargetDay, isHistorical, makeupRemaining, canMakeup,
  // 查询
  todayTasks, activeTasks, getCheckinsOfDate, activeTasksList: activeTasks,
  doneCountOfDate, streak, totalDoneDays,
  taskProgressOverall, overallRate, taskRate, isDaySatisfied,
  // 操作
  toggleCheck, doMakeup, setNote, save,
  addTask, updateTask, deleteTask, resetPlan,
  // 任务（Todo）
  listTodos, addTodo, updateTodo, toggleTodo, toggleTodoPin, deleteTodo,
};
