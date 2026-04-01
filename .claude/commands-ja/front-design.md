---
description: 要件分析からフロントエンド設計ドキュメント作成まで実行
---

**コマンドコンテキスト**: このコマンドはフロントエンド設計フェーズ専用です。

## オーケストレーター定義

**Role**: オーケストレーター

**実行方法**:
- 要件分析 → requirement-analyzerが実行
- UI Spec作成 → ui-spec-designerが実行
- 設計書作成 → technical-designer-frontendが実行
- ドキュメントレビュー → document-reviewerが実行

オーケストレーターはサブエージェントを呼び出し、構造化JSONを渡します。

## スコープ境界

**実行内容**:
- requirement-analyzerによる要件分析
- codebase-analyzerによるコードベース分析（Design Doc作成前に実施）
- ui-spec-designerによるUI Spec作成（プロトタイプコード確認を含む）
- ADR作成（アーキテクチャ変更、新技術、データフロー変更がある場合）
- technical-designer-frontendによるDesign Doc作成
- code-verifierによるDesign Doc検証（ドキュメントレビューの前に実施）
- document-reviewerによるドキュメントレビュー

**責務境界**: このコマンドはフロントエンド設計ドキュメント（UI Spec/ADR/Design Doc）の承認で責務完了。作業計画以降はスコープ外。

要件: $ARGUMENTS

## 実行フロー

### Step 1: 要件分析フェーズ
設計への影響が深いことを考慮し、まず対話により要件の背景と目的を理解:
- 何の問題を解決したいか
- 期待する成果と成功基準
- 既存システムとの関係

要件がある程度明確になったら:
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
  - `subagent_type: "document-reviewer"`, `description: "UI Specレビュー"`, `prompt: "doc_type: UISpec target: [ui-specパス] 整合性と完成度をレビュー"`
- **[停止]**: UI Specをユーザーに提示し承認を取得

### Step 3: 設計ドキュメント作成フェーズ
まず既存コードベースを分析:
- Agentツールで**codebase-analyzer**を呼び出す
  - `subagent_type: "codebase-analyzer"`, `description: "コードベース分析"`, `prompt: "requirement_analysis: [Step 1のJSON]. requirements: [ユーザー要件]. フロントエンド設計ガイダンスのため既存コードベースを分析。"`

規模判定に応じて適切な設計ドキュメントを作成:
- Agentツールで**technical-designer-frontend**を呼び出す
  - ADRの場合: `subagent_type: "technical-designer-frontend"`, `description: "ADR作成"`, `prompt: "[技術決定]のADRを作成"`
  - Design Docの場合: `subagent_type: "technical-designer-frontend"`, `description: "Design Doc作成"`, `prompt: "要件に基づいてDesign Docを作成。コードベース分析: [codebase-analyzerのJSON]。UI Specは[ui-specパス]。UI Specのコンポーネント構造と状態設計を継承。"`
- **（Design Docのみ）** **code-verifier**でDesign Docを既存コードに対して検証。ADRの場合はスキップ。
  - `subagent_type: "code-verifier"`, `description: "Design Doc検証"`, `prompt: "doc_type: design-doc document_path: [Design Docパス] Design Docを既存コードに対して検証。"`
- **document-reviewer**で整合性検証（Design Docの場合はcode-verifier結果を渡す。ADRの場合は省略）
  - `subagent_type: "document-reviewer"`, `description: "ドキュメントレビュー"`, `prompt: "doc_type: DesignDoc target: [ドキュメントパス] mode: composite code_verification: [code-verifierのJSON]（Design Docのみ） 整合性と完成度をレビュー。"`
- **[停止]**: 設計の選択肢とトレードオフを提示し、ユーザー承認を取得

## 出力例
フロントエンド設計フェーズ完了。
- UI Spec: docs/ui-spec/[機能名]-ui-spec.md
- 設計ドキュメント: docs/design/[ドキュメント名].md または docs/adr/[ドキュメント名].md
- 承認ステータス: ユーザー承認済み
