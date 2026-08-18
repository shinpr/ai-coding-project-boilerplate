---
description: Design Doc準拠検証とセキュリティ検証、必要に応じた自動修正
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。
ワークフロー判断・エージェント呼び出し・検出事項の裁定の前に、`subagents-orchestration-guide`スキルを実行する。

**コマンドコンテキスト**: 実装完了後の品質保証専用コマンド

## 実行方法

- 準拠検証 → code-reviewerが実行
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
- `description`: "コード準拠レビュー"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review mode: full. Design Doc準拠を検証し、構造化JSONレポートを返却。"

**出力を保存**: `$STEP_2_OUTPUT`

### 3. security-reviewer実行
Agent toolでsecurity-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティレビュー"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. セキュリティ準拠をレビュー。"

**出力を保存**: `$STEP_3_OUTPUT`

### 4. 判定と対応

**security-reviewerが`blocked`を返した場合**: このゲートで停止し、ブロッキング理由と返された検出事項を報告してユーザーにエスカレーションする。

両方の出力にレビュー裁定を適用する。以降の扱いは裁定の処理方針が決める: `apply` の検出事項はコード修正になり、`user_decision_required` の検出事項はユーザーにしか下せない判断を含み、`decline` の検出事項は理由とともに記録する。各検出事項は自身のコード上の位置を持つため、これ以上のルーティング分類は不要である。

裁定済みの結果を提示する:

```
Code Review: [code-reviewerのverdict]
  Acceptance Criteria:
  - [fulfilled] [item] (confidence: [high/medium/low])
  - [unfulfilled] [item]: [gap] — [suggestion]
  Identifier Mismatches:
  - [identifier]: DD=[designDocValue] Code=[codeValue] at [location]
  Quality Findings:
  - [category] [location]: [description] — [rationale]

Security Review: [security-reviewerのstatus]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]

decline: [ID] — [出典ソース上の理由]
```

ユーザーに尋ねるのは2つだけとする: 提案した `apply` 集合を適用する権限と、`user_decision_required` の各項目に対する判断。`user_decision_required` の項目でユーザーが「コードが正しく Design Doc が陳腐化している」と判断した場合、その項目はステップ5へ回す。承認されたコード変更が残らない場合はステップ11へ進む。

**修正パスへ引き継ぐ境界**: 承認された検出事項、その観測可能な修正条件、ユーザーが述べたサイズ予算を、コード側の修正パスと最終品質チェックまで引き継ぐ。coding-standards の「変更境界と参照の代表性」を適用して必要な修正全体を導出し、検出事項が示すパスは調査の起点として扱う。必要な修正全体がユーザー指定のサイズ予算を超える場合、その予算はユーザーが判断する境界として維持する。

### 5. 設計側更新

このステップは、`user_decision_required` の項目のうち、ユーザーが「現在のコードを設計側で追認する」と判断したものについてのみ実行する。

1. Agent tool で technical-designer を update モードで呼び出す:
   - `subagent_type`: "technical-designer"
   - `description`: "レビュー検出事項からのDesign Doc更新"
   - `prompt`: "[path]のDesign Docをupdateモードで更新する。実装は以下の点で乖離しており、ユーザーはコード側ではなく設計側で追認する判断をした: [記録したユーザー判断を添えた検出事項オブジェクト一式]。該当セクションに現在のコードの挙動を反映し、履歴エントリを追加する。"

2. document-reviewer を呼び出して更新後の Design Doc を検証する:
   - `subagent_type`: "document-reviewer"
   - `description`: "更新後Design Docのレビュー"
   - `prompt`: "doc_type: DesignDoc。review_context: update。[path]の更新後Design Docの整合性と完成度をレビュー。"
   - レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には technical-designer を用いる。収束条件に達したときのみ先へ進む。

3. レビュー対象の変更が触れる責務または契約を別のDesign Docも統制する場合、design-syncを呼び出す:
   - `subagent_type`: "design-sync"
   - `description`: "DD間整合性チェック"
   - `prompt`: "source_design: [更新後DDのパス]。更新後の全Design Doc間の矛盾を検出。"
   - `sync_status: CONFLICTS_FOUND` の場合: 矛盾をユーザーに提示し、影響を受けるDDに対して technical-designer を再起動して解消する。

4. 承認済みの `apply` 検出事項を更新後の Design Doc に対して再評価し、改訂で既に満たされたものは除外する。残りがない場合はコード側の修正パスをスキップして最終レポートへ進む。

### 6. 修正実行

Agent toolでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "レビュー修正の実行"
- `prompt`: "承認されたコード側の検出事項を直接適用する: [レビュアーの検出事項オブジェクト全体を逐語で、オーケストレーターの処理方針のみ付加]。coding-standards の「変更境界と参照の代表性」を用いて必要な修正全体を導出し、示された総サイズ予算を守る。"

### 7. code-reviewer再検証

Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "準拠の再検証"
- `prompt`: "修正後にDesign Doc準拠を再検証。Design Doc: [path]。実装ファイル: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### 8. security-reviewer再検証

Agent toolでsecurity-reviewerを呼び出す（セキュリティ修正が実行された場合のみ）:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後にセキュリティを再検証。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### 9. 修正結果の解決

ステップ7とステップ8の各結果にレビュー裁定を適用する。`prior_disposition: apply` の `maintained` はステップ6へ戻し、その後もう一度修正再レビューを行う。レビュー裁定が収束条件に達した後に進む。

### 10. 品質チェック

修正再レビューが収束した後、quality-fixerを1回呼び出す:
- `subagent_type`: "quality-fixer"
- `description`: "品質ゲートチェック"
- `prompt`: "direct_scope: { outcome: [ステップ6へ渡した承認済みのコード側検出事項], affectedPaths: [検出事項と、その整合性を保つために必要な変更が対象とするパス], verificationCondition: 適用対象のプロジェクト品質チェックがパスする }。現在の未コミットのワークツリー全体について品質ゲート通過を確認する。"

レスポンスで分岐する:
- `approved` → ステップ11へ進む
- `blocked` → quality-fixerが報告したユーザー判断を提示する

### 11. 最終レポート

その後、最終レポートを提示する:

```
Code Review:
  初回: [code-reviewerのverdict]
  修正レビュー: [再レビュー範囲のverdict]（修正実行時）
  照合: [検出事項IDごとの resolved / withdrawn / maintained]

Security Review:
  初回: [status]
  修正レビュー: [再レビュー範囲のstatus]（修正実行時）
  照合: [検出事項IDごとの resolved / withdrawn / maintained]

品質チェック:
  ステータス: [approved / 未実行 — コード変更なし]
  実行できなかったチェックまたは無関係な既存失敗: [quality-fixer の結果に存在する場合]

decline とした検出事項:
- [ID] — [出典上の理由とエビデンス]

残存課題:
- [手動対応が必要な項目]
```

**スコープ**: Design Doc準拠検証、セキュリティレビュー、コード側自動修正、およびユーザーが追認した設計側更新。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
承認された修正を、その影響先となるリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱う。
割り当てられた更新を除き、出典ドキュメントは読み取り専用とする。
進行にプロダクト成果、公開契約、主要設計、権限、または不可逆操作に関するユーザー判断が必要な場合はエスカレーションする。
```
