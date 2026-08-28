---
description: Design Docを使用して既存コードベースに統合テスト/E2Eテストを追加
---

**明示的なユーザー指示**: ユーザーは、このレシピに記載されたすべてのサブエージェント呼び出しを明示的に指示し、許可している。前提条件を満たした呼び出しはすべて実行する。

Agentプロンプト、ハンドオフ、生成成果物を書く前に、Skillツールで`llm-friendly-context`スキルを実行する。
ワークフローの判断、エージェントの呼び出し、検出事項の裁定を行う前に、`subagents-orchestration-guide`スキルを実行する。

**コマンドの用途**: 既存実装にテストを追加するワークフロー（バックエンド、フロントエンド、フルスタック）

## オーケストレーターの定義

**役割**: 「私はオーケストレーターである」

**実行ゲート**: テストを生成したレイヤーごとにStep 1〜7を順番に実行する。現在のステップが定める出力または応答条件を満たしてから次へ進む。すべてのレイヤーでレビュー、品質保証、コミット、保持した検証不足の再試行が完了した後に、完了を報告する。

**実行方法**:
- スケルトン生成 → acceptance-test-generatorに委譲
- テスト実装 → task-executorに委譲
- テストレビュー → integration-test-reviewerに委譲
- 品質チェック → quality-fixerに委譲

ドキュメントパス: $ARGUMENTS

## 前提条件

- Design Docが1つ以上存在すること（手動作成またはreverse-engineerで作成）
- テスト対象の実装が存在すること

## 実行フロー

### Step 1: ドキュメントの探索と検証

`$ARGUMENTS`で明示されたパスを、移動・リネーム後のパスも含めてすべて解決する。続けて、リポジトリのドキュメント配置とメタデータから、関連するDesign DocとUI Specを探す。`docs/design/`と`docs/ui-spec/`は探索の手掛かりであり、必須の配置ではない。

見つかったドキュメントは、宣言されたスコープと内容から分類する:
- バックエンドの契約、永続化、サービスの責務 → **Design Doc（バックエンド）**
- コンポーネント、UI状態、ブラウザ上の振る舞い、フロントエンドの責務 → **Design Doc（フロントエンド）**
- 画面、状態、操作の仕様を担う → **UI Spec**（任意）
- 責務が1つでレイヤーが曖昧 → **単一レイヤーのDesign Doc**（参照コードとリポジトリ上の責務からexecutorを決める）

ユーザーが明示したドキュメントと、それらが参照する意味上関連した成果物を使用する。複数の妥当なドキュメント集合またはexecutorの選択によって生成するテストが実質的に変わる場合に限り、ユーザーに確認する。

読み込めるDesign Docと、その受け入れ済みの振る舞いを特定した後に、スケルトン生成へ進む。

### Step 2: スケルトン生成

Design Docごとにacceptance-test-generatorを1回呼び出す:
- `subagent_type`: "acceptance-test-generator"
- `description`: "[レイヤー/名称]のテストスケルトン生成"
- `prompt`: "[パス]のDesign Docからテストスケルトンを生成する。" + UI Specがある場合: "[UI Specのパス]を追加のコンテキストとして利用できる。"

**呼び出しごとの期待出力**: 生成したスケルトンのパスを含む`generatedFiles[]`。空のリストは、そのDesign Docに追加の統合テスト/E2Eテストによる証明が不要なことを示す。

すべての結果が空なら、追加の統合テスト/E2Eテストによる証明が不要であることを報告して終了する。

### Step 3: テスト実装

スケルトンを生成したレイヤーごとに現在の`HEAD`を`diffBase`として記録し、該当するexecutorを呼び出す:
- バックエンドまたは単一レイヤーのバックエンド → `subagent_type`: "task-executor"
- フロントエンド → `subagent_type`: "task-executor-frontend"
- `description`: "統合テストを実装"
- `direct_scope`: 該当レイヤーで生成されたスケルトンが定義するすべてのテストを実装する
- `governing_sources`: 該当レイヤーのDesign Doc、該当するUI Spec、生成されたスケルトンのパス
- `target_paths`: 生成されたテストパスと、リポジトリから特定した既存のセットアップまたはフィクスチャのパス
- `observable_verification`: 実装したテストを実行し、各スケルトンの主張を宣言された境界で検証する

1つのレイヤーでStep 3→4→5→6→7を完了してから、次のレイヤーへ進む。

**期待出力**: `status`、`testsAdded`、`runnableCheck`

executorの呼び出しごとに「専門エージェントの結果の受理」を適用する。応答とリポジトリの状態から、変更された統合テスト/E2Eテストが1つ以上確認できたらStep 4へ進む。前進できる行動が残っている間は実装を続ける。

### Step 4: テストレビュー

integration-test-reviewerを呼び出す:
- `subagent_type`: "integration-test-reviewer"
- `description`: "テスト品質をレビュー"
- `testFile`: 変更を確認した統合テスト/E2Eテストのパス
- `diffBase`: Step 3の前に記録したリビジョン
- `designDocPath`: 該当レイヤーのDesign Doc
- 変更されたテストファイル内にスケルトンの注釈がない場合は、レビュー対象の主張として生成されたスケルトンのパスをプロンプトに記載する

**期待出力**: `status`（`approved`、`needs_revision`、`blocked`）、`qualityIssues[]`。修正後の再レビューでは、該当する場合に`prior_feedback_reconciliation`も返す。

### Step 5: レビュー修正の適用

Step 4の結果で分岐する:
- `approved` → Step 6へ進む
- `blocked` → 専門エージェントの結果の受理を適用する
- `needs_revision` → レビュー裁定を適用し、Step 3と同じスコープに`apply`としたquality-issueオブジェクト一式を`correction_findings`として加えて同じexecutorを再実行し、`prior_feedback`を渡してStep 4へ戻る

### Step 6: 品質チェック

現在のレイヤーに対応するquality-fixerを呼び出す:
- バックエンドまたは単一レイヤーのバックエンド → `subagent_type`: "quality-fixer"
- フロントエンド → `subagent_type`: "quality-fixer-frontend"
- `description`: "最終品質保証"
- `direct_scope`: Step 3のdirect scopeと対象パスを再利用する
- `runnableCheck`: 最新のexecutor結果にある`runnableCheck`
- `prompt`: "このワークフローで追加したテストに適用される、リポジトリで設定済みの品質チェックをすべて実行し、意図した観測可能な振る舞いを検証する。"

**期待出力**: `status`（`approved`、`stub_detected`、`verification_incomplete`、`blocked`）

結果で分岐する:
- `stub_detected` → `incompleteImplementations`を変更せずStep 3へ戻し、Step 3→4→5→6を再実行する
- `blocked` → 専門エージェントの結果の受理を適用する
- `verification_incomplete` → 結果全体を「専門エージェントの結果の受理」にある再試行まで保持し、Step 7へ進む
- `approved` → Step 7へ進む

### Step 7: コミットと検証不足の再試行

quality-fixerが`approved`または`verification_incomplete`を返したら、リポジトリの通常のコミット境界とメッセージ規約に従って、完成したテスト変更をコミットする。

すべてのレイヤーがクリーンなコミット境界に到達した後、同じレイヤーのquality-fixer入力で「専門エージェントの結果の受理」にある証明不足の再試行を適用する。`approved`なら証明不足を解消し、`stub_detected`ならStep 3〜6へ戻し、`verification_incomplete`が再度返った場合は完了報告に残してワークフローを続ける。

完了報告には、再試行後も残った検証不足と、`decline`とした対応可能な検出事項がある場合に、それぞれのID、正典上の理由、エビデンスを記載する。

## サブエージェントのスコープ境界

このレシピから呼び出すすべてのサブエージェントプロンプトに、次のブロックを追加する:

```
サブエージェントのスコープ境界:
受け入れ済みのテストによる証明を、その責務を持つリポジトリ全体で一貫して完成させる。
参照パスは調査の開始地点として扱い、同じ証明に必要な場合はテストハーネスの補助ファイルも含める。
割り当てられた進捗フィールドを除き、正典となる成果物は読み取り専用とする。
確認済みの成果、将来状態の要件、対象外を同時には維持できない場合は要件変更検知へ戻り、不可逆な外部操作が必要な場合は承認を求める。
```
