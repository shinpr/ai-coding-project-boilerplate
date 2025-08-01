#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = ['ja', 'en'];
const CONFIG_FILE = '.claudelang';

// Language configuration file path definitions
const LANGUAGE_PATHS = {
  claude: {
    source: (lang) => `CLAUDE.${lang}.md`,
    target: 'CLAUDE.md'
  },
  rules: {
    source: (lang) => `docs/rules-${lang}`,
    target: 'docs/rules'
  },
  guides: {
    source: (lang) => `docs/guides/${lang}`,
    target: 'docs/guides/sub-agents.md',
    sourceFile: (lang) => `docs/guides/${lang}/sub-agents.md`
  },
  commands: {
    source: (lang) => `.claude/commands-${lang}`,
    target: '.claude/commands'
  },
  agents: {
    source: (lang) => `.claude/agents-${lang}`,
    target: '.claude/agents'
  }
};

/**
 * Load configuration file
 */
function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // Default configuration if config file doesn't exist
    return {
      current: 'ja',
      method: 'copy',
      lastUpdated: null
    };
  }
}

/**
 * Save configuration file
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Recursively copy directory
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  // Create target directory
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  return true;
}

/**
 * Remove directory
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Copy file
 */
function copyFile(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  // Create target directory
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(source, target);
  return true;
}

/**
 * Detect current language
 */
function detectCurrentLanguage() {
  const config = loadConfig();
  return config.current;
}

/**
 * Switch language
 */
function switchLanguage(targetLang) {
  if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
    console.error(`❌ Unsupported language: ${targetLang}`);
    console.error(`   Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
    process.exit(1);
  }

  console.log(`🌐 Switching language to ${targetLang}...`);

  let hasErrors = false;

  // 1. Switch CLAUDE.md
  const claudeSource = LANGUAGE_PATHS.claude.source(targetLang);
  const claudeTarget = LANGUAGE_PATHS.claude.target;
  
  if (fs.existsSync(claudeSource)) {
    if (fs.existsSync(claudeTarget)) {
      fs.unlinkSync(claudeTarget);
    }
    copyFile(claudeSource, claudeTarget);
    console.log(`✅ Updated ${claudeTarget}`);
  } else {
    console.warn(`⚠️  ${claudeSource} does not exist`);
    hasErrors = true;
  }

  // 2. Switch docs/rules
  const rulesSource = LANGUAGE_PATHS.rules.source(targetLang);
  const rulesTarget = LANGUAGE_PATHS.rules.target;
  
  if (fs.existsSync(rulesSource)) {
    removeDirectory(rulesTarget);
    copyDirectory(rulesSource, rulesTarget);
    console.log(`✅ Updated ${rulesTarget}`);
  } else {
    console.warn(`⚠️  ${rulesSource} does not exist`);
    hasErrors = true;
  }


  // 3. Switch docs/guides/sub-agents.md
  const guideSource = LANGUAGE_PATHS.guides.sourceFile(targetLang);
  const guideTarget = LANGUAGE_PATHS.guides.target;
  
  if (fs.existsSync(guideSource)) {
    if (fs.existsSync(guideTarget)) {
      fs.unlinkSync(guideTarget);
    }
    copyFile(guideSource, guideTarget);
    console.log(`✅ Updated ${guideTarget}`);
  } else {
    console.warn(`⚠️  ${guideSource} does not exist`);
  }

  // 4. Switch .claude/commands (only if exists)
  const commandsSource = LANGUAGE_PATHS.commands.source(targetLang);
  const commandsTarget = LANGUAGE_PATHS.commands.target;
  
  if (fs.existsSync(commandsSource)) {
    removeDirectory(commandsTarget);
    copyDirectory(commandsSource, commandsTarget);
    console.log(`✅ Updated ${commandsTarget}`);
  }

  // 5. Switch .claude/agents (only if exists)
  const agentsSource = LANGUAGE_PATHS.agents.source(targetLang);
  const agentsTarget = LANGUAGE_PATHS.agents.target;
  
  if (fs.existsSync(agentsSource)) {
    removeDirectory(agentsTarget);
    copyDirectory(agentsSource, agentsTarget);
    console.log(`✅ Updated ${agentsTarget}`);
  }

  // Save configuration
  const config = {
    current: targetLang,
    method: 'copy',
    lastUpdated: new Date().toISOString()
  };
  saveConfig(config);

  if (hasErrors) {
    console.log(`⚠️  Language switched to ${targetLang}, but some files are missing`);
  } else {
    console.log(`🎉 Successfully switched language to ${targetLang}`);
  }
}

/**
 * Show current status
 */
function showStatus() {
  const config = loadConfig();
  
  console.log('📊 Multi-language configuration status:');
  console.log(`   Current language: ${config.current}`);
  console.log(`   Switch method: ${config.method}`);
  console.log(`   Last updated: ${config.lastUpdated || 'Not set'}`);
  console.log();
  
  console.log('📁 File existence check:');
  for (const lang of SUPPORTED_LANGUAGES) {
    console.log(`\n  ${lang.toUpperCase()} language files:`);
    
    // CLAUDE.md
    const claudeFile = LANGUAGE_PATHS.claude.source(lang);
    console.log(`    ${claudeFile}: ${fs.existsSync(claudeFile) ? '✅' : '❌'}`);
    
    // docs/rules
    const rulesDir = LANGUAGE_PATHS.rules.source(lang);
    console.log(`    ${rulesDir}: ${fs.existsSync(rulesDir) ? '✅' : '❌'}`);
    
    // docs/guides
    const guideFile = LANGUAGE_PATHS.guides.sourceFile(lang);
    console.log(`    ${guideFile}: ${fs.existsSync(guideFile) ? '✅' : '❌'}`);
    
  }
  
  console.log('\n📝 Currently active files:');
  console.log(`   CLAUDE.md: ${fs.existsSync('CLAUDE.md') ? '✅' : '❌'}`);
  console.log(`   docs/rules: ${fs.existsSync('docs/rules') ? '✅' : '❌'}`);
  console.log(`   docs/guides/sub-agents.md: ${fs.existsSync('docs/guides/sub-agents.md') ? '✅' : '❌'}`);
}

/**
 * Show help
 */
function showHelp() {
  console.log('🌐 Multi-language script');
  console.log();
  console.log('Usage:');
  console.log('  node scripts/set-language.js <language>');
  console.log('  node scripts/set-language.js --status');
  console.log('  node scripts/set-language.js --help');
  console.log();
  console.log('Available languages:');
  console.log(`  ${SUPPORTED_LANGUAGES.join(', ')}`);
  console.log();
  console.log('Examples:');
  console.log('  node scripts/set-language.js ja    # Switch to Japanese');
  console.log('  node scripts/set-language.js en    # Switch to English');
  console.log('  node scripts/set-language.js --status  # Check current status');
}

// Main processing
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case '--status':
      showStatus();
      break;
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      if (SUPPORTED_LANGUAGES.includes(command)) {
        switchLanguage(command);
      } else {
        console.error(`❌ Unknown command or language: ${command}`);
        showHelp();
        process.exit(1);
      }
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  switchLanguage,
  detectCurrentLanguage,
  showStatus,
  SUPPORTED_LANGUAGES
};