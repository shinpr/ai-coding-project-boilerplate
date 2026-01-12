---
description: 要件分析から設計書作成まで実行
---

**コマンドコンテキスト**: このコマンドは設計フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をサブエージェントに委譲**（自分で調査・分析しない）
2. **subagents-orchestration-guideスキルの設計フローに厳密に従う**:
   - 実行: requirement-analyzer → technical-designer → document-reviewer → design-sync
   - **`[停止: ...]`マーカーで必ず停止** → 次に進む前にユーザー承認を待つ
3. **スコープ**: 設計書が承認されたら完了

**重要**: document-reviewer、design-sync、subagents-orchestration-guideスキルで定義された停止ポイントは必ず実行する。

## ワークフロー概要

```
要件 → requirement-analyzer → [停止: 規模判定]
                                    ↓
                            technical-designer → document-reviewer
                                    ↓
                               design-sync → [停止: 設計承認]
```

要件: $ARGUMENTS

**Think harder** 設計への影響を深く考慮し、まず要件の背景と目的を理解するため対話を行い：
- どのような問題を解決したいか
- 期待される成果と成功基準
- 既存システムとの関係性

適度に要件が明確になったら、requirement-analyzerで分析し、規模に応じた適切な設計書を作成します。

設計の代替案とトレードオフを明確に提示します。

## スコープ境界

**実行内容**:
- requirement-analyzerによる要件分析
- ADR作成（アーキテクチャ変更、データフロー変更がある場合）
- technical-designerによるDesign Doc作成
- document-reviewerによるドキュメントレビュー
- design-syncによるDesign Doc間整合性検証

**責務境界**: このコマンドは設計書承認で責務完了。

## 実行フロー

1. requirement-analyzer → 要件分析
2. technical-designer → Design Doc作成
3. document-reviewer → 単一ドキュメント品質チェック
4. ユーザー承認
5. design-sync → Design Doc間整合性検証
   - 矛盾あり → ユーザーに報告 → 修正指示待ち → technical-designer(update)で修正
   - 矛盾なし → 終了

## 完了条件

- [ ] requirement-analyzerを実行し規模を判定した
- [ ] technical-designerで適切な設計書（ADRまたはDesign Doc）を作成した
- [ ] document-reviewerを実行しフィードバックに対応した
- [ ] design-syncで整合性検証を実行した
- [ ] ユーザーから設計書の承認を取得した

## 出力例
設計フェーズが完了しました。
- 設計書: docs/design/[ドキュメント名].md
- 整合性: 他Design Docと矛盾なし（または修正完了）

**重要**: 本コマンドは設計承認＋整合性確認で終了。次フェーズへの移行提案は行わない。