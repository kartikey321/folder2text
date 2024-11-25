// ignore.js
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
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'tiff',
    'webp',
    'svg',
    'ico',
    'psd',
    'ai',
    'eps',
    'raw',
    'xcf'  // GIMP files
  ];
  
  function shouldIgnore(path) {
    const basename = path.split('/').pop();
    return basename.startsWith('.') || 
           defaultIgnoreList.includes(basename) || 
           defaultIgnoreList.includes(basename.split('.').pop().toLowerCase());
  }
  
  module.exports = { defaultIgnoreList, shouldIgnore };