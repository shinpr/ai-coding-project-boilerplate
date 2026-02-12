#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);

// Route to update subcommand
if (args[0] === 'update') {
  const updateScript = path.join(__dirname, '..', 'scripts', 'update-project.js');
  const updateArgs = args.slice(1);
  const updateProcess = spawn('node', [updateScript, ...updateArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  updateProcess.on('close', (code) => {
    process.exit(code || 0);
  });

  updateProcess.on('error', (err) => {
    console.error(`\n❌ Failed to execute update script: ${err.message}`);
    process.exit(1);
  });

  return;
}

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
🚀 AI Coding Project Boilerplate

Usage:
  npx create-ai-project <project-name> [options]
  npx create-ai-project update [options]
  npm init ai-project <project-name> [options]

Commands:
  update             Update agent definitions in an existing project

Options:
  --lang=<language>  Set the project language (ja or en, default: en)
  --help, -h         Show this help message

Update Options:
  --dry-run          Preview changes without applying
  --ignore <path>    Add a path to the ignore list
  --unignore <path>  Remove a path from the ignore list

Examples:
  npx create-ai-project my-project
  npx create-ai-project my-project --lang=ja
  npx create-ai-project update
  npx create-ai-project update --dry-run
  `);
  process.exit(0);
}

const projectName = args[0];
const options = args.slice(1);

// Parse language option
let language = 'en'; // default
for (const opt of options) {
  if (opt.startsWith('--lang=')) {
    language = opt.split('=')[1];
    if (!['ja', 'en'].includes(language)) {
      console.error(`❌ Invalid language: ${language}. Supported languages are: ja, en`);
      process.exit(1);
    }
  }
}

// Validate project name
const validNamePattern = /^[a-z0-9-._]+$/;
if (!validNamePattern.test(projectName)) {
  console.error(`❌ Invalid project name: ${projectName}`);
  console.error('   Project name must contain only lowercase letters, numbers, hyphens, dots, and underscores.');
  process.exit(1);
}

// Check if directory already exists
const projectPath = path.resolve(process.cwd(), projectName);
if (fs.existsSync(projectPath)) {
  console.error(`❌ Directory already exists: ${projectPath}`);
  process.exit(1);
}

console.log(`\n🎉 Creating new AI coding project: ${projectName}`);
console.log(`📍 Location: ${projectPath}`);
console.log(`🌐 Language: ${language}\n`);

// Run setup script
const setupScript = path.join(__dirname, '..', 'scripts', 'setup-project.js');
const setupProcess = spawn('node', [setupScript, projectName, language], {
  stdio: 'inherit',
  cwd: process.cwd()  // 現在の作業ディレクトリを使用
});

setupProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Setup failed with exit code ${code}`);
    process.exit(code);
  }
  
  console.log(`\n✅ Project created successfully!`);
  console.log(`\n📖 Next steps:`);
  console.log(`   cd ${projectName}`);
  console.log(`   npm install`);
  console.log(`   npm run dev\n`);
});

setupProcess.on('error', (err) => {
  console.error(`\n❌ Failed to execute setup script: ${err.message}`);
  process.exit(1);
});