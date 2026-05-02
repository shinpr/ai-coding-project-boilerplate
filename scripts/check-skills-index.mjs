#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LANGUAGES = ['en', 'ja']

function parseSkillsIndex(content) {
  const skills = {}
  const lines = content.split('\n')

  let currentSkill = null
  let inSections = false

  for (const line of lines) {
    const skillMatch = /^ {2}([\w-]+):\s*$/.exec(line)
    if (skillMatch) {
      currentSkill = skillMatch[1]
      skills[currentSkill] = { sections: [] }
      inSections = false
      continue
    }

    if (!currentSkill) continue

    if (/^ {4}sections:\s*$/.test(line)) {
      inSections = true
      continue
    }

    if (/^ {4}[\w-]+:/.test(line)) {
      inSections = false
      continue
    }

    if (inSections) {
      const itemMatch = /^ {6}- "(.*)"\s*$/.exec(line)
      if (itemMatch) {
        skills[currentSkill].sections.push(itemMatch[1])
      }
    }
  }

  return skills
}

function extractH2Headings(markdown) {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^## /, '').trim())
}

function diffArrays(expected, actual) {
  const max = Math.max(expected.length, actual.length)
  const mismatches = []
  for (let i = 0; i < max; i++) {
    if (expected[i] !== actual[i]) {
      mismatches.push({ index: i, expected: expected[i] ?? '<missing>', actual: actual[i] ?? '<missing>' })
    }
  }
  return mismatches
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function checkLanguage(lang) {
  const skillsDir = join(ROOT, '.claude', `skills-${lang}`)
  const indexPath = join(skillsDir, 'task-analyzer', 'references', 'skills-index.yaml')

  if (!(await exists(indexPath))) {
    return { lang, skipped: true, reason: `no skills-index.yaml at ${indexPath}`, failed: 0, total: 0, reports: [] }
  }

  const indexContent = await readFile(indexPath, 'utf8')
  const skills = parseSkillsIndex(indexContent)
  const skillNames = Object.keys(skills)

  if (skillNames.length === 0) {
    return {
      lang,
      skipped: false,
      failed: 1,
      total: 0,
      reports: [`[${lang}] check-skills-index: no skill entries parsed from skills-index.yaml — parser may be broken`],
    }
  }

  const reports = []
  let failed = 0

  for (const name of skillNames) {
    const skillMdPath = join(skillsDir, name, 'SKILL.md')
    let markdown
    try {
      markdown = await readFile(skillMdPath, 'utf8')
    } catch {
      reports.push(`[${lang}] ✗ ${name}: SKILL.md not found at ${skillMdPath} (yaml entry references a non-existent skill)`)
      failed++
      continue
    }

    const expected = skills[name].sections
    const actual = extractH2Headings(markdown)

    if (expected.length === 0) {
      reports.push(`[${lang}] ! ${name}: yaml has no sections listed (expected at least one to validate)`)
      failed++
      continue
    }

    const mismatches = diffArrays(expected, actual)
    if (mismatches.length === 0) {
      reports.push(`[${lang}] ✓ ${name}: ${expected.length} sections match`)
    } else {
      reports.push(`[${lang}] ✗ ${name}: ${mismatches.length} mismatch(es)`)
      for (const m of mismatches) {
        reports.push(`         [${m.index}] yaml: "${m.expected}"`)
        reports.push(`             md:   "${m.actual}"`)
      }
      failed++
    }
  }

  return { lang, skipped: false, failed, total: skillNames.length, reports }
}

async function main() {
  let totalFailed = 0
  let totalChecked = 0
  const allReports = []

  for (const lang of LANGUAGES) {
    const result = await checkLanguage(lang)
    if (result.skipped) {
      allReports.push(`[${lang}] skipped: ${result.reason}`)
      continue
    }
    allReports.push(...result.reports)
    totalFailed += result.failed
    totalChecked += result.total
  }

  for (const line of allReports) {
    console.log(line)
  }

  if (totalChecked === 0) {
    console.error('\ncheck-skills-index: no skills checked across any language')
    process.exit(1)
  }

  if (totalFailed > 0) {
    console.error(`\ncheck-skills-index: ${totalFailed} skill(s) failed`)
    console.error('Either update .claude/skills-<lang>/task-analyzer/references/skills-index.yaml to match the SKILL.md headings,')
    console.error('or update the SKILL.md headings to match the yaml. Order matters.')
    process.exit(1)
  }

  console.log(`\ncheck-skills-index: all ${totalChecked} skill(s) consistent across ${LANGUAGES.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
