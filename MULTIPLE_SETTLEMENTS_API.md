# Multiple Settlements API - Enhanced Group Debt Settlement

## New API Endpoint
```
POST /api/group/:groupId/settle-multiple-debts
```

## Purpose
This endpoint allows settling multiple debts between group members in a single request, perfect for processing optimal settlement calculations or handling multiple related settlements at once.

## Request Body Structure

```json
{
  "settlements": [
    {
      "fromEmail": "rezwanrahim.rupak@gmail.com",
      "toEmail": "rezwanrahim31@gmail.com",
      "amount": 50
    },
    {
      "fromEmail": "rezwanrahim.rupak@gmail.com", 
      "toEmail": "rezwanrahim31@gmail.com",
      "amount": 40
    }
  ]
}
```

## Response Structure

```json
{
  "success": true,
  "message": "Successfully processed 2 settlement(s)",
  "data": {
    "message": "Successfully processed 2 settlement(s)",
    "settlements": [
      {
        "from": "rezwanrahim.rupak@gmail.com",
        "to": "rezwanrahim31@gmail.com",
        "amount": 50,
        "date": "2024-01-15T10:30:00.000Z"
      },
      {
        "from": "rezwanrahim.rupak@gmail.com",
        "to": "rezwanrahim31@gmail.com", 
        "amount": 40,
        "date": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalSettlements": 2,
    "updatedData": {
      "group": {
        "groupId": 1759726734,
        "groupName": "Cox's Tour",
        "ownerEmail": "shakilahammed0555@gmail.com",
        "groupMembers": ["rezwanrahim31@gmail.com", "rezwanrahim.rupak@gmail.com"],
        "totalMembers": 3
      },
      "summary": {
        "youllPay": {
          "currency": "USD",
          "amount": 0
        },
        "youllCollect": {
          "currency": "USD", 
          "amount": 0
        },
        "totalExpenses": 210,
        "totalUserBorrowed": 0,
        "totalUserLent": 90
      },
      "settlements": [],
      "totalBalances": [
        {
          "memberEmail": "rezwanrahim31@gmail.com",
          "netBalance": 0,
          "totalPaid": 90,
          "totalOwes": 90
        },
        {
          "memberEmail": "rezwanrahim.rupak@gmail.com", 
          "netBalance": 0,
          "totalPaid": 90,
          "totalOwes": 90
        }
      ],
      "isAllSettled": true
    }
  }
}
```

## Key Features

### ✅ **Batch Processing**
- Process multiple settlements in a single API call
- Reduces network overhead and improves user experience
- Atomic operation - all settlements succeed or all fail

### ✅ **Comprehensive Validation**
- Validates each settlement individually before processing any
- Checks debt amounts against current balances
- Prevents invalid settlements (e.g., settling more than owed)
- Returns detailed error messages with settlement indices

### ✅ **Updated Balance Information**
- Returns updated group settlement data after processing
- Shows new balances and settlement status
- Includes comprehensive group and summary information

### ✅ **Smart Settlement Integration**  
- Perfect for use with the `/:groupId/settlements` API
- Can process optimal settlement calculations directly
- Supports complex multi-member debt resolution

## Validation Rules

1. **Settlement Array**: Must contain at least one settlement
2. **Individual Settlements**: Each must have `fromEmail`, `toEmail`, and `amount`
3. **Amount Validation**: Must be greater than 0
4. **Self-Settlement**: Cannot settle debt with yourself
5. **Balance Validation**: 
   - `fromEmail` must actually owe money (negative balance)
   - `toEmail` must be owed money (positive balance)
   - Settlement amount cannot exceed actual debt
   - Settlement amount cannot exceed what is owed to recipient

## Error Handling

### Individual Settlement Errors
```json
{
  "success": false,
  "message": "Settlement 2: amount must be greater than 0"
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Validation errors: Settlement 1: john@example.com does not owe money; Settlement 2: amount cannot exceed the debt amount"
}
```

## Use Cases

1. **Optimal Settlement Processing**: Use results from `/:groupId/settlements` API
2. **Bulk Settlement Operations**: Process multiple related settlements
3. **Complex Debt Resolution**: Handle intricate multi-member scenarios
4. **Mobile App Integration**: Batch settlement operations for better UX

## API Workflow

1. **Get Current Settlements**: `GET /:groupId/settlements`
2. **Process Multiple Settlements**: `POST /:groupId/settle-multiple-debts`
3. **Verify Updated Status**: Check `updatedData` in response

This enhancement makes group debt settlement more efficient and user-friendly!