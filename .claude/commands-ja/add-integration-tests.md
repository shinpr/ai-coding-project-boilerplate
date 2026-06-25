---
description: Design Docを使用して既存コードベースに統合/E2Eテストを追加
---

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

**コマンドコンテキスト**: 既存実装へのテスト追加ワークフロー（バックエンド、フロントエンド、フルスタック対応）

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」

**初動アクション**: ステップ0-8をTaskCreateで登録してから実行を開始。

**委譲理由**: オーケストレーターのコンテキストは全ステップで共有される。直接実装するとレビューや品質チェックに必要なコンテキストを消費してしまう。タスクファイルをコンテキスト境界とし、サブエージェントが隔離されたコンテキストで作業することでこれを回避する。

**実行方法**:
- スケルトン生成 → acceptance-test-generatorに委譲
- タスクファイル作成 → オーケストレーターが作成（テスト、設計書の最小限情報のみ）
- テスト実装 → task-executorに委譲
- テストレビュー → integration-test-reviewerに委譲
- 品質チェック → quality-fixerに委譲

ドキュメントパス: $ARGUMENTS

## 前提条件

- Design Docが少なくとも1つ存在すること（手動またはreverse-engineerで作成）
- テスト対象の既存実装があること

## 実行フロー

### ステップ0: スキル実行

スキル実行: documentation-criteria（ステップ3のタスクファイルテンプレート用）

### ステップ1: ドキュメントの探索と検証

```bash
# ドキュメントパスが指定されているか確認
test -n "$ARGUMENTS" || { echo "ERROR: ドキュメントパスが指定されていません"; exit 1; }

# 指定パスの存在確認
ls $ARGUMENTS

# 追加ドキュメントの探索
ls docs/design/*.md 2>/dev/null | grep -v template
ls docs/ui-spec/*.md 2>/dev/null
```

探索されたドキュメントをファイル名で分類:
- ファイル名に`backend`を含む → **Design Doc（バックエンド）**
- ファイル名に`frontend`を含む → **Design Doc（フロントエンド）**
- `docs/ui-spec/`配下 → **UI Spec**（任意）
- 上記いずれにも該当しない → **単一レイヤーのDesign Doc**（レイヤーは下記のゲートで確定）

**[GATE] 分類結果を候補としてユーザーに提示し、続行前に確認を得る。** 自動探索で検出された無関係なドキュメントはユーザーが除外できる。単一レイヤーのDesign Docが検出された場合、バックエンドとフロントエンドのどちらを対象とするかユーザーに確認し、正しいエージェントルーティングを決定する。

### ステップ2: スケルトン生成

**Design Docごとに**acceptance-test-generatorを呼び出す（エージェントは単一のdesignDocPathを前提とするため）:

各Design Docに対して:
- `subagent_type`: "acceptance-test-generator"
- `description`: "[レイヤー/名称]のテストスケルトン生成"
- `prompt`: "[パス]のDesign Docからテストスケルトンを生成。" + UI Specが存在する場合: "[UI Specパス]のUI Specを追加コンテキストとして利用可能。"

**呼び出しごとの期待出力**: `generatedFiles`（統合テストとE2Eのパスを含む）

### ステップ3: タスクファイル作成 [GATE]

**事前確認**: ステップ2 の各呼び出し結果について `generatedFiles.integration` を検査する:
- `integration` がパス → 該当レイヤーのタスク作成へ進む
- `integration` が `null` → 該当レイヤーのタスク作成をスキップし、レイヤー名と生成エージェントの `e2eAbsenceReason`（該当時）を最終レポート用に記録
- 全レイヤーが `integration: null` を返した → ステップ4〜7 を完全にスキップし、「どのレイヤーでも統合テストスケルトンは生成されなかった」と各レイヤーの理由を添えて報告して終了

`integration` パスが非nullのレイヤーごとに1つのタスクファイルを作成。monorepo-flow.mdの命名規則に従い、エージェントルーティングを決定的にする:
- バックエンドのDesign Doc → `docs/plans/tasks/integration-tests-backend-task-YYYYMMDD.md`
- フロントエンドのDesign Doc → `docs/plans/tasks/integration-tests-frontend-task-YYYYMMDD.md`
- 単一レイヤー（バックエンド確定） → `docs/plans/tasks/integration-tests-backend-task-YYYYMMDD.md`
- 単一レイヤー（フロントエンド確定） → `docs/plans/tasks/integration-tests-frontend-task-YYYYMMDD.md`

**テンプレート**（タスクファイルごと）:
```markdown
---
name: [機能名]の[レイヤー]統合テスト実装
type: test-implementation
---

## Implementation Content

スケルトンファイルに定義されたテストケースを実装する。

## Target Files

- スケルトン: [ステップ2のgeneratedFilesからレイヤー別パス]

## Investigation Targets

- Design Doc: [ステップ1のレイヤー別Design Doc] — AC マッピングと契約定義の参照用

## Investigation Notes
（実装観察事項を実装開始前にここへ追記する。）

## Implementation Steps

- [ ] スケルトンの各テストケースを実装
- [ ] 全テストがパスすることを確認
- [ ] カバレッジが要件を満たすことを確認

## Completion Criteria

- 全スケルトンテストケースが実装済み
- 全テストがパス
- 品質チェック全項目パス
```

**出力**: "タスクファイルを[パス（複数の場合は全パス）]に作成しました。ステップ4へ進む準備完了。"

### ステップ4: テスト実装

ステップ3の各タスクファイルに対し、ファイル名パターンでルーティングしてtask-executorを呼び出す:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "統合テスト実装"
- `prompt`: "タスクファイル: [ステップ3のタスクファイルパス]。タスクファイルに従ってテストを実装。"

1つのタスクファイルにつきステップ4→5→6→7を完了してから次に進む。

**期待される出力**: `status`, `testsAdded`

### ステップ5: テストレビュー

Agentツールでintegration-test-reviewerを呼び出す:
- `subagent_type`: "integration-test-reviewer"
- `description`: "テスト品質レビュー"
- `prompt`: "テスト品質をレビュー。テストファイル: [ステップ4のtestsAdded]。スケルトンファイル: [ステップ2のgeneratedFilesから現在のタスクのレイヤーに該当するパス]"

**期待される出力**: `status` (approved/needs_revision), `requiredFixes`

### ステップ6: レビュー修正の適用

ステップ5の結果を確認:
- `status: approved` → 完了としてマーク、ステップ7へ進む
- `status: needs_revision` → ルーティング先の task-executor を **Fix Mode** で再起動。同じ `task_file` と `requiredFixes[]` を渡す（プロンプト詳細は下記）。その後ステップ5に戻る

タスクファイル名パターンでルーティングしてtask-executorを呼び出す:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "レビュー指摘の修正"
- `prompt`: "task_file: [ステップ4で使用したのと同じタスクファイルパス]。requiredFixes: [ステップ5の requiredFixes 配列]。Fix Mode を適用（タスクのチェックボックスはステップ4で既に `[x]` になっている）。"

### ステップ7: 品質チェック

タスクファイル名パターンでルーティングしてquality-fixerを呼び出す:
- `*-backend-task-*` → `subagent_type`: "quality-fixer"
- `*-frontend-task-*` → `subagent_type`: "quality-fixer-frontend"
- `description`: "最終品質保証"
- `prompt`: "このワークフローで追加されたテストファイルの最終品質保証。全テストを実行しカバレッジを確認。task_file: [タスクファイルパス]。filesModified: [直近の実装ステップのレスポンスから抽出 — 通常はステップ4、修正再実行が走った場合はステップ4とステップ6の和集合]。"

**期待される出力**: `status` (approved/stub_detected/blocked)

quality-fixer レスポンスをチェック:
- `stub_detected` → ステップ4 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor を **Fix Mode** で再起動し、ステップ4→5→6→7 を再実行
- `blocked` → ユーザーにエスカレーション
- `approved` → ステップ8 へ

### ステップ8: コミット

quality-fixer から `approved` の場合:
- Bash で適切なメッセージを付けてテストファイルをコミット

### ステップ9: 最終クリーンアップ

すべてのタスクファイルが処理されコミットされた後、本レシピが作成したタスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- 本実行で作成された `docs/plans/tasks/integration-tests-backend-task-*.md` および `docs/plans/tasks/integration-tests-frontend-task-*.md` に該当するすべてのファイルを削除する

タスクファイルを削除できない場合（ファイルシステムエラー）、失敗を報告するが完了をブロックしない。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
New files derived from the requested deliverable are in scope (e.g., test skeleton files specified by the recipe).
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
