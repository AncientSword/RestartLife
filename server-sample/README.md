# 重启人生计划 - 后端 API 样例

> NestJS + TypeORM + PostgreSQL 实现。本文档展示关键模块的架构与代码样例，正式工程在此基础上补全 auth/plans/notes 模块即可。

## 启动

```bash
npm install
# 配置 .env 见下方
npm run start:dev
```

### .env

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=restart_life
JWT_SECRET=your-secret-here
PORT=3000
```

## 目录结构

```
src/
├── main.ts                    # 入口 (全局管道、CORS、前缀 /api)
├── app.module.ts              # 根模块
├── common/
│   ├── jwt-auth.guard.ts      # 全局 JWT 守卫
│   ├── current-user.decorator.ts  # @CurrentUser() 装饰器
│   └── public.decorator.ts    # @Public() 标记白名单
├── entities/                  # TypeORM 实体 (对应数据库表)
│   ├── user.entity.ts
│   ├── plan.entity.ts
│   ├── task.entity.ts
│   ├── checkin.entity.ts
│   └── daily-note.entity.ts
└── modules/
    ├── auth/                  # 注册/登录/JWT (略，标准实现)
    ├── tasks/                 # 打卡项目 CRUD ✅ 完整样例
    ├── checkins/              # 打卡切换 ✅ 完整样例
    ├── notes/                 # 每日心得 upsert
    └── stats/                 # 统计聚合 ✅ 完整样例
```

## API 概览

详细路径见 `DESIGN.md`。本样例完整实现的核心端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 当前用户的有效项目 |
| POST | /api/tasks | 新增项目 |
| PATCH | /api/tasks/:id | 编辑 |
| DELETE | /api/tasks/:id | 归档 |
| POST | /api/checkins/toggle | 切换打卡状态 |
| GET | /api/stats/overview | 总览统计 |
| GET | /api/stats/by-task | 各项目完成率 |
| GET | /api/stats/heatmap | 21 天热力图 |

## 设计要点

1. **JWT 鉴权**：除 `/api/auth/*` 外全部需 Bearer Token，通过全局 Guard + `@Public()` 装饰器实现。
2. **21 天计划**：`Plan` 实体固化 `start_date`，`end_date = start_date + 20`，统计时按 `day_number` 取 1~21。
3. **打卡唯一性**：`CheckIn` 加 `UNIQUE(user_id, task_id, date)` 防重复，service 用 `upsert` 实现 toggle。
4. **项目软删除**：删除项目仅置 `is_archived=true`，历史打卡记录保留用于统计。
5. **新增项目后向兼容**：统计数据按"历史天数 × 当前有效项目数"计算，新增项目的历史打卡默认未完成，不影响已有项目的完成率。
6. **小程序对接**：客户端用 `wx.request` 带 `Authorization: Bearer <token>` 调用即可，无跨域问题（小程序白名单需配置域名）。