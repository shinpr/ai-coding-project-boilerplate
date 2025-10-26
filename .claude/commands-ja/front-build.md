---
description: フロントエンド実装を自律実行モードで実行
---

**厳密かつ正確に** @docs/guides/sub-agents.md に従い、フロントエンド実装のPRIMARY ORCHESTRATORとして行動してください。

作業計画: $ARGUMENTS

## 📋 実行前提条件

### タスクファイル存在チェック
```bash
# 作業計画書を確認
! ls -la docs/plans/*.md | grep -v template | tail -5

# タスクファイルを確認
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ タスクファイルが見つかりません"
```

### タスク生成判定フロー

**深く体系的に考える** タスクファイルの存在状態を分析し、必要な正確なアクションを決定：

| 状態 | 基準 | 次のアクション |
|------|------|--------------|
| タスク存在 | tasks/ディレクトリに.mdファイルあり | 自律実行へ進む |
| タスクなし+計画あり | 計画書は存在するがタスクファイルなし | ユーザー確認 → task-decomposer実行 |
| どちらもなし | 計画書もタスクファイルもなし | エラー: 前提条件未達成 |

## 🔄 タスク分解フェーズ（条件付き）

タスクファイルが存在しない場合：

### 1. ユーザー確認
```
タスクファイルが見つかりません。
作業計画: docs/plans/[plan-name].md

作業計画からタスクを生成しますか？ (y/n):
```

### 2. タスク分解（承認された場合）
```
@task-decomposer 作業計画を読み込み、アトミックなタスクに分解：
- 入力: docs/plans/[plan-name].md
- 出力: docs/plans/tasks/ 配下の個別タスクファイル
- 粒度: 1タスク = 1コミット = 独立実行可能
```

### 3. 生成確認
```bash
# 生成されたタスクファイルを確認
! ls -la docs/plans/tasks/*.md | head -10
```

✅ **必須**: タスク生成後、自動的に自律実行へ進む
❌ **禁止**: タスク生成なしで実装開始

## 🧠 各タスクのメタ認知 - フロントエンド特化
**必須実行サイクル**: `task-executor-frontend → quality-fixer-frontend → commit`

各タスク開始前に必ず：
1. **rule-advisor実行**: タスクの真の本質を抽出
2. **TodoWrite更新**: 即座に構造化と進捗追跡
3. **task-executor-frontend使用**: フロントエンドタスク実行（Reactコンポーネント、機能等）
4. **構造化レスポンス処理**: `readyForQualityCheck: true` 検出時 → 即座にquality-fixer-frontend実行
5. **quality-fixer-frontend使用**: 全フロントエンド品質チェック実行（Lighthouse、バンドルサイズ、React Testing Library等）

**深く考える** 例外なく全ての構造化レスポンスを監視し、全ての品質ゲートが通過することを確保。

! ls -la docs/plans/*.md | head -10

承認ステータスを確認してから進む。確認後、自律実行モードを開始。要件変更を検出したら即座に停止。

## 出力例
フロントエンド実装フェーズ完了。
- タスク分解: docs/plans/tasks/ 配下に生成
- 実装タスク: [件数] タスク
- 品質チェック: 全てパス（Lighthouse、バンドルサイズ、テスト）
- コミット: [件数] コミット作成

**重要**: このコマンドは、タスク分解から完了までのフロントエンド実装全体の自律実行フローを管理します。フロントエンド特化エージェント（task-executor-frontend、quality-fixer-frontend）を自動使用します。
