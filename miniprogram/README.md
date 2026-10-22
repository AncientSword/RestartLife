# 重启人生计划 - 微信小程序

原型 `prototype/index.html` 的原生小程序重写版本，功能与原型完全对齐。

## 开发环境

1. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目：选择 `miniprogram/` 目录
3. AppID：选"测试号"或自己在微信公众平台申请的个人 AppID
4. 项目会自动编译；模拟器或真机预览

> 当前 `project.config.json` 的 appid 是 `touristappid`，实际开发时开发者工具会让你换 AppID。开发者工具会自动改这个文件，无需手动改。

## 目录结构

```
miniprogram/
├── app.js                # 全局逻辑：启动时初始化 store
├── app.json              # 4 个 tab + 全局样式变量
├── app.wxss              # 全局样式 + CSS 变量
├── project.config.json  # 项目配置（AppID 在这里）
├── sitemap.json
├── utils/
│   └── store.js          # 数据层（wx.getStorageSync + 业务函数）
├── pages/
│   ├── today/            # 今日打卡
│   ├── calendar/        # 21天日历 + 详情 + 补打卡
│   ├── stats/           # 统计（环/柱状/热力图）
│   └── tasks/           # 项目管理 + 计划重置
└── components/
    └── task-sheet/       # 项目编辑底部弹层（含21天勾选日历）
```

## 功能列表

| 功能 | 入口 | 说明 |
|------|------|------|
| 每日打卡 | 今日页 | 仅显示今天=目标日的项目；勾选/取消 |
| 进度环 + 21 天点 | 今日页 | 直观看到完成度 |
| 每日心得 | 今日页 | 文字 + 心情（5选1）|
| 日历视图 | 日历页 | 3×7 网格，全完成/部分/未开始配色 |
| 日期详情抽屉 | 日历页 | 点击查看当天打卡状态和心得 |
| 补打卡 | 日历页详情 | 历史漏打可补，每项目21天3次 |
| 总体完成率环 | 统计页 | 基于目标日的频率感知算法 |
| 连续打卡天数 | 统计页 | "至少 1 项目标日项目已打"算连续 |
| 各项目完成率柱状图 | 统计页 | 颜色与项目一致 |
| 21 天热力图 | 统计页 | 颜色深浅 = 当天目标日项目完成度 |
| 项目增删改 | 项目页 | 含图标/颜色/打卡类型选择器 |
| 自由选择目标日 | 项目编辑 | 21 天日历勾选，历史日期锁定 |
| 重置计划 | 项目页 | 从今天起重新开始 21 天 |

## 数据存储

- 使用 `wx.getStorageSync` / `wx.setStorageSync`，键名 `restart_life_v3`
- 与原型完全兼容：从原型 localStorage 复制的 JSON 可直接粘贴到这里
- v1/v2 数据自动迁移到 v3

## 迁移后端 API

当前为本地存储，未来切换到后端时：
1. 替换 `utils/store.js` 中的 `load` / `save` 为 `wx.request`
2. 项目数据通过 `GET /api/tasks` 拉取，写入用 `POST /api/tasks`
3. 打卡用 `POST /api/checkins/toggle`，补打卡用 `POST /api/checkins/makeup`
4. 服务端代码已在 `../server-sample/`，需配置 HTTPS 域名并加入小程序白名单

## 已知限制

- 测试号无法使用云开发、无法发布，但完整功能可开发预览
- 切换到正式 AppID 后需在小程序后台配置 request 域名白名单
- icon 以 emoji 显示，部分安卓机型显示样式可能不同