---
description: Design Doc準拠検証とセキュリティ検証、必要に応じた自動修正
---

**コマンドコンテキスト**: React/TypeScriptフロントエンド向け実装後品質保証コマンド

## 実行方法

- 準拠検証 -> code-reviewerが実行
- セキュリティ検証 -> security-reviewerが実行
- ルール分析 -> rule-advisorが実行
- 修正実装 -> task-executor-frontendが実行
- 品質チェック -> quality-fixer-frontendが実行
- 再検証 -> code-reviewer / security-reviewerが実行

オーケストレーターがサブエージェントを呼び出し、構造化JSONを受け渡す。

Design Doc（省略時は直近のもの）: $ARGUMENTS

**Think deeply** 準拠検証の本質を理解し、以下のステップで実行:

## 実行フロー

### 1. 前提条件チェック
```bash
# Design Docを特定
ls docs/design/*.md | grep -v template | tail -1

# 実装ファイルをチェック
git diff --name-only main...HEAD
```

### 2. code-reviewer実行
Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "コード準拠レビュー"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review mode: full. Design Doc準拠を検証し、complianceRate、verdict、acceptanceCriteria、qualityIssuesを含む構造化JSONレポートを返却。"

**出力を保存**: `$STEP_2_OUTPUT`

### 3. security-reviewer実行
Agent toolでsecurity-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティレビュー"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. セキュリティ準拠をレビュー。"

**出力を保存**: `$STEP_3_OUTPUT`

### 4. 判定と対応

**security-reviewerが`blocked`を返した場合**: 即座に停止。blockedの検出結果を報告しユーザーにエスカレーション。修正ステップには進まない。

**コード準拠基準（プロジェクト段階を考慮）**:
- プロトタイプ: 70%以上で合格
- 本番実装: 90%以上推奨

**セキュリティ基準**:
- `approved` または `approved_with_notes` → 合格
- `needs_revision` → 不合格

**両方の結果をサブエージェントの出力フィールドのみを使用して独立に報告**（サブエージェントのレスポンスにないフィールドを追加しない）:

```
Code Compliance: [code-reviewerのcomplianceRate]
  Verdict: [code-reviewerのverdict]
  Acceptance Criteria:
  - [fulfilled] [item]
  - [partially_fulfilled] [item]: [gap] — [suggestion]
  - [unfulfilled] [item]: [gap] — [suggestion]

Security Review: [security-reviewerのstatus]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]
  - [hardening] [location]: [description] — [rationale]
  - [policy] [location]: [description] — [rationale]
  Notes: [security-reviewerのnotes、存在する場合]

修正を実行しますか？ (y/n):
```

両方合格でユーザーが`n`を選択: 修正ステップをスキップし、最終レポートへ。

ユーザーが`y`を選択した場合:

## 修正実行前のメタ認知

### 5. rule-advisor実行
Agent toolでrule-advisorを呼び出す:
- `subagent_type`: "rule-advisor"
- `description`: "修正アプローチの分析"
- `prompt`: "Task: レビュー検出結果の修正。Code issues: $STEP_2_OUTPUT. Security findings: $STEP_3_OUTPUT. 修正の本質を分析し適切なルールを選択。"

### 6. タスクファイル作成
TaskCreateで作業ステップを登録。必ず含める: 最初に「スキル制約の確認」、最後に「スキル忠実度の検証」。タスクテンプレートに従ってタスクファイル作成（documentation-criteriaスキル参照） → `docs/plans/tasks/review-fixes-YYYYMMDD.md`。コード準拠の問題とセキュリティのrequiredFixesの両方を含める。

### 7. 修正実行
Agent toolでtask-executor-frontendを呼び出す:
- `subagent_type`: "task-executor-frontend"
- `description`: "レビュー修正の実行"
- `prompt`: "Task file: docs/plans/tasks/review-fixes-YYYYMMDD.md. 段階的修正を適用（5ファイルで停止）。"

### 8. 品質チェック
Agent toolでquality-fixer-frontendを呼び出す:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "品質ゲートチェック"
- `prompt`: "修正ファイルの品質ゲート通過を確認。"

### 9. code-reviewer再検証
Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "準拠の再検証"
- `prompt`: "修正後のDesign Doc準拠を再検証。前回の問題: $STEP_2_OUTPUT。Design Doc: [path]. Implementation files: [file list]。"

### 10. security-reviewer再検証（セキュリティ修正が実行された場合のみ）
Agent toolでsecurity-reviewerを呼び出す:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後のセキュリティを再検証。前回の検出結果: $STEP_3_OUTPUT。Design Doc: [path]. Implementation files: [file list]。"

### 最終レポート
```
Code Compliance:
  初回: [X]%
  最終: [Y]%（修正実行時）

Security Review:
  初回: [status]
  最終: [status]（修正実行時）
  Notes: [approved_with_notesのnotes、存在する場合]

残存課題:
- [手動対応が必要な項目]
```

## 自動修正可能な項目
- 単純な未実装受入条件
- エラーハンドリング追加
- 契約定義の修正
- 関数分割（長さ/複雑性改善）
- セキュリティのconfirmed_riskとdefense_gapの修正（入力検証、認証チェック、出力エンコーディング）

## 自動修正不可な項目
- 根本的なビジネスロジック変更
- アーキテクチャレベルの修正
- Design Doc自体の不備
- コミット済みシークレット（blocked → 人間の判断が必要）

**スコープ**: Design Doc準拠検証、セキュリティレビュー、自動修正。
