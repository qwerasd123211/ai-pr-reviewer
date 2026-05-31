const fetch = require('node-fetch');

const GITHUB_API = 'https://api.github.com';
const GITEE_API = 'https://gitee.com/api/v5';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITEE_TOKEN = process.env.GITEE_TOKEN;

// GitHub 请求头
const githubHeaders = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'AI-PR-Reviewer'
};

if (GITHUB_TOKEN) {
  githubHeaders['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
}

// Gitee 请求头
const giteeHeaders = {
  'Content-Type': 'application/json'
};

if (GITEE_TOKEN) {
  giteeHeaders['Authorization'] = `Bearer ${GITEE_TOKEN}`;
}

/**
 * 解析PR链接
 * 支持 GitHub: https://github.com/owner/repo/pull/123
 * 支持 Gitee: https://gitee.com/owner/repo/pulls/123
 */
function parsePrUrl(url) {
  // GitHub PR 链接
  const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const githubMatch = url.match(githubRegex);

  if (githubMatch) {
    return {
      platform: 'github',
      owner: githubMatch[1],
      repo: githubMatch[2],
      prNumber: parseInt(githubMatch[3])
    };
  }

  // Gitee PR 链接
  const giteeRegex = /gitee\.com\/([^\/]+)\/([^\/]+)\/pulls\/(\d+)/;
  const giteeMatch = url.match(giteeRegex);

  if (giteeMatch) {
    return {
      platform: 'gitee',
      owner: giteeMatch[1],
      repo: giteeMatch[2],
      prNumber: parseInt(giteeMatch[3])
    };
  }

  return null;
}

/**
 * 获取PR详情（支持 GitHub 和 Gitee）
 */
async function getPrDetails(owner, repo, prNumber, platform = 'github') {
  if (platform === 'gitee') {
    return await getGiteePrDetails(owner, repo, prNumber);
  }
  return await getGithubPrDetails(owner, repo, prNumber);
}

/**
 * 获取 GitHub PR 详情
 */
async function getGithubPrDetails(owner, repo, prNumber) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`;

  const response = await fetch(url, { headers: githubHeaders });

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
 * 获取 Gitee PR 详情
 */
async function getGiteePrDetails(owner, repo, prNumber) {
  const url = `${GITEE_API}/repos/${owner}/${repo}/pulls/${prNumber}`;

  const response = await fetch(url, { headers: giteeHeaders });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR不存在，请检查链接是否正确');
    }
    throw new Error(`Gitee API错误: ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title,
    description: data.body || '无描述',
    author: data.user.login,
    state: data.state === 'open' ? 'open' : 'closed',
    created_at: data.created_at,
    updated_at: data.updated_at,
    additions: data.additions || 0,
    deletions: data.deletions || 0,
    changed_files: data.changed_files || 0
  };
}

/**
 * 获取PR的文件变更（支持 GitHub 和 Gitee）
 */
async function getPrFiles(owner, repo, prNumber, platform = 'github') {
  if (platform === 'gitee') {
    return await getGiteePrFiles(owner, repo, prNumber);
  }
  return await getGithubPrFiles(owner, repo, prNumber);
}

/**
 * 获取 GitHub PR 文件变更
 */
async function getGithubPrFiles(owner, repo, prNumber) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`;

  const response = await fetch(url, { headers: githubHeaders });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR不存在，请检查链接是否正确');
    }
    if (response.status === 403) {
      throw new Error('API访问受限，请配置GITHUB_TOKEN');
    }
    throw new Error(`获取文件变更失败: ${response.status}`);
  }

  const data = await response.json();

  // 验证返回值是否为数组
  if (!Array.isArray(data)) {
    console.error('GitHub API 返回非数组:', data);
    throw new Error('GitHub API 返回数据格式异常，请稍后重试');
  }

  return data.map(file => ({
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
 * 获取 Gitee PR 文件变更
 */
async function getGiteePrFiles(owner, repo, prNumber) {
  const url = `${GITEE_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`;

  const response = await fetch(url, { headers: giteeHeaders });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR不存在，请检查链接是否正确');
    }
    throw new Error(`获取文件变更失败: ${response.status}`);
  }

  const data = await response.json();

  // 验证返回值是否为数组
  if (!Array.isArray(data)) {
    console.error('Gitee API 返回非数组:', data);
    throw new Error('Gitee API 返回数据格式异常，请稍后重试');
  }

  return data.map(file => ({
    filename: file.filename || file.new_path || file.old_path,
    status: file.status || (file.new_path ? (file.deleted_file ? 'removed' : 'modified') : 'removed'),
    additions: parseInt(file.additions) || 0,
    deletions: parseInt(file.deletions) || 0,
    changes: (parseInt(file.additions) || 0) + (parseInt(file.deletions) || 0),
    patch: typeof file.patch === 'string' ? file.patch : (file.patch?.diff || ''),
    raw_url: file.raw_url || '',
    contents_url: file.contents_url || ''
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
