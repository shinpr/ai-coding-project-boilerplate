---
description: 要件分析から設計書作成まで実行
---

**コマンドコンテキスト**: このコマンドは設計フェーズ専用です。

subagents-orchestration-guideスキルの設計フローに従い、**requirement-analyzer から設計書作成・承認まで**を実行します。

要件: $ARGUMENTS

**Think harder** 設計への影響を深く考慮し、まず要件の背景と目的を理解するため対話を行い：
- どのような問題を解決したいか
- 期待される成果と成功基準
- 既存システムとの関係性

適度に要件が明確になったら、requirement-analyzerで分析し、規模に応じた適切な設計書を作成します。

設計の代替案とトレードオフを明確に提示します。

**スコープ**: 設計書（ADR/Design Doc）承認＋Design Doc間整合性確認まで。作業計画以降は本コマンドの責務外。

## 実行フロー

1. requirement-analyzer → 要件分析
2. technical-designer → Design Doc作成
3. document-reviewer → 単一ドキュメント品質チェック
4. ユーザー承認
5. design-sync → Design Doc間整合性検証
   - 矛盾あり → ユーザーに報告 → 修正指示待ち → technical-designer(update)で修正
   - 矛盾なし → 終了

## 出力例
設計フェーズが完了しました。
- 設計書: docs/design/[ドキュメント名].md
- 整合性: 他Design Docと矛盾なし（または修正完了）

**重要**: 本コマンドは設計承認＋整合性確認で終了。次フェーズへの移行提案は行わない。