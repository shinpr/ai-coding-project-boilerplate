---
description: 実体化済みフロントエンドタスクファイルを自律実行モードで実行
---

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、成果物パスの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をバッチ承認とみなす
4. **スコープ**: 全タスクのコミット完了またはエスカレーションで責務完了

**重要**: 全てのコミット前にquality-fixer-frontendを実行。

作業計画書: $ARGUMENTS

## 実行前提条件

### 作業計画書の解決

タスク処理の前に、作業計画書を特定する。

**`$ARGUMENTS`が指定されている場合**は、それがユーザーから渡された作業計画書のパスである。自動解決を行わずそのまま使用する。`{plan-name}`はファイル名から `.md` 拡張子（および末尾に `-plan` がある場合はそれも）を除いて抽出する。

**`$ARGUMENTS`が空の場合**、タスクファイルから自動解決する:
1. `docs/plans/tasks/`内で本レシピが消費可能な唯一のパターンに一致するタスクファイルを列挙する（subagents-orchestration-guideの「Layer-Aware Agent Routing」により、`task-executor-frontend` が所有するファイル名サフィックスはこの形のみ）:
   - `{plan-name}-frontend-task-*.md`
   - 素の `{plan-name}-task-*.md` は消費**しない** — ルーティング表により backend 予約のファイル名で、backend build レシピが所有する。`{plan-name}-backend-task-*.md` も同様に消費しない。
2. マッチしたファイルから、以下のいずれかにマッチするものを除外する。これらは本実行の実装タスクではなく、他のワークフローフェーズに由来する: `integration-tests-*-task-*.md`（統合テスト追加用スキャフォールディング）
3. 残った各ファイルから、末尾の `-frontend-task-{NN}.md` を取り除いて `{plan-name}` を抽出する
4. 少なくとも1つのタスクファイルがマッチした場合、最も新しい mtime を持つ `{plan-name}` の `docs/plans/{plan-name}.md` を作業計画書とする。タイは辞書順最大の `{plan-name}` で解決する
5. `*-frontend-task-*.md` が見つからず、かつ `docs/plans/`に非テンプレートの作業計画書が存在する場合、frontend タスクは明示的な命名を要するものとして扱う — 最も新しい計画書がその代わりにはならない。停止して報告する: 「`docs/plans/tasks/`に `*-frontend-task-*.md` が見つかりませんでした。本レシピを frontend 計画に対して実行する意図であれば、作業計画書の該当タスクエントリを `Executor lane: frontend` に修正してタスクファイルを再生成するか、作業計画書のパスを `$ARGUMENTS` で指定してください。計画が backend ならば、backend build レシピを使用してください。」ファイル名は計画書が宣言した lane に従うため、タスク実体化を再実行するだけではファイル名は変わらない。

### Consumed Task Set

本実行で消費する **Consumed Task Set** を計算する — 本レシピが所有・実行・後で削除する正確なファイル群。ルーティング表により、消費可能なパターンは1つだけ:

1. 作業計画書の解決で確定した `{plan-name}` について、`docs/plans/tasks/`内で `{plan-name}-frontend-task-*.md` にマッチするタスクファイルを列挙する。`{plan-name}-task-*.md` および `{plan-name}-backend-task-*.md` は除外する — `task-executor` にルーティングされ、backend build レシピが所有する
2. 以下にマッチするファイルを除外する: `integration-tests-*-task-*.md`（他のワークフローフェーズに由来する）

本レシピ内で「タスクファイル」と参照する箇所すべて — タスク生成判定フロー、タスク実行サイクルの反復、最終クリーンアップ — はこのセットを使用する。`docs/plans/tasks/*.md` を制限なく glob しない。

### タスク生成判定フロー

Consumed Task Set を確認し、適切な対応を決定する。注: `$ARGUMENTS`が空かつ `*-frontend-task-*.md` が存在しない場合は、上記の作業計画書の解決が既に実行を停止している — 以下の表で「タスクなし」が関わる行は、ユーザーが明示的に `$ARGUMENTS` を指定した場合にのみ発火する。

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | Consumed Task Set が非空 | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし + `$ARGUMENTS`で計画書指定 | `$ARGUMENTS`が提供され Consumed Task Set が空 | ユーザーに確認 → task-decomposer実行（`Executor lane: frontend` を宣言する各タスクエントリについて `*-frontend-task-*.md` を出力する） |
| どちらもなし＋Design Docあり + `$ARGUMENTS`提供 | `$ARGUMENTS`が提供され、計画書なし、Consumed Task Setなし、ただし docs/design/*.md が存在 | work-plannerでDesign Docから作業計画書を作成し、タスク実体化の前に**作業計画書レビュー**（下記参照）を行う |
| どちらもなし | `$ARGUMENTS`なし、計画書なし、Consumed Task Setなし、Design Docなし | 前提条件未達成をユーザーに報告して停止 |

## 作業計画書レビュー（本レシピが計画書を作成した場合）

上記の判断フローでDesign Docから作業計画書を作成した場合、タスク実体化の前にレビューする:

1. Agentツールでdocument-reviewerを呼び出す:
   - `subagent_type`: "document-reviewer"
   - `description`: "作業計画書レビュー"
   - `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md。作業計画書自身の実装スコープ、タスク、完了条件、依存関係、実行順序、引用アンカーの実在、実行可能な検証をレビューする。出典ソースは対象文書の Governing Documents から解決する。"
2. reviewerの `verdict.decision` で分岐する:
   - `needs_revision` → レビュー裁定を、その修正再レビュー・エスカレーション・収束の各遷移に沿って回す。差し戻す修正には work-planner を update モードで用い、収束条件に達したときのみ先へ進む
   - `rejected` → タスク実体化の前に停止しユーザーにエスカレーションする
3. レビュー済みの計画書をタスク実体化の前にバッチ承認のため提示する。

## タスク実体化フェーズ（条件付き）

Consumed Task Set が空の場合：

### 1. ユーザー確認
```
Consumed Task Set にタスクファイルがありません。
作業計画書: docs/plans/[plan-name].md

作業計画書からタスクを生成しますか？ (y/n):
```

### 2. タスク実体化（承認された場合）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画書のタスクを実体化"
- `prompt`: "docs/plans/[plan-name].md の作業計画書を読み込み、実装項目ごとに1コミット粒度のタスクファイル1つを docs/plans/tasks/ 配下に出力する。各ファイル名はその項目の Executor lane から選ぶ。"

### 3. 生成確認
上記「Consumed Task Set」セクションの制限パターンを使って Consumed Task Set を再計算し、非空であることを確認する。依然として空の場合はユーザーにエスカレーション — task-decomposer が静かに失敗したか、想定パターンに合致しないファイルを生成した可能性がある。

**フロー**: タスク生成 → Consumed Task Set 再計算 → 自律実行（この順序）

## 実行前チェックリスト

- [ ] Consumed Task Set が非空であることを確認（上記「Consumed Task Set」セクションで計算）
- [ ] Consumed Task Set 内のタスク実行順序（依存関係）を特定
- [ ] **環境チェック**: タスク単位のコミットサイクルを実行可能か？
  - コミット機能が利用不可 → 自律実行モード前にエスカレーション
  - その他の環境（テスト、品質ツール） → サブエージェントがエスカレーション

## タスク実行サイクル（4ステップサイクル）
**必須実行サイクル**: `task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit`

最初の反復の前に、本レシピのフェーズを TaskCreate で一度だけ登録する: 「Consumed Task Set の実行」「実装後検証の実行」「消費したタスクファイルのクリーンアップ」「完了報告」。各フェーズは完了時に TaskUpdate で更新する。

Consumed Task Set 内の各タスクで必須：
1. **EXECUTE**: task-executor-frontend を呼び出してタスク実装を実行
2. **実行結果で分岐**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行。実装ステップの `testsAdded` の全パスを `testFile` として、`taskFiles: [現在のタスクファイルパス]`（レビュアがタスクの Operation Verification Methods と Verification Focus を読めるようにする）、`diffBase: HEAD`（この時点でタスクの変更は未コミットのため HEAD がその差分の基点）を渡す。その後 `status` で分岐する
     - `needs_revision` → レビュー裁定を適用し、`apply` の quality-issue オブジェクト一式を逐語で task-executor-frontend に渡して **Fix Mode** でステップ1 に戻る
     - `blocked` → 現在の diff から移動・リネームされたテストパスを解決してレビューを**1回だけ**再実行する。`requiresTestReview: true` にもかかわらず変更されたテストが存在しない場合は、その executor 出力の欠陥を **Fix Mode** でステップ1 に差し戻す。再実行でも `blocked` が返る場合は、テストレビュー未実施を `blockingReason` とともに記録してステップ3へ進み、その未証明の状態を完了レポートに引き継ぐ
     - `approved` → ステップ3 へ
   - `readyForQualityCheck: true` → ステップ3 へ
3. **QUALITY-FIX**: 未追跡・削除・リネームを含む現在の未コミットのワークツリー全体に対して quality-fixer-frontend を呼び出す。現在の `task_file`、実装ステップの `runnableCheck`、および frontend-technical-spec またはリポジトリの規約が権威ある品質コマンドを示している場合は `qualityCommand` を渡す。その後レスポンスで分岐する:
   - `stub_detected` → ステップ1 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor-frontend を **Fix Mode** で再起動
   - `blocked` → 停止してユーザーにエスカレーション（subagents-orchestration-guide の quality-fixer blockedハンドリングに従い `reason` で判別する）
   - `approved` → ステップ4 へ
4. **承認後コミット**: git commit を実行

**重要**: 全サブエージェントレスポンスの status フィールドをパースし、4ステップサイクルの対応ブランチを実行。quality-fixer-frontend が `approved` を返すまで次のタスクに進まない。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## 実装後検証（全タスク完了後）

全タスクサイクル完了後、完了レポートの前に検証エージェントを**並列実行**:

1. **両方を並列で実行** (Agent tool):
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`、Design Docパス、`code_paths`: 実装ファイルリスト（`git diff --name-only main...HEAD`）
   - security-reviewer (subagent_type: "security-reviewer") → `governingDocuments: [{"type":"design-doc","path":"[パス]"}]` と実装ファイルリスト

2. **結果の統合** — 合格/不合格の基準はsubagents-orchestration-guideの実装後検証セクション参照。統合検証レポートをユーザーに提示。

3. **修正サイクル**（いずれかの verifier が fail のとき、最大2サイクル）:
   - 対応可能な各検出事項にレビュー裁定を適用する。`apply` の検出事項オブジェクトは、処理方針のみ付加して逐語で task-executor-frontend に渡す。対象パスを特定できない discrepancy は、パスを捏造せずエスカレーションする。
   - 影響パス、観察可能な検証条件、変更していない検出事項オブジェクトを渡して task-executor-frontend を **Fix Mode** で起動する。修正タスクファイルは作成しない。
   - 続いて quality-fixer-frontend、その後 fail した verifier のみ再実行。
   - 2サイクル後も fail が残る場合 → 残存指摘事項を添えてユーザーにエスカレーション

4. **全て合格** → 最終クリーンアップへ

## 最終クリーンアップ

完了レポートの前に、本レシピが消費した実装タスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- Consumed Task Set 内のすべてのファイルを削除する
- 作業計画書本体（`docs/plans/{plan-name}.md`）は保持する — 最終レビュー後に削除するかはユーザーが判断する

タスクファイルを削除できない場合（ファイルシステムエラー）、失敗を報告するが完了レポートをブロックしない。

## 完了レポートコントラクト

最終レポートには以下を含めること:
- タスク実体化のステータス
- 実装したタスク数
- 品質チェック結果
- コミット数
- クリーンアップ結果
- エスカレーションまたはブロッキングの要約（あれば）
