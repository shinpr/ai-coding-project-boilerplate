#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Initialize git repository
 */
function initGit() {
  try {
    console.log('🔧 Initializing git repository...');
    execSync('git init', { stdio: 'inherit' });
    
    console.log('📝 Creating initial commit...');
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit from AI Coding Project Boilerplate"', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.warn('⚠️  Git initialization skipped (git might not be installed)');
    return false;
  }
}

/**
 * Clean up files that shouldn't be in the user's project
 */
function cleanupFiles() {
  console.log('🧹 Cleaning up setup files...');
  
  const filesToRemove = [
    'bin/create-project.js',
    'templates/.gitignore.template',
    'scripts/setup-project.js',
    'scripts/post-setup.js'
  ];
  
  const dirsToRemove = [
    'bin',
    'templates'
  ];
  
  // Remove files
  for (const file of filesToRemove) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  // Remove empty directories
  for (const dir of dirsToRemove) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmdirSync(dirPath);
      } catch (e) {
        // Directory might not be empty, ignore
      }
    }
  }
}

/**
 * Show next steps to the user
 */
function showNextSteps() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const projectName = packageJson.name;
  
  console.log('\n🎉 Project setup completed successfully!\n');
  console.log('📋 Next steps:\n');
  console.log(`   cd ${projectName}`);
  console.log('   npm install');
  console.log('   npm run dev\n');
  console.log('🌐 Language switching:\n');
  console.log('   npm run lang:ja   # Switch to Japanese');
  console.log('   npm run lang:en   # Switch to English\n');
  console.log('📖 Available commands:\n');
  console.log('   npm run dev         # Start development');
  console.log('   npm run build       # Build for production');
  console.log('   npm run test        # Run tests');
  console.log('   npm run check:all   # Run all quality checks\n');
  console.log('Happy coding! 🚀\n');
}

/**
 * Main post-setup process
 */
function main() {
  try {
    // Initialize git repository
    initGit();
    
    // Clean up setup-specific files
    cleanupFiles();
    
    // Show next steps
    showNextSteps();
  } catch (error) {
    console.error(`❌ Post-setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run post-setup
if (require.main === module) {
  main();
}