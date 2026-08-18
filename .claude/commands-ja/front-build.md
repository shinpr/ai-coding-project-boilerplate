---
description: 実体化済みフロントエンドタスクファイルを自律実行モードで実行
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、成果物パスの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をバッチ承認とみなす
4. **スコープ**: Consumed Task Set の実行、実装後検証、消費したタスクのクリーンアップ、完了報告を順番に完了する。または、ユーザーが持つ正当な判断のため、現在のフェーズで自律実行を停止する。現在のフェーズで定められた遷移条件を満たした場合にのみ次へ進む。

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
  - テストまたは品質ツールを利用できない場合 → サブエージェントは影響を受けないチェックを実行し、実行できなかった内容を正確に記録する

## タスク実行サイクル（4ステップサイクル）
**必須実行サイクル**: `task-executor-frontend → エスカレーションチェック → quality-fixer-frontend → commit`

Consumed Task Set 内の各タスクで必須：
1. **EXECUTE**: task-executor-frontend を呼び出してタスク実装を実行
2. **実行結果で分岐**:
   - `status: "escalation_needed"` または `"blocked"` → 宣言された境界を確認し、ユーザーが所有するプロダクト、契約、権限、または不可逆な判断が必要な場合にエスカレーションする
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行。実装ステップの `testsAdded` の全パスを `testFile` として、`taskFiles: [現在のタスクファイルパス]`（レビュアがタスクの Operation Verification Methods と Verification Focus を読めるようにする）、`diffBase: HEAD`（この時点でタスクの変更は未コミットのため HEAD がその差分の基点）を渡す。その後 `status` で分岐する
     - `needs_revision` → レビュー裁定を適用し、`apply` の quality-issue オブジェクト一式を逐語で task-executor-frontend に渡して **Fix Mode** でステップ1 に戻る
     - `blocked` → 現在の diff から移動・リネームされたテストパスを解決し、その入力によってレビュー対象が変わる場合は再実行する。`requiresTestReview: true` にもかかわらず読み取り可能な変更テストが存在しない場合は、その executor 出力の欠陥を **Fix Mode** でステップ1 に差し戻す。それ以外はレビューを未実行として `blockingReason` を記録し、ステップ3へ進む
     - `approved` → ステップ3 へ
   - `readyForQualityCheck: true` → ステップ3 へ
3. **QUALITY-FIX**: 未追跡・削除・リネームを含む現在の未コミットのワークツリー全体に対して quality-fixer-frontend を呼び出す。現在の `task_file`、実装ステップの `runnableCheck`、および frontend-technical-spec またはリポジトリの規約が権威ある品質コマンドを示している場合は `qualityCommand` を渡す。その後レスポンスで分岐する:
   - `stub_detected` → ステップ1 に戻り、同じ `task_file` と `incompleteImplementations[]` 配列を入力として task-executor-frontend を **Fix Mode** で再起動
   - `blocked` → quality-fixer-frontend が報告したユーザー判断をエスカレーションする
   - `approved` → ステップ4 へ
4. **承認後にコミット**: 完了したタスクの変更セットをコミットする

**重要**: 全サブエージェントレスポンスのルーティング上の意味を読み取る。quality-fixer-frontend が `approved` を返した後にのみ次のタスクへ進む。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
タスクの成果を、それを担うリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱い、同じ成果に必要な関連ファイルを含める。
割り当てられた進捗フィールドを除き、出典となる成果物は読み取り専用とする。
進行にプロダクト成果、公開契約、主要設計、権限、または不可逆操作に関するユーザー判断が必要な場合はエスカレーションする。
```

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## 実装後検証（全タスク完了後）

全タスクサイクル完了後、完了レポートの前に検証エージェントを**並列実行**:

1. ブランチのupstreamとリポジトリのデフォルトブランチから比較基点を解決し、両方を並列で実行する (Agent tool):
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`、Design Docパス、`code_paths`: merge baseから`HEAD`までの実装ファイルリスト
   - security-reviewer (subagent_type: "security-reviewer") → `governingDocuments: [{"type":"design-doc","path":"[パス]"}]` と実装ファイルリスト

2. **結果の統合** — 合格/不合格の基準はsubagents-orchestration-guideの実装後検証セクション参照。統合検証レポートをユーザーに提示。

3. **修正サイクル**（いずれかの verifier が fail のとき）:
   - 対応可能な各検出事項にレビュー裁定を適用する。`apply` の検出事項オブジェクトは、処理方針のみ付加して逐語で task-executor-frontend に渡す。引用された位置は調査の起点として扱う。
   - 影響パス、観察可能な検証条件、変更していない検出事項オブジェクトを渡して task-executor-frontend を **Fix Mode** で起動する。修正タスクファイルは作成しない。
   - 照合に対応する verifier には `prior_feedback` を引き継ぎ、fail した verifier だけを再実行して、レビュー裁定が収束するまで従う。
   - 修正再レビューが収束した後、quality-fixer-frontend を1回実行する。`approved` なら続行し、`blocked` ならユーザーが判断すべき内容をそのまま提示する。

4. **全て合格** → 最終クリーンアップへ

## 最終クリーンアップ

完了レポートの前に、本レシピが消費した実装タスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- Consumed Task Set 内のすべてのファイルを削除する
- 作業計画書本体（`docs/plans/{plan-name}.md`）は保持する — 最終レビュー後に削除するかはユーザーが判断する

ファイルシステムエラーによってタスクファイルが残った場合は、そのクリーンアップ失敗を記録したうえで完了レポートを続ける。

## 完了レポートコントラクト

最終レポートには以下を含めること:
- タスク実体化のステータス
- 実装したタスク数
- 品質チェック結果（実行できなかったチェックまたは無関係な既存失敗がある場合はそれを含む）
- コミット数
- クリーンアップ結果
- エスカレーションまたはブロッキングの要約（あれば）
