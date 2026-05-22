---
description: コードベース分析からフロントエンド設計ドキュメント作成まで実行
---

**コマンドコンテキスト**: このコマンドはフロントエンド設計フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全ての作業をサブエージェントに委譲** — サブエージェントを呼び出し、データを橋渡しし、結果を報告する。唯一の例外はStep 1のスコープブートストラップで、シードファイルの特定に限定したレシピ内オーケストレータータスク。
2. **以下のフロントエンド設計フローを順に実行**（このコマンドは中規模/大規模のフロントエンドを対象） — 分岐のない固定の線形シーケンス:
   - 実行: スコープブートストラップ → codebase-analyzer → [停止: スコープ確認] → ui-analyzer → ui-spec-designer → technical-designer-frontend → code-verifier → document-reviewer → design-sync
   - technical-designer-frontendは、設計にアーキテクチャ決定が伴う場合（documentation-criteriaに従う）に前提となるADRを作成する。ADRはDesign Docを置き換えない — フローは常にDesign Doc作成と検証チェーン全体を通過する
   - **`[停止: ...]`マーカーごとに停止** → 次に進む前にユーザー承認を待つ
3. **スコープ**: 設計ドキュメントの承認をもって完了

**subagents-orchestration-guideの利用**: オーケストレーション原則とScale Determination表を参照する。このコマンドは独自の開始順序を定義する — ガイドのrequirement-analyzer起点フローはここでは適用しない。

**重要**: document-reviewer、design-sync（Design Docの場合）、全ての停止ポイントを実行する — 各々が品質ゲートとして機能する。スキップは検出されない不整合のリスクにつながる。

## ワークフロー概要

```
要件 → スコープブートストラップ → codebase-analyzer → [停止: スコープ確認]
                                                            ↓
                                                       ui-analyzer
                                                            ↓
                                              ui-spec-designer → [停止: UI Spec承認]
                                                            ↓
                                              technical-designer-frontend
                                                            ↓
                                              code-verifier → document-reviewer
                                                            ↓
                                                 design-sync → [停止: 設計承認]
```

## スコープ境界

**実行内容**:
- スコープブートストラップ: codebase-analyzerが値の入った入力を得られるようシードファイルを特定する
- codebase-analyzerによるコードベース分析（フロントエンド設計フェーズの入口）
- codebase-analyzerの所見に基づくユーザーとのスコープ確認
- ui-analyzerによるUI事実収集
- ui-spec-designerによるUI Spec作成（プロトタイプコード確認を含む）
- ADR作成（アーキテクチャ変更、新技術、データフロー変更が伴う場合、Design Docの前提として）
- technical-designer-frontendによるDesign Doc作成
- code-verifierによるDesign Doc検証（ドキュメントレビューの前に実施）
- document-reviewerによるドキュメントレビュー
- design-syncによるDesign Doc間整合性検証

**責務境界**: このコマンドはフロントエンド設計ドキュメント（UI Spec/ADR/Design Doc）の承認で責務完了。作業計画以降はスコープ外。

## 実行フロー

要件: $ARGUMENTS

### Step 1: スコープブートストラップ
codebase-analyzerは値の入った`requirement_analysis.affectedFiles`を必要とする。そのシードを、軽量なオーケストレーター内タスクで構築する — ファイルの特定のみで、深い読み込みや設計判断は行わない:

1. ユーザー要件から候補キーワード（機能名、ドメイン名詞、識別子）を抽出する。
2. Bash（`rg`、`rg`が使えない場合は`grep`）で、それらのキーワードに一致するファイルをリポジトリ内で検索する。
3. 一致したファイルパスをシード`affectedFiles`として収集する。
4. **検索結果が0件の場合**: 設計対象のファイルまたはモジュールをユーザーに確認し（AskUserQuestion）、その回答を`affectedFiles`とする。関連コードが存在しないとユーザーが確認した場合は、コードベース起点の設計が適用できない旨を報告し、進め方をユーザーと確認する。
5. **検索結果が約20件を超える場合**: キーワードが広すぎる。最も関連性の高い候補をユーザーに提示し（AskUserQuestion）、シード`affectedFiles`を確認してから進む。

このステップはシードファイルの特定のみを行う。ファイルの全文読み込み、依存関係の追跡、分析はcodebase-analyzerの責務である。

### Step 2: コードベース分析
- Agentツールで**codebase-analyzer**を呼び出す
  - `subagent_type: "codebase-analyzer"`, `description: "コードベース分析"`
  - `prompt`: `requirements`（ユーザー要件の原文）と`requirement_analysis`（`affectedFiles`（Step 1のシード）、`purpose`（ユーザー要件）、`scale`（シードファイル数にScale Determination表を当てた暫定値）、`technicalConsiderations`（`{ constraints: [], risks: [], dependencies: [] }`）を含むJSONオブジェクト）を含める。フロントエンド設計ガイダンスのため既存コードベースを分析する。

### Step 3: スコープ確認
codebase-analyzerが返ったら、設計作業の前にユーザーとスコープを確認する。AskUserQuestionを使う。

codebase-analyzerのJSONを出典として以下を提示する:
- **対象ファイル/モジュール**: `analysisScope.filesAnalyzed`と、それらが属するモジュール
- **影響を受けるレイヤー**: `analysisScope.categoriesDetected`と`focusAreas`から導出される、影響を受けるレイヤー
- **不明点/前提**: `limitations`と、codebase-analyzerが記録した前提
- **設計前の質問事項**: 設計を進める前にユーザーの回答が必要な未解決点

ユーザーに以下から1つを選んでもらう:
- **このスコープで設計を進める** — Step 4へ進む
- **スコープを修正して再実行** — 修正したスコープでStep 1に戻る。ユーザーが修正後のファイルまたはモジュールを指定した場合は、検索で導出し直さず、それをStep 1のシードとして直接使う
- **追加ヒアリングののち進める** — 不足している回答を集めてからStep 4へ進む

ユーザーがスコープを確認したら、確認済みの対象ファイル数を数え、Scale Determination表から規模を設定する。この確認済みの規模はStep 2の暫定値に優先する。

**[停止]**: ユーザーの選択を待ってから進む。

### Step 4: UI事実収集
- Agentツールで**ui-analyzer**を呼び出す
  - `subagent_type: "ui-analyzer"`, `description: "UI事実収集"`
  - `prompt`: `requirements`（ユーザー要件）と`requirement_analysis`（`affectedFiles`（Step 2のcodebase-analyzer出力の`analysisScope.filesAnalyzed`・`analysisScope.tracedDependencies`・`focusAreas[].relatedFiles`のパスの和集合）、`purpose`（ユーザー要件）、`scale`（Step 3の確認済み規模）、`technicalConsiderations`（`{ constraints: [], risks: [], dependencies: [] }`）を含むJSONオブジェクト）を含める。ui-analyzerはproject-contextのExternal Resourcesセクションを読み、宣言されたアクセス手段で外部UIソースを取得し、既存のUIコードベースを分析する。

codebase-analyzerのJSON（Step 2）とui-analyzerのJSON（Step 4）は、ui-spec-designerとtechnical-designer-frontendで再利用される。

### Step 5: UI Specフェーズ
プロトタイプコードについてユーザーに確認する。

**ユーザーに確認**: 「この機能のプロトタイプコードはありますか？ある場合はコードへのパスを教えてください。プロトタイプはUI Specの参考資料として`docs/ui-spec/assets/`に配置されます。」

- **[停止]**: プロトタイプコードの有無についてユーザーの回答を待つ

その後、UI Specを作成する:
- Agentツールで**ui-spec-designer**を呼び出す
  - `subagent_type: "ui-spec-designer"`, `description: "UI Spec作成"`
  - 以下を含めてプロンプトを構築する: ソース（この機能の既存PRDが`docs/prd/`にあればそれ。なければ、ユーザー要件にStep 2のcodebase-analyzer JSONとStep 3の確認済みスコープを添えたもの）、`ui_analysis`（Step 4のui-analyzer JSON）、提供された場合のプロトタイプパス。プロトタイプは`docs/ui-spec/assets/{feature-name}/`に配置する。
- **document-reviewer**でUI Specを検証する
  - `subagent_type: "document-reviewer"`, `description: "UI Specレビュー"`, `prompt: "doc_type: UISpec target: [ui-specパス] 整合性と完全性をレビュー"`
- **[停止]**: UI Specをユーザーに提示し承認を取得する

### Step 6: 設計ドキュメント作成フェーズ
- Agentツールで**technical-designer-frontend**を呼び出し、設計ドキュメントを作成する。documentation-criteriaに従いDesign Docを作成する。設計にアーキテクチャ決定（アーキテクチャ変更、新技術、データフロー変更）が伴う場合は、前提となるADRを先に作成する。
  - `subagent_type: "technical-designer-frontend"`, `description: "設計ドキュメント作成"`, `prompt: "この要件の設計ドキュメントを作成。documentation-criteriaに従いDesign Docを作成し、設計にアーキテクチャ決定が伴う場合は前提となるADRを先に作成。要件: [ユーザー要件の原文]。コードベース分析: [Step 2のcodebase-analyzer JSON]。UI分析: [Step 4のui-analyzer JSON]。UI Specは[ui-specパス]。UI Specのコンポーネント構造と状態設計を継承。少なくとも2つのアーキテクチャ選択肢をトレードオフとともに提示。"`
- **code-verifier**でDesign Docを既存コードに対して検証する。
  - `subagent_type: "code-verifier"`, `description: "Design Doc検証"`, `prompt: "doc_type: design-doc document_path: [Design Docパス] mode: pre-implementation (code_paths省略 — verifierがドキュメントからスコープを発見). Design Docを既存コードに対して検証。"`
- technical-designer-frontendが作成した各ドキュメント（Design Doc、および作成された場合のADR）に対して**document-reviewer**を呼び出す。
  - Design Doc: `subagent_type: "document-reviewer"`, `description: "ドキュメントレビュー"`, `prompt: "doc_type: DesignDoc target: [Design Docパス] mode: composite codebase_analysis: [Step 2のcodebase-analyzer JSON] code_verification: [code-verifierのJSON]. 整合性と完全性をレビュー。"`
  - ADR（作成された場合）: `subagent_type: "document-reviewer"`, `description: "ADRレビュー"`, `prompt: "doc_type: ADR target: [ADRパス] mode: composite. 整合性と完全性をレビュー。"`
- ADRレビューで修正が必要になった場合、technical-designer-frontend(update)がADRを修正し、修正後のADRに合わせてDesign Docを再整合させる — Design Docは未レビューまたは古いADRの上に立ってはならない。この再整合でDesign Docが変わった場合は、更新後のDesign Docに対してcode-verifierとDesign Docのdocument-reviewerを再実行し、検証が最終内容を反映するようにする。

### Step 7: 設計整合性検証
- Agentツールで**design-sync**を呼び出す。
  - `subagent_type: "design-sync"`, `description: "設計整合性チェック"`, `prompt: "docs/design/配下の全Design Doc間の整合性をチェック。矛盾と重複を報告。"`
- **[停止]**: 設計ドキュメント（Design Docの場合はdesign-sync結果も）を提示し、ユーザー承認を取得する

## 完了条件

- [ ] Step 1のスコープブートストラップのシードを構築した（または検索結果が0件のときユーザーから対象ファイルを取得した）
- [ ] 値の入った`requirement_analysis`でcodebase-analyzerを実行した
- [ ] ユーザーと設計スコープを確認し、確認済みの対象ファイルから規模を設定した
- [ ] ui-analyzerを実行した。codebase-analyzer（Step 2）とui-analyzer（Step 4）の出力はui-spec-designerとtechnical-designer-frontendで再利用される
- [ ] ui-spec-designerでUI Specを作成した
- [ ] technical-designer-frontendでDesign Docを作成した。設計にアーキテクチャ決定が伴う場合は前提となるADRを先に作成した
- [ ] Design Docに対してcode-verifierを実行し、結果をdocument-reviewerに渡した
- [ ] 作成した各ドキュメント（Design Doc、および作成された場合のADR）に対してdocument-reviewerを実行し、フィードバックに対応した
- [ ] design-syncで整合性検証を実行した
- [ ] 設計ドキュメントのユーザー承認を取得した

## 出力例
フロントエンド設計フェーズ完了。
- UI Spec: docs/ui-spec/[機能名]-ui-spec.md
- 設計ドキュメント: docs/design/[ドキュメント名].md または docs/adr/[ドキュメント名].md
- 承認ステータス: ユーザー承認済み
