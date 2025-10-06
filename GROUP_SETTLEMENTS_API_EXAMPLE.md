# Group Settlements API - Enhanced Response Structure

## API Endpoint
```
GET /api/group/:groupId/settlements
```

## Enhanced Response Structure

The API now returns comprehensive group information and user-specific summary data as requested:

```json
{
  "success": true,
  "message": "Group settlements retrieved successfully",
  "data": {
    "group": {
      "groupId": 1759726734,
      "groupName": "Cox's Tour",
      "ownerEmail": "shakilahammed0555@gmail.com",
      "groupMembers": [
        "rezwanrahim31@gmail.com",
        "rezwanrahim.rupak@gmail.com"
      ],
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
      "totalExpenses": 120,
      "totalUserBorrowed": 0,
      "totalUserLent": 0
    },
    "settlements": [
      {
        "from": "rezwanrahim31@gmail.com",
        "to": "shakilahammed0555@gmail.com",
        "amount": 40.00
      }
    ],
    "totalBalances": [
      {
        "memberEmail": "shakilahammed0555@gmail.com",
        "netBalance": 40.00,
        "totalPaid": 80.00,
        "totalOwes": 40.00
      },
      {
        "memberEmail": "rezwanrahim31@gmail.com",
        "netBalance": -40.00,
        "totalPaid": 40.00,
        "totalOwes": 80.00
      },
      {
        "memberEmail": "rezwanrahim.rupak@gmail.com",
        "netBalance": 0.00,
        "totalPaid": 40.00,
        "totalOwes": 40.00
      }
    ],
    "isAllSettled": false
  }
}
```

## New Fields Explained

### Group Object
- **groupId**: Unique identifier for the group
- **groupName**: Display name of the group
- **ownerEmail**: Email of the group owner
- **groupMembers**: Array of member emails (excluding owner)
- **totalMembers**: Total count including owner and members

### Summary Object
- **youllPay**: Amount the current user needs to pay to settle their debts
- **youllCollect**: Amount the current user will collect from others
- **totalExpenses**: Sum of all group expenses
- **totalUserBorrowed**: Net amount the user has borrowed (owes - paid)
- **totalUserLent**: Net amount the user has lent (paid - owes)

### Settlements Array
- Shows optimal settlement transactions to minimize number of payments
- **from**: Email of person who needs to pay
- **to**: Email of person who will receive payment
- **amount**: Amount to be settled

### Total Balances Array
- **memberEmail**: Member's email address
- **netBalance**: Final balance (positive = owed money, negative = owes money)
- **totalPaid**: Total amount this member has paid for group expenses
- **totalOwes**: Total amount this member owes for their share

## Usage in Mobile App

This enhanced response structure supports:

1. **Group Header Display**: Use `group` object for showing group info
2. **User Summary Cards**: Use `summary` object for personal financial overview
3. **Settlement List**: Use `settlements` array for "Slice up" functionality
4. **Member Balance Overview**: Use `totalBalances` for detailed member view

## Settlement API Integration

Combined with the settlement recording API:
```
POST /api/group/:groupId/settle-debt
```

This provides complete settlement management functionality for group expenses.