#!/usr/bin/env node

import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { copyDirectory, copyFile, removeDirectory } from './utils.js'

const SUPPORTED_LANGUAGES = ['ja', 'en']
const CONFIG_FILE = '.claudelang'

// Language configuration file path definitions
const LANGUAGE_PATHS = {
  claude: {
    source: (lang) => `CLAUDE.${lang}.md`,
    target: 'CLAUDE.md',
  },
  commands: {
    source: (lang) => `.claude/commands-${lang}`,
    target: '.claude/commands',
  },
  agents: {
    source: (lang) => `.claude/agents-${lang}`,
    target: '.claude/agents',
  },
  skills: {
    source: (lang) => `.claude/skills-${lang}`,
    target: '.claude/skills',
  },
}

/**
 * Load configuration file
 */
function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8')
    return JSON.parse(content)
  } catch (_error) {
    // Default configuration if config file doesn't exist
    return {
      current: 'ja',
      method: 'copy',
      lastUpdated: null,
    }
  }
}

/**
 * Save configuration file
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

/**
 * Detect current language
 */
function detectCurrentLanguage() {
  const config = loadConfig()
  return config.current
}

/**
 * Switch language
 */
function switchLanguage(targetLang) {
  if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
    console.error(`❌ Unsupported language: ${targetLang}`)
    console.error(`   Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`)
    process.exit(1)
  }

  console.log(`🌐 Switching language to ${targetLang}...`)

  let hasErrors = false

  // 1. Switch CLAUDE.md
  const claudeSource = LANGUAGE_PATHS.claude.source(targetLang)
  const claudeTarget = LANGUAGE_PATHS.claude.target

  if (fs.existsSync(claudeSource)) {
    if (fs.existsSync(claudeTarget)) {
      fs.unlinkSync(claudeTarget)
    }
    copyFile(claudeSource, claudeTarget)
    console.log(`✅ Updated ${claudeTarget}`)
  } else {
    console.warn(`⚠️  ${claudeSource} does not exist`)
    hasErrors = true
  }

  // 2. Switch .claude/commands (only if exists)
  const commandsSource = LANGUAGE_PATHS.commands.source(targetLang)
  const commandsTarget = LANGUAGE_PATHS.commands.target

  if (fs.existsSync(commandsSource)) {
    removeDirectory(commandsTarget)
    copyDirectory(commandsSource, commandsTarget)
    console.log(`✅ Updated ${commandsTarget}`)
  }

  // 3. Switch .claude/agents (only if exists)
  const agentsSource = LANGUAGE_PATHS.agents.source(targetLang)
  const agentsTarget = LANGUAGE_PATHS.agents.target

  if (fs.existsSync(agentsSource)) {
    removeDirectory(agentsTarget)
    copyDirectory(agentsSource, agentsTarget)
    console.log(`✅ Updated ${agentsTarget}`)
  }

  // 4. Switch .claude/skills (only if exists)
  const skillsSource = LANGUAGE_PATHS.skills.source(targetLang)
  const skillsTarget = LANGUAGE_PATHS.skills.target

  if (fs.existsSync(skillsSource)) {
    removeDirectory(skillsTarget)
    copyDirectory(skillsSource, skillsTarget)
    console.log(`✅ Updated ${skillsTarget}`)
  }

  // Save configuration
  const config = {
    current: targetLang,
    method: 'copy',
    lastUpdated: new Date().toISOString(),
  }
  saveConfig(config)

  if (hasErrors) {
    console.log(`⚠️  Language switched to ${targetLang}, but some files are missing`)
  } else {
    console.log(`🎉 Successfully switched language to ${targetLang}`)
  }
}

/**
 * Show current status
 */
function showStatus() {
  const config = loadConfig()

  console.log('📊 Multi-language configuration status:')
  console.log(`   Current language: ${config.current}`)
  console.log(`   Switch method: ${config.method}`)
  console.log(`   Last updated: ${config.lastUpdated || 'Not set'}`)
  console.log()

  console.log('📁 File existence check:')
  for (const lang of SUPPORTED_LANGUAGES) {
    console.log(`\n  ${lang.toUpperCase()} language files:`)

    // CLAUDE.md
    const claudeFile = LANGUAGE_PATHS.claude.source(lang)
    console.log(`    ${claudeFile}: ${fs.existsSync(claudeFile) ? '✅' : '❌'}`)

    // .claude/commands
    const commandsDir = LANGUAGE_PATHS.commands.source(lang)
    console.log(`    ${commandsDir}: ${fs.existsSync(commandsDir) ? '✅' : '❌'}`)

    // .claude/agents
    const agentsDir = LANGUAGE_PATHS.agents.source(lang)
    console.log(`    ${agentsDir}: ${fs.existsSync(agentsDir) ? '✅' : '❌'}`)

    // .claude/skills
    const skillsDir = LANGUAGE_PATHS.skills.source(lang)
    console.log(`    ${skillsDir}: ${fs.existsSync(skillsDir) ? '✅' : '❌'}`)
  }

  console.log('\n📝 Currently active files:')
  console.log(`   CLAUDE.md: ${fs.existsSync('CLAUDE.md') ? '✅' : '❌'}`)
  console.log(`   .claude/commands: ${fs.existsSync('.claude/commands') ? '✅' : '❌'}`)
  console.log(`   .claude/agents: ${fs.existsSync('.claude/agents') ? '✅' : '❌'}`)
  console.log(`   .claude/skills: ${fs.existsSync('.claude/skills') ? '✅' : '❌'}`)
}

/**
 * Show help
 */
function showHelp() {
  console.log('🌐 Multi-language script')
  console.log()
  console.log('Usage:')
  console.log('  node scripts/set-language.js <language>')
  console.log('  node scripts/set-language.js --status')
  console.log('  node scripts/set-language.js --help')
  console.log()
  console.log('Available languages:')
  console.log(`  ${SUPPORTED_LANGUAGES.join(', ')}`)
  console.log()
  console.log('Examples:')
  console.log('  node scripts/set-language.js ja    # Switch to Japanese')
  console.log('  node scripts/set-language.js en    # Switch to English')
  console.log('  node scripts/set-language.js --status  # Check current status')
}

// Main processing
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    showHelp()
    return
  }

  const command = args[0]

  switch (command) {
    case '--status':
      showStatus()
      break
    case '--help':
    case '-h':
      showHelp()
      break
    default:
      if (SUPPORTED_LANGUAGES.includes(command)) {
        switchLanguage(command)
      } else {
        console.error(`❌ Unknown command or language: ${command}`)
        showHelp()
        process.exit(1)
      }
      break
  }
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

export { switchLanguage, detectCurrentLanguage, showStatus, SUPPORTED_LANGUAGES }
