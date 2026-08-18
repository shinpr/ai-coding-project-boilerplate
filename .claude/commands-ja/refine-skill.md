---
description: ユーザーのスキル変更要求を最適化パターン評価付きで実装
---

**ユーザーの明示的な指示**: ユーザーは、このレシピで名前が挙げられたすべてのサブエージェント呼び出しを明示的に指示し、承認している。各呼び出しの前提条件を満たした時点で、該当する呼び出しを実行する。

**コマンドコンテキスト**: スキルファイルの変更要求を理解し、skill-creator（modificationモード）による品質評価付き実装ワークフロー。

変更要求: $ARGUMENTS

## 実行プロセス

Step 1-6を順番に完了する。現在のステップで定められた出力、レビュー結果、または承認条件を満たした場合にのみ次へ進む。該当するすべての完了条件を満たした後に完了する。

### Step 1: 変更要求の理解

未指定時はAskUserQuestionで確認：
- どのスキルを変更するか（例: typescript-rules / coding-standards）
- 変更種別: 新基準追加 / 既存基準修正 / 基準削除
- 具体的な変更内容

対象ファイル特定：
- スキル名が明示 → Read: `.claude/skills/{スキル名}/SKILL.md`（`~/.claude/skills/`も確認）
- 部分的に判明 → Glob: `.claude/skills/*{キーワード}*/SKILL.md`, `~/.claude/skills/*{キーワード}*/SKILL.md`
- 不明 → Glob: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md` で全件確認 → ユーザーに選択

### Step 2: ユーザーフレーズの収集（任意）

チームがこの作業を依頼する際に実際に使うフレーズを確認:
- 変更がdescriptionやスコープに影響する場合は必須
- 軽微な基準修正の場合は省略可

### Step 3: 変更設計案の作成

現状と変更案のbefore/afterを提示：

```
【現状】
"エラーは適切に処理する"（曖昧：「適切」の基準不明）

【変更案】
"エラーハンドリング実装基準：
1. try-catch必須条件：外部API呼び出し、ファイルI/O、JSON.parse等
2. エラーログ必須項目：error.name、error.stack、タイムスタンプ"

この設計で進めますか？ (y/n)
```

**設計チェックリスト**: skill-optimizationスキルの10の編集原則に照らして設計案を評価。重点項目：
- コンテキスト効率: 追加する全文がLLMの判断に寄与するか
- 測定可能性: 全基準がif-then形式または具体的閾値か
- 重複排除: 他スキルファイルとの重複がないか
- スコープ境界: 変更内容がこのスキルの責務範囲内か
- 作業量の妥当性: 追加する成果物、ゲート、判断が、成果、必要な境界、実際の利用側、または必要な証明を変えるか

### Step 4: skill-creatorによる変更実行

skill-creatorエージェントをAgent toolでmodificationモードとして起動:

```
subagent_type: skill-creator
prompt: |
  Mode: modification
  Skill name: {対象スキル名}
  Existing content: {現在のSKILL.md全文}
  Existing references: {現在のreferenceのファイル名と内容。存在しない場合は"None"}
  Modification request: {Step 3で承認された変更内容}
  Current review: None
```

skill-creatorが返すchangesSummaryを確認し、変更内容が意図通りか検証。

### Step 5: 品質レビュー

skill-reviewerエージェントをAgent toolで起動:
- skill-creatorの出力を組み立てたSKILL.md全文を渡す
- 変更済みおよび保持した全referenceのファイル名、行数、内容を渡す
- レビューモード: `modification`
- 再レビューでは、全ての`user_decision`を解決した後、前回のレビューとskill-creatorの`reviewResolutions`を渡す

**レビュー結果の処理:**
- グレードAまたはB: Step 6へ進行
- グレードC: referenceを含む直前のskill-creator出力を修復の基準とし、直前のレビューを`Current review`としてskill-creatorを再起動する
- 各指摘を`apply`、`decline`、`user_decision`に裁定し、適用対象を修正して、根拠付き却下を再レビューする
- `user_decision`はユーザーへ確認し、回答を成果またはスコープを決める情報としてskill-creatorへ戻す。再レビュー前に、その指摘を`apply`または根拠付き`decline`へ確定する
- reviewerが却下済みの指摘を維持できるのは、正しさまたは検証可能性に関する新しい根拠がある場合だけとする。新しい根拠を伴わない同じ選好は作業を妨げない
- 自動修復は2回の修復・再レビューで終了する
- 変更スコープ外の問題を検出: 別の改善機会としてユーザーに報告

### Step 6: 承認取得と実装

1. 変更前後の比較をユーザーに提示し承認を取得
2. skill-reviewerのグレードと残存する指摘を提示
3. skill-creatorのchangesSummaryを提示
4. 意図の整合性を確認: 「この変更は当初の要求を正しく反映していますか？」
5. 適切なツールで変更適用
6. git diffで変更内容を最終確認
7. 変更スコープ外の問題があれば、任意の改善事項として提示
8. `/sync-skills`実行を提案

## 完了条件

- [ ] 対象スキルを特定し現状を把握した
- [ ] skill-optimizationの編集原則に照らして設計案をレビューした
- [ ] skill-creator（modificationモード）で変更を実行した
- [ ] skill-reviewerがグレードAまたはBを返却した
- [ ] ユーザー承認を取得した
- [ ] 変更を適用しgit diffで確認した
- [ ] /sync-skills実行を提案した

## エラーハンドリング

| エラー | アクション |
|--------|-----------|
| スキル未発見 | 利用可能なスキル一覧を表示 |
| 大規模変更検出（ファイルの50%以上） | 段階的実施を提案 |
| 他スキルとの責務重複 | 責務境界を確認しユーザーに判断を委ねる |
| 2回の修復・再レビューでもグレードC | 変更内容と残存指摘を提示し、ユーザーに判断を委ねる |
| reviewerが退行を検出 | 退行原因の変更を取り消し、skill-creatorを再起動 |

**スコープ**: ユーザーの変更要求理解と品質評価付き最適化実装。変更実行はskill-creator（modificationモード）に委譲。品質評価はskill-reviewerエージェントに委譲。メタデータ同期は/sync-skills連携。
