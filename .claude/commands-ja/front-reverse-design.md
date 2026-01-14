---
name: front-reverse-design
description: 既存PRDを使用して既存コードベースからフロントエンドDesign Docを生成
---

**コマンドコンテキスト**: 既存コードからフロントエンドDesign Docを作成するリバースエンジニアリングワークフロー

**前提条件**: PRDが存在すること（reverse-engineerまたは手動で作成）

対象PRD: $ARGUMENTS

**TodoWrite登録**: まずフェーズを登録し、各フェーズ開始時にステップを登録。

## ステップ0: 初期設定

### 0.1 スコープ確認

AskUserQuestionを使用して確認:
1. **PRDパス**: どのPRDを基準にするか
2. **対象パス**: どのフロントエンドディレクトリ/モジュールをドキュメント化するか
3. **人間レビュー**: Yes（推奨）/ No（完全自律）

### 0.2 出力設定

- Design Doc出力先: `docs/design/` または既存の設計ディレクトリ
- ディレクトリの存在確認、必要に応じて作成

## ワークフロー概要

```
ステップ1: スコープ発見（PRDに基づく全フロントエンドコンポーネント）
ステップ2-5: コンポーネントごとのループ（生成 → 検証 → レビュー → 修正）
```

**コンテキスト伝達**: ステップ間で構造化JSON出力を受け渡す。`$STEP_N_OUTPUT`プレースホルダー記法を使用。

## ステップ1: Design Docスコープ発見

**Task呼び出し**:
```
subagent_type: scope-discoverer
prompt: |
  PRDスコープ内のフロントエンドDesign Doc対象を発見。

  scope_type: design-doc
  existing_prd: $USER_PRD_PATH
  target_path: $USER_TARGET_PATH
  focus: frontend (React/TypeScriptコンポーネント、フック、状態管理)
```

**出力を保存**: `$STEP_1_OUTPUT`

**品質ゲート**:
- 少なくとも1つのコンポーネントが発見された → 続行
- コンポーネントなし → ユーザーにヒントを求める

**人間レビューポイント**（ステップ0.1でYesの場合）: 発見されたコンポーネントを確認用に提示。

## ステップ2-5: コンポーネントごとの処理

**次のコンポーネントに進む前に、各コンポーネントでステップ2→3→4→5を完了する。**

### ステップ2: Design Doc生成

**Task呼び出し**:
```
subagent_type: technical-designer-frontend
prompt: |
  既存コードに基づいて以下のフロントエンドコンポーネントのDesign Docを作成。

  Operation Mode: create

  Component: $COMPONENT_NAME (from $STEP_1_OUTPUT)
  Responsibility: $COMPONENT_RESPONSIBILITY
  Primary Files: $COMPONENT_PRIMARY_FILES
  Public Interfaces: $COMPONENT_PUBLIC_INTERFACES
  Dependencies: $COMPONENT_DEPENDENCIES

  Parent PRD: $USER_PRD_PATH

  現在のアーキテクチャをドキュメント化。変更提案は不要。
```

**出力を保存**: `$STEP_2_OUTPUT`

### ステップ3: コード検証

**Task呼び出し**:
```
subagent_type: code-verifier
prompt: |
  Design Docとコード実装間の整合性を検証。

  doc_type: design-doc
  document_path: $STEP_2_OUTPUT
  code_paths: $COMPONENT_PRIMARY_FILES
  verbose: false
```

**出力を保存**: `$STEP_3_OUTPUT`

**品質ゲート**:
- consistencyScore >= 70 → レビューに進む
- consistencyScore < 70 → 詳細レビュー対象としてフラグ

### ステップ4: レビュー

**必須入力**: $STEP_3_OUTPUT（ステップ3の検証JSON）

**Task呼び出し**:
```
subagent_type: document-reviewer
prompt: |
  コード検証結果を考慮して以下のDesign Docをレビュー。

  doc_type: DesignDoc
  target: $STEP_2_OUTPUT
  mode: composite

  ## コード検証結果
  $STEP_3_OUTPUT

  ## 親PRD
  $USER_PRD_PATH

  ## 追加レビュー重点
  - ドキュメント化されたインターフェースの技術的正確性
  - 親PRDスコープとの整合性
  - コンポーネント境界定義の完全性
```

**出力を保存**: `$STEP_4_OUTPUT`

### ステップ5: 修正（条件付き）

**トリガー条件**（いずれか1つ）:
- レビューステータスが「Needs Revision」または「Rejected」
- `$STEP_3_OUTPUT`に重大な不整合が存在
- consistencyScore < 70

**Task呼び出し**:
```
subagent_type: technical-designer-frontend
prompt: |
  レビューフィードバックに基づいてDesign Docを更新。

  Operation Mode: update
  Existing Design Doc: $STEP_2_OUTPUT

  ## レビューフィードバック
  $STEP_4_OUTPUT

  ## 対処すべき不整合
  （$STEP_3_OUTPUTから重大・主要な不整合を抽出）

  修正と改善を適用。
```

**ループ制御**: 最大2回の修正サイクル。2サイクル後、ステータスに関わらず人間レビュー対象としてフラグ。

### コンポーネント完了

- [ ] レビューステータスが「Approved」または「Approved with Conditions」
- [ ] 人間レビュー通過（ステップ0で有効な場合）

**次へ**: 次のコンポーネントに進む。全コンポーネント完了後 → 最終レポート。

## 最終レポート

以下を含むサマリーを出力:
- 生成ドキュメント表（コンポーネント、Design Docパス、整合性スコア、レビューステータス）
- アクション項目（重大な不整合、未ドキュメント化機能、フラグ項目）
- 次ステップチェックリスト

## エラーハンドリング

| エラー | アクション |
|-------|---------|
| PRDが見つからない | ユーザーに正しいPRDパスを確認 |
| 発見で何も見つからない | ユーザーにプロジェクト構造のヒントを確認 |
| 生成失敗 | 失敗をログ、他コンポーネントで続行、サマリーで報告 |
| consistencyScore < 50 | 必須人間レビュー対象としてフラグ、自動承認不可 |
| 2回修正後もレビュー却下 | ループ停止、人間介入対象としてフラグ |
