---
description: 要件分析から設計書作成まで実行
---

**コマンドコンテキスト**: このコマンドは設計フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **subagents-orchestration-guideスキルの設計フローに厳密に従う**:
   - 実行: requirement-analyzer → codebase-analyzer → technical-designer → code-verifier → document-reviewer → design-sync
   - **ADRのみの場合**: codebase-analyzerとcode-verifierはスキップ（Design Docにのみ適用）
   - **`[停止: ...]`マーカーで必ず停止** → 次に進む前にユーザー承認を待つ
3. **スコープ**: 設計書が承認されたら完了

**重要**: document-reviewer、design-sync、subagents-orchestration-guideスキルで定義された停止ポイントは必ず実行する。

## ワークフロー概要

```
要件 → requirement-analyzer → [停止: 規模判定]
                                    ↓
                            codebase-analyzer → technical-designer
                                    ↓
                            code-verifier → document-reviewer
                                    ↓
                               design-sync → [停止: 設計承認]
```

要件: $ARGUMENTS

設計への影響を深く考慮し、まず要件の背景と目的を理解するため対話を行い:
- どのような問題を解決したいか
- 期待される成果と成功基準
- 既存システムとの関係性

適度に要件が明確になったら、requirement-analyzerで分析し、規模に応じた適切な設計書を作成します。

設計の代替案とトレードオフを明確に提示します。

subagents-orchestration-guideのCall Examplesに従い、codebase-analyzerとcode-verifierを呼び出す。

## スコープ境界

**実行内容**:
- requirement-analyzerによる要件分析
- codebase-analyzerによるコードベース分析（技術設計の前に実施）
- ADR作成（アーキテクチャ変更、新技術、データフロー変更がある場合）
- technical-designerによるDesign Doc作成
- code-verifierによるDesign Doc検証（ドキュメントレビューの前に実施）
- document-reviewerによるドキュメントレビュー
- design-syncによるDesign Doc間整合性検証

**責務境界**: このコマンドは設計書承認で責務完了。

## 実行フロー

1. requirement-analyzer → 要件分析
2. codebase-analyzer → コードベース分析（要件分析結果を入力）
3. technical-designer → Design Doc作成（codebase-analyzer出力を入力）
4. code-verifier → Design Docを既存コードに対して検証
5. document-reviewer → 単一ドキュメント品質チェック（code-verifier結果を入力）
6. ユーザー承認（承認を待つ）
7. design-sync → Design Doc間整合性検証
   - 矛盾あり → ユーザーに報告 → 修正指示待ち → technical-designer(update)で修正
   - 矛盾なし → 終了

## 完了条件

- [ ] requirement-analyzerを実行し規模を判定した
- [ ] codebase-analyzerを実行し結果をtechnical-designerに渡した
- [ ] technical-designerで適切な設計書（ADRまたはDesign Doc）を作成した
- [ ] code-verifierでDesign Docを検証し結果をdocument-reviewerに渡した（ADRのみの場合はスキップ）
- [ ] document-reviewerを実行しフィードバックに対応した
- [ ] design-syncで整合性検証を実行した
- [ ] ユーザーから設計書の承認を取得した

## 出力例
設計フェーズが完了しました。
- 設計書: docs/design/[ドキュメント名].md
- 整合性: 他Design Docと矛盾なし（または修正完了）

**責務境界**: 本コマンドは設計承認＋整合性確認で終了。作業計画以降はスコープ外。
