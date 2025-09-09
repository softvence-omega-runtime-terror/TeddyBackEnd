# Group Transaction API Usage Examples

## Overview
The Group Transaction service handles expense splitting with flexible payment and sharing structures using **email-based member identification**.

## Service Functions

### 1. `addGroupExpense`
Adds an expense to a group with validation and debt calculation.

#### Request Payload Structure:
```typescript
{
  "expenseDate": "2025-09-08T10:00:00Z",
  "totalExpenseAmount": 120.00,
  "currency": "USD",
  "category": "64f2b8c9e123456789abcdef",
  "note": "Dinner at restaurant",
  "paidBy": {
    "type": "individual" | "multiple",
    // ... payment details with memberEmail
  },
  "shareWith": {
    "type": "equal" | "custom",
    // ... sharing details with memberEmail
  }
}
```

## Payment Scenarios

### Scenario 1: Individual Payment, Equal Split
**Use Case**: John (john@example.com) pays $120 for dinner, split equally among 3 people.

```json
{
  "expenseDate": "2025-09-08T19:00:00Z",
  "totalExpenseAmount": 120.00,
  "currency": "USD",
  "category": "64f2b8c9e123456789abcdef",
  "note": "Dinner at Italian restaurant",
  "paidBy": {
    "type": "individual",
    "memberEmail": "john@example.com",
    "amount": 120.00
  },
  "shareWith": {
    "type": "equal",
    "members": [
      "john@example.com",
      "mary@example.com",
      "alice@example.com"
    ]
  }
}
```
**Result**: Each person owes $40. John is owed $80.

### Scenario 2: Multiple Payment, Custom Split
**Use Case**: John pays $150, Mary pays $50, but shares are custom.

```json
{
  "expenseDate": "2025-09-08T15:00:00Z",
  "totalExpenseAmount": 200.00,
  "currency": "USD",
  "category": "64f2b8c9e123456789grocery",
  "note": "Weekly groceries",
  "paidBy": {
    "type": "multiple",
    "payments": [
      {
        "memberEmail": "john@example.com",
        "amount": 150.00
      },
      {
        "memberEmail": "mary@example.com",
        "amount": 50.00
      }
    ]
  },
  "shareWith": {
    "type": "custom",
    "shares": [
      {
        "memberEmail": "john@example.com",
        "amount": 100.00
      },
      {
        "memberEmail": "mary@example.com",
        "amount": 60.00
      },
      {
        "memberEmail": "alice@example.com",
        "amount": 40.00
      }
    ]
  }
}
```
**Result**: 
- John: Paid $150, owes $100 → Net: +$50 (owed $50)
- Mary: Paid $50, owes $60 → Net: -$10 (owes $10)
- Alice: Paid $0, owes $40 → Net: -$40 (owes $40)

### Scenario 3: Multiple Payment, Equal Split
**Use Case**: Multiple people pay, but split equally.

```json
{
  "expenseDate": "2025-09-08T12:00:00Z",
  "totalExpenseAmount": 300.00,
  "currency": "USD",
  "category": "64f2b8c9e123456789hotel",
  "note": "Hotel accommodation",
  "paidBy": {
    "type": "multiple",
    "payments": [
      {
        "memberEmail": "john@example.com",
        "amount": 200.00
      },
      {
        "memberEmail": "mary@example.com",
        "amount": 100.00
      }
    ]
  },
  "shareWith": {
    "type": "equal",
    "members": [
      "john@example.com",
      "mary@example.com",
      "alice@example.com",
      "bob@example.com"
    ]
  }
}
```
**Result**: Each person owes $75. John is owed $125, Mary is owed $25.

## Validation Rules

### Payment Validation (`paidBy`)
1. **Individual Payment**:
   - `amount` must equal `totalExpenseAmount`
   - `memberEmail` must be group member or owner

2. **Multiple Payment**:
   - Sum of all payments must equal `totalExpenseAmount`
   - No duplicate member emails in payments
   - All payer emails must be group members

### Sharing Validation (`shareWith`)
1. **Equal Sharing**:
   - All member emails must be group members
   - No duplicate member emails

2. **Custom Sharing**:
   - Sum of all shares must equal `totalExpenseAmount`
   - No duplicate member emails in shares
   - All member emails must be group members

## Additional Services

### 2. `calculateGroupBalances`
Returns balance summary for all group members.

```typescript
const balances = await calculateGroupBalances(groupId);
// Returns: { [memberEmail]: { paid: number, owes: number, net: number } }
```

### 3. `getGroupSummary`
Returns comprehensive group overview.

```typescript
const summary = await getGroupSummary(groupId);
// Returns: { group, balances, categoryBreakdown, recentExpenses }
```

## Error Handling

The service includes comprehensive validation:
- Authorization checks (member/owner verification via email)
- Data structure validation
- Mathematical balance validation
- Member existence verification (by email)
- Duplicate prevention

## Transaction Safety

- Uses MongoDB transactions for data consistency
- Atomic operations prevent partial updates
- Rollback on any validation failure

## Best Practices

1. **Always validate totals**: Ensure payments and shares sum correctly
2. **Check member authorization**: Verify user emails before adding to expenses
3. **Handle currency consistently**: Use same currency within a group
4. **Floating-point tolerance**: Allow 0.01 difference for rounding
5. **Comprehensive error messages**: Provide clear validation feedback
6. **Email-based identification**: Use consistent email format for member identification

## Key Changes from ObjectId to Email

- **Member Identification**: Uses `memberEmail` instead of `memberId`
- **Group Members**: Stored as array of email strings
- **Balance Tracking**: Balances keyed by email addresses
- **Validation**: Email-based membership verification
- **Simpler Integration**: No need to resolve ObjectIds to emails for display

## API Endpoint: Get Group Transactions

### `getGroupTransactions`
**GET** `/api/groupTransaction/getGroupTransactions/:groupId`

Retrieves comprehensive group transaction data with user-specific summaries, filtering, and search capabilities.

#### Query Parameters:
- `expenseView` (optional): `"all"` | `"involving_me_only"` - Filter expenses based on user involvement
- `transactionType` (optional): `"i_borrowed"` | `"i_lent"` | `"all"` - Filter by transaction type
- `search` (optional): Search expenses by category name or note

#### Example Request:
```
GET /api/groupTransaction/getGroupTransactions/12345?expenseView=involving_me_only&transactionType=i_borrowed&search=lunch
```

#### Response Structure:
```json
{
  "status": "success",
  "data": {
    "group": {
      "groupId": 12345,
      "groupName": "Roommates Expenses",
      "ownerEmail": "owner@example.com",
      "groupMembers": ["john@example.com", "jane@example.com", "bob@example.com"],
      "totalMembers": 4
    },
    "summary": {
      "youllPay": {
        "currency": "USD",
        "amount": 75.50
      },
      "youllCollect": {
        "currency": "USD",
        "amount": 0
      },
      "totalExpenses": 450.00,
      "totalUserBorrowed": 75.50,
      "totalUserLent": 0
    },
    "expenses": {
      "list": [
        {
          "_id": "expense_id_1",
          "expenseDate": "2024-01-15T10:30:00.000Z",
          "totalExpenseAmount": 150.00,
          "currency": "USD",
          "category": {
            "_id": "category_id",
            "name": "Food & Dining"
          },
          "note": "Team lunch at Italian restaurant",
          "paidBy": {
            "type": "individual",
            "memberEmail": "john@example.com",
            "amount": 150.00
          },
          "shareWith": {
            "type": "equal",
            "members": ["john@example.com", "jane@example.com", "bob@example.com"]
          },
          "userInvolvement": {
            "paid": 0,
            "owes": 50.00,
            "net": -50.00,
            "status": "you_borrowed",
            "amount": 50.00
          }
        }
      ],
      "byCategory": {
        "Food & Dining": [...],
        "Transportation": [...]
      },
      "byDate": {
        "2024-01-15": [...],
        "2024-01-14": [...]
      },
      "count": 5
    },
    "filters": {
      "expenseView": "involving_me_only",
      "transactionType": "i_borrowed",
      "search": "lunch"
    },
    "balances": {
      "john@example.com": {
        "paid": 300.00,
        "owes": 150.00,
        "net": 150.00
      },
      "jane@example.com": {
        "paid": 100.00,
        "owes": 150.00,
        "net": -50.00
      }
    }
  },
  "message": "Group transactions retrieved successfully"
}
```

#### Key Features:
- **User-Specific Summary**: Shows exactly how much the user will pay or collect
- **Expense Filtering**: 
  - View all expenses or only those involving the user
  - Filter by transaction type (borrowed, lent, all)
  - Search by category name or expense note
- **Categorized Data**: Expenses grouped by category and date
- **User Involvement**: Each expense shows user's involvement status and amounts
- **Balance Tracking**: Complete balance overview for all group members

#### User Involvement Status:
- `"you_borrowed"`: User owes money for this expense
- `"you_lent"`: User is owed money for this expense  
- `"settled"`: User's payment equals their share

## API Endpoint: Get Group Status

### `getGroupStatus`
**GET** `/api/groupTransaction/getGroupStatus/:groupId`

Retrieves comprehensive group status with overall summary and detailed breakdowns by category and person.

#### Example Request:
```
GET /api/groupTransaction/getGroupStatus/12345
```

#### Response Structure:
```json
{
  "status": "success",
  "data": {
    "group": {
      "groupId": 12345,
      "groupName": "Roommates Expenses",
      "ownerEmail": "owner@example.com",
      "totalMembers": 4,
      "totalExpenses": 850.00
    },
    "summary": {
      "involvedCurrency": "USD",
      "involvedAmount": 275.50,
      "myExpensesPercentage": 32.41,
      "myExpensesCurrency": "USD",
      "myExpensesAmount": 300.00,
      "netBalance": {
        "amount": 24.50,
        "status": "you_are_owed",
        "currency": "USD"
      }
    },
    "categoryWise": [
      {
        "categoryName": "Food & Dining",
        "totalAmount": 450.00,
        "currency": "USD",
        "percentage": 52.94,
        "myInvolvement": {
          "paid": 200.00,
          "owes": 150.00,
          "percentage": 33.33
        }
      },
      {
        "categoryName": "Transportation",
        "totalAmount": 250.00,
        "currency": "USD",
        "percentage": 29.41,
        "myInvolvement": {
          "paid": 100.00,
          "owes": 83.33,
          "percentage": 33.33
        }
      }
    ],
    "personWise": [
      {
        "memberEmail": "john@example.com",
        "totalInvolved": 400.00,
        "currency": "USD",
        "percentage": 47.06,
        "myRelation": {
          "paidToThem": 0,
          "owesFromThem": 133.33,
          "net": -133.33,
          "status": "i_owe_them"
        }
      },
      {
        "memberEmail": "jane@example.com",
        "totalInvolved": 300.00,
        "currency": "USD",
        "percentage": 35.29,
        "myRelation": {
          "paidToThem": 300.00,
          "owesFromThem": 100.00,
          "net": 200.00,
          "status": "myself"
        }
      }
    ],
    "currencies": ["USD"],
    "lastUpdated": "2025-09-09T12:00:00.000Z"
  },
  "message": "Group status retrieved successfully"
}
```

#### Key Features:
- **Overall Summary**: Total involved amount, user's expense percentage, and net balance status
- **Category-wise Breakdown**: Shows spending by category with user's involvement percentage
- **Person-wise Breakdown**: Shows each member's total involvement and relationship with the user
- **Multi-currency Support**: Handles mixed currencies appropriately
- **Net Balance Calculation**: Shows if user owes money, is owed money, or is settled

#### Summary Fields:
- `involvedAmount`: Total amount user is involved in (what user owes)
- `myExpensesAmount`: Total amount user has paid
- `myExpensesPercentage`: User's share percentage of total group expenses
- `netBalance.status`: `"you_are_owed"`, `"you_owe"`, or `"settled"`

#### Person Relation Status:
- `"myself"`: The current user
- `"they_owe_me"`: The person owes money to the current user
- `"i_owe_them"`: The current user owes money to this person
- `"settled"`: No outstanding balance between user and this person
