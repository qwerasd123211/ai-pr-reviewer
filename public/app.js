// 全局变量
let isAnalyzing = false;

/**
 * 分析PR
 */
async function analyzePR() {
  const prUrl = document.getElementById('prUrl').value.trim();

  if (!prUrl) {
    showError('请输入PR链接');
    return;
  }

  if (!isValidPrUrl(prUrl)) {
    showError('请输入有效的GitHub PR链接，格式：https://github.com/owner/repo/pull/123');
    return;
  }

  if (isAnalyzing) {
    return;
  }

  isAnalyzing = true;

  // 隐藏之前的结果和错误
  hideAllSections();
  showProgress();
  updateButtonState(true);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prUrl })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '分析失败');
    }

    // 处理SSE流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            handleSSEMessage(data);
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

  } catch (error) {
    showError(error.message);
  } finally {
    isAnalyzing = false;
    updateButtonState(false);
  }
}

/**
 * 验证PR链接格式
 */
function isValidPrUrl(url) {
  return /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/.test(url);
}

/**
 * 处理SSE消息
 */
function handleSSEMessage(data) {
  switch (data.type) {
    case 'progress':
      updateProgress(data.message, data.progress);
      break;
    case 'result':
      showResult(data.data);
      break;
    case 'error':
      showError(data.message);
      break;
  }
}

/**
 * 显示进度
 */
function showProgress() {
  document.getElementById('progressSection').style.display = 'block';
  updateProgress('准备中...', 0);
}

/**
 * 更新进度
 */
function updateProgress(message, progress) {
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('progressMessage').textContent = message;
}

/**
 * 隐藏所有区域
 */
function hideAllSections() {
  document.getElementById('progressSection').style.display = 'none';
  document.getElementById('errorSection').style.display = 'none';
  document.getElementById('resultSection').style.display = 'none';
}

/**
 * 显示错误
 */
function showError(message) {
  hideAllSections();
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorSection').style.display = 'block';
}

/**
 * 更新按钮状态
 */
function updateButtonState(disabled) {
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = disabled;
  btn.querySelector('.btn-text').style.display = disabled ? 'none' : 'inline';
  btn.querySelector('.btn-loading').style.display = disabled ? 'inline' : 'none';
}

/**
 * 显示结果
 */
function showResult(data) {
  hideAllSections();

  // 显示PR信息
  displayPrInfo(data.prInfo, data.filesCount);

  // 显示评分
  displayScore(data.analysis.score);

  // 显示变更总结
  document.getElementById('prSummary').innerHTML = formatMarkdown(data.analysis.summary);

  // 显示风险代码
  displayRisks(data.analysis.risks);

  // 显示Review建议
  document.getElementById('suggestions').innerHTML = formatMarkdown(data.analysis.suggestions);

  // 显示总体评价
  document.getElementById('conclusion').innerHTML = formatMarkdown(data.analysis.conclusion);

  // 显示原始分析
  document.getElementById('rawAnalysis').textContent = data.rawAnalysis;

  // 显示结果区域
  document.getElementById('resultSection').style.display = 'flex';

  // 滚动到结果
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 显示PR信息
 */
function displayPrInfo(prInfo, filesCount) {
  const prInfoHtml = `
    <div class="pr-info-item">
      <label>标题</label>
      <value>${escapeHtml(prInfo.title)}</value>
    </div>
    <div class="pr-info-item">
      <label>作者</label>
      <value>${escapeHtml(prInfo.author)}</value>
    </div>
    <div class="pr-info-item">
      <label>状态</label>
      <value>${prInfo.state === 'open' ? '进行中' : '已关闭'}</value>
    </div>
    <div class="pr-info-item">
      <label>变更文件数</label>
      <value>${filesCount} 个文件</value>
    </div>
    <div class="pr-info-item">
      <label>新增行数</label>
      <value style="color: #4caf50">+${prInfo.additions}</value>
    </div>
    <div class="pr-info-item">
      <label>删除行数</label>
      <value style="color: #f44336">-${prInfo.deletions}</value>
    </div>
  `;

  document.getElementById('prInfo').innerHTML = prInfoHtml;
}

/**
 * 显示评分
 */
function displayScore(score) {
  if (!score) {
    document.getElementById('scoreDisplay').innerHTML = '<p>未找到评分信息</p>';
    return;
  }

  let scoreClass = 'average';
  let scoreLabel = '一般';

  if (score >= 8) {
    scoreClass = 'excellent';
    scoreLabel = '优秀';
  } else if (score >= 6) {
    scoreClass = 'good';
    scoreLabel = '良好';
  } else if (score >= 4) {
    scoreClass = 'average';
    scoreLabel = '一般';
  } else {
    scoreClass = 'poor';
    scoreLabel = '较差';
  }

  const scoreHtml = `
    <div class="score-number">${score}</div>
    <div class="score-bar">
      <div class="score-bar-bg">
        <div class="score-bar-fill ${scoreClass}" style="width: ${score * 10}%"></div>
      </div>
      <div class="score-label">${scoreLabel} (满分10分)</div>
    </div>
  `;

  document.getElementById('scoreDisplay').innerHTML = scoreHtml;
}

/**
 * 显示风险代码
 */
function displayRisks(risks) {
  if (!risks || risks.length === 0) {
    document.getElementById('risksList').innerHTML = '<p style="color: #666;">未发现明显风险代码</p>';
    return;
  }

  const risksHtml = risks.map((risk, index) => {
    // 根据描述判断严重程度
    let severity = 'medium';
    let type = 'logic';

    if (risk.description.includes('高') || risk.description.includes('严重') || risk.description.includes('安全')) {
      severity = 'high';
      type = 'security';
    } else if (risk.description.includes('低') || risk.description.includes('建议')) {
      severity = 'low';
    }

    if (risk.description.includes('性能')) {
      type = 'performance';
    } else if (risk.description.includes('维护')) {
      type = 'maintainability';
    }

    return `
      <div class="risk-item ${severity}">
        <div class="risk-header">
          <span class="risk-type ${type}">${getTypeLabel(type)}</span>
          <span class="risk-severity ${severity}">${getSeverityLabel(severity)}</span>
        </div>
        <div class="risk-description">${formatMarkdown(risk.description)}</div>
      </div>
    `;
  }).join('');

  document.getElementById('risksList').innerHTML = risksHtml;
}

/**
 * 获取类型标签
 */
function getTypeLabel(type) {
  const labels = {
    security: '安全',
    performance: '性能',
    logic: '逻辑',
    maintainability: '可维护性'
  };
  return labels[type] || type;
}

/**
 * 获取严重程度标签
 */
function getSeverityLabel(severity) {
  const labels = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return labels[severity] || severity;
}

/**
 * 切换原始分析显示
 */
function toggleRawAnalysis() {
  const rawAnalysis = document.getElementById('rawAnalysis');
  const btn = rawAnalysis.previousElementSibling;

  if (rawAnalysis.style.display === 'none') {
    rawAnalysis.style.display = 'block';
    btn.textContent = '收起';
  } else {
    rawAnalysis.style.display = 'none';
    btn.textContent = '展开查看';
  }
}

/**
 * 格式化Markdown
 */
function formatMarkdown(text) {
  if (!text) return '';

  // 简单的Markdown格式化
  return text
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 行内代码
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 列表
    .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // 包装在段落中
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // 清理空段落
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<pre>)/g, '$1')
    .replace(/(<\/pre>)<\/p>/g, '$1');
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 页面加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', () => {
  // 添加输入框回车事件
  document.getElementById('prUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      analyzePR();
    }
  });

  // 示例PR链接（可选）
  const examplePr = 'https://github.com/facebook/react/pull/12345';
  document.getElementById('prUrl').placeholder = `请输入GitHub PR链接，例如：${examplePr}`;
});
