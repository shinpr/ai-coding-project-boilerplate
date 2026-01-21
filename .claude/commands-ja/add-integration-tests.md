---
name: add-integration-tests
description: Design Docを使用して既存バックエンドコードベースに統合/E2Eテストを追加
---

**コマンドコンテキスト**: 既存バックエンド実装へのテスト追加ワークフロー

**スコープ**: バックエンドのみ（acceptance-test-generatorはバックエンドのみ対応）

**Role**: オーケストレーター

**実行方法**:
- スケルトン生成 → acceptance-test-generatorに委譲
- タスクファイル作成 → オーケストレーターが直接作成
- テスト実装 → task-executorに委譲
- テストレビュー → integration-test-reviewerに委譲
- 品質チェック → quality-fixerに委譲

Design Docパス: $ARGUMENTS

**TodoWrite登録**: 各ステップを登録し、完了時に更新。

## 前提条件
- Design Docが存在すること（手動またはreverse-engineerで作成）
- テスト対象の既存実装があること

## 実行フロー

### 1. Design Doc検証（オーケストレーター）
```bash
# Design Docの存在確認
ls $ARGUMENTS || ls docs/design/*.md | grep -v template | tail -1
```

### 2. スケルトン生成

**Taskツールでの呼び出し**:
```
subagent_type: acceptance-test-generator
prompt: |
  Design Docからテストスケルトンを生成。

  Design Doc: [ステップ1のパス]

  出力:
  - 統合テストスケルトン (*.int.test.ts)
  - 該当する場合はE2Eテストスケルトン (*.e2e.test.ts)
```

**期待される出力**: `generatedFiles`（統合テストとE2Eのパスを含む）

### 3. タスクファイル作成（オーケストレーター）

タスクテンプレートに従ってタスクファイルを作成（documentation-criteriaスキル参照）:
- パス: `docs/plans/tasks/integration-tests-YYYYMMDD.md`
- 内容: 生成されたスケルトンに基づくテスト実装タスク
- 対象ファイルセクションにステップ2の出力からスケルトンファイルパスを含める

### 4. テスト実装

**Taskツールでの呼び出し**:
```
subagent_type: task-executor
prompt: |
  タスクファイルに従ってテストを実装。

  タスクファイル: docs/plans/tasks/integration-tests-YYYYMMDD.md

  要件:
  - TDD原則に従う（Red-Green-Refactor）
  - 各スケルトンテストケースを実装
  - テストを実行してパスを確認
```

**期待される出力**: `status`, `testsAdded`

### 5. テストレビュー

**Taskツールでの呼び出し**:
```
subagent_type: integration-test-reviewer
prompt: |
  テスト品質をレビュー。

  テストファイル: [ステップ2のgeneratedFilesのパス]
  スケルトンファイル: [元のスケルトンパス]
```

**期待される出力**: `status` (approved/needs_revision), `requiredFixes`

**フロー制御**:
- `status: needs_revision` → `requiredFixes`と共にステップ4に戻る
- `status: approved` → ステップ6に進む

### 6. 品質チェック

**Taskツールでの呼び出し**:
```
subagent_type: quality-fixer
prompt: |
  テストファイルの最終品質保証。

  スコープ: このワークフローで追加されたテストファイル

  要件:
  - 全テストを実行
  - カバレッジが要件を満たすことを確認
  - 品質問題を修正
```

**期待される出力**: `approved` (true/false)

### 7. コミット（オーケストレーター）

quality-fixerから`approved: true`の場合:
- Bashで適切なメッセージを付けてテストファイルをコミット
