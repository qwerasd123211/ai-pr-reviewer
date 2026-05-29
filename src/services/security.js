/**
 * PRISM 安全漏洞检测引擎
 * 基于 OWASP Top 10、CWE、NVD 数据库
 */

const fs = require('fs');
const path = require('path');

// 加载漏洞数据库
const vulnerabilitiesPath = path.join(__dirname, '../data/vulnerabilities.json');
const vulnerabilitiesData = JSON.parse(fs.readFileSync(vulnerabilitiesPath, 'utf-8'));

/**
 * 检测代码中的安全漏洞
 * @param {string} code - 代码内容
 * @param {string} filename - 文件名
 * @returns {Array} 漏洞列表
 */
function detectVulnerabilities(code, filename) {
  const vulnerabilities = [];

  // 遍历漏洞库
  for (const [key, vuln] of Object.entries(vulnerabilitiesData.vulnerabilities)) {
    // 检查代码模式
    for (const pattern of vuln.patterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = code.match(regex);

      if (matches) {
        // 查找行号
        const lineNumber = findLineNumber(code, matches[0]);

        vulnerabilities.push({
          id: vuln.id,
          type: key,
          name: vuln.name,
          category: vuln.category,
          severity: vuln.severity,
          owasp: vuln.owasp,
          cwe: vuln.cwe,
          description: vuln.description,
          impact: vuln.impact,
          fix: vuln.fix,
          fixExample: vuln.fixExample,
          references: vuln.references,
          location: {
            file: filename,
            line: lineNumber,
            code: matches[0]
          }
        });
      }
    }
  }

  return vulnerabilities;
}

/**
 * 查找代码所在的行号
 * @param {string} code - 代码内容
 * @param {string} match - 匹配的内容
 * @returns {number} 行号
 */
function findLineNumber(code, match) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return 0;
}

/**
 * 分析多个文件的安全漏洞
 * @param {Array} files - 文件列表
 * @returns {Object} 分析结果
 */
function analyzeSecurity(files) {
  const allVulnerabilities = [];
  const fileStats = {};

  // 遍历所有文件
  for (const file of files) {
    const vulns = detectVulnerabilities(file.patch || '', file.filename);

    if (vulns.length > 0) {
      allVulnerabilities.push(...vulns);
      fileStats[file.filename] = {
        count: vulns.length,
        critical: vulns.filter(v => v.severity === 'critical').length,
        high: vulns.filter(v => v.severity === 'high').length,
        medium: vulns.filter(v => v.severity === 'medium').length,
        low: vulns.filter(v => v.severity === 'low').length
      };
    }
  }

  // 统计结果
  const stats = {
    total: allVulnerabilities.length,
    critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
    high: allVulnerabilities.filter(v => v.severity === 'high').length,
    medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
    low: allVulnerabilities.filter(v => v.severity === 'low').length
  };

  // 计算安全评分
  const securityScore = calculateSecurityScore(stats);

  return {
    vulnerabilities: allVulnerabilities,
    stats: stats,
    fileStats: fileStats,
    securityScore: securityScore,
    summary: generateSecuritySummary(stats, allVulnerabilities)
  };
}

/**
 * 计算安全评分
 * @param {Object} stats - 统计数据
 * @returns {number} 安全评分（0-100）
 */
function calculateSecurityScore(stats) {
  const weights = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3
  };

  let score = 100;
  score -= stats.critical * weights.critical;
  score -= stats.high * weights.high;
  score -= stats.medium * weights.medium;
  score -= stats.low * weights.low;

  return Math.max(0, Math.min(100, score));
}

/**
 * 生成安全摘要
 * @param {Object} stats - 统计数据
 * @param {Array} vulnerabilities - 漏洞列表
 * @returns {string} 安全摘要
 */
function generateSecuritySummary(stats, vulnerabilities) {
  if (stats.total === 0) {
    return '未发现安全漏洞，代码安全性良好。';
  }

  let summary = `发现 ${stats.total} 个安全问题：`;

  if (stats.critical > 0) {
    summary += `\n- ${stats.critical} 个严重漏洞`;
  }
  if (stats.high > 0) {
    summary += `\n- ${stats.high} 个高危漏洞`;
  }
  if (stats.medium > 0) {
    summary += `\n- ${stats.medium} 个中危漏洞`;
  }
  if (stats.low > 0) {
    summary += `\n- ${stats.low} 个低危漏洞`;
  }

  // 列出最严重的问题
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
  if (criticalVulns.length > 0) {
    summary += '\n\n最严重的问题：';
    for (const vuln of criticalVulns.slice(0, 3)) {
      summary += `\n- ${vuln.name} (${vuln.location.file}:${vuln.location.line})`;
    }
  }

  return summary;
}

/**
 * 获取漏洞严重程度信息
 * @param {string} severity - 严重程度
 * @returns {Object} 严重程度信息
 */
function getSeverityInfo(severity) {
  return vulnerabilitiesData.severityLevels[severity] || {
    name: '未知',
    color: '#888',
    score: 0,
    description: '未知严重程度'
  };
}

/**
 * 获取所有漏洞类型
 * @returns {Array} 漏洞类型列表
 */
function getVulnerabilityTypes() {
  return Object.entries(vulnerabilitiesData.vulnerabilities).map(([key, vuln]) => ({
    id: key,
    name: vuln.name,
    category: vuln.category,
    severity: vuln.severity,
    description: vuln.description
  }));
}

module.exports = {
  detectVulnerabilities,
  analyzeSecurity,
  calculateSecurityScore,
  generateSecuritySummary,
  getSeverityInfo,
  getVulnerabilityTypes
};
