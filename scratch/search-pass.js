const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git') return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const rootDir = path.join(__dirname, '..');

walkDir(rootDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.sql') || filePath.endsWith('.local') || filePath.endsWith('.toml')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.toLowerCase().includes('password') || content.toLowerCase().includes('postgresql') || content.toLowerCase().includes('postgres:')) {
      console.log(`Match in: ${filePath}`);
    }
  }
});
