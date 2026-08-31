---
name: task-analyzer
description: タスクの意図、変更リスク、実行規模を分類し、プロジェクトのスキルインデックスからスキルを選択。作業開始、タスクの振り分け、スコープ見積もり、スキル選択時に使用。
---

# タスクアナライザー

メタ認知的タスク分析とスキル選択ガイダンスを提供。

## スキルインデックス

利用可能なスキルのメタデータは **[skills-index.yaml](references/skills-index.yaml)** を参照。

## タスク分析プロセス

### 1. タスク本質の理解

表面的な作業を超えた根本目的を特定：

| 表面的な作業 | 根本目的 |
|-------------|---------|
| 「このバグを直して」 | 問題解決、根本原因分析 |
| 「この機能を実装して」 | 機能追加、価値提供 |
| 「このコードをリファクタリングして」 | 品質改善、保守性向上 |
| 「このファイルを更新して」 | 変更管理、一貫性確保 |

**キーとなる質問：**
- 本当に解決しようとしている問題は何か？
- 期待される成果は何か？
- 表面的にアプローチした場合、何が問題になり得るか？

### 2. 構造スケールの見積もり

意図された成果と責務境界から判断負荷を分類する。ファイル数は補助的なエビデンスにとどまる。

| スケール | 判断負荷 |
|---------|---------|
| 小規模 | まとまった成果が1つで、1つの責務境界の中にリポジトリが支持する明白な実装が1つあり、未解決の持続的な選択がない |
| 中規模 | まとまった成果が1つで、境界をまたいだ調整を伴うか、持続的になりうる選択を含む |
| 大規模 | 独立して価値を持つ成果が複数あり、それぞれ別個の設計判断を要する |

レイヤーをまたぐ実装であっても、まとまった成果1つに資する場合は中規模のままでよい。documentation-criteria のADR両フィルタを通過する決定ポイントがある場合、スケールは最低でも中規模に引き上げられる。成果と境界の分類を成立させたエビデンスを`scaleRationale`に記録する。

**規模がスキル優先度に影響：**
- 大規模 → プロセス/ドキュメントスキルがより重要
- 小規模 → 実装スキルに集中

### 3. タスクタイプの特定

| タイプ | 特徴 | キースキル |
|--------|------|-----------|
| implementation | 新規コードまたはユーザーに見える振る舞い | coding-standards, typescript-testing |
| fix | 不具合またはリグレッションの解消 | coding-standards, typescript-testing |
| refactoring | 振る舞いを保った構造改善 | coding-standards, implementation-approach |
| design | アーキテクチャまたは契約の判断 | documentation-criteria, implementation-approach |
| quality | テスト、レビュー、検証 | typescript-testing, integration-e2e-testing |
| documentation | PRD、ADR、Design Doc、UI Spec、計画書、指示文 | documentation-criteria |
| investigation | 実装を伴わない根拠収集 | project-contextとindexから選んだドメインスキル |
| migration | データ、schema、API、依存、runtimeの移行 | implementation-approach, documentation-criteria |
| operations | 環境、デプロイ、runtimeの運用 | technical-specとindexから選んだドメインスキル |
| security | セキュリティ設計またはレビュー | coding-standardsと実装ドメインのスキル |
| skill | スキル作成、プロンプト品質レビュー、スキルmetadata変更 | skill-optimization, llm-friendly-context |

複数のtypeに該当する場合は、依頼された成果を担うtypeをprimaryとし、残りを`secondaryTypes`に記録する。

### 4. タグベースのスキルマッチング

タスク説明から関連タグを抽出し、skills-index.yamlとマッチング：

```yaml
Task: "Implement user authentication with tests"
Extracted tags: [implementation, testing, security]
Matched skills:
  - coding-standards (implementation, security)
  - typescript-testing (testing)
  - typescript-rules (implementation)
```

### 5. 暗黙的な関連性

隠れた依存関係を考慮：

| タスクに含まれる | 追加で含める |
|-----------------|-------------|
| エラーハンドリング | デバッグ、テスト |
| 新機能 | 設計、実装、ドキュメント |
| パフォーマンス | プロファイリング、最適化、テスト |
| フロントエンド | typescript-rules, typescript-testing |
| API/統合 | integration-e2e-testing |

## 出力形式

skills-index.yamlからのスキルメタデータを含む構造化された分析を返却：

```yaml
taskAnalysis:
  essence: <string>  # 特定された根本目的
  type: <implementation|fix|refactoring|design|quality|documentation|investigation|migration|operations|security|skill>
  secondaryTypes: [<task-type>, ...]
  scale: <small|medium|large>
  estimatedFiles: <number または unknown>  # 補助的なエビデンスのみ
  scaleRationale:
    decidingAxis: <outcomes|responsibility-boundaries|durable-choice>
    evidence: <string>
  tags: [<string>, ...]  # タスク説明から抽出

selectedSkills:
  - skill: <skill-name>  # skills-index.yamlから
    priority: <high|medium|low>
    reason: <string>  # このスキルが選択された理由
    # skills-index.yamlからメタデータを引き継ぐ
    tags: [...]
    typical-use: <string>
    size: <small|medium|large>
    sections: [...]  # yamlからの全セクション（フィルタなし）
```

**注意**: セクション選択（どのセクションが関連するかの選定）は、実際のSKILL.mdファイルを読み込んだ後に別途行う。

## プロセスゲート

1. **意図ゲート**: `essence`、primary `type`、該当する`secondaryTypes`を記録したら規模見積もりへ進む。依頼された成果が曖昧な場合は、必要な成果判断を具体的に記録する。
2. **規模ゲート**: 構造スケールを判断できるだけの成果と責務境界の根拠が揃い、`scaleRationale`に決定軸が示されたらスキル照合へ進む。
3. **選択ゲート**: 選択したスキルがすべて`skills-index.yaml`に存在し、タスクに結び付いた理由があり、metadataを作り出さずそのまま転記できた場合に確定する。

不明点が成果の境界・ADRの適格性・必要なワークフローを変えうる場合は、必要なリポジトリ内の根拠またはユーザー判断を具体的に求める。ファイル数が不明であることだけでは構造スケールの判断は妨げられない。

## スキル選択の優先順位

1. **必須** - タスクタイプに直接関連
2. **品質** - テストと品質保証
3. **プロセス** - ワークフローとドキュメント
4. **補助** - タスクに直接関係する追加の制約または根拠

## メタ認知質問の設計

意図の分類、規模、選択するskill、必須制約、検証方法のいずれかを変え得る質問だけを生成する。リポジトリ内の根拠ですでに解決している場合は質問を返さない。各質問について、それが制御する判断を記録する。

| タスクタイプ | 質問の焦点 |
|-------------|-----------|
| implementation | 設計の妥当性、エッジケース、パフォーマンス |
| fix | 根本原因（5 Whys）、影響範囲、回帰テスト |
| refactoring | 現状の問題、目標状態、段階的計画 |
| design | 要件の明確性、トレードオフ |
| documentation | 読み手、正規の情報源、承認・利用側の契約 |
| investigation | 解決する主張、根拠の境界、停止条件 |
| migration | 互換期間、データ・契約の移行、ロールバック |
| operations | 対象環境、権限境界、復旧の証跡 |
| security | 信頼境界、保護対象、脅威の発生源、リスク受容の決定権者 |
| skill | 発火させる意図、単独実行に必要なコンテキスト、出力の利用側 |

## 警告パターン

これらのパターンを検出してフラグを立てる：

| パターン | 警告 | 緩和策 |
|---------|------|--------|
| 1つのステップに独立して検証可能な成果が複数ある | 移行とロールバックのリスク | 観測可能な検証境界で分割 |
| 振る舞いの変更にテストまたは明記された実行可能な検証がない | リグレッションの証跡がない | 変更した契約を観測できる最も低コストなチェックを追加 |
| 修正案と失敗の間に観測済みの因果関係がない | 根本原因が推測のまま | 修正を選ぶ前に再現証跡と最初の因果境界を記録 |
| 中規模・大規模の実装に規模上必要な計画成果物がない | スコープと依存の契約がない | 実装を振り分ける前に必要な成果物を作成 |
