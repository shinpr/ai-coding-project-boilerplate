---
name: add-integration-tests
description: Design Docを使用して既存バックエンドコードベースに統合/E2Eテストを追加
---

**コマンドコンテキスト**: 既存バックエンド実装へのテスト追加ワークフロー

**スコープ**: バックエンドのみ（acceptance-test-generatorはバックエンドのみ対応）

## 実行方法

- スケルトン生成 → acceptance-test-generatorが実行
- タスクファイル作成 → タスクテンプレートに従う（documentation-criteriaスキル参照）
- テスト実装 → task-executorが実行
- テストレビュー → integration-test-reviewerが実行
- 品質チェック → quality-fixerが実行

オーケストレーターがサブエージェントを呼び出し、構造化JSONを受け渡す。

Design Docパス: $ARGUMENTS

**Think deeply** テスト追加の本質を理解して実行:

## 前提条件
- Design Docが存在すること（手動またはreverse-engineerで作成）
- テスト対象の既存実装があること

## 実行フロー

### 1. Design Doc検証
```bash
# Design Docの存在確認
ls $ARGUMENTS || ls docs/design/*.md | grep -v template | tail -1
```

### 2. acceptance-test-generator実行
Design Docからテストスケルトンを生成:
- 受入条件（AC）を抽出
- 統合テストスケルトン生成（`*.int.test.ts`）
- 該当する場合はE2Eテストスケルトン生成（`*.e2e.test.ts`）

### 3. タスクファイル作成
タスクテンプレートに従ってタスクファイルを作成（documentation-criteriaスキル参照）:
- パス: `docs/plans/tasks/integration-tests-YYYYMMDD.md`
- 内容: 生成されたスケルトンに基づくテスト実装タスク
- 対象ファイルセクションにスケルトンファイルパスを含める

### 4. task-executor実行
タスクファイルに従ってテストを実装:
- TDD原則に従う（Red-Green-Refactor）
- 各スケルトンテストケースを実装
- テストを実行してパスを確認

### 5. integration-test-reviewer実行
テスト品質をレビュー:
- スケルトン準拠を確認
- テストカバレッジをチェック
- `needs_revision`の場合 → `requiredFixes`と共にステップ4に戻る
- `approved`の場合 → 品質チェックに進む

### 6. quality-fixer実行
最終品質保証:
- 全テストを実行
- カバレッジが要件を満たすことを確認
- 品質問題を修正

### 7. コミット
適切なメッセージでテストファイルをコミット。

## 委譲先
- acceptance-test-generator: スケルトン生成
- task-executor: テスト実装
- integration-test-reviewer: テスト品質レビュー
- quality-fixer: 最終品質チェック
