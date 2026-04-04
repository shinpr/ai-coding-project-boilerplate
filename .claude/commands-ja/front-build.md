---
description: フロントエンド実装を自律実行モードで実行
---

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、成果物パスの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をもってバッチ承認とする
4. **スコープ**: 全タスクのコミット完了またはエスカレーションで責務完了

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
| どちらもなし＋Design Docあり | 計画書・タスクファイルなし、docs/design/*.mdあり | work-plannerでDesign Docから作業計画書を作成し、タスク分解へ進む |
| どちらもなし | 計画書・タスクファイル・Design Docすべてなし | 前提条件未達成をユーザーに報告して停止 |

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

**フロー**: タスク生成 → 自律実行（この順序で実行）

## 実行前チェックリスト

- [ ] docs/plans/tasks/にタスクファイルが存在することを確認
- [ ] タスクの実行順序（依存関係）を特定
- [ ] **環境チェック**: タスク単位のコミットサイクルを実行可能か？
  - コミット機能が利用不可 → 自律実行モード前にエスカレーション
  - その他の環境（テスト、品質ツール） → サブエージェントがエスカレーション

## タスク実行サイクル（4ステップサイクル）
**必須実行サイクル**: `task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit`

各タスクで必須：
1. **TaskCreateでタスク登録**: 作業ステップを登録。必ず含める: 最初に「スキル制約の確認」、最後に「スキル忠実度の検証」
2. **Agent tool** (subagent_type: "task-executor-frontend") → タスクファイルパスをpromptに渡し、構造化レスポンスを受け取る
3. **task-executor-frontendレスポンスチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer**を実行
     - `needs_revision` → `requiredFixes`を添えてステップ2に戻る
     - `approved` → ステップ4へ
   - `readyForQualityCheck: true` → ステップ4へ
4. **quality-fixer-frontend実行**: 全品質チェックと修正を実行
5. **承認後コミット**: quality-fixer-frontendの`approved: true`確認後 → git commitを実行

**重要**: 全てのサブエージェントレスポンスのstatusフィールドをパースし、4ステップサイクルの対応ブランチを実行。quality-fixer-frontendが`approved: true`を返すまで次のタスクに進まない。

## サブエージェント呼び出し時の制約

**全サブエージェントプロンプトの末尾に必須追加**:
```
【システム制約】
このエージェントはbuildスキルのスコープ内で動作します。オーケストレーターが提供したルールのみを使用してください。
```

自律的なサブエージェントの安定実行にはスコープ制約が必要です。全てのサブエージェントプロンプトにこの制約を必ず付加してください。

! ls -la docs/plans/*.md | head -10

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## 実装後検証（全タスク完了後）

全タスクサイクル完了後、完了レポートの前に検証エージェントを**並列実行**:

1. **両方を並列で実行** (Agent tool):
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`、Design Docパス、`code_paths`: 実装ファイルリスト（`git diff --name-only main...HEAD`）
   - security-reviewer (subagent_type: "security-reviewer") → Design Docパス、実装ファイルリスト

2. **結果の統合** — 合格/不合格の基準はsubagents-orchestration-guideの実装後検証セクション参照。統合検証レポートをユーザーに提示。

3. **修正サイクル**（いずれかの検証エージェントが不合格の場合、最大2回）:
   - 全ての対応可能な検出事項を1つのタスクファイルに統合
   - task-executor-frontendで統合修正を実行 → quality-fixer-frontend
   - 不合格の検証エージェントのみ再実行
   - 2回のサイクル後も不合格が残る場合 → 残存する検出事項とともにユーザーにエスカレーション

4. **全て合格** → 完了レポートへ

## 出力例
フロントエンド実装フェーズ完了。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装タスク: [件数] タスク
- 品質チェック: 全てパス
- コミット: [件数] コミット作成
