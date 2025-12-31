---
name: frontend/typescript-rules
description: React/TypeScriptの型安全性、コンポーネント設計、状態管理ルールを適用。Reactコンポーネント実装時に使用。
---

# TypeScript 開発ルール（フロントエンド）

## 型システム

### 型安全性の原則
- **strictモード必須**: tsconfig.jsonでstrict: trueを設定
- **any型使用禁止**: コードベースでany型を使用しない
- **as使用最小化**: 型キャストはやむを得ない場合のみ（理由をコメント）
- **unknown優先**: any型が必要な場合はunknown + 型ガード

```typescript
// 良い: 型ガード付きのunknown
function processData(data: unknown): User {
  if (!isUser(data)) throw new Error('Invalid user data')
  return data
}

// 悪い: any型の使用
function processData(data: any): User {
  return data as User
}
```

### 型定義のベストプラクティス

#### オブジェクト型
- **interface優先**: 拡張可能なオブジェクト型にはinterfaceを使用
- **typeはunion/intersection用**: 複合型やユーティリティ型に使用
- **readonlyの活用**: 不変なプロパティにはreadonlyを明示

```typescript
// 良い: 明確な型定義
interface User {
  readonly id: string
  name: string
  email: string
}

type UserWithRole = User & { role: 'admin' | 'user' }
```

#### 関数型
- **戻り値型を明示**: 複雑なロジックを持つ関数
- **ジェネリクスの活用**: 再利用可能な型安全な関数

```typescript
// 良い: 戻り値型を明示
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// 良い: ジェネリクスの活用
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // implementation
}
```

## Reactコンポーネント設計

### Function Components必須

```typescript
// 良い: Function Component
const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  return (
    <div onClick={() => onSelect(user.id)}>
      {user.name}
    </div>
  )
}

// 悪い: Class Component（非推奨）
class UserCard extends React.Component<UserCardProps> { }
```

### Props型定義

```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  // implementation
}
```

### Children Props

```typescript
interface LayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => (
  <div>
    <main>{children}</main>
    {sidebar && <aside>{sidebar}</aside>}
  </div>
)
```

## 状態管理

### useState型定義

```typescript
// 良い: 明示的な型
const [user, setUser] = useState<User | null>(null)
const [items, setItems] = useState<Item[]>([])

// 良い: 初期値から推論可能な場合
const [count, setCount] = useState(0)
```

### useReducerの型安全性

```typescript
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_ERROR'; payload: string }

interface State {
  user: User | null
  error: string | null
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, error: null }
    case 'CLEAR_USER':
      return { ...state, user: null }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
  }
}
```

### Custom Hooks

```typescript
interface UseUserReturn {
  user: User | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function useUser(userId: string): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchUser(userId)
      setUser(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { user, loading, error, refetch }
}
```

## エラーハンドリング

### Error Boundary

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
```

### APIエラーハンドリング

```typescript
interface ApiError {
  code: string
  message: string
  details?: Record<string, string>
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const error: unknown = await response.json()
    if (isApiError(error)) {
      throw new ApiError(error.code, error.message)
    }
    throw new Error('Unknown API error')
  }

  return response.json() as Promise<T>
}
```

## イベントハンドリング

### イベント型

```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  // handle click
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  // handle change
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  // handle submit
}
```

## コーディング規約

### 命名規則
- **コンポーネント**: PascalCase（例: `UserProfile`）
- **フック**: camelCase + use接頭辞（例: `useUserData`）
- **型/インターフェース**: PascalCase（例: `UserProps`）
- **定数**: SCREAMING_SNAKE_CASE（例: `MAX_RETRY_COUNT`）
- **ファイル名**: コンポーネントはPascalCase、その他はcamelCase

### インポート順序
1. React関連
2. 外部ライブラリ
3. 内部モジュール（絶対パス）
4. 内部モジュール（相対パス）
5. 型のみのインポート
6. スタイル/アセット

```typescript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '../utils'
import type { User } from '@/types'
import styles from './Component.module.css'
```

## アンチパターン

### 避けるべきパターン

```typescript
// 悪い: Propsのスプレッド展開
const Button = (props: ButtonProps) => <button {...props} />

// 良い: 明示的なPropsの受け渡し
const Button = ({ label, onClick, disabled }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>{label}</button>
)

// 悪い: インラインでの複雑なロジック
{items.filter(i => i.active).map(i => <Item key={i.id} {...i} />)}

// 良い: 事前に変数として抽出
const activeItems = items.filter(item => item.active)
{activeItems.map(item => <Item key={item.id} item={item} />)}
```
