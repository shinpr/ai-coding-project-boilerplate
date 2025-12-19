---
description: スキル修正後のメタデータ同期とrule-advisor精度最適化
---

**コマンドコンテキスト**: スキルファイル編集後のメンテナンス作業

**Think deeply** rule-advisorの実行精度を最大化するための同期作業：

## 実行フロー

### 1. スキルファイルのスキャン
```bash
# 実行時のスキルディレクトリ
SKILLS_DIR=".claude/skills"
INDEX_FILE=".claude/skills/task-analyzer/references/skills-index.yaml"

# 全スキルファイルを解析
find "${SKILLS_DIR}" -name "SKILL.md" -type f | sort
```

### 2. メタデータ同期と最適化

#### セクション自動同期
- 各SKILL.mdの`## `セクションを抽出
- skills-index.yamlのsectionsを自動更新

#### タグの最適化
- ファイル内容からキーワードを分析
- 適切なタグの追加提案
- 不要なタグの削除提案

#### typical-useの更新
- ファイルの変更内容から使用場面を推測
- より具体的な利用シーンの記述を提案

#### key-referencesの補完
- 新しく追加された概念や手法を検出
- 関連する参考文献の追加を提案

### 3. rule-advisor向け最適化

メタデータの質を向上させ、rule-advisorが正確にスキルを選択できるよう調整：

```
=== スキルメタデータ同期 ===
対象: .claude/skills

実行した更新:
✅ sections同期
  - typescript-testing: 2セクション追加
  - coding-standards: 1セクション更新

✅ tags最適化
  - typescript-rules: [functional-programming]タグ追加を提案
  - technical-spec: [deprecated]タグ削除を提案

✅ typical-use改善
  - 3スキルの説明をより具体的に更新

最終結果: rule-advisor精度向上のための最適化完了
```

## 🧠 メタ認知ポイント

**本質的な目的**:
- 単なる整合性維持ではなく、rule-advisorの選択精度向上
- スキル編集作業の仕上げとしてのメタデータ最適化

**品質基準**:
- sectionsは100%同期必須
- tagsは内容を正確に反映
- typical-useは具体的な利用場面を明示
- key-referencesは最新の手法を網羅

## 変更要否の判断

以下の順序で評価：
- sectionsが100%同期済み → 「同期確認完了、更新不要」と報告して終了
- 内容とタグが適切に一致 → 更新不要と判断
- 改善の余地がある場合のみ → 具体的な修正提案を提示

**注意**: 毎回変更する必要はありません。変更不要な場合はその旨を明確に報告して終了してください。

## 実行タイミング

- スキルファイル編集後（必須）
- 新しいスキルファイル追加時
- 大規模なスキル改訂後
- rule-advisorの選択精度が低下したと感じた時

## 出力例

```
=== スキルメタデータ同期開始 ===
対象: .claude/skills (13スキル)

[1/13] typescript-rules
  ✅ sections: 7件同期完了
  💡 tags提案: +[functional-programming, dependency-injection]
  💡 typical-use: "TypeScript実装全般" → "型安全性重視の実装とモダンTypeScript機能活用"

[2/13] typescript-testing
  ✅ sections: 2件追加（テストの粒度、モックの型安全性）
  ✅ tags: 変更なし
  ✅ typical-use: 現状維持

...

=== 同期完了 ===
更新: 3スキル
提案: 5件（承認してください）

rule-advisor精度向上: 推定15%改善
```

**スコープ**: スキル修正作業後のメタデータ同期とrule-advisor精度最適化。
