#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { copyDirectory, removeDirectory, copyFile } = require('./utils');

const MANIFEST_FILE = '.create-ai-project.json';
const CLAUDELANG_FILE = '.claudelang';
const SUPPORTED_LANGUAGES = ['ja', 'en'];

// Categories that can be ignored
const VALID_CATEGORIES = ['agents', 'commands', 'skills'];

// Directories and files managed by the boilerplate
const MANAGED_DIRS = [
  (lang) => `.claude/agents-${lang}`,
  (lang) => `.claude/commands-${lang}`,
  (lang) => `.claude/skills-${lang}`,
];

const MANAGED_FILES = [
  (lang) => `CLAUDE.${lang}.md`,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPackageRoot() {
  return path.join(__dirname, '..');
}

function getPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(getPackageRoot(), 'package.json'), 'utf8'));
  return pkg.version;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Ignore identifier resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a logical ignore identifier to actual file paths for all languages.
 *
 * Examples:
 *   "agents task-executor" -> [".claude/agents-ja/task-executor.md", ".claude/agents-en/task-executor.md"]
 *   "skills project-context" -> [".claude/skills-ja/project-context", ".claude/skills-en/project-context"]
 *   "CLAUDE.md" -> ["CLAUDE.ja.md", "CLAUDE.en.md"]
 */
function resolveIgnorePaths(category, name) {
  if (category === 'CLAUDE.md') {
    return SUPPORTED_LANGUAGES.map((lang) => `CLAUDE.${lang}.md`);
  }

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`  Error: unknown category "${category}". Valid: ${VALID_CATEGORIES.join(', ')}, CLAUDE.md`);
    process.exit(1);
  }

  if (!name) {
    console.error(`  Error: --ignore ${category} requires a resource name.`);
    console.error(`  Example: --ignore ${category} my-resource`);
    process.exit(1);
  }

  return SUPPORTED_LANGUAGES.map((lang) => {
    const base = `.claude/${category}-${lang}/${name}`;
    // agents and commands are .md files, skills are directories
    return category === 'skills' ? base : `${base}.md`;
  });
}

/**
 * Format an ignore identifier for display and storage.
 * Stored as "category/name" (e.g., "agents/task-executor") or "CLAUDE.md".
 */
function formatIgnoreId(category, name) {
  if (category === 'CLAUDE.md') return 'CLAUDE.md';
  return `${category}/${name}`;
}

/**
 * Parse a stored ignore identifier back to category and name.
 */
function parseIgnoreId(id) {
  if (id === 'CLAUDE.md') return { category: 'CLAUDE.md', name: null };
  const [category, ...rest] = id.split('/');
  return { category, name: rest.join('/') };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function loadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function saveManifest(projectRoot, manifest) {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

function detectLanguage(projectRoot) {
  const langPath = path.join(projectRoot, CLAUDELANG_FILE);
  if (fs.existsSync(langPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      if (SUPPORTED_LANGUAGES.includes(config.current)) {
        return config.current;
      }
    } catch {
      // fall through to interactive prompt
    }
  }
  return null;
}

async function resolveLanguage(projectRoot) {
  const detected = detectLanguage(projectRoot);
  if (detected) {
    console.log(`  Detected language from .claudelang: ${detected}`);
    return detected;
  }

  const answer = await prompt('  Select language (ja/en): ');
  if (!SUPPORTED_LANGUAGES.includes(answer)) {
    console.error(`  Error: unsupported language "${answer}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    process.exit(1);
  }
  return answer;
}

// ---------------------------------------------------------------------------
// Init flow (first run without manifest)
// ---------------------------------------------------------------------------

async function initManifest(projectRoot) {
  console.log('\n  .create-ai-project.json not found. Initializing...\n');
  const language = await resolveLanguage(projectRoot);

  const manifest = {
    version: 'unknown',
    language,
    ignored: [],
    updatedAt: new Date().toISOString(),
  };

  saveManifest(projectRoot, manifest);
  console.log(`  Created ${MANIFEST_FILE} (version: unknown)\n`);
  return manifest;
}

// ---------------------------------------------------------------------------
// Ignore management
// ---------------------------------------------------------------------------

function addIgnore(projectRoot, category, name) {
  const manifest = loadManifest(projectRoot);
  if (!manifest) {
    console.error(`  Error: ${MANIFEST_FILE} not found. Run "npx create-ai-project update" first.`);
    process.exit(1);
  }

  // Validate the identifier resolves to real paths
  resolveIgnorePaths(category, name);

  const id = formatIgnoreId(category, name);
  if (manifest.ignored.includes(id)) {
    console.log(`  Already ignored: ${id}`);
    return;
  }
  manifest.ignored.push(id);
  saveManifest(projectRoot, manifest);
  console.log(`  Added to ignore list: ${id}`);
}

function removeIgnore(projectRoot, category, name) {
  const manifest = loadManifest(projectRoot);
  if (!manifest) {
    console.error(`  Error: ${MANIFEST_FILE} not found. Run "npx create-ai-project update" first.`);
    process.exit(1);
  }

  const id = formatIgnoreId(category, name);
  const idx = manifest.ignored.indexOf(id);
  if (idx === -1) {
    console.log(`  Not in ignore list: ${id}`);
    return;
  }
  manifest.ignored.splice(idx, 1);
  saveManifest(projectRoot, manifest);
  console.log(`  Removed from ignore list: ${id}`);
}

// ---------------------------------------------------------------------------
// Resolve all ignored identifiers to actual file paths
// ---------------------------------------------------------------------------

function resolveAllIgnoredPaths(ignoredIds) {
  const paths = [];
  for (const id of ignoredIds) {
    const { category, name } = parseIgnoreId(id);
    paths.push(...resolveIgnorePaths(category, name));
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Backup & restore ignored paths
// ---------------------------------------------------------------------------

function backupIgnored(projectRoot, ignoredPaths) {
  const backups = [];
  for (const rel of ignoredPaths) {
    const abs = path.join(projectRoot, rel);
    if (!fs.existsSync(abs)) continue;

    const stat = fs.statSync(abs);
    const tmpDir = path.join(projectRoot, 'tmp', '.update-backup');
    const tmpPath = path.join(tmpDir, rel);

    if (stat.isDirectory()) {
      copyDirectory(abs, tmpPath);
    } else {
      copyFile(abs, tmpPath);
    }
    backups.push({ rel, tmpPath, isDir: stat.isDirectory() });
  }
  return backups;
}

function restoreIgnored(projectRoot, backups) {
  for (const { rel, tmpPath, isDir } of backups) {
    const abs = path.join(projectRoot, rel);
    if (isDir) {
      removeDirectory(abs);
      copyDirectory(tmpPath, abs);
    } else {
      copyFile(tmpPath, abs);
    }
  }

  // Clean up backup directory
  const tmpDir = path.join(projectRoot, 'tmp', '.update-backup');
  removeDirectory(tmpDir);
}

// ---------------------------------------------------------------------------
// Collect managed paths for all languages
// ---------------------------------------------------------------------------

function getManagedPaths() {
  const paths = { dirs: [], files: [] };
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const dirFn of MANAGED_DIRS) {
      paths.dirs.push(dirFn(lang));
    }
    for (const fileFn of MANAGED_FILES) {
      paths.files.push(fileFn(lang));
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Show CHANGELOG
// ---------------------------------------------------------------------------

function showChangelog(packageRoot) {
  const changelogPath = path.join(packageRoot, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return;
  }
  const content = fs.readFileSync(changelogPath, 'utf8');
  console.log('  ---- CHANGELOG ----');
  // Show first 40 lines to keep it concise
  const lines = content.split('\n').slice(0, 40);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  if (content.split('\n').length > 40) {
    console.log('  ... (truncated)');
  }
  console.log('  --------------------\n');
}

// ---------------------------------------------------------------------------
// Update execution
// ---------------------------------------------------------------------------

function performUpdate(packageRoot, projectRoot, manifest, dryRun) {
  const managed = getManagedPaths();
  const ignoredIds = manifest.ignored || [];
  const ignoredPaths = resolveAllIgnoredPaths(ignoredIds);

  if (ignoredIds.length > 0) {
    console.log('  The following are ignored and will be preserved:');
    for (const id of ignoredIds) {
      console.log(`    - ${id}`);
    }
    console.log('  Warning: version mismatch may occur for ignored resources.\n');
  }

  if (dryRun) {
    console.log('  [dry-run] The following would be updated:\n');
    for (const dir of managed.dirs) {
      const dst = path.join(projectRoot, dir);
      const dstExists = fs.existsSync(dst);
      console.log(`    ${dstExists ? 'UPDATE' : 'SKIP  '} ${dir}/`);
    }
    for (const file of managed.files) {
      const dst = path.join(projectRoot, file);
      const dstExists = fs.existsSync(dst);
      console.log(`    ${dstExists ? 'UPDATE' : 'SKIP  '} ${file}`);
    }
    console.log('\n  No changes were made (dry-run).');
    return;
  }

  // 1. Backup ignored paths
  const backups = backupIgnored(projectRoot, ignoredPaths);

  // 2. Replace managed directories (only if target directory exists)
  for (const dir of managed.dirs) {
    const src = path.join(packageRoot, dir);
    const dst = path.join(projectRoot, dir);
    if (!fs.existsSync(src)) continue;
    if (!fs.existsSync(dst)) {
      console.log(`  Skipped ${dir}/ (not present in project)`);
      continue;
    }

    removeDirectory(dst);
    copyDirectory(src, dst);
    console.log(`  Updated ${dir}/`);
  }

  // 3. Replace managed files (only if target file exists)
  for (const file of managed.files) {
    const src = path.join(packageRoot, file);
    const dst = path.join(projectRoot, file);
    if (!fs.existsSync(src)) continue;
    if (!fs.existsSync(dst)) {
      console.log(`  Skipped ${file} (not present in project)`);
      continue;
    }

    copyFile(src, dst);
    console.log(`  Updated ${file}`);
  }

  // 4. Restore ignored paths
  if (backups.length > 0) {
    restoreIgnored(projectRoot, backups);
    console.log('  Restored ignored resources.');
  }

  // 5. Re-run set-language to regenerate active directories
  // Use the package's set-language.js (not the project's) to ensure latest version
  const language = manifest.language;
  const { switchLanguage } = require('./set-language');
  const originalCwd = process.cwd();
  process.chdir(projectRoot);
  switchLanguage(language);
  process.chdir(originalCwd);
  console.log(`  Regenerated active directories for language: ${language}`);

  // 6. Update manifest
  const newVersion = getPackageVersion();
  manifest.version = newVersion;
  manifest.updatedAt = new Date().toISOString();
  saveManifest(projectRoot, manifest);
  console.log(`  Manifest updated to version ${newVersion}.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const projectRoot = process.cwd();
  const packageRoot = getPackageRoot();
  const packageVersion = getPackageVersion();

  // Handle --ignore <category> [name]
  if (args.includes('--ignore')) {
    const idx = args.indexOf('--ignore');
    const category = args[idx + 1];
    const name = args[idx + 2]; // undefined for CLAUDE.md (no name needed)
    if (!category) {
      console.error('  Error: --ignore requires a category.');
      console.error('  Usage: --ignore agents <name>');
      console.error('         --ignore commands <name>');
      console.error('         --ignore skills <name>');
      console.error('         --ignore CLAUDE.md');
      process.exit(1);
    }
    addIgnore(projectRoot, category, name);
    return;
  }

  // Handle --unignore <category> [name]
  if (args.includes('--unignore')) {
    const idx = args.indexOf('--unignore');
    const category = args[idx + 1];
    const name = args[idx + 2];
    if (!category) {
      console.error('  Error: --unignore requires a category.');
      console.error('  Usage: --unignore agents <name>');
      console.error('         --unignore commands <name>');
      console.error('         --unignore skills <name>');
      console.error('         --unignore CLAUDE.md');
      process.exit(1);
    }
    removeIgnore(projectRoot, category, name);
    return;
  }

  const dryRun = args.includes('--dry-run');

  console.log('\n  create-ai-project update');
  console.log(`  Package version: ${packageVersion}\n`);

  // Load or initialize manifest
  let manifest = loadManifest(projectRoot);
  if (!manifest) {
    manifest = await initManifest(projectRoot);
  }

  const currentVersion = manifest.version;
  console.log(`  Current project version: ${currentVersion}`);
  console.log(`  Latest package version:  ${packageVersion}\n`);

  if (currentVersion === packageVersion) {
    console.log('  Already up to date. No changes needed.\n');
    return;
  }

  // Show changelog
  showChangelog(packageRoot);

  // Confirm update
  if (!dryRun) {
    const answer = await prompt('  Apply update? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('  Update cancelled.\n');
      return;
    }
    console.log();
  }

  performUpdate(packageRoot, projectRoot, manifest, dryRun);

  console.log('\n  Update complete.\n');
}

main().catch((err) => {
  console.error(`  Error: ${err.message}`);
  process.exit(1);
});
