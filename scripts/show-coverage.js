#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const coverageFile = path.join(__dirname, '..', 'coverage', 'coverage-final.json')

if (!fs.existsSync(coverageFile)) {
  console.error('❌ カバレッジレポートが見つかりません。')
  console.error('   先に npm run test:coverage を実行してください。')
  process.exit(1)
}

try {
  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
  
  let totalStatements = 0
  let coveredStatements = 0
  let totalBranches = 0
  let coveredBranches = 0
  let totalFunctions = 0
  let coveredFunctions = 0
  let totalLines = 0
  let coveredLines = 0

  Object.values(coverage).forEach(file => {
    totalStatements += file.s ? Object.keys(file.s).length : 0
    coveredStatements += file.s ? Object.values(file.s).filter(count => count > 0).length : 0
    
    totalBranches += file.b ? Object.values(file.b).flat().length : 0
    coveredBranches += file.b ? Object.values(file.b).flat().filter(count => count > 0).length : 0
    
    totalFunctions += file.f ? Object.keys(file.f).length : 0
    coveredFunctions += file.f ? Object.values(file.f).filter(count => count > 0).length : 0
    
    totalLines += file.l ? Object.keys(file.l).length : 0
    coveredLines += file.l ? Object.values(file.l).filter(count => count > 0).length : 0
  })

  const statementsCoverage = totalStatements > 0 ? ((coveredStatements / totalStatements) * 100).toFixed(2) : '0.00'
  const branchesCoverage = totalBranches > 0 ? ((coveredBranches / totalBranches) * 100).toFixed(2) : '0.00'
  const functionsCoverage = totalFunctions > 0 ? ((coveredFunctions / totalFunctions) * 100).toFixed(2) : '0.00'
  const linesCoverage = totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(2) : '0.00'

  console.log('\n📊 テストカバレッジサマリー')
  console.log('═══════════════════════════════════════')
  console.log(`  Statements : ${statementsCoverage.padStart(6)}% (${coveredStatements}/${totalStatements})`)
  console.log(`  Branches   : ${branchesCoverage.padStart(6)}% (${coveredBranches}/${totalBranches})`)
  console.log(`  Functions  : ${functionsCoverage.padStart(6)}% (${coveredFunctions}/${totalFunctions})`)
  console.log(`  Lines      : ${linesCoverage.padStart(6)}% (${coveredLines}/${totalLines})`)
  console.log('═══════════════════════════════════════')

  // 80%の目標に対する判定
  const allMetrics = [
    parseFloat(statementsCoverage),
    parseFloat(branchesCoverage),
    parseFloat(functionsCoverage),
    parseFloat(linesCoverage)
  ]
  
  const failedMetrics = allMetrics.filter(metric => metric < 80).length

  if (failedMetrics === 0) {
    console.log('\n✅ すべての指標が目標の80%を達成しています！')
  } else {
    console.log('\n⚠️  目標の80%に達していない指標があります。')
    console.log('   詳細は coverage/index.html を確認してください。')
  }
  console.log()

} catch (error) {
  console.error('❌ カバレッジレポートの読み込みに失敗しました:', error.message)
  process.exit(1)
}