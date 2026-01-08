/**
 * 数据加载工具
 * 支持从 GitHub Raw Content API 获取最新数据，失败时回退到本地数据
 */

const GITHUB_CONFIG = {
  owner: 'chenczn3528',
  repo: 'deepspace',
  branch: 'main',
};

function getGitHubRawUrl(filename) {
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/src/assets/${filename}`;
}

function getLocalUrl(filename) {
  const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
  return `${basePath}/data/${filename}`;
}

export async function loadDataFile(filename, fallbackData) {
  const timestamp = Date.now();

  try {
    const localUrl = getLocalUrl(filename);
    const urlWithCacheBust = `${localUrl}?t=${timestamp}&r=${Math.random()}`;
    const response = await fetch(urlWithCacheBust, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 从网站本身获取最新数据: ${filename} (URL: ${localUrl})`);
      return data;
    }
  } catch (error) {
    console.warn(`⚠️ 从本地站点加载 ${filename} 失败:`, error.message || error);
  }

  const githubUrl = getGitHubRawUrl(filename);
  if (githubUrl) {
    try {
      const urlWithCacheBust = `${githubUrl}?t=${timestamp}&r=${Math.random()}`;
      const response = await fetch(urlWithCacheBust, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 从 GitHub 动态获取最新数据: ${filename} (URL: ${githubUrl})`);
        return data;
      }
      console.warn(`⚠️ 从 GitHub 加载 ${filename} 失败: HTTP ${response.status}`);
    } catch (error) {
      console.warn(`⚠️ 从 GitHub 加载 ${filename} 失败:`, error.message || error);
    }
  }

  console.log(`ℹ️ 使用构建时打包的静态数据: ${filename} (数据版本: 构建时的版本，非最新)`);
  return fallbackData;
}
