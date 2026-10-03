#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const START = '<!-- create-ai-project:workflow-mode:start -->'
const END = '<!-- create-ai-project:workflow-mode:end -->'
const LITE_DIRECTIVE = "Use Lite Mode for this project's workflows."

function managedBlock(content) {
  const starts = content.split(START).length - 1
  const ends = content.split(END).length - 1
  if (starts === 0 && ends === 0) {
    return null
  }

  const start = content.indexOf(START)
  let end = content.indexOf(END) + END.length
  if (starts !== 1 || ends !== 1 || end <= start) {
    throw new Error('Workflow mode markers are incomplete, duplicated, or out of order.')
  }

  const separator = content.slice(end).match(/^(?:\r?\n){1,2}/)?.[0] || ''
  end += separator.length
  return { start, end }
}

export function getWorkflowMode(projectRoot) {
  const rulesPath = path.join(projectRoot, 'CLAUDE.md')
  if (!fs.existsSync(rulesPath)) {
    return 'normal'
  }
  const content = fs.readFileSync(rulesPath, 'utf8')
  const block = managedBlock(content)
  if (!block) {
    return 'normal'
  }
  if (!content.slice(block.start, block.end).includes(LITE_DIRECTIVE)) {
    throw new Error('The managed Workflow Mode block has an unsupported directive.')
  }
  return 'lite'
}

export function setWorkflowMode(mode, projectRoot) {
  if (mode !== 'lite' && mode !== 'normal') {
    throw new Error('Usage: node scripts/set-workflow-mode.js <lite|normal>')
  }

  const rulesPath = path.join(projectRoot, 'CLAUDE.md')
  const content = fs.readFileSync(rulesPath, 'utf8')
  const block = managedBlock(content)
  const newline = content.includes('\r\n') ? '\r\n' : '\n'
  const replacement =
    mode === 'lite'
      ? [START, '## Workflow Mode', '', LITE_DIRECTIVE, END, '', ''].join(newline)
      : ''
  const updated = block
    ? content.slice(0, block.start) + replacement + content.slice(block.end)
    : replacement + content

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
