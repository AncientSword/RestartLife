# 重启人生计划 - 设计方案

> 21 天习惯养成打卡应用。当前阶段：纯 HTML/CSS/JS 原型验证设计，后续迁移至微信小程序（原生重写），后端采用 Node.js (NestJS/Express) + 数据库。

---

## 一、产品定位

围绕"21 天重启人生"概念，通过每日打卡 + 进度可视化 + 心得记录，帮助用户在 21 天内养成 5 项核心习惯（远离电子设备、早睡、早起、运动、阅读），并支持自定义增删打卡项目。

**核心循环：** 每日勾选打卡 → 看到进度增长 → 获得正反馈 → 持续坚持 21 天

---

## 二、核心功能

| 模块 | 功能 |
|------|------|
| 每日打卡 | 进入今日页面，勾选完成的打卡项；21 天日历视图展示整体进度 |
| 进度统计 | 总体完成率、连续打卡天数(streak)、各项目完成率、21 天热力图 |
| 自定义项目 | 在 5 个默认项基础上新增 / 编辑 / 删除打卡项（含图标、颜色、排序） |
| 每日心得 | 每天一条心得文字 + 心情标签，可回看历史 |
| 计划管理 | 开始 / 重置 21 天计划，记录历史计划 |

---

## 三、信息架构（页面结构）

移动端优先，底部 Tab 导航 4 个主页面：

```
┌──────────────────────────────────────┐
│  重启人生计划                          │
├──────────────────────────────────────┤
│                                      │
│          （页面内容区）                │
│                                      │
├──────────────────────────────────────┤
│  今日    日历    统计    项目          │
└──────────────────────────────────────┘
```

### 1. 今日页 (Today)
- 顶部：日期 + "第 N 天 / 21" + 21 个进度圆点
- 完成度环：今日完成 X / N 项
- 打卡列表：每项一个勾选行（图标 + 名称 + 复选框）
- 今日心得：文本输入 + 心情选择（😊 😐 😴 😢 🔥）
- 底部：保存按钮（原型本地存储，正式版自动同步）

### 2. 日历页 (Calendar)
- 计划区间：起止日期
- 21 天网格（3 行 × 7 列，对齐周历）
- 每格显示完成度颜色（深绿=全完成 / 浅绿=部分 / 灰=未开始 / 当前天高亮）
- 点击某天 → 抽屉展示该天打卡详情 + 心得

### 3. 统计页 (Stats)
- 顶部大环：总体完成率
- 连续打卡天数 + 累计完成天数
- 各项目完成率横向柱状图
- 21 天热力图（颜色深浅表示完成度）

### 4. 项目页 (Tasks)
- 项目列表（图标 + 名称 + 完成率 + 编辑/删除按钮）
- "添加打卡项目"按钮 → 弹窗输入名称 + 选图标 + 选颜色
- 默认 5 项标记，可删除可编辑

---

## 四、21 天计划逻辑

### 计划周期
- 一个计划固定 21 天，从 `start_date` 起算 21 个自然日
- `day_number = floor(today - start_date) + 1`，范围 1~21
- 超过 21 天 → 计划完成，可发起新一轮计划

### 打卡规则
- 每天每个任务一条记录，状态 `pending` / `done`
- 勾选=done，再次点击=pending（toggle）
- 新增项目后，仅对未来天数生效（历史记录保持空）
- 删除项目后，历史打卡记录保留（用于统计），但不再显示在今日列表

### 频率模型（重要）
每个 Task 有 `frequencyType`：

| 类型 | 含义 | 说明 |
|------|------|------|
| `daily` | 每天必打 | 早睡、早起、远离电子设备 |
| `custom` | 自由选择目标日 | 用户在 21 天日历上勾选哪些天打卡，运动/阅读默认为此类 |

**目标日 (target day)**：custom 模式下被勾选的日子；daily 模式下每天都是目标日。

**目标日配置规则**：
- 历史日期（今天之前）的目标日配置**锁定**，不可改
- 今天及未来的目标日用户可自由增删
- 默认空，用户主动勾选
- 类型切换：daily → custom 时，从今天起清空目标日；custom → daily 时，targetDays 置 null

**今日列表**：只显示"今天=该项目的目标日"的项目；非目标日项目当天不显示也不可打。

**完成率计算（目标日感知）**：
- 分子 = 历史目标日中"已打卡"的天数
- 分母 = 历史目标日总数（含今天）
- 非目标日不计入分母

**"当日达成"判定**（日历着色、今日页"全部完成"庆祝）：
当天所有目标日项目都已打卡。

### 补打卡机制
- **用途**：对历史日期漏打的目标日进行事后补记
- **额度**：每个项目在 21 天计划内最多 3 次补打卡
- **仅对历史日期有效**：今天及未来不能使用补打卡（直接 toggle）
- **消耗一次**：使用补打卡后 `task.makeupUsed += 1`
- **入口**：日历页 → 点击历史某天 → 抽屉里对漏打的目标日项目显示"补打卡(剩 X)"按钮

### 连续打卡天数 (streak)
- 定义：连续多少天"至少完成 1 项目标日打卡"
- 从今天往回数，遇到全空的一天则中断
- 今天未打卡不算中断

---

## 五、数据模型

> 使用关系型数据库（PostgreSQL / MySQL）。下列为 NestJS + TypeORM 实体字段。

### users 用户
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| nickname | varchar | 昵称 |
| avatar_url | varchar | 头像 |
| created_at | timestamp | |

### plans 计划
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| start_date | date | 开始日期 |
| end_date | date | start + 20 天 |
| status | enum | `active` / `completed` / `abandoned` |
| created_at | timestamp | |

### tasks 打卡项目
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| name | varchar | 项目名 |
| icon | varchar | 图标标识（emoji 或图标 key） |
| color | varchar | 颜色 hex |
| frequency_type | enum | `daily` / `custom` |
| target_days | json | custom 模式下 21 个布尔（对应 day 1~21）；daily 为 null |
| makeup_used | int | 已用补打卡次数（上限 3） |
| sort_order | int | 排序 |
| is_default | boolean | 是否系统默认项 |
| is_archived | boolean | 软删除（归档） |
| created_at | timestamp | |

### checkins 打卡记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| plan_id | uuid FK | |
| task_id | uuid FK | |
| date | date | 打卡日期 YYYY-MM-DD |
| day_number | int | 1~21 |
| status | enum | `pending` / `done` |
| is_makeup | boolean | 是否补打的卡 |
| completed_at | timestamp | 完成时间 |
| **UNIQUE** | (user_id, task_id, date) | 防重复 |

### checkins 打卡记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| plan_id | uuid FK | |
| task_id | uuid FK | |
| date | date | 打卡日期 YYYY-MM-DD |
| day_number | int | 1~21 |
| status | enum | `pending` / `done` |
| completed_at | timestamp | 完成时间 |
| **UNIQUE** | (user_id, task_id, date) | 防重复 |

### daily_notes 每日心得
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | |
| plan_id | uuid FK | |
| date | date | |
| day_number | int | |
| content | text | 心得内容 |
| mood | varchar | mood 枚举: happy/ok/tired/sad/fire |
| created_at | timestamp | |
| updated_at | timestamp | |
| **UNIQUE** | (user_id, plan_id, date) | |

---

## 六、API 设计

> RESTful，前缀 `/api`。认证用 JWT（Bearer Token）。

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户 |

### 计划
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/plans | 创建计划（自动设置 21 天区间） |
| GET | /api/plans/current | 当前进行中计划 |
| GET | /api/plans/:id | 计划详情 |
| PATCH | /api/plans/:id | 更新（如标记完成/放弃） |
| GET | /api/plans/:id/progress | 该计划进度统计 |

### 打卡项目
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 当前用户有效项目列表 |
| POST | /api/tasks | 新增 |
| PATCH | /api/tasks/:id | 编辑 |
| DELETE | /api/tasks/:id | 删除（归档） |
| PATCH | /api/tasks/reorder | 批量调序 |

### 打卡
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/checkins?date=YYYY-MM-DD | 某天打卡 |
| GET | /api/checkins?from=&to= | 范围查询 |
| POST | /api/checkins/toggle | 切换状态（仅今天及未来）`{ task_id, date }` |
| POST | /api/checkins/makeup | 补打卡（仅历史，消耗1次额度）`{ task_id, date }` |

### 每日心得
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes/:date | 某天心得 |
| POST | /api/notes | 创建/更新（upsert） |

### 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/overview | 总览（完成率/连续天数/累计） |
| GET | /api/stats/by-task | 各项目完成率 |
| GET | /api/stats/heatmap?plan_id= | 21 天热力图数据 |

---

## 七、UI / UX 设计

### 风格：清新简约
- 背景：`#FAFAF7` 米白
- 主色：`#5B8C5A` 莫兰迪绿（成长感）
- 强调：`#E8B04B` 暖黄（活力）
- 文字：`#2C2C2C` 深灰
- 次要文字：`#8A8A8A`
- 卡片：纯白 `#FFFFFF`，圆角 16px，柔和阴影 `0 2px 12px rgba(0,0,0,0.06)`
- 字体：中文系统中文字体栈

### 交互原则
- 大点击区（移动端 ≥44px）
- 打卡勾选有微动画反馈（缩放 + 颜色过渡）
- 进度变化用环形动画
- 全部完成后给庆祝反馈（彩带/印章"第 N 天 ✅"）
- 避免弹窗滥用，操作尽量内联

---

## 八、迁移微信小程序注意点

当前原型用纯 HTML/CSS/JS 便于快速验证。迁移原生小程序时的对应关系：

| 原型 | 小程序 |
|------|--------|
| `<div>` | `<view>` |
| `<span>/<p>` | `<text>` |
| `<input>` / `<textarea>` | `<input>` / `<textarea>` |
| `<img>` | `<image>` |
| `addEventListener` | `bindtap` / `bindinput` |
| `localStorage` | `wx.setStorageSync` / 后端 API |
| CSS | WXSS（基本兼容，单位推荐 rpx） |
| `fetch` | `wx.request` |
| 页面切换 | `app.json` 注册 pages，`wx.navigateTo` |

**建议：** 原型阶段就把组件结构按小程序 Page 划分（今日 / 日历 / 统计 / 项目 各一页），迁移时逐页翻译，结构一一对应，降低重写成本。

---

## 九、目录结构（最终工程）

```
RestartLife/
├── DESIGN.md                  # 本文档
├── prototype/
│   └── index.html             # 可交互原型（localStorage）
└── server-sample/             # NestJS 后端样例
    ├── package.json
    ├── README.md
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── common/            # 守卫/装饰器/拦截器
        ├── modules/
        │   ├── auth/
        │   ├── plans/
        │   ├── tasks/
        │   ├── checkins/
        │   ├── notes/
        │   └── stats/
        └── entities/
```