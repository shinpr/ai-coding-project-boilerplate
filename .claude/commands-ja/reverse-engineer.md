---
name: reverse-engineer
description: 既存コードベースからPRDとDesign Docを生成するリバースエンジニアリングワークフロー
---

**コマンドコンテキスト**: 既存コードからドキュメントを作成するリバースエンジニアリングワークフロー

対象: $ARGUMENTS

**TodoWrite登録**: まずフェーズをTodoWriteに登録し、各フェーズ開始時に詳細ステップを追加登録する。

## ステップ0: 初期設定

### 0.1 スコープ確認

AskUserQuestionで以下を確認:
1. **対象パス**: どのディレクトリ/モジュールをドキュメント化するか
2. **深度**: PRDのみ、またはPRD + Design Doc
3. **参照アーキテクチャ**: layered / mvc / clean / hexagonal / none
4. **人間レビュー**: あり（推奨） / なし（自律実行）

### 0.2 出力設定

- PRD出力先: `docs/prd/` または既存PRDディレクトリ
- Design Doc出力先: `docs/design/` または既存Design Docディレクトリ
- ディレクトリの存在確認、必要に応じて作成

## ワークフロー概要

```
フェーズ1: PRD生成
  ステップ1: スコープ発見（全ユニット）
  ステップ2-5: ユニット毎ループ（生成 → 検証 → レビュー → 修正）

フェーズ2: Design Doc生成（要求された場合）
  ステップ6: スコープ発見（PRD毎の全component）
  ステップ7-10: component毎ループ（生成 → 検証 → レビュー → 修正）
```

**コンテキスト受け渡し**: ステップ間で構造化JSON出力を受け渡す。`$STEP_N_OUTPUT`プレースホルダー記法を使用。

## フェーズ1: PRD生成

**TodoWrite登録**:
- ステップ1: PRDスコープ発見
- ユニット毎の処理（各ユニットに対してステップ2-5）

### ステップ1: PRDスコープ発見

**Task呼び出し**:
```
subagent_type: scope-discoverer
prompt: |
  コードベースからPRD対象を発見する。

  scope_type: prd
  target_path: $USER_TARGET_PATH
  reference_architecture: $USER_RA_CHOICE
  focus_area: $USER_FOCUS_AREA (指定時)
```

**出力を保存**: `$STEP_1_OUTPUT`

**品質ゲート**:
- 1つ以上のPRDユニットが発見された → 続行
- ユニットが発見されない → ユーザーにヒントを求める

**人間レビューポイント**（有効時）: 発見されたユニットを確認用に提示。

### ステップ2-5: ユニット毎の処理

**各ユニットについてステップ2→3→4→5を完了してから次のユニットへ進む。**

#### ステップ2: PRD生成

**Task呼び出し**:
```
subagent_type: prd-creator
prompt: |
  以下の機能のリバースエンジニアリングPRDを作成する。

  動作モード: reverse-engineer
  External Scope Provided: true

  機能: $UNIT_NAME ($STEP_1_OUTPUTより)
  説明: $UNIT_DESCRIPTION
  関連ファイル: $UNIT_RELATED_FILES
  エントリーポイント: $UNIT_ENTRY_POINTS

  独自のスコープ発見をスキップ。提供されたスコープデータを使用。
  指定スコープ内でのコード調査に基づき最終版PRDを作成。
```

**出力を保存**: `$STEP_2_OUTPUT`（PRDパス）

#### ステップ3: コード検証

**Task呼び出し**:
```
subagent_type: code-verifier
prompt: |
  PRDとコード実装の整合性を検証する。

  doc_type: prd
  document_path: $STEP_2_OUTPUT
  code_paths: $UNIT_RELATED_FILES ($STEP_1_OUTPUTより)
  verbose: false
```

**出力を保存**: `$STEP_3_OUTPUT`

**品質ゲート**:
- consistencyScore >= 70 → レビューへ進む
- consistencyScore < 70 → 詳細レビュー用にフラグ

#### ステップ4: レビュー

**必須入力**: $STEP_3_OUTPUT（ステップ3からの検証JSON）

**Task呼び出し**:
```
subagent_type: document-reviewer
prompt: |
  コード検証結果を考慮してPRDをレビューする。

  doc_type: PRD
  target: $STEP_2_OUTPUT
  mode: composite

  ## コード検証結果
  $STEP_3_OUTPUT

  ## 追加レビュー観点
  - PRD主張と検証evidenceの整合性
  - 各不整合に対する解決推奨
  - 未ドキュメント機能カバレッジの完全性
```

**出力を保存**: `$STEP_4_OUTPUT`

#### ステップ5: 修正（条件付き）

**トリガー条件**（以下のいずれか）:
- レビューステータスが「Needs Revision」または「Rejected」
- `$STEP_3_OUTPUT`にクリティカルな不整合が存在
- consistencyScore < 70

**Task呼び出し**:
```
subagent_type: prd-creator
prompt: |
  レビューフィードバックに基づきPRDを更新する。

  動作モード: update
  既存PRD: $STEP_2_OUTPUT

  ## レビューフィードバック
  $STEP_4_OUTPUT

  ## 対処すべき不整合
  （$STEP_3_OUTPUTからcriticalとmajorの不整合を抽出）

  修正と改善を適用する。
```

**ループ制御**: 最大2回の修正サイクル。2サイクル後はステータスに関わらず人間レビュー用にフラグ。

#### ユニット完了

- [ ] レビューステータスが「Approved」または「Approved with Conditions」
- [ ] 人間レビュー通過（ステップ0で有効化時）

**次へ**: 次のユニットへ進む。全ユニット完了後 → フェーズ2。

## フェーズ2: Design Doc生成

*ステップ0でDesign Docが要求された場合のみ実行*

**TodoWrite登録**:
- ステップ6: Design Docスコープ発見
- component毎の処理（各componentに対してステップ7-10）

### ステップ6: Design Docスコープ発見

承認済みPRD毎に:

**Task呼び出し**:
```
subagent_type: scope-discoverer
prompt: |
  PRDスコープ内でDesign Doc対象を発見する。

  scope_type: design-doc
  existing_prd: $APPROVED_PRD_PATH
  target_path: $PRD_RELATED_PATHS
  reference_architecture: $USER_RA_CHOICE
```

**出力を保存**: `$STEP_6_OUTPUT`

**品質ゲート**:
- 1つ以上のcomponentが発見された → 続行
- componentなし → ユーザーにヒントを求める

### ステップ7-10: component毎の処理

**各componentについてステップ7→8→9→10を完了してから次のcomponentへ進む。**

#### ステップ7: Design Doc生成

**Task呼び出し**:
```
subagent_type: technical-designer
prompt: |
  既存コードに基づき以下のcomponentのDesign Docを作成する。

  動作モード: create

  component: $COMPONENT_NAME ($STEP_6_OUTPUTより)
  責務: $COMPONENT_RESPONSIBILITY
  主要ファイル: $COMPONENT_PRIMARY_FILES
  public interface: $COMPONENT_PUBLIC_INTERFACES
  依存関係: $COMPONENT_DEPENDENCIES

  親PRD: $APPROVED_PRD_PATH

  現在のアーキテクチャをドキュメント化する。変更提案は行わない。
```

**出力を保存**: `$STEP_7_OUTPUT`

#### ステップ8: コード検証

**Task呼び出し**:
```
subagent_type: code-verifier
prompt: |
  Design Docとコード実装の整合性を検証する。

  doc_type: design-doc
  document_path: $STEP_7_OUTPUT
  code_paths: $COMPONENT_PRIMARY_FILES
  verbose: false
```

**出力を保存**: `$STEP_8_OUTPUT`

#### ステップ9: レビュー

**必須入力**: $STEP_8_OUTPUT（ステップ8からの検証JSON）

**Task呼び出し**:
```
subagent_type: document-reviewer
prompt: |
  コード検証結果を考慮してDesign Docをレビューする。

  doc_type: DesignDoc
  target: $STEP_7_OUTPUT
  mode: composite

  ## コード検証結果
  $STEP_8_OUTPUT

  ## 親PRD
  $APPROVED_PRD_PATH

  ## 追加レビュー観点
  - ドキュメント化されたinterfaceの技術的正確性
  - 親PRDスコープとの整合性
  - component境界定義の完全性
```

**出力を保存**: `$STEP_9_OUTPUT`

#### ステップ10: 修正（条件付き）

ステップ5と同様のロジック。updateモードでtechnical-designerを使用。

#### component完了

- [ ] レビューステータスが「Approved」または「Approved with Conditions」
- [ ] 人間レビュー通過（ステップ0で有効化時）

**次へ**: 次のcomponentへ進む。全component完了後 → 最終レポート。

## 最終レポート

以下を含むサマリを出力:
- 生成ドキュメント表（タイプ、名前、整合性スコア、レビューステータス）
- アクション項目（クリティカルな不整合、未ドキュメント機能、フラグ項目）
- 次のステップチェックリスト

## エラーハンドリング

| エラー | アクション |
|--------|-----------|
| 発見で何も見つからない | ユーザーにプロジェクト構造のヒントを求める |
| 生成が失敗 | 失敗をログ、他のユニットで続行、サマリで報告 |
| consistencyScore < 50 | 必須人間レビュー用にフラグ、自動承認しない |
| 2回の修正後もレビューが却下 | ループ停止、人間介入用にフラグ |
