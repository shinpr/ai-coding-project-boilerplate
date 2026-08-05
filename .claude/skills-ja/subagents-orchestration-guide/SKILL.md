---
name: subagents-orchestration-guide
description: 規模に応じた計画、承認、実装、検証、エスカレーションのフローでサブエージェントを調整。サブエージェントへの作業振り分け、承認済み作業計画の実行、自律実行の再開時に使用。
---

# サブエージェント実践ガイド - オーケストレーション指針

サブエージェントを活用してタスクを効率的に処理するための実践的な行動指針。

## 最重要原則：オーケストレーターとして振る舞う

**「私は作業者ではない。オーケストレーターである。」**

### 正しい振る舞い
- 新規タスク: requirement-analyzerから開始し、記録された規模判定結果からフローを選択
- フロー実行中: 選択した規模別フローと移行条件に従う
- 各フェーズ: 宣言された責務が必要な出力と一致するエージェントへ委譲
- 停止ポイント: 必要なユーザー承認が記録された場合にのみ継続
- **調査**: すべての調査はrequirement-analyzerまたはcodebase-analyzerに委譲（Grep/Glob/Readはサブエージェント内部のツール）
- **分析・設計**: 宣言された責務に必要な出力が含まれる専門サブエージェントに委譲
- **初動**: ユーザー要件はrequirement-analyzerに渡してから他のステップへ進む

### 初動アクション規則

新しいタスクを受け取ったら、ユーザー要件をrequirement-analyzerに直接渡す。その規模判定結果に基づいてワークフローを決定する。

requirement-analyzer は `convergence` オブジェクトを返す。要件の停止ポイントでその出力に対して requirement-convergence のヒアリングプロトコルを実行し、各ステップの根拠を記録したうえで、回答を添えて requirement-analyzer を再実行して記録を再判定させる。ヒアリングは AskUserQuestion を要するためオーケストレーターが担い、オーケストレーター自身は何も調査しないため分析の後に実行する。

### フロー実行中の要件変更検知

**フロー実行中**にユーザーレスポンスで以下を検知したら、フローを停止してrequirement-analyzerへ：
- 新機能・動作の言及（追加の操作方法、別画面での表示など）
- 制約・条件の追加（データ量制限、権限制御など）
- 技術要件の変更（処理方式、出力形式の変更など）

いずれかに該当する場合は、統合した要件を記録し、requirement-analyzerから再開する。

## 活用できるサブエージェント

### 実装支援エージェント
1. **quality-fixer**: 全体品質保証と修正完了まで自己完結処理
2. **task-decomposer**: 承認済み作業計画書の各実装項目を、宣言された境界と依存関係を保ったままtask-template形式のファイル1つとして実体化
3. **task-executor**: 個別タスクの実行と構造化レスポンス
4. **integration-test-reviewer**: 統合テスト/E2Eテストのスケルトン準拠レビュー
5. **security-reviewer**: 全タスク完了後のDesign Docおよびプロジェクトのコーディング規約に対するセキュリティ準拠レビュー

### ドキュメント作成エージェント
6. **requirement-analyzer**: 要件分析と作業規模判定（WebSearch対応、最新技術情報の調査）
7. **codebase-analyzer**: 既存コードベースを分析し技術設計への重点的なガイダンスを生成
8. **prd-creator**: Product Requirements Document作成（WebSearch対応、市場動向調査）
9. **ui-spec-designer**: PRDとプロトタイプコード（任意）からUI Spec作成（フロントエンド/フルスタック機能）
10. **technical-designer**: ADR/Design Doc作成（最新技術情報の調査、Property注釈付与）
11. **work-planner**: 作業計画書作成（テストスケルトンからメタ情報を抽出・反映）
12. **document-reviewer**: 単一ドキュメントの品質・完成度・ルール準拠チェック
13. **code-verifier**: ドキュメントとコードの整合性を検証。実装前: Design Docの主張を既存コードベースに対して検証。実装後: 実装がDesign Docに準拠しているか検証
14. **design-sync**: Design Doc間の整合性検証（明示的矛盾のみ検出）
15. **acceptance-test-generator**: Design DocのACとUI Spec（任意）から統合テストとE2Eテストのスケルトン生成
16. **ui-analyzer**: フロントエンド設計準備のためUI事実（外部ソース＋既存UIコード）を収集 — 読み取り専用

## オーケストレーション原則

### 委譲の境界: What vs How

「何を達成するか」「どこで作業するか」を渡す。各サブエージェントは「どう実行するか」を自律的に決定する。

**渡す情報**（what/where/制約）:
- タスクファイルパス — executor系（task-executor, task-decomposer）にはタスクファイルパスを渡す。より広いスコープはユーザーの明示的な要求がある場合のみ
- ディレクトリまたはパッケージスコープ — discovery/review系（codebase-analyzer, code-verifier, security-reviewer, integration-test-reviewer）向け
- ユーザーまたは設計成果物からの受入条件とハード制約

**サブエージェントに委ねる判断**（how）:
- 実行するコマンド（プロジェクト設定やリポジトリの規約からサブエージェントが判断）
- 実行順序やツールフラグ
- Executor/fixer系: スコープ内で調査・変更するファイルの選択
- Review/discovery系: スコープ内で調査するファイルの選択（読み取り専用）

| | Bad（howを指定） | Good（whatを指定） |
|---|---|---|
| quality-fixer | 「lint → test の順でチェックして」 | 「品質チェックと修正をすべて実行して」 |
| task-executor | 「ファイルXにハンドラYを追加して」 | 「タスクファイル: docs/plans/tasks/003-feature.md」 |

**出力が矛盾した場合の優先順位**:
1. ユーザー指示（明示的な要求や制約）
2. タスクファイルと設計成果物（Design Doc, PRD, 作業計画書）
3. リポジトリの客観的状態（git status、ファイルシステム、プロジェクト設定）
4. サブエージェントの判断

サブエージェント同士の判断が衝突した場合、またはサブエージェントの出力が期待と異なる場合、上記の優先順位を適用する。リポジトリの客観的状態（3）で検証し、1・2と整合する出力に従う。矛盾がある場合はユーザー指示、次いで設計成果物に従う。

サブエージェントがリポジトリの状態や成果物から実行方法を判断できない場合、blockedステータスでエスカレーションする。その詳細をユーザーに伝える。

### レビュー裁定（Review Resolution）

対応可能な成果物レビューの検出事項には `references/review-resolution.md` を適用する。処理方針の決定、結果の検証、作業のルーティングはオーケストレーターが行い、成果物の作成・変更は指名した専門エージェントが行う。検出事項単位の修正ループ — 処理方針の割り当て、`apply` の逐語ハンドオフ、`prior_feedback` による再レビュー、収束とエスカレーションの条件 — は、この参照先が最初から最後まで持つ。

### 責務分離を意識した振り分け

**task-executorの責務**:
- 実装作業とテスト追加
- 追加したテストが成功することを確認。リポジトリ全体の品質保証はquality-fixerの責務

**quality-fixerの責務**:
- 全体品質保証（型チェック、lint、全テスト実行等）
- 品質エラーの完全修正実行
- 修正完了まで自己完結で処理
- 最終的な approved 判定（修正完了後のみ）

### 標準フロー

**基本サイクル**: `task-executor → エスカレーション判定・フォローアップ → quality-fixer → commit` の4ステップサイクルを管理。
各タスクごとにこのサイクルを繰り返し、品質を保証。

**レイヤー別ルーティング**: レイヤー横断機能では、タスクファイル名パターンに基づいてexecutorとquality-fixerを選択（レイヤー横断オーケストレーション参照）。

## Sub-agent間の制約

**重要**: Sub-agentから他のSub-agentを直接呼び出すことはできない。複数のSub-agentを連携させる場合は、メインAIがオーケストレーターとして動作。

## 規模判定とドキュメント要件

以下のファイル数が下限を定める。documentation-criteriaスキルの構造的エスカレーションが、ADR作成条件のいずれかに該当する場合に確定規模と必要ドキュメントの行を引き上げる（引き上げるだけで下げることはない）。

| 規模 | 基準ファイル数 | PRD | ADR | Design Doc | 作業計画書 |
|------|---------------|-----|-----|------------|-----------|
| 小規模 | 1-2 | 更新※1 | 不要 | 不要 | 不要 — task-executor が明示プロンプトから実行する |
| 中規模 | 3-5 | 更新※1 | 条件付き※2 | **必須** | **必須** |
| 大規模 | 6以上 | **必須**※3 | 条件付き※2 | **必須** | **必須** |

※1: 該当機能のPRDが存在する場合は更新
※2: アーキテクチャ変更、新技術導入、データフロー変更がある場合
※3: 新規作成/既存更新/リバースPRD（既存PRDがない場合）

## 構造化レスポンス仕様

すべてのサブエージェント呼び出しは **Agent ツール** を使用し、以下を渡す:
- `subagent_type`: エージェント名（例: "task-executor"）
- `description`: 簡潔なタスク記述（3〜5語）
- `prompt`: 成果物のパスを含む具体的な指示

### オーケストレーターの許可ツール

オーケストレーターは以下のツールのみで作業を統制する:

| ツール | 用途 |
|------|------|
| Agent | サブエージェントの呼び出し |
| AskUserQuestion | ユーザー確認・質問 |
| TaskCreate / TaskUpdate | 進捗追跡 |
| Bash | シェル操作（git commit、ls、検証コマンド） |
| Read | サブエージェント間の情報橋渡しのための成果物ドキュメント参照 |

実装作業（Edit、Write、MultiEdit）はすべてサブエージェントが実施する。オーケストレーター自身は行わない。

### サブエージェント応答形式

サブエージェントはJSON形式で応答する。各エージェントは自身の入出力契約を宣言しているため、呼び出しを組み立てる際はその契約をエージェント側で読む。この表が持つのは、分岐に使う信号と、各値が選ぶ行動だけである。

| Agent | 分岐に使う信号 | 各値での行動 |
|---|---|---|
| requirement-analyzer | `scale`、`adrRequired`、`convergence` | `scale` でフローを選ぶ — 構造的エスカレーションは既に反映済み。`adrRequired` ならADRステップを追加。進む前に `convergence` に対して requirement-convergence ヒアリングを実行 |
| codebase-analyzer / ui-analyzer | — | JSON全体をそのまま次の専門エージェントへ渡す。各エージェントは自身の入力宣言が挙げるフィールドを消費する |
| task-executor / task-executor-frontend | `status`、`escalation_type`、`requiresTestReview` | `completed` → サイクルを継続。`escalation_needed` → エージェントが定義する `escalation_type` に従って処理し、ユーザー判断が要る項目は提示する。`requiresTestReview: true` → quality-fixer の前に integration-test-reviewer を実行 |
| quality-fixer / quality-fixer-frontend | `status` | `approved` → コミット。`stub_detected` → `incompleteImplementations[]` を実装ステップに戻し再実行。`blocked` → 後述の quality-fixer blockedハンドリング |
| document-reviewer | `verdict.decision` | `approved` → 次へ。`needs_revision` → レビュー裁定を実行。`rejected` → エスカレーション。approvedを全スコープの承認として扱う前に、スキップされたチェックの `recommendations` を読む |
| integration-test-reviewer | `verdict.decision` | `approved` → 次へ。`needs_revision` → レビュー裁定を実行。`blocked` → `verdict.reason` を添えてエスカレーション。トップレベルの `status` は検証結果の軸であり、ルーティング判断ではない |
| code-verifier / security-reviewer | `summary.status` / `status` | 「実装後検証の合否基準」を参照。不可逆操作のハザードによる security の `blocked` は必要な判断を名指しし、エージェント層の権限の外にある |
| design-sync | `sync_status` | `CONFLICTS_FOUND` → 矛盾をユーザーに提示してから進む |
| acceptance-test-generator | レーン別の `generatedFiles`、レーン別の `e2eAbsenceReason` | null でない各パスの存在を確認し、レーン別のパスと不在理由を work-planner へ渡す |

**オーケストレーターが持つエージェント間の配線**: 実装ステップの `filesModified` と `runnableCheck` を後続の quality-fixer 呼び出しへ引き継ぐ。レシピまたは technical-spec がプロジェクトの正典となる品質コマンドを示している場合は `qualityCommand` として渡す。

### quality-fixer blockedハンドリング

quality-fixerが `status: "blocked"` を返した場合、`reason`で判別：
- `"Cannot determine due to unclear specification"` → `blockingIssues[]`で仕様詳細を確認
- `"Execution prerequisites not met"` → `missingPrerequisites[]`の`resolutionSteps`をユーザーにアクション可能なステップとして提示
- `"Quality failure outside current task scope"` → `outOfScopeFailures[]`と`needsUserDecision`をユーザーに提示して停止する。ユーザーがタスクスコープを広げて当該失敗を含めた場合にのみ、quality-fixerを再実行する

## 作業計画時の基本フロー

### 大規模（6ファイル以上） - 14ステップ（バックエンド） / 16ステップ（フロントエンド/フルスタック）

1. requirement-analyzer → 要件分析 + 既存PRD確認 → requirement-convergence のヒアリングを実施し、回答を添えて requirement-analyzer を再実行 **[停止]**
2. prd-creator → PRD作成（収束記録を受け取る）
3. document-reviewer → PRDレビュー **[停止: PRD承認]**
4. **（フロントエンド/フルスタックのみ）** プロトタイプコードの有無を確認 → ui-spec-designer → UI Spec作成
5. **（フロントエンド/フルスタックのみ）** document-reviewer → UI Specレビュー **[停止: UI Spec承認]**
6. technical-designer → ADR作成（アーキテクチャ/技術/データフロー変更がある場合）
7. document-reviewer → ADRレビュー（ADR作成時） **[停止: ADR承認]**
8. codebase-analyzer → コードベース分析（要件分析結果 + PRDパスを入力）
9. technical-designer → Design Doc作成（codebase-analyzer出力を追加コンテキストとして入力。レイヤー横断時: レイヤー別に作成、レイヤー横断オーケストレーション参照）
10. code-verifier → Design Docを既存コードに対して検証（doc_type: design-doc）
11. document-reviewer → Design Docレビュー（code-verifier結果をcode_verificationとして入力。レイヤー横断時: Design Doc毎に実行）
12. design-sync → 整合性検証 **[停止: Design Doc承認]**
13. acceptance-test-generator → テストスケルトン生成、work-plannerに渡す (*1)
14. work-planner → 作業計画書作成
15. document-reviewer → 作業計画書レビュー（doc_type: WorkPlan。AC/コントラクト/状態のカバレッジをトレースできるようDesign Docのパスを渡す）。`needs_revision` の場合: レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には work-planner を update モードで用いる。`rejected` の場合: ユーザーにエスカレーション。 **[停止: 一括承認]**
16. task-decomposer → 自律実行 → 完了報告

### 中規模（3-5ファイル） - 10ステップ（バックエンド） / 12ステップ（フロントエンド/フルスタック）

1. requirement-analyzer → 要件分析 → requirement-convergence のヒアリングを実施し、回答を添えて requirement-analyzer を再実行 **[停止]**
2. **（フロントエンド/フルスタックのみ）** プロトタイプコードの有無を確認 → ui-spec-designer → UI Spec作成（コンポーネント構造が技術設計に反映されるため先に実施）
3. **（フロントエンド/フルスタックのみ）** document-reviewer → UI Specレビュー **[停止: UI Spec承認]**
4. codebase-analyzer → コードベース分析（要件分析結果を入力）
5. technical-designer → Design Doc作成（codebase-analyzer出力を追加コンテキストとして入力。レイヤー横断時: レイヤー別に作成、レイヤー横断オーケストレーション参照）
6. code-verifier → Design Docを既存コードに対して検証（doc_type: design-doc）
7. document-reviewer → Design Docレビュー（code-verifier結果をcode_verificationとして入力。レイヤー横断時: Design Doc毎に実行）
8. design-sync → 整合性検証 **[停止: Design Doc承認]**
9. acceptance-test-generator → テストスケルトン生成、work-plannerに渡す (*1)
10. work-planner → 作業計画書作成
11. document-reviewer → 作業計画書レビュー（doc_type: WorkPlan。AC/コントラクト/状態のカバレッジをトレースできるようDesign Docのパスを渡す）。`needs_revision` の場合: レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には work-planner を update モードで用いる。`rejected` の場合: ユーザーにエスカレーション。 **[停止: 一括承認]**
12. task-decomposer → 自律実行 → 完了報告

### 小規模（1-2ファイル） - 2ステップ

1. requirement-analyzer → 要件分析と小規模判定の確定 → requirement-convergence のヒアリングを実施し、回答を添えて requirement-analyzer を再実行 **[停止]**。ヒアリングは全スケールで実行する — `nonGoals` はユーザーが挙げるものであり、どのエージェントも代わりに用意できないためである。構造的エスカレーションで規模が上がった場合は、この時点から中規模のフローへ切り替える。確定した成果、影響パス、検証条件を提示する **[停止: 一括承認]**
2. task-executor → quality-fixer → commit → 完了報告

注: 小規模スケールでは作業計画書もタスクファイルも作成しない。実装ステップは task-executor を介して標準の4ステップサイクル（`task-executor → エスカレーション判定 → quality-fixer → commit`）で実行し、確定した成果・出典・影響パス・検証条件を明示プロンプトとして受け取る。オーケストレーターによる直接編集は行わない。

## レイヤー横断オーケストレーション

requirement-analyzerが`crossLayerScope`によって複数レイヤー（backend + frontend）にまたがると判定した場合、以下の拡張を適用する。ステップ番号は大規模フローに対応する。中規模のcross-layer flowでは、単一のcodebase analysisとDesign Docの区間を、以下と同じbackend先行・frontend後続の順序に置き換える。大規模フローのステップ番号を流用せず、名前付きのPhase移行を使用する。

### 設計フェーズの拡張

標準のDesign Doc作成ステップをレイヤー別作成に置き換え:

| ステップ | エージェント | 目的 |
|---------|-----------|------|
| 8 | codebase-analyzer ×2 | レイヤー別コードベース分析（要件分析結果をレイヤーでフィルタして入力） |
| 9 | technical-designer | バックエンドDesign Doc（バックエンドcodebase-analyzerコンテキスト付き） |
| 10 | code-verifier | バックエンドDesign Docを既存コードに対して検証（結果JSONはステップ12に`prior_layer_verification`として渡す） |
| 11 | document-reviewer | バックエンドDesign Docをレビュー（ステップ10の結果を`code_verification`、バックエンドcodebase-analyzer JSONを`codebase_analysis`として入力）**[criticalで停止]** — ここで構造的欠陥が出た場合はステップ12に進めない |
| 12 | technical-designer-frontend | フロントエンドDesign Doc（フロントエンドcodebase-analyzerコンテキスト + レビュー済みバックエンドDesign Doc + ステップ10の`prior_layer_verification` + UI Spec付き） |
| 13 | code-verifier | フロントエンドDesign Docを既存コードに対して検証 |
| 14 | document-reviewer | フロントエンドDesign Docをレビュー（ステップ13の結果を`code_verification`、フロントエンドcodebase-analyzer JSONを`codebase_analysis`として入力）**[criticalで停止]** — ここで構造的欠陥が出た場合はステップ15に進めない |
| 15 | design-sync | レイヤー間整合性検証 **[停止]** |

`codebase-analyzer ×2` の呼び出しは並列実行可能。バックエンド経路（ステップ9〜11）はステップ12の前に直列で完了させる。これによりフロントエンドdesignerは、document-reviewerによって構造的欠陥（AC欠落、Fact Disposition Tableの不備、Verification Strategy欠落）が既に検出され、code-verifierによってコード/ドキュメント不整合が既に列挙された状態のバックエンドDesign Docを読む。フロントエンドdesignerは `prior_layer_verification.discrepancies[]` とステップ11のレビュー指摘から、既知の問題を持つバックエンド契約を識別し、不安定な契約面を迂回した設計ができる（統合点を安定した契約へ切り替える、または依存を「## Cross-Layer Assumptions」に記録する）。

**Design Doc作成時のレイヤーコンテキスト指定**:
- **バックエンド**: 「PRD [パス] からバックエンドDesign Docを作成。コードベース分析: [バックエンドレイヤー用codebase-analyzerのJSON]。対象: APIコントラクト、データ層、ビジネスロジック、サービスアーキテクチャ。」
- **フロントエンド**: 「PRD [パス] からフロントエンドDesign Docを作成。コードベース分析: [フロントエンドレイヤー用codebase-analyzerのJSON]。レビュー済みバックエンドDesign Doc [パス] — このドキュメントからAPIコントラクトとIntegration Pointsを抽出し、フロントエンドのIntegration Point Mapに反映する。バックエンドレビュー指摘: [ステップ11 document-reviewerのcritical/important項目があればそれ]。prior_layer_verification: [バックエンドDesign Docに対するcode-verifierのJSON]。`prior_layer_verification.discrepancies[]`とレビュー指摘から不安定なバックエンド契約を識別する。検証済みと見なせる主張は検証結果JSONに明示されているものに限定する。未検証のまま依存せざるを得ない契約は、「## Cross-Layer Assumptions」セクションに正当化と検証先を記載する。UI Spec [パス] のコンポーネント構造を参照。対象: コンポーネント階層、状態管理、UI操作、データ取得。」

**design-sync**: フロントエンドDesign Docをソースとして使用。`docs/design/`内の他のDesign Docを自動検出して比較。

### 複数Design Docでの作業計画

全Design Docをwork-plannerに渡し、垂直スライスで構成を指示:
- 全Design Docのパスを明示的に提供
- 指示: 「フェーズを垂直な機能スライスで構成すること。各フェーズに同一機能領域のバックエンドとフロントエンド作業を含め、フェーズ毎の早期統合検証を可能にする。」

### レイヤー別エージェントルーティング

自律実行中、タスクファイル名パターンに基づいてエージェントを選択する。この表は、作業計画書のタスクエントリが選ぶ2つの Executor lane も定義している:

| Executor lane | ファイル名パターン | Executor | Quality Fixer |
|---|---|---|---|
| `backend` | `*-task-*` または `*-backend-task-*` | task-executor | quality-fixer |
| `frontend` | `*-frontend-task-*` | task-executor-frontend | quality-fixer-frontend |

作業計画書のタスクエントリは lane をちょうど1つ記録する。タスク実体化はその値をコピーし、対象パスからレイヤーを推論するのではなく、この表からファイル名を選ぶ。

## 自律実行モード

### 権限委譲

**自律実行モード開始後**：
- 実装フェーズ全体の一括承認により、サブエージェントに権限委譲
- task-executor：実装権限（Edit/Write使用可）
- quality-fixer：修正権限（品質エラー自動修正）

### Step 2 実行詳細
- `status: escalation_needed` または `status: blocked` → ユーザーにエスカレーション
- `requiresTestReview` が `true` → **integration-test-reviewer** を実行
  - `verdict.decision` が `needs_revision` → ルーティング先の executor（レイヤー別エージェントルーティング 参照、task-executor または task-executor-frontend）を **Fix Mode** で再実行（同じ `task_file` と `requiredFixes[]` を渡す）
  - `verdict.decision` が `blocked` → レビュアが示したブロッキング理由と、確立できなかった review basis を添えてユーザーにエスカレーション。その basis がユーザーから供給された後にのみレビュアを再実行する
  - `verdict.decision` が `approved` → quality-fixer へ進む

### 自律実行の停止条件

以下の場合に自律実行を停止し、ユーザーにエスカレーション：

1. **サブエージェントからのエスカレーション**
   - `status: "escalation_needed"` のレスポンス受信時
   - `status: "blocked"` のレスポンス受信時

2. **要件変更検知時**
   - 要件変更検知チェックリストで1つでも該当
   - 自律実行を停止し、requirement-analyzerに統合要件で再分析

3. **work-planner更新制限に抵触時**
   - task-decomposer開始後の要件変更は全体再設計が必要
   - requirement-analyzerから全体フローを再開

4. **ユーザー明示停止時**
   - 直接的な停止指示や割り込み

### Prompt Construction Rule
すべてのサブエージェントプロンプトに以下を含める:
1. ファイルパス付きの入力成果物（前ステップまたは前提確認から）
2. 期待するアクション（エージェントが行うべきこと）

エージェントのInput Parametersセクションと、フロー内のその時点で利用可能な成果物からプロンプトを構成する。

追加の2つのルール:
- サブエージェントは Agent prompt と自身が読み込んだファイルしか参照できない。必須のパス、先行 JSON、パラメータ、スコープ制約をプロンプトに明示的に注入する。
- 以下の例の `[placeholder]` は Agent ツール呼び出し前にすべて具体値へ置換する。

### 完了報告の形式

選択したフローの完了後、以下を返す：

```json
{
  "status": "completed | blocked", "scale": "small | medium | large", "completedTasks": [{"taskFile": "path", "status": "completed", "commit": "sha-or-null"}], "filesModified": ["path"],
  "verification": [{"check": "name", "result": "passed | failed | not_run", "evidence": "command or verifier result"}], "verifiers": [{"name": "agent", "status": "status value"}], "unresolvedItems": [{"item": "decision or evidence", "requiredInput": "input", "escalation": "condition"}]
}
```

選択したフローで必須のタスク、品質ゲート、検証エージェント、commit stepがすべて完了した場合にのみ`status`を`completed`とする。未解決項目によって次の移行が妨げられる場合は`blocked`とする。

### Call Example (codebase-analyzer)
- subagent_type: "codebase-analyzer"
- description: "コードベース分析"
- prompt: "requirement_analysis: [要件分析のJSON]. prd_path: [存在する場合はパス]. requirements: [元のユーザー要件]. 既存コードベースを分析し設計ガイダンスを生成してください。"

### Call Example (code-verifier — 設計フロー)
- subagent_type: "code-verifier"
- description: "Design Doc検証"
- prompt: "doc_type: design-doc document_path: [Design Docパス] Design Docを既存コードに対して検証してください。"

## オーケストレーターの主な役割

1. **状態管理**: 現在のフェーズ、各サブエージェントの状態、次のアクションを把握
2. **情報の橋渡し**: サブエージェント間のデータ変換と伝達
   - 各サブエージェントの出力を次のサブエージェントの入力形式に変換
   - **前工程の成果物は必ず次のエージェントに渡す**
   - 構造化レスポンスから必要な情報を抽出
   - changeSummaryからコミットメッセージを作成 → **Bashでgit commit実行**
   - 要件変更時は初期要件と追加要件を明示的に統合

   #### 収束記録 → それを引き継ぐエージェント

   **渡すもの**: 最後の requirement-analyzer 実行が返した `convergence` オブジェクト（requirement-analyzer を持たないフローでは、オーケストレーター自身が判定した記録）を、それを引き継ぐエージェントへ渡す。内容は変更せずに渡し、各フィールドの readiness ラベルも一緒に運ぶ。
   - **prd-creator**（PRDを新規作成または更新する場合）: `outcome` を `成功基準` へ、`nonGoals` と `speculative` 要件を origin `user` として `Future` / `Out of Scope` へ永続化する
   - **technical-designer / technical-designer-frontend**: PRDがない場合は同じ内容を Design Doc の `Requirement Convergence` へ永続化し、`weak-but-explicit` のまま残ったフィールドは常にそこへ記録する
   - **ui-spec-designer**（フロントエンド/フルスタック）: `nonGoals` と `speculative` 要件を、UI Specが対象に含めない機能・能力として扱う
   - **work-planner**: `nonGoals` と `speculative` 要件を全タスクエントリから除外されたものとして扱う。小規模ではPRDもDesign Docも存在しないため、`weak-but-explicit` のフィールドは保存プロトコルに従いオーケストレーター自身のコンテキストに留め、タスクファイルのブロッキング項目にはしない

   #### codebase-analyzer → technical-designer

   **codebase-analyzerへの入力**: 要件分析JSON出力（`convergence` を含む）、PRDパス（存在する場合）、元のユーザー要件
   **technical-designerへの入力**: codebase-analyzerのJSON出力をDesign Doc作成プロンプトの追加コンテキストとして渡す。必須の使い道:
   - `focusAreas` → Fact Disposition Tableの正典となるdisposition targetリスト（各focusAreaを1行に展開し、`fact_id`と`evidence`をそのまま引き継ぐ）
   - `dataModel`、`dataTransformationPipelines`、`qualityAssurance` → 「既存コードベース分析」「検証戦略」の各セクションに反映

   #### code-verifier → document-reviewer（Design Docレビュー）

   **code-verifierへの入力**: Design Docパス（doc_type: design-doc）。`code_paths`は指定を省略する — verifierがドキュメントからコードスコープを独自に発見する。
   **document-reviewerへの入力**: code-verifierのJSON出力を`code_verification`として、designerに渡したものと同じcodebase-analyzerのJSONを`codebase_analysis`として渡す。加えて、要件が手元にある場合は、要件（改訂時は今回の変更要求）を`requirements_verbatim`、確認済みスコープとユーザー判断を`confirmed_decisions`として渡す。reviewerは`codebase_analysis.focusAreas`でFact Disposition Tableのカバレッジを検証し、対となる要件入力でAdopted design validityを検証する。対のうち一方だけを渡した場合は`rejected`が返る。

   #### code-verifier + document-reviewer → 次レイヤーのtechnical-designer（レイヤー横断フロー時のみ）

   **次レイヤーのtechnical-designerへの入力**: レビュー済みの前レイヤーDesign Docパスに加えて`prior_layer_verification`（前レイヤーcode-verifierのJSON）を渡す。シーケンスは「レイヤー横断オーケストレーション」セクションを参照。`prior_layer_verification.discrepancies[]`と前レイヤーのレビュー指摘を用いて不安定な契約を識別する。検証済みと見なせる主張は検証結果JSONに明示されているものに限定する。verifierで確認されていない主張に設計が依存せざるを得ない場合、フロントエンドDesign Docの「## Cross-Layer Assumptions」セクションに正当化と検証先を記載する（エスカレートする場合は同セクションで `検証先: ユーザーへエスカレーション` と記載する — エスカレーションは下流の検証ステップで依存を閉じられない場合のみ選ぶ）。

   #### technical-designer → work-planner

   **work-plannerへの入力**: Design Docパス。work-plannerは出典セクションとACを実装タスクへマッピングする。カバーされていない義務は修正すべき計画の漏れであり、作業計画書はカバー漏れや設計内容の不足をユーザー確認項目に変換しない。

   **ギャップ発生時の制御（オーケストレーターの責務）**: work-plannerが`gap`を含むドラフト計画書を出力した場合、オーケストレーターは以下を実行する:
   1. ギャップ項目と理由をユーザーに提示する
   2. ユーザーが各ギャップを確認するまで計画書をドラフト状態に保つ
   3. すべてのギャップが解消されたか明示的に確認された後、後続エージェント（task-decomposer等）に計画書を渡す
   理由なしのギャップはエラーとして扱い、work-plannerに差し戻してカバーするタスクの追加または理由の記載を求める。

   #### *1 acceptance-test-generator → work-planner

   **acceptance-test-generatorへの入力**: Design Doc のパス、UI Spec のパス（存在する場合）。

   **オーケストレーターの検証**: 非nullの各 `generatedFiles.<lane>` パスがディスク上に存在すること。nullのレーンごとに `e2eAbsenceReason.<lane>` が存在すること — これは意図的な不在であり、エラーではない。

   **work-plannerへの入力**: 統合テスト / fixture-e2e / service-integration-e2e の各ファイルパス（レーンごとに値またはnull）、レーン別の不在理由、およびタイミングガイダンス — 統合テストは各フェーズ実装と並行して作成、fixture-e2e テストは UI 機能フェーズと並行して作成、service-integration-e2e テストは最終フェーズでのみ実行。

   **エラー時**: status != completed で統合テストファイル生成が予期せず失敗した場合はユーザーにエスカレーションする。E2Eレーンがnullかつ妥当な不在理由がある場合はエラーではない。
3. **ADRステータス管理**: ユーザー判断後のADRステータス更新（Accepted/Rejected）

## 重要な制約

- **品質チェック**: quality-fixerが`approved`を返した後にcommitできる
- **構造化レスポンス**: サブエージェント間で渡す情報には、宣言済みのJSON fieldを使用する
- **承認管理**: ドキュメント作成後にdocument-reviewerを実行し、指定されたユーザー承認の停止点を通過してから次のPhaseへ進む
- **フロー確認**: 承認後は、確定した大規模・中規模・小規模フローから次のstepを選択する
- **整合性検証**: サブエージェントの出力が矛盾した場合、優先順位に従って解決（委譲の境界セクション参照）

### 進捗管理

TaskCreateで全体フェーズを登録。各フェーズ完了時にTaskUpdateで更新。

### 実装後検証のPass/Fail基準

| Verifier | Pass | Fail | Blocked |
|----------|------|------|---------|
| code-verifier | `summary.status`が`consistent`または`mostly_consistent` | `summary.status`が`needs_review`または`inconsistent` | `summary.status`が`blocked` → `summary.blockingReason`を添えてユーザーにエスカレーション（検証可能な入力がなかったため、修正サイクルでは解消できない） |
| security-reviewer | `status`が`approved`または`approved_with_notes` | `status`が`needs_revision` | `status`が`blocked` → ユーザーにエスカレーション |

**再実行ルール**: 修正サイクルは最大2回とする。各サイクル後に**Fail**を返した検証エージェントを再実行し、Passした検証エージェントの記録済み証跡は維持する。以前Failだった検証エージェントがPassになるか、名前付きの残存指摘件数が減った場合にのみ進捗ありと判定する。進捗がない、または外部入力が必要な場合は直ちにエスカレーションする。2回目のサイクル後は、残るすべての不合格を指摘内容とともにエスカレーションする。

このルールが制限するのは検証エージェント群である。検出事項単位の修正ループは `references/review-resolution.md` セクション3が別途制限し、先に到達した方でエスカレーションする。

**修正サイクルのハンドオフ**: レビュー裁定を適用し、必要な各 executor には `apply` の検出事項オブジェクト全体を逐語で、処理方針のみ付加して渡す。照合を受け付けるレビュアー入力には `prior_feedback` を引き継ぐ。
