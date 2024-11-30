const fs = require('fs');
const path = require('path');

const skipContentFiles = [
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
  '.env.test',
  'composer.lock'
];

const skipTraversalFolders = [
  // Common folders
  'node_modules',
  'vendor',
  '.git',
  '.idea',
  '.vscode',
  '.vs',
  'dist',
  'build',
  'coverage',
  
  // Symfony specific folders
  'var/cache',
  'var/log',
  'var/sessions',
  'var/tmp',
  'public/bundles',
  
  // Laravel specific folders
  'storage/app',
  'storage/framework/cache',
  'storage/framework/sessions',
  'storage/framework/testing',
  'storage/framework/views',
  'storage/logs',
  'bootstrap/cache',
  'public/storage',

  // JavaScript framework folders
  '.next',
  '.nuxt',
  'out',
  '.svelte-kit',
  '.angular',
  
  // Build and cache directories
  '.cache',
  '.parcel-cache',
  '.webpack',
  '.turbo',
  '.vite',
  'temp',
  'tmp',
  'cache',
  '.phpunit.cache',
  '.php-cs-fixer.cache',
  
  // Test folders
  '.nyc_output',
  'cypress/videos',
  'cypress/screenshots',
  '.cypress-cache',
  
  // Dependencies and builds
  'public/build',
  'public/hot',
  'public/css',
  'public/js',
  'public/mix-manifest.json'
];

const skipContentExtensions = [
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

function shouldSkipTraversal(filepath) {
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  return skipTraversalFolders.some(pattern => {
    const regexPattern = pattern.includes('/') 
      ? pattern.replace(/\//g, '[/\\\\]') 
      : `(^|[/\\\\])${pattern}($|[/\\\\])`; 
    
    return new RegExp(regexPattern).test(normalizedPath);
  });
}

function shouldSkipContent(filepath) {
  const basename = path.basename(filepath);
  const extension = path.extname(filepath).toLowerCase().replace('.', '');
  
  return skipContentFiles.includes(basename) || 
         skipContentExtensions.includes(extension) || 
         isBinaryFile(filepath);
}

module.exports = { 
  shouldSkipTraversal, 
  shouldSkipContent,
  skipContentFiles,
  skipTraversalFolders,
  skipContentExtensions
};