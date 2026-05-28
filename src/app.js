require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const githubService = require('./services/github');
const aiService = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 分析PR的API
app.post('/api/analyze', async (req, res) => {
  try {
    const { prUrl } = req.body;

    if (!prUrl) {
      return res.status(400).json({ error: '请提供PR链接' });
    }

    // 解析PR链接
    const prInfo = githubService.parsePrUrl(prUrl);
    if (!prInfo) {
      return res.status(400).json({ error: '无效的PR链接' });
    }

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送进度消息
    const sendProgress = (message, progress) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message, progress })}\n\n`);
    };

    sendProgress('正在获取PR信息...', 10);

    // 获取PR详情
    const prDetails = await githubService.getPrDetails(prInfo.owner, prInfo.repo, prInfo.prNumber);
    sendProgress('正在获取代码变更...', 30);

    // 获取代码变更
    const files = await githubService.getPrFiles(prInfo.owner, prInfo.repo, prInfo.prNumber);
    sendProgress('正在分析代码...', 50);

    // AI分析
    const analysis = await aiService.analyzeCode(prDetails, files, (message, progress) => {
      sendProgress(message, progress);
    });

    sendProgress('分析完成！', 100);

    // 发送最终结果
    res.write(`data: ${JSON.stringify({ type: 'result', data: analysis })}\n\n`);
    res.end();

  } catch (error) {
    console.error('分析错误:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI PR Review 助手运行在 http://localhost:${PORT}`);
});
