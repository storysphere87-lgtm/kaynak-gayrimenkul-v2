const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '../src');

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('gemini-1.5-flash')) {
      console.log(`Found gemini-1.5-flash in: ${filePath}`);
      let updatedContent = content.replace(/gemini-1.5-flash/g, 'gemini-2.5-flash');
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated model in: ${filePath}`);
    }
  }
});
