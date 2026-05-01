---
description: 分解済みタスクを自律実行モードで実装
---

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor → エスカレーションチェック → quality-fixer → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をもってバッチ承認とする
4. **スコープ**: 全タスクのコミット完了またはエスカレーション発生で完了

**重要**: 全てのコミット前にquality-fixerを実行。

作業計画書: $ARGUMENTS

## 実行前提条件

### タスクファイル存在チェック
```bash
# 計画書の確認
! ls -la docs/plans/*.md | grep -v template | tail -5

# タスクファイルの確認
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ タスクファイルが見つかりません"
```

### タスク生成判定フロー

タスクファイルの存在状態を確認し、適切な対応を決定:

| 状態 | 判定基準 | 次のアクション |
|------|---------|--------------|
| タスク存在 | tasks/ディレクトリに.mdファイルあり | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし＋計画書あり | 計画書は存在するがタスクファイルなし | ユーザーに確認 → task-decomposer実行 |
| 両方なし＋Design Docあり | 計画書・タスクファイルなし、docs/design/*.mdあり | work-plannerでDesign Docから作業計画書を作成し、タスク分解へ進む |
| 両方なし | 計画書・タスクファイル・Design Docすべてなし | 前提条件未達成をユーザーに報告して停止 |

## タスク分解フェーズ（条件付き実行）

タスクファイルが存在しない場合：

### 1. ユーザー確認
```
タスクファイルが見つかりません。
作業計画書: docs/plans/[計画書名].md

計画書からタスクを生成しますか？ (y/n):
```

### 2. タスク分解実行（承認時）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画をタスクに分解"
- `prompt`: "作業計画書を読み込み、1コミット粒度の独立したタスクに分解。入力: docs/plans/[計画書名].md。出力: docs/plans/tasks/配下に個別タスクファイル生成。粒度: 1タスク = 1コミット = 独立して実行可能"

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
**必須実行サイクル**: `task-executor → エスカレーションチェック → quality-fixer → commit`

各タスクで必須：
1. **TaskCreateでタスク登録**: 作業ステップを登録。必ず含める: 最初に「ロード済みスキルから具体ルールを抽出」、最後に「抽出ルールを最終JSON前に検証」
2. **task-executor を呼び出す**: タスク実装を実行（レイヤー横断 の場合は subagents-orchestration-guide の レイヤー別エージェントルーティング 参照）
3. **task-executor レスポンスをチェック**:
   - `status: "escalation_needed"` または `"blocked"` → 停止してユーザーにエスカレーション
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行
     - `needs_revision` → ステップ2 に戻り、同じ `task_file` と `requiredFixes[]` 配列を入力として task-executor を **Fix Mode** で再起動
     - `approved` → ステップ4 へ
   - `readyForQualityCheck: true` → ステップ4 へ
4. **quality-fixer を呼び出す**: 全品質チェックと修正を実行（レイヤー横断 の場合は レイヤー別エージェントルーティング 参照）。`task_file` として現在のタスクファイルパス、`filesModified` として実装ステップの `filesModified` 配列を **必ず渡す**（未完成実装検出を当該タスクの実書き込み集合にスコープする。省略時は quality-fixer が `git diff HEAD` にフォールバック）
5. **quality-fixer レスポンスをチェック**:
   - `stub_detected` → ステップ2 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor を **Fix Mode** で再起動
   - `blocked` → 停止してユーザーにエスカレーション
   - `approved` → ステップ6 へ
6. **承認後コミット**: git commit を実行

**重要**: 全サブエージェントレスポンスの status フィールドをパースし、4ステップサイクルの対応ブランチを実行。quality-fixer が `approved` を返すまで次のタスクに進まない。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

承認確認後、自律実行モードを開始。要件変更を検知した場合は即座に停止。

## 実装後検証（全タスク完了後）

全タスクサイクル完了後、完了レポートの前に検証エージェントを**並列実行**:

1. **両方を並列で実行** (Agent tool):
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`、Design Docパス、`code_paths`: 実装ファイルリスト（`git diff --name-only main...HEAD`）
   - security-reviewer (subagent_type: "security-reviewer") → Design Docパス、実装ファイルリスト

2. **結果の統合** — 合格/不合格の基準はsubagents-orchestration-guideの実装後検証セクション参照。統合検証レポートをユーザーに提示。

3. **修正サイクル**（いずれかの verifier が fail のとき、最大2サイクル）:
   - task-template を用いて、統合修正タスクファイル（例: `docs/plans/tasks/post-impl-fixes-YYYYMMDD.md`）を作成。Target Files には全 verifier の `requiredFixes[].location` / `discrepancies[].codeLocation` が指すファイルパスの和集合を `file[:line]` として解釈してファイル部分のみ取り出して投入する。これにより、元タスクに依らず影響ファイルすべてが executor の File Scope Constraint に許可される。
   - task-executor を起動する前に、**verifier 出力を正規化**して統一的な `requiredFixes[]` にする:
     - `security-reviewer.requiredFixes[]`（既に `{location, issue, fix}` 形式）→ そのまま透過。
     - `code-verifier.discrepancies[]` → 対応可能な各 discrepancy（status が `drift` / `gap` / `conflict`）を `{location: discrepancy.codeLocation, issue: discrepancy.claim, fix: "[Design Doc 整合性回復に必要な具体的修正。discrepancy.classification と evidence から導出]"}` に変換。
     - `discrepancy.codeLocation` が `null`（主張が未実装）の場合は、`location` に予定された対象ファイルパスを設定し、そのファイルを統合タスクの Target Files にも追加する。対象ファイルが特定できない場合は、Fix Mode を起動する代わりにユーザーにエスカレーション。
   - `task_file` には統合修正タスクファイルのパス、`requiredFixes` に正規化配列を設定して task-executor を **Fix Mode** で起動。
   - 続いて quality-fixer、その後 fail した verifier のみ再実行。
   - 2サイクル後も fail が残る場合 → 残存指摘事項を添えてユーザーにエスカレーション

4. **全て合格** → 完了レポートへ

## 出力例
実装フェーズが完了しました。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装されたタスク: [タスク数]件
- 品質チェック: すべて通過
- コミット: [コミット数]件作成

**責務境界**:
- スコープ内: タスク分解から実装完了まで
- スコープ外: 設計フェーズ、計画フェーズ
