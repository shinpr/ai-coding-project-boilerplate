#!/usr/bin/env node

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { copyDirectory, copyFile, removeDirectory } from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MANIFEST_FILE = '.create-ai-project.json'
const CLAUDELANG_FILE = '.claudelang'
const SUPPORTED_LANGUAGES = ['ja', 'en', 'zh-CN']
const NEW_LANGUAGE = 'zh-CN'

// Unmodified set-language.js templates distributed before zh-CN support.
// Unknown variants are treated as user-owned and preserved.
const LEGACY_LANGUAGE_SCRIPT_HASHES = new Set([
  '01c8417d8129ce387dea2d284d2895aa5ce514dfe8597798de648c903ddc7f72',
  '8016f97ff61bdd4fc84f34c92b6f8d6690daee033ade614a61163d64ca741d3b',
  '746957f432ff6aac7b14f79b5b1bc9310c716d1a293fb6b8be69ed66543ea8be',
])

// Categories that can be ignored
const VALID_CATEGORIES = ['agents', 'commands', 'skills']

// Directories and files managed by the boilerplate
const MANAGED_DIRS = [
  (lang) => `.claude/agents-${lang}`,
  (lang) => `.claude/commands-${lang}`,
  (lang) => `.claude/skills-${lang}`,
]

const MANAGED_FILES = [(lang) => `CLAUDE.${lang}.md`]

const LANGUAGE_SWITCH_SCRIPT = 'scripts/set-language.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPackageRoot() {
  return path.join(__dirname, '..')
}

function getPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(getPackageRoot(), 'package.json'), 'utf8'))
  return pkg.version
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ---------------------------------------------------------------------------
// Ignore identifier resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a logical ignore identifier to actual file paths for all languages.
 *
 * Examples:
 *   "agents task-executor" -> one task-executor path per supported language
 *   "skills project-context" -> one project-context path per supported language
 *   "CLAUDE.md" -> one CLAUDE.<lang>.md path per supported language
 */
function resolveIgnorePaths(category, name) {
  if (category === 'CLAUDE.md') {
    return SUPPORTED_LANGUAGES.map((lang) => `CLAUDE.${lang}.md`)
  }

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(
      `  Error: unknown category "${category}". Valid: ${VALID_CATEGORIES.join(', ')}, CLAUDE.md`
    )
    process.exit(1)
  }

  if (!name) {
    console.error(`  Error: --ignore ${category} requires a resource name.`)
    console.error(`  Example: --ignore ${category} my-resource`)
    process.exit(1)
  }

  return SUPPORTED_LANGUAGES.map((lang) => {
    const base = `.claude/${category}-${lang}/${name}`
    // agents and commands are .md files, skills are directories
    return category === 'skills' ? base : `${base}.md`
  })
}

/**
 * Format an ignore identifier for display and storage.
 * Stored as "category/name" (e.g., "agents/task-executor") or "CLAUDE.md".
 */
function formatIgnoreId(category, name) {
  if (category === 'CLAUDE.md') return 'CLAUDE.md'
  return `${category}/${name}`
}

/**
 * Parse a stored ignore identifier back to category and name.
 */
function parseIgnoreId(id) {
  if (id === 'CLAUDE.md') return { category: 'CLAUDE.md', name: null }
  const [category, ...rest] = id.split('/')
  return { category, name: rest.join('/') }
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function loadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE)
  if (!fs.existsSync(manifestPath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

function saveManifest(projectRoot, manifest) {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE)
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

function detectLanguage(projectRoot) {
  const langPath = path.join(projectRoot, CLAUDELANG_FILE)
  if (fs.existsSync(langPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(langPath, 'utf8'))
      if (SUPPORTED_LANGUAGES.includes(config.current)) {
        return config.current
      }
    } catch {
      // fall through to interactive prompt
    }
  }
  return null
}

async function resolveLanguage(projectRoot) {
  const detected = detectLanguage(projectRoot)
  if (detected) {
    console.log(`  Detected language from .claudelang: ${detected}`)
    return detected
  }

  const answer = await prompt(`  Select language (${SUPPORTED_LANGUAGES.join('/')}): `)
  if (!SUPPORTED_LANGUAGES.includes(answer)) {
    console.error(
      `  Error: unsupported language "${answer}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
    )
    process.exit(1)
  }
  return answer
}

// ---------------------------------------------------------------------------
// Init flow (first run without manifest)
// ---------------------------------------------------------------------------

async function initManifest(projectRoot) {
  console.log('\n  .create-ai-project.json not found. Initializing...\n')
  const language = await resolveLanguage(projectRoot)

  const manifest = {
    version: 'unknown',
    language,
    ignored: [],
    updatedAt: new Date().toISOString(),
  }

  saveManifest(projectRoot, manifest)
  console.log(`  Created ${MANIFEST_FILE} (version: unknown)\n`)
  return manifest
}

// ---------------------------------------------------------------------------
// Ignore management
// ---------------------------------------------------------------------------

function addIgnore(projectRoot, category, name) {
  const manifest = loadManifest(projectRoot)
  if (!manifest) {
    console.error(`  Error: ${MANIFEST_FILE} not found. Run "npx create-ai-project update" first.`)
    process.exit(1)
  }

  // Validate the identifier resolves to real paths
  resolveIgnorePaths(category, name)

  const id = formatIgnoreId(category, name)
  if (manifest.ignored.includes(id)) {
    console.log(`  Already ignored: ${id}`)
    return
  }
  manifest.ignored.push(id)
  saveManifest(projectRoot, manifest)
  console.log(`  Added to ignore list: ${id}`)
}

function removeIgnore(projectRoot, category, name) {
  const manifest = loadManifest(projectRoot)
  if (!manifest) {
    console.error(`  Error: ${MANIFEST_FILE} not found. Run "npx create-ai-project update" first.`)
    process.exit(1)
  }

  const id = formatIgnoreId(category, name)
  const idx = manifest.ignored.indexOf(id)
  if (idx === -1) {
    console.log(`  Not in ignore list: ${id}`)
    return
  }
  manifest.ignored.splice(idx, 1)
  saveManifest(projectRoot, manifest)
  console.log(`  Removed from ignore list: ${id}`)
}

// ---------------------------------------------------------------------------
// Resolve all ignored identifiers to actual file paths
// ---------------------------------------------------------------------------

function resolveAllIgnoredPaths(ignoredIds) {
  const paths = []
  for (const id of ignoredIds) {
    const { category, name } = parseIgnoreId(id)
    paths.push(...resolveIgnorePaths(category, name))
  }
  return paths
}

// ---------------------------------------------------------------------------
// Backup & restore ignored paths
// ---------------------------------------------------------------------------

function backupIgnored(projectRoot, ignoredPaths) {
  const backups = []
  for (const rel of ignoredPaths) {
    const abs = path.join(projectRoot, rel)
    if (!fs.existsSync(abs)) continue

    const stat = fs.statSync(abs)
    const tmpDir = path.join(projectRoot, 'tmp', '.update-backup')
    const tmpPath = path.join(tmpDir, rel)

    if (stat.isDirectory()) {
      copyDirectory(abs, tmpPath)
    } else {
      copyFile(abs, tmpPath)
    }
    backups.push({ rel, tmpPath, isDir: stat.isDirectory() })
  }
  return backups
}

function restoreIgnored(projectRoot, backups) {
  for (const { rel, tmpPath, isDir } of backups) {
    const abs = path.join(projectRoot, rel)
    if (isDir) {
      removeDirectory(abs)
      copyDirectory(tmpPath, abs)
    } else {
      copyFile(tmpPath, abs)
    }
  }

  // Clean up backup directory
  const tmpDir = path.join(projectRoot, 'tmp', '.update-backup')
  removeDirectory(tmpDir)
}

// ---------------------------------------------------------------------------
// Collect managed paths for all languages
// ---------------------------------------------------------------------------

function getManagedPaths() {
  const paths = { dirs: [], files: [] }
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const dirFn of MANAGED_DIRS) {
      paths.dirs.push(dirFn(lang))
    }
    for (const fileFn of MANAGED_FILES) {
      paths.files.push(fileFn(lang))
    }
  }
  return paths
}

function isNewLanguagePath(relativePath) {
  return (
    relativePath.endsWith(`-${NEW_LANGUAGE}`) || relativePath === `CLAUDE.${NEW_LANGUAGE}.md`
  )
}

function shouldAddNewLanguagePath(projectRoot, relativePath) {
  if (!isNewLanguagePath(relativePath)) return false

  const siblingLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== NEW_LANGUAGE)
  if (relativePath === `CLAUDE.${NEW_LANGUAGE}.md`) {
    return siblingLanguages.some((lang) =>
      fs.existsSync(path.join(projectRoot, `CLAUDE.${lang}.md`))
    )
  }

  const match = relativePath.match(/^\.claude\/(agents|commands|skills)-/)
  if (!match) return false
  const category = match[1]
  return siblingLanguages.some((lang) =>
    fs.existsSync(path.join(projectRoot, `.claude/${category}-${lang}`))
  )
}

function hashLanguageScript(content) {
  return createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex')
}

function languageScriptSupports(content, language) {
  const supportedLanguages = content.match(/SUPPORTED_LANGUAGES\s*=\s*\[([^\]]*)\]/)?.[1]
  if (!supportedLanguages) return false
  return new RegExp(`['"]${language}['"]`).test(supportedLanguages)
}

function migrateKnownLanguageScript(content) {
  if (!LEGACY_LANGUAGE_SCRIPT_HASHES.has(hashLanguageScript(content))) return null

  return content.replace(
    /(SUPPORTED_LANGUAGES\s*=\s*\[[^\]]*['"]en['"])(\s*\])/,
    `$1, '${NEW_LANGUAGE}'$2`
  )
}

function getNewLanguageToolingMigration(projectRoot) {
  const languageScriptPath = path.join(projectRoot, LANGUAGE_SWITCH_SCRIPT)
  const packagePath = path.join(projectRoot, 'package.json')
  const languageScriptExists = fs.existsSync(languageScriptPath)

  let packageJson = null
  let hasLanguageCommands = false
  if (fs.existsSync(packagePath)) {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const scripts = packageJson.scripts
    hasLanguageCommands =
      scripts &&
      (typeof scripts['lang:ja'] === 'string' || typeof scripts['lang:en'] === 'string')
  }

  if (!hasLanguageCommands) return null

  let updatedLanguageScript = null
  let requiresManualLanguageScriptMigration = false
  let languageScriptReady = false
  let needsLanguageScript = false
  if (languageScriptExists) {
    const languageScript = fs.readFileSync(languageScriptPath, 'utf8')
    languageScriptReady = languageScriptSupports(languageScript, NEW_LANGUAGE)
    if (!languageScriptReady) {
      updatedLanguageScript = migrateKnownLanguageScript(languageScript)
      needsLanguageScript = updatedLanguageScript !== null
      requiresManualLanguageScriptMigration = !needsLanguageScript
    }
  } else {
    requiresManualLanguageScriptMigration = true
  }

  const needsPackageCommand = Boolean(
    (languageScriptReady || needsLanguageScript) &&
      !packageJson.scripts[`lang:${NEW_LANGUAGE}`]
  )

  if (!needsLanguageScript && !needsPackageCommand && !requiresManualLanguageScriptMigration) {
    return null
  }

  return {
    languageScriptPath,
    packagePath,
    packageJson,
    needsLanguageScript,
    updatedLanguageScript,
    needsPackageCommand,
    requiresManualLanguageScriptMigration,
  }
}

function migrateNewLanguageTooling(migration) {
  if (!migration) return

  if (migration.needsLanguageScript) {
    fs.writeFileSync(migration.languageScriptPath, migration.updatedLanguageScript)
    console.log(`  Updated ${LANGUAGE_SWITCH_SCRIPT} for ${NEW_LANGUAGE}.`)
  }

  if (migration.needsPackageCommand) {
    migration.packageJson.scripts[`lang:${NEW_LANGUAGE}`] =
      `node scripts/set-language.js ${NEW_LANGUAGE}`
    fs.writeFileSync(migration.packagePath, `${JSON.stringify(migration.packageJson, null, 2)}\n`)
    console.log(`  Added package script lang:${NEW_LANGUAGE}.`)
  }

  if (migration.requiresManualLanguageScriptMigration) {
    console.warn(`  Preserved customized or missing ${LANGUAGE_SWITCH_SCRIPT}.`)
    console.warn(`  Add '${NEW_LANGUAGE}' to its SUPPORTED_LANGUAGES list.`)
    if (!migration.packageJson.scripts[`lang:${NEW_LANGUAGE}`]) {
      console.warn(`  Then add package script lang:${NEW_LANGUAGE}.`)
    }
  }
}

// ---------------------------------------------------------------------------
// Show CHANGELOG
// ---------------------------------------------------------------------------

function showChangelog(packageRoot) {
  const changelogPath = path.join(packageRoot, 'CHANGELOG.md')
  if (!fs.existsSync(changelogPath)) {
    return
  }
  const content = fs.readFileSync(changelogPath, 'utf8')
  console.log('  ---- CHANGELOG ----')
  // Show first 40 lines to keep it concise
  const lines = content.split('\n').slice(0, 40)
  for (const line of lines) {
    console.log(`  ${line}`)
  }
  if (content.split('\n').length > 40) {
    console.log('  ... (truncated)')
  }
  console.log('  --------------------\n')
}

// ---------------------------------------------------------------------------
// Update execution
// ---------------------------------------------------------------------------

async function performUpdate(packageRoot, projectRoot, manifest, dryRun) {
  const managed = getManagedPaths()
  const ignoredIds = manifest.ignored || []
  const ignoredPaths = resolveAllIgnoredPaths(ignoredIds)
  const toolingMigration = getNewLanguageToolingMigration(projectRoot)

  if (ignoredIds.length > 0) {
    console.log('  The following are ignored and will be preserved:')
    for (const id of ignoredIds) {
      console.log(`    - ${id}`)
    }
    console.log('  Warning: version mismatch may occur for ignored resources.\n')
  }

  if (dryRun) {
    console.log('  [dry-run] The following would be updated:\n')
    for (const dir of managed.dirs) {
      const dst = path.join(projectRoot, dir)
      const dstExists = fs.existsSync(dst)
      const action = dstExists
        ? 'UPDATE'
        : shouldAddNewLanguagePath(projectRoot, dir)
          ? 'ADD   '
          : 'SKIP  '
      console.log(`    ${action} ${dir}/`)
    }
    for (const file of managed.files) {
      const dst = path.join(projectRoot, file)
      const dstExists = fs.existsSync(dst)
      const action = dstExists
        ? 'UPDATE'
        : shouldAddNewLanguagePath(projectRoot, file)
          ? 'ADD   '
          : 'SKIP  '
      console.log(`    ${action} ${file}`)
    }
    if (toolingMigration?.needsLanguageScript) {
      console.log(`    UPDATE ${LANGUAGE_SWITCH_SCRIPT}`)
    }
    if (toolingMigration?.needsPackageCommand) {
      console.log(`    UPDATE package.json (add lang:${NEW_LANGUAGE})`)
    }
    if (toolingMigration?.requiresManualLanguageScriptMigration) {
      console.log(`    PRESERVE ${LANGUAGE_SWITCH_SCRIPT} (manual ${NEW_LANGUAGE} migration required)`)
    }
    console.log('\n  No changes were made (dry-run).')
    return
  }

  // 1. Backup ignored paths
  const backups = backupIgnored(projectRoot, ignoredPaths)

  // 2. Replace managed directories and add sources for a newly supported language
  for (const dir of managed.dirs) {
    const src = path.join(packageRoot, dir)
    const dst = path.join(projectRoot, dir)
    if (!fs.existsSync(src)) continue
    const dstExists = fs.existsSync(dst)
    if (!dstExists && !shouldAddNewLanguagePath(projectRoot, dir)) {
      console.log(`  Skipped ${dir}/ (not present in project)`)
      continue
    }

    if (dstExists) {
      removeDirectory(dst)
    }
    copyDirectory(src, dst)
    console.log(`  ${dstExists ? 'Updated' : 'Added'} ${dir}/`)
  }

  // 3. Replace managed files and add sources for a newly supported language
  for (const file of managed.files) {
    const src = path.join(packageRoot, file)
    const dst = path.join(projectRoot, file)
    if (!fs.existsSync(src)) continue
    const dstExists = fs.existsSync(dst)
    if (!dstExists && !shouldAddNewLanguagePath(projectRoot, file)) {
      console.log(`  Skipped ${file} (not present in project)`)
      continue
    }

    copyFile(src, dst)
    console.log(`  ${dstExists ? 'Updated' : 'Added'} ${file}`)
  }

  // 4. Restore ignored paths
  if (backups.length > 0) {
    restoreIgnored(projectRoot, backups)
    console.log('  Restored ignored resources.')
  }

  // 5. Migrate language switching for projects created before this language was supported
  migrateNewLanguageTooling(toolingMigration)

  // 6. Re-run set-language to regenerate active directories
  const language = detectLanguage(projectRoot) || manifest.language
  const { switchLanguage } = await import('./set-language.js')
  const originalCwd = process.cwd()
  process.chdir(projectRoot)
  switchLanguage(language)
  process.chdir(originalCwd)
  console.log(`  Regenerated active directories for language: ${language}`)

  // 7. Update manifest
  const newVersion = getPackageVersion()
  manifest.version = newVersion
  manifest.language = language
  manifest.updatedAt = new Date().toISOString()
  saveManifest(projectRoot, manifest)
  console.log(`  Manifest updated to version ${newVersion}.`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const projectRoot = process.cwd()
  const packageRoot = getPackageRoot()
  const packageVersion = getPackageVersion()

  // Handle --ignore <category> [name]
  if (args.includes('--ignore')) {
    const idx = args.indexOf('--ignore')
    const category = args[idx + 1]
    const name = args[idx + 2] // undefined for CLAUDE.md (no name needed)
    if (!category) {
      console.error('  Error: --ignore requires a category.')
      console.error('  Usage: --ignore agents <name>')
      console.error('         --ignore commands <name>')
      console.error('         --ignore skills <name>')
      console.error('         --ignore CLAUDE.md')
      process.exit(1)
    }
    addIgnore(projectRoot, category, name)
    return
  }

  // Handle --unignore <category> [name]
  if (args.includes('--unignore')) {
    const idx = args.indexOf('--unignore')
    const category = args[idx + 1]
    const name = args[idx + 2]
    if (!category) {
      console.error('  Error: --unignore requires a category.')
      console.error('  Usage: --unignore agents <name>')
      console.error('         --unignore commands <name>')
      console.error('         --unignore skills <name>')
      console.error('         --unignore CLAUDE.md')
      process.exit(1)
    }
    removeIgnore(projectRoot, category, name)
    return
  }

  const dryRun = args.includes('--dry-run')

  console.log('\n  create-ai-project update')
  console.log(`  Package version: ${packageVersion}\n`)

  // Load or initialize manifest
  let manifest = loadManifest(projectRoot)
  if (!manifest) {
    manifest = await initManifest(projectRoot)
  }

  const currentVersion = manifest.version
  console.log(`  Current project version: ${currentVersion}`)
  console.log(`  Latest package version:  ${packageVersion}\n`)

  if (currentVersion === packageVersion) {
    console.log('  Already up to date. No changes needed.\n')
    return
  }

  // Show changelog
  showChangelog(packageRoot)

  // Confirm update
  if (!dryRun) {
    const answer = await prompt('  Apply update? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      console.log('  Update cancelled.\n')
      return
    }
    console.log()
  }

  await performUpdate(packageRoot, projectRoot, manifest, dryRun)

  console.log('\n  Update complete.\n')
}

main().catch((err) => {
  console.error(`  Error: ${err.message}`)
  process.exit(1)
})
