# 🤖 AI PR Review 助手

智能代码评审工具，帮助开发者提升 Pull Request 的 Review 效率与质量。

## ✨ 功能特性

- **PR 变更总结** - 快速理解 PR 做了什么变更
- **风险代码识别** - 发现安全、性能、逻辑等潜在问题
- **Review 建议生成** - 提供具体的改进建议
- **代码质量评分** - 1-10 分评估代码质量
- **流式输出** - 实时显示分析进度

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript
- **AI**: Claude API (Anthropic)
- **GitHub**: GitHub REST API

## 📦 安装与运行

### 1. 克隆仓库

```bash
git clone https://github.com/qwerasd123211/ai-pr-reviewer.git
cd ai-pr-reviewer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Claude API Key（必需）
CLAUDE_API_KEY=your_claude_api_key_here

# GitHub Token（可选，用于私有仓库）
GITHUB_TOKEN=your_github_token_here
```

### 4. 启动服务

```bash
npm start
```

访问 http://localhost:3000 即可使用。

## 📖 使用方法

1. 在输入框中粘贴 GitHub PR 链接
2. 点击"开始分析"按钮
3. 等待 AI 分析完成
4. 查看分析报告，包括：
   - PR 变更总结
   - 代码质量评分
   - 风险代码识别
   - Review 建议

## 🎯 设计思路

### 模型选择

使用 Claude 3.5 Sonnet 模型，具有以下优势：
- 强大的代码理解能力
- 准确的问题识别
- 专业的建议生成
- 平衡的性能与速度

### 上下文获取

通过 GitHub API 获取完整的 PR 上下文：
- PR 元数据（标题、描述、作者）
- 文件变更列表
- 代码差异（diff）
- 支持理解变更意图

### 误报控制

采用分级问题严重程度：
- **高风险**: 安全漏洞、严重逻辑错误
- **中风险**: 性能问题、潜在 bug
- **低风险**: 代码风格、可维护性建议

### 未来扩展

- 支持更多 AI 模型（GPT、Gemini）
- 支持更多代码托管平台（GitLab、Bitbucket）
- 自定义 Review 规则
- 团队协作功能
- CI/CD 集成

## 📁 项目结构

```
ai-pr-reviewer/
├── src/
│   ├── app.js              # Express 应用主文件
│   └── services/
│       ├── github.js       # GitHub API 服务
│       └── ai.js           # Claude API 服务
├── public/
│   ├── index.html          # 前端页面
│   ├── style.css           # 样式文件
│   └── app.js              # 前端逻辑
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略文件
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 📝 PR 提交记录

| PR | 功能 | 状态 |
|----|------|------|
| #1 | 项目初始化 + GitHub API 集成 | ✅ |
| #2 | AI 分析功能 | 🔄 |
| #3 | 前端界面 | ⏳ |
| #4 | AI 分析增强 | ⏳ |
| #5 | 错误处理 + UX 优化 | ⏳ |
| #6 | 最终优化 | ⏳ |

## 👨‍💻 作者

- **张顺** - 七牛云实训学员

## 📄 许可证

MIT License

---

**七牛云实训项目** | 2026
