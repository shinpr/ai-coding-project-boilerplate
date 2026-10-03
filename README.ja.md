# AI Coding Project Boilerplate：Claude Codeスターターキット

*他の言語で読む: [English](README.md) | [简体中文](README.zh-CN.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScriptリポジトリに、Claude Codeを使った開発環境を組み込むスターターキットです。プロジェクト共通の`CLAUDE.md`、すぐに使えるコマンド、専門エージェント、スキルを導入し、リポジトリ内のルールに沿って開発を進められるようにします。

新しいプロジェクトを作成し、導入したClaude Code環境を継続して更新できます。プロンプトやエージェント定義を一から用意することなく、リポジトリ内でチームと共有・バージョン管理しながら、プロジェクトに合わせて育てられます。

## このキットで始められること

- TypeScript、Biomeによるフォーマット・lint、Vitestによるテストが設定済みの環境で開発を始める
- プロジェクトの前提や品質基準を記録し、別のセッションや担当者でも使う
- チームの知識をスキルとして追加し、必要な作業で参照する

## クイックスタート

Node.js 24.15以上、pnpm、Claude Codeを事前にインストールしてください。

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

初回に`/project-inject`でプロジェクトの前提情報を記録します。

`/implement`は、依頼内容を整理し、既存のコードを調べます。単純な変更は設計書を作らずに進められます。設計上の判断が必要な場合は、設計と計画を作成し、承認を待ってから実装します。その後、該当するチェックを実行し、中・大規模の変更では実装のレビューも行います。

導入手順と初回実行の詳しい流れは[クイックスタート](docs/guides/ja/quickstart.md)を参照してください。

## 用途に合うコマンドを選ぶ

| やりたいこと | コマンド |
|---|---|
| 依頼内容の整理から実装、検証まで進める | `/implement` |
| 範囲が明確な変更に取り組む | `/task` |
| 実装前に変更内容を設計する | `/design`, `/front-design` |
| 承認済みの設計から実行可能な計画を作る | `/plan`, `/front-plan` |
| 承認済みの計画に沿って実装を進める | `/build`, `/front-build` |
| 完了した実装が合意した成果とリポジトリの基準を満たしているか確認する | `/review`, `/front-review` |
| コードを変更せず、修正方法を決める前に問題を調査する | `/diagnose` |

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

既定はNormalモードです。独立したチェックやエージェントの呼び出し回数を減らしたい場合は、Liteモードを選べます。設計書とコードの照合、設計書間の整合性検証、独立したセキュリティレビューを省略します。計画に沿って進める実装では、Normalモードはタスクごとにlintやテストなどの品質チェックを行います。Liteモードは実装の最後にまとめて行ってから、コードレビューへ進みます。

Claudeによる実装内容の確認、必要なテストのレビュー、コードレビューは引き続き行います。承認も同じタイミングで求めます。小さな変更や、レビュー後の修正にも通常の品質チェックを行います。

Liteモードをプロジェクトの既定値にするには、プロジェクトルートで実行します。

```bash
node scripts/set-workflow-mode.js lite
```

設定は`CLAUDE.md`に保存されるため、次回からは依頼のたびにモードを指定する必要がありません。Normalモードに戻すには、`node scripts/set-workflow-mode.js normal`を実行します。会話の中で明示したモードはプロジェクトの既定値より優先され、変更を伝えるまでそのセッションで有効です。

## プロジェクトに合わせて育てる

`/project-inject`で、プロジェクトの目的、制約、品質基準、開発上の規約、外部資料の参照先を記録します。前提が変わったら再実行してください。

特定の作業でだけ使うチームの知識や判断基準は、`/create-skill`や`/refine-skill`で追加・改善できます。情報を置く場所の判断や、利用前のレビューもこれらのコマンドで行います。具体例は[スキル編集ガイド](docs/guides/ja/skills-editing-guide.md)を参照してください。

## Claude Code環境を更新する

このスターターキットで作成したプロジェクトのルートで、更新内容を確認してから適用します。

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

管理対象のClaude Codeのルール、コマンド、エージェント、スキルを置き換えます。更新対象のファイルに加えた編集も上書きされます。ソースコードと既存の`package.json`設定、保存したワークフローモードは保持します。

更新前に、プロジェクト独自のルールとスキルの変更をコミットしてください。`/project-inject`、`/create-skill`、`/refine-skill`で加えた変更も含みます。更新後は差分を確認し、残したい独自設定を手動で再適用します。更新手順の詳細は[クイックスタート](docs/guides/ja/quickstart.md)を参照してください。

## ガイド

- [クイックスタート](docs/guides/ja/quickstart.md)
- [ユースケースとコマンド](docs/guides/ja/use-cases.md)
- [スキル編集ガイド](docs/guides/ja/skills-editing-guide.md)

## ライセンス

[MIT](LICENSE)
