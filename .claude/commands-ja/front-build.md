---
description: フロントエンド実装を自律実行モードで実行
---

**コマンドコンテキスト**: オーケストレーターとして、フロントエンド実装の自律実行モードの完遂を自己完結します。

作業計画: $ARGUMENTS

## 📋 実行前提条件

### タスクファイル存在チェック
```bash
# 作業計画書を確認
! ls -la docs/plans/*.md | grep -v template | tail -5

# タスクファイルを確認
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ タスクファイルが見つかりません"
```

### タスク生成判定フロー

**THINK DEEPLY AND SYSTEMATICALLY**: タスクファイルの存在状態を分析し、必要な正確なアクションを決定：

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | tasks/ディレクトリに.mdファイルあり | 自律実行へ進む |
| タスクなし+計画あり | 計画書は存在するがタスクファイルなし | ユーザー確認 → task-decomposer実行 |
| どちらもなし | 計画書もタスクファイルもなし | エラー: 前提条件未達成 |

## 🔄 タスク分解フェーズ（条件付き）

タスクファイルが存在しない場合：

### 1. ユーザー確認
```
タスクファイルが見つかりません。
作業計画: docs/plans/[plan-name].md

作業計画からタスクを生成しますか？ (y/n):
```

### 2. タスク分解（承認された場合）
```
@task-decomposer 作業計画を読み込み、アトミックなタスクに分解：
- 入力: docs/plans/[plan-name].md
- 出力: docs/plans/tasks/ 配下の個別タスクファイル
- 粒度: 1タスク = 1コミット = 独立実行可能
```

### 3. 生成確認
```bash
# 生成されたタスクファイルを確認
! ls -la docs/plans/tasks/*.md | head -10
```

✅ **必須**: タスク生成後、自動的に自律実行へ進む
❌ **禁止**: タスク生成なしで実装開始

## 🧠 各タスクのメタ認知 - フロントエンド特化

**必須実行サイクル**: `task-executor-frontend → quality-fixer-frontend → commit`

### サブエージェント呼び出し方法
Taskツールを使用してサブエージェントを呼び出す：
- `subagent_type`: エージェント名
- `description`: タスクの簡潔な説明（3-5語）
- `prompt`: 具体的な指示内容

### 構造化レスポンス仕様
各サブエージェントはJSON形式で応答：
- **task-executor-frontend**: status, filesModified, testsAdded, readyForQualityCheck
- **quality-fixer-frontend**: status, checksPerformed, fixesApplied, approved

### 各タスクの実行フロー

各タスクで実行：

1. **task-executor-frontend使用**: フロントエンド実装を実行
   - 呼び出し例: `subagent_type: "task-executor-frontend"`, `description: "タスク実行"`, `prompt: "タスクファイル: docs/plans/tasks/[ファイル名].md 実装を実行"`
2. **構造化レスポンス処理**: `readyForQualityCheck: true` 検出時 → 即座にquality-fixer-frontend実行
3. **quality-fixer-frontend使用**: 全品質チェック実行（Biome、TypeScriptビルド、テスト）
   - 呼び出し例: `subagent_type: "quality-fixer-frontend"`, `description: "品質チェック"`, `prompt: "全てのフロントエンド品質チェックと修正を実行"`
4. **コミット実行**: `approved: true`確認後、即座にgit commitを実行

### 自律実行中の品質保証（詳細）
- task-executor-frontend実行 → quality-fixer-frontend実行 → **私（メインAI）がコミット実行**（Bashツール使用）
- quality-fixer-frontendの`approved: true`確認後、即座にgit commitを実行
- changeSummaryをコミットメッセージに使用

**THINK DEEPLY**: 例外なく全ての構造化レスポンスを監視し、全ての品質ゲートが通過することを確保。

! ls -la docs/plans/*.md | head -10

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## 出力例
フロントエンド実装フェーズ完了。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装タスク: [件数] タスク
- 品質チェック: 全てパス（Biome、TypeScriptビルド、テスト）
- コミット: [件数] コミット作成

**重要**: このコマンドは、タスク分解から完了までのフロントエンド実装全体の自律実行フローを管理します。フロントエンド特化エージェント（task-executor-frontend、quality-fixer-frontend）を自動使用します。
