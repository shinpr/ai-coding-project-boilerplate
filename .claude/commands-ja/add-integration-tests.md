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

`$ARGUMENTS`で明示された各パスを、移動または改名されたものも含めて解決する。その後、リポジトリのドキュメント配置とメタデータを調べ、関連するDesign DocとUI Specを探す。慣例的な`docs/design/`と`docs/ui-spec/`は、必須のレイアウトではなく探索の手掛かりとして扱う。

見つかったドキュメントは、宣言されたスコープと内容から分類する:
- backend契約、永続化、service責務 → **Design Doc（バックエンド）**
- component、UI状態、ブラウザ上の振る舞い、frontend責務 → **Design Doc（フロントエンド）**
- 画面、状態、インタラクションの仕様を持つ責務 → **UI Spec**（任意）
- 責務は1つだがレーンが曖昧 → **単一レイヤーのDesign Doc**（参照先コードとリポジトリ上の責務からexecutor laneを解決）

ユーザーが明示したドキュメントと、そこから参照される意味上関連した成果物を用いて続行する。複数の妥当なドキュメント集合またはexecutor laneによって生成するテストが実質的に変わる場合に限り、確認を求める。

ステップ1で読み取り可能な Design Doc を確定し、その受け入れ済みの振る舞いを特定した後にスケルトン生成を開始する。

### ステップ2: スケルトン生成

**Design Docごとに**acceptance-test-generatorを呼び出す（エージェントは単一のdesignDocPathを前提とするため）:

各Design Docに対して:
- `subagent_type`: "acceptance-test-generator"
- `description`: "[レイヤー/名称]のテストスケルトン生成"
- `prompt`: "[パス]のDesign Docからテストスケルトンを生成。" + UI Specが存在する場合: "[UI Specパス]のUI Specを追加コンテキストとして利用可能。"

**呼び出しごとの期待出力**: 出力したスケルトンのパスを含む `generatedFiles[]`

### ステップ3: タスクファイル作成 [GATE]

**事前確認**: ステップ2 の各呼び出し結果について `generatedFiles[]` を検査する:
- 出力されたファイルを含む → 該当レイヤーのタスク作成へ進む
- 空である → 既存テストまたはより低コストなテストで受け入れ済みの証明義務を満たせるため、該当レイヤーのタスク作成をスキップする
- すべての結果が空である → ステップ4〜7 を完全にスキップし、追加の統合/E2E証明成果物は不要であると報告して終了する

生成ファイルがあるレイヤーごとに1つのタスクファイルを作成する。monorepo-flow.mdの命名規則に従い、エージェントルーティングを決定的にする:
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

- スケルトン: [ステップ2で該当レイヤーのgeneratedFilesに含まれる全パス]

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
- `prompt`: "テスト品質をレビュー。テストファイル: [ステップ4のtestsAdded]。taskFiles: [ステップ4で使用したものと同じタスクファイルパス]。diffBase: HEAD。スケルトンファイル: [ステップ2で現在のレイヤーのgeneratedFilesに含まれる全パス]"

**期待される出力**: `status`（approved/needs_revision/blocked）、`blockingReason`、および唯一の修正リストである `qualityIssues[]`

### ステップ6: レビュー修正の適用

ステップ5の結果を `status` で分岐して確認:
- `approved` → 完了としてマーク、ステップ7へ進む
- `needs_revision` → レビュー裁定を適用し、`apply` の quality-issue オブジェクト一式を渡してルーティング先の task-executor を **Fix Mode** で再起動する。その後ステップ5に戻る
- `blocked` → 現在のdiffから移動・リネームされたテストパスを解決し、修正後の入力でレビュー対象が変わる場合は再実行する。executorが読み取り可能な変更テストを生成していない場合はステップ4に戻って実装結果を是正し、それ以外はレビューを未実行として `blockingReason` を記録してステップ7へ進む

タスクファイル名パターンでルーティングしてtask-executorを呼び出す:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "レビュー指摘の修正"
- `prompt`: "task_file: [ステップ4で使用したのと同じタスクファイルパス]。requiredFixes: [ステップ5の `apply` の quality-issue オブジェクト一式。処理方針のみ付加して逐語でコピー]。Fix Mode を適用（タスクのチェックボックスはステップ4で既に `[x]` になっている）。"

### ステップ7: 品質チェック

タスクファイル名パターンでルーティングしてquality-fixerを呼び出す:
- `*-backend-task-*` → `subagent_type`: "quality-fixer"
- `*-frontend-task-*` → `subagent_type`: "quality-fixer-frontend"
- `description`: "最終品質保証"
- `prompt`: "現在の未コミットのワークツリー全体に対する最終品質保証。該当する全チェックを実行する。task_file: [タスクファイルパス]。"

**期待される出力**: `status` (approved/stub_detected/blocked)

quality-fixer レスポンスをチェック:
- `stub_detected` → ステップ4 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor を **Fix Mode** で再起動し、ステップ4→5→6→7 を再実行
- `blocked` → quality-fixerが報告した、ユーザーが持つ判断をエスカレーションする
- `approved` → ステップ8へ

### ステップ8: コミット

quality-fixer の `approved` を受けて、完了したテストタスクをコミットする。

### ステップ9: 最終クリーンアップ

すべてのタスクファイルが処理されコミットされた後、本レシピが作成したタスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- 本実行で作成された `docs/plans/tasks/integration-tests-backend-task-*.md` および `docs/plans/tasks/integration-tests-frontend-task-*.md` に該当するすべてのファイルを削除する

ファイルシステムエラーによってタスクファイルが残った場合は、そのクリーンアップ失敗を記録したうえで完了処理を続ける。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
受け入れ済みのテスト証明を、それを担うリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱い、同じ証明に必要なテスト基盤の関連ファイルを含める。
割り当てられた進捗フィールドを除き、出典となる成果物は読み取り専用とする。
進行にプロダクト成果、公開契約、主要設計、権限、または不可逆操作に関するユーザー判断が必要な場合はエスカレーションする。
```
