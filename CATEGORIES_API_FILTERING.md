# Enhanced Categories API with Filtering

## Updated API Documentation

### Get All Categories with Optional Filters

**Endpoint:** `GET /api/user/categories`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters (All Optional):**
- `type`: Filter by category type
  - Values: `personal` | `group`
- `transactionType`: Filter by transaction type  
  - Values: `income` | `expense`

## Usage Examples

### 1. Get All Categories (No Filters)
```
GET /api/user/categories
```
Returns all categories for the user (personal + group, income + expense)

### 2. Get Only Personal Categories
```
GET /api/user/categories?type=personal
```
Returns all personal categories (both income and expense)

### 3. Get Only Group Categories
```
GET /api/user/categories?type=group
```
Returns all group categories (both income and expense)

### 4. Get Only Expense Categories
```
GET /api/user/categories?transactionType=expense
```
Returns all expense categories (both personal and group)

### 5. Get Only Income Categories
```
GET /api/user/categories?transactionType=income
```
Returns all income categories (both personal and group)

### 6. Get Personal Expense Categories Only
```
GET /api/user/categories?type=personal&transactionType=expense
```
Returns only personal expense categories

### 7. Get Personal Income Categories Only
```
GET /api/user/categories?type=personal&transactionType=income
```
Returns only personal income categories

### 8. Get Group Expense Categories Only
```
GET /api/user/categories?type=group&transactionType=expense
```
Returns only group expense categories

### 9. Get Group Income Categories Only
```
GET /api/user/categories?type=group&transactionType=income
```
Returns only group income categories

## Response Format

All requests return the same response structure:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "category_id",
      "name": "Food & Dining",
      "type": "personal",
      "transactionType": "expense",
      "user_id": "user_id"
    },
    {
      "_id": "category_id_2", 
      "name": "Salary",
      "type": "personal",
      "transactionType": "income",
      "user_id": "user_id"
    }
    // ... more categories based on filters
  ]
}
```

## Filter Validation

- Invalid `type` values are ignored (only 'personal' and 'group' are accepted)
- Invalid `transactionType` values are ignored (only 'income' and 'expense' are accepted)
- Invalid filters don't cause errors - they're simply ignored
- If no valid filters are provided, all categories are returned

## Expected Results with Default Categories

Assuming you have initialized default categories, here are the expected counts:

### Without Filters
- **Total Categories:** 39
  - Personal Expense: 15
  - Personal Income: 10  
  - Group Expense: 10
  - Group Income: 4

### With `type=personal`
- **Total Categories:** 25
  - Personal Expense: 15
  - Personal Income: 10

### With `type=group`
- **Total Categories:** 14
  - Group Expense: 10
  - Group Income: 4

### With `transactionType=expense`
- **Total Categories:** 25
  - Personal Expense: 15
  - Group Expense: 10

### With `transactionType=income`
- **Total Categories:** 14
  - Personal Income: 10
  - Group Income: 4

### With `type=personal&transactionType=expense`
- **Total Categories:** 15 (Personal Expense only)

### With `type=personal&transactionType=income`
- **Total Categories:** 10 (Personal Income only)

### With `type=group&transactionType=expense`
- **Total Categories:** 10 (Group Expense only)

### With `type=group&transactionType=income`
- **Total Categories:** 4 (Group Income only)

## Backward Compatibility

This enhancement is fully backward compatible:
- Existing API calls without query parameters work exactly as before
- No breaking changes to response structure
- All existing functionality is preserved

## Error Handling

- **Invalid User ID:** Returns authentication error
- **Database Connection Issues:** Returns 500 error with message
- **Invalid Query Parameters:** Ignored, returns all categories

## Performance Notes

- Filtering happens at the database level using MongoDB queries
- More specific filters result in faster queries and smaller response sizes
- Indexes on `user_id`, `type`, and `transactionType` fields optimize performance

This enhancement makes the categories API much more flexible for frontend filtering and reduces unnecessary data transfer when specific category types are needed.