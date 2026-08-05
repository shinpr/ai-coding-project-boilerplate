---
description: Design Doc準拠検証とセキュリティ検証、必要に応じた自動修正
---

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

**コマンドコンテキスト**: 実装完了後の品質保証専用コマンド

## 実行方法

- 準拠検証 → code-reviewerが実行
- セキュリティ検証 → security-reviewerが実行
- **コード側修正パス**: 修正実装 → task-executor、品質チェック → quality-fixer、再検証 → code-reviewer / security-reviewer
- **設計側更新パス**: DD改訂 → technical-designer（updateモード）、DDレビュー → document-reviewer、複数DDの整合性 → design-sync（複数DD存在時のみ）、再検証 → code-reviewer

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡す。設計側パスは、コードが正しいのにDesign Docが古くなっていた不整合（コードがDDに違反したケースではない）に適用される。

Design Doc（省略時は直近のもの）: $ARGUMENTS

準拠検証の本質を理解し、以下のステップで実行:

## 実行フロー

### 1. 前提確認
```bash
# Design Docの特定
ls docs/design/*.md | grep -v template | tail -1

# 実装ファイル確認
git diff --name-only main...HEAD
```

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
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. セキュリティ準拠をレビュー。"

**出力を保存**: `$STEP_3_OUTPUT`

### 4. 判定と対応

**security-reviewerが`blocked`を返した場合**: 即座に停止。blockedの検出結果を報告しユーザーにエスカレーション。修正ステップには進まない。

**コードレビュー基準**:
- `pass` → 合格
- `needs-improvement` / `needs-redesign` → 以下で残った finding をルーティングする

**セキュリティ基準**:
- `approved` または `approved_with_notes` → 合格
- `needs_revision` → 不合格

**両方の結果をサブエージェントの出力フィールドのみを使用して独立に報告**（サブエージェントのレスポンスにないフィールドを追加しない）。

**早期終了（ルーティング対象なし）**: code-reviewer の `verdict` が `pass` かつ `acceptanceCriteria[]` のすべてのエントリが `status: "fulfilled"` かつ `identifierMismatches[]` が空かつ `qualityFindings[]` が空かつ security-reviewer の `findings[]` が空の場合、ルーティング対象がないため、Steps 5-9 をスキップして直接 Step 10 へ進む。クリーンな結果をユーザーに提示する。

それ以外の場合、ユーザー提示の前に、オーケストレーターは以下のルールで finding ごとに推奨ルートを計算する（このルール自体は内部用 — ユーザー向けプロンプトには含めない）。ルールは code-reviewer の既存構造化フィールドのみを参照する。「DDの意図」のような解釈は不安定な推論を避けるため意図的に行わない:

| Finding ソース | 既存フィールドから検出可能なパターン | 推奨ルート |
|---------------|----------------------------------|----------|
| `acceptanceCriteria[]` で `status: "partially_fulfilled"` または `"unfulfilled"` | 引用された `gap` から、コードがACを満たしていないことが示される — 追加実装が必要 | `c`（コード側修正） |
| `acceptanceCriteria[]` で `status: "partially_fulfilled"` または `"unfulfilled"` | 引用された `gap` から、ACテキスト自体が実装済み（チームが受け入れた）挙動から乖離していることが示される — 実装が要件を満たしていないのではなく、DDのAC文言が誤った意図を捉えているケース（ACを読み、引用された `location` と比較して検証する） | `d`（設計側更新 — ACテキストが古い） |
| `identifierMismatches[]` | `codeValue` が `designDocValue` のリネームとして妥当（camelCase ↔ kebab-case ↔ snake_case、略語の展開/省略、同じ概念を指す意味的なリネーム）— 引用された `location` を確認してコードが新名称を一貫して使用していることを検証 | `d`（設計側更新 — DDが古い可能性が高い） |
| `identifierMismatches[]` | それ以外の identifier mismatch（型違い、cardinality違い、完全欠落など） | `c`（コード側修正） |
| `qualityFindings[]` | 全カテゴリ（`dd_violation`、`maintainability`、`reliability`、`coverage_gap`） | `c`（コード側修正） |
| security-reviewer `findings[]` | 全カテゴリ（`confirmed_risk`、`defense_gap`、`hardening`、`policy`） | `c`（コード側修正） |

各 finding に対しユーザーが推奨を上書き可能。`status: "fulfilled"` の AC 項目はルーティング対象外（対応不要）。

ユーザーへの提示形式（finding ごとに推奨ルートをラベル付け、ルートでグルーピング）:

```
Code Review: [code-reviewerのverdict]
  Acceptance Criteria:
  - [fulfilled] [item] (confidence: [high/medium/low])
  - [partially_fulfilled] [item]: [gap] — [suggestion] [recommended: c | d]
  - [unfulfilled] [item]: [gap] — [suggestion] [recommended: c | d]
  Identifier Mismatches:
  - [identifier]: DD=[designDocValue] Code=[codeValue] at [location] [recommended: c | d]
  Quality Findings:
  - [category] [location]: [description] — [rationale] [recommended: c]

Security Review: [security-reviewerのstatus]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale] [recommended: c]
  - [defense_gap] [location]: [description] — [rationale] [recommended: c]
  - [hardening] [location]: [description] — [rationale] [recommended: c]
  - [policy] [location]: [description] — [rationale] [recommended: c]
  Notes: [security-reviewerのnotes、存在する場合]

不整合の解消 — finding ごとに推奨ルートを承認または上書きする:
  c) コード側修正  — コードがDesign Docに違反; コードを修正して合わせる
  d) 設計側更新   — コードは正しい; Design Docが古いので改訂する
  s) スキップ     — 現状を受け入れて変更しない
```

AskUserQuestionを使用する。デフォルト提示は **「すべての推奨ルートを承認」** — オーケストレーターの推奨が正しい典型ケース向けの単一確認。ユーザーが上書きしたい場合は finding ごとに c/d/s を収集する。すべてに対し `s` を選択した場合: Steps 5-9をスキップしてStep 10へ進む。

ユーザーのルート決定が、レビュー裁定（subagents-orchestration-guideスキルの `references/review-resolution.md`）におけるその finding の処理方針となる: `c` と `d` はコード側・設計側の `apply`、`s` は `decline`。ルートを処理方針として記録し、レビュアーの finding オブジェクトはそのまま引き継ぐ。

**修正パスへ引き継ぐスコープ**: 承認された finding、そのルート、対象となるファイルとセクション、およびユーザーが述べたサイズ予算を、ステップ5〜9 で呼び出す全エージェントに渡す。再検証の前に、各差分ハンクを承認された finding、またはその finding が必要とした整合性の更新に対応付ける。対応付かないハンク、または述べられた予算を超える差分については、修正の一部として受け入れるのではなくスコープ判断を求める。

### 5. 設計側更新

ユーザーが少なくとも1つのfindingを `d` にルーティングした場合のみ、本ステップを実行する。すべてのルートが `c` または `s` の場合は、Step 6 へ直接スキップする。

1. Agent tool で technical-designer を update モードで呼び出す:
   - `subagent_type`: "technical-designer"
   - `description`: "レビューfindingsからのDesign Doc更新"
   - `prompt`: "[path]のDesign Docをupdateモードで更新する。実装は以下の点で乖離しており、チームはコード側ではなく設計側で受け入れる判断をした: [`d` ルートのfindingsを $STEP_2_OUTPUT の codeLocation と designDocValue 付きでリスト化]。該当セクションに現在のコードの挙動を反映し、履歴エントリを追加する。"

2. document-reviewer を呼び出して更新後の Design Doc を検証する:
   - `subagent_type`: "document-reviewer"
   - `description`: "更新後Design Docのレビュー"
   - `prompt`: "doc_type: DesignDoc。review_context: update。[path]の更新後Design Docの整合性と完成度をレビュー。"
   - レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には technical-designer を用いる。収束条件に達したときのみ先へ進む。

3. 複数のDesign Docが存在する場合（`ls docs/design/*.md | grep -v template | wc -l > 1`）、design-syncを呼び出す:
   - `subagent_type`: "design-sync"
   - `description`: "DD間整合性チェック"
   - `prompt`: "source_design: [更新後DDのパス]。更新後の全Design Doc間の矛盾を検出。"
   - `sync_status: CONFLICTS_FOUND` の場合: 矛盾をユーザーに提示し、影響を受けるDDに対して technical-designer を再起動して解消する。

4. Step 5 完了後:
   - ユーザーが選択した `c` ルートがゼロの場合（すべて `d`、すべて `s`、または `c` を含まない `d` + `s` の混在）→ Steps 6-7 をスキップし、Step 8 で再検証へ進む
   - `d` と `c` の両方が選択された場合 → 更新後のDDに対して `c` ルートのfindingsを再評価し、DD改訂で満たされたものは除外する。残った `c` ルートのfindings で Step 6 へ進む

### 6. 修正実行

Agent toolでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "レビュー修正の実行"
- `prompt`: "承認されたコード側の finding を直接適用する: [レビュアーの finding オブジェクト全体を逐語で、オーケストレーターの処理方針のみ付加]。承認されたルートと述べられた総サイズ予算の範囲に変更を収める（5ファイルで停止）。"

### 7. 品質チェック

Agent toolでquality-fixerを呼び出す:
- `subagent_type`: "quality-fixer"
- `description`: "品質ゲートチェック"
- `prompt`: "修正ファイルの品質ゲート通過を確認。filesModified: [直前の実装ステップのレスポンスから抽出]。"

### 8. code-reviewer再検証

Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "準拠の再検証"
- `prompt`: "修正後にDesign Doc準拠を再検証。Design Doc: [path]。実装ファイル: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### 9. security-reviewer再検証

Agent toolでsecurity-reviewerを呼び出す（セキュリティ修正が実行された場合のみ）:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後にセキュリティを再検証。Design Doc: [path]。実装ファイル: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。レビュアーの修正再レビュー範囲で、受領した各項目を照合する。"

### 10. 最終レポート

ステップ8とステップ9の各結果にレビュー裁定を適用する。その `maintained` の遷移に従い、差し戻した修正の後は該当する検証を繰り返し、エスカレーション条件で停止し、収束条件で先へ進む。

その後、最終レポートを提示する:

```
Code Review:
  初回: [code-reviewerのverdict]
  修正レビュー: [再レビュー範囲のverdict]（修正実行時）
  照合: [finding IDごとの resolved / withdrawn / maintained]

Security Review:
  初回: [status]
  修正レビュー: [再レビュー範囲のstatus]（修正実行時）
  照合: [finding IDごとの resolved / withdrawn / maintained]
  Notes: [approved_with_notesのnotes、存在する場合]

decline とした finding:
- [ID] — [出典上の理由とエビデンス]

残存課題:
- [手動対応が必要な項目]
```

## 自動修正可能な項目（コード側パス）
- 単純な未実装の受入条件
- エラーハンドリング追加
- 型定義の修正
- 関数分割（長さ・複雑度の改善）
- セキュリティのconfirmed_riskとdefense_gapの修正（入力検証、認証チェック、出力エンコーディング）

## 自動修正不可能な項目
- ビジネスロジックの根本的変更
- アーキテクチャレベルの修正
- コミット済みシークレット（blocked → 人間の判断が必要）

## 設計側更新の対象
設計側パスに適した不整合（コードが正しく、DDが古くなったケース）:
- 新しい命名がチームの現行命名を反映している identifier rename
- 元の要件意図に対し、DDが捉えた挙動より実装の方が合致している挙動変更
- 新しい構造が妥当で、DDが旧構造を文書化していたままのコンポーネント分割・統合
- 実装は既に満たしているがDDに列挙されていなかった新規AC

**スコープ**: Design Doc準拠検証、セキュリティレビュー、コード側自動修正、および設計側更新ルーティング。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
