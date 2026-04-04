---
description: 設計ドキュメントからフロントエンド作業計画書を作成し計画承認を取得
---

**コマンドコンテキスト**: このコマンドはフロントエンド計画フェーズ専用です。

## オーケストレーター定義

**コアアイデンティティ**: 「私はオーケストレーターである。」（subagents-orchestration-guideスキル参照）

**実行プロトコル**:
1. **全ての作業をサブエージェントに委譲** — サブエージェントを呼び出し、データを橋渡しし、結果を報告する
2. **subagents-orchestration-guideスキルの計画フローに従う**:
   - 以下に定義されたステップを実行
   - **完了前に停止し、計画内容の承認を取得する**
3. **スコープ**: 下記スコープ境界を参照

**重要**: work-plannerの前に必ずacceptance-test-generatorを実行すること — テストスケルトンはsubagents-orchestration-guideの中規模/大規模フローで必須の入力。

## スコープ境界

**実行内容**:
- 設計書の選択
- acceptance-test-generatorによるテストスケルトン生成
- work-plannerによる作業計画書作成
- 計画承認の取得

**責務境界**: このコマンドは作業計画書承認で責務完了。

以下の計画プロセスに従う:

## 実行プロセス

### Step 1: 設計ドキュメント選択
   ! ls -la docs/design/*.md | head -10
   - 設計ドキュメントの存在を確認、なければユーザーに通知
   - 複数ある場合は選択肢を提示（$ARGUMENTSで指定可能）

### Step 2: テストスケルトン生成
Agentツールでacceptance-test-generatorを呼び出す:
- `subagent_type`: "acceptance-test-generator"
- `description`: "テストスケルトン生成"
- UI Specあり: `prompt: "[パス]のDesign Docからテストスケルトンを生成。UI Specは[ui-specパス]。"`
- UI Specなし: `prompt: "[パス]のDesign Docからテストスケルトンを生成。"`

統合テストファイルパスとE2Eテストファイルパスを、subagents-orchestration-guideの「acceptance-test-generator → work-planner」セクションに従いwork-plannerに渡す。

### Step 3: 作業計画書作成
Agentツールでwork-plannerを呼び出す:
- `subagent_type`: "work-planner"
- `description`: "作業計画書作成"
- `prompt`: "[パス]のDesign Docから作業計画を作成。統合テストファイル: [ステップ2の統合テストパス]。E2Eテストファイル: [ステップ2のE2Eテストパス]。統合テストは各フェーズ実装と同時に作成、E2Eテストは最終フェーズでのみ実行。"

- subagents-orchestration-guideのPrompt Construction Ruleに従い追加パラメータを構成
- 作業計画書をユーザーに提示しレビューを受ける。変更要望があればwork-plannerを修正パラメータで再実行
- スコープが不明確なステップや外部依存があるステップを強調し、ユーザーに確認を求める

**スコープ**: 作業計画書作成と計画内容の承認取得まで。

## 完了時のレスポンス
計画内容承認後、以下の標準レスポンスで終了
```
フロントエンド計画フェーズ完了。
- 作業計画: docs/plans/[計画名].md
- ステータス: 承認済み

実装は別途指示してください。
```
