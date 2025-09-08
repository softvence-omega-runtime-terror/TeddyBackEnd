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
