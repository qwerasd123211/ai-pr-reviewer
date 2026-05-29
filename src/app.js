require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const githubService = require('./services/github');
const aiService = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// 超时配置（毫秒）
const TIMEOUT = {
  GITHUB_API: 30000,    // GitHub API 30秒
  CLAUDE_API: 120000,   // Claude API 120秒
  TOTAL: 180000         // 总超时 3分钟
};

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 带超时的 Promise 包装
function withTimeout(promise, ms, errorMessage) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeout]);
}

// 分析PR的API
app.post('/api/analyze', async (req, res) => {
  let clientDisconnected = false;

  // 检测客户端断开（使用 res 而不是 req）
  res.on('close', () => {
    console.log('[DEBUG] res close event fired');
    clientDisconnected = true;
  });

  // 安全写入（检查客户端是否断开）
  const safeWrite = (data) => {
    console.log('[DEBUG] safeWrite called, clientDisconnected:', clientDisconnected, 'destroyed:', res.destroyed);
    if (!clientDisconnected && !res.destroyed) {
      try {
        const result = res.write(data);
        console.log('[DEBUG] res.write result:', result, 'data length:', data.length);
      } catch (e) {
        console.error('[DEBUG] res.write error:', e.message);
        clientDisconnected = true;
      }
    } else {
      console.log('[DEBUG] safeWrite skipped - client disconnected or response destroyed');
    }
  };

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
      safeWrite(`data: ${JSON.stringify({ type: 'progress', message, progress })}\n\n`);
    };

    sendProgress('正在获取PR信息...', 10);
    console.log('[DEBUG] 开始获取PR详情...平台:', prInfo.platform);

    // 获取PR详情（带超时）
    const prDetails = await withTimeout(
      githubService.getPrDetails(prInfo.owner, prInfo.repo, prInfo.prNumber, prInfo.platform),
      TIMEOUT.GITHUB_API,
      'API 请求超时，请稍后重试'
    );
    console.log('[DEBUG] PR详情获取成功:', prDetails.title);
    sendProgress('正在获取代码变更...', 30);

    // 获取代码变更（带超时）
    const files = await withTimeout(
      githubService.getPrFiles(prInfo.owner, prInfo.repo, prInfo.prNumber, prInfo.platform),
      TIMEOUT.GITHUB_API,
      'API 请求超时，请稍后重试'
    );
    console.log('[DEBUG] 文件变更获取成功，文件数:', files.length);
    sendProgress('正在分析代码...', 50);

    // AI分析（带超时）
    console.log('[DEBUG] 开始AI分析...');
    const analysis = await withTimeout(
      aiService.analyzeCode(prDetails, files, (message, progress) => {
        sendProgress(message, progress);
      }),
      TIMEOUT.CLAUDE_API,
      'AI 分析超时，PR 可能过大，请尝试较小的 PR'
    );
    console.log('[DEBUG] AI分析完成');

    sendProgress('分析完成！', 100);

    // 发送最终结果
    safeWrite(`data: ${JSON.stringify({ type: 'result', data: analysis })}\n\n`);

    if (!clientDisconnected) {
      res.end();
    }

  } catch (error) {
    console.error('分析错误:', error);

    if (!clientDisconnected) {
      safeWrite(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);

      try {
        res.end();
      } catch (e) {
        // 忽略已断开连接的错误
      }
    }
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI PR Review 助手运行在 http://localhost:${PORT}`);
});
