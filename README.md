# folder2text

Convert entire project directories into a single, well-organized text file. Perfect for documentation, AI context sharing, and project analysis.

## Overview

`folder2text` is a command-line utility that transforms your project directory into a comprehensive text document. It generates a complete overview including project statistics, file types, detected technologies, and a full directory tree structure, along with the contents of all text-based files.

## Features

- 📊 **Project Statistics**: Total file count and size analysis  
- 🌳 **Directory Tree**: Visual representation of your project structure  
- 🔍 **Technology Detection**: Automatic identification of frameworks and languages  
- 📝 **Content Extraction**: Intelligent handling of text-based files  
- 🚫 **Smart Filtering**: Automatic skipping of:  
  - Binary files  
  - Configuration files (`package-lock.json`, `.env`, etc.)  
  - Common directories (`node_modules`, `.git`, etc.)  
  - Media files (images, videos, etc.)

## Installation

### NPM (Node.js)

```bash
npm install -g folder2text
```

## Usage

The output file will contain:

- Project overview with statistics  
- List of file types and their counts  
- Detected technologies  
- Complete directory tree structure  
- Contents of all text-based files  

### Example output structure:

```bash
folder2text /path/to/folder
```

The output will look like:

```text
Project Overview
===============

Project Statistics:
Total Files: 42
Total Size: 1.25 MB

File Types:
  .js: 15 files
  .json: 3 files
  .md: 2 files
  ...

Detected Technologies:
  - TypeScript
  - React
  ...

Folder Structure (Tree)
=====================
├── src
│   ├── components
│   └── utils
```

## Use Cases

- 📚 Creating comprehensive project documentation  
- 🤖 Sharing project context with AI/LLM systems  
- 📊 Project analysis and auditing  
- 👥 Code review and collaboration  
- 📦 Project archival and documentation  

## License

This project is licensed under **MIT with Commons Clause**, which means:

- ✅ Free for personal and open-source use  
- ✅ Can be forked and modified  
- ✅ Can be used as a reference for other open-source projects  
- ❌ Cannot be used for commercial purposes without permission  

## About the Author

Hi! I'm **Nidal Siddique Oritro**, a developer passionate about creating tools that make developers' lives easier. I enjoy building utilities that bridge the gap between traditional development workflows and modern AI-powered development.  

Learn more about me and my projects at [iam.ioritro.com](https://iam.ioritro.com).

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

## Support

If you encounter any issues or have questions:

- Check the [Issues page](https://github.com/oritromax/folder2text/issues)  
- Open a new issue if needed  
- Join the discussion  

