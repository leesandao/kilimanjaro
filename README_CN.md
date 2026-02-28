# Kilimanjaro

> **版本: 0.1.0**

一个模块化、实时的家庭网络管理仪表盘，基于 **FastAPI** 和 **React** 构建。通过可扩展的插件架构和 WebSocket 实时推送，监控你的局域网设备。

![Version](https://img.shields.io/badge/版本-0.1.0-blue)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

**[English](./README.md)**

## 功能特性

- **插件架构** — 即插即用的插件系统，支持自动发现，每个插件拥有独立的路由、数据模型、定时任务和前端组件
- **实时更新** — 基于 WebSocket 的数据实时推送，无需手动刷新
- **局域网扫描插件** — 通过 ARP/Ping 扫描发现局域网内所有活跃设备，支持厂商识别
- **动态组件系统** — 插件通过 manifest 文件声明 UI，前端自动渲染（状态卡片、图表、数据表格）
- **响应式设计** — 移动优先的布局，可折叠侧边栏，适配手机、平板和桌面端
- **定时任务** — 内置 APScheduler，支持周期性后台任务（如每 5 分钟扫描一次网络）
- **全异步架构** — 后端完全异步，基于 SQLAlchemy 2.0 + aiosqlite

## 技术栈

| 层级     | 技术                                              |
|----------|--------------------------------------------------|
| 后端     | Python 3.11+, FastAPI, SQLAlchemy 2.0, APScheduler |
| 前端     | React 19, TypeScript, Tailwind CSS, Recharts     |
| 数据库   | SQLite（通过 aiosqlite 异步驱动）                  |
| 网络扫描 | Scapy（ARP 扫描）, 并发 Ping 扫描                 |
| 构建工具 | Vite 5, ESLint, PostCSS                           |

## 项目结构

```
kilimanjaro/
├── backend/
│   ├── main.py                 # FastAPI 入口 & 生命周期管理
│   ├── config.py               # 全局配置
│   ├── requirements.txt
│   ├── core/
│   │   ├── database.py         # SQLAlchemy 异步引擎 & 会话
│   │   ├── plugin_base.py      # 插件抽象基类
│   │   ├── plugin_loader.py    # 插件自动发现 & 注册
│   │   ├── scheduler.py        # APScheduler 调度器实例
│   │   └── websocket_manager.py # WebSocket 广播管理器
│   ├── api/
│   │   ├── system.py           # /api/health, /api/info
│   │   └── plugin_registry.py  # /api/plugins
│   └── plugins/
│       ├── _template/          # 新插件模板
│       └── lan_scanner/        # 局域网扫描插件
│           ├── manifest.json   # 插件元数据 & 前端组件配置
│           ├── plugin.py       # 插件生命周期
│           ├── scanner.py      # ARP & Ping 扫描逻辑
│           ├── tasks.py        # 定时扫描任务
│           ├── models.py       # Device, ScanRecord, DeviceHistory
│           ├── routes.py       # REST API 接口
│           └── schemas.py      # Pydantic 数据模型
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # 路由配置
│   │   ├── pages/              # Dashboard, PluginPage, Settings
│   │   ├── layouts/            # DashboardLayout, Sidebar, TopBar
│   │   ├── components/
│   │   │   ├── widgets/        # StatusWidget, ChartWidget, TableWidget
│   │   │   └── common/         # Card, DataTable, StatusBadge 等
│   │   ├── hooks/              # usePlugins, useWebSocket, useResponsive
│   │   └── api/                # HTTP 客户端 & WebSocket 客户端
│   ├── package.json
│   └── vite.config.ts
└── .gitignore
```

## 快速开始

### 环境要求

- **Python** >= 3.11
- **Node.js** >= 18
- **npm** >= 9

### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **提示：** 使用 `sudo` 运行可启用完整的 ARP 扫描功能。无 root 权限时，扫描器会自动降级为 Ping 扫描模式。

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 `http://localhost:5173`，API 请求代理到后端 `http://localhost:8000`。

## API 接口文档

### 系统接口

| 方法 | 接口地址         | 描述           |
|------|-----------------|----------------|
| GET  | `/api/health`   | 健康检查       |
| GET  | `/api/info`     | 系统信息       |
| GET  | `/api/plugins`  | 获取已加载插件列表 |

### 局域网扫描插件

| 方法 | 接口地址                                  | 描述                           |
|------|------------------------------------------|-------------------------------|
| GET  | `/api/plugins/lan_scanner/devices`       | 获取已发现的设备列表            |
| GET  | `/api/plugins/lan_scanner/devices/{ip}`  | 根据 IP 地址查询设备详情        |
| GET  | `/api/plugins/lan_scanner/summary`       | 网络概览（设备总数/在线/离线）   |
| GET  | `/api/plugins/lan_scanner/history`       | 设备数量历史趋势               |
| GET  | `/api/plugins/lan_scanner/scans`         | 历史扫描记录                   |
| POST | `/api/plugins/lan_scanner/scan`          | 手动触发扫描                   |
| GET  | `/api/plugins/lan_scanner/subnets`       | 获取已检测的子网列表            |

### WebSocket 实时推送

连接 `ws://localhost:8000/ws` 接收实时事件：

```json
{
  "event": "lan_scanner:scan_complete",
  "data": { "devices_found": 12, "new_devices": 2 }
}
```

## 插件开发指南

Kilimanjaro 使用插件系统，启动时自动发现并加载插件。创建新插件只需 4 步：

**1. 复制模板：**

```bash
cp -r backend/plugins/_template backend/plugins/my_plugin
```

**2. 定义插件清单** (`manifest.json`)：

```json
{
  "name": "my_plugin",
  "display_name": "My Plugin",
  "version": "1.0.0",
  "enabled": true,
  "api_prefix": "/api/plugins/my_plugin",
  "frontend": {
    "icon": "Box",
    "sidebar_label": "My Plugin",
    "route_path": "/my-plugin",
    "widgets": []
  }
}
```

**3. 实现插件类**，继承 `PluginBase`：

```python
from core.plugin_base import PluginBase

class MyPlugin(PluginBase):
    @property
    def name(self) -> str:
        return "my_plugin"

    def get_manifest(self) -> dict: ...
    def get_router(self) -> APIRouter: ...
    def register_tasks(self, scheduler) -> None: ...
    async def initialize(self, db_session_factory) -> None: ...
    async def on_shutdown(self) -> None: ...
```

**4. 在 `__init__.py` 中导出实例：**

```python
from .plugin import MyPlugin
plugin = MyPlugin()
```

核心系统会自动加载插件、挂载路由、注册定时任务，并在前端渲染对应的组件。

## 配置说明

核心配置位于 `backend/config.py`：

| 配置项                  | 默认值          | 说明                   |
|------------------------|----------------|------------------------|
| `DATABASE_URL`         | SQLite         | 数据库连接字符串        |
| `CORS_ORIGINS`         | localhost:5173 | 允许的前端跨域来源      |
| `SCAN_INTERVAL_SECONDS`| 300            | 局域网扫描间隔（秒）    |
| `SCAN_TIMEOUT_SECONDS` | 3              | 单主机 Ping 超时时间（秒）|

## 开发路线图

- [ ] 新增插件（端口扫描、系统监控、网速测试）
- [ ] 用户认证与权限管理
- [ ] 暗黑模式切换
- [ ] 设备自定义命名与备注
- [ ] 数据导出（CSV / JSON）
- [ ] Docker 容器化部署
- [ ] 单元测试与集成测试
- [ ] 通知与告警系统

## 更新日志

### v0.1.0 (2026-02-28)

**首次发布**

- 搭建全栈项目架构（FastAPI + React + TypeScript）
- 插件系统：抽象基类、自动发现、manifest 配置驱动
- 局域网扫描插件：ARP/Ping 网络扫描、设备追踪、厂商识别
- 动态前端组件系统（状态卡片、图表、可排序数据表格）
- WebSocket 实时推送与自动重连
- 响应式仪表盘布局（手机 / 平板 / 桌面）
- SQLite 异步数据库（SQLAlchemy 2.0）
- APScheduler 定时后台任务
- REST API 共 10 个接口（3 个系统接口 + 7 个插件接口）
- 项目 README 文档（英文 + 中文）

## 开源协议

本项目基于 MIT 协议开源。
