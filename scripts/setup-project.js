#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get command line arguments
const projectName = process.argv[2];
const language = process.argv[3] || 'en';

if (!projectName) {
  console.error('❌ Project name is required');
  process.exit(1);
}

const sourceRoot = path.join(__dirname, '..');
const targetRoot = path.resolve(process.cwd(), projectName);

// Files and directories to exclude from copying
const excludeList = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vitest-cache',
  'tmp',
  '.claudelang',
  'CLAUDE.md',
  'docs/rules',
  'docs/guides/sub-agents.md',
  '.claude/commands',
  '.claude/agents',
  '.claude/skills',
  'bin', // Exclude bin directory for production use
  'templates' // Exclude templates directory for production use
];

// Files to process with template replacements
const templateFiles = [
  'package.json',
  'README.md',
  'README.ja.md'
];

/**
 * Recursively copy directory with exclusions
 */
function copyDirectory(source, target, projectName, rootSource = source) {
  if (!fs.existsSync(source)) {
    return;
  }

  // Create target directory
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    const relativePath = path.relative(rootSource, sourcePath);

    // Check if should exclude
    const shouldExclude = excludeList.some(exclude => {
      const excludePath = path.normalize(exclude);
      const relativeNormalized = path.normalize(relativePath);
      return relativeNormalized === excludePath || relativeNormalized.startsWith(excludePath + path.sep);
    });

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, projectName, rootSource);
    } else {
      // Check if it's a template file that needs processing
      if (templateFiles.includes(entry.name)) {
        processTemplateFile(sourcePath, targetPath, projectName);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

/**
 * Process template files with replacements
 */
function processTemplateFile(source, target, projectName) {
  let content = fs.readFileSync(source, 'utf8');

  // Replace placeholders based on file
  const fileName = path.basename(source);
  
  if (fileName === 'package.json') {
    const packageJson = JSON.parse(content);
    packageJson.name = projectName;
    packageJson.version = '0.1.0';
    packageJson.description = `${projectName} - AI-powered TypeScript project`;
    
    // Remove bin field for user projects
    delete packageJson.bin;
    
    // Remove scripts related to package maintenance
    delete packageJson.scripts['lang:status'];
    delete packageJson.scripts.postinstall;
    
    content = JSON.stringify(packageJson, null, 2);
  } else if (fileName === 'README.md' || fileName === 'README.ja.md') {
    // Replace project name in README
    content = content.replace(/ai-coding-project-boilerplate/g, projectName);
    content = content.replace(/AI Coding Project Boilerplate/g, projectName);
  }

  fs.writeFileSync(target, content);
}

/**
 * Create .gitignore with language-specific exclusions
 */
function createGitignore(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const templatePath = path.join(sourceRoot, 'templates', '.gitignore.template');
  
  // Use template if exists, otherwise use current .gitignore
  const sourcePath = fs.existsSync(templatePath) ? templatePath : path.join(sourceRoot, '.gitignore');
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  // Add language-specific exclusions
  const languageExclusions = `
# Language-specific files (excluded from version control)
CLAUDE.*.md
docs/rules-*/
docs/guides/ja/
docs/guides/en/
.claude/commands-*/
.claude/agents-*/
.claude/skills-*/
`;

  // Remove current language-related exclusions and add new ones
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('CLAUDE.md') &&
           !trimmed.startsWith('docs/rules/') &&
           !trimmed.startsWith('docs/guides/sub-agents.md') &&
           !trimmed.startsWith('.claude/commands/') &&
           !trimmed.startsWith('.claude/agents/') &&
           !trimmed.startsWith('.claude/skills/');
  });

  content = filteredLines.join('\n') + languageExclusions;
  fs.writeFileSync(gitignorePath, content);
}

/**
 * Main setup process
 */
async function setupProject() {
  try {
    console.log('📁 Creating project directory...');
    fs.mkdirSync(targetRoot, { recursive: true });

    console.log('📋 Copying project files...');
    copyDirectory(sourceRoot, targetRoot, projectName);

    console.log('🔧 Setting up language configuration...');
    // Change to project directory and run language setup
    process.chdir(targetRoot);

    // Run language setup
    execSync(`node scripts/set-language.js ${language}`, { stdio: 'inherit' });

    console.log('📝 Creating .gitignore with language-specific exclusions...');
    createGitignore(targetRoot);

    console.log('🔧 Running post-setup tasks...');
    const postSetupScript = path.join(sourceRoot, 'scripts', 'post-setup.js');
    if (fs.existsSync(postSetupScript)) {
      execSync(`node ${postSetupScript}`, { stdio: 'inherit', cwd: targetRoot });
    }

    console.log('✅ Project setup completed!');
  } catch (error) {
    console.error(`❌ Setup failed: ${error.message}`);
    
    // Cleanup on failure
    if (fs.existsSync(targetRoot)) {
      console.log('🧹 Cleaning up...');
      fs.rmSync(targetRoot, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

// Run setup
setupProject();