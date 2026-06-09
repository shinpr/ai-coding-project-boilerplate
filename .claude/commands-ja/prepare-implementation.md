---
description: 実装着手前に readiness を検証しギャップを解消する
---

**コンテキスト**: 作業計画承認と build/implement フェーズの間に挟む任意の readiness フェーズ。実装が Phase 1 から観測可能であることを確認し、ギャップがあれば Phase 0 タスクで解消する。readiness 基準が既に満たされている場合は no-op で終了するため、本レシピは無条件に呼び出しても安全。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全作業をAgentツールでサブエージェントに委譲** — サブエージェント（task-executor / task-executor-frontend / quality-fixer / quality-fixer-frontend）の呼び出し、成果物パスの受け渡し、結果の報告
2. **自己完結スコープ**: ギャップが見つかった場合、本レシピは解消タスクの生成と、subagents-orchestration-guide「標準フロー」で説明される標準4ステップサイクルでの実行の**両方**を行う。readiness基準がパスするか残存ギャップがエスカレーションされた時点でレシピは完了する。
3. **No-op終了**: readinessスキャンで失敗基準がない場合、解消タスクは生成せず、Readiness Report をユーザーに提示して即座に終了する。この no-op 経路ではファイルを変更しない。

作業計画書: $ARGUMENTS

## 適用される条件

build/implement フェーズの前に、以下のいずれかが該当する場合に実行する:
- コードベースにまだ存在しないコマンド・ファイル・関数・エンドポイントを参照する検証戦略を含む Design Doc から、作業計画書が作成された
- 作業計画書にE2Eテストスケルトンが含まれる（seed data、auth fixture、環境変数、または外部モックが未対応の可能性あり）
- 作業計画書がUIコンポーネントに触れるが、それらの視覚状態を描画するfixtureエントリや開発用ルートがない
- ローカルレーンが本機能領域でエンドツーエンドに動作することをチームが事前に確認していない

いずれにも該当しない場合、Step 2のreadinessスキャンで失敗基準はゼロとなり、レシピはno-opで終了する（冒頭の「コンテキスト」参照）。

## Readiness基準

各基準は `pass` / `fail` / `not_applicable` のいずれかを生成する測定可能なチェックで、根拠を引用する。

| ID | 基準 | パスの根拠 |
|----|-----|----------|
| R1 | 検証戦略の参照が解決できる | 作業計画書の検証戦略セクションで参照される全コマンド、ファイルパス、関数、エンドポイント、テストが、コードベースに既存（Glob/Grepで検証）か、本計画内のいずれかのタスクの成果物である |
| R2 | E2E前提条件への対応 | E2Eスケルトンが存在する場合: スケルトンコメントで言及される全前提条件（seed data、auth fixture、env var、外部モック）が、コードベースに存在するか、本計画のPhase 0タスクでカバーされる |
| R3 | Phase 1の観測性 | 最初の実装フェーズに、タスク完了時点で実行可能な「動作検証手法」を持つタスクが少なくとも1つ存在する。当該検証は、タスク開始前に存在する成果物（既存コード、先行のPhase 0成果物、または当該タスク自身の出力）のみで実行できる |
| R4 | UI描画面の存在 | 計画がUIコンポーネントを実装する場合: 影響を受けるコンポーネントを描画するためのfixtureエントリ、開発ルート、Storybookストーリー、またはそれに相当する描画面が存在する、もしくはPhase 0タスクで追加される |
| R5 | ローカルレーンの手順 | 作業計画書または参照先ドキュメントに、手動検証用のローカル環境起動コマンド（起動コマンド、デフォルトポート、seed手順）が記録されている |

R4とR5は、トリガー信号が作業計画書に現れた場合のみ評価する。それ以外は `not_applicable` をマークする。

## 実行前提条件

```bash
# 作業計画書の存在確認
! ls -la docs/plans/*.md | grep -v template | tail -5
```

**状態チェック**:
- 作業計画書が存在する → Step 1へ進む
- 作業計画書がない → 停止して報告: 「承認済みの作業計画書が必要です。先に上流の計画フェーズを完了してから本レシピを再起動してください。」

## 実行フロー

### Step 1: 入力の読み込み

`$ARGUMENTS`で渡された作業計画書のパスを読み込む。以下を抽出する:
- 検証戦略セクション（正しさの証明方法 + 早期検証ポイント）
- 品質保証メカニズム表
- 設計-計画トレーサビリティ表
- 計画書ヘッダで参照されるテストスケルトン
- 各フェーズのタスクを含むフェーズ構成
- 参照されるDesign Doc（複数の場合あり）とUI Spec（存在する場合）

### Step 2: Readinessスキャン

各基準 R1〜R5 について:
1. Readiness基準で定義されたスキャンを Read / Glob / Grep で実行する
2. 結果を記録する: `pass` / `fail` / `not_applicable`
3. 根拠を引用する: `pass`はfile:line、`fail`は未解決の参照、`not_applicable`は不在のトリガー信号

結果に関わらずReadiness Report（出力フォーマット参照）を組み立てる。

### Step 3: No-opチェック

該当する全基準が `pass`（`fail`ゼロ）の場合:
- Readiness Report（下記の出力フォーマット参照）をユーザーに提示する
- `outcome: ready, gaps_resolved: 0` で終了する
- この no-op 経路ではファイルを変更しない

`fail`が1件以上ある場合 → Step 4へ進む。

### Step 4: 解消タスクの計画

各 `fail` 基準について:
1. ギャップを埋める最小単位の具体的タスクを決定する（例: 「ComponentXの loading/empty/error 状態をカバーするfixtureエントリを追加」、「E2Eユーザーfixture用のseedスクリプトを追加」、「ローカル起動コマンドを docs/run/local.md に文書化」）
2. すべての対象ファイルパスを以下のマーカーに照らしてタスクの**レイヤー**を判定する:
   - **backend**: 全対象ファイルパスが `**/api/**`、`**/server/**`、`**/services/**`、`**/backend/**`、`**/handlers/**`、`**/repositories/**` のいずれかにマッチする場合
   - **frontend**: 全対象ファイルパスが `**/components/**`、`**/pages/**`、`**/web/**`、`**/frontend/**`、`**/*.tsx`、`**/*.jsx` のいずれかにマッチする場合
   - **prep-only**（言語/ランタイムに依存しない、機能実装ではない準備系のタスク）: 全対象ファイルパスが `docs/**`、`scripts/**`、`tests/fixtures/**`、`tests/e2e/data/**`、`tests/e2e/fixtures/**`、ルート直下の設定ファイル（`*.json`、`*.yml`、`*.config.*`）のいずれかにマッチする場合。**backend**のexecutor / quality-fixer（`task-executor` + `quality-fixer`）にルーティングする — Reactに固有の関心事を含まないため
   - **mixed**（対象ファイルがbackendとfrontendの両方のマーカーをまたぐ、または機能マーカーとprep-onlyマーカーをまたぐことで実装と準備が同居する）→ ユーザーにエスカレーション。レイヤーごとにタスクを分割するよう依頼する
   - **unrecognized**（上記いずれのマーカーにもマッチしない — 例: プロジェクトが使用する非標準のトップレベルディレクトリ）→ ユーザーにエスカレーション。(a) どのexecutor / quality-fixerが本タスクを実行すべきか判断するか、(b) プロジェクトが異なるパスを使用している場合はマーカーを更新するかを依頼する

   ルールは上記の順で適用する。最初に一致したルールが採用される。`unrecognized` は backend にデフォルトする catch-all ではなく、最後のフォールバックとして機能する。
3. Phase 0タスクファイルを `docs/plans/tasks/{plan-name}-backend-task-prep-{NN}.md`（backend または prep-only）または `docs/plans/tasks/{plan-name}-frontend-task-prep-{NN}.md`（frontend）として、documentation-criteriaスキルのタスクテンプレートで作成する。`-task-prep-`セグメントは本レシピが prep タスクと実装タスクを区別できるようにし、他レシピで使われる `{plan-name}-{layer}-task-*` マッチャーも維持する。prep-only タスクは Step 5 で backend executor にルーティングされるよう `-backend-task-prep-` のファイル名を使用する
4. これらのタスクをPhase 0として（Phase 1の前に）作業計画書に挿入する

提案された解消タスクのリストを AskUserQuestion でユーザーに提示する。明示的な承認後にのみ進める — これは本レシピ内で唯一の人間ゲートである。

### Step 5: 解消タスクの実行

各解消タスクについて、`task-executor → エスカレーションチェック → quality-fixer → commit` の4ステップサイクルを実行する（subagents-orchestration-guide「標準フロー」で定義され、レイヤールーティングは「Layer-Aware Agent Routing」に従う）:

1. **Agentツール** — ファイル名のレイヤーセグメントでルーティング（subagents-orchestration-guideのLayer-Aware Agent Routing表に対応）:
   - `*-backend-task-prep-*` → `subagent_type: "task-executor"`
   - `*-frontend-task-prep-*` → `subagent_type: "task-executor-frontend"`
   - 認識可能なレイヤーセグメントが無いファイル名 → エスカレーション（このファイルは存在し得ない。Step 4が防いでいる）
2. orchestration-guideに従いエスカレーションをチェック
3. **quality-fixer** — 同じファイル名のレイヤーセグメントでルーティング:
   - `*-backend-task-prep-*` → `"quality-fixer"`
   - `*-frontend-task-prep-*` → `"quality-fixer-frontend"`
4. quality-fixer が `approved` を返したら**コミット**

各サブエージェントプロンプトの末尾に下記の「サブエージェントのスコープ境界」ブロックを必ず付与する。

### Step 6: 再スキャン、Phase 0 完了の記録、Readiness Report の提示、クリーンアップ、終了

1. **再スキャン**: 全解消タスクのコミット後、Step 2のreadinessスキャンを再実行する。

2. **作業計画書に Phase 0 完了を記録する**: コミットした各 Phase 0 解消タスクについて、作業計画書の Phase 0 セクションのチェックボックスを `[x]` にし、コミット済みである旨を注記する（` — committed` を付す）。これにより完了結果が計画書に残り、下流の task-decomposer がコミット済みの Phase 0 を再生成・再実行せずスキップできる。

3. **Readiness Report の提示**: Readiness Report（下記の出力フォーマット参照）をユーザーに提示する。レポートはセッション内で提示し、作業計画書には書き込まない — 本レシピの永続的な成果物は、コミット済みの Phase 0 解消タスク（Step 6.2 で計画書に完了として記録）であり、永続化されたレポートではない。

4. **最終クリーンアップ**: 本実行で作成した、現在の `{plan-name}` に該当するprepタスクファイル（`docs/plans/tasks/{plan-name}-backend-task-prep-*.md` および `docs/plans/tasks/{plan-name}-frontend-task-prep-*.md`）と、prepフェーズ用に生成されたフェーズ完了ファイル（`docs/plans/tasks/{plan-name}-phase0-completion.md` が存在する場合。prepタスクはPhase 0に置かれるため）をすべて削除する。他の計画のprepタスクファイルはスコープ外 — 本レシピは現在の実行で作成したものだけを削除する。作業内容はコミット済みで、`docs/plans/`はレシピ実行間で保持しない一時的な作業状態である。作業計画書本体は下流のbuild/implementフェーズのために保持する。

5. **終了**:

   | 再スキャン結果 | アクション |
   |--------------|----------|
   | 該当する全基準が `pass` | `outcome: ready, gaps_resolved: N` と最終Readiness Reportを添えて終了する |
   | `fail` が1件以上残存 | `outcome: escalated` で終了する — 残存する失敗を次のアクションの推奨と共にユーザーに提示する。再スキャンは本レシピにとって終端評価である。さらなる解消には更新された入力でユーザーが本レシピを再起動する必要がある。 |

## サブエージェントのスコープ境界

本レシピから呼び出すサブエージェントプロンプトの末尾に以下のブロックを必ず付与する:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

## 出力フォーマット

レシピ終了時にユーザーに提示する最終レポート:

```
## Implementation Readiness Report

作業計画書: [path]
結果: ready | escalated
解消ギャップ数: [N]

### Readiness基準

| ID | 結果 | 根拠 |
|----|-----|-----|
| R1 | pass / fail / not_applicable | [file:line または "missing: <未解決の参照>"] |
| R2 | ... | ... |
| R3 | ... | ... |
| R4 | ... | ... |
| R5 | ... | ... |

### 実行された解消タスク（gaps_resolved > 0 の場合）
- [タスクファイルパス] — [1行サマリ] — committed
- ...

### 残存ギャップ（outcome が escalated の場合）
- [基準ID]: [未解決の参照] — 次のアクション: [推奨]
```

## 完了基準

- [ ] 作業計画書が読み込まれ、検証戦略 / E2E参照 / フェーズ構成が抽出されている
- [ ] readinessスキャンが実行され、各基準の結果と根拠が記録されている
- [ ] 全`pass`の場合のno-op終了、または解消タスクの生成・承認・4ステップサイクル実行のいずれかが行われている
- [ ] 最後の解消タスクのコミット後に再スキャンが実行されている
- [ ] コミット済みの Phase 0 タスクが作業計画書で `[x]` 完了マークされ、下流の分解でスキップされる
- [ ] prepタスクファイル（および生成された場合のPhase 0フェーズ完了ファイル）が `docs/plans/tasks/` から削除されている
- [ ] 最終レポートがユーザーに提示されている
