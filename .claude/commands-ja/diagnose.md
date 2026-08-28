---
description: 問題を調査し、検証を経て解決策を導出する
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

Agentプロンプト・ハンドオフ・生成物を書く前に、`llm-friendly-context`スキル（Skillツール使用）を実行する。

**コマンドコンテキスト**: 問題の障害点を特定し、解決策を提示するための診断フロー

対象問題: $ARGUMENTS

**Role**: オーケストレーター

**実行方法**:
- 調査 → investigatorに委譲
- 検証 → verifierに委譲
- 解決策導出 → solverに委譲

オーケストレーターがサブエージェントを呼び出し、構造化JSONを受け渡す。

**実行ゲート**: 以下の各ステップは、次の判断に必要なエビデンスを確立する。必要な調査・検証の再試行を含めてステップ0-6を順番に完了する。現在のステップで定められた品質条件またはカバレッジ条件を満たした場合にのみ次へ進み、カバレッジが閉じた後にのみsolverを呼び出す。

## ステップ0: 問題の構造化（investigator呼び出し前）

### 0.1 問題タイプの判定

| タイプ | 判断基準 |
|--------|---------|
| 変更失敗 | 問題発生の前に何らかの変更があったことが示唆されている |
| 新規発見 | 変更との関連が示唆されていない |

判断に迷う場合は「問題発生の直前に何か変更しましたか？」とユーザーに確認。

### 0.2 変更失敗の場合の情報補完

以下が不明な場合、**AskUserQuestionで質問**してから次に進む：
- 何を変更したか（原因変更）
- 何が壊れたか（影響箇所）
- 両者の関係（共通コンポーネント等）

### 0.3 問題の本質理解

Agentツールでrule-advisorを呼び出す:
- `subagent_type`: "rule-advisor"
- `description`: "問題の本質特定"
- `prompt`: "以下の問題について、本質と必要なスキルを特定してください: [ユーザーが報告した問題]"

rule-advisorの出力から以下を確認：
- `taskAnalysis.mainFocus`: 問題の主要な焦点
- `mandatoryChecks.taskEssence`: 表面的な症状でなく根本的な問題
- `selectedSkills`: 適用すべきスキルセクション
- `warningPatterns`: 回避すべきパターン

### 0.4 investigatorプロンプトへの反映

**以下をinvestigatorプロンプトに含める**：
1. 問題の本質（taskEssence）
2. 適用すべきスキルの要約（selectedSkillsから重要なセクション）
3. 調査観点（investigationFocus）: warningPatternsを「この問題の調査で混同・見落としやすいポイント」に変換したもの
4. **変更失敗の場合、追加で以下を含める**：
   - 原因変更の内容を詳細に分析
   - 原因変更と影響箇所の共通点を特定
   - 原因変更が正しい修正か新たなバグかを判定し、判定結果に基づいて比較基準を選択

## 診断フロー概要

```
問題 → investigator → verifier → solver ─┐
                 ↑                        │
                 └── カバレッジ不十分 ────┘
                      (最大2回)

カバレッジ十分 → レポート
```

**コンテキスト分離**: 各ステップには構造化JSON出力のみを渡す。思考過程は引き継がない。

## 実行ステップ

### ステップ1: 調査（investigator）

Agentツールでinvestigatorを呼び出す:
- `subagent_type`: "investigator"
- `description`: "問題情報の収集"
- `prompt`: |
    以下の現象について、関連する情報を網羅的に収集してください。

    現象: [ユーザーが報告した問題]

    問題の本質: [ステップ0.3のtaskEssence]
    調査観点: [ステップ0.4のinvestigationFocus]

    [変更失敗の場合、追加で以下を含める:]
    変更内容: [何を変更したか]
    影響箇所: [何が壊れたか]
    共通コンポーネント: [原因変更と影響箇所の共通点]

**期待される出力**: pathMap（症状ごとの実行パス）、failurePoints（各ノードで発見された障害点）、障害点ごとのimpactAnalysis、未探索領域のリスト、調査の限界

### ステップ2: 調査品質判定

調査出力を確認：

**品質チェック**（出力JSONに以下が含まれているか）:
- [ ] `pathMap`が少なくとも1つの症状を含み、各症状に少なくとも1つのパスとノードが列挙されている
- [ ] 各障害点に`location`、`upstreamDependency`、`symptomExplained`、`causalChain`（停止条件に到達）、`checkStatus`、具体的なファイルや場所を引用した`source`を持つ`evidence`が含まれている
- [ ] 各障害点に`comparisonAnalysis`が含まれている（normalImplementationが見つかった、または明示的にnull）
- [ ] 各障害点の`causeCategory`が以下のいずれか: typo / logic_error / missing_constraint / design_gap / external_factor
- [ ] `investigationSources`が少なくとも3つの異なるソースタイプ（code, history, dependency, config, document, external）をカバー
- [ ] ステップ0.4で提供した`investigationFocus`の項目が調査に含まれている
- [ ] マッピングされたパス上の全ノードがチェック済み（最初の障害点発見後にパスが放棄されていない）

**品質不足の場合**: 不足項目を明示してinvestigatorを再実行:
- `prompt`: |
    以下の不足点に焦点を当てて再調査してください:
    - 不足: [品質チェックから具体的な不足項目を列挙]

    前回の調査結果（コンテキスト用、調査済み領域の再調査は不要）:
    [前回の調査JSON]

品質を満たしたらverifierに進む。

### ステップ3: 検証（verifier）

Agentツールでverifierを呼び出す:
- `subagent_type`: "verifier"
- `description`: "調査結果の検証"
- `prompt`: "以下の調査結果を検証してください。調査結果: [調査のJSON出力]"

**期待される出力**: カバレッジチェック（未探索パス、未チェックノード）、障害点ごとのDevil's Advocate評価、finalStatusを含む障害点評価、カバレッジ評価（`coverageAssessment`）

**カバレッジの判定基準**:
- **十分（`sufficient`）**: 主要パスが追跡済み、全重要ノードがチェック済み、各障害点が個別に評価済み
- **部分的（`partial`）**: 主要パスは追跡済みだが、一部ノードが未チェックまたは一部障害点がblocked/not_reached
- **不十分（`insufficient`）**: 重要なパスが未追跡、または重要ノードが未調査

### ステップ4: カバレッジゲート

verifierのカバレッジ評価（`coverageAssessment`）を確認:

- **十分** → ステップ5（solver）へ進む
- **部分的または不十分** → verifierが特定した未チェック領域を調査対象としてステップ1に戻る
  - 追加調査は最大2回まで
  - 2回の追加調査後もsufficientに到達しない場合、ユーザーに選択肢を提示：
    - 追加調査を継続
    - 現在のカバレッジレベルでsolverに進む（不完全な診断のリスクをユーザーが承認）

### ステップ5: 解決策導出（solver）

**前提**: カバレッジ評価が十分（`coverageAssessment=sufficient`）、または部分的/不十分でのユーザー承認

所有範囲、契約、技術設計の修正は、確認済みの成果、将来状態の要件、対象外を維持できる場合、通常の解決策候補として扱う。design gapを検出しただけでユーザー判断にはしない。これらを同時には維持できないことをエビデンスが示す場合、または解決策に不可逆な外部操作の承認が必要な場合は、選択肢を捏造せず、解決策のエビデンスとともにその境界を具体的に報告する。

Agentツールでsolverを呼び出す:
- `subagent_type`: "solver"
- `description`: "解決策の導出"
- `prompt`: |
    以下の検証済み障害点に基づいて、解決策を導出してください。

    確認済み障害点: [verifierのconclusion.confirmedFailurePoints]
    反証済み障害点: [verifierのconclusion.refutedFailurePoints]
    障害点の関係性: [verifierのconclusion.failurePointRelationships]
    影響分析: [investigatorのimpactAnalysis]
    カバレッジ評価: [sufficient/partial/insufficient]

**期待される出力**: 検証済みの原因から導いた、実質的に異なる実行可能な解決策、トレードオフ分析、推奨案と実装ステップ、残存リスク

### ステップ6: 最終レポート作成

**前提**: solver完了（ステップ5）

診断完了後、以下の形式でユーザーに報告：

```
## 診断結果サマリー

### 特定された障害点
[検証結果の確認済み障害点]
- 障害点ごと: location、symptomExplained、finalStatus

### 検証プロセス
- パスカバレッジ: [追跡したパスとチェックしたノード]
- 追加調査回数: [0/1/2回]
- カバレッジ評価: [sufficient/partial/insufficient]

### 推奨する解決策
[解決策導出の推奨案]

理由: [選定理由]

### 実装ステップ
1. [ステップ1]
2. [ステップ2]
...

### 代替案
[代替案の説明]

### 残存リスク
[solverのresidualRisks]

### 解決後の確認事項
- [確認事項1]
- [確認事項2]
```

## 完了条件

- [ ] investigatorを実行し、pathMap・failurePoints・impactAnalysisを取得した
- [ ] 調査品質チェックを行い、不足があれば再実行した
- [ ] verifierを実行し、coverageAssessmentを取得した
- [ ] solverを実行した
- [ ] coverageAssessment=sufficientを達成した（または2回の追加調査後にユーザー承認を得た）
- [ ] 最終レポートをユーザーに提示した
