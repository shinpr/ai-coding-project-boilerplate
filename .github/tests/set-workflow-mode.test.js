import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = fileURLToPath(new URL('../../scripts/set-workflow-mode.js', import.meta.url))
const updater = fileURLToPath(new URL('../../scripts/update-project.js', import.meta.url))
const start = '<!-- create-ai-project:workflow-mode:start -->'
const end = '<!-- create-ai-project:workflow-mode:end -->'
const directive = "Use Lite Mode for this project's workflows."
let projectRoot
let rulesPath

function run(mode) {
  return execFileSync(process.execPath, [script, mode], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

describe('persisted workflow mode', () => {
  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-mode-'))
    rulesPath = path.join(projectRoot, 'CLAUDE.md')
  })

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true })
  })

  it('enables Lite Mode while preserving the project rules', () => {
    const original = '# Project rules\n\nKeep the public response contract.\n'
    fs.writeFileSync(rulesPath, original)

    expect(run('lite')).toContain('Lite')

    const configured = fs.readFileSync(rulesPath, 'utf8')
    expect(configured).toContain(directive)
    expect(configured).toContain(start)
    expect(configured).toContain(end)
    expect(configured.endsWith(original)).toBe(true)
  })

  it('keeps repeated enable operations idempotent', () => {
    fs.writeFileSync(rulesPath, '# Project rules\n')
    run('lite')
    const configured = fs.readFileSync(rulesPath, 'utf8')

    run('lite')

    expect(fs.readFileSync(rulesPath, 'utf8')).toBe(configured)
  })

  it.each(['# Rules without a trailing newline', '# Rules\n\n', '# Rules\r\n'])(
    'restores the original rules when returning to Normal Mode: %j',
    (original) => {
      fs.writeFileSync(rulesPath, original)
      run('lite')

      expect(run('normal')).toContain('Normal')

      expect(fs.readFileSync(rulesPath, 'utf8')).toBe(original)
    }
  )

  it('leaves an unconfigured Normal Mode document unchanged', () => {
    const original = '# Rules\nKeep this custom paragraph.\n'
    fs.writeFileSync(rulesPath, original)

    run('normal')

    expect(fs.readFileSync(rulesPath, 'utf8')).toBe(original)
  })

  it('rejects an unsupported mode without editing the document', () => {
    const original = '# Project rules\n'
    fs.writeFileSync(rulesPath, original)

    expect(() => run('fast')).toThrow(/Usage:/)

    expect(fs.readFileSync(rulesPath, 'utf8')).toBe(original)
  })

  it.each([
    `${start}\n${directive}\n`,
    `${end}\n${start}\n`,
    `${start}\n${directive}\n${end}\n${start}\n${directive}\n${end}\n`,
  ])('reports damaged managed markers instead of removing other rules: %j', (original) => {
    fs.writeFileSync(rulesPath, original)

    expect(() => run('normal')).toThrow(/markers/)

    expect(fs.readFileSync(rulesPath, 'utf8')).toBe(original)
  })

  it('reports a missing project rules file without creating one', () => {
    expect(() => run('lite')).toThrow(/CLAUDE.md/)

    expect(fs.existsSync(rulesPath)).toBe(false)
  })

  it('installs the switching script on update and retains the saved default', () => {
    fs.writeFileSync(rulesPath, '# Existing project rules\n')
    fs.writeFileSync(path.join(projectRoot, 'CLAUDE.en.md'), '# Existing template\n')
    fs.writeFileSync(
      path.join(projectRoot, '.create-ai-project.json'),
      JSON.stringify({ version: '0.0.0', language: 'en', ignored: [] })
    )
    run('lite')

    const output = execFileSync(process.execPath, [updater], {
      cwd: projectRoot,
      encoding: 'utf8',
      input: 'y\n',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    expect(output).toContain('Update complete.')
    expect(fs.readFileSync(rulesPath, 'utf8')).toContain(directive)
    const installedScript = path.join(projectRoot, 'scripts', 'set-workflow-mode.js')
    expect(fs.readFileSync(installedScript, 'utf8')).toBe(fs.readFileSync(script, 'utf8'))
    const switched = execFileSync(process.execPath, [installedScript, 'normal'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    expect(switched).toContain('Normal')
    const updatedRules = fs.readFileSync(rulesPath, 'utf8')
    expect(updatedRules).not.toContain(directive)
    expect(updatedRules).toContain('# Claude Code Project Rules')
  })
})
