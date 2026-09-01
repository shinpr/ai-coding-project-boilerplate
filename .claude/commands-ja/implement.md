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
割り当てられた進捗フィールドを除き、正典となる成果物は読み取り専用とする。
確認済みの成果、将来状態の要件、対象外を同時には維持できない場合は要件変更検知へ戻る。不可逆な外部操作が必要な場合は承認を求める。
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
   - `status: "escalation_needed"` または `"blocked"` → subagents-orchestration-guideの「専門エージェントの結果の受理」を適用する
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行。変更された統合/E2Eテストのパスと `diffBase: HEAD` を渡す。Medium/Large ではさらに `taskFiles: [現在のタスクファイルパス]` を渡し、Small では直接スコープの検証主張を渡す。その後 `status` で分岐する
     - `needs_revision` → レビュー対応を適用し、元の実行スコープに、`apply`のquality-issueオブジェクト一式を`correction_findings`として逐語で加えてステップ1に戻る
     - `blocked` → 現在のdiffから移動・リネームされたテストパスを解決し、修正後の入力でレビュー対象が変わる場合は再実行する。`requiresTestReview: true`にもかかわらず読み取り可能な変更テストが存在しない場合は、そのexecutor出力の欠陥を`correction_findings`としてステップ1に差し戻し、それ以外はレビューを未実行として`blockingReason`を記録してステップ3へ進む
     - `approved` → ステップ3 へ
   - それ以外 → ステップ3 へ
3. **quality-fixer を呼び出す**: 未追跡・削除・リネームを含む現在の未コミットのワークツリー全体に対して、全品質チェックと修正を実行する（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）。Medium/Large では現在の `task_file` も渡し、Small では直接の実行スコープを渡す。実装ステップの `runnableCheck` と、出典ソースまたはリポジトリの規約が正となる品質コマンドを定めている場合は `qualityCommand` を渡す。
   - `stub_detected` → 元の実行スコープと`incompleteImplementations[]`を渡してtask-executorを再実行し、ステップ1に戻る
   - `blocked` → 専門エージェントの結果の受理を適用する
   - `verification_incomplete` → 結果を省略せず最終再試行まで保持し、ステップ4へ進む
   - `approved` → ステップ4へ
4. **コミット**: `approved`または`verification_incomplete`の後に、完了したタスクの変更セットをコミットする

### 実装後レビュー（Medium/Large、全タスク完了後）

ドキュメント依存のレビュアーを呼び出す前に、subagents-orchestration-guideの「専門エージェントの結果の受理」にある証明不足の再試行を適用する。各結果を解消または保持した後に続行し、再試行後も残る証明不足だけを報告する。

作業計画書が参照する読み込み可能なDesign Docを解決する。入力が不足している場合はレビューをブロックする。

次のAgent呼び出しを1つのassistantメッセージで行い、両方を待つ。
- code-reviewer (subagent_type: "code-reviewer") → 型付きの`governingDocuments`、完了したタスクで実際に変更したファイルを`implementationFiles`、作業計画書のパスを渡して、完了した実装をレビューする
- security-reviewer (subagent_type: "security-reviewer") → 同じ型付き`governingDocuments`に照らして、完了した実装をレビューする

subagents-orchestration-guideの実装後レビューにあるステータスのルーティングと、修正・再実行の規則を適用する。統合レポートを提示し、すべてのレビュー結果がレビュー対応の収束条件に達した後、最終クリーンアップへ進む。

Smallでは、このドキュメント依存のレビューを省く。タスクのコミット後、保持した証明不足を1回再試行し、観測した`observable_verification`のエビデンスをもって完了する。なお証明できない内容があれば報告する。

### 最終クリーンアップ

Medium/Large でのみ、完了レポートの前に本レシピが処理した実装タスクファイルを削除する。Small ではタスクファイルを作成しない。処理したタスクファイルはレシピ実行間で保持しない一時的な作業状態である。

本レシピは規模に依存せず、単層・複層のいずれの計画も実行する可能性があるため、クリーンアップは、計画書の Executor lane から生成されうるすべてのタスク命名パターンを対象とする:

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
