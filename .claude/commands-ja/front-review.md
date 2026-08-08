---
description: Design Doc準拠検証とセキュリティ検証、必要に応じた自動修正
---

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。
ワークフロー判断・エージェント呼び出し・検出事項の裁定の前に、`subagents-orchestration-guide`スキルを実行する。

**コマンドコンテキスト**: React/TypeScriptフロントエンド向け実装後品質保証コマンド

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**初回アクション**: 実行前にTaskCreateでStep 1-10を登録する。

## 実行方法

- 準拠検証 → code-reviewerが実行
- セキュリティ検証 → security-reviewerが実行
- **コード側修正パス**: 修正実装 → task-executor-frontend、品質チェック → quality-fixer-frontend、再検証 → code-reviewer / security-reviewer
- **設計側更新パス**: DD改訂 → technical-designer-frontend（updateモード）、DDレビュー → document-reviewer、複数DDの整合性 → design-sync（複数DD存在時のみ）、再検証 → code-reviewer

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡す。設計側パスは、コードが正しいのにDesign Docが古くなっていた不整合（コードがDDに違反したケースではない）に適用される。

Design Doc（省略時は直近のもの）: $ARGUMENTS

## 実行フロー

### Step 1: 前提条件チェック
```bash
# Design Docを特定
ls docs/design/*.md | grep -v template | tail -1

# 実装ファイルをチェック
git diff --name-only main...HEAD
```

### Step 2: code-reviewer実行
Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "コード準拠レビュー"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review mode: full. Design Doc準拠を検証し、構造化JSONレポートを返却。"

**出力を保存**: `$STEP_2_OUTPUT`

### Step 3: security-reviewer実行
Agent toolでsecurity-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティレビュー"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. セキュリティ準拠をレビュー。"

**出力を保存**: `$STEP_3_OUTPUT`

### Step 4: 判定と対応

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

ユーザーに尋ねるのは2つだけとする: 提案した `apply` 集合を適用する権限と、`user_decision_required` の各項目に対する判断。`user_decision_required` の項目でユーザーが「コードが正しく Design Doc が陳腐化している」と判断した場合、その項目はStep 5へ回す。承認された変更が残らない場合はStep 10へ進む。

**修正パスへ引き継ぐスコープ**: 承認された検出事項、対象となるファイルとセクション、およびユーザーが述べたサイズ予算を、Step 5〜9 で呼び出す全エージェントに渡す。再検証の前に、各差分ハンクを承認された検出事項、またはその検出事項が必要とした整合性の更新に対応付ける。対応付かないハンク、または述べられた予算を超える差分については、修正の一部として受け入れるのではなくスコープ判断を求める。

### Step 5: 設計側更新

このステップは、`user_decision_required` の項目のうち、ユーザーが「現在のコードを設計側で追認する」と判断したものについてのみ実行する。

1. Agent tool で technical-designer-frontend を update モードで呼び出す:
   - `subagent_type`: "technical-designer-frontend"
   - `description`: "レビュー検出事項からのDesign Doc更新"
   - `prompt`: "[path]のDesign Docをupdateモードで更新する。実装は以下の点で乖離しており、ユーザーはコード側ではなく設計側で追認する判断をした: [記録したユーザー判断を添えた検出事項オブジェクト一式]。該当セクションに現在のコードの挙動を反映し、履歴エントリを追加する。"

2. document-reviewer を呼び出して更新後の Design Doc を検証する:
   - `subagent_type`: "document-reviewer"
   - `description`: "更新後Design Docのレビュー"
   - `prompt`: "doc_type: DesignDoc。review_context: update。[path]の更新後Design Docの整合性と完成度をレビュー。"
   - レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には technical-designer-frontend を用いる。収束条件に達したときのみ先へ進む。

3. 複数のDesign Docが存在する場合（`ls docs/design/*.md | grep -v template | wc -l > 1`）、design-syncを呼び出す:
   - `subagent_type`: "design-sync"
   - `description`: "DD間整合性チェック"
   - `prompt`: "source_design: [更新後DDのパス]。更新後の全Design Doc間の矛盾を検出。"
   - `sync_status: CONFLICTS_FOUND` の場合: 矛盾をユーザーに提示し、影響を受けるDDに対して technical-designer-frontend を再起動して解消する。

4. 承認済みの `apply` 検出事項を更新後の Design Doc に対して再評価し、改訂で既に満たされたものは除外する。残りがない場合はStep 6〜7をスキップしてStep 8へ進む。

### Step 6: 修正実行
Agent toolでtask-executor-frontendを呼び出す:
- `subagent_type`: "task-executor-frontend"
- `description`: "レビュー修正の実行"
- `prompt`: "承認されたコード側の検出事項を直接適用する: [レビュアーの検出事項オブジェクト全体を逐語で、オーケストレーターの処理方針のみ付加]。承認された検出事項と述べられた総サイズ予算の範囲に変更を収める。"

### Step 7: 品質チェック
Agent toolでquality-fixer-frontendを呼び出す:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "品質ゲートチェック"
- `prompt`: "現在の未コミットのワークツリー全体について品質ゲート通過を確認する。"

### Step 8: code-reviewer再検証

Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "準拠の再検証"
- `prompt`: "修正後にDesign Doc準拠を再検証。Design Doc: [path]。実装ファイル: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### Step 9: security-reviewer再検証

Agent toolでsecurity-reviewerを呼び出す（セキュリティ修正が実行された場合のみ）:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後にセキュリティを再検証。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### Step 10: 最終レポート

ステップ8とステップ9の各結果にレビュー裁定を適用する。その `maintained` の遷移に従い、差し戻した修正の後は該当する検証を繰り返し、エスカレーション条件で停止し、収束条件で先へ進む。

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
decline とした検出事項:
- [ID] — [出典上の理由とエビデンス]

残存課題:
- [手動対応が必要な項目]
```

**スコープ**: Design Doc準拠検証、セキュリティレビュー、コード側自動修正、およびユーザーが追認した設計側更新。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
