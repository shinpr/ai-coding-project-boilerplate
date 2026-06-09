---
description: フロントエンド実装を自律実行モードで実行
---

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、成果物パスの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をもってバッチ承認とする
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
2. マッチしたファイルから、以下のいずれかにマッチするものを除外する。これらは本実行の実装タスクではなく、他のワークフローフェーズに由来する: `*-task-prep-*.md`（readiness preflight タスク）、`_overview-*.md`（分解overviewファイル）、`*-phase*-completion.md`（フェーズ完了ファイル）、`review-fixes-*.md`（実装後レビュー修正）、`integration-tests-*-task-*.md`（統合テスト追加用スキャフォールディング）
3. 残った各ファイルから、末尾の `-frontend-task-{NN}.md` を取り除いて `{plan-name}` を抽出する
4. 少なくとも1つのタスクファイルがマッチした場合、最も新しい mtime を持つ `{plan-name}` の `docs/plans/{plan-name}.md` を作業計画書とする。タイは辞書順最大の `{plan-name}` で解決する
5. `*-frontend-task-*.md` が見つからず、かつ `docs/plans/`に非テンプレートの作業計画書が存在する場合、最も新しい計画書を自動採用してはならない — frontend タスクは明示的に命名されている必要がある。停止して報告する: 「`docs/plans/tasks/`に `*-frontend-task-*.md` が見つかりませんでした。本レシピを frontend 計画に対して実行する意図であれば、task-decomposer を再実行して frontend 命名のタスクファイルを出力させるか、作業計画書のパスを `$ARGUMENTS` で指定してください。計画が backend ならば、backend build レシピを使用してください。」

### Consumed Task Set

本実行で消費する **Consumed Task Set** を計算する — 本レシピが所有・実行・後で削除する正確なファイル群。ルーティング表により、消費可能なパターンは1つだけ:

1. 作業計画書の解決で確定した `{plan-name}` について、`docs/plans/tasks/`内で `{plan-name}-frontend-task-*.md` にマッチするタスクファイルを列挙する。`{plan-name}-task-*.md` および `{plan-name}-backend-task-*.md` は除外する — `task-executor` にルーティングされ、backend build レシピが所有する
2. 以下にマッチするファイルを除外する: `*-task-prep-*.md`、`_overview-*.md`、`*-phase*-completion.md`、`review-fixes-*.md`、`integration-tests-*-task-*.md`（これらは他のワークフローフェーズに由来する）

本レシピ内で「タスクファイル」と参照する箇所すべて — タスク生成判定フロー、タスク実行サイクルの反復、最終クリーンアップ — はこのセットを使用する。`docs/plans/tasks/*.md` を制限なく glob しない。

### タスク生成判定フロー

Consumed Task Set を確認し、適切な対応を決定する。注: `$ARGUMENTS`が空かつ `*-frontend-task-*.md` が存在しない場合は、上記の作業計画書の解決が既に実行を停止している — 以下の表で「タスクなし」が関わる行は、ユーザーが明示的に `$ARGUMENTS` を指定した場合にのみ発火する。

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | Consumed Task Set が非空 | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし + `$ARGUMENTS`で計画書指定 | `$ARGUMENTS`が提供され Consumed Task Set が空 | ユーザーに確認 → task-decomposer実行（frontend命名ルールにより `*-frontend-task-*.md` を出力する） |
| どちらもなし＋Design Docあり + `$ARGUMENTS`提供 | `$ARGUMENTS`が提供され、計画書なし、Consumed Task Setなし、ただし docs/design/*.md が存在 | work-plannerでDesign Docから作業計画書を作成し、タスク分解の前に**作業計画書レビュー**（下記参照）を行う |
| どちらもなし | `$ARGUMENTS`なし、計画書なし、Consumed Task Setなし、Design Docなし | 前提条件未達成をユーザーに報告して停止 |

## 作業計画書レビュー（本レシピが計画書を作成した場合）

上記の判断フローでDesign Docから作業計画書を作成した場合、タスク分解の前にレビューする:

1. Agentツールでdocument-reviewerを呼び出す:
   - `subagent_type`: "document-reviewer"
   - `description`: "作業計画書レビュー"
   - `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md design_doc: [Design Docのパス]。Design Docへの意味的トレーサビリティ、早期検証の配置、実境界での検証カバレッジ、故障モードチェックリスト、レビュースコープをレビューする。"
2. reviewerの `verdict.decision` で分岐する:
   - `needs_revision` → 所見を渡してwork-plannerをupdateモードで再実行し、`approved`/`approved_with_conditions` になるまで再レビューする
   - `rejected` → タスク分解の前に停止しユーザーにエスカレーションする
3. レビュー済みの計画書をタスク分解の前にバッチ承認のため提示する。

## タスク分解フェーズ（条件付き）

Consumed Task Set が空の場合：

### 1. ユーザー確認
```
Consumed Task Set にタスクファイルがありません。
作業計画書: docs/plans/[plan-name].md

作業計画書からタスクを生成しますか？ (y/n):
```

### 2. タスク分解（承認された場合）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画をタスクに分解"
- `prompt`: "作業計画を読み込み、アトミックなタスクに分解。入力: docs/plans/[plan-name].md。出力: docs/plans/tasks/配下に個別タスクファイル。粒度: 1タスク = 1コミット = 独立実行可能"

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

Consumed Task Set 内の各タスクで必須：
1. **TaskCreateでタスク登録**: 作業ステップを登録。必ず含める: 最初に「ロード済みスキルから具体ルールを抽出」、最後に「抽出ルールを最終JSON前に検証」
2. **Agent tool** (subagent_type: "task-executor-frontend") → タスクファイルパスを prompt に渡し、構造化レスポンスを受け取る
3. **task-executor-frontend レスポンスをチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行
     - `needs_revision` → ステップ2 に戻り、同じ `task_file` と `requiredFixes[]` 配列を入力として task-executor-frontend を **Fix Mode** で再起動
     - `approved` → ステップ4 へ
   - `readyForQualityCheck: true` → ステップ4 へ
4. **quality-fixer-frontend を呼び出す**: 全品質チェックと修正を実行。`task_file` として現在のタスクファイルパス、`filesModified` として実装ステップの `filesModified` 配列を **必ず渡す**（未完成実装検出を当該タスクの実書き込み集合にスコープする。省略時は quality-fixer が `git diff HEAD` にフォールバック）
5. **quality-fixer-frontend レスポンスをチェック**:
   - `stub_detected` → ステップ2 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor-frontend を **Fix Mode** で再起動
   - `blocked` → 停止してユーザーにエスカレーション
   - `approved` → ステップ6 へ
6. **承認後コミット**: git commit を実行

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
   - security-reviewer (subagent_type: "security-reviewer") → Design Docパス、実装ファイルリスト

2. **結果の統合** — 合格/不合格の基準はsubagents-orchestration-guideの実装後検証セクション参照。統合検証レポートをユーザーに提示。

3. **修正サイクル**（いずれかの verifier が fail のとき、最大2サイクル）:
   - task-template を用いて、統合修正タスクファイル（例: `docs/plans/tasks/post-impl-fixes-YYYYMMDD.md`）を作成。Target Files には全 verifier の `requiredFixes[].location` / `discrepancies[].codeLocation` が指すファイルパスの和集合を `file[:line]` として解釈してファイル部分のみ取り出して投入する。これにより、元タスクに依らず影響ファイルすべてが executor の File Scope Constraint に許可される。
   - task-executor-frontend を起動する前に、**verifier 出力を正規化**して統一的な `requiredFixes[]` にする:
     - `security-reviewer.requiredFixes[]`（既に `{location, issue, fix}` 形式）→ そのまま透過。
     - `code-verifier.discrepancies[]` → 対応可能な各 discrepancy（status が `drift` / `gap` / `conflict`）を `{location: discrepancy.codeLocation, issue: discrepancy.claim, fix: "[Design Doc 整合性回復に必要な具体的修正。discrepancy.classification と evidence から導出]"}` に変換。
     - `discrepancy.codeLocation` が `null`（主張が未実装）の場合は、`location` に予定された対象ファイルパスを設定し、そのファイルを統合タスクの Target Files にも追加する。対象ファイルが特定できない場合は、Fix Mode を起動する代わりにユーザーにエスカレーション。
   - `task_file` には統合修正タスクファイルのパス、`requiredFixes` に正規化配列を設定して task-executor-frontend を **Fix Mode** で起動。
   - 続いて quality-fixer-frontend、その後 fail した verifier のみ再実行。
   - 2サイクル後も fail が残る場合 → 残存指摘事項を添えてユーザーにエスカレーション

4. **全て合格** → 最終クリーンアップへ

## 最終クリーンアップ

完了レポートの前に、本レシピが消費した実装タスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- Consumed Task Set 内のすべてのファイルを削除する
- `docs/plans/tasks/{plan-name}-phase*-completion.md` にマッチするすべてのファイルを削除する（task-decomposer が生成した本 `{plan-name}` のフェーズ完了ファイル）
- 該当する `docs/plans/tasks/_overview-{plan-name}.md` が存在する場合は削除する
- 作業計画書本体（`docs/plans/{plan-name}.md`）は保持する — 最終レビュー後に削除するかはユーザーが判断する

タスクファイルを削除できない場合（ファイルシステムエラー）、失敗を報告するが完了レポートをブロックしない。

## 完了レポートコントラクト

最終レポートには以下を含めること:
- タスク分解のステータス
- 実装したタスク数
- 品質チェック結果
- コミット数
- クリーンアップ結果
- エスカレーションまたはブロッキングの要約（あれば）
