---
description: 設計ドキュメントからフロントエンド作業計画書を作成し計画承認を取得
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

**コマンドコンテキスト**: このコマンドはフロントエンド計画フェーズ専用である。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全ての作業をサブエージェントに委譲** — サブエージェントを呼び出し、データを受け渡し、結果を報告する
2. **subagents-orchestration-guideスキルの計画フローに従う**:
   - 以下に定義されたステップを実行
   - **完了前に停止し、計画内容の承認を取得する**
3. **スコープ**: 下記スコープ境界を参照

**重要**: work-plannerの前に必ずacceptance-test-generatorを実行すること — テストスケルトンはsubagents-orchestration-guideの中規模/大規模フローで必須の入力。

## スコープ境界

**実行内容**:
- 設計書の選択
- acceptance-test-generatorによるテストスケルトン生成
- work-plannerによる作業計画書作成
- document-reviewerによる作業計画書レビュー
- 計画承認の取得

**責務境界**: このコマンドは作業計画書承認で責務完了。

以下の計画プロセスに従う:

## 実行プロセス

### Step 1: 設計ドキュメント選択
   - 明示された`$ARGUMENTS`のパスを、移動または改名されたものも含めて最初に解決する
   - それ以外では、リポジトリのドキュメント規約、宣言されたスコープ、component/UI責務からfrontend Design Docを探す
   - 複数の妥当なドキュメントによって異なる計画になる場合に限り、選択肢を提示する

### Step 2: テストスケルトン生成
Agentツールでacceptance-test-generatorを呼び出す:
- `subagent_type`: "acceptance-test-generator"
- `description`: "テストスケルトン生成"
- UI Specあり: `prompt: "[パス]のDesign Docからテストスケルトンを生成。UI Specは[ui-specパス]。"`
- UI Specなし: `prompt: "[パス]のDesign Docからテストスケルトンを生成。"`

生成されたパスを、subagents-orchestration-guideの「acceptance-test-generator → work-planner」セクションに従いwork-plannerに渡す。

### Step 3: 作業計画書作成
Agentツールでwork-plannerを呼び出す:
- `subagent_type`: "work-planner"
- `description`: "作業計画書作成"
- `generatedFiles[]` を `testSkeletons` として渡す。空のリストは、計画に追加の統合/E2Eスケルトンタスクが不要であることを示す。
- 配置ガイダンスを末尾に付加する: "統合テストは各フェーズ実装と同時に作成。fixture-e2eテストはUI機能フェーズと並行して作成。service-integration-e2eテストは必要なサービスが利用可能になった後に実行。"

- subagents-orchestration-guideのPrompt Construction Ruleに従い追加パラメータを構成

### Step 4: 作業計画書レビュー
document-reviewerを呼び出し作業計画書をレビューする:
- `subagent_type`: "document-reviewer"
- `description`: "作業計画書レビュー"
- `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md。作業計画書自身の実装スコープ、タスク、完了条件、依存関係、実行順序、引用アンカーの実在、実行可能な検証をレビューする。出典ソースは対象文書の Governing Documents から解決する。"
- 作業計画書はDesign Docの派生物であるため、計画の忠実性に関する指摘はユーザー入力なしで解消する。reviewerの `verdict.decision` で分岐する:
  - `needs_revision`: レビュー裁定を、修正再レビュー、上位の要件または権限に関する出口、収束に沿って回す。差し戻す修正には work-planner を update モードで用いる
  - `approved`、またはレビュー裁定が収束条件に達した場合: ステップ5へ進む
  - `rejected`: 上位の要件ゲートを適用する

### Step 5: 承認のための提示
- レビュー済みの作業計画書をユーザーにバッチ承認のため提示する。変更要望があればwork-plannerを修正パラメータで再実行し、ステップ4を再実行する。
- 未解決の技術的なエビデンスや外部依存を、影響するタスクと検証境界とともに記録する。確認済みの成果、将来状態の要件、対象外を、ユーザーの選択なしには同時に維持できない場合に限り、要件ゲートへ戻る

**スコープ**: 作業計画書作成と計画内容の承認取得まで。

## 完了時のレスポンス
計画内容承認後、以下の標準レスポンスで終了
```
フロントエンド計画フェーズ完了。
- 作業計画: docs/plans/[plan-name].md
- ステータス: 承認済み

実装は別途指示してください。
```
