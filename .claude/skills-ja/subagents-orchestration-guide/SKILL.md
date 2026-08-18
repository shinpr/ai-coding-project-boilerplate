---
name: subagents-orchestration-guide
description: 規模に応じた計画、承認、実装、検証、エスカレーションのフローでサブエージェントを調整。サブエージェントへの作業振り分け、承認済み作業計画の実行、自律実行の再開時に使用。
---

# サブエージェント実践ガイド - オーケストレーション指針

## 最重要原則：オーケストレーターとして振る舞う

**ユーザーの明示的な指示**: ユーザーは、呼び出されたレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

### 正しい振る舞い
- 新規タスク: requirement-analyzerから開始し、そのエビデンスから要件を収束させ構造スケール（Structural Scale）を選択する
- フロー実行中: 選択した規模別フローと移行条件に従う
- 各フェーズ: 宣言された責務が必要な出力と一致するエージェントへ委譲
- 停止ポイント: 必要なユーザー承認が記録された場合にのみ継続
- **調査**: すべての調査はrequirement-analyzerまたはcodebase-analyzerに委譲（Grep/Glob/Readはサブエージェント内部のツール）
- **分析・設計**: 宣言された責務に必要な出力が含まれる専門サブエージェントに委譲
- **初動**: ユーザー要件はrequirement-analyzerに渡してから他のステップへ進む

### 初動アクション規則

新しいタスクを受け取ったら、ユーザー要件をrequirement-analyzerに直接渡す。その依頼・スコープ・コスト・質問のエビデンスを用いて要件収束を実行し、構造スケールを割り当てる。どちらの判定もオーケストレーターが持つ。requirement-analyzer を再実行するのは、ヒアリングの回答が分析対象または必要なスコープエビデンスを変える場合のみとする。

### フロー実行中の要件変更検知

**フロー実行中**にユーザーレスポンスで以下を検知したら、フローを停止してrequirement-analyzerへ：
- 新機能・動作の言及（追加の操作方法、別画面での表示など）
- 制約・条件の追加（データ量制限、権限制御など）
- 技術要件の変更（処理方式、出力形式の変更など）

いずれかに該当する場合は、統合した要件を記録する。requirement-analyzerから再開するのは新たなリポジトリのエビデンスが必要な場合のみとし、それ以外は既存のエビデンスから再収束・再ルーティングする。

## 活用できるサブエージェント

### 実装支援エージェント
1. **quality-fixer**: 全体品質保証と修正完了まで自己完結処理
2. **task-decomposer**: 承認済み作業計画書の各実装項目を、宣言された境界と依存関係を保ったままtask-template形式のファイル1つとして実体化
3. **task-executor**: 個別タスクの実行と構造化レスポンス
4. **integration-test-reviewer**: 統合テスト/E2Eテストのスケルトン準拠レビュー
5. **security-reviewer**: 全タスク完了後のDesign Docおよびプロジェクトのコーディング規約に対するセキュリティ準拠レビュー

### ドキュメント作成エージェント
6. **requirement-analyzer**: 依頼・スコープ・コスト・質問のエビデンスを簡潔に収集
7. **codebase-analyzer**: 既存コードベースを分析し技術設計への重点的なガイダンスを生成
8. **prd-creator**: Product Requirements Document作成（WebSearch対応、市場動向調査）
9. **ui-spec-designer**: PRDとプロトタイプコード（任意）からUI Spec作成（フロントエンド/フルスタック機能）
10. **technical-designer**: 確認済み要件とリポジトリのエビデンスからADRバッチまたはDesign Docを作成
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
- タスクファイルパス — executor系は、タスクファイルを成果と調査の開始地点として使用する。完全で一貫した変更セットはリポジトリの責務から決める
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

サブエージェントが`blocked`を返した場合、まずリポジトリのエビデンスから発見可能な入力やルーティングの問題を修正し、その修正で呼び出し内容が実質的に変わる場合は再実行する。前進のためにユーザーが持つ成果・権限・不可逆な外部判断が必要な場合に限りエスカレーションする。

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
- 修正と利用可能なすべてのチェックを完了した後の最終品質判定

### 標準フロー

**基本サイクル**: `task-executor → ユーザーが持つ境界の判定・フォローアップ → quality-fixer → コミット` の4ステップサイクルを管理。
各タスクごとにこのサイクルを繰り返し、品質を保証。

**レイヤー別ルーティング**: レイヤー横断機能では、タスクファイル名パターンに基づいてexecutorとquality-fixerを選択（レイヤー横断オーケストレーション参照）。

## Sub-agent間の制約

**重要**: Sub-agentから他のSub-agentを直接呼び出すことはできない。複数のSub-agentを連携させる場合は、メインAIがオーケストレーターとして動作。

## 構造スケールとドキュメント要件

オーケストレーターは、収束した成果とリポジトリのエビデンスに documentation-criteria を適用する。スケールは判断負荷に従う: 小規模は1つの責務境界の中に明白な実装が1つ、中規模は境界をまたいだ調整または持続的になりうる選択を含み、大規模は別個の設計判断を要する独立した成果を複数含む。ファイル数は補助的なエビデンスにとどまる。

| スケール | PRD | ADR | Design Doc | 作業計画書 |
|---------|-----|-----|------------|-----------|
| 小規模 | プロダクトスコープが変わる場合は更新 | 不要 | 不要 | 不要 — task-executor が明示プロンプトから実行する |
| 中規模 | プロダクトスコープが変わる場合は更新 | ADRの両フィルタを通過した決定ポイントのみ | **必須** | **必須** |
| 大規模 | **必須** — 新規作成・更新・リバースPRDのいずれか | ADRの両フィルタを通過した決定ポイントのみ | **必須** | **必須** |

適格なADRが存在する場合、スケールは最低でも中規模に引き上げられる。適格なADRはすべて1つのバッチとしてレビューし、受理した決定を Design Doc 作成前に `Accepted` にする。

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
| Bash | シェル操作（git commit、ls、検証コマンド） |
| Read | サブエージェント間の情報橋渡しのための成果物ドキュメント参照 |

実装作業（Edit、Write、MultiEdit）はすべてサブエージェントが実施する。オーケストレーター自身は行わない。

### サブエージェント応答形式

サブエージェントはJSON形式で応答する。各エージェントは自身の入出力契約を宣言しているため、呼び出しを組み立てる際はその契約をエージェント側で読む。この表が持つのは、分岐に使う信号と、各値が選ぶ行動だけである。

| Agent | 分岐に使う信号 | 各値での行動 |
|---|---|---|
| requirement-analyzer | `requestSignals`、`scopeEvidence`、`costEvidence`、`questions` | 要件を収束させ、構造スケールを割り当て、より深いコードベースのエビデンスが必要かを判断する |
| codebase-analyzer / ui-analyzer | — | JSON全体をそのまま次の専門エージェントへ渡す。各エージェントは自身の入力宣言が挙げるフィールドを消費する |
| task-executor / task-executor-frontend | `status`、`escalation_type`、`requiresTestReview` | `completed` → サイクルを継続。`escalation_needed` → エージェントが定義する `escalation_type` に従って処理し、ユーザー判断が要る項目は提示する。`requiresTestReview: true` → quality-fixer の前に integration-test-reviewer を実行 |
| quality-fixer / quality-fixer-frontend | `status` | `approved` → コミット。`stub_detected` → `incompleteImplementations[]` を実装ステップに戻し再実行。`blocked` → ユーザーが判断すべき内容をそのまま提示 |
| document-reviewer | `verdict.decision` | `approved` → 次へ。`needs_revision` → レビュー裁定を実行。`rejected` → 出典ソースの衝突を解消するか、ユーザーの権限が必要な場合はエスカレーション |
| integration-test-reviewer | `status` | `approved` → 次へ。`needs_revision` → レビュー裁定を実行。`blocked` → 変更されたテストパスを解決して呼び出しを1回だけ是正する。テストが存在しない場合はその欠陥を executor へ差し戻す。再度 `blocked` が返る場合はレビュー未実施を記録し、その未証明の状態を完了レポートに引き継ぐ |
| code-verifier / security-reviewer | `summary.status` / `status` | 「実装後検証の合否基準」を参照。不可逆操作のハザードによる security の `blocked` は必要な判断を名指しし、エージェント層の権限の外にある |
| design-sync | `sync_status` | `CONFLICTS_FOUND` → 矛盾をユーザーに提示してから進む |
| acceptance-test-generator | `generatedFiles[]` | 出力された各パスの存在を確認し、work-planner へ渡す。空のリストは、追加のスケルトンを要する未充足の証明義務がないことを示す |

**オーケストレーターが持つエージェント間の配線**: quality-fixer には、未追跡・削除・リネームを含む現在の未コミットのワークツリー全体を調べるよう依頼する。実装ステップの `runnableCheck` を引き継ぎ、レシピまたは technical-spec がプロジェクトの正典となる品質コマンドを示している場合は `qualityCommand` として渡す。

quality-fixer は、実行できなかったチェックと無関係と確認済みの既存失敗を、既存のチェック結果に記録する。今回の変更に関係する実行可能なチェックがパスした後は、`approved` として通常のルーティングを続ける。今回の変更が原因の失敗、または受け入れ済みの成果に必要な依存の失敗は、元のタスクにそのパスがなくても修正対象とする。

## 作業計画時の基本フロー

新機能や変更要求を受け取ったら、まず要件のエビデンスを収集し、要件を収束させ、構造スケールを割り当てる。

### 大規模

1. requirement-analyzer → オーケストレーターによる収束とスケール判定 **[停止]**
2. prd-creator → document-reviewer → PRD承認 **[停止]**
3. codebase-analyzer → 簡潔なリポジトリのエビデンス
4. **（フロントエンド/フルスタックのみ）** ui-spec-designer → document-reviewer → UI Spec承認 **[停止]**
5. **（ADR決定ポイントが適格な場合）** technical-designer を `ADRBatch` モードで実行 → document-reviewer によるバッチレビュー → 検出事項の裁定 → 受理したADRを `Accepted` にする **[停止]**
6. technical-designer を `DesignDoc` モードで実行 → code-verifier → document-reviewer → design-sync → Design Doc承認 **[停止]**
7. acceptance-test-generator → work-planner → document-reviewer → 一括承認 **[停止]**
8. task-decomposer → 自律実行 → 完了報告

### 中規模

1. requirement-analyzer → オーケストレーターによる収束とスケール判定 **[停止]**
2. codebase-analyzer → 簡潔なリポジトリのエビデンス
3. **（フロントエンド/フルスタックのみ）** ui-spec-designer → document-reviewer → UI Spec承認 **[停止]**
4. **（ADR決定ポイントが適格な場合）** technical-designer を `ADRBatch` モードで実行 → document-reviewer によるバッチレビュー → 検出事項の裁定 → 受理したADRを `Accepted` にする **[停止]**
5. technical-designer を `DesignDoc` モードで実行 → code-verifier → document-reviewer → design-sync → Design Doc承認 **[停止]**
6. acceptance-test-generator → work-planner → document-reviewer → 一括承認 **[停止]**
7. task-decomposer → 自律実行 → 完了報告

### 小規模

1. requirement-analyzer → オーケストレーターによる収束とスケール判定。確定した成果、影響パス、検証条件を提示する **[停止: 一括承認]**
2. その明示プロンプトから task-executor → 現在の未コミットのワークツリー全体に対する quality-fixer → commit → 完了報告

小規模では作業計画書もタスクファイルも作成しない。新たに適格なADRが判明した場合は中規模へ移行し、それ以外では計画ドキュメントを導入しない。

該当するStructural Scaleフローを、エビデンスで区切られたシーケンスとして扱う。現在のフェーズに、明記されたルーティング条件で必要な成果物、承認、または結果が存在する場合にのみ次へ進む。完了を報告する前に、そのエビデンスが存在しない最も早い適用可能なフェーズから再開する。

## レイヤー横断オーケストレーション

オーケストレーターが `scopeEvidence.affectedLayers` から、機能が backend と frontend にまたがると判断した場合、単一のコードベース分析とDesign Docの区間を、以下のbackend先行・frontend後続の順序に置き換える。

### 設計フェーズの拡張

標準のDesign Doc作成ステップをレイヤー別作成に置き換え:

| ステップ | エージェント | 目的 |
|---------|-----------|------|
| 8 | codebase-analyzer | 確認済みのレイヤー横断スコープ全体を分析する。出典ソースは `prd_path` または `requirements` のちょうど1つを渡す |
| 9 | technical-designer | バックエンドDesign Doc（ステップ8のうちバックエンドに関係するエビデンスを使用） |
| 10 | code-verifier | バックエンドDesign Docを既存コードに対して検証（結果JSONはステップ12に`prior_layer_verification`として渡す） |
| 11 | document-reviewer | バックエンドDesign Docをレビュー（ステップ10の結果を`verification_evidence`、ステップ8のJSONを`codebase_analysis`として入力）。`needs_revision` は裁定して解消し、`rejected` では停止する |
| 12 | technical-designer-frontend | フロントエンドDesign Doc（ステップ8のうちフロントエンドに関係するエビデンス + レビュー済みバックエンドDesign Doc + ステップ10の`prior_layer_verification` + UI Spec） |
| 13 | code-verifier | フロントエンドDesign Docを既存コードに対して検証 |
| 14 | document-reviewer | フロントエンドDesign Docをレビュー（ステップ13の結果と記録した処理方針を`verification_evidence`、ステップ8のJSONを`codebase_analysis`として入力）。`needs_revision` は裁定して解消し、`rejected` ではステップ15の前で停止する |
| 15 | design-sync | レイヤー間整合性検証 **[停止]** |

ステップ8は1回だけ実行し、そのJSON全体を両方のdesignerがそのまま再利用する。各designerは自身のレイヤーに関係するエビデンスを消費する。バックエンド経路（ステップ9〜11）はステップ12の前に直列で完了させる。これによりフロントエンドdesignerは、リポジトリ上の検証結果とレビュー済みのバックエンド契約の両方を受け取る。

**Design Doc作成時のレイヤーコンテキスト指定**:
- **バックエンド**: 「PRD [パス] からバックエンドDesign Docを作成。コードベース分析: [ステップ8のJSON。バックエンドに関係するエビデンスを使用]。対象: APIコントラクト、データ層、ビジネスロジック、サービスアーキテクチャ。」
- **フロントエンド**: 「PRD [パス] からフロントエンドDesign Docを作成。コードベース分析: [ステップ8のJSON。フロントエンドに関係するエビデンスを使用]。レビュー済みバックエンドDesign Doc [パス] — このドキュメントからAPIコントラクトとIntegration Pointsを抽出し、フロントエンドDesign Doc の Integration Points に反映する。バックエンドのレビュー issue と処理方針: [ステップ11 document-reviewer の結果とレビュー裁定の記録]。prior_layer_verification: [バックエンドDesign Docに対するcode-verifierのJSON]。エビデンスに裏付けられた discrepancy と `maintained` のレビュー issue のみを不安定な契約として扱う。UI Spec [パス] のコンポーネント構造を参照。対象: コンポーネント階層、状態管理、UI操作、データ取得。」

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
- `status: escalation_needed` または `status: blocked` → 宣言されたユーザーが持つ境界を確認し、リポジトリのエビデンスを調べても未解決の場合はエスカレーション
- `requiresTestReview` が `true` → **integration-test-reviewer** を実行
  - `status` が `needs_revision` → レビュー裁定を適用し、同じ `task_file` と `apply` の quality-issue オブジェクト一式を逐語で渡して、ルーティング先の executor（レイヤー別エージェントルーティング 参照、task-executor または task-executor-frontend）を **Fix Mode** で再実行する
  - `status` が `blocked` → 移動・リネームされた変更テストパスを解決してレビュアを1回だけ再実行する。`requiresTestReview: true` にもかかわらず変更されたテストが存在しない場合は、その executor 出力の欠陥を **Fix Mode** でルーティング先の executor に差し戻す。再実行でも `blocked` が返る場合はレビュー未実施を記録して quality-fixer へ進む
  - `status` が `approved` → quality-fixer へ進む

### 自律実行の停止条件

以下の場合に自律実行を停止し、ユーザーにエスカレーション：

1. **サブエージェントが示した、ユーザーが持つ境界**
   - 受理済みの振る舞い、公開/共有契約、承認済みの重要な設計、外部の権限、不可逆な操作のいずれかに判断が必要

2. **要件変更検知時**
   - 要件変更検知チェックリストで1つでも該当
   - 自律実行を停止し、統合した要件で再収束する。requirement-analyzer の再実行はリポジトリのエビデンスが変わる必要がある場合のみ

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

選択したフローで必須のタスク、品質ゲート、検証エージェント、commit stepがすべて完了した場合に`status`を`completed`とする。実行できなかったチェックは`verification`に記録し、未解決のユーザー判断によって完了できない場合に限り`blocked`とする。

### Call Example (codebase-analyzer)
- subagent_type: "codebase-analyzer"
- description: "コードベース分析"
- prompt: "出典ソースはちょうど1つ渡す: prd_path: [承認済みPRDのパス]、または requirements: [確認済み要件の原文]。設計のための簡潔なリポジトリのエビデンスを収集してください。"

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
   - changeSummaryからコミットメッセージを作成して git commit を実行
   - 要件変更時は初期要件と追加要件を明示的に統合

   #### 収束記録 → それを引き継ぐエージェント

   **渡すもの**: オーケストレーターが判定した `convergence` 記録を、それを引き継ぐエージェントへ渡す。内容は変更せずに渡し、各フィールドの readiness ラベルも一緒に運ぶ。
   - **prd-creator**（PRDを新規作成または更新する場合）: `outcome` を `成功基準` へ、`nonGoals` と `speculative` 要件を origin `user` として `Future` / `Out of Scope` へ永続化する
   - **technical-designer / technical-designer-frontend**: PRDがない場合は同じ内容を Design Doc の `Requirement Convergence` へ永続化し、`weak-but-explicit` のまま残ったフィールドは常にそこへ記録する
   - **ui-spec-designer**（フロントエンド/フルスタック）: `nonGoals` と `speculative` 要件を、UI Specが対象に含めない機能・能力として扱う
   - **work-planner**: `nonGoals` と `speculative` 要件を全タスクエントリから除外されたものとして扱う。小規模ではPRDもDesign Docも存在しないため、`weak-but-explicit` のフィールドは保存プロトコルに従いオーケストレーター自身のコンテキストに留め、タスクファイルのブロッキング項目にはしない

   #### codebase-analyzer → technical-designer

   **codebase-analyzerへの入力**: 出典ソースちょうど1つ — 承認済みPRDが存在する場合はそのパス、存在しない場合は確認済み要件
   **technical-designerへの入力**: codebase-analyzerのJSON出力をDesign Doc作成プロンプトの追加コンテキストとして渡す。必須の使い道:
   - `focusAreas` → Fact Disposition Tableの正典となるdisposition targetリスト（各focusAreaを1行に展開し、`fact_id`と`evidence`をそのまま引き継ぐ）
   - `dataModel`、`dataTransformationPipelines`、`qualityAssurance` → 「既存コードベース分析」「検証戦略」の各セクションに反映

   #### code-verifier → document-reviewer（Design Docレビュー）

   **code-verifierへの入力**: Design Docパス（doc_type: design-doc）。`code_paths`は指定を省略する — verifierがドキュメントからコードスコープを独自に発見する。
   **document-reviewerへの入力**: 最新のcode-verifier結果と記録したレビュー裁定の処理方針をあわせて`verification_evidence`として、designerに渡したものと同じcodebase-analyzerのJSONを`codebase_analysis`として、出典ソースを`confirmed_requirement_context`として渡す。該当する場合は元の依頼を`requirements_verbatim`として渡す。reviewerは`codebase_analysis.focusAreas`でFact Disposition Tableのカバレッジを検証し、確認済み要件のコンテキストでドキュメントの成果と契約を検証する。

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

   **オーケストレーターの検証**: `generatedFiles[]` の各パスがディスク上に存在すること。空のリストも有効な生成結果である。

   **work-plannerへの入力**: 生成されたパスとタイミングガイダンス — 統合テストは各フェーズ実装と並行して作成し、fixture-e2e テストは UI 機能フェーズと並行して作成し、service-integration-e2e テストは必要なサービスが利用可能になった後に実行する。
3. **ADRステータス管理**: ユーザー判断後のADRステータス更新（Accepted/Rejected）

## 重要な制約

- **品質チェック**: quality-fixer が `approved` を返した後にタスクをコミットできる
- **構造化レスポンス**: サブエージェント間で渡す情報には、宣言済みのJSON fieldを使用する
- **承認管理**: ドキュメント作成後にdocument-reviewerを実行し、指定されたユーザー承認の停止点を通過してから次のPhaseへ進む
- **フロー確認**: 承認後は、確定した大規模・中規模・小規模フローから次のstepを選択する
- **整合性検証**: サブエージェントの出力が矛盾した場合、優先順位に従って解決（委譲の境界セクション参照）

### 実装後検証のPass/Fail基準

| Verifier | Pass | Fail | Blocked |
|----------|------|------|---------|
| code-verifier | `summary.status`が`consistent` | `summary.status`が`needs_review`または`inconsistent` | `summary.status`が`blocked` → `blockingReason`を添えてエスカレーション。検証可能な入力がなかった状態である |
| security-reviewer | `status`が`approved` | `status`が`needs_revision` | `status`が`blocked` → 不可逆操作、またはエージェントの権限外として名指しされた判断をエスカレーション |

**再実行ルール**: 不合格となった検証エージェントの検出事項にレビュー裁定を適用し、修正対象になった検出事項を返した検証エージェントだけを再実行する。修正の収束とエスカレーションはレビュー裁定が担い、合格した検証エージェントの記録済みエビデンスは維持する。

**修正サイクルのハンドオフ**: レビュー裁定を適用し、必要な各 executor には `apply` の検出事項オブジェクト全体を逐語で、処理方針のみ付加して渡す。照合を受け付けるレビュアー入力には `prior_feedback` を引き継ぐ。
