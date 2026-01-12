---
description: 要件分析からフロントエンド設計ドキュメント作成まで実行
---

**コマンドコンテキスト**: このコマンドはフロントエンド設計フェーズ専用です。

subagents-orchestration-guideスキルの指針に従い、**オーケストレーター**として振る舞います。

**実行方法**:
- 要件分析 → requirement-analyzer
- 設計書作成 → technical-designer-frontend
- ドキュメントレビュー → document-reviewer

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡します。

**実行内容**:
- requirement-analyzerによる要件分析
- ADR作成（アーキテクチャ変更、データフロー変更がある場合）
- technical-designer-frontendによるDesign Doc作成
- document-reviewerによるドキュメントレビュー

**責務境界**: このコマンドは設計書承認で責務完了。

要件: $ARGUMENTS

## 実行フロー

### 1. 要件分析フェーズ
**Think harder**: 設計への影響が深いことを考慮し、まず対話により要件の背景と目的を理解：
- 何の問題を解決したいか
- 期待する成果と成功基準
- 既存システムとの関係

要件がある程度明確になったら：
- Taskツールで **requirement-analyzer** を呼び出し
  - `subagent_type: "requirement-analyzer"`
  - `description: "要件分析"`
  - `prompt: "要件: [ユーザー要件] 要件分析と規模判定を実施してください"`
- **[停止]**: 要件分析結果を確認し、質問事項に対応

### 2. 設計ドキュメント作成フェーズ
規模判定に応じて適切な設計ドキュメントを作成：
- Taskツールで **technical-designer-frontend** を呼び出し
  - ADRの場合: `subagent_type: "technical-designer-frontend"`, `description: "ADR作成"`, `prompt: "[技術決定]のADRを作成"`
  - Design Docの場合: `subagent_type: "technical-designer-frontend"`, `description: "Design Doc作成"`, `prompt: "要件に基づいてDesign Docを作成"`
- Taskツールで **document-reviewer** を呼び出して整合性検証
  - `subagent_type: "document-reviewer"`, `description: "ドキュメントレビュー"`, `prompt: "[ドキュメントパス]の整合性と完成度をレビュー"`
- **[停止]**: 設計の選択肢とトレードオフを提示し、ユーザー承認を取得

**スコープ**: フロントエンド設計ドキュメント（ADR/Design Doc）の承認まで。作業計画以降はこのコマンドの範囲外。

## 出力例
フロントエンド設計フェーズ完了。
- 設計ドキュメント: docs/design/[ドキュメント名].md または docs/adr/[ドキュメント名].md
- 承認ステータス: ユーザー承認済み

**重要**: このコマンドは設計承認で終了。次フェーズへの移行は提案しません。
