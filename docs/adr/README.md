# Architecture Decision Records (ADR)

このディレクトリには、プロジェクトのアーキテクチャに関する重要な決定事項を記録したArchitecture Decision Records (ADR)を格納します。

## ADRとは

ADRは、アーキテクチャに関する重要な決定を記録するための軽量なドキュメントです。なぜその決定を下したのか、どのような選択肢を検討したのか、その決定がプロジェクトにどのような影響を与えるのかを記録します。

## ADRが必要なケース

以下のような変更を行う場合は、事前にADRの作成が必須です：

- **型定義の大幅な変更**（新しい型階層の導入、既存型の削除・統合）
- **データフローの変更**（データの保存場所、処理フローの変更）
- **アーキテクチャの変更**（新しいレイヤーの追加、責務の再配置）
- **5ファイル以上に影響する変更**
- **外部依存の追加・削除**
- **重要な技術的制約の導入**

## ADRの作成プロセス

1. **番号の採番**: 次の連番を使用（例: 0001, 0002）
2. **テンプレートの使用**: `template.md`をコピーして新しいADRを作成
3. **ファイル名**: `ADR-[番号]-[短いタイトル].md`（例: `ADR-0001-deepresearch-data-flow-unification.md`）
4. **レビュー**: 実装前にレビューを受ける
5. **ステータス更新**: 承認されたら"Accepted"に更新

## ADRの読み方

新しいモジュールや機能に触れる前に、関連するADRを必ず読んでください：

1. 該当機能に関連するADRを検索
2. コンテキストと決定事項を理解
3. 実装ガイドラインに従って作業

## 既存のADR一覧

| 番号 | タイトル | ステータス | 作成日 |
|------|----------|------------|--------|
| ADR-0001 | DeepResearch Data Flow Unification | Proposed | 2025-07-20 |
| ADR-0002 | Simplified Type System | Accepted | 2025-07-21 |

## 参考リンク

- [Documenting Architecture Decisions - Michael Nygard](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)