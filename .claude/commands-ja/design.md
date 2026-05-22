---
description: コードベース分析から設計書作成まで実行
---

**コマンドコンテキスト**: このコマンドは設計フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）。唯一の例外はStep 1のスコープブートストラップで、シードファイルの特定に限定したレシピ内オーケストレータータスク。
2. **以下の設計フローを順に実行** — 分岐のない固定の線形シーケンス:
   - 実行: スコープブートストラップ → codebase-analyzer → [停止: スコープ確認] → technical-designer → code-verifier → document-reviewer → design-sync
   - technical-designerは、設計にアーキテクチャ決定が伴う場合（documentation-criteriaに従う）に前提となるADRを作成する。ADRはDesign Docを置き換えない — フローは常にDesign Doc作成と検証チェーン全体を通過する
   - **`[停止: ...]`マーカーで必ず停止** → 次に進む前にユーザー承認を待つ
3. **スコープ**: 設計書が承認されたら完了

**subagents-orchestration-guideの利用**: オーケストレーション原則（Delegation Boundary、Decision precedence、許可ツール）とScale Determination表を参照する。このコマンドは独自の開始順序を定義する — ガイドのrequirement-analyzer起点フローはここでは適用しない。

**重要**: document-reviewer、design-sync（Design Docの場合）、停止ポイントは決してスキップしない — 各々が品質ゲートとして機能する。

## ワークフロー概要

```
要件 → スコープブートストラップ → codebase-analyzer → [停止: スコープ確認]
                                                            ↓
                                                    technical-designer
                                                            ↓
                                                    code-verifier → document-reviewer
                                                            ↓
                                                       design-sync → [停止: 設計承認]
```

## スコープ境界

**実行内容**:
- スコープブートストラップ: codebase-analyzerが値の入った入力を得られるようシードファイルを特定する
- codebase-analyzerによるコードベース分析（設計フェーズの入口）
- codebase-analyzerの所見に基づくユーザーとのスコープ確認
- ADR作成（アーキテクチャ変更、新技術、データフロー変更が伴う場合、Design Docの前提として）
- technical-designerによるDesign Doc作成
- code-verifierによるDesign Doc検証（ドキュメントレビューの前に実施）
- document-reviewerによるドキュメントレビュー
- design-syncによるDesign Doc間整合性検証

**責務境界**: このコマンドは設計書承認で責務完了。

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
  - `prompt`: `requirements`（ユーザー要件の原文）と`requirement_analysis`（`affectedFiles`（Step 1のシード）、`purpose`（ユーザー要件）、`scale`（シードファイル数にScale Determination表を当てた暫定値）、`technicalConsiderations`（`{ constraints: [], risks: [], dependencies: [] }`）を含むJSONオブジェクト）を含める

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

### Step 4: 設計書作成
1. **technical-designer** → 設計書を作成する。ユーザー要件（原文）、codebase-analyzerのJSON、確認済みスコープを渡す。documentation-criteriaに従い、これはDesign Docであり、設計にアーキテクチャ決定が伴う場合は前提となるADRを先に作成する。少なくとも2つの設計選択肢をトレードオフとともに提示する。
2. **code-verifier** → Design Docを既存コードに対して検証する。
3. **document-reviewer** → technical-designerが作成した各ドキュメントの品質チェック。Design Docの場合: `doc_type: DesignDoc`、`codebase_analysis`（codebase-analyzerのJSON）とcode-verifier結果を渡す。ADR（作成された場合）の場合: `doc_type: ADR`、`codebase_analysis`を渡す。code-verifier結果はDesign Docにのみ適用する。ADRレビューで修正が必要になった場合、technical-designer(update)がADRを修正し、**かつ**修正後のADRに合わせてDesign Docを再整合させる — Design Docは未レビューまたは古いADRの上に立ってはならない。この再整合でDesign Docが変わった場合は、更新後のDesign Docに対してcode-verifierとDesign Docのdocument-reviewerを再実行し、検証が最終内容を反映するようにする。
4. **design-sync** → Design Doc間整合性検証。
   - 矛盾あり → ユーザーに報告 → 修正指示待ち → technical-designer(update)で修正
   - 矛盾なし → 次へ進む
5. ユーザー承認 — Design Doc を design-sync の結果とともに提示し、承認を待つ。

## 完了条件

- [ ] Step 1のスコープブートストラップのシードを構築した（または検索結果が0件のときユーザーから対象ファイルを取得した）
- [ ] 値の入った`requirement_analysis`でcodebase-analyzerを実行した
- [ ] ユーザーと設計スコープを確認し、確認済みの対象ファイルから規模を設定した
- [ ] technical-designerでDesign Docを作成した。設計にアーキテクチャ決定が伴う場合は前提となるADRを先に作成した
- [ ] Design Docに対してcode-verifierを実行し、結果をdocument-reviewerに渡した
- [ ] 作成した各ドキュメント（Design Doc、および作成された場合のADR）に対してdocument-reviewerを実行し、フィードバックに対応した
- [ ] design-syncで整合性検証を実行した
- [ ] 設計書のユーザー承認を取得した

## 出力例
設計フェーズが完了しました。
- 設計書: docs/design/[ドキュメント名].md
- 整合性: 他Design Docと矛盾なし（または修正完了）

**責務境界**: 本コマンドは設計承認＋整合性確認で終了。作業計画以降はスコープ外。
