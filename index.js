const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const ignore = require('ignore');
const os = require('os');
const { shouldSkipTraversal, shouldSkipContent } = require('./ignore');

program
  .argument('<folderPath>', 'Path to the target folder')
  .argument('[outputName]', 'Output file name (optional)')
  .option('-f, --filter <patterns>', 'Additional patterns to filter (separated by commas)')
  .option('--filter-soft <patterns>', 'Soft filter patterns (comma separated)')

  .option('-g, --gitignore', 'Respect .gitignore files in each folder (like Git)')
  .option('--gitignore-soft', 'Soft respect .gitignore files in each folder')

  .option('--gitignore-specific <file>', 'Use a specific .gitignore file only (hard)')
  .option('--gitignore-specific-soft <file>', 'Use a specific .gitignore file only (soft)')

  .option('--gitignore-global', 'Use global gitignore from ~/.gitignore_global (hard)')
  .option('--gitignore-global-soft', 'Use global gitignore from ~/.gitignore_global (soft)')

  .parse();

const [folderPath] = program.args;
const options = program.opts();

function splitPatterns(input) {
  return input ? input.split(',').map(p => p.trim()) : [];
}

const hardFilters = splitPatterns(options.filter);
const softFilters = splitPatterns(options.filterSoft);

let totalFiles = 0;
let totalSize = 0;
let fileTypes = {};
let technologies = new Set();

// ---------------- Helpers ----------------

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function loadIgnoreFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const ig = ignore();
    ig.add(content.split(/\r?\n/));
    return ig;
  } catch {
    return null;
  }
}

async function buildIgnoreSets() {
  const hard = [];
  const soft = [];

  // Global
  if (options.gitignoreGlobal) {
    const ig = await loadIgnoreFile(path.join(os.homedir(), '.gitignore_global'));
    if (ig) hard.push({ dir: folderPath, ig });
  }
  if (options.gitignoreGlobalSoft) {
    const ig = await loadIgnoreFile(path.join(os.homedir(), '.gitignore_global'));
    if (ig) soft.push({ dir: folderPath, ig });
  }

  // Specific
  if (options.gitignoreSpecific) {
    const ig = await loadIgnoreFile(path.resolve(options.gitignoreSpecific));
    if (ig) hard.push({ dir: folderPath, ig });
  }
  if (options.gitignoreSpecificSoft) {
    const ig = await loadIgnoreFile(path.resolve(options.gitignoreSpecificSoft));
    if (ig) soft.push({ dir: folderPath, ig });
  }

  return { hard, soft };
}

// ---------------- Ignore evaluation ----------------

function isIgnored(filepath, stack) {
  for (const { dir, ig } of stack) {
    const relPath = path.relative(dir, filepath).replace(/\\/g, '/');
    if (relPath && ig.ignores(relPath)) return true;
  }
  return false;
}

function matchPatterns(filepath, patterns) {
  const normalizedPath = filepath.replace(/\\/g, '/');
  return patterns.some(pattern => {
    const regexPattern = pattern.includes('/')
      ? pattern.replace(/\//g, '[/\\\\]')
      : `(^|[/\\\\])${pattern}($|[/\\\\])`;
    return new RegExp(regexPattern).test(normalizedPath);
  });
}

function classifyFile(filepath, hardStack, softStack) {
  // Hard filters
  if (originalSkipTraversal(filepath)) return 'hard';
  if (matchPatterns(filepath, hardFilters)) return 'hard';
  if (isIgnored(filepath, hardStack)) return 'hard';

  // Soft filters
  if (matchPatterns(filepath, softFilters)) return 'soft';
  if (isIgnored(filepath, softStack)) return 'soft';

  return 'include';
}

const originalSkipTraversal = shouldSkipTraversal;

async function generateTree(dir, prefix = '', includedFiles = new Set(), parentHard = [], parentSoft = []) {
  let result = '';
  const items = await fs.readdir(dir);

  // Per-directory gitignore (hard/soft)
  const newHard = [...parentHard];
  const newSoft = [...parentSoft];
  if (options.gitignore) {
    const ig = await loadIgnoreFile(path.join(dir, '.gitignore'));
    if (ig) newHard.push({ dir, ig });
  }
  if (options.gitignoreSoft) {
    const ig = await loadIgnoreFile(path.join(dir, '.gitignore'));
    if (ig) newSoft.push({ dir, ig });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);

    const classification = classifyFile(itemPath, newHard, newSoft);
    if (classification === 'hard') continue;

    const isLast = i === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = isLast ? '    ' : '│   ';

    if (stats.isFile()) {
      const size = formatSize(stats.size);
      const indicator = classification === 'soft' ? ' ✗' : ' ✓';
      result += `${prefix}${connector}${item} (${size})${indicator}\n`;
    } else {
      result += `${prefix}${connector}${item}/\n`;
      result += await generateTree(itemPath, prefix + newPrefix, includedFiles, newHard, newSoft);
    }
  }
  return result;
}

async function getAllFiles(dir, parentHard = [], parentSoft = []) {
  const fileList = [];
  const items = await fs.readdir(dir);

  // Per-directory gitignore (hard/soft)
  const newHard = [...parentHard];
  const newSoft = [...parentSoft];
  if (options.gitignore) {
    const ig = await loadIgnoreFile(path.join(dir, '.gitignore'));
    if (ig) newHard.push({ dir, ig });
  }
  if (options.gitignoreSoft) {
    const ig = await loadIgnoreFile(path.join(dir, '.gitignore'));
    if (ig) newSoft.push({ dir, ig });
  }

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await fs.stat(fullPath);

    const classification = classifyFile(fullPath, newHard, newSoft);
    if (classification === 'hard') continue;

    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, newHard, newSoft);
      fileList.push(...subFiles);
    } else {
      // Track all files
      const ext = path.extname(fullPath).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      if (['.ts', '.tsx'].includes(ext)) technologies.add('TypeScript');
      if (['.jsx', '.tsx'].includes(ext)) technologies.add('React');
      if (ext === '.vue') technologies.add('Vue.js');
      if (ext === '.py') technologies.add('Python');

      totalFiles++;
      totalSize += stats.size;

      if (classification === 'include' && !shouldSkipContent(fullPath)) {
        fileList.push({ path: fullPath, size: stats.size, extension: ext });
      }
    }
  }
  return fileList;
}

// ---------------- Main ----------------
async function main() {
  try {
    console.log('Starting to process directory:', folderPath);

    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) throw new Error('Provided path is not a directory');

    // Build global/specific stacks
    const { hard, soft } = await buildIgnoreSets();

    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date
      .getDate()
      .toString()
      .padStart(2, '0')}${date.getFullYear()}`;
    const timestamp = Math.floor(date.getTime() / 1000);
    const folderName = path.basename(folderPath);
    const outputFileName = program.args[1] || `${folderName}_${dateStr}_${timestamp}.txt`;

    console.log('Collecting files...');
    const files = await getAllFiles(folderPath, hard, soft);
    const includedFiles = new Set(files.map(f => f.path));

    console.log('Generating tree structure...');
    const treeStructure = await generateTree(folderPath, '', includedFiles, hard, soft);

    console.log(`Found ${files.length} files`);

    let output = 'Project Overview\n===============\n\n';
    output += `Project Statistics:\nTotal Files: ${totalFiles}\nTotal Size: ${formatSize(totalSize)}\n\n`;

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

    output += '\nFolder Structure (Tree)\n=====================\n';
    output += 'Legend: ✓ = Included in output, ✗ = Excluded from output\n\n';
    output += treeStructure;
    output += '\n==============\n';

    console.log('Processing individual files...');
    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const relPath = path.relative(folderPath, file.path);
        output += `\nFile Name: ${relPath}\nSize: ${formatSize(file.size)}\nCode:\n${content}\n-------- [ Separator ] ------\n`;
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
