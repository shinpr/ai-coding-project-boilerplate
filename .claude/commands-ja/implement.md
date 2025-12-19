---
description: オーケストレーターとして要件分析から実装まで完全サイクルを管理
---

**コマンドコンテキスト**: 実装の完全サイクル管理（要件分析→設計→計画→実装→品質保証）

subagents-orchestration-guideスキルの指針に従い、オーケストレーターとして振る舞います。

## 実行判断フロー

### 1. 現在状況の判定
指示内容: $ARGUMENTS

**Think deeply** 現在の状況を判定：

| 状況パターン | 判定基準 | 次のアクション |
|------------|---------|-------------|
| 新規要件 | 既存作業なし、新しい機能/修正依頼 | requirement-analyzerから開始 |
| フロー継続 | 既存ドキュメント/タスクあり、継続指示 | subagents-orchestration-guideスキルのフローで次のステップを特定 |
| 品質エラー | エラー検出、テスト失敗、ビルドエラー | quality-fixer実行 |
| 不明瞭 | 意図が曖昧、複数の解釈が可能 | ユーザーに確認 |

### 2. 継続時の進捗確認
フロー継続の場合、以下を確認：
- 最新の成果物（PRD/ADR/Design Doc/作業計画書/タスク）
- 現在のフェーズ位置（要件/設計/計画/実装/品質保証）
- subagents-orchestration-guideスキルの該当フローで次のステップを特定

### 3. 規模判定後：TodoWriteにフロー全ステップを登録（必須）

規模判定完了後、**subagents-orchestration-guideスキルの該当フロー全ステップをTodoWriteに登録**。最初に「スキル制約の確認」、最後に「スキル忠実度の検証」を必ず含める。登録後、TodoWriteを参照してフローを進める。

### 4. 次のアクション実行

**TodoWriteの次のpendingタスクを実行**。

## 📋 subagents-orchestration-guideスキル準拠の実行

**実行前チェック（必須）**：
- [ ] subagents-orchestration-guideスキルの該当フローを確認した
- [ ] 現在の進捗位置を特定した
- [ ] 次のステップを明確にした
- [ ] 停止ポイントを認識した
- [ ] タスク実行後の4ステップサイクル（task-executor → エスカレーション判定・フォローアップ → quality-fixer → commit）を理解した

**フロー厳守**: subagents-orchestration-guideスキルの「自律実行中のタスク管理」に従い、TodoWriteで4ステップを管理する

## 🚨 サブエージェント呼び出し時の制約

サブエージェントからrule-advisorを呼び出すとシステムクラッシュが発生するため、プロンプト末尾に以下を含める：
```
【制約】rule-advisorはメインAIのみが使用可能です
```

## 🎯 オーケストレーターとしての必須責務

### タスク実行フロー
subagents-orchestration-guideスキルの「自律実行中のタスク管理」に従い、TodoWriteで以下の4ステップを管理：
1. task-executor実行
2. エスカレーション判定・フォローアップ
3. quality-fixer実行
4. git commit

### テスト情報の伝達
acceptance-test-generator実行後、work-planner呼び出し時には以下を伝達：
- 生成された統合テストファイルパス
- 生成されたE2Eテストファイルパス
- 統合テストは実装と同時、E2Eは全実装後に実行する旨の明示

## 責務境界

**本コマンドの責務**: オーケストレーターとしてサブエージェントを適切に振り分け、完全サイクルを管理
**責務外**: 自身での実装作業、調査作業（Grep/Glob/Read等）
