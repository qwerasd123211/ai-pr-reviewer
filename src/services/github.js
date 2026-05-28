const fetch = require('node-fetch');

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// 通用请求头
const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'AI-PR-Reviewer'
};

// 如果有token则添加认证
if (GITHUB_TOKEN) {
  headers['Authorization'] = `token ${GITHUB_TOKEN}`;
}

/**
 * 解析PR链接
 * 支持格式：https://github.com/owner/repo/pull/123
 */
function parsePrUrl(url) {
  const regex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(regex);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3])
  };
}

/**
 * 获取PR详情
 */
async function getPrDetails(owner, repo, prNumber) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR不存在，请检查链接是否正确');
    }
    if (response.status === 403) {
      throw new Error('API访问受限，请配置GITHUB_TOKEN');
    }
    throw new Error(`GitHub API错误: ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title,
    description: data.body || '无描述',
    author: data.user.login,
    state: data.state,
    created_at: data.created_at,
    updated_at: data.updated_at,
    additions: data.additions,
    deletions: data.deletions,
    changed_files: data.changed_files
  };
}

/**
 * 获取PR的文件变更
 */
async function getPrFiles(owner, repo, prNumber) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`获取文件变更失败: ${response.status}`);
  }

  const files = await response.json();

  return files.map(file => ({
    filename: file.filename,
    status: file.status, // added, removed, modified
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch || '',
    raw_url: file.raw_url,
    contents_url: file.contents_url
  }));
}

/**
 * 获取文件内容
 */
async function getFileContent(owner, repo, filePath, ref) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  return null;
}

module.exports = {
  parsePrUrl,
  getPrDetails,
  getPrFiles,
  getFileContent
};
