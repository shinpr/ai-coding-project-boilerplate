const { program } = require('commander')
const fs = require('fs')
const path = require('path')

/**
 * TODO
 * - replace biome to eslint + prettier
 */

/**
 * Detects package manager from lock files and package.json
 * @param {string} projectRoot - Project root directory path
 * @returns {string} Detected package manager or 'unknown'
 */
function detectPackageManager(projectRoot) {
    try {
        // Priority: bun.lock > yarn.lock > pnpm-lock.yaml > package-lock.json
        const lockFiles = [
            { file: 'bun.lock', manager: 'bun' },
            { file: 'yarn.lock', manager: 'yarn' },
            { file: 'pnpm-lock.yaml', manager: 'pnpm' },
            { file: 'package-lock.json', manager: 'npm' },
        ]

        for (const { file, manager } of lockFiles) {
            if (fs.existsSync(path.join(projectRoot, file))) {
                return manager
            }
        }

        // If no lock file found, check package.json packageManager field
        const packageJsonPath = path.join(projectRoot, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
            if (packageJson.packageManager) {
                const pmMatch = packageJson.packageManager.match(/^(npm|yarn|pnpm|bun)@/)
                if (pmMatch) {
                    return pmMatch[1]
                }
            }
            // Fallback: check scripts for package manager hints
            if (packageJson.scripts) {
                const scripts = JSON.stringify(packageJson.scripts)
                if (scripts.includes('bunx') || scripts.includes('bun run')) {
                    return 'bun'
                } else if (scripts.includes('yarn')) {
                    return 'yarn'
                } else if (scripts.includes('pnpm')) {
                    return 'pnpm'
                } else {
                    return 'npm' // Default fallback
                }
            }
        }
    } catch (error) {
        // Continue with unknown if parsing fails
    }

    return 'unknown'
}

/**
 * Detects language/locale from set-language.js and i18n configuration
 * @param {string} projectRoot - Project root directory path
 * @returns {string} Detected language or 'unknown'
 */
function detectLanguage(projectRoot) {
    // First priority: Use set-language.js detectCurrentLanguage() function
    try {
        const { detectCurrentLanguage } = require('./set-language.js')
        const currentLanguage = detectCurrentLanguage()
        if (currentLanguage) {
            return currentLanguage
        }
    } catch (error) {
        // Continue with fallback if set-language.js is not available or throws error
    }

    return 'en' // Default fallback
}

/**
 * Detects the current stack configuration automatically
 * @returns {Object} Current stack settings
 */
function detectCurrentSettings() {
    const projectRoot = process.cwd()
    const settings = {
        packageManager: 'unknown',
        language: 'unknown',
    }

    try {
        settings.packageManager = detectPackageManager(projectRoot)
        settings.language = detectLanguage(projectRoot)
    } catch (error) {
        console.warn('Warning: Error occurred during stack detection:', error.message)
    }

    return settings
}

/**
 * Handles language changes by calling switchLanguage from set-language.js
 * @param {string} newLanguage - New language to switch to
 */
async function handleLanguageChange(newLanguage) {
    try {
        const { switchLanguage } = await import('./set-language.js')
        switchLanguage(newLanguage)
        console.log(`Successfully switched language to ${newLanguage}`)
    } catch (error) {
        throw new Error(`Failed to change language: ${error.message}`)
    }
}

/**
 * Replaces package manager commands across all project files
 * @param {string} oldManager - Previous package manager
 * @param {string} newManager - New package manager to use
 * @param {string} projectRoot - Project root directory
 */
function replacePackageManagerCommands(oldManager, newManager, projectRoot) {
    const commandMappings = {
        npm: { cmd: 'npm', exec: 'npx' },
        yarn: { cmd: 'yarn', exec: 'yarn dlx' },
        pnpm: { cmd: 'pnpm', exec: 'pnpm dlx' },
        bun: { cmd: 'bun', exec: 'bunx' },
    }

    const oldCommands = commandMappings[oldManager]
    const newCommands = commandMappings[newManager]

    if (!oldCommands || !newCommands) {
        console.warn(`Warning: Unknown package manager mapping for ${oldManager} -> ${newManager}`)
        return
    }

    const processableExtensions = [
        '.js',
        '.ts',
        '.json',
        '.md',
        '.yaml',
        '.yml',
        '.txt',
        '.sh',
        '.bat',
        '.ps1',
        '',
    ]
    const excludedDirs = [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.cache',
        '.next',
        '.nuxt',
    ]
    const currentScriptFile = path.basename(__filename)

    const modifiedFiles = []

    function processDirectory(dirPath) {
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true })
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name)
                if (item.isDirectory()) {
                    if (!excludedDirs.includes(item.name)) {
                        processDirectory(fullPath)
                    }
                } else if (item.isFile()) {
                    // Skip the current script file to avoid self-modification
                    if (item.name === currentScriptFile) {
                        continue
                    }

                    const ext = path.extname(item.name)
                    if (processableExtensions.includes(ext)) {
                        processFile(fullPath)
                    }
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not process directory ${dirPath}: ${error.message}`)
        }
    }

    function processFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            let modifiedContent = content
            let hasChanges = false

            // Replace package manager commands using word boundaries
            const cmdRegex = new RegExp(`\\b${oldCommands.cmd}\\b`, 'g')
            const execRegex = new RegExp(`\\b${oldCommands.exec}\\b`, 'g')

            modifiedContent = modifiedContent.replace(cmdRegex, (match) => {
                hasChanges = true
                return newCommands.cmd
            })

            modifiedContent = modifiedContent.replace(execRegex, (match) => {
                hasChanges = true
                return newCommands.exec
            })

            if (hasChanges) {
                fs.writeFileSync(filePath, modifiedContent, 'utf8')
                modifiedFiles.push(path.relative(projectRoot, filePath))
            }
        } catch (error) {
            console.warn(`Warning: Could not process file ${filePath}: ${error.message}`)
        }
    }

    // TODO replace: when old or new bun, replace Node.js texts
    console.log(
        `Replacing ${oldCommands.cmd}/${oldCommands.exec} with ${newCommands.cmd}/${newCommands.exec} across project files...`
    )
    processDirectory(projectRoot)

    if (modifiedFiles.length > 0) {
        console.log(`Successfully updated package manager commands in ${modifiedFiles.length} file(s):`)
        // biome-ignore lint/complexity/noForEach: <explanation>
        modifiedFiles.forEach((file) => console.log(`  - ${file}`))
    } else {
        console.log('No files required package manager command updates.')
    }
}

/**
 * Handles package manager changes by cleaning old artifacts and installing with new manager
 * @param {string} oldManager - Previous package manager
 * @param {string} newManager - New package manager to use
 */
async function handlePackageManagerChange(oldManager, newManager) {
    // biome-ignore lint/style/useNodejsImportProtocol: <explanation>
    const { execSync } = await import('child_process')
    const projectRoot = process.cwd()

    console.log(`\nChanging package manager from ${oldManager} to ${newManager}...`)

    try {
        // Delete node_modules directory if it exists
        const nodeModulesPath = path.join(projectRoot, 'node_modules')
        if (fs.existsSync(nodeModulesPath)) {
            console.log('Removing node_modules directory...')
            fs.rmSync(nodeModulesPath, { recursive: true, force: true })
        }

        // Delete old package manager lock file
        const lockFileMap = {
            npm: 'package-lock.json',
            yarn: 'yarn.lock',
            pnpm: 'pnpm-lock.yaml',
            bun: 'bun.lock',
        }

        const oldLockFile = lockFileMap[oldManager]
        if (oldLockFile) {
            const oldLockPath = path.join(projectRoot, oldLockFile)
            if (fs.existsSync(oldLockPath)) {
                console.log(`Removing ${oldLockFile}...`)
                fs.unlinkSync(oldLockPath)
            }
        }

        // Run install command with new package manager
        const installCommandMap = {
            npm: 'npm install',
            yarn: 'yarn install',
            pnpm: 'pnpm install',
            bun: 'bun install',
        }

        const installCommand = installCommandMap[newManager]
        if (installCommand) {
            console.log(`Running ${installCommand}...`)
            execSync(installCommand, {
                stdio: 'inherit',
                cwd: projectRoot,
                encoding: 'utf8',
            })
            execSync(`git add ${lockFileMap[newManager]}`, {
                stdio: 'inherit',
                cwd: projectRoot,
                encoding: 'utf8',
            })
            console.log(`Successfully installed dependencies with ${newManager}`)
        } else {
            throw new Error(`Unknown package manager: ${newManager}`)
        }

        // Replace package manager commands across project files
        replacePackageManagerCommands(oldManager, newManager, projectRoot)
    } catch (error) {
        throw new Error(`Failed to change package manager: ${error.message}`)
    }
}

// Current project settings detection
const currentSettings = detectCurrentSettings()

const packageManagerOptions = [
    { value: 'no-change', label: 'no change' },
    { value: 'npm', label: 'npm' },
    { value: 'yarn', label: 'yarn' },
    { value: 'pnpm', label: 'pnpm' },
    { value: 'bun', label: 'bun' },
]

const languageOptions = [
    { value: 'no-change', label: 'no change' },
    { value: 'en', label: 'English (en)' },
    { value: 'ja', label: 'Japanese (ja)' },
]

/**
 * Commander-based interactive mode functions
 */
function createChoicesFromOptions(options, current) {
    return options.map((option, index) => {
        const isCurrentSetting = option.value === current
        const status = isCurrentSetting ? ' (current)' : ''
        const disabled = isCurrentSetting && option.value !== 'no-change'

        return {
            name: `${option.label}${status}`,
            value: option.value,
            disabled: disabled,
        }
    })
}

async function getCommanderChoice(questionText, options, current) {
    const inquirer = await import('inquirer')

    const choices = createChoicesFromOptions(options, current).map((choice) => ({
        name: choice.name,
        value: choice.value,
        disabled: choice.disabled,
    }))

    try {
        const answer = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'selection',
                message: questionText,
                choices: choices,
            },
        ])

        return answer.selection
    } catch (error) {
        if (error.isTTYError) {
            console.log("\nPrompt couldn't be rendered in the current environment")
            process.exit(1)
        } else {
            console.log('\nOperation cancelled.')
            process.exit(0)
        }
    }
}

/**
 * Displays the current detected stack configuration
 * @param {Object} settings Current settings object
 */
function displayCurrentStack(settings) {
    console.log('\n=== Current Stack Configuration ===')
    console.log(`Package Manager: ${settings.packageManager}`)
    console.log(`Language: ${settings.language}`)

    // Add detection confidence indicators
    const detectionNotes = []
    if (settings.packageManager === 'unknown') {
        detectionNotes.push('⚠️  Package manager could not be detected')
    }
    if (settings.language === 'unknown') {
        detectionNotes.push('⚠️  Language/locale could not be detected')
    }

    if (detectionNotes.length > 0) {
        console.log('\nDetection Issues:')
        // biome-ignore lint/complexity/noForEach: <explanation>
        detectionNotes.forEach((note) => console.log(`  ${note}`))
    } else {
        console.log('✅ All stack components successfully detected')
    }

    console.log('\nNote: This configuration was automatically detected from your project files.')
    console.log('You can now choose to change any of these settings.\n')
}

program
    .name('stack-settings')
    .description('Configure development stack settings')
    .option('--detect-only', 'Only show detected configuration without interactive mode')
    .action(async (options) => {
        if (options.detectOnly) {
            console.log('Development Stack Configuration Tool')
            console.log('====================================')
            displayCurrentStack(currentSettings)
            console.log('Use without --detect-only flag to enter interactive configuration mode.')
            return
        }
        console.log('====================================')
        console.log('Development Stack Configuration Tool')
        console.log('====================================')

        // Display current stack status first
        displayCurrentStack(currentSettings)

        const results = {}

        try {
            // Question 1: Package Manager
            results.packageManager = await getCommanderChoice(
                'Which package manager do you want to use?',
                packageManagerOptions,
                currentSettings.packageManager
            )

            // Question 2: Language
            results.language = await getCommanderChoice(
                'Which language do you want to use?',
                languageOptions,
                currentSettings.language
            )

            // Display final results
            console.log('\n=== Configuration Summary ===')
            console.log(
                `Package Manager: ${results.packageManager === 'no-change' ? `${currentSettings.packageManager} (unchanged)` : results.packageManager}`
            )
            console.log(
                `Language: ${results.language === 'no-change' ? `${currentSettings.language} (unchanged)` : results.language}`
            )

            // Count actual changes
            const changes = Object.keys(results).filter((key) => results[key] !== 'no-change').length

            if (changes === 0) {
                console.log('\nNo changes were made to the configuration.')
            } else {
                console.log(`\n${changes} configuration(s) will be updated.`)

                // Handle language changes
                if (results.language !== 'no-change' && results.language !== currentSettings.language) {
                    await handleLanguageChange(results.language)
                }

                // Handle package manager changes
                if (
                    results.packageManager !== 'no-change' &&
                    results.packageManager !== currentSettings.packageManager
                ) {
                    await handlePackageManagerChange(currentSettings.packageManager, results.packageManager)
                }

                console.log('Configuration update completed successfully!')
            }
        } catch (error) {
            console.error('An error occurred during configuration:', error.message)
            process.exit(1)
        }
    })

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Unexpected error:', error.message)
    process.exit(1)
})

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason)
    process.exit(1)
})

program.parse()
