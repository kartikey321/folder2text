const fs = require('fs');

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
  'ttf', 'otf', 'woff', 'woff2'
];

function isBinaryFile(filePath) {
  try {
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      const byte = buffer[i];
      if (byte === 0 || (byte < 7 && byte !== 0x0a && byte !== 0x0d)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return true; 
  }
}

function shouldIgnore(path) {
  const basename = path.split('/').pop();
  const extension = basename.split('.').pop().toLowerCase();
  
  return basename.startsWith('.') || 
         defaultIgnoreList.includes(basename) || 
         defaultIgnoreList.includes(extension) ||
         isBinaryFile(path);
}

module.exports = { defaultIgnoreList, shouldIgnore };