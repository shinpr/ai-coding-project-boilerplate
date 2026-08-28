# Task: [タスク名]

Metadata:
- Source Work Plan Task: [P1-T1 — このタスクが実体化する作業計画書タスクの安定ID]
- Dependencies: none | [作業計画書のタスクID (docs/plans/tasks/{plan-name}-task-NN.md) -> Deliverable: パス。前提タスクが成果物を生む場合]
- Executor lane: backend | frontend
- Rollback boundary: [作業計画書タスクから逐語コピー]

依存関係は、前提タスクを安定IDと、それを収めたタスクファイルの2点で示す。ファイル名の `-task-{NN}` の連番は作業計画書での出現順に従い、`PN-TN` のIDとは独立しているためである。

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

## Notes

- [実行に関係する情報のみ]
