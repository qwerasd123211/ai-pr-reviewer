# CODEX // AI PR Review 助手

基于 Claude AI 的智能代码评审工具。指定一个 GitHub Pull Request，系统自动获取代码变更并进行深度分析，输出结构化的 Review 报告。

## 功能概览

| 功能 | 说明 |
|------|------|
| PR 变更总结 | 自动概括 PR 的目的、影响和变更范围 |
| 风险代码识别 | 检测安全漏洞、性能瓶颈、逻辑缺陷等问题 |
| Review 建议生成 | 提供代码风格、架构设计、测试等方面的改进建议 |
| 代码质量评分 | 1-10 分评估整体代码质量 |
| 实时进度推送 | SSE 流式显示分析进度 |

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript（无框架依赖）
- **AI 引擎**: Claude 3.5 Sonnet (Anthropic)
- **数据源**: GitHub REST API v3
- **通信**: Server-Sent Events (SSE)

## 快速开始

### 前置条件

- Node.js >= 18
- Claude API Key（[获取地址](https://console.anthropic.com/)）
- GitHub Token（可选，用于私有仓库或提高 API 限额）

### 安装

```bash
# 克隆仓库
git clone https://github.com/qwerasd123211/ai-pr-reviewer.git
cd ai-pr-reviewer

# 安装依赖
npm install
```

### 配置

复制环境变量模板并填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 必需 - Claude API Key
CLAUDE_API_KEY=sk-ant-xxxxx

# 可选 - GitHub Token（私有仓库需要）
GITHUB_TOKEN=ghp_xxxxx

# 可选 - 服务端口（默认 3000）
PORT=3000
```

### 启动

```bash
npm start
```

访问 http://localhost:3000 即可使用。

## 使用方法

1. 在输入框中粘贴 GitHub PR 链接，格式：`https://github.com/owner/repo/pull/123`
2. 点击 **SCAN** 按钮
3. 等待分析完成（通常 15-60 秒）
4. 查看分析报告

### 支持的 PR 链接格式

```
https://github.com/owner/repo/pull/123
```

### 分析报告包含

- **PR 元数据** — 标题、作者、状态、变更统计
- **变更总结** — PR 做了什么、为什么做
- **质量评分** — 1-10 分，附评分理由
- **风险识别** — 按严重程度（高/中/低）分类的问题列表
- **改进建议** — 代码风格、架构、测试等方面的建议
- **总体评价** — 是否建议合并的结论

## 项目结构

```
ai-pr-reviewer/
├── src/
│   ├── app.js                  # Express 服务器，API 路由
│   └── services/
│       ├── github.js           # GitHub API 封装
│       └── ai.js               # Claude API 封装，Prompt 构建
├── public/
│   ├── index.html              # 前端页面
│   ├── style.css               # 样式（Terminal Hacker 美学）
│   └── app.js                  # 前端交互逻辑
├── .env.example                # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

## 架构设计

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   前端界面   │────>│ Express 服务器 │────>│ GitHub API  │
│  (HTML/JS)  │<────│  (SSE 推送)   │<────│ Claude API  │
└─────────────┘     └──────────────┘     └─────────────┘
```

**请求流程：**

1. 用户输入 PR 链接，前端通过 `fetch` 发送 POST 请求到 `/api/analyze`
2. 服务器解析 PR 链接，调用 GitHub API 获取 PR 详情和文件变更
3. 将代码变更构建成结构化 Prompt，发送给 Claude API
4. 解析 Claude 返回的分析结果，通过 SSE 实时推送进度，最终返回结构化报告
5. 前端渲染分析报告

## 设计思路

### 模型选择

使用 **Claude 3.5 Sonnet**，原因：

- **代码理解能力强** — 能准确理解代码上下文和变更意图
- **分析质量高** — 输出结构化、专业的评审意见
- **响应速度快** — 平衡了分析深度和等待时间
- **上下文窗口大** — 支持分析较大规模的代码变更

### 上下文获取方式

通过 GitHub REST API 获取 PR 的完整上下文：

1. **PR 元数据** — 标题、描述、作者、状态（理解变更目的）
2. **文件变更列表** — 哪些文件被修改、新增或删除
3. **代码差异 (diff)** — 每个文件的具体变更内容

这些上下文一起发送给 Claude，确保分析基于完整的变更信息。

### 误报与漏报控制

- **分级严重程度** — 将问题分为高/中/低三级，避免所有问题同等对待
- **分类问题类型** — 区分安全、性能、逻辑、可维护性等类型
- **要求具体位置** — Prompt 要求指出问题所在文件和代码位置
- **提供修复建议** — 不仅指出问题，还给出具体的改进方案

### 未来扩展方向

| 方向 | 说明 |
|------|------|
| 多模型支持 | 接入 GPT-4、Gemini 等模型，支持对比分析 |
| 多平台扩展 | 支持 GitLab、Bitbucket 等代码托管平台 |
| 自定义规则 | 允许团队定义自己的 Review 规则和检查项 |
| CI/CD 集成 | 作为 GitHub Action 自动评审 PR |
| 历史记录 | 保存分析历史，支持对比和回溯 |
| 团队协作 | 支持多人共享分析结果和讨论 |

## 环境变量说明

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `CLAUDE_API_KEY` | 是 | - | Anthropic Claude API Key |
| `GITHUB_TOKEN` | 否 | - | GitHub Personal Access Token |
| `PORT` | 否 | `3000` | 服务器监听端口 |

## 依赖说明

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | ^4.18.2 | Web 框架 |
| node-fetch | ^3.3.2 | HTTP 请求库 |
| dotenv | ^16.3.1 | 环境变量管理 |
| cors | ^2.8.5 | 跨域资源共享 |
| marked | ^11.1.1 | Markdown 解析 |

## 作者

**张顺** — 七牛云实训学员

## 许可证

MIT License
