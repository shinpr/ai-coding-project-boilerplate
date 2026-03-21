---
description: フロントエンド実装を自律実行モードで実行
---

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行方法**:
- タスク分解 → task-decomposerが実行
- フロントエンド実装 → task-executor-frontendが実行
- 品質チェックと修正 → quality-fixer-frontendが実行
- コミット → オーケストレーター（Bashツール）

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡します。

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をもってバッチ承認とする

**重要**: 全てのコミット前にquality-fixer-frontendを実行。

作業計画: $ARGUMENTS

## 実行前提条件

### タスクファイル存在チェック
```bash
# 作業計画書を確認
! ls -la docs/plans/*.md | grep -v template | tail -5

# タスクファイルを確認
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ タスクファイルが見つかりません"
```

### タスク生成判定フロー

タスクファイルの存在状態を分析し、必要なアクションを決定:

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | tasks/ディレクトリに.mdファイルあり | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし+計画あり | 計画書は存在するがタスクファイルなし | ユーザー確認 → task-decomposer実行 |
| どちらもなし | 計画書もタスクファイルもなし | エラー: 前提条件未達成 |

## タスク分解フェーズ（条件付き）

タスクファイルが存在しない場合：

### 1. ユーザー確認
```
タスクファイルが見つかりません。
作業計画: docs/plans/[plan-name].md

作業計画からタスクを生成しますか？ (y/n):
```

### 2. タスク分解（承認された場合）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画をタスクに分解"
- `prompt`: "作業計画を読み込み、アトミックなタスクに分解。入力: docs/plans/[plan-name].md。出力: docs/plans/tasks/配下に個別タスクファイル。粒度: 1タスク = 1コミット = 独立実行可能"

### 3. 生成確認
```bash
# 生成されたタスクファイルを確認
! ls -la docs/plans/tasks/*.md | head -10
```

✅ **フロー**: タスク生成 → 自律実行（この順序で実行）

## 実行前チェックリスト

- [ ] docs/plans/tasks/にタスクファイルが存在することを確認
- [ ] タスクの実行順序（依存関係）を特定
- [ ] **環境チェック**: タスク単位のコミットサイクルを実行可能か？
  - コミット機能が利用不可 → 自律実行モード前にエスカレーション
  - その他の環境（テスト、品質ツール） → サブエージェントがエスカレーション

## タスク実行サイクル（4ステップサイクル） - フロントエンド特化

**必須実行サイクル**: `task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit`

### サブエージェント呼び出し方法
Agentツールを使用してサブエージェントを呼び出す：
- `subagent_type`: エージェント名
- `description`: タスクの簡潔な説明（3-5語）
- `prompt`: 具体的な指示内容

### 構造化レスポンス仕様
各サブエージェントはJSON形式で応答：
- **task-executor-frontend**: status, filesModified, testsAdded, requiresTestReview, readyForQualityCheck
- **integration-test-reviewer**: status (approved/needs_revision/blocked), requiredFixes
- **quality-fixer-frontend**: status, checksPerformed, fixesApplied, approved

### 各タスクの実行フロー

各タスクで必須：

1. **TaskCreateでタスク登録**: 作業ステップを登録。必ず含める: 最初に「スキル制約の確認」、最後に「スキル忠実度の検証」
2. **task-executor-frontend実行**: フロントエンド実装を実行
   - 呼び出し例: `subagent_type: "task-executor-frontend"`, `description: "タスク実行"`, `prompt: "タスクファイル: docs/plans/tasks/[ファイル名].md 実装を実行"`
3. **task-executor-frontendレスポンスチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer**を実行
     - `needs_revision` → `requiredFixes`を添えてステップ2に戻る
     - `approved` → ステップ4へ
   - `readyForQualityCheck: true` → ステップ4へ
4. **quality-fixer-frontend実行**: 全フロントエンド品質チェックと修正を実行
   - 呼び出し例: `subagent_type: "quality-fixer-frontend"`, `description: "品質チェック"`, `prompt: "全てのフロントエンド品質チェックと修正を実行"`
5. **コミット実行**: `approved: true`確認後、即座にgit commitを実行。`changeSummary`をコミットメッセージに使用。

**重要**: 例外なく全ての構造化レスポンスを監視し、全ての品質ゲートが通過することを確保。

## サブエージェント呼び出し時の制約

**全サブエージェントプロンプトの末尾に必須追加**:
```
【システム制約】
このエージェントはbuildスキルのスコープ内で動作します。オーケストレーターが提供したルールのみを使用してください。
```

自律的なサブエージェントの安定実行にはスコープ制約が必要です。全てのサブエージェントプロンプトにこの制約を必ず付加してください。

! ls -la docs/plans/*.md | head -10

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## Security Review（全タスク完了後）

全タスクサイクル完了後、完了レポートの前にsecurity-reviewerを実行:
1. **Agent tool** (subagent_type: "security-reviewer") → Design Docパスと実装ファイルリストを渡す
2. レスポンスを確認:
   - `approved` または `approved_with_notes` → 完了レポートへ（notesがあれば含める）
   - `needs_revision` → task-executor-frontendで`requiredFixes`を実行、quality-fixer-frontend実行後、security-reviewerを再実行
   - `blocked` → ユーザーにエスカレーション

## 出力例
フロントエンド実装フェーズ完了。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装タスク: [件数] タスク
- 品質チェック: 全てパス
- コミット: [件数] コミット作成
