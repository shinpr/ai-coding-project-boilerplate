#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const LITE_DIRECTIVE = 'Workflow Mode: Lite.'

export function getWorkflowMode(projectRoot) {
  const rulesPath = path.join(projectRoot, 'CLAUDE.md')
  if (!fs.existsSync(rulesPath)) {
    return 'normal'
  }
  const content = fs.readFileSync(rulesPath, 'utf8')
  return content.split(/\r?\n/).some((line) => line.trimEnd() === LITE_DIRECTIVE)
    ? 'lite'
    : 'normal'
}

export function setWorkflowMode(mode, projectRoot) {
  if (mode !== 'lite' && mode !== 'normal') {
    throw new Error('Usage: node scripts/set-workflow-mode.js <lite|normal>')
  }

  const rulesPath = path.join(projectRoot, 'CLAUDE.md')
  const content = fs.readFileSync(rulesPath, 'utf8')
  const newline = content.includes('\r\n') ? '\r\n' : '\n'
  const rules = content
    .split(/(?<=\n)/)
    .filter((line) => line.trimEnd() !== LITE_DIRECTIVE)
    .join('')
  const updated = mode === 'lite' ? `${LITE_DIRECTIVE}${newline}${rules}` : rules

  if (updated !== content) {
    fs.writeFileSync(rulesPath, updated)
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) {
      throw new Error('Usage: node scripts/set-workflow-mode.js <lite|normal>')
    }
    const mode = process.argv[2]
    setWorkflowMode(mode, process.cwd())
    console.log(`Workflow mode: ${mode === 'lite' ? 'Lite' : 'Normal'}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
