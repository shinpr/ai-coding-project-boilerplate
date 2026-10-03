# AI Coding Project Boilerplate：Claude Codeスターターキット

*他の言語で読む: [English](README.md) | [简体中文](README.zh-CN.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScriptリポジトリに、Claude Codeを使った開発環境を組み込むスターターキットです。プロジェクト共通の`CLAUDE.md`、すぐに使えるコマンド、専門エージェント、スキルを導入し、リポジトリ内のルールに沿って要件整理から設計、実装、検証まで進められるようにします。

新しいプロジェクトを作成し、導入したClaude Code環境を継続して更新できます。プロンプトやエージェント定義を一から用意することなく、リポジトリ内でチームと共有・バージョン管理しながら、プロジェクトに合わせて育てられます。

## このキットで始められること

- TypeScript、フォーマット、lint、テストの設定が揃った環境で開発を始める
- プロジェクト共通のルールで、要件整理、設計、実装、レビューを進める
- プロジェクトの前提や品質基準を記録し、別のセッションや担当者でも使う
- チームの知識をスキルとして追加し、必要な作業で参照する

## クイックスタート

### 新しいプロジェクトを作成する

```bash
npx create-ai-project my-project --lang=ja
cd my-project
pnpm install
claude
```

英語や簡体字中国語のワークフローを使う場合は、作成時に`--lang=en`または`--lang=zh-CN`を指定します。

### 最初の変更を進める

Claude Codeを起動したら、次のコマンドを実行します。

```text
/project-inject
/implement APIにレート制限を追加
```

`/project-inject`で、プロジェクトの制約、品質基準、開発上の規約を記録します。依頼のたびに同じ前提を伝える必要がありません。

`/implement`は、依頼内容を整理し、既存のコードを調べ、変更に必要な設計、計画、実装、検証を進めます。承認が必要な箇所では確認を待ちます。中・大規模の変更では、完了した実装のレビューも行います。

導入手順と初回実行の詳しい流れは[クイックスタート](docs/guides/ja/quickstart.md)を参照してください。

## 開発環境を育て、チームで共有する

`/project-inject`で、プロジェクトの目的、制約、品質基準、開発上の規約、外部資料の参照先を記録します。前提が変わったら再実行してください。別のセッションでも、それまでの会話をたどらずに同じ前提で作業を始められます。

特定の作業でだけ使うチームの知識や判断基準は、`/create-skill`や`/refine-skill`で追加・改善できます。情報を置く場所の判断や、利用前のレビューもこのコマンドで行います。具体例は[スキル編集ガイド](docs/guides/ja/skills-editing-guide.md)を参照してください。

プロジェクトのルールとスキルはコードと一緒にバージョン管理し、チームで同じ環境を使いながら改善できます。

## Claude Code環境を更新する

このスターターキットで作成したプロジェクトのルートで、更新内容を確認してから適用します。

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

管理対象のClaude Codeのルール、コマンド、エージェント、スキルを更新します。ソースコードや既存の`package.json`設定は置き換えません。保存したワークフローモードも引き継ぎます。更新手順の詳細は[クイックスタート](docs/guides/ja/quickstart.md)を参照してください。

## 用途に合うコマンドを選ぶ

| やりたいこと | コマンド |
|---|---|
| 依頼内容の整理から実装、検証まで進める | `/implement` |
| 範囲が明確な変更に取り組む | `/task` |
| 実装前に変更内容を設計する | `/design`, `/front-design` |
| 承認済みの設計から実行可能な計画を作る | `/plan`, `/front-plan` |
| 承認済みの計画から実装を再開する | `/build`, `/front-build` |
| 完了した実装が合意した成果とリポジトリの基準を満たしているか確認する | `/review`, `/front-review` |
| 修正方法を決める前に問題を調査する | `/diagnose` |

### 先に設計し、後から実装する

```text
/design APIにレート制限を追加
/plan
/build
```

設計コマンドは承認を待って停止します。承認済みのドキュメントを使い、後から別のセッションや担当者が計画と実装を続けられます。計画には、各タスクで実現する内容と検証方法が記録されるため、それまでの会話をたどり直さずに引き継げます。

フロントエンドでは、次のコマンドを使います。

```text
/front-design ユーザープロフィールのダッシュボードを追加
/front-plan
/front-build
```

使用例とすべてのコマンドは[ユースケースとコマンド](docs/guides/ja/use-cases.md)を参照してください。

## ワークフローモード

既定のNormalモードでは、一通りの検証を実行します。Liteモードでは、設計書をコードと照合する独立検証、設計書間の整合性検証、独立したセキュリティレビューを省略します。計画に沿って進める実装では、リポジトリの品質チェックを実装の最後、コードレビュー前にまとめて行います。

コードレビュー、対象を絞った実装チェック、必要なテストレビュー、承認のタイミングは変わりません。単純な変更やレビュー修正の品質チェックも引き続き行います。

Liteモードをプロジェクトの既定値にするには、プロジェクトルートで実行します。

```bash
node scripts/set-workflow-mode.js lite
```

設定は`CLAUDE.md`に保存されるため、次回からは依頼のたびにモードを指定する必要がありません。Normalモードに戻すには、`node scripts/set-workflow-mode.js normal`を実行します。会話の中で明示したモードはプロジェクトの既定値より優先され、変更を伝えるまでそのセッションで有効です。

## ガイド

- [クイックスタート](docs/guides/ja/quickstart.md)
- [ユースケースとコマンド](docs/guides/ja/use-cases.md)
- [スキル編集ガイド](docs/guides/ja/skills-editing-guide.md)

## ライセンス

[MIT](LICENSE)
