---
description: 分解済みタスクを自律実行モードで実装
---

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor → エスカレーションチェック → quality-fixer → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をバッチ承認とみなす
4. **スコープ**: 全タスクのコミット完了またはエスカレーション発生で完了

**重要**: 全てのコミット前にquality-fixerを実行。

作業計画書: $ARGUMENTS

## 実行前提条件

### 作業計画書の解決

タスク処理の前に、作業計画書を特定する。

**`$ARGUMENTS`が指定されている場合**は、それがユーザーから渡された作業計画書のパスである。自動解決を行わずそのまま使用する。`{plan-name}`はファイル名から `.md` 拡張子（および末尾に `-plan` がある場合はそれも）を除いて抽出する。

**`$ARGUMENTS`が空の場合**、タスクファイルから自動解決する:
1. `docs/plans/tasks/`内で本レシピが消費可能なパターンに一致するタスクファイルを列挙する（subagents-orchestration-guideの「Layer-Aware Agent Routing」で `task-executor` を経由するルートに対応）:
   - `{plan-name}-task-*.md`（単層タスク。ルーティング表により backend 予約）
   - `{plan-name}-backend-task-*.md`（複層計画の backend 部分）
   - `{plan-name}-frontend-task-*.md` は本レシピでは消費**しない** — `task-executor-frontend` にルーティングされ、frontend build レシピが所有する
2. マッチしたファイルから、以下のいずれかにマッチするものを除外する。これらは本実行の実装タスクではなく、他のワークフローフェーズに由来する: `*-task-prep-*.md`（readiness preflight タスク）、`_overview-*.md`（分解overviewファイル）、`*-phase*-completion.md`（フェーズ完了ファイル）、`review-fixes-*.md`（実装後レビュー修正）、`integration-tests-*-task-*.md`（統合テスト追加用スキャフォールディング）
3. 残った各ファイルから、末尾の `-task-{NN}.md` または `-backend-task-{NN}.md` を取り除いて `{plan-name}` を抽出する
4. 少なくとも1つのタスクファイルがマッチした場合、最も新しい mtime を持つ `{plan-name}` の `docs/plans/{plan-name}.md` を作業計画書とする。タイは辞書順最大の `{plan-name}` で解決する
5. **消費可能なパターンが何もマッチせず、`docs/plans/tasks/`に `*-frontend-task-*.md` が存在する場合**: 停止してユーザーに報告する: 「frontend 命名のタスクファイルしか見つかりませんでした。frontend build レシピを実行する意図であればそちらに切り替えてください。計画が backend ならば、task-decomposer を再実行して backend 命名のタスクファイルを出力させるか、作業計画書のパスを `$ARGUMENTS` で指定してください。」
6. 消費可能パターンも `*-frontend-task-*.md` も見つからない場合、**backendであることを積極的に示す信号が確認できた場合に限り** `docs/plans/`の最も新しい mtime の非テンプレート `.md` にフォールバックする。多くの計画書テンプレートには backend / frontend のいずれにも合致しない layer-neutral なパス（例: `src/presentation`、`src/app`）が含まれるため、frontend 信号の不在だけでは不十分 — backend の確証が必要である。計画書を読んで以下を確認する:

   **Backend 信号（最低1つ必要）**:
   - `## Impact Scope > ### Target Files`（または同等のセクション）の対象ファイルが backend マーカー（`**/api/**`、`**/server/**`、`**/services/**`、`**/backend/**`、`**/handlers/**`、`**/repositories/**`、または technical-spec スキルで宣言されたプロジェクト固有の backend パス）に**排他的に**マッチする
   - 計画書の `## 関連ドキュメント` が、ファイル名から明示的に backend と特定できる Design Doc を参照している（例: `*-backend-design.md`、`backend-*-design.md`）
   - 計画書のタイトル、`## 目的`、`## 背景` セクションが作業を backend と明示している（例: 「backend 実装」「APIエンドポイント」「データベースマイグレーション」「サーバーサイド」）

   **Frontend 信号（1つでも該当すれば不適格扱いとなる。backend 信号が存在しても優先される）**:
   - `## 関連ドキュメント` が `docs/ui-spec/*` を指している
   - `## UI Specコンポーネント → タスクマッピング` セクションが存在する
   - 対象ファイルが frontend パス（`**/components/**`、`**/pages/**`、`**/web/**`、`**/*.tsx`、`**/*.jsx`）に排他的に該当する
   - 計画書のタイトルや目的が React、UI コンポーネント、画面、frontend を明示している

   **判定**:
   - backend 信号 ≥1 かつ frontend 信号 = 0 → 計画書を受容して進む
   - それ以外（backend 信号がない、または frontend 信号が1つでもある、または layer-neutral なパスのみ）→ 停止して報告する: 「最も新しい作業計画書 `[path]` が backend 計画であることを確証できません（確認した信号と結果: [リスト]）。意図する backend 計画書のパスを `$ARGUMENTS` で指定するか、task-decomposer を先に実行して `docs/plans/tasks/` に backend 命名のタスクファイルを出力してください。」
7. `docs/plans/`に計画書が一切存在しない場合は、停止して報告する: 「作業計画書が見つかりません。作業計画書のパスを `$ARGUMENTS` で指定するか、計画フェーズを先に完了してください。」

### Consumed Task Set

本実行で消費する **Consumed Task Set** を計算する — 本レシピが所有・実行・後で削除する正確なファイル群。作業計画書の解決と同じ消費可能パターンを使用する:

1. 作業計画書の解決で確定した `{plan-name}` について、`docs/plans/tasks/`内で `{plan-name}-task-*.md` または `{plan-name}-backend-task-*.md` にマッチするタスクファイルを列挙する。`{plan-name}-frontend-task-*.md` は除外する — frontend build レシピが所有する
2. 以下にマッチするファイルを除外する: `*-task-prep-*.md`、`_overview-*.md`、`*-phase*-completion.md`、`review-fixes-*.md`、`integration-tests-*-task-*.md`（これらは他のワークフローフェーズに由来する）

本レシピ内で「タスクファイル」と参照する箇所すべて — タスク生成判定フロー、タスク実行サイクルの反復、最終クリーンアップ — はこのセットを使用する。`docs/plans/tasks/*.md` を制限なく glob しない。

### タスク生成判定フロー

Consumed Task Set を確認し、適切な対応を決定する。注: 本セクションに到達するということは、上記の作業計画書の解決（Steps 1-6 が成功）で作業計画書が確定済みであることを意味する。「計画書なし」の状態は作業計画書の解決の Step 7 が既に終了させており、本表には到達しない。

| 状態 | 判定基準 | 次のアクション |
|------|---------|--------------|
| タスク存在 | Consumed Task Set が非空 | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし + `$ARGUMENTS`で計画書指定 | `$ARGUMENTS`が提供され Consumed Task Set が空 | ユーザーに確認 → task-decomposer実行 |
| タスクなし + 計画書を自動解決 | Consumed Task Set が空かつ計画書が自動解決（作業計画書の解決の Step 6 経由）で得られ、backend 信号 ≥1 かつ frontend 信号 = 0 が確認済み | ユーザーに確認 → task-decomposer実行（Step 6 のレイヤー検証で frontend / 不確定な計画は既に除外されているため安全） |

Design Doc から作業計画書がまだない状態で着手したい場合は、先に計画レシピを実行して計画書を生成してから本レシピを再起動する — 上記の作業計画書の解決は意図的に自動生成を行わず、レイヤー判断を明示的に保つ。

## タスク分解フェーズ（条件付き実行）

Consumed Task Set が空の場合：

### 1. ユーザー確認
```
Consumed Task Set にタスクファイルがありません。
作業計画書: docs/plans/[plan-name].md

計画書からタスクを生成しますか？ (y/n):
```

### 2. タスク分解実行（承認時）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画をタスクに分解"
- `prompt`: "作業計画書を読み込み、1コミット粒度の独立したタスクに分解。入力: docs/plans/[plan-name].md。出力: docs/plans/tasks/配下に個別タスクファイル生成。粒度: 1タスク = 1コミット = 独立して実行可能"

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
**必須実行サイクル**: `task-executor → エスカレーションチェック → quality-fixer → commit`

Consumed Task Set 内の各タスクで必須：
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

**責務境界**:
- スコープ内: タスク分解から実装完了まで
- スコープ外: 設計フェーズ、計画フェーズ
