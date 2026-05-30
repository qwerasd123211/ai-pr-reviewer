/**
 * PRISM 国际化模块
 * 支持中文和英文切换
 */

const translations = {
  zh: {
    // 通用
    title: 'PRISM // AI 代码评审助手',
    subtitle: 'AI 驱动的智能代码评审系统 v2.0',

    // 头部统计
    engine: '引擎',
    status: '状态',
    online: '在线',
    version: '版本',

    // 输入区域
    targetAcquisition: '目标获取',
    inputPlaceholder: 'GitHub 或 Gitee PR 链接',
    scanButton: '扫描',
    scanningButton: '扫描中...',
    inputHint: '支持 GitHub 和 Gitee 的 PR 链接 | 私有仓库请配置 Token',

    // 进度
    analyzing: '分析进行中',
    initializing: '初始化扫描器...',
    estimatedTime: '预计需要 30-60 秒，请耐心等待...',

    // 错误
    errorDetected: '检测到错误',
    retryButton: '重试',
    inputError: '请输入 PR 链接',
    formatError: '无效的 PR 链接格式（支持 GitHub 和 Gitee）',
    analyzingError: '正在分析中，请稍候...',

    // 结果 - PR 信息
    prMetadata: 'PR 元数据',
    extracted: '已提取',
    title: '标题',
    author: '作者',
    statusOpen: '进行中',
    statusClosed: '已关闭',
    filesChanged: '变更文件',
    files: '个',
    additions: '新增行数',
    deletions: '删除行数',

    // 结果 - 评分
    qualityAssessment: '质量评估',
    scoreNotAvailable: '暂无评分',
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '较差',
    maxScore: '满分 10 分',

    // 结果 - 变更总结
    changeSummary: '变更总结',

    // 结果 - 风险识别
    riskDetection: '风险检测',
    warning: '警告',
    highRisk: '高风险',
    mediumRisk: '中风险',
    lowRisk: '低风险',

    // 结果 - 安全漏洞
    securityScan: '安全漏洞扫描',
    scanning: '扫描中',
    safe: '安全',
    critical: '严重',
    high: '高危',
    medium: '中危',
    low: '低危',
    vulnerabilitiesFound: '发现 {count} 个漏洞',
    noVulnerabilities: '未发现安全漏洞，代码安全性良好',
    fixSuggestion: '修复建议：',

    // 结果 - 改进建议
    recommendations: '改进建议',

    // 结果 - 总体评价
    finalVerdict: '总体评价',

    // 结果 - 一键修复
    oneClickFix: '一键修复',
    aiGenerated: 'AI 生成',
    noFixNeeded: '未发现需要修复的问题',
    originalCode: '原始代码',
    fixedCode: '修复后代码',
    copyCode: '复制代码',
    copied: '已复制',

    // 结果 - 原始分析
    rawAnalysisData: '原始分析数据',
    expand: '展开',
    collapse: '收起',

    // 结果 - 导出
    exportReport: '导出报告',
    exportMarkdown: '导出 Markdown',
    exportJSON: '导出 JSON',

    // 使用说明
    usageGuide: '使用说明',
    step1Title: '输入 PR 链接',
    step1Desc: '支持 GitHub 和 Gitee 的 PR 链接格式',
    step2Title: '点击扫描',
    step2Desc: 'AI 自动分析代码变更，预计 30-60 秒',
    step3Title: '查看报告',
    step3Desc: '查看评分、风险识别、修复建议',
    step4Title: '导出报告',
    step4Desc: '支持 Markdown 和 JSON 格式导出',

    // 系统架构
    systemArchitecture: '系统架构',
    aiEngine: 'AI 引擎',
    aiEngineDesc: 'DeepSeek V4 Pro - 具备深度代码理解能力和精准的问题识别能力。',
    dataAcquisition: '数据获取',
    dataAcquisitionDesc: 'GitHub/Gitee REST API - 获取 PR 元数据、文件变更和代码差异。',
    threatDetection: '威胁检测',
    threatDetectionDesc: '多维度风险分析：安全漏洞、性能瓶颈、逻辑缺陷、可维护性问题。',
    evolutionPath: '扩展路径',
    evolutionPathDesc: '支持多 AI 模型切换、多平台扩展、自定义规则引擎、团队协作。',

    // 页脚
    footerTitle: 'AI PR Review 助手 - 七牛云实训项目',
    footerTech: 'Node.js + DeepSeek API + GitHub/Gitee API',
    engineeredBy: '开发者',
    authorName: '张顺',
    copyright: '© 2026 PRISM 系统',

    // 语言切换
    language: '语言',
    chinese: '中文',
    english: 'English'
  },

  en: {
    // General
    title: 'PRISM // AI Code Review Assistant',
    subtitle: 'AI-Powered Intelligent Code Review System v2.0',

    // Header stats
    engine: 'ENGINE',
    status: 'STATUS',
    online: 'ONLINE',
    version: 'VERSION',

    // Input section
    targetAcquisition: 'TARGET ACQUISITION',
    inputPlaceholder: 'GitHub or Gitee PR Link',
    scanButton: 'SCAN',
    scanningButton: 'SCANNING...',
    inputHint: 'Supports GitHub and Gitee PR links | Private repos require Token',

    // Progress
    analyzing: 'ANALYSIS IN PROGRESS',
    initializing: 'Initializing scanner...',
    estimatedTime: 'Estimated time: 30-60 seconds, please wait...',

    // Error
    errorDetected: 'ERROR DETECTED',
    retryButton: 'RETRY',
    inputError: 'Please enter a PR link',
    formatError: 'Invalid PR link format (supports GitHub and Gitee)',
    analyzingError: 'Analysis in progress, please wait...',

    // Results - PR Info
    prMetadata: 'PULL REQUEST METADATA',
    extracted: 'EXTRACTED',
    title: 'TITLE',
    author: 'AUTHOR',
    statusOpen: 'OPEN',
    statusClosed: 'CLOSED',
    filesChanged: 'FILES CHANGED',
    files: '',
    additions: 'ADDITIONS',
    deletions: 'DELETIONS',

    // Results - Score
    qualityAssessment: 'QUALITY ASSESSMENT',
    scoreNotAvailable: 'Score not available',
    excellent: 'EXCELLENT',
    good: 'GOOD',
    average: 'AVERAGE',
    poor: 'POOR',
    maxScore: 'MAX: 10',

    // Results - Summary
    changeSummary: 'CHANGE SUMMARY',

    // Results - Risk
    riskDetection: 'RISK DETECTION',
    warning: 'WARNING',
    highRisk: 'HIGH RISK',
    mediumRisk: 'MEDIUM RISK',
    lowRisk: 'LOW RISK',

    // Results - Security
    securityScan: 'SECURITY SCAN',
    scanning: 'SCANNING',
    safe: 'SAFE',
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    vulnerabilitiesFound: '{count} vulnerabilities found',
    noVulnerabilities: 'No security vulnerabilities found, code is secure',
    fixSuggestion: 'Fix suggestion: ',

    // Results - Recommendations
    recommendations: 'RECOMMENDATIONS',

    // Results - Verdict
    finalVerdict: 'FINAL VERDICT',

    // Results - Fix
    oneClickFix: 'ONE-CLICK FIX',
    aiGenerated: 'AI GENERATED',
    noFixNeeded: 'No issues found that need fixing',
    originalCode: 'Original Code',
    fixedCode: 'Fixed Code',
    copyCode: 'Copy Code',
    copied: 'Copied',

    // Results - Raw
    rawAnalysisData: 'RAW ANALYSIS DATA',
    expand: 'EXPAND',
    collapse: 'COLLAPSE',

    // Results - Export
    exportReport: 'EXPORT REPORT',
    exportMarkdown: 'Export Markdown',
    exportJSON: 'Export JSON',

    // Usage Guide
    usageGuide: 'USAGE GUIDE',
    step1Title: 'Enter PR Link',
    step1Desc: 'Supports GitHub and Gitee PR link formats',
    step2Title: 'Click Scan',
    step2Desc: 'AI automatically analyzes code changes, ~30-60 seconds',
    step3Title: 'View Report',
    step3Desc: 'View scores, risk detection, and fix suggestions',
    step4Title: 'Export Report',
    step4Desc: 'Export in Markdown or JSON format',

    // System Architecture
    systemArchitecture: 'SYSTEM ARCHITECTURE',
    aiEngine: 'AI ENGINE',
    aiEngineDesc: 'DeepSeek V4 Pro - Advanced language model with deep code understanding and precise problem identification.',
    dataAcquisition: 'DATA ACQUISITION',
    dataAcquisitionDesc: 'GitHub/Gitee REST API - Fetches PR metadata, file changes, and code differences.',
    threatDetection: 'THREAT DETECTION',
    threatDetectionDesc: 'Multi-dimensional risk analysis: security vulnerabilities, performance bottlenecks, logic flaws, maintainability issues.',
    evolutionPath: 'EVOLUTION PATH',
    evolutionPathDesc: 'Supports multiple AI models, multi-platform expansion, custom rule engines, team collaboration.',

    // Footer
    footerTitle: 'AI PR Review Assistant - Qiniu Cloud Training Project',
    footerTech: 'Node.js + DeepSeek API + GitHub/Gitee API',
    engineeredBy: 'ENGINEERED BY',
    authorName: 'Zhang Shun',
    copyright: '© 2026 PRISM SYSTEMS',

    // Language
    language: 'LANGUAGE',
    chinese: '中文',
    english: 'English'
  }
};

// 当前语言
let currentLang = localStorage.getItem('prism-lang') || 'zh';

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {Object} params - 替换参数
 * @returns {string} 翻译后的文本
 */
function t(key, params = {}) {
  let text = translations[currentLang]?.[key] || translations['zh'][key] || key;

  // 替换参数
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}

/**
 * 切换语言
 * @param {string} lang - 语言代码
 */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('prism-lang', lang);
  updatePageLanguage();
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getCurrentLanguage() {
  return currentLang;
}

/**
 * 更新页面语言
 */
function updatePageLanguage() {
  // 更新标题
  document.title = t('title');

  // 更新所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // 更新所有带 data-i18n-placeholder 属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // 更新 HTML lang 属性
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

// 导出
window.i18n = {
  t,
  setLanguage,
  getCurrentLanguage,
  updatePageLanguage
};
