/**
 * 构建脚本：将数据文件复制到 public/data 目录
 * 这样数据文件会直接部署到网站，不依赖 GitHub API
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const dataFiles = [
  'cards.json',
  'poolCategories.json',
  'songs_list.json',
];

const srcDir = join(rootDir, 'src', 'assets');
const destDir = join(rootDir, 'public', 'data');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
  console.log(`✅ 创建目录: ${destDir}`);
}

let copiedCount = 0;
for (const file of dataFiles) {
  const srcPath = join(srcDir, file);
  const destPath = join(destDir, file);

  if (existsSync(srcPath)) {
    try {
      copyFileSync(srcPath, destPath);
      console.log(`✅ 已复制: ${file}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ 复制失败 ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠️ 文件不存在: ${srcPath}`);
  }
}

if (copiedCount === dataFiles.length) {
  console.log(`\n✅ 成功复制 ${copiedCount} 个数据文件到 public/data/`);
  console.log('📝 数据文件将随网站一起部署，用户可以直接从网站获取最新数据，无需依赖 GitHub API');
} else {
  console.error(`\n⚠️ 只成功复制了 ${copiedCount}/${dataFiles.length} 个文件`);
  process.exit(1);
}
