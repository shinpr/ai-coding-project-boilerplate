# Task: [タスク名]

Metadata:
- Dependencies: task-01 -> Deliverable: docs/plans/analysis/research-results.md
- Provides: docs/plans/analysis/api-spec.md（調査・設計タスクの場合）
- Size: 小規模（1-2ファイル）

## Implementation Content
[このタスクで達成すること]
*依存関係の成果物を参照する場合は明記

## Target Files
- [ ] [実装ファイルパス]
- [ ] [テストファイルパス]

## Investigation Targets
実装開始前に読むべきファイル（ファイルパス、任意でサーチヒント付き）:
- [例: src/orders/checkout (processOrder関数) — タスクの性質に基づきタスク分解時に決定]

## Change Category
（タスクがバグ修正・リグレッション・状態変更・境界変更の場合のみ本フィールドを記載する。設定はタスク分解時に行う。それ以外は省略する。）

`Change Category: <bug-fix, regression, state-change, boundary-change のうち該当するものをカンマ区切りで>`

記載がある場合、実装は同一の経路・契約・永続状態・外部境界を共有するケースを、同一クラスの欠陥について走査する（Implementation Steps の Red Phase 参照）。

## Binding Decisions
（作業計画書のADR Bindings表がこのタスクをカバーする場合に本セクションを記載する。それ以外は省略する。）

各行は、このタスクの実装が準拠すべきADR決定である。

| Source | Axis | Decision | Compliance Check |
|---|---|---|---|
| [docs/adr/ADR-XXXX.md (§ <Source Section>) — 対応する作業計画書の行のセクション名（`Decision` または `Implementation Guidance`）に置き換える] | [作業計画書のADR Bindings行から逐語コピーしたAxis値] | [作業計画書のADR Bindings行からコピーしたバインディング決定] | [計画中/最終の実装が決定を満たすかをY/Nで判定できる肯定述語] |

## Reference Contracts
（作業計画書のReference Contract Values表がこのタスクをカバーする場合に本セクションを記載する。それ以外は省略する。）

各行は、このタスクの実装が正確に再現すべきDD由来の観測可能契約である。シリアライズ境界はBoundary Context（作業計画書のConnection Mapから）が、ADR由来の構造的決定は上記のBinding Decisionsが扱う。

| Source | Contract Type | Required Observable Value | Compliance Check |
|---|---|---|---|
| [対応する作業計画書のReference Contract Values行からコピーしたDesign Docパス (§ セクション)] | [作業計画書の行からコピーしたContract Type: structure-order / derived-display / state-lifecycle-negative] | [作業計画書の行から逐語コピーしたRequired Observable Value] | [計画中/最終の実装が値を再現するかをY/Nで判定できる肯定述語] |

## Investigation Notes
（実装観察事項を実装開始前にここへ追記する。Binding Decisionsがある場合、計画した実装アプローチと各Compliance Check結果をここに記録する。）

## Implementation Steps (TDD: Red-Green-Refactor)
### 1. Red Phase
- [ ] 全ての Investigation Targets を読み、主要な所見を記録
- [ ] （Change Category が設定されている場合）同一の経路/契約/状態/境界を共有する隣接ケースを同一クラスの欠陥について走査し、スコープ内で見つかったものを失敗するテストに取り込む
- [ ] Dependencies の成果物を確認（ある場合）
- [ ] 契約定義を確認・作成
- [ ] 失敗するテストを書く
- [ ] テストを実行し失敗を確認

### 2. Green Phase
- [ ] テストをパスする最小限の実装を追加
- [ ] 追加したテストのみ実行しパスを確認

### 3. Refactor Phase
- [ ] コードを改善（テストはパス状態を維持）
- [ ] 追加したテストが引き続きパスすることを確認

## Quality Assurance Mechanisms
（作業計画書ヘッダーより — このタスクの Target Files に該当するメカニズム）
- [ツール/チェック名] — 検証内容: [何を担保するか] — 設定/出典: [パス] — 種別: `executable_check` | `passive_constraint`

## Operation Verification Methods
（作業計画書の Verification Strategy から導出）
- **検証手法**: [何をどう検証するか — 例: 「新実装の出力を src/legacy/order_calc の既存実装と比較」「エンドポイントをテストDBに対して実行しレスポンスがコントラクトに一致することを確認」]
- **成功基準**: [正しさを証明する観察可能な成果 — 例: 「全入力パターンで既存実装と出力が一致」「APIが期待スキーマで200を返す」]
- **失敗時の対応**: [検証失敗時の対処 — 例: 「続行前にアプローチを再評価」「ユーザーにエスカレーション」]
- **検証レベル**: [L1: エンドユーザー機能としての動作確認 / L2: 新規テスト追加・パス / L3: ビルドエラーなし]

## Proof Obligations
（このタスクがカバーするAC・主張・該当する故障モードチェックリストのカテゴリごとに1エントリ。スケルトンの注釈がある場合はそこから、なければACの主要な故障モードまたはマッピングされた故障モードカテゴリから導出する。各テストは主張を証明すること。下記ブロックを主張ごとに繰り返し、見出しにAC ID・主張ID・`Failure Mode: <category>` のいずれかを記載して下流のレビューが主張ごとにカバレッジを解決できるようにする。）

### Obligation: [AC ID・主張ID・故障モードカテゴリのいずれか — 例: `Failure Mode: missing-sort-key ordering`]
- **主張**: [このタスクが証明すべき、ACの振る舞い・主張・故障モード条件]
- **主要な故障モード**: [テストがレッドになるリグレッション]
- **検証する境界**: [テストが通過する公開/統合境界、または "in-process unit"]
- **状態アサーション**: [状態変更を伴う主張では 操作前 → 操作 → 操作後 の観察可能な状態。それ以外は "N/A"]
- **モック境界の根拠**: [どの境界をモックしてよいか、その理由。すべて実物なら "none"]
- **残余**: [この証明で未確立のまま残る事項があれば記載]

## Completion Criteria
- [ ] 追加した全テストがパス
- [ ] Operation Verification Methods に基づく動作確認完了
- [ ] 各 Proof Obligation が満たされている: テストが主要な故障モードでレッドになり、指定された境界を通過する
- [ ] 成果物作成完了（調査・設計タスクの場合）
- [ ] （Binding Decisionsがある場合）全てのCompliance Checkが最終実装に対して`Y`と評価され、根拠（file:line、テスト結果、またはコマンド出力）がInvestigation Notesに記録されている
- [ ] （Reference Contractsがある場合）全てのReference Contract Compliance Checkが最終実装に対して`Y`と評価され、根拠がInvestigation Notesに記録されている

## Notes
- 影響範囲: [変更が波及する可能性のある領域]
- スコープ境界: [変更せず維持するファイル — パスと理由]
