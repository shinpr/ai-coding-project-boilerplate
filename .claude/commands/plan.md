---
description: 設計書から作業計画とタスク分解を作成
---

@docs/sub-agents-guide.md の計画フローに従います。

! ls -la docs/design/*.md | head -10

設計書の存在を確認し、ない場合はその旨をユーザーに通知します。
複数ある場合は選択肢を提示します（$ARGUMENTS で指定可能）。

**Think deeply** 選択された設計書から作業計画書を作成し、それを基に独立性と実行可能性を考慮したタスク分解を行います。