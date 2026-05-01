---
description: オーケストレーターとして要件分析から実装まで完全サイクルを管理
---

**コマンドコンテキスト**: 実装の完全サイクル管理（要件分析→設計→計画→実装→品質保証）

subagents-orchestration-guideスキルの指針に従い、オーケストレーターとして振る舞います — 全作業をAgentツールでサブエージェントに委譲し、データを受け渡し、結果を報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）。

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

### 3. 設計フェーズ

requirement-analyzerの`crossLayerScope`がレイヤー横断（backend + frontend）を示す場合、subagents-orchestration-guideスキルのレイヤー横断オーケストレーションに従い、レイヤー別にDesign Docを作成する。

### 4. requirement-analyzer後に停止

ユーザーが質問に回答した時：
- 回答が`scopeDependencies.question`のいずれかに該当 → `impact`で規模変更をチェック
- 規模が変更 → 更新されたコンテキストでrequirement-analyzerを再実行
- `confidence: "confirmed"` または規模変更なし → 次のステップへ進む

### 5. 規模判定後：TaskCreateでフロー全ステップを登録（必須）

規模判定完了後、**subagents-orchestration-guideスキルの該当フロー全ステップをTaskCreateで登録**。最初に「ロード済みスキルから具体ルールを抽出」、最後に「抽出ルールを最終JSON前に検証」を必ず含める。登録後、TaskListを参照してフローを進める。

### 6. 次のアクション実行

**TaskListで次のpendingタスクを確認して実行**。

## 📋 subagents-orchestration-guideスキル準拠の実行

**実行前チェック（必須）**：
- [ ] subagents-orchestration-guideスキルの該当フローを確認した
- [ ] 現在の進捗位置を特定した
- [ ] 次のステップを明確にした
- [ ] 停止ポイントを認識した → **全ての停止ポイントでAskUserQuestionを使用**
- [ ] 各Design Doc作成前にcodebase-analyzerを含めた
- [ ] 各Design DocレビューでDesign Doc前にcode-verifierを含めた
- [ ] タスク実行後の4ステップサイクル（task-executor → エスカレーション判定・フォローアップ → quality-fixer → commit）を理解した

**フロー厳守**: subagents-orchestration-guideスキルの「自律実行中のタスク管理」に従い、TaskCreate/TaskUpdateで4ステップを管理する

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

加えて、サブエージェントから rule-advisor を呼び出すとシステムクラッシュを引き起こすため、全サブエージェントプロンプトの末尾に以下の制約も含める:
```
[Constraint] rule-advisor can only be used by Main AI
```

## 🎯 オーケストレーターとしての必須責務

### タスク実行品質サイクル
subagents-orchestration-guideスキルの「自律実行中のタスク管理」に従い、TaskCreate/TaskUpdateで以下のステップを管理：
1. **task-executor を呼び出す**: 実装を実行（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）
2. **task-executor レスポンスをチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行
     - `needs_revision` → ステップ1 に戻り、同じ `task_file` と `requiredFixes[]` 配列を入力として task-executor を **Fix Mode** で再起動
     - `approved` → ステップ3 へ
   - それ以外 → ステップ3 へ
3. **quality-fixer を呼び出す**: 全品質チェックと修正を実行（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）。`task_file` として現在のタスクファイルパス、`filesModified` として実装ステップの `filesModified` 配列を **必ず渡す**（未完成実装検出を当該タスクの実書き込み集合にスコープする。省略時は quality-fixer が `git diff HEAD` にフォールバック）
   - `stub_detected` → ステップ1 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor を **Fix Mode** で再起動
   - `blocked` → ユーザーにエスカレーション
   - `approved` → ステップ4 へ
4. **承認後コミット**: `approved` 確認後 → git commit を実行

### Security Review（全タスク完了後）

全タスクサイクル完了後、完了レポートの前にsecurity-reviewerを実行:
1. **Agent tool** (subagent_type: "security-reviewer") → Design Docパスと実装ファイルリストを渡す
2. レスポンスを確認:
   - `approved` または `approved_with_notes` → 完了レポートへ（notesがあれば含める）
   - `needs_revision` → task-template を用いて、統合修正タスクファイル（`docs/plans/tasks/security-fixes-YYYYMMDD.md`）を作成。Target Files には `requiredFixes[].location` を `file[:line]` として解釈してファイル部分のみ取り出した和集合を投入する（元タスクに依らず影響ファイルすべてが executor の File Scope Constraint に許可される）。続いて、`task_file` には新しい統合修正タスクファイルのパス、`requiredFixes` には `security-reviewer.requiredFixes[]` を設定して task-executor を **Fix Mode** で起動。その後 quality-fixer を実行し、最後に security-reviewer を再起動する。
   - `blocked` → ユーザーにエスカレーション

### テスト情報の伝達
acceptance-test-generator実行後、work-planner（subagent_type: "work-planner"）呼び出し時には以下を伝達：
- 統合テストファイルパス（`generatedFiles.integration`から取得）
- E2Eテストファイルパスまたはnull（`generatedFiles.e2e`から取得）
- E2E不在理由（`e2eAbsenceReason`、E2Eがnullの場合）
- 統合テストは実装と同時に作成、E2Eテストは全実装完了後に実行（E2Eパスが提供された場合）

## 実行方法

すべての作業はサブエージェント経由で実行する。
サブエージェントの選択はsubagents-orchestration-guideスキルに従う。
