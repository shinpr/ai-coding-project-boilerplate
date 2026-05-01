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

作業計画: $ARGUMENTS

## 実行前提条件

### タスクファイル存在チェック
```bash
# 作業計画書を確認
! ls -la docs/plans/*.md | grep -v template | tail -5

# タスクファイルを確認
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ タスクファイルが見つかりません"
```

### タスク生成判定フロー

タスクファイルの存在状態を分析し、必要なアクションを決定:

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | tasks/ディレクトリに.mdファイルあり | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし+計画あり | 計画書は存在するがタスクファイルなし | ユーザー確認 → task-decomposer実行 |
| どちらもなし＋Design Docあり | 計画書・タスクファイルなし、docs/design/*.mdあり | work-plannerでDesign Docから作業計画書を作成し、タスク分解へ進む |
| どちらもなし | 計画書・タスクファイル・Design Docすべてなし | 前提条件未達成をユーザーに報告して停止 |

## タスク分解フェーズ（条件付き）

タスクファイルが存在しない場合：

### 1. ユーザー確認
```
タスクファイルが見つかりません。
作業計画: docs/plans/[plan-name].md

作業計画からタスクを生成しますか？ (y/n):
```

### 2. タスク分解（承認された場合）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画をタスクに分解"
- `prompt`: "作業計画を読み込み、アトミックなタスクに分解。入力: docs/plans/[plan-name].md。出力: docs/plans/tasks/配下に個別タスクファイル。粒度: 1タスク = 1コミット = 独立実行可能"

### 3. 生成確認
```bash
# 生成されたタスクファイルを確認
! ls -la docs/plans/tasks/*.md | head -10
```

**フロー**: タスク生成 → 自律実行（この順序で実行）

## 実行前チェックリスト

- [ ] docs/plans/tasks/にタスクファイルが存在することを確認
- [ ] タスクの実行順序（依存関係）を特定
- [ ] **環境チェック**: タスク単位のコミットサイクルを実行可能か？
  - コミット機能が利用不可 → 自律実行モード前にエスカレーション
  - その他の環境（テスト、品質ツール） → サブエージェントがエスカレーション

## タスク実行サイクル（4ステップサイクル）
**必須実行サイクル**: `task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit`

各タスクで必須：
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

! ls -la docs/plans/*.md | head -10

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

4. **全て合格** → 完了レポートへ

## 出力例
フロントエンド実装フェーズ完了。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装タスク: [件数] タスク
- 品質チェック: 全てパス
- コミット: [件数] コミット作成
