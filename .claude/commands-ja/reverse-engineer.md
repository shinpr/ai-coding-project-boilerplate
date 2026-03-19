---
description: 既存コードベースからPRDとDesign Docを生成するリバースエンジニアリングワークフロー
---

**コマンドコンテキスト**: 既存コードからドキュメントを作成するリバースエンジニアリングワークフロー

対象: $ARGUMENTS

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、成果物パスの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **1ステップずつ順次実行**: 各ユニット内でステップを順次実行（2→3→4→5）。各ステップの出力が次ステップの必須入力。1ユニットの全ステップを完了してから次のユニットへ
3. **`$STEP_N_OUTPUT`をそのまま渡す** — オーケストレーターはデータを加工・フィルタリングせず中継する

**タスク登録**: まずフェーズをTaskCreateで登録し、各フェーズ開始時に詳細ステップを追加登録する。

## ステップ0: 初期設定

### 0.1 スコープ確認

AskUserQuestionで以下を確認:
1. **対象パス**: どのディレクトリ/モジュールをドキュメント化するか
2. **深度**: PRDのみ、またはPRD + Design Doc
3. **参照アーキテクチャ**: layered / mvc / clean / hexagonal / none
4. **人間レビュー**: あり（推奨） / なし（自律実行）
5. **フルスタック設計**: Yes / No
   - Yes: ユニット毎にbackend + frontendのDesign Doc生成を有効化

### 0.2 出力設定

- PRD出力先: `docs/prd/` または既存PRDディレクトリ
- Design Doc出力先: `docs/design/` または既存Design Docディレクトリ
- ディレクトリの存在確認、必要に応じて作成

## ワークフロー概要

```
フェーズ1: PRD生成
  ステップ1: スコープ発見（統合、シングルパス）
  ステップ2-5: ユニット毎ループ（生成 → 検証 → レビュー → 修正）

フェーズ2: Design Doc生成（要求された場合）
  ステップ6: Design Docスコープマッピング（ステップ1の結果を再利用）
  ステップ7-10: ユニット毎ループ（生成 → 検証 → レビュー → 修正）
  ※ fullstack=Yes: ユニットのスコープに応じてbackend + frontend Design Docを生成
```

## フェーズ1: PRD生成

**タスク登録**:
- ステップ1: PRDスコープ発見
- ユニット毎の処理（各ユニットに対してステップ2-5）

### ステップ1: PRDスコープ発見

**Task呼び出し**:
```
subagent_type: scope-discoverer
prompt: |
  コードベースから機能スコープ対象を発見する。

  target_path: $USER_TARGET_PATH
  reference_architecture: $USER_RA_CHOICE
  focus_area: $USER_FOCUS_AREA (指定時)
```

**出力を保存**: `$STEP_1_OUTPUT`

**品質ゲート**:
- 1つ以上のユニットが発見された → 続行
- ユニットが発見されない → ユーザーにヒントを求める

**人間レビューポイント**（有効時）: 発見されたユニットを確認用に提示。

### ステップ2-5: ユニット毎の処理

**FOR** `$STEP_1_OUTPUT.discoveredUnits`の各ユニット **（逐次実行、1ユニットずつ）**:

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

**前提条件**: $STEP_2_OUTPUT（ステップ2のPRDパス）

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

  ## コード検証結果
  $STEP_3_OUTPUT

  severity別に対処する:
  - critical: 必須修正 — 中核的な振る舞いの誤りまたは欠落
  - important: 推奨修正 — 正確性や完全性の向上
  - recommended: 任意修正 — 文体や軽微な改善
```

**ループ制御**: 最大2回の修正サイクル。2サイクル後はステータスに関わらず人間レビュー用にフラグ。

#### ユニット完了

- [ ] レビューステータスが「Approved」または「Approved with Conditions」
- [ ] 人間レビュー通過（ステップ0で有効化時）

**次へ**: 次のユニットへ進む。全ユニット完了後 → フェーズ2。

## フェーズ2: Design Doc生成

*ステップ0でDesign Docが要求された場合のみ実行*

**タスク登録**:
- ステップ6: Design Docスコープマッピング
- ユニット毎の処理（各ユニットに対してステップ7-10）

### ステップ6: Design Docスコープマッピング

`$STEP_1_OUTPUT`（スコープ発見結果）をそのまま使用する。fullstack=Yesの場合、ユニットの`relatedFiles`と`technicalProfile.primaryModules`のパスパターンからbackend / frontend / 両方のいずれが必要かをユニット毎に判定する（technical-specスキルのプロジェクト構造定義を参照）。

`$STEP_1_OUTPUT`のユニットから以下を引き継ぐ:
- `technicalProfile.primaryModules` → 主要ファイル
- `technicalProfile.publicInterfaces` → publicインターフェース
- `dependencies` → 依存関係
- `relatedFiles` → スコープ境界

**出力を保存**: `$STEP_6_OUTPUT`

### ステップ7-10: ユニット毎の処理

**FOR** `$STEP_6_OUTPUT.designDocTargets`の各ユニット **（逐次実行、1ユニットずつ）**:

#### ステップ7: Design Doc生成

`$STEP_6_OUTPUT`のマッピング結果に基づき、ユニット毎に必要なDesign Docを生成する。

fullstack=Yesの場合、7aの後に7bを逐次実行する（7bは7aの出力に依存）。

**7a.** バックエンドDesign Doc（technical-designer）:

fullstack=Yes時: promptに「対象: APIコントラクト、データ層、ビジネスロジック、サービスアーキテクチャ。」を追加する。

**Task呼び出し**:
```
subagent_type: technical-designer
prompt: |
  既存コードに基づき以下の機能のDesign Docを作成する。

  動作モード: create

  機能: $UNIT_NAME ($STEP_6_OUTPUTより)
  説明: $UNIT_DESCRIPTION
  主要ファイル: $UNIT_PRIMARY_MODULES
  publicインターフェース: $UNIT_PUBLIC_INTERFACES
  依存関係: $UNIT_DEPENDENCIES

  親PRD: $APPROVED_PRD_PATH

  現在のアーキテクチャをドキュメント化する。変更提案は行わない。
```

**出力を保存**: `$STEP_7_OUTPUT`

**7b.** フロントエンドDesign Doc（fullstack、フロントエンドスコープを含むユニット）:

```
subagent_type: technical-designer-frontend
prompt: |
  既存コードに基づき以下の機能のフロントエンドDesign Docを作成する。

  動作モード: create

  機能: $UNIT_NAME ($STEP_6_OUTPUTより)
  説明: $UNIT_DESCRIPTION
  主要ファイル: $UNIT_PRIMARY_MODULES
  publicインターフェース: $UNIT_PUBLIC_INTERFACES
  依存関係: $UNIT_DEPENDENCIES

  親PRD: $APPROVED_PRD_PATH
  バックエンドDesign Doc: $STEP_7_OUTPUT

  バックエンドDesign DocのAPIコントラクトを参照。
  対象: コンポーネント階層、状態管理、UI操作、データ取得。
  現在のアーキテクチャをドキュメント化する。変更提案は行わない。
```

**出力を保存**: `$STEP_7_FRONTEND_OUTPUT`

#### ステップ8: コード検証

生成された各Design Docに対して個別に検証を実行する。

**Task呼び出し（Design Doc毎）**:
```
subagent_type: code-verifier
prompt: |
  Design Docとコード実装の整合性を検証する。

  doc_type: design-doc
  document_path: $STEP_7_OUTPUT または $STEP_7_FRONTEND_OUTPUT
  code_paths: $UNIT_PRIMARY_MODULES
  verbose: false
```

**出力を保存**: `$STEP_8_OUTPUT`

#### ステップ9: レビュー

**必須入力**: $STEP_8_OUTPUT（ステップ8からの検証JSON）

**Task呼び出し（Design Doc毎）**:
```
subagent_type: document-reviewer
prompt: |
  コード検証結果を考慮してDesign Docをレビューする。

  doc_type: DesignDoc
  target: $STEP_7_OUTPUT または $STEP_7_FRONTEND_OUTPUT
  mode: composite

  ## コード検証結果
  $STEP_8_OUTPUT

  ## 親PRD
  $APPROVED_PRD_PATH

  ## 追加レビュー観点
  - ドキュメント化されたインターフェースの技術的正確性
  - 親PRDスコープとの整合性
  - ユニット境界定義の完全性
```

**出力を保存**: `$STEP_9_OUTPUT`

#### ステップ10: 修正（条件付き）

**トリガー条件**（以下のいずれか）:
- レビューステータスが「Needs Revision」または「Rejected」
- `$STEP_8_OUTPUT`にクリティカルな不整合が存在
- consistencyScore < 70

**バックエンドDesign Doc修正**（technical-designer）:
```
subagent_type: technical-designer
prompt: |
  レビューフィードバックに基づきDesign Docを更新する。

  動作モード: update
  既存ドキュメント: $STEP_7_OUTPUT

  ## レビューフィードバック
  $STEP_9_OUTPUT

  ## コード検証結果
  $STEP_8_OUTPUT

  severity別に対処する:
  - critical: 必須修正 — 中核的な振る舞いの誤りまたは欠落
  - important: 推奨修正 — 正確性や完全性の向上
  - recommended: 任意修正 — 文体や軽微な改善
```

**フロントエンドDesign Doc修正**（fullstack、technical-designer-frontend）:
```
subagent_type: technical-designer-frontend
prompt: |
  レビューフィードバックに基づきフロントエンドDesign Docを更新する。

  動作モード: update
  既存ドキュメント: $STEP_7_FRONTEND_OUTPUT

  ## レビューフィードバック
  $STEP_9_OUTPUT

  ## コード検証結果
  $STEP_8_OUTPUT

  severity別に対処する:
  - critical: 必須修正 — 中核的な振る舞いの誤りまたは欠落
  - important: 推奨修正 — 正確性や完全性の向上
  - recommended: 任意修正 — 文体や軽微な改善
```

**ループ制御**: 最大2回の修正サイクル。2サイクル後はステータスに関わらず人間レビュー用にフラグ。

#### ユニット完了

- [ ] レビューステータスが「Approved」または「Approved with Conditions」
- [ ] 人間レビュー通過（ステップ0で有効化時）

**次へ**: 次のユニットへ進む。全ユニット完了後 → 最終レポート。

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
