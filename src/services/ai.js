const fetch = require('node-fetch');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * 分析代码变更
 */
async function analyzeCode(prDetails, files, onProgress) {
  if (!CLAUDE_API_KEY) {
    throw new Error('请配置CLAUDE_API_KEY环境变量');
  }

  onProgress('正在准备分析...', 60);

  // 构建分析prompt
  const prompt = buildAnalysisPrompt(prDetails, files);

  onProgress('正在调用AI分析...', 70);

  // 调用Claude API
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API错误: ${error.error?.message || response.status}`);
  }

  onProgress('正在生成报告...', 90);

  const data = await response.json();
  const analysis = data.content[0].text;

  // 解析AI返回的分析结果
  return parseAnalysis(analysis, prDetails, files);
}

/**
 * 构建分析prompt
 */
function buildAnalysisPrompt(prDetails, files) {
  const filesSummary = files.map(f => {
    return `文件: ${f.filename}
状态: ${f.status}
新增行数: ${f.additions}
删除行数: ${f.deletions}
代码变更:
\`\`\`
${f.patch || '无diff'}
\`\`\`
`;
  }).join('\n---\n');

  return `你是一个专业的代码评审专家。请分析以下Pull Request的代码变更，并提供详细的评审报告。

## PR信息
- 标题: ${prDetails.title}
- 描述: ${prDetails.description}
- 作者: ${prDetails.author}
- 变更文件数: ${prDetails.changed_files}
- 新增行数: ${prDetails.additions}
- 删除行数: ${prDetails.deletions}

## 代码变更
${filesSummary}

## 评审要求
请按照以下格式提供评审报告：

### 1. PR变更总结
用2-3句话概括这个PR做了什么变更，变更的目的和影响。

### 2. 代码质量评分
给出一个1-10的评分（10为最佳），并说明评分理由。

### 3. 风险代码识别
列出发现的潜在问题，每个问题包括：
- 问题类型（安全/性能/逻辑/可维护性/其他）
- 严重程度（高/中/低）
- 所在文件和代码位置
- 问题描述
- 修复建议

### 4. Review建议
给出整体的改进建议，包括：
- 代码风格建议
- 架构设计建议
- 测试建议
- 其他建议

### 5. 总体评价
总结评审结论，是否建议合并，以及需要重点关注的问题。

请确保评审准确、专业、有建设性。`;
}

/**
 * 解析AI返回的分析结果
 */
function parseAnalysis(analysis, prDetails, files) {
  // 提取各个部分
  const sections = {
    summary: extractSection(analysis, 'PR变更总结'),
    score: extractScore(analysis),
    risks: extractRisks(analysis),
    suggestions: extractSection(analysis, 'Review建议'),
    conclusion: extractSection(analysis, '总体评价')
  };

  return {
    prInfo: prDetails,
    filesCount: files.length,
    analysis: sections,
    rawAnalysis: analysis,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * 提取指定章节内容
 */
function extractSection(text, sectionName) {
  const regex = new RegExp(`###?\\s*\\d*\\.?\\s*${sectionName}[\\s\\S]*?(?=###|$)`, 'i');
  const match = text.match(regex);

  if (match) {
    return match[0]
      .replace(/###?\s*\d*\.?\s*/, '')
      .trim();
  }

  return '未找到相关分析';
}

/**
 * 提取评分
 */
function extractScore(text) {
  const regex = /(\d+)\s*[/／]\s*10|评分[：:]\s*(\d+)/;
  const match = text.match(regex);

  if (match) {
    return parseInt(match[1] || match[2]);
  }

  return null;
}

/**
 * 提取风险问题
 */
function extractRisks(text) {
  const risksSection = extractSection(text, '风险代码识别');

  // 简单解析，实际可能需要更复杂的逻辑
  const risks = [];
  const lines = risksSection.split('\n');

  let currentRisk = null;

  for (const line of lines) {
    if (line.match(/^\d+\./) || line.match(/^[-•]/)) {
      if (currentRisk) {
        risks.push(currentRisk);
      }
      currentRisk = { description: line.replace(/^\d+\.\s*|^[-•]\s*/, '').trim() };
    } else if (currentRisk) {
      currentRisk.description += ' ' + line.trim();
    }
  }

  if (currentRisk) {
    risks.push(currentRisk);
  }

  return risks;
}

module.exports = {
  analyzeCode
};
