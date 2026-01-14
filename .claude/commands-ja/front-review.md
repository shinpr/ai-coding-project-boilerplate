---
name: front-review
description: Design Doc準拠検証と必要に応じた自動修正
---

**コマンドコンテキスト**: React/TypeScriptフロントエンド向け実装後品質保証コマンド

## 実行方法

- 準拠検証 → code-reviewerが実行
- ルール分析 → rule-advisorが実行
- 修正実装 → task-executor-frontendが実行
- 品質チェック → quality-fixer-frontendが実行
- 再検証 → code-reviewerが実行

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
Design Doc準拠を検証:
- 受入条件の充足確認
- コード品質チェック
- 実装完全性の評価

### 3. 判定と対応

**基準（プロジェクト段階を考慮）**:
- プロトタイプ: 70%以上で合格
- 本番: 90%以上推奨
- 重要項目（セキュリティ等）: 率に関わらず必須

**準拠率に基づく対応**:

準拠率が低い場合（本番で90%未満）:
```
検証結果: 準拠率 [X]%
未充足項目:
- [項目リスト]

修正を実行しますか？ (y/n):
```

ユーザーが`y`を選択した場合:

## 修正実行前のメタ認知
**必須**: `rule-advisor → TodoWrite → task-executor-frontend → quality-fixer-frontend`

1. **rule-advisor実行**: 修正の本質を理解（表面的な対症療法 vs 根本解決）
2. **TodoWrite更新**: 作業ステップを登録。必ず含める: 最初に「スキル制約の確認」、最後に「スキル忠実度の検証」。タスクテンプレートに従ってタスクファイル作成（documentation-criteriaスキル参照） → `docs/plans/tasks/review-fixes-YYYYMMDD.md`
3. **task-executor-frontend実行**: 段階的自動修正（5ファイルで停止）
4. **quality-fixer-frontend実行**: 品質ゲート通過を確認
5. **再検証**: code-reviewerで改善を測定

### 4. 最終レポート
```
初期準拠率: [X]%
最終準拠率: [Y]%（修正実行時）
改善: [Y-X]%

残存課題:
- [手動対応が必要な項目]
```

## 自動修正可能な項目
- 単純な未実装受入条件
- エラーハンドリング追加
- 契約定義の修正
- 関数分割（長さ/複雑性改善）

## 自動修正不可な項目
- 根本的なビジネスロジック変更
- アーキテクチャレベルの修正
- Design Doc自体の不備

**スコープ**: Design Doc準拠検証と自動修正。
