# Testing Rules

## Objective

Defines coding standards for writing tests in the project.

## Test Framework

The project uses **Vitest** as the test runner with:
- `@testing-library/react` for React component tests
- `@testing-library/jest-dom` for custom matchers
- `@testing-library/user-event` for user interaction simulation
- `happy-dom` as the DOM environment

## Test Writing Standards

### Use `test` instead of `it`

**ALWAYS use `test` instead of `it` when defining test cases.**

**Correct:**
```typescript
import { describe, expect, test } from 'vitest'

describe('MyComponent', () => {
  test('should render correctly', () => {
    // test code
  })
})
```

**Incorrect:**
```typescript
import { describe, expect, it } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    // test code
  })
})
```

### Test File Naming

- Test files must end with `.test.ts` or `.test.tsx`
- Place test files next to the source files they test
- Example: `src/services/chatService.ts` → `src/services/chatService.test.ts`

### Test Structure

```typescript
// 1. Imports first (test utilities, then source)
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

// 2. Mocks (if needed)
const mockFunction = vi.fn()

// 3. describe block
describe('MyComponent', () => {
  // 4. Setup/teardown
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // 5. Test cases using `test`
  test('should do something', () => {
    // test code
  })
})
```

### Test Descriptions

- Test descriptions must start with a verb in present tense
- Use clear, descriptive names
- Example: `'should render the component'`, `'should call the callback on click'`

### Testing Library Best Practices

```typescript
// ✅ Good: Test user behavior, not implementation
test('should submit form when submit button is clicked', async () => {
  const user = userEvent.setup()
  render(<MyForm onSubmit={mockSubmit} />)

  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(mockSubmit).toHaveBeenCalled()
})

// ❌ Bad: Test implementation details
test('should set state when button is clicked', () => {
  // Don't test internal state
})
```

## Import Order for Test Files

1. Vitest imports (`describe`, `expect`, `test`, etc.)
2. Testing library imports (`render`, `screen`, `userEvent`, etc.)
3. Source file imports
4. Mocks and test utilities

```typescript
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'
```

## Usage

This rule applies to:
- All new test files created
- All existing test files (refactor to use `test` instead of `it`)
- Test files in `src/**/*.test.{ts,tsx}`
- Test files in `electron/**/*.test.{ts,tsx}`