const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { shouldIgnore } = require('./ignore');

program
  .argument('<folderPath>', 'Path to the target folder')
  .argument('[outputName]', 'Output file name (optional)')
  .parse();

const [folderPath] = program.args;

async function generateTree(dir, prefix = '') {
  let result = '';
  const items = await fs.readdir(dir);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);
    
    if (shouldIgnore(itemPath)) continue;
    
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

async function getAllFiles(dir, fileList = []) {
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (shouldIgnore(fullPath)) continue;
    
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function main() {
  try {
    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const folderName = path.basename(folderPath);
    const outputFileName = program.args[1] || `${folderName}_${dateStr}_${timestamp}.txt`;
    
    let output = 'Folder Structure (Tree)\n\n';
    output += await generateTree(folderPath);
    output += '\n==============\n';
    
    const files = await getAllFiles(folderPath);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      output += `\nFile Name: ${path.relative(folderPath, file)}\nCode:\n${content}\n`;
      output += '-------- [ Separator ] ------\n';
    }
    
    await fs.writeFile(outputFileName, output);
    console.log(`Output written to ${outputFileName}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();