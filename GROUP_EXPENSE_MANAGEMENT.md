# Group Expense Management API Routes

## Overview
This document describes the complete CRUD operations for group expenses, including the newly implemented update and delete functionality.

## Available Routes

### 1. Add Group Expense (Existing)
**Endpoint:** `POST /api/group-transaction/addGroupExpense/:groupId`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Parameters:**
- `groupId` (URL parameter): The ID of the group

**Request Body:**
```json
{
  "expenseDate": "2025-10-14T10:00:00.000Z",
  "totalExpenseAmount": 100.00,
  "currency": "USD",
  "category": "64f5a1b2c3d4e5f6g7h8i9j0",
  "note": "Dinner at restaurant",
  "paidBy": {
    "type": "individual",
    "memberEmail": "user@example.com",
    "amount": 100.00
  },
  "shareWith": {
    "type": "equal",
    "members": ["user1@example.com", "user2@example.com", "user3@example.com"]
  }
}
```

### 2. Update Group Expense (New)
**Endpoint:** `PUT /api/group-transaction/updateGroupExpense/:groupId/:expenseId`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Parameters:**
- `groupId` (URL parameter): The ID of the group
- `expenseId` (URL parameter): The ID of the expense to update

**Request Body (Partial Update Supported):**
```json
{
  "totalExpenseAmount": 120.00,
  "note": "Updated: Dinner at restaurant with dessert",
  "shareWith": {
    "type": "custom",
    "shares": [
      { "memberEmail": "user1@example.com", "amount": 40.00 },
      { "memberEmail": "user2@example.com", "amount": 50.00 },
      { "memberEmail": "user3@example.com", "amount": 30.00 }
    ]
  }
}
```

**Features:**
- ✅ **Partial Updates**: Only send fields you want to update
- ✅ **Validation**: Maintains data integrity with existing validation
- ✅ **Authorization**: Only group owners and members can update
- ✅ **Transaction Safety**: Uses MongoDB transactions

### 3. Delete Group Expense (New)
**Endpoint:** `DELETE /api/group-transaction/deleteGroupExpense/:groupId/:expenseId`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Parameters:**
- `groupId` (URL parameter): The ID of the group
- `expenseId` (URL parameter): The ID of the expense to delete

**Request Body:** None required

**Features:**
- ✅ **Complete Removal**: Permanently removes expense from group
- ✅ **Authorization**: Only group owners and members can delete
- ✅ **Transaction Safety**: Uses MongoDB transactions

### 4. Get Group Transactions (Existing)
**Endpoint:** `GET /api/group-transaction/getGroupTransactions/:groupId`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Parameters:**
- `groupId` (URL parameter): The ID of the group

**Query Parameters (Optional):**
- `expenseView`: Filter view type
- `transactionType`: Filter by transaction type
- `search`: Search term

## Response Format

All routes return a consistent response structure:

### Success Response:
```json
{
  "status": "success",
  "data": {
    // Updated group object with expenses
  },
  "message": "Group expense [added/updated/deleted] successfully"
}
```

### Error Response:
```json
{
  "status": "fail",
  "message": "Error description"
}
```

## Update Route - Supported Fields

The update route supports partial updates for these fields:

| Field | Type | Description |
|-------|------|-------------|
| `expenseDate` | Date | When the expense occurred |
| `totalExpenseAmount` | Number | Total amount of the expense |
| `currency` | String | Currency code (USD, EUR, SGD, GBP, AUD) |
| `category` | ObjectId | Category ID reference |
| `note` | String | Optional expense description |
| `paidBy` | Object | Who paid for the expense |
| `shareWith` | Object | How to split the expense |

### PaidBy Structure:
```json
{
  "type": "individual",
  "memberEmail": "user@example.com",
  "amount": 100.00
}
```

Or for multiple payers:
```json
{
  "type": "multiple",
  "payments": [
    { "memberEmail": "user1@example.com", "amount": 60.00 },
    { "memberEmail": "user2@example.com", "amount": 40.00 }
  ]
}
```

### ShareWith Structure:

**Equal Split:**
```json
{
  "type": "equal",
  "members": ["user1@example.com", "user2@example.com", "user3@example.com"]
}
```

**Custom Split:**
```json
{
  "type": "custom",
  "shares": [
    { "memberEmail": "user1@example.com", "amount": 40.00 },
    { "memberEmail": "user2@example.com", "amount": 35.00 },
    { "memberEmail": "user3@example.com", "amount": 25.00 }
  ]
}
```

## Authorization Rules

- ✅ **Group Owner**: Can perform all operations (add, update, delete)
- ✅ **Group Members**: Can perform all operations (add, update, delete)  
- ❌ **Non-Members**: Cannot perform any operations

## Validation Rules

### Update Validations:
- `totalExpenseAmount` must be greater than 0 (if provided)
- `paidBy` structure must be valid (if provided)
- `shareWith` structure must be valid (if provided)
- User must be group owner or member
- Expense must exist in the group

### Delete Validations:
- User must be group owner or member
- Expense must exist in the group
- Cannot delete if expense doesn't exist

## Usage Examples

### 1. Update Only Amount:
```bash
PUT /api/group-transaction/updateGroupExpense/12345/64f5a1b2c3d4e5f6g7h8i9j0
{
  "totalExpenseAmount": 150.00
}
```

### 2. Update Note and Category:
```bash
PUT /api/group-transaction/updateGroupExpense/12345/64f5a1b2c3d4e5f6g7h8i9j0
{
  "note": "Updated expense description",
  "category": "64f5a1b2c3d4e5f6g7h8i9j1"
}
```

### 3. Change Split Method:
```bash
PUT /api/group-transaction/updateGroupExpense/12345/64f5a1b2c3d4e5f6g7h8i9j0
{
  "shareWith": {
    "type": "custom",
    "shares": [
      { "memberEmail": "user1@example.com", "amount": 70.00 },
      { "memberEmail": "user2@example.com", "amount": 30.00 }
    ]
  }
}
```

### 4. Delete Expense:
```bash
DELETE /api/group-transaction/deleteGroupExpense/12345/64f5a1b2c3d4e5f6g7h8i9j0
```

## Error Scenarios

### Common Error Responses:

**400 - Bad Request:**
```json
{
  "status": "fail",
  "message": "Group ID is required"
}
```

**401 - Unauthorized:**
```json
{
  "status": "fail", 
  "message": "You are not authorized to update expenses in this group"
}
```

**404 - Not Found:**
```json
{
  "status": "fail",
  "message": "Expense not found"
}
```

**500 - Server Error:**
```json
{
  "status": "fail",
  "message": "Failed to update group expense: [error details]"
}
```

This comprehensive expense management system provides full CRUD functionality for group expenses while maintaining data integrity, proper authorization, and transaction safety.