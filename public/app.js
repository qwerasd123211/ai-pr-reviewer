// ============================================
// PRISM // AI 代码评审助手
// ============================================

// 全局状态
let isAnalyzing = false;

// DOM 元素
const elements = {
  prUrl: null,
  analyzeBtn: null,
  progressSection: null,
  progressFill: null,
  progressMessage: null,
  progressPercent: null,
  errorSection: null,
  errorMessage: null,
  resultSection: null,
  prInfo: null,
  scoreDisplay: null,
  prSummary: null,
  risksList: null,
  suggestions: null,
  conclusion: null,
  rawAnalysis: null
};

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  initTypingEffect();
});

function initElements() {
  elements.prUrl = document.getElementById('prUrl');
  elements.analyzeBtn = document.getElementById('analyzeBtn');
  elements.progressSection = document.getElementById('progressSection');
  elements.progressFill = document.getElementById('progressFill');
  elements.progressMessage = document.getElementById('progressMessage');
  elements.progressPercent = document.getElementById('progressPercent');
  elements.errorSection = document.getElementById('errorSection');
  elements.errorMessage = document.getElementById('errorMessage');
  elements.resultSection = document.getElementById('resultSection');
  elements.prInfo = document.getElementById('prInfo');
  elements.scoreDisplay = document.getElementById('scoreDisplay');
  elements.prSummary = document.getElementById('prSummary');
  elements.risksList = document.getElementById('risksList');
  elements.suggestions = document.getElementById('suggestions');
  elements.conclusion = document.getElementById('conclusion');
  elements.fixesList = document.getElementById('fixesList');
  elements.rawAnalysis = document.getElementById('rawAnalysis');
}

function initEventListeners() {
  // 输入框回车事件
  elements.prUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      analyzePR();
    }
  });

  // 输入框聚焦效果
  elements.prUrl.addEventListener('focus', () => {
    elements.prUrl.parentElement.classList.add('focused');
  });

  elements.prUrl.addEventListener('blur', () => {
    elements.prUrl.parentElement.classList.remove('focused');
  });
}

function initTypingEffect() {
  const tagline = document.querySelector('.tagline-text');
  if (!tagline) return;

  const text = tagline.textContent;
  tagline.textContent = '';

  let i = 0;
  const typeInterval = setInterval(() => {
    if (i < text.length) {
      tagline.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
    }
  }, 50);
}

// ============================================
// 主要功能
// ============================================

async function analyzePR() {
  const prUrl = elements.prUrl.value.trim();

  // 验证输入
  if (!prUrl) {
    showError('ERROR: 请输入 PR 链接');
    shakeInput();
    return;
  }

  if (!isValidPrUrl(prUrl)) {
    showError('ERROR: 无效的 PR 链接格式（支持 GitHub 和 Gitee）');
    shakeInput();
    return;
  }

  if (isAnalyzing) {
    return;
  }

  isAnalyzing = true;

  // 隐藏之前的区域
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

    // 处理 SSE 流
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
    showError(`ERROR: ${error.message}`);
  } finally {
    isAnalyzing = false;
    updateButtonState(false);
  }
}

// ============================================
// 验证函数
// ============================================

function isValidPrUrl(url) {
  // GitHub: https://github.com/owner/repo/pull/123
  // Gitee: https://gitee.com/owner/repo/pulls/123
  return /github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/.test(url) ||
         /gitee\.com\/[^\/]+\/[^\/]+\/pulls\/\d+/.test(url);
}

// ============================================
// SSE 消息处理
// ============================================

function handleSSEMessage(data) {
  switch (data.type) {
    case 'progress':
      updateProgress(data.message, data.progress);
      break;
    case 'result':
      showResult(data.data);
      break;
    case 'error':
      showError(`错误: ${data.message}`);
      break;
  }
}

// ============================================
// UI 更新函数
// ============================================

function showProgress() {
  elements.progressSection.classList.remove('hidden');
  updateProgress('初始化扫描器...', 0);
}

function updateProgress(message, progress) {
  elements.progressFill.style.width = `${progress}%`;
  elements.progressMessage.textContent = message;
  elements.progressPercent.textContent = `${progress}%`;
}

function hideAllSections() {
  elements.progressSection.classList.add('hidden');
  elements.errorSection.classList.add('hidden');
  elements.resultSection.classList.add('hidden');
}

function showError(message) {
  hideAllSections();
  elements.errorMessage.textContent = message;
  elements.errorSection.classList.remove('hidden');

  // 滚动到错误区域
  elements.errorSection.scrollIntoView({ behavior: 'smooth' });
}

function updateButtonState(disabled) {
  const btn = elements.analyzeBtn;
  btn.disabled = disabled;

  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  const btnIcon = btn.querySelector('.btn-icon');

  if (disabled) {
    btnText.style.display = 'none';
    btnIcon.style.display = 'none';
    btnLoading.style.display = 'inline';
  } else {
    btnText.style.display = 'inline';
    btnIcon.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

function shakeInput() {
  const container = elements.prUrl.parentElement;
  container.classList.add('shake');
  setTimeout(() => {
    container.classList.remove('shake');
  }, 500);
}

// ============================================
// 结果展示
// ============================================

// 全局存储分析数据（用于导出）
let currentAnalysisData = null;

function showResult(data) {
  hideAllSections();

  // 保存当前分析数据
  currentAnalysisData = data;

  // 显示 PR 信息
  displayPrInfo(data.prInfo, data.filesCount);

  // 显示评分
  displayScore(data.analysis.score);

  // 显示变更总结
  elements.prSummary.innerHTML = formatMarkdown(data.analysis.summary);

  // 显示风险代码
  displayRisks(data.analysis.risks);

  // 显示 Review 建议
  elements.suggestions.innerHTML = formatMarkdown(data.analysis.suggestions);

  // 显示总体评价
  elements.conclusion.innerHTML = formatMarkdown(data.analysis.conclusion);

  // 显示一键修复
  displayFixes(data.analysis.fixes);

  // 显示原始分析
  elements.rawAnalysis.textContent = data.rawAnalysis;

  // 显示结果区域
  elements.resultSection.classList.remove('hidden');

  // 滚动到结果
  setTimeout(() => {
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ============================================
// PR 信息展示
// ============================================

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
      <value class="${prInfo.state === 'open' ? 'status-active' : ''}">${prInfo.state === 'open' ? '进行中' : '已关闭'}</value>
    </div>
    <div class="pr-info-item">
      <label>变更文件</label>
      <value>${filesCount} 个</value>
    </div>
    <div class="pr-info-item">
      <label>新增行数</label>
      <value style="color: var(--neon-green)">+${prInfo.additions}</value>
    </div>
    <div class="pr-info-item">
      <label>删除行数</label>
      <value style="color: var(--red)">-${prInfo.deletions}</value>
    </div>
  `;

  elements.prInfo.innerHTML = prInfoHtml;
}

// ============================================
// 评分展示
// ============================================

function displayScore(score) {
  if (!score) {
    elements.scoreDisplay.innerHTML = '<p style="color: var(--text-dim)">暂无评分</p>';
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
      <div class="score-label">${scoreLabel} (满分 10 分)</div>
    </div>
  `;

  elements.scoreDisplay.innerHTML = scoreHtml;
}

// ============================================
// 风险代码展示
// ============================================

function displayRisks(risks) {
  if (!risks || risks.length === 0) {
    elements.risksList.innerHTML = `
      <div class="risk-item low">
        <div class="risk-header">
          <span class="risk-type security">安全</span>
          <span class="risk-severity low">无威胁</span>
        </div>
        <div class="risk-description">未发现明显风险代码</div>
      </div>
    `;
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
      <div class="risk-item ${severity}" style="animation-delay: ${index * 0.1}s">
        <div class="risk-header">
          <span class="risk-type ${type}">${getTypeLabel(type)}</span>
          <span class="risk-severity ${severity}">${getSeverityLabel(severity)}</span>
        </div>
        <div class="risk-description">${formatMarkdown(risk.description)}</div>
      </div>
    `;
  }).join('');

  elements.risksList.innerHTML = risksHtml;
}

function getTypeLabel(type) {
  const labels = {
    security: '安全',
    performance: '性能',
    logic: '逻辑',
    maintainability: '可维护性'
  };
  return labels[type] || type;
}

function getSeverityLabel(severity) {
  const labels = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return labels[severity] || severity;
}

// ============================================
// 原始分析切换
// ============================================

function toggleRawAnalysis() {
  const rawAnalysis = elements.rawAnalysis;
  const toggleBtn = rawAnalysis.previousElementSibling;
  const toggleText = toggleBtn.querySelector('.toggle-text');
  const toggleIcon = toggleBtn.querySelector('.toggle-icon');

  if (rawAnalysis.classList.contains('hidden')) {
    rawAnalysis.classList.remove('hidden');
    toggleText.textContent = '收起';
    toggleIcon.style.transform = 'rotate(180deg)';
  } else {
    rawAnalysis.classList.add('hidden');
    toggleText.textContent = '展开';
    toggleIcon.style.transform = 'rotate(0deg)';
  }
}

// ============================================
// 一键修复展示
// ============================================

function displayFixes(fixes) {
  const fixesList = document.getElementById('fixesList');
  if (!fixesList) return;

  if (!fixes || fixes.length === 0) {
    fixesList.innerHTML = `
      <div class="fix-item">
        <div class="fix-content">
          <p style="color: var(--text-dim); text-align: center;">未发现需要修复的问题</p>
        </div>
      </div>
    `;
    return;
  }

  fixesList.innerHTML = fixes.map((fix, index) => `
    <div class="fix-item" style="animation-delay: ${index * 0.1}s">
      <div class="fix-header">
        <span class="fix-title">${escapeHtml(fix.title)}</span>
        <span class="fix-file">${escapeHtml(fix.file)}</span>
      </div>
      <div class="fix-content">
        <div class="fix-description">${escapeHtml(fix.explanation)}</div>
        ${fix.originalCode ? `
        <div class="fix-code-container">
          <div class="fix-code-block">
            <span class="fix-code-label">原始代码</span>
            <pre class="fix-code">${escapeHtml(fix.originalCode)}</pre>
          </div>
          <div class="fix-code-block">
            <span class="fix-code-label">修复后代码</span>
            <pre class="fix-code">${escapeHtml(fix.fixedCode)}</pre>
          </div>
        </div>
        ` : `
        <div class="fix-code-block">
          <span class="fix-code-label">修复代码</span>
          <pre class="fix-code">${escapeHtml(fix.fixedCode)}</pre>
        </div>
        `}
        <div class="fix-actions">
          <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(fix.fixedCode).replace(/'/g, "\\'")}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            复制代码
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // 复制成功提示
    const btn = event.target.closest('.copy-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
    btn.style.background = 'var(--neon-green)';
    btn.style.color = 'var(--bg-dark)';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = 'transparent';
      btn.style.color = 'var(--neon-green)';
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
}

// ============================================
// 导出报告
// ============================================

function exportMarkdown() {
  if (!currentAnalysisData) {
    alert('没有可导出的分析数据');
    return;
  }

  const data = currentAnalysisData;
  const md = generateMarkdownReport(data);

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pr-review-${data.prInfo.title.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  if (!currentAnalysisData) {
    alert('没有可导出的分析数据');
    return;
  }

  const data = currentAnalysisData;
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pr-review-${data.prInfo.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateMarkdownReport(data) {
  const pr = data.prInfo;
  const analysis = data.analysis;

  let md = `# PR 代码评审报告

## PR 信息
- **标题**: ${pr.title}
- **作者**: ${pr.author}
- **状态**: ${pr.state}
- **变更文件数**: ${data.filesCount}
- **新增行数**: +${pr.additions}
- **删除行数**: -${pr.deletions}
- **分析时间**: ${new Date(data.analyzedAt).toLocaleString('zh-CN')}

## 代码质量评分
${analysis.score ? `${analysis.score}/10` : '未评分'}

## 变更总结
${analysis.summary}

## 风险代码识别
${analysis.risks && analysis.risks.length > 0
    ? analysis.risks.map(r => `- ${r.description}`).join('\n')
    : '未发现明显风险'}

## 改进建议
${analysis.suggestions}

## 总体评价
${analysis.conclusion}

## 一键修复建议
${analysis.fixes && analysis.fixes.length > 0
    ? analysis.fixes.map(f => `### ${f.title}
- **文件**: ${f.file}
- **说明**: ${f.explanation}

\`\`\`
${f.fixedCode}
\`\`\`
`).join('\n')
    : '无修复建议'}

---
*由 PRISM AI 代码评审助手生成*
`;

  return md;
}

// ============================================
// Markdown 格式化
// ============================================

function formatMarkdown(text) {
  if (!text) return '';

  // 先转义 HTML，防止 XSS
  let safeText = escapeHtml(text);

  // 简单的 Markdown 格式化
  return safeText
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

// ============================================
// 工具函数
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// CSS 动态注入（抖动效果）
// ============================================

const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  .focused {
    border-color: var(--neon-green) !important;
    box-shadow: 0 0 20px var(--neon-green-glow) !important;
  }

  .status-active {
    color: var(--neon-green) !important;
    text-shadow: 0 0 8px var(--neon-green-glow);
  }
`;
document.head.appendChild(style);
