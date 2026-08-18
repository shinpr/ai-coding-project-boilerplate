---
description: オーケストレーターとして要件分析から実装まで完全サイクルを管理
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

**コマンドコンテキスト**: 実装の完全サイクル管理（要件分析→設計→計画→実装→品質保証）

subagents-orchestration-guideスキルの指針に従い、オーケストレーターとして振る舞う。全作業をAgentツールでサブエージェントに委譲し、データを受け渡し、結果を報告する（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）。

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

オーケストレーターが `scopeEvidence.affectedLayers` からレイヤー横断（backend + frontend）と判断した場合、subagents-orchestration-guideスキルのレイヤー横断オーケストレーションに従う。

### 4. requirement-analyzer後に停止

`requestSignals`、`scopeEvidence`、`costEvidence`、`questions` を用いて requirement-convergence のヒアリングを実行する。収束記録と構造スケール（Structural Scale）を判定するのはオーケストレーターである。

ユーザーが質問に回答した時：
- 回答を収束記録に記録し、影響を受けたフィールドと構造スケールを再判定する
- requirement-analyzer を再実行するのは、回答が分析対象または必要なスコープエビデンスを変える場合のみとする
- 該当する収束フィールドがすべて `ready` または `weak-but-explicit` になったら次のステップへ進む

最終的な `convergence` 記録は、subagents-orchestration-guideスキルの収束記録の受け渡しに従い、各ドキュメント作成ステップへ引き継ぐ。

### 5. 適用フローの確定

Structural Scaleの判定後、その規模で適用される経路だけに従う。該当する設計、レビュー、承認、計画、実装、検証、クリーンアップ、報告の各フェーズをゲートとして扱う。現在のフェーズで定められたエビデンスまたは承認が存在する場合にのみ次へ進み、明記された条件が偽の場合にのみ分岐をスキップする。

### 6. 次のアクション実行

必要なエビデンスがまだ存在しない、最も早い適用可能なフェーズを実行する。

## subagents-orchestration-guideスキル準拠の実行

**実行前チェック（必須）**：
- [ ] subagents-orchestration-guideスキルの該当フローを確認した
- [ ] 現在の進捗位置を特定した
- [ ] 次のステップを明確にした
- [ ] 停止ポイントを認識した → **全ての停止ポイントでAskUserQuestionを使用**
- [ ] 各Design Doc作成前にcodebase-analyzerを含めた
- [ ] 各Design Docについて document-reviewer の前に code-verifier を含めた
- [ ] タスク実行後の4ステップサイクル（task-executor → ユーザーが持つ境界の判定・フォローアップ → quality-fixer → コミット）を理解した

**フロー厳守**: subagents-orchestration-guideの該当するStructural Scaleフローと4ステップのタスク実行サイクルに従う。現在のフェーズまたはサイクルのステップで定められた遷移条件を満たした場合にのみ次へ進む。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
タスクの成果を、それを担うリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱い、同じ成果に必要な関連ファイルを含める。
割り当てられた進捗フィールドを除き、出典となる成果物は読み取り専用とする。
進行にプロダクト成果、公開契約、主要設計、権限、または不可逆操作に関するユーザー判断が必要な場合はエスカレーションする。
```

加えて、サブエージェントから rule-advisor を呼び出すとシステムクラッシュを引き起こすため、全サブエージェントプロンプトの末尾に以下の制約も含める:
```
[Constraint] rule-advisor can only be used by Main AI
```

## オーケストレーターとしての必須責務

### タスク実行品質サイクル
以下の依存順のステップを実行し、現在のステップで定められたレスポンス条件を満たした場合にのみ次へ進む：
1. **task-executor を呼び出す**: 実装を実行（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）。Medium/Large ではタスクファイルを渡す。Small では承認済みの成果・出典・影響パス・検証条件を直接渡し、タスクファイルは作成しない。
2. **task-executor レスポンスをチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 宣言された境界を確認し、ユーザーが持つ判断を必要とする場合はエスカレーションする
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行。変更された統合/E2Eテストのパスと `diffBase: HEAD` を渡す。Medium/Large ではさらに `taskFiles: [現在のタスクファイルパス]` を渡し、Small では直接スコープの検証主張を渡す。その後 `status` で分岐する
     - `needs_revision` → レビュー裁定を適用し、`apply` の quality-issue オブジェクト一式を逐語で task-executor に渡して **Fix Mode** でステップ1 に戻る
     - `blocked` → 現在のdiffから移動・リネームされたテストパスを解決し、修正後の入力でレビュー対象が変わる場合は再実行する。`requiresTestReview: true`にもかかわらず読み取り可能な変更テストが存在しない場合は、そのexecutor出力の欠陥を**Fix Mode**でステップ1に差し戻し、それ以外はレビューを未実行として `blockingReason` を記録してステップ3へ進む
     - `approved` → ステップ3 へ
   - それ以外 → ステップ3 へ
3. **quality-fixer を呼び出す**: 未追跡・削除・リネームを含む現在の未コミットのワークツリー全体に対して、全品質チェックと修正を実行する（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）。Medium/Large では現在の `task_file` も渡し、Small では直接の実行スコープを渡す。実装ステップの `runnableCheck` と、出典ソースまたはリポジトリの規約が権威ある品質コマンドを示している場合は `qualityCommand` を渡す。
   - `stub_detected` → 元の実行スコープと `incompleteImplementations[]` を渡して task-executor を **Fix Mode** で再起動し、ステップ1 に戻る
   - `blocked` → ユーザーが持つ判断をエスカレーションする
   - `approved` → ステップ4へ
4. **承認後にコミット**: 完了したタスクの変更セットをコミットする

### 実装後検証

Medium/Large では、全タスクサイクル完了後、完了レポートの前に code-verifier と security-reviewer を実行する。code-verifier には Design Doc と実装ファイルリストを渡し、security-reviewer には `governingDocuments: [{"type":"design-doc","path":"[パス]"}]` と同じ実装ファイルリストを渡す。合格/不合格と修正サイクルの規則はガイドに従う。

Smallではドキュメント依存の検証をスキップする。quality-fixerの承認と、直接スコープの観測可能な検証の成功をもって完了とする。

security-reviewer のレスポンス:

   - `approved` → 完了レポートへ
   - `needs_revision` → 各検出事項にレビュー裁定を適用し、`apply` の検出事項オブジェクトを逐語で、影響パスと観察可能な検証条件とともに渡して task-executor を **Fix Mode** で起動する。`prior_feedback` を添えて security-reviewer を再実行し、レビュー裁定が収束するまで従った後、quality-fixer を1回実行する。
   - `blocked` → ユーザーにエスカレーション

### テスト情報の伝達
acceptance-test-generator実行後、`generatedFiles[]` を `testSkeletons` として work-planner（subagent_type: "work-planner"）へ渡す。空のリストは、追加の統合/E2Eスケルトンタスクが不要であることを示す。
- タイミングの明示: 統合テストは各フェーズ実装と並行して作成、fixture-e2eテストはUI機能フェーズと並行して作成、service-integration-e2eテストは必要なサービスが利用可能になった後に実行

### 最終クリーンアップ

Medium/Large でのみ、完了レポートの前に本レシピが消費した実装タスクファイルを削除する。Small ではタスクファイルを作成しない。消費したタスクファイルはレシピ実行間で保持しない一時的な作業状態である。

本レシピは規模に依存せず、単層・複層のいずれの計画も実行する可能性があるため、クリーンアップは、計画書の Executor lane からタスク実体化が生成しうるすべてのタスク命名パターンを対象とする:

- 本実行で使用した作業計画書パスから導出した `{plan-name}` について、以下のいずれかにマッチするファイルすべてを削除する:
  - `docs/plans/tasks/{plan-name}-task-*.md`（単層タスク）
  - `docs/plans/tasks/{plan-name}-backend-task-*.md`（複層計画のbackend部分）
  - `docs/plans/tasks/{plan-name}-frontend-task-*.md`（複層計画のfrontend部分）
- 上記マッチから、以下のパターンに該当するものは除外する: `integration-tests-*-task-*.md`（他のワークフローフェーズに由来する）
- 作業計画書本体（`docs/plans/{plan-name}.md`）は保持する — 最終レビュー後に削除するかはユーザーが判断する

タスクファイルを削除できない場合（ファイルシステムエラー）、失敗を報告するが完了レポートをブロックしない。

## 実行方法

すべての作業はサブエージェント経由で実行する。
サブエージェントの選択はsubagents-orchestration-guideスキルに従う。
