---
description: Design Doc準拠検証とセキュリティ検証、必要に応じた自動修正
---

**コマンドコンテキスト**: 実装完了後の品質保証専用コマンド

## 実行方法

- 準拠検証 → code-reviewerが実行
- セキュリティ検証 → security-reviewerが実行
- 修正実装 → task-executorが実行
- 品質チェック → quality-fixerが実行
- 再検証 → code-reviewer / security-reviewerが実行

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡します。

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

両方合格でユーザーが`n`を選択: Steps 5-10をスキップし、Step 11へ。

### 5. Skill実行

Skill: documentation-criteria を実行（タスクファイルテンプレート用）

### 6. タスクファイル作成

`docs/plans/tasks/review-fixes-YYYYMMDD.md` にタスクファイルを作成。
コード準拠の問題とセキュリティのrequiredFixesの両方を含める。

### 7. 修正実行

Agent toolでtask-executorを呼び出す:
- `subagent_type`: "task-executor"
- `description`: "レビュー修正の実行"
- `prompt`: "Task file: docs/plans/tasks/review-fixes-YYYYMMDD.md. 段階的修正を適用（5ファイルで停止）。"

### 8. 品質チェック

Agent toolでquality-fixerを呼び出す:
- `subagent_type`: "quality-fixer"
- `description`: "品質ゲートチェック"
- `prompt`: "修正ファイルの品質ゲート通過を確認。"

### 9. code-reviewer再検証

Agent toolでcode-reviewerを呼び出す:
- `subagent_type`: "code-reviewer"
- `description`: "準拠の再検証"
- `prompt`: "修正後のDesign Doc準拠を再検証。前回の準拠問題: $STEP_2_OUTPUT。各問題が解決されたことを確認。"

### 10. security-reviewer再検証

Agent toolでsecurity-reviewerを呼び出す（セキュリティ修正が実行された場合のみ）:
- `subagent_type`: "security-reviewer"
- `description`: "セキュリティの再検証"
- `prompt`: "修正後のセキュリティを再検証。前回の検出結果: $STEP_3_OUTPUT。Design Doc: [path]. Implementation files: [file list]。"

### 11. 最終レポート

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
- 単純な未実装の受入条件
- エラーハンドリング追加
- 型定義の修正
- 関数分割（長さ・複雑度の改善）
- セキュリティのconfirmed_riskとdefense_gapの修正（入力検証、認証チェック、出力エンコーディング）

## 自動修正不可能な項目
- ビジネスロジックの根本的変更
- アーキテクチャレベルの修正
- Design Doc自体の不備
- コミット済みシークレット（blocked → 人間の判断が必要）

**スコープ**: Design Doc準拠検証、セキュリティレビュー、自動修正まで。
