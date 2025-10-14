# Default Categories System Implementation

## Overview
This implementation provides a comprehensive default categories system for the Teddy Backend application. When new users register, they automatically receive a complete set of predefined categories for both personal and group transactions.

## Features Implemented

### 1. Default Categories Structure
- **Personal Expense Categories**: 15 categories (Food & Dining, Transportation, Shopping, etc.)
- **Personal Income Categories**: 10 categories (Salary, Freelance, Business Income, etc.)
- **Group Expense Categories**: 10 categories (Group Meals, Accommodation, Activities, etc.)
- **Group Income Categories**: 4 categories (Group Contributions, Shared Refunds, etc.)
- **Total**: 39 default categories

### 2. Automatic Category Creation
- **New User Registration**: Default categories are automatically created during user registration
- **Transaction Integration**: Categories are created within the user creation transaction for data consistency
- **Database Integrity**: Uses MongoDB sessions to ensure atomicity

### 3. Manual Initialization Endpoint
- **API Endpoint**: `POST /api/user/categories/initialize-defaults`
- **Purpose**: Allows existing users to initialize default categories
- **Authentication**: Requires user authentication
- **Response**: Returns created categories with success confirmation

## Files Modified/Created

### 1. New Files Created
```
src/modules/user/defaultCategories.ts - Category definitions
src/util/testDefaultCategories.ts - Testing utility
```

### 2. Modified Files
```
src/modules/user/user.service.ts - Added createDefaultCategories function
src/modules/user/user.controller.ts - Added initializeDefaultCategories controller
src/modules/user/user.routes.ts - Added initialization route
```

## API Usage

### Automatic Creation (New Users)
Default categories are automatically created when users register via:
```
POST /api/user/createUser
```

### Manual Initialization (Existing Users)
Existing users can initialize default categories via:
```
POST /api/user/categories/initialize-defaults
Headers: {
  "Authorization": "Bearer <user_token>"
}
```

**Response Format:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Default categories initialized successfully",
  "data": [
    {
      "_id": "category_id",
      "name": "Food & Dining",
      "type": "personal",
      "transactionType": "expense",
      "user_id": "user_id"
    }
    // ... more categories
  ]
}
```

## Category Structure

### Personal Expense Categories (15)
1. Food & Dining
2. Transportation
3. Shopping
4. Entertainment
5. Bills & Utilities
6. Health & Fitness
7. Travel
8. Education
9. Personal Care
10. Gifts & Donations
11. Home & Garden
12. Insurance
13. Taxes
14. Business Expenses
15. Other Expenses

### Personal Income Categories (10)
1. Salary
2. Freelance
3. Business Income
4. Investment Returns
5. Rental Income
6. Bonus
7. Gifts Received
8. Refunds
9. Side Hustle
10. Other Income

### Group Expense Categories (10)
1. Group Meals
2. Accommodation
3. Transportation
4. Activities
5. Groceries
6. Utilities
7. Entertainment
8. Shopping
9. Group Events
10. Other Group Expenses

### Group Income Categories (4)
1. Group Contributions
2. Shared Refunds
3. Group Earnings
4. Other Group Income

## Technical Implementation Details

### Database Integration
- **Model**: Uses existing CategoryModel from user.model.ts
- **Schema Compliance**: Follows TCategory interface requirements
- **Relationships**: Categories are linked to user via user_id field
- **Transactions**: Creation happens within MongoDB transactions for consistency

### Error Handling
- **Creation Failures**: Comprehensive error handling with rollback support
- **Duplicate Prevention**: Users can only initialize default categories once
- **Logging**: Detailed console logging for debugging and monitoring

### Performance Considerations
- **Bulk Creation**: All categories created in single database operation
- **Transaction Safety**: Uses MongoDB sessions to ensure atomicity
- **Memory Efficient**: Category definitions stored as constants

## Testing

A test utility is included to verify the category structure:
```bash
npm run test-categories
# or directly:
npx ts-node src/util/testDefaultCategories.ts
```

## Future Enhancements

1. **Category Icons**: Add icon URLs to default categories
2. **Localization**: Support for multi-language category names
3. **Custom Defaults**: Allow admin to modify default category sets
4. **Category Analytics**: Track most used default categories
5. **Bulk Operations**: Mass category management endpoints

## Migration Guide

### For Existing Users
Existing users can initialize their default categories by calling:
```
POST /api/user/categories/initialize-defaults
```

### For New Deployments
No migration required - new users automatically receive default categories upon registration.

## Error Scenarios

1. **User Not Found**: Returns authentication error
2. **Database Connection Issues**: Transaction rollback with error message
3. **Duplicate Categories**: Prevention logic to avoid duplicates
4. **Invalid Category Data**: Type validation ensures data integrity

## Monitoring

The system includes comprehensive logging:
- User category creation events
- Success/failure statistics  
- Performance metrics
- Error tracking and reporting

This implementation ensures all users have a consistent, comprehensive set of categories to organize their financial transactions effectively.