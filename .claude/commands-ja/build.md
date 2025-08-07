---
description: 分解済みタスクを自律実行モードで実装
---

@docs/guides/sub-agents.md を厳守し、**オーケストレーター**として振る舞います。

作業計画書: $ARGUMENTS

## 🧠 各タスクでメタ認知
**必須サイクル**: `task-executor → quality-fixer → commit`

タスク開始前に必ず：
1. **rule-advisor実行**: タスクの本質を理解
2. **TodoWrite更新**: 進捗を構造化
3. **構造化レスポンス処理**: `readyForQualityCheck: true` → quality-fixer即実行

**Think deeply** 構造化レスポンスを見落とさず、品質ゲートを確実に通過させます。

! ls -la docs/plans/*.md | head -10

承認確認後、自律実行モードを開始。要件変更検知時は即座に停止。

## 出力例
実装フェーズが完了しました。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装されたタスク: [タスク数]件
- 品質チェック: すべて通過
- コミット: [コミット数]件作成

**重要**: 本コマンドはタスク分解から実装完了まで担当。要件変更検知時は自動停止。