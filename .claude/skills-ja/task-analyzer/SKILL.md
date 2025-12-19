---
name: task-analyzer
description: メタ認知的タスク分析とスキル選択。タスクの本質を分析し、規模を見積もり、適切なスキルをメタデータと共に返却。
---

# タスクアナライザー - メタ認知的分析フレームワーク

## 目的

受け取ったタスクの本質を分析し、以下を決定：
1. 作業規模の判定（小規模/中規模/大規模）
2. 適用するスキルの特定
3. 潜在的な失敗パターンの認識
4. 初動アクションのガイダンス提供

## 分析フレームワーク

### タスク本質の抽出

タスクを受け取った際に分析：

```yaml
taskEssence:
  surfaceRequest: "[ユーザーが文字通り求めたこと]"
  underlyingGoal: "[ユーザーが実際に達成したいこと]"
  implicitRequirements: "[明示されていないが暗黙の要件]"
  scaleDetermination:
    fileCount: "[変更予定ファイル数]"
    scale: "small|medium|large"
    confidence: "high|medium|low"
```

### 規模判定基準

| 規模 | ファイル数 | 特徴 |
|------|----------|-----|
| 小規模 | 1-2ファイル | 単一責務の変更、局所的な影響 |
| 中規模 | 3-5ファイル | コンポーネント横断の変更、調整が必要 |
| 大規模 | 6ファイル以上 | システム全体への影響、ドキュメントが必要 |

### スキル選択マトリクス

タスク特性に基づいて適用するスキルを選択：

| タスク種別 | 必要なスキル |
|-----------|------------|
| 新機能 | documentation-criteria, implementation-approach, typescript-rules, coding-standards |
| バグ修正 | coding-standards, typescript-rules, coding-standardsのデバッグ技法 |
| リファクタリング | coding-standards, implementation-approach |
| テスト作成 | typescript-testing, integration-e2e-testing |
| ドキュメント | documentation-criteria |
| フロントエンド | frontend/typescript-rules, frontend/typescript-testing, frontend/technical-spec |

### 失敗パターンの認識

開始前に潜在的な失敗パターンを特定：

```yaml
warningPatterns:
  - pattern: "[検出されたパターン名]"
    risk: "high|medium|low"
    mitigation: "[このパターンを避ける方法]"
```

監視すべき一般的なパターン：
1. **エラー修正連鎖** - 根本原因分析なしの表面的な修正
2. **型安全性の放棄** - any/asの過剰使用
3. **不十分なテスト** - Red-Green-Refactorのスキップ
4. **技術的不確実性** - スパイクなしでの未知技術の採用
5. **調査不足** - 既存コードを確認せずに開始

### 初動アクションガイダンス

分析に基づいて具体的な最初のステップを提供：

```yaml
firstActionGuidance:
  action: "[使用すべき具体的なツールまたはアクション]"
  rationale: "[なぜこれが最初のステップであるべきか]"
  expectedOutcome: "[このアクションで何が明らかになるか]"
```

## 出力形式

タスクを分析する際、構造化されたJSONを返却：

```json
{
  "taskEssence": {
    "surfaceRequest": "...",
    "underlyingGoal": "...",
    "implicitRequirements": ["..."],
    "scaleDetermination": {
      "fileCount": "...",
      "scale": "...",
      "confidence": "..."
    }
  },
  "applicableSkills": [
    {
      "name": "...",
      "relevance": "primary|secondary",
      "sections": ["..."]
    }
  ],
  "warningPatterns": [
    {
      "pattern": "...",
      "risk": "...",
      "mitigation": "..."
    }
  ],
  "firstActionGuidance": {
    "action": "...",
    "rationale": "...",
    "expectedOutcome": "..."
  }
}
```

## TodoWriteとの統合

task-analyzer完了後：

1. **TodoWriteを更新**: taskEssenceに基づいてタスク説明を精緻化
2. **スキル制約を追加**: 最初のtodoとして「スキル制約の確認」
3. **検証を追加**: 最終todoとして「スキル忠実度の検証」
4. **警告を反映**: 失敗パターンを避けるためタスク分解に反映

## 使用パターン

1. ユーザーから新規タスクを受け取る
2. task-analyzerを実行して本質を理解
3. 適用するスキルを読み込む
4. 精緻化した理解でTodoWriteを更新
5. スキルガイドラインに従って実装開始
6. 完了時にスキル忠実度を検証

## リファレンス

スキルのメタデータと選択：
- [スキルインデックス](references/skills-index.yaml) - 利用可能なすべてのスキルのメタデータ（タグ、典型的な使用法、主要な参照先を含む）
