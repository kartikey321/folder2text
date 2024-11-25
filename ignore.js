const fs = require('fs');
const path = require('path');

const defaultIgnoreList = [
  // Folders
  'node_modules',
  'vendor',
  '.git',
  '.idea',
  'dist',
  'build',
  'coverage',
  
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'psd', 'ai', 'eps', 'raw', 'xcf',
  
  // Known binary extensions
  'exe', 'dll', 'so', 'dylib', 'bin', 'obj',
  'db', 'sqlite', 'sqlite3', 'mdb',
  'zip', 'tar', 'gz', '7z', 'rar',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'ttf', 'otf', 'woff', 'woff2',

  // Config and lock files
  'package-lock.json',
  'yarn.lock',
  '.prettierrc',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  '.babelrc',
  '.babelrc.js',
  '.babelrc.json',
  'tsconfig.json',
  'webpack.config.js',
  'jest.config.js',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test'
];

function isBinaryFile(filePath) {
  try {
    const buffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }

    return false;
  } catch (error) {
    console.error(`Error checking binary file ${filePath}:`, error.message);
    return false;
  }
}

function shouldIgnore(filepath) {
  try {
    const basename = path.basename(filepath);
    const extension = path.extname(filepath).toLowerCase().replace('.', '');
    
    // Ignore directory check
    if (defaultIgnoreList.includes(basename)) {
      return true;
    }

    // Ignore extension check
    if (extension && defaultIgnoreList.includes(extension)) {
      return true;
    }

    // Ignore checking for folders / files with . at the start
    if (basename.startsWith('.')) {
      return true;
    }

    // Checking for binary 
    if (fs.statSync(filepath).isFile()) {
      const binary = isBinaryFile(filepath);
      if (binary) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error in shouldIgnore for ${filepath}:`, error.message);
    return false; 
  }
}

module.exports = { defaultIgnoreList, shouldIgnore };