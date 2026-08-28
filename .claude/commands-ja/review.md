---
description: 完了した実装について、正典との整合性、スコープの妥当性、リポジトリの品質、セキュリティをレビューし、ユーザーが承認した修正を適用する
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。
ワークフロー判断・エージェント呼び出し・検出事項の裁定の前に、`subagents-orchestration-guide`スキルを実行する。

**コマンドコンテキスト**: 実装完了後の品質保証専用コマンド

## 実行方法

- 実装レビュー → code-reviewerが実行
- セキュリティ検証 → security-reviewerが実行
- **コード側修正パス**: 修正実装 → task-executor、修正再レビュー → code-reviewer / security-reviewer、最終品質チェック → quality-fixer
- **設計側更新パス**: DD改訂 → technical-designer（updateモード）、DDレビュー → document-reviewer、複数DDの整合性 → design-sync（複数DD存在時のみ）、再検証 → code-reviewer

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡す。設計側パスは、コードが正しいのにDesign Docが古くなっていた不整合（コードがDDに違反したケースではない）に適用される。

Design Doc（省略時は直近のもの）: $ARGUMENTS

準拠検証の本質を理解し、以下のステップで実行:

## 実行フロー

### 1. 前提確認
まず`$ARGUMENTS`からDesign Docを解決する。指定がない場合は、リポジトリのメタデータ、参照、内容から、変更された責務を統制するドキュメントを探す。ブランチのupstreamとリポジトリのデフォルトブランチから比較基点を解決し、そのmerge baseから`HEAD`までの実装ファイルを列挙する。

### 2. code-reviewer実行
Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "完了した実装のレビュー"
- `prompt`: "完了した実装をレビューする。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [git diff file list]。初回レビューのJSONを返す。"

**出力を保存**: `$STEP_2_OUTPUT`

### 3. security-reviewer実行
Agent toolでsecurity-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティレビュー"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. セキュリティ準拠をレビュー。"

**出力を保存**: `$STEP_3_OUTPUT`

### 4. 判定と対応

いずれかのレビュアーが`blocked`または利用できない結果を返した場合は、その意味上の原因にsubagents-orchestration-guideの「専門エージェントの結果の受理」を適用する。なお残る証明不足だけをレポートへ引き継ぐ。

両方の出力にレビュー裁定を適用する。`apply`と`decline`の処理方針がルーティングを決める。`apply`の検出事項ごとに、実装が受け入れ状態で技術成果物が古い場合はそのドキュメントの作成担当を、受け入れ状態に到達するため実装を変える必要がある場合はexecutorを使用する。

裁定済みの結果を提示する:

```
Implementation Review: [code-reviewerのverdict]
  Acceptance Criteria:
  - [fulfilled] [item]: [evidence]
  - [unfulfilled] [item] -> [対応するfinding ID]
  Required Corrections:
  - [id] [category] [location]: [description] — [basis and effect] [推奨: コード側の修正 | 設計側の更新]
  Limitations:
  - [検証できない判断とその影響]

Security Review: [security-reviewerのstatus]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]

decline: [ID] — [出典ソース上の理由]
```

ユーザーには、提案した`apply`経路を適用する権限だけを求める。一括承認の選択肢は「提案したすべての`apply`経路を承認」とし、それらの経路だけを含める。承認対象の変更がない場合はステップ11へ進む。

**修正パスへ引き継ぐ境界**: 承認された検出事項、その観測可能な修正条件、ユーザーが述べたサイズ予算を、コード側の修正パスと最終品質チェックまで引き継ぐ。coding-standards の「変更境界と参照の代表性」を適用して必要な修正全体を導出し、検出事項が示すパスは調査の起点として扱う。必要な修正全体がユーザー指定のサイズ予算を超える場合、その予算はユーザーが判断する境界として維持する。

### 5. 設計側更新

このステップは、承認された経路が、受け入れ済みの実装を維持して古いDesign Docを修正する場合に限って実行する。

1. Agent tool で technical-designer を update モードで呼び出す:
   - `subagent_type`: "technical-designer"
   - `description`: "レビュー検出事項からのDesign Doc更新"
   - `prompt`: "[path]のDesign Docをupdateモードで、承認済みの設計側検出事項から更新する: [applyの処理方針を添えた検出事項オブジェクト一式]。確認済みの成果、将来状態の要件、対象外を維持する。"

2. document-reviewer を呼び出して更新後の Design Doc を検証する:
   - `subagent_type`: "document-reviewer"
   - `description`: "更新後Design Docのレビュー"
   - `prompt`: "doc_type: DesignDoc。review_context: update。[path]の更新後Design Docの整合性と完成度をレビュー。"
   - レビュー裁定を、その修正再レビューと収束の遷移に沿って回す。差し戻す修正には technical-designer を用いる。収束条件に達したときのみ先へ進む。

3. レビュー対象の変更が触れる責務または契約を別のDesign Docも統制する場合、design-syncを呼び出す:
   - `subagent_type`: "design-sync"
   - `description`: "DD間整合性チェック"
   - `prompt`: "source_design: [更新後DDのパス]。更新後の全Design Doc間の矛盾を検出。"
   - `sync_status: CONFLICTS_FOUND` の場合: design-syncを新しいverifierとしてレビュー裁定を適用し、`apply`の矛盾を担当するtechnical-designerで修正し、design-syncを再実行し、エビデンスに基づく却下は完了として維持する。

4. 承認済みの `apply` 検出事項を更新後の Design Doc に対して再評価し、改訂で既に満たされたものは除外する。残りがない場合はコード側の修正パスをスキップして最終レポートへ進む。

### 6. 修正実行

Agent toolでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "レビュー修正の実行"
- `direct_scope`: 確定したレビュー範囲と総サイズ予算の中で、承認されたコード側の修正を適用する
- `governing_sources`: レビュー対象のDesign Docと、受け入れ済みの要件またはADRのパス
- `target_paths`: 承認されたコード側ルートに対して確認した実装・テストのパス
- `observable_verification`: 検出事項と正典が示す、焦点を絞ったテストまたは観測可能な契約チェックが通る
- `correction_findings`: レビュアーの検出事項オブジェクト一式に、オーケストレーターの処理方針だけを加えた逐語コピー

### 7. 品質チェック

Agent toolでquality-fixerを呼び出す:
- `subagent_type`: "quality-fixer"
- `description`: "品質ゲートチェック"
- `prompt`: "direct_scope: { outcome: [ステップ6へ渡した承認済みのコード側検出事項], affectedPaths: [検出事項と、その整合性を保つために必要な変更が対象とするパス], verificationCondition: 適用対象のプロジェクト品質チェックがパスする }。現在の未コミットのワークツリー全体について品質ゲート通過を確認する。"

レスポンスで分岐する:
- `approved` → ステップ8へ進む
- `stub_detected` → `incompleteImplementations`を変更せずステップ6へ戻し、ステップ7を再実行する
- `verification_incomplete` → 結果を省略せず保持し、ステップ8へ進む
- `blocked` → 専門エージェントの結果の受理を適用する

### 8. code-reviewer再検証

この呼び出しの直前に、ステップ1の対象選定規則で`implementationFiles`を再取得し、承認済みの修正と品質修正で追加・変更された実装成果物を含める。

Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "実装レビューの再検証"
- `prompt`: "承認済みの修正後、完了した実装を再レビューする。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。受領した各項目を照合する。"

### 9. security-reviewer再検証

この呼び出しの直前に、ステップ1の対象選定規則で`implementationFiles`を再取得し、承認済みの修正と品質修正で追加・変更された実装成果物を含める。

subagents-orchestration-guideの実装後レビューの再実行規則によって現在のセキュリティ結果が必要な場合、security-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後にセキュリティを再検証。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### 10. 修正結果の解決

ステップ8とステップ9の各結果にレビュー裁定を適用する。`prior_disposition: apply`の`maintained`はステップ6へ戻し、該当する品質確認と修正再レビューをもう一度行う。レビュー裁定が収束条件に達した後に進む。

ステップ11の前に、保持しているquality-fixerの証明不足ごとに、ステップ7と同じ入力と対象チェックで1回だけ再試行する。`approved`なら証明不足を解消し、新たに未完成の実装が見つかった場合はステップ6〜10へ戻し、`verification_incomplete`が再度返った場合は報告する。再試行によってリポジトリが変わった場合は、変更後のコードに対してステップ8〜10を繰り返してから報告する。

### 11. 最終レポート

その後、最終レポートを提示する:

```
Implementation Review:
  初回: [code-reviewerのverdict]
  修正レビュー: [再レビュー範囲のverdict]（修正実行時）
  照合: [検出事項IDごとの resolved / withdrawn / maintained]

Security Review:
  初回: [status]
  修正レビュー: [再レビュー範囲のstatus]（修正実行時）
  照合: [検出事項IDごとの resolved / withdrawn / maintained]

品質チェック:
  最終結果: [approved / verification_incomplete / 未実行 — コード変更なし]

残っている証明不足:
- [理由 — 対象チェックとエビデンス]（再試行後も残る場合のみ）

decline とした検出事項:
- [ID] — [出典上の理由とエビデンス]

残存課題:
- [手動対応が必要な項目]
```

**スコープ**: 完了した実装のレビュー、セキュリティレビュー、ユーザーが承認した修正経路。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
承認された修正を、その影響先となるリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱う。
割り当てられた更新を除き、出典ドキュメントは読み取り専用とする。
確認済みの成果、将来状態の要件、対象外を同時には維持できない場合は要件変更検知へ戻る。不可逆な外部操作が必要な場合は承認を求める。
```
