const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { shouldSkipTraversal, shouldSkipContent } = require('./ignore');

program
  .argument('<folderPath>', 'Path to the target folder')
  .argument('[outputName]', 'Output file name (optional)')
  .parse();

const [folderPath] = program.args;

let totalFiles = 0;
let totalSize = 0;
let fileTypes = {};
let technologies = new Set();

async function generateTree(dir, prefix = '') {
  let result = '';
  const items = await fs.readdir(dir);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);
    
    if (shouldSkipTraversal(itemPath)) continue;
    
    const isLast = i === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = isLast ? '    ' : '│   ';
    
    result += prefix + connector + item + '\n';
    
    if (stats.isDirectory()) {
      result += await generateTree(itemPath, prefix + newPrefix);
    }
  }
  return result;
}

async function getAllFiles(dir) {
  const fileList = [];
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (shouldSkipTraversal(fullPath)) continue;
    
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      fileList.push(...subFiles);
    } else {
      // Track all files in stats, regardless of content inclusion
      const ext = path.extname(fullPath).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      
      if (['.ts', '.tsx'].includes(ext)) technologies.add('TypeScript');
      if (['.jsx', '.tsx'].includes(ext)) technologies.add('React');
      if (ext === '.vue') technologies.add('Vue.js');
      if (ext === '.py') technologies.add('Python');
      
      totalFiles++;
      totalSize += stats.size;
    
      if (!shouldSkipContent(fullPath)) {
        fileList.push({
          path: fullPath,
          size: stats.size,
          extension: ext
        });
      }
    }
  }
  return fileList;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  try {
    console.log('Starting to process directory:', folderPath);
    
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error('Provided path is not a directory');
    }

    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const folderName = path.basename(folderPath);
    const outputFileName = program.args[1] || `${folderName}_${dateStr}_${timestamp}.txt`;
    
    console.log('Generating tree structure...');
    const treeStructure = await generateTree(folderPath);
    
    console.log('Collecting files...');
    const files = await getAllFiles(folderPath);
    console.log(`Found ${files.length} files`);
    
    let output = 'Project Overview\n===============\n\n';
    output += `Project Statistics:\n`;
    output += `Total Files: ${totalFiles}\n`;
    output += `Total Size: ${formatSize(totalSize)}\n\n`;
    
    output += `File Types:\n`;
    Object.entries(fileTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, count]) => {
        output += `  ${ext || 'no extension'}: ${count} files\n`;
      });
    
    output += `\nDetected Technologies:\n`;
    Array.from(technologies).sort().forEach(tech => {
      output += `  - ${tech}\n`;
    });
    
    output += '\nFolder Structure (Tree)\n=====================\n\n';
    output += treeStructure;
    output += '\n==============\n';
    
    console.log('Processing individual files...');
    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const relPath = path.relative(folderPath, file.path);
        
        output += `\nFile Name: ${relPath}\n`;
        output += `Size: ${formatSize(file.size)}\n`;
        output += 'Code:\n';
        output += content;
        output += '\n-------- [ Separator ] ------\n';
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error.message);
      }
    }
    
    console.log('Writing output file...');
    await fs.writeFile(outputFileName, output);
    console.log(`Output written to ${outputFileName}`);
    console.log(`Total files processed: ${files.length}`);
    console.log(`Total size: ${formatSize(totalSize)}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();