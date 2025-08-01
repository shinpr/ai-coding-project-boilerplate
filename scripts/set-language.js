#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = ['ja', 'en'];
const CONFIG_FILE = '.claudelang';

// 言語設定ファイルのパス定義
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
 * 設定ファイルを読み込む
 */
function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // 設定ファイルが存在しない場合はデフォルト設定
    return {
      current: 'ja',
      method: 'copy',
      lastUpdated: null
    };
  }
}

/**
 * 設定ファイルを保存する
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * ディレクトリを再帰的にコピーする
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  // ターゲットディレクトリを作成
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
 * ディレクトリを削除する
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * ファイルをコピーする
 */
function copyFile(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  // ターゲットディレクトリを作成
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(source, target);
  return true;
}

/**
 * 現在の言語を検出する
 */
function detectCurrentLanguage() {
  const config = loadConfig();
  return config.current;
}

/**
 * 言語を切り替える
 */
function switchLanguage(targetLang) {
  if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
    console.error(`❌ サポートされていない言語です: ${targetLang}`);
    console.error(`   サポート言語: ${SUPPORTED_LANGUAGES.join(', ')}`);
    process.exit(1);
  }

  console.log(`🌐 言語を ${targetLang} に切り替えています...`);

  let hasErrors = false;

  // 1. CLAUDE.md の切り替え
  const claudeSource = LANGUAGE_PATHS.claude.source(targetLang);
  const claudeTarget = LANGUAGE_PATHS.claude.target;
  
  if (fs.existsSync(claudeSource)) {
    if (fs.existsSync(claudeTarget)) {
      fs.unlinkSync(claudeTarget);
    }
    copyFile(claudeSource, claudeTarget);
    console.log(`✅ ${claudeTarget} を更新しました`);
  } else {
    console.warn(`⚠️  ${claudeSource} が存在しません`);
    hasErrors = true;
  }

  // 2. docs/rules の切り替え
  const rulesSource = LANGUAGE_PATHS.rules.source(targetLang);
  const rulesTarget = LANGUAGE_PATHS.rules.target;
  
  if (fs.existsSync(rulesSource)) {
    removeDirectory(rulesTarget);
    copyDirectory(rulesSource, rulesTarget);
    console.log(`✅ ${rulesTarget} を更新しました`);
  } else {
    console.warn(`⚠️  ${rulesSource} が存在しません`);
    hasErrors = true;
  }


  // 3. docs/guides/sub-agents.md の切り替え
  const guideSource = LANGUAGE_PATHS.guides.sourceFile(targetLang);
  const guideTarget = LANGUAGE_PATHS.guides.target;
  
  if (fs.existsSync(guideSource)) {
    if (fs.existsSync(guideTarget)) {
      fs.unlinkSync(guideTarget);
    }
    copyFile(guideSource, guideTarget);
    console.log(`✅ ${guideTarget} を更新しました`);
  } else {
    console.warn(`⚠️  ${guideSource} が存在しません`);
  }

  // 4. .claude/commands の切り替え（存在する場合のみ）
  const commandsSource = LANGUAGE_PATHS.commands.source(targetLang);
  const commandsTarget = LANGUAGE_PATHS.commands.target;
  
  if (fs.existsSync(commandsSource)) {
    removeDirectory(commandsTarget);
    copyDirectory(commandsSource, commandsTarget);
    console.log(`✅ ${commandsTarget} を更新しました`);
  }

  // 5. .claude/agents の切り替え（存在する場合のみ）
  const agentsSource = LANGUAGE_PATHS.agents.source(targetLang);
  const agentsTarget = LANGUAGE_PATHS.agents.target;
  
  if (fs.existsSync(agentsSource)) {
    removeDirectory(agentsTarget);
    copyDirectory(agentsSource, agentsTarget);
    console.log(`✅ ${agentsTarget} を更新しました`);
  }

  // 設定を保存
  const config = {
    current: targetLang,
    method: 'copy',
    lastUpdated: new Date().toISOString()
  };
  saveConfig(config);

  if (hasErrors) {
    console.log(`⚠️  言語を ${targetLang} に切り替えましたが、一部ファイルが不足しています`);
  } else {
    console.log(`🎉 言語を ${targetLang} に切り替えました`);
  }
}

/**
 * 現在の状態を表示する
 */
function showStatus() {
  const config = loadConfig();
  
  console.log('📊 多言語化設定の状態:');
  console.log(`   現在の言語: ${config.current}`);
  console.log(`   切り替え方式: ${config.method}`);
  console.log(`   最終更新: ${config.lastUpdated || '未設定'}`);
  console.log();
  
  console.log('📁 ファイル存在確認:');
  for (const lang of SUPPORTED_LANGUAGES) {
    console.log(`\n  ${lang.toUpperCase()} 言語ファイル:`);
    
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
  
  console.log('\n📝 現在有効なファイル:');
  console.log(`   CLAUDE.md: ${fs.existsSync('CLAUDE.md') ? '✅' : '❌'}`);
  console.log(`   docs/rules: ${fs.existsSync('docs/rules') ? '✅' : '❌'}`);
  console.log(`   docs/guides/sub-agents.md: ${fs.existsSync('docs/guides/sub-agents.md') ? '✅' : '❌'}`);
}

/**
 * ヘルプを表示する
 */
function showHelp() {
  console.log('🌐 多言語化スクリプト');
  console.log();
  console.log('使用方法:');
  console.log('  node scripts/set-language.js <言語>');
  console.log('  node scripts/set-language.js --status');
  console.log('  node scripts/set-language.js --help');
  console.log();
  console.log('利用可能言語:');
  console.log(`  ${SUPPORTED_LANGUAGES.join(', ')}`);
  console.log();
  console.log('例:');
  console.log('  node scripts/set-language.js ja    # 日本語に切り替え');
  console.log('  node scripts/set-language.js en    # 英語に切り替え');
  console.log('  node scripts/set-language.js --status  # 現在の状態を確認');
}

// メイン処理
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
        console.error(`❌ 不明なコマンドまたは言語です: ${command}`);
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