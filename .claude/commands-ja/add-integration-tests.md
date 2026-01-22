---
name: add-integration-tests
description: Design Docを使用して既存バックエンドコードベースに統合/E2Eテストを追加
---

**コマンドコンテキスト**: 既存バックエンド実装へのテスト追加ワークフロー

**スコープ**: バックエンドのみ（acceptance-test-generatorはバックエンドのみ対応）

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」

**初動アクション**: ステップ0-8をTodoWriteに登録してから実行を開始。

**委譲理由**: オーケストレーターとして、レビュー・品質チェックを含む全てのステップを完遂させるために、必要なコンテキストを維持する必要がある。タスクファイルをコンテキスト境界とし、全ての作業をサブエージェントが担うことでこれを実現する。

**実行方法**:
- スケルトン生成 → acceptance-test-generatorに委譲
- タスクファイル作成 → オーケストレーターが作成（テスト、設計書の最小限情報のみ）
- テスト実装 → task-executorに委譲
- テストレビュー → integration-test-reviewerに委譲
- 品質チェック → quality-fixerに委譲

Design Docパス: $ARGUMENTS

## 前提条件
- Design Docが存在すること（手動またはreverse-engineerで作成）
- テスト対象の既存実装があること

## 実行フロー

### ステップ0: スキル実行

スキル実行: documentation-criteria（ステップ3のタスクファイルテンプレート用）

### ステップ1: Design Doc検証

```bash
# Design Docの存在確認
ls $ARGUMENTS || ls docs/design/*.md | grep -v template | tail -1
```

### ステップ2: スケルトン生成

Taskツールでacceptance-test-generatorを呼び出す:
- `subagent_type`: "acceptance-test-generator"
- `description`: "テストスケルトン生成"
- `prompt`: "[ステップ1のパス]のDesign Docからテストスケルトンを生成"

**期待される出力**: `generatedFiles`（統合テストとE2Eのパスを含む）

### ステップ3: タスクファイル作成 [GATE]

タスクファイル作成先: `docs/plans/tasks/integration-tests-YYYYMMDD.md`

**テンプレート**:
```markdown
---
name: [機能名]の統合テスト実装
type: test-implementation
---

## 目的

スケルトンファイルに定義されたテストケースを実装する。

## 対象ファイル

- スケルトン: [ステップ2のgeneratedFilesのパス]
- Design Doc: [ステップ1のパス]

## タスク

- [ ] スケルトンの各テストケースを実装
- [ ] 全テストがパスすることを確認
- [ ] カバレッジが要件を満たすことを確認

## 受入条件

- 全スケルトンテストケースが実装済み
- 全テストがパス
- 品質チェック全項目パス
```

**出力**: "タスクファイルを[パス]に作成しました。ステップ4へ進む準備完了。"

### ステップ4: テスト実装

Taskツールでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "統合テスト実装"
- `prompt`: "タスクファイル: docs/plans/tasks/integration-tests-YYYYMMDD.md。タスクファイルに従ってテストを実装。"

**期待される出力**: `status`, `testsAdded`

### ステップ5: テストレビュー

Taskツールでintegration-test-reviewerを呼び出す:
- `subagent_type`: "integration-test-reviewer"
- `description`: "テスト品質レビュー"
- `prompt`: "テスト品質をレビュー。テストファイル: [ステップ4のtestsAdded]。スケルトンファイル: [ステップ2のgeneratedFiles]"

**期待される出力**: `status` (approved/needs_revision), `requiredFixes`

### ステップ6: レビュー修正の適用

ステップ5の結果を確認:
- `status: approved` → 完了としてマーク、ステップ7へ進む
- `status: needs_revision` → requiredFixesでtask-executorを呼び出し、ステップ5に戻る

Taskツールでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "レビュー指摘の修正"
- `prompt`: "テストファイルの以下の問題を修正: [ステップ5のrequiredFixes]"

### ステップ7: 品質チェック

Taskツールでquality-fixerを呼び出す:
- `subagent_type`: "quality-fixer"
- `description`: "最終品質保証"
- `prompt`: "このワークフローで追加されたテストファイルの最終品質保証。全テストを実行しカバレッジを確認。"

**期待される出力**: `approved` (true/false)

### ステップ8: コミット

quality-fixerから`approved: true`の場合:
- Bashで適切なメッセージを付けてテストファイルをコミット
