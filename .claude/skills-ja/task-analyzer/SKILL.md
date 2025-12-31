---
name: task-analyzer
description: タスクの本質を分析し適切なスキルを選択。規模見積もりとメタデータを返却。タスク開始時、スキル選択時に使用。
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

### 2. タスク規模の見積もり

| 規模 | ファイル数 | 指標 |
|------|----------|------|
| 小規模 | 1-2 | 単一の関数/コンポーネントの変更 |
| 中規模 | 3-5 | 複数の関連コンポーネント |
| 大規模 | 6以上 | 横断的関心事、アーキテクチャへの影響 |

**規模がスキル優先度に影響：**
- 大規模 → プロセス/ドキュメントスキルがより重要
- 小規模 → 実装スキルに集中

### 3. タスクタイプの特定

| タイプ | 特徴 | キースキル |
|--------|------|-----------|
| 実装 | 新規コード、機能 | coding-standards, typescript-testing |
| 修正 | バグ解決 | coding-standards, typescript-testing |
| リファクタリング | 構造改善 | coding-standards, implementation-approach |
| 設計 | アーキテクチャ決定 | documentation-criteria, implementation-approach |
| 品質 | テスト、レビュー | typescript-testing, integration-e2e-testing |

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
  type: <implementation|fix|refactoring|design|quality>
  scale: <small|medium|large>
  estimatedFiles: <number>
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

## スキル選択の優先順位

1. **必須** - タスクタイプに直接関連
2. **品質** - テストと品質保証
3. **プロセス** - ワークフローとドキュメント
4. **補助** - リファレンスとベストプラクティス

## メタ認知質問の設計

タスクの性質に応じて3-5個の質問を生成：

| タスクタイプ | 質問の焦点 |
|-------------|-----------|
| 実装 | 設計の妥当性、エッジケース、パフォーマンス |
| 修正 | 根本原因（5 Whys）、影響範囲、回帰テスト |
| リファクタリング | 現状の問題、目標状態、段階的計画 |
| 設計 | 要件の明確性、将来の拡張性、トレードオフ |

## 警告パターン

これらのパターンを検出してフラグを立てる：

| パターン | 警告 | 緩和策 |
|---------|------|--------|
| 一度に大規模変更 | 高リスク | フェーズに分割 |
| テストなしの実装 | 品質リスク | TDDに従う |
| エラー発見時の即座の修正 | 根本原因の見落とし | 一時停止、分析 |
| 計画なしのコーディング | スコープクリープ | まず計画 |
