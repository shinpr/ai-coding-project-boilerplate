---
description: 生成済みのタスクファイルを自律実行モードで実装
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

## オーケストレーター定義

**コアアイデンティティ**: 「私は作業者ではない。オーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェントの呼び出し、データの受け渡し、結果の報告（許可ツール: subagents-orchestration-guideスキル「オーケストレーターの許可ツール」参照）
2. **4ステップサイクルに厳密に従う**: task-executor → エスカレーションチェック → quality-fixer → commit
3. **自律実行モード移行**: ユーザーの実行指示とタスクファイルの存在をバッチ承認とみなす
4. **スコープ**: Consumed Task Setの実行、実装後レビュー、処理したタスクのクリーンアップ、完了報告を順番に完了する。または、確認済みの成果・将来状態の要件・対象外のどれを変更するかという選択や不可逆な操作の承認が必要な場合は、現在のフェーズで自律実行を停止する。現在のフェーズで定められた遷移条件を満たした場合にのみ次へ進む。

**重要**: 全てのコミット前にquality-fixerを実行。

作業計画書: $ARGUMENTS

## 実行前提条件

### 作業計画書の解決

タスク処理の前に、作業計画書を特定する。

**`$ARGUMENTS`が指定されている場合**は、それがユーザーから渡された作業計画書のパスである。自動解決を行わずそのまま使用する。`{plan-name}`はファイル名から `.md` 拡張子（および末尾に `-plan` がある場合はそれも）を除いて抽出する。

**`$ARGUMENTS`が空の場合**、タスクファイルから自動解決する:
1. `docs/plans/tasks/`内で本レシピの処理対象パターンに一致するタスクファイルを列挙する（subagents-orchestration-guideの「Layer-Aware Agent Routing」で `task-executor` を経由するルートに対応）:
   - `{plan-name}-task-*.md`（単層タスク。ルーティング表により backend 予約）
   - `{plan-name}-backend-task-*.md`（複層計画の backend 部分）
   - `{plan-name}-frontend-task-*.md` は本レシピの処理対象外 — `task-executor-frontend` にルーティングされ、frontend build レシピが所有する
2. マッチしたファイルから、以下のいずれかにマッチするものを除外する。これらは本実行の実装タスクではなく、他のワークフローフェーズに由来する: `integration-tests-*-task-*.md`（統合テスト追加用スキャフォールディング）
3. 残った各ファイルから、末尾の `-task-{NN}.md` または `-backend-task-{NN}.md` を取り除いて `{plan-name}` を抽出する
4. 少なくとも1つのタスクファイルがマッチした場合、最も新しい mtime を持つ `{plan-name}` の `docs/plans/{plan-name}.md` を作業計画書とする。タイは辞書順最大の `{plan-name}` で解決する
5. **処理対象パターンが何もマッチせず、`docs/plans/tasks/`に `*-frontend-task-*.md` が存在する場合**: 停止してユーザーに報告する: 「frontend 命名のタスクファイルしか見つかりませんでした。frontend build レシピを実行する意図であればそちらに切り替えてください。計画が backend ならば、作業計画書の該当タスクエントリを `Executor lane: backend` に修正してタスクファイルを再生成するか、作業計画書のパスを `$ARGUMENTS` で指定してください。」ファイル名は計画書が宣言した lane に従うため、タスクファイル生成を再実行するだけではファイル名は変わらない。
6. 処理対象パターンも `*-frontend-task-*.md` も見つからない場合、`docs/plans/`の最も新しい mtime の非テンプレート `.md` を読み、各タスクエントリが宣言する `Executor lane` から判定する:
   - 全タスクが `backend` → backend 計画とみなして進む
   - `frontend` のタスクが1つでもある、または lane を持たないタスクがある → 停止して報告する: 「最も新しい作業計画書 `[path]` が backend 計画であることを、タスクの `Executor lane` から確認できません。意図する backend 計画書のパスを `$ARGUMENTS` で指定するか、task-decomposer を実行して `docs/plans/tasks/` に backend 命名のタスクファイルを出力してください。」
7. `docs/plans/`に計画書が一切存在しない場合は、停止して報告する: 「作業計画書が見つかりません。作業計画書のパスを `$ARGUMENTS` で指定するか、計画フェーズを先に完了してください。」

### Consumed Task Set

本実行の **Consumed Task Set** を計算する — 本レシピが所有・実行・後で削除するファイルの集合。作業計画書の解決と同じ処理対象パターンを使用する:

1. 作業計画書の解決で確定した `{plan-name}` について、`docs/plans/tasks/`内で `{plan-name}-task-*.md` または `{plan-name}-backend-task-*.md` にマッチするタスクファイルを列挙する。`{plan-name}-frontend-task-*.md` は除外する — frontend build レシピが所有する
2. 以下にマッチするファイルを除外する: `integration-tests-*-task-*.md`（他のワークフローフェーズに由来する）

本レシピ内で「タスクファイル」と参照する箇所すべて — タスク生成判定フロー、タスク実行サイクルの反復、最終クリーンアップ — はこのセットを使用する。`docs/plans/tasks/*.md` を制限なく glob しない。

### タスク生成判定フロー

Consumed Task Set を確認し、適切な対応を決定する。注: 本セクションに到達するということは、上記の作業計画書の解決（Steps 1-6 が成功）で作業計画書が確定済みであることを意味する。「計画書なし」の状態は作業計画書の解決の Step 7 が既に終了させており、本表には到達しない。

| 状態 | 判定基準 | 次のアクション |
|------|---------|--------------|
| タスク存在 | Consumed Task Set が非空 | ユーザーの実行指示をバッチ承認として自律実行へ移行 |
| タスクなし + `$ARGUMENTS`で計画書指定 | `$ARGUMENTS`が提供され Consumed Task Set が空 | ユーザーに確認 → task-decomposer実行 |
| タスクなし + 計画書を自動解決 | Consumed Task Set が空かつ計画書が自動解決（作業計画書の解決の Step 6 経由）で得られ、全タスクが `Executor lane: backend` を宣言していると確認済み | ユーザーに確認 → task-decomposer実行（Step 6 で frontend / lane 未宣言の計画は既に除外されているため安全） |

Design Doc から作業計画書がまだない状態で着手したい場合は、先に計画レシピを実行して計画書を生成してから本レシピを再起動する — 上記の作業計画書の解決は意図的に自動生成を行わず、レイヤー判断を明示的に保つ。

## タスクファイル生成フェーズ（条件付き実行）

Consumed Task Set が空の場合：

### 1. ユーザー確認
```
Consumed Task Set にタスクファイルがありません。
作業計画書: docs/plans/[plan-name].md

計画書からタスクを生成しますか？ (y/n):
```

### 2. タスクファイルの生成（承認時）
Agentツールでtask-decomposerを呼び出す:
- `subagent_type`: "task-decomposer"
- `description`: "作業計画書からタスクファイルを生成"
- `prompt`: "docs/plans/[plan-name].md の作業計画書を読み込み、実装項目ごとに1コミット粒度のタスクファイル1つを docs/plans/tasks/ 配下に出力する。各ファイル名はその項目の Executor lane から選ぶ。"

### 3. 生成確認
上記「Consumed Task Set」セクションの制限パターンを使って Consumed Task Set を再計算し、非空であることを確認する。依然として空の場合はユーザーにエスカレーション — task-decomposer がエラーを出さずに失敗したか、想定パターンに合致しないファイルを生成した可能性がある。

**フロー**: タスク生成 → Consumed Task Set 再計算 → 自律実行（この順序）

## 実行前チェックリスト

- [ ] Consumed Task Set が非空であることを確認（上記「Consumed Task Set」セクションで計算）
- [ ] Consumed Task Set 内のタスク実行順序（依存関係）を特定
- [ ] **環境チェック**: タスク単位のコミットサイクルを実行可能か？
  - コミット機能が利用不可 → 自律実行モード前に専門エージェントの結果の受理を適用
  - テストまたは品質ツールを利用できない場合 → サブエージェントは影響を受けないチェックを実行し、実行できなかった内容を正確に記録する

## タスク実行サイクル（4ステップサイクル）
**必須実行サイクル**: `task-executor → エスカレーションチェック → quality-fixer → commit`

Consumed Task Set 内の各タスクで必須：
1. **EXECUTE**: task-executor を呼び出してタスク実装を実行（レイヤー横断 の場合は subagents-orchestration-guide の レイヤー別エージェントルーティング 参照）
2. **実行結果で分岐**:
   - `status: "escalation_needed"` または `"blocked"` → subagents-orchestration-guideの「専門エージェントの結果の受理」を適用する
   - `requiresTestReview` が `true` → **integration-test-reviewer** を実行。実装ステップの `testsAdded` の全パスを `testFile` として、`taskFiles: [現在のタスクファイルパス]`（レビュアーがタスクの Operation Verification Methods と Verification Focus を読めるようにする）、`diffBase: HEAD`（この時点でタスクの変更は未コミットのため HEAD がその差分の基点）を渡す。その後 `status` で分岐する
     - `needs_revision` → レビュー対応を適用し、同じ`task_file`に、`apply`のquality-issueオブジェクト一式を`correction_findings`として逐語で加えてステップ1に戻る
     - `blocked` → 現在のdiffから移動・リネームされたテストパスを解決し、その入力によってレビュー対象が変わる場合は再実行する。`requiresTestReview: true`にもかかわらず読み取り可能な変更テストが存在しない場合は、そのexecutor出力の欠陥を`correction_findings`としてステップ1に差し戻す。それ以外はレビューを未実行として`blockingReason`を記録し、ステップ3へ進む
     - `approved` → ステップ3 へ
   - `readyForQualityCheck: true` → ステップ3 へ
3. **QUALITY-FIX**: 未追跡・削除・リネームを含む現在の未コミットのワークツリー全体に対して quality-fixer を呼び出す（レイヤー横断の場合は レイヤー別エージェントルーティング 参照）。現在の `task_file`、実装ステップの `runnableCheck`、および technical-spec またはリポジトリの規約が正となる品質コマンドを定めている場合は `qualityCommand` を渡す。その後レスポンスで分岐する:
   - `stub_detected` → ステップ1に戻り、同じ`task_file`と`incompleteImplementations[]`配列を渡してtask-executorを再実行する
   - `blocked` → 専門エージェントの結果の受理を適用する
   - `verification_incomplete` → 結果を省略せず最終再試行まで保持し、ステップ4へ進む
   - `approved` → ステップ4 へ
4. **コミット**: `approved`または`verification_incomplete`の後に、完了したタスクの変更セットをコミットする

**重要**: 全サブエージェントレスポンスのルーティング上の意味を読み取る。ステップ4の後に次のタスクへ進み、`verification_incomplete`の結果は最終再試行まで保持する。

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
サブエージェントのスコープ境界:
タスクの成果を、それを担うリポジトリ上の責務全体で整合する形で完成させる。
参照されたパスは調査の起点として扱い、同じ成果に必要な関連ファイルを含める。
割り当てられた進捗フィールドを除き、正典となる成果物は読み取り専用とする。
確認済みの成果、将来状態の要件、対象外を同時には維持できない場合は要件変更検知へ戻る。不可逆な外部操作が必要な場合は承認を求める。
```

承認確認後、自律実行モードを開始。要件変更を検知した場合は即座に停止。

## 実装後レビュー（全タスク完了後）

実装後レビュアーを呼び出す前に、subagents-orchestration-guideの「専門エージェントの結果の受理」にある証明不足の再試行を適用する。各結果を解消または保持した後にレビューへ進み、再試行後も残る証明不足だけを完了報告に含める。

作業計画書が参照する読み込み可能なDesign Docを解決する。入力が不足している場合はレビューをブロックする。

次のAgent呼び出しを1つのassistantメッセージで行い、両方を待つ。
- code-reviewer (subagent_type: "code-reviewer") → 型付きの`governingDocuments`、完了したタスクで実際に変更したファイルを`implementationFiles`、作業計画書のパスを渡して、完了した実装をレビューする
- security-reviewer (subagent_type: "security-reviewer") → 同じ型付き`governingDocuments`に照らして、完了した実装をレビューする

subagents-orchestration-guideの実装後レビューにあるステータスのルーティングと、修正・再実行の規則を適用する。統合レポートを提示し、すべてのレビュー結果がレビュー対応の収束条件に達した後、最終クリーンアップへ進む。

## 最終クリーンアップ

完了レポートの前に、本レシピが処理した実装タスクファイルを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である:

- Consumed Task Set 内のすべてのファイルを削除する
- 作業計画書本体（`docs/plans/{plan-name}.md`）は保持する — 最終レビュー後に削除するかはユーザーが判断する

ファイルシステムエラーによってタスクファイルが残った場合は、そのクリーンアップ失敗を記録したうえで完了レポートを続ける。

## 完了レポートコントラクト

最終レポートには以下を含めること:
- タスクファイル生成のステータス
- 実装したタスク数
- 品質チェック結果（実行できなかったチェックまたは無関係な既存失敗がある場合はそれを含む）
- 最終再試行後も残った証明不足
- コミット数
- クリーンアップ結果
- エスカレーションまたはブロッキングの要約（あれば）

**責務境界**:
- スコープ内: タスクファイル生成から実装完了まで
- スコープ外: 設計フェーズ、計画フェーズ
