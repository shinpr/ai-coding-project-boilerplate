# Task: [タスク名]

Metadata:
- Source Work Plan Task: [P1-T1 — このタスクが実体化する作業計画書タスクの安定ID]
- Dependencies: none | [作業計画書のタスクID (docs/plans/tasks/{plan-name}-task-NN.md) -> Deliverable: パス。前提タスクが成果物を生む場合]
- Executor lane: backend | frontend
- Rollback boundary: [作業計画書タスクから逐語コピー]

依存関係は、前提タスクを安定IDと、それを収めたタスクファイルの2点で示す。ファイル名の `-task-{NN}` の連番は作業計画書での出現順に従い、`PN-TN` のIDとは独立しているためである。

作業計画書の実体化以外で生成されたタスクファイル（統合テストの追加分）は `Source Work Plan Task: N/A — <生成元>` とし、生成元のフローが executor を既に固定している場合は `Executor lane` を省略する。

## Implementation Outcome

[このタスクが完成させる、リポジトリ上の変更]

## Governing Sources

直接の制約となる引用をすべて作業計画書から変更せずに引き継ぎ、executor が正典の契約を出典で直接読めるようにする。

- [Design Doc パス (§ セクション); AC ID]
- [直接の制約となる場合の UI Spec または ADR パス (§ セクション)]

## Target Files

- [ ] [実装ファイル、または責務を担うディレクトリ]
- [ ] [成果に必要な場合のテストファイル]

## Investigation Targets

実装開始前に読む、最小で代表的なファイル群（ファイルパス、任意でサーチヒント付き）:

- [出典ドキュメントのセクション — 例: docs/design/payment.md (§ 決済フロー)]
- [既存実装 — 例: src/orders/checkout (processOrder関数)]
- [隣接する代表的なテスト]

## Decisions and Unresolved Items

（タスク実体化時に代替案・optionalな挙動・placeholderを解決した場合、または実体化時点で必須の決定が未解決の場合に本セクションを記載する。該当項目がない場合は省略する。）

解決済みの決定 — 実体化が明示的な選択に確定した、各代替案・optionalな挙動・placeholder:

| Item | Decision | Source / Rule |
|---|---|---|
| [代替案・optionalな挙動・placeholder] | [選択した選択肢、またはそれを選ぶ決定的な判断ルール。placeholderの場合は正確な暫定出力・許容される依存・検証の期待値] | [Governing Sources のエントリ、または判断ルールの根拠] |

ブロッキングな未解決項目 — 実体化時点では決定できず実行をブロックする決定。`Kind` が、executor が項目を確定してよいか停止すべきかを決める:

- `implementation-detail` — 開いているのは内部の構成だけ（対象ファイル内での配置、局所的な構造、命名、処理順序）。観測可能な振る舞いは Governing Sources で既に確定している。
- `requirement-decision` — 観測可能な振る舞い、プロダクトのルール、セキュリティ姿勢、互換性保証が未決。問いが「どう作るか」ではなく「システムが何をすべきか」なので、スコープ内のどの選択肢でも確定できない。

| Item | Kind | Required Input | Smallest In-Scope Option | Escalation Condition |
|---|---|---|---|---|
| [未解決の決定] | implementation-detail / requirement-decision | [解決に必要な入力] | [`implementation-detail` の場合: 要求される成果と Governing Sources の全制約を満たす、このタスクの Target Files 内で最小の選択肢。すべてを満たすスコープ内の選択肢がない場合は `none`。`requirement-decision` の場合: `n/a — stop`] | [誰/何にエスカレーションするか、および executor が推測せず停止すべき地点] |

`implementation-detail` の項目では、executor が判断全体をエスカレーションせず適用できるよう Smallest In-Scope Option を記録する。`requirement-decision` の項目では executor が停止する — ここに候補を記録すると、要件が下していない判断を executor に確定させることになる。

## Investigation Notes

- [実装・スコープ・検証を変える事実のみを記録する]

## Implementation Steps

1. Investigation Targets を読み、関連するリポジトリ上の事実を記録する
2. 引用された検証手法が要求する、焦点を絞ったテストを追加または更新する
3. 成果を完成させる最小のリポジトリ変更を実装する
4. 焦点を絞ったチェックがグリーンのまま、同一成果の範囲内でリファクタリングする
5. 下記の Operation Verification Methods を実行する

## Operation Verification Methods

- **検証手法**: [出典の検証手法、またはリポジトリのコマンド]
- **成功基準**: [引用したACに紐づく観察可能な結果]
- **検証レベル**: [L1: エンドユーザー機能としての動作確認 / L2: 新規テスト追加・パス / L3: ビルドエラーなし — implementation-approach スキルに従う]

## Verification Focus

（作業計画書が提供している場合のみ本セクションを記載する。）

- **主要な故障**: [作業計画書から変更せずにコピー]
- **観察チェック**: [作業計画書から変更せずにコピー]

## Completion Criteria

- [ ] 引用した実装成果が完成している
- [ ] 引用したACが満たされている
- [ ] 必要な、焦点を絞ったテストがパス
- [ ] 動作確認が成功している
- [ ] （Verification Focus がある場合）観察チェックが主要な故障を検出する
- [ ] （Decisions and Unresolved Items がある場合）解決済みの各決定が記録どおりに適用され、ブロッキングな未解決項目がすべて解消している — 残っている場合は実行を停止し、その Escalation Condition に従ってエスカレーションする

## Notes

- [実行に関係する情報のみ]
