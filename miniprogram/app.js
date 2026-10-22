// app.js
const store = require('./utils/store.js');

App({
  globalData: {
    version: '1.0.0',
  },
  onLaunch() {
    // 启动时初始化数据（含老版本迁移）
    store.init();
    console.log('[RestartLife] 应用启动，数据已就绪');
  },
});