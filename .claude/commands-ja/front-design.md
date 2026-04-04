---
description: 要件分析からフロントエンド設計ドキュメント作成まで実行
---

**コマンドコンテキスト**: このコマンドはフロントエンド設計フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全ての作業をサブエージェントに委譲** — サブエージェントを呼び出し、データを橋渡しし、結果を報告する
2. **以下のフロントエンド設計フローに従う**（このコマンドは中規模/大規模のフロントエンドを対象。UI Specはコードベース分析の前に作成する — コンポーネント構造が技術設計に反映されるため）:
   - 実行: requirement-analyzer → ui-spec-designer → codebase-analyzer → technical-designer-frontend → code-verifier → document-reviewer → design-sync
   - **`[停止: ...]`マーカーごとに停止** → ユーザー承認を待つ
3. **スコープ**: 設計ドキュメントの承認をもって完了

**重要**: document-reviewer、design-sync、subagents-orchestration-guideスキルフローで定義された全ての停止ポイントを実行すること — 各ステップが品質ゲートとして機能する。スキップは検出されない不整合のリスクにつながる。

## ワークフロー概要

```
要件 → requirement-analyzer → [停止: 規模判定]
                                    ↓
                            ui-spec-designer → [停止: UI Spec承認]
                                    ↓
                            codebase-analyzer → technical-designer-frontend
                                    ↓
                            code-verifier → document-reviewer
                                    ↓
                               design-sync → [停止: 設計承認]
```

## スコープ境界

**実行内容**:
- requirement-analyzerによる要件分析
- codebase-analyzerによるコードベース分析（技術設計の前に実施）
- ui-spec-designerによるUI Spec作成（プロトタイプコード確認を含む）
- ADR作成（アーキテクチャ変更、新技術、データフロー変更がある場合）
- technical-designer-frontendによるDesign Doc作成
- code-verifierによるDesign Doc検証（ドキュメントレビューの前に実施）
- document-reviewerによるドキュメントレビュー
- design-syncによるDesign Doc横断整合性検証

**責務境界**: このコマンドはフロントエンド設計ドキュメント（UI Spec/ADR/Design Doc）の承認で責務完了。作業計画以降はスコープ外。

要件: $ARGUMENTS

## 実行フロー

### Step 1: 要件分析フェーズ
設計への影響が深いことを考慮し、まず対話により要件の背景と目的を理解:
- 何の問題を解決したいか
- 期待する成果と成功基準
- 既存システムとの関係

ユーザーが上記3つの質問に回答した後、設計スコープ内で以下のプロセスを実行する。codebase-analyzerとcode-verifierの呼び出しはsubagents-orchestration-guideのCall Examplesに従う。
- Agentツールで**requirement-analyzer**を呼び出す
  - `subagent_type: "requirement-analyzer"`
  - `description: "要件分析"`
  - `prompt: "要件: [ユーザー要件] 要件分析と規模判定を実施してください"`
- **[停止]**: 要件分析結果を確認し、質問事項に対応

### Step 2: UI Specフェーズ
要件分析承認後、プロトタイプコードについてユーザーに確認:

**ユーザーに確認**: 「この機能のプロトタイプコードはありますか？ある場合はコードへのパスを教えてください。プロトタイプはUI Specの参考資料として`docs/ui-spec/assets/`に配置されます。」

- **[停止]**: プロトタイプコードの有無についてユーザーの回答を待つ

UI Specを作成:
- Agentツールで**ui-spec-designer**を呼び出す
  - `subagent_type: "ui-spec-designer"`
  - `description: "UI Spec作成"`
  - PRDあり＋プロトタイプあり: `prompt: "[パス]のPRDからUI Specを作成。プロトタイプコードは[ユーザー提供パス]。プロトタイプをdocs/ui-spec/assets/{feature-name}/に配置"`
  - PRDあり＋プロトタイプなし: `prompt: "[パス]のPRDからUI Specを作成。プロトタイプコードなし。"`
  - PRDなし（中規模）: `prompt: "以下の要件に基づいてUI Specを作成: [requirement-analyzerの出力を渡す]。PRDなし。"`（プロトタイプパスがあれば追加）
- **document-reviewer**でUI Specを検証
  - `subagent_type: "document-reviewer"`, `description: "UI Specレビュー"`, `prompt: "doc_type: UISpec target: [ui-specパス] 整合性と完全性をレビュー"`
- **[停止]**: UI Specをユーザーに提示し承認を取得

### Step 3: 設計ドキュメント作成フェーズ
まず既存コードベースを分析:
- Agentツールで**codebase-analyzer**を呼び出す
  - `subagent_type: "codebase-analyzer"`, `description: "コードベース分析"`, `prompt: "requirement_analysis: [Step 1のJSON]. requirements: [ユーザー要件]. フロントエンド設計ガイダンスのため既存コードベースを分析。"`

規模判定に応じて適切な設計ドキュメントを作成。technical-designer-frontendは技術選択・データフロー設計について少なくとも2つの選択肢をトレードオフとともに提示:
- Agentツールで**technical-designer-frontend**を呼び出す
  - ADRの場合: `subagent_type: "technical-designer-frontend"`, `description: "ADR作成"`, `prompt: "[技術決定]のADRを作成。少なくとも2つの選択肢をトレードオフとともに提示。"`
  - Design Docの場合: `subagent_type: "technical-designer-frontend"`, `description: "Design Doc作成"`, `prompt: "要件に基づいてDesign Docを作成。コードベース分析: [codebase-analyzerのJSON]。UI Specは[ui-specパス]。UI Specのコンポーネント構造と状態設計を継承。少なくとも2つのアーキテクチャ選択肢をトレードオフとともに提示。"`
- **（Design Docのみ）** **code-verifier**でDesign Docを既存コードに対して検証。ADRの場合はスキップ。
  - `subagent_type: "code-verifier"`, `description: "Design Doc検証"`, `prompt: "doc_type: design-doc document_path: [Design Docパス] mode: pre-implementation (code_paths省略 — verifierがドキュメントからスコープを発見). Design Docを既存コードに対して検証。"`
- **document-reviewer**で整合性検証（Design Docの場合はcode-verifier結果を渡す。ADRの場合は省略）
  - `subagent_type: "document-reviewer"`, `description: "ドキュメントレビュー"`, `prompt: "doc_type: DesignDoc target: [ドキュメントパス] mode: composite code_verification: [code-verifierのJSON]（Design Docのみ） 整合性と完全性をレビュー。"`
### Step 4: 設計整合性検証
- Agentツールで**design-sync**を呼び出す
  - `subagent_type: "design-sync"`, `description: "設計整合性チェック"`, `prompt: "docs/design/配下の全Design Doc間の整合性をチェック。矛盾と重複を報告。"`
- **[停止]**: 設計ドキュメントとdesign-sync結果を提示し、ユーザー承認を取得

## 完了条件

- [ ] requirement-analyzerを実行し規模を判定
- [ ] codebase-analyzerを実行し結果をtechnical-designer-frontendに渡した
- [ ] ui-spec-designerでUI Specを作成（該当時）
- [ ] technical-designer-frontendで適切な設計ドキュメント（ADRまたはDesign Doc）を作成
- [ ] Design Docに対してcode-verifierを実行し結果をdocument-reviewerに渡した（ADRのみの場合はスキップ）
- [ ] document-reviewerを実行しフィードバックに対応
- [ ] design-syncで整合性検証を実行
- [ ] 設計ドキュメントのユーザー承認を取得

## 出力例
フロントエンド設計フェーズ完了。
- UI Spec: docs/ui-spec/[機能名]-ui-spec.md
- 設計ドキュメント: docs/design/[ドキュメント名].md または docs/adr/[ドキュメント名].md
- 承認ステータス: ユーザー承認済み
