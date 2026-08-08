---
description: リポジトリのエビデンスから、該当するUI Specと必要に応じたADR決定を経て、フロントエンドDesign Doc承認までを実行
---

ドキュメントのルーティングや作成の前に、`documentation-criteria`スキルを実行する。
Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキルを実行する。
エージェントの呼び出しや検出事項の裁定の前に、`subagents-orchestration-guide`スキルを実行する。

## 成果と所有範囲

Medium/Large のフロントエンド設計を、エビデンスから該当するUI Specと承認済みDesign Docまで統括する。要件の収束、構造スケール（Structural Scale）、ドキュメントルーティング、ADRの適格性判定、エビデンスの選択、レビュー裁定はオーケストレーターが持つ。意味的な調査と成果物は、名指しされた各スペシャリストが持つ。

フロントエンドDesign Doc は常に完全な実装設計を担う。ADRバッチは適格な技術的選択を絞り込み、該当するUI Spec はこれから設計するUIの構造と振る舞いを所有する。

要件: $ARGUMENTS

## フロー

```text
要件ソース -> codebase-analyzer -> スコープ/ドキュメントルーティングの確認 [停止]
                                        |
                       条件付きのUI分析 -> UI Specレビュー [停止]
                                        |
                             任意のADRバッチ/レビュー [停止]
                                        |
        Design Doc -> code-verifier/レビュー裁定 -> document-reviewer
                                        |
                          design-sync -> 承認 [停止]
```

対応可能な各検出事項にはレビュー裁定を適用する。各 `[停止]` ではユーザーの明示的な確認を待つ。

以下の各 Agent 呼び出しでは、プロンプトを機械的な抽出として組み立てる。名指しされたソースの値を指定フィールドへコピーし、宣言されたシリアライズのみを適用して、直ちに呼び出す。

## ステップ1: 出典となる要件ソースの選択

承認済みPRDが存在する場合はそのパスを用いる。存在しない場合は確認済み要件の原文を用いる。

`confirmed_requirement_context` には承認済みPRDのパスをそのまま設定する。承認済みPRDが存在しない場合に限り、オーケストレーターが確認した収束記録をそのまま用いる。

## ステップ2: リポジトリ側の判断材料の収集

確認済みスコープ全体に対して `codebase-analyzer` を1回呼び出す。入力は `prd_path: [承認済みPRDのパス]`、承認済みPRDが存在しない場合は `requirements: [確認済み要件の原文]` のいずれか一方のみとする。

妥当なJSON結果を1つ要求し、影響パス・責務境界・レイヤーをまたぐ契約の発見はアナライザーに任せる。`focusAreas` は要件ではなく既存の振る舞いの安全策として扱う。

## ステップ3: UI Specの要否判定とUIエビデンスの解決

documentation-criteria の UI Spec 作成条件を適用する。該当しない場合は、UI分析とステップ5をスキップする。

UI Spec が該当する場合、project-context の外部リソースを選択するのは、それが現在のUI方針・コンポーネント契約・検証境界のいずれかを変えうる場合に限る。それ以外は `external_resource_refs: []` を用いる。

プロトタイプコードを求めるのは、それが未解決の承認済みUI判断を供給する場合、または要件・リポジトリのUI・記録済みリソースからは対象を決定できない場合に限る。任意のプロトタイプが存在しないことは停止条件ではない。

`ui-analyzer` を、出典ソースちょうど1つで呼び出す: `prd_path: [承認済みPRDのパス]`、承認済みPRDが存在しない場合は `requirements: [確認済み要件の原文]`。これに加えて渡すのは、既存の `ui_spec_path`、判断に影響する `prototype_path`、選択した `external_resource_refs`（または `[]`）のみとする。

## ステップ4: スコープとADR決定の確認

`requirement-convergence` を実行する。出典となる要件ソース、リポジトリ分析、該当するUI分析から収束記録を構築し判定する。

4つの収束フィールドをすべて判定する。`cost` はステップ2の構造的エビデンスから割り当て、その未知を記録する。ヒアリングは `ready` に達していないフィールドについてのみ実施する。

構造スケールは成果と責務境界から判定し、ファイル数は補助的なエビデンスにとどめる。候補となる決定ポイントを、出典ソース・`reuse`・`invalidations` に照らして解決する。該当するUIの事実は、残った選択肢を支持することも否定することもある。documentation-criteria の 選択（Choice）フィルタと持続性（Durability）フィルタは、この収束の後にのみ適用し、通過した決定ポイントを `adrDecisionPoints` として記録する。空リストも妥当である。

ユーザーが判断する対象のみを提示する: 成果と構築する要件、除外事項、変更が対象とする責務。未知を加えるのは、そのスコープを確定するためにユーザーの解決が必要な場合に限る。構造スケール・UI Spec の要否・ADR適格性・コストのエビデンスはオーケストレーターの記録に留める — UI Spec・ADRバッチ・Design Doc はそれぞれ独自の承認停止点を持つ。選択肢として「このまま進める」または「修正して再実行する」を提示する。続行するのは、すべての収束フィールドが `ready` または `weak-but-explicit` になった場合に限る。`[停止: スコープ確認]`。

## ステップ5: UI Specの作成と承認

このステップは、ステップ3で UI Spec が該当すると判定した場合にのみ実行する。

`ui-spec-designer` を、`confirmed_requirement_context`、変更していない `ui_analysis` と `codebase_analysis` の全体、存在する場合は判断に影響する `prototype_path`、選択した `external_resource_refs`（または `[]`）で呼び出す。

`document-reviewer` を `doc_type: UISpec` と、返却されたUI Spec のパスを `target` として呼び出す。`approved` の場合はUI Spec を提示する。`needs_revision` はレビュー裁定を適用し、修正後に再レビューする。`rejected` は再レビューの前に出典ソースの衝突を解消する。`[停止: UI Spec承認]`。

## ステップ6: 必要な場合のADRバッチ作成と承認

`adrDecisionPoints` が非空の場合:

1. 共有／バックエンドが所有する決定ポイントを先に technical-designer へ、続いてフロントエンドが所有する決定ポイントを technical-designer-frontend へルーティングする。各担当を、`document_to_create: ADRBatch`、`confirmed_requirement_context`、その順序付き `decision_points`、対応する変更していない `decision_materials` で呼び出す。`ui_spec_path` は、承認済みUI Spec がその決定を拘束する場合にのみ渡す。
2. 返却された全パスを集約し、`document-reviewer` を1回、`doc_type: ADRBatch`、`targets: [全パス]`、`confirmed_requirement_context` で呼び出す。
3. まず verdict でルーティングする。`approved` は次へ進む。`needs_revision` はレビュー裁定を適用し、パスごとに1つのADRを順に更新してから、バッチ全体を再レビューする。`rejected` は再レビューの前に出典ソースの衝突を解消する。
4. バッチの判断をユーザーに提示するのは、レビューが approved になった後のみとする。`[停止: ADRバッチ承認]`。
5. ユーザー承認後、各ADRのステータスを `Accepted` に設定し、その変更を確認する。

## ステップ7: フロントエンドDesign Docの作成

`technical-designer-frontend` を以下で呼び出す:

- `document_to_create: DesignDoc`
- `confirmed_requirement_context`
- `structural_scale`
- 該当する承認済みの `ui_spec_path` と、選択した外部リソース記録
- `adr_paths: [受理済みパス、または []]`
- 変更していないステップ2の `codebase_analysis` 全体
- 存在する場合は、変更していないステップ3の `ui_analysis` 全体

Design Doc はコンポーネントからサービスまでの完全な実装を所有し、該当するすべての下流保証を保持する。

## ステップ8: 検証・レビュー・承認

`code-verifier` を `doc_type: design-doc` と返却された Design Doc のパスで呼び出し、`code_paths` は指定しない。ドキュメントレビューの前にレビュー裁定を適用する。修正を適用した場合は technical-designer-frontend 経由で更新し、検証を再実行する。最新の verifier 結果と記録した処理方針をあわせて `verification_evidence` として渡す。残るすべての discrepancy に処理方針が付いた時点で次へ進む。

`document-reviewer` を、`doc_type: DesignDoc`、返却された Design Doc のパス、`review_context: creation`、ユーザー要件の原文、`confirmed_requirement_context`、設計者に渡したものと同じ変更していない分析入力、`verification_evidence` で呼び出す。

- `approved`: 次へ進む。
- `needs_revision`: レビュー裁定を適用し、technical-designer-frontend 経由で更新した上で、影響を受けた境界について検証とレビューを再実行する。
- `rejected`: 出典ソースの衝突を解消する。ユーザーに尋ねるのは、プロダクトの成果または承認済みの主要な設計判断を変更しなければならない場合のみとする。

返却された Design Doc をソースとして `design-sync` を呼び出し、対応可能な矛盾にはレビュー裁定を適用する。Design Doc が1つしか存在しない場合は `SKIPPED` として明確に報告する。

該当するUI Spec、Design Doc、受理済みADRのパス、記録した decline、sync 結果を提示する。`[停止: 設計承認]`。

## 完了条件

- 外部リソースとプロトタイプのエビデンスは、現在の判断を左右する場合にのみ要求した。
- スコープと構造スケールを、成果と責務境界から確認した。
- ADRは両方のフィルタを通過した決定ポイントに対してのみ存在し、バッチが1回のレビューと承認を受けた。
- ADRの要否にかかわらず、該当するUI Spec と完全なフロントエンドDesign Doc が存在する。
- 該当する既存のUIの振る舞い・契約・前提・状態・等価性・検証の安全策が Design Doc に到達した。
- レビュー裁定が `needs_revision` の issue のみを修正作業へ回した。
- すべての停止点でユーザーの明示的な確認を得た。
