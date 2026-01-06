const fs = require('fs');
const path = require('path');

// 目标目录
const postsDir = path.join(__dirname, 'posts');

/**
 * 遍历目录并重命名.md文件为.mdx文件
 * @param {string} dir - 要遍历的目录路径
 */
function renameMdToMdx(dir) {
  try {
    // 读取目录内容
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        // 递归处理子目录
        renameMdToMdx(fullPath);
      } else if (file.isFile() && path.extname(file.name) === '.md') {
        // 构建新的文件名（替换.md为.mdx）
        const newFileName = file.name.replace(/\.md$/, '.mdx');
        const newFullPath = path.join(dir, newFileName);
        
        // 重命名文件
        fs.renameSync(fullPath, newFullPath);
        console.log(`重命名: ${fullPath} -> ${newFullPath}`);
      }
    });
  } catch (error) {
    console.error(`遍历目录时出错: ${dir}`, error);
  }
}

// 开始执行重命名操作
console.log('开始将.md文件重命名为.mdx文件...');
renameMdToMdx(postsDir);
console.log('重命名操作完成！');