---
description: コードベース起点の分析から、必要に応じたADR決定を経て、Design Doc承認までを実行
---

ドキュメントのルーティングや作成の前に、`documentation-criteria`スキルを実行する。
Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキルを実行する。
エージェントの呼び出しや検出事項の裁定の前に、`subagents-orchestration-guide`スキルを実行する。

## 成果と所有範囲

リポジトリのエビデンスから承認済みDesign Docまでの設計フェーズを統括する。要件の収束、構造スケール（Structural Scale）、ADRの適格性判定、エビデンスの選択、レビュー裁定はオーケストレーターが持つ。意味的な調査と成果物の執筆は、名指しされた各スペシャリストが持つ。

Medium/Large の作業では、Design Doc が常に完全な実装設計である。適格なADRバッチは Design Doc の前に技術的な選択を絞り込むが、完全なフローと実装境界は Design Doc が保持する。

要件: $ARGUMENTS

## フロー

```text
要件ソース -> codebase-analyzer -> スコープ/決定の確認 [停止]
                                          |
                          任意のADRバッチ -> バッチレビュー [停止]
                                          |
              Design Doc -> code-verifier -> レビュー裁定
                                          |
                  document-reviewer -> design-sync -> 承認 [停止]
```

依存する各ステップは、その前提エビデンスが揃ってから実行する。verifier・reviewer・design-sync の対応可能な各検出事項にはレビュー裁定を適用する。各 `[停止]` ではユーザーの明示的な確認を待つ。

以下の各 Agent 呼び出しでは、プロンプトを機械的な抽出として組み立てる。名指しされたソースの値を指定フィールドへコピーし、宣言されたシリアライズのみを適用して、直ちに呼び出す。

## ステップ1: 出典となる要件ソースの選択

承認済みPRDが存在する場合はそのパスを用いる。存在しない場合は確認済み要件の原文を用いる。

`confirmed_requirement_context` には承認済みPRDのパスをそのまま設定する。承認済みPRDが存在しない場合に限り、オーケストレーターが確認した収束記録をそのまま用いる。

## ステップ2: 判断材料の収集

確認済みスコープ全体に対して `codebase-analyzer` を1回呼び出す。入力は `prd_path: [承認済みPRDのパス]`、承認済みPRDが存在しない場合は `requirements: [確認済み要件の原文]` のいずれか一方のみとする。

妥当なJSON結果を1つ要求し、影響パス・責務境界・レイヤーをまたぐ契約の発見はアナライザーに任せる。その focus area は既存の振る舞いの安全策として扱い、新しい要件としては扱わない。

## ステップ3: スコープとADR決定の確認

`requirement-convergence` を実行する。ユーザーの依頼とステップ2のエビデンスから収束記録を構築し判定するのはオーケストレーターである。

4つの収束フィールドをすべて判定する。`cost` はステップ2の構造的エビデンスから割り当て、その未知を記録する。ヒアリングは `ready` に達していないフィールドについてのみ実施する。

構造スケールは成果と責務境界から判定する。ファイル数は補助的なエビデンスにとどまる。

`decisionMaterials.candidateDecisionPoints` を、出典となる要件ソース・`reuse`・`invalidations` に照らして解決する。それらのエビデンスで既に1つの十分なアプローチに収束する決定ポイントは除外する。残った各項目に、documentation-criteria のフィルタを順に適用する:

1. 選択（Choice）: 確認済みスコープ内に、妥当かつ実質的に異なる選択肢が2つ以上あり、判断を要する。
2. 持続性（Durability）: その選択が持続的で実質的な影響を持つ。

通過した項目をすべて `adrDecisionPoints` として記録する。空リストの場合はそのまま Design Doc へ進む。

ユーザーが判断する対象のみを提示する: 成果と構築する要件、除外事項、変更が対象とする責務。未知を加えるのは、そのスコープを確定するためにユーザーの解決が必要な場合に限る。構造スケール・ADR適格性・コストのエビデンスはオーケストレーターの記録に留める — ADRバッチと Design Doc はそれぞれ独自の承認停止点を持つ。選択肢として「このまま進める」または「スコープを修正して分析を再実行する」を提示する。続行するのは、すべての収束フィールドが `ready` または `weak-but-explicit` になった場合に限る。`[停止: スコープ確認]`。

## ステップ4: 必要な場合のADRバッチ作成と承認

`adrDecisionPoints` が非空の場合:

1. `technical-designer` を1回呼び出す。`document_to_create: ADRBatch`、`confirmed_requirement_context`、順序付きの `decision_points`、およびステップ2からそのままコピーした対応する `decision_materials` を渡す。
2. `document-reviewer` を1回呼び出す。`doc_type: ADRBatch`、`targets: [返却された全パス]`、`confirmed_requirement_context` を渡す。
3. まず verdict でルーティングする。`approved` は次へ進む。`needs_revision` はレビュー裁定を適用し、パスごとに1つのADRを順に更新してから、バッチ全体を再レビューする。`rejected` は再レビューの前に出典ソースの衝突を解消する。
4. バッチの判断をユーザーに提示するのは、レビューが approved になった後のみとする。`[停止: ADRバッチ承認]`。
5. ユーザー承認後、各ADRのステータスを `Accepted` に更新し、その変更を確認する。

## ステップ5: Design Docの作成

`technical-designer` を以下の入力ちょうどで呼び出す:

- `document_to_create: DesignDoc`
- `confirmed_requirement_context`
- `structural_scale`
- `adr_paths: [受理済みパス、または []]`
- `codebase_analysis: [ステップ2のJSON全体をそのまま]`

Design Doc は完全な実装設計を所有し、documentation-criteria テンプレートにおいて該当するすべての下流保証を保持する。

## ステップ6: リポジトリ上の主張の検証と裁定

`code-verifier` を `doc_type: design-doc` と Design Doc のパスで呼び出す。将来の振る舞いを意図のまま扱い、現状側の前提と実現可能性を検証させるため、`code_paths` は指定しない。

ドキュメントレビューの前に、各 discrepancy にレビュー裁定を適用する。technical-designer の update モードへ渡すのは `apply` の検出事項のみとし、修正後は code-verifier を再実行する。最新の verifier 結果と記録した処理方針をあわせて `verification_evidence` として渡す。続行するのは、未解決の `apply` または `user_decision_required` の項目が残っていない場合に限る。

## ステップ7: レビューと承認

`document-reviewer` を、`doc_type: DesignDoc`、`target`、`review_context: creation`、`requirements_verbatim` としてのユーザー要件の原文、`confirmed_requirement_context`、`codebase_analysis`、およびステップ6の `verification_evidence` で呼び出す。

- `approved`: 次へ進む。
- `needs_revision`: レビュー裁定を適用し、technical-designer 経由で更新した上で、影響を受けた境界についてステップ6〜7を再実行する。
- `rejected`: 出典ソースの衝突を解消する。ユーザーに尋ねるのは、プロダクトの成果または承認済みの主要な設計判断が変わる場合のみとする。

他のDesign Doc との整合性のために `design-sync` を呼び出し、対応可能な矛盾にはレビュー裁定を適用する。Design Doc が1つしか存在しない場合は `SKIPPED` として明確に報告する。

Design Doc、受理済みADRのパス、記録した decline、design-sync の結果を提示する。`[停止: 設計承認]`。

## 完了条件

- スコープと構造スケールを、成果と責務境界から確認した。
- ADRは両方のフィルタを通過した決定ポイントに対してのみ存在し、バッチ全体が1回のレビューと承認を受けた。
- ADRの要否にかかわらず、Design Doc が存在する。
- 該当する既存の振る舞い・契約・前提・等価性・検証の安全策が Design Doc に到達した。
- レビュー裁定が `needs_revision` の issue のみを修正作業へ回した。
- すべての停止点でユーザーの明示的な確認を得た。
