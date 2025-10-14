# MongoDB Session Fix for Default Categories

## Issue Fixed

**Error:** `Cannot call 'create()' with a session and multiple documents unless 'ordered: true' is set`

**Root Cause:** When using MongoDB sessions with the `create()` method and multiple documents, MongoDB requires the `ordered: true` option to ensure transaction consistency.

## Solution Applied

### Before (Causing Error):
```typescript
const createOptions = session ? { session } : {};
const createdCategories = await CategoryModel.create(categoriesToCreate, createOptions);
```

### After (Fixed):
```typescript
const createOptions = session ? { session, ordered: true } : {};
const createdCategories = await CategoryModel.create(categoriesToCreate, createOptions);
```

## What Changed

1. **Added `ordered: true`** to the session options
2. **Maintained backward compatibility** - still works without sessions
3. **Preserved transaction safety** - all categories created within the user registration transaction

## Updated Category Statistics

With the enhanced emoji-based categories:
- **Personal Expense Categories:** 15 (with emojis like 🏠, 🍔, 🚗)
- **Personal Income Categories:** 6 (with emojis like 💵, 📈, 🏦)
- **Group Expense Categories:** 15 (same as personal but for groups)
- **Group Income Categories:** 6 (same as personal but for groups)
- **Total Default Categories:** 42

## MongoDB Transaction Behavior

The `ordered: true` option ensures:
- **Sequential creation** - categories are created in the specified order
- **Transaction safety** - if any category fails, the entire transaction can be rolled back
- **Consistency** - all categories are created atomically within the user registration process

## Testing

✅ **Compilation**: Successful build with no TypeScript errors
✅ **Category Structure**: 42 categories with proper emoji formatting
✅ **Backward Compatibility**: Works with and without sessions

## Impact

- **User Registration**: Now works correctly without session errors
- **Default Categories**: Users get 42 beautifully formatted categories with emojis
- **Transaction Integrity**: User creation and category creation remain atomic
- **No Breaking Changes**: Existing functionality preserved

The fix ensures that new user registration will successfully create all default categories within the same database transaction, maintaining data consistency and improving user experience with visually appealing emoji-based category names.