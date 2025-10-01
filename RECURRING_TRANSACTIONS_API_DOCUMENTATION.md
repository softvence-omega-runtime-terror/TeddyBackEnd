# Recurring Transactions API Documentation

## Overview
The Recurring Transactions feature allows users to set up automatic recurring income or expense transactions that repeat on a specified schedule. When a transaction is created with a `repeat` configuration, the system will:

1. Create the first occurrence immediately
2. Schedule future occurrences based on the repeat settings
3. Automatically create transactions at the specified intervals

## API Endpoint
```
POST /incomeAndExpences/addIncomeOrExpenses
```

## How to Use Recurring Transactions

To create a recurring transaction, include a `repeat` object in your request payload along with the standard transaction fields.

### Basic Request Structure
```json
{
  "transactionType": "income" | "expense",
  "amount": number,
  "description": "string",
  "type_id": "string",
  "repeat": {
    // Repeat configuration goes here
  }
}
```

## Repeat Configuration Options

There are two ways to configure recurring transactions:

### 1. Direct Configuration (Simple)
Use `every` and `unit` to specify a simple interval:

```json
{
  "repeat": {
    "every": number,           // Required: Interval count (1, 2, 3, etc.)
    "unit": "string",          // Required: Time unit
    "startAt": "string",       // Optional: When to start (ISO date string)
    "endAt": "string",         // Optional: When to stop (ISO date string)
    "maxOccurrences": number   // Optional: Maximum number of times to repeat
  }
}
```

**Supported Units:**
- `"minute"` - Every X minutes
- `"hour"` - Every X hours  
- `"day"` - Every X days
- `"week"` - Every X weeks
- `"month"` - Every X months

### 2. Preset Configuration (Advanced)
Use presets for more sophisticated scheduling:

```json
{
  "repeat": {
    "preset": "weekly" | "monthly",
    "weekday": number,         // For weekly preset (0-6, 0=Sunday)
    "dayOfMonth": number,      // For monthly preset (1-31)
    "time": "string",          // Optional: Time in HH:MM format
    "tzOffsetMinutes": number, // Optional: Timezone offset in minutes
    "endAt": "string",         // Optional: When to stop
    "maxOccurrences": number   // Optional: Maximum occurrences
  }
}
```

## Examples

### Example 1: Daily Income (Simple)
```json
{
  "transactionType": "income",
  "amount": 50.00,
  "description": "Daily earnings",
  "type_id": "68b7daa40b816e98b79a0cb9",
  "repeat": {
    "every": 1,
    "unit": "day"
  }
}
```

### Example 2: Weekly Expense (Simple)
```json
{
  "transactionType": "expense",
  "amount": 100.00,
  "description": "Weekly groceries",
  "type_id": "68b7daa40b816e98b79a0cb9",
  "repeat": {
    "every": 1,
    "unit": "week"
  }
}
```

### Example 3: Monthly Salary with End Date
```json
{
  "transactionType": "income",
  "amount": 3000.00,
  "description": "Monthly salary",
  "type_id": "68cb982c2f82416b01406d2e",
  "repeat": {
    "every": 1,
    "unit": "month",
    "endAt": "2025-12-31T23:59:59.000Z"
  }
}
```

### Example 4: Limited Occurrences
```json
{
  "transactionType": "expense",
  "amount": 200.00,
  "description": "Course payment",
  "type_id": "68b7daa40b816e98b79a0cb9",
  "repeat": {
    "every": 1,
    "unit": "month",
    "maxOccurrences": 6
  }
}
```

### Example 5: Weekly Preset (Every Sunday at 9:00 AM)
```json
{
  "transactionType": "income",
  "amount": 500.00,
  "description": "Weekly freelance payment",
  "type_id": "68cb982c2f82416b01406d2e",
  "repeat": {
    "preset": "weekly",
    "weekday": 0,
    "time": "09:00"
  }
}
```

### Example 6: Monthly Preset (15th of every month at 2:30 PM)
```json
{
  "transactionType": "expense",
  "amount": 800.00,
  "description": "Monthly rent",
  "type_id": "68b7daa40b816e98b79a0cb9",
  "repeat": {
    "preset": "monthly",
    "dayOfMonth": 15,
    "time": "14:30"
  }
}
```

## Preset Configuration Details

### Weekly Preset
- `preset`: `"weekly"`
- `weekday`: Day of the week (0-6, where 0=Sunday, 1=Monday, ..., 6=Saturday)
- `time`: Time in 24-hour format (HH:MM), defaults to "00:00"
- `tzOffsetMinutes`: Timezone offset in minutes from UTC (optional)

### Monthly Preset
- `preset`: `"monthly"`
- `dayOfMonth`: Day of the month (1-31), automatically clamped to valid range (1-28 for safety)
- `time`: Time in 24-hour format (HH:MM), defaults to "00:00"
- `tzOffsetMinutes`: Timezone offset in minutes from UTC (optional)

## Optional Parameters (All Methods)

### `startAt` (Direct Configuration Only)
- **Type**: ISO date string
- **Description**: When to start the recurring schedule
- **Default**: Current date/time
- **Example**: `"2025-10-01T09:00:00.000Z"`

### `endAt`
- **Type**: ISO date string
- **Description**: When to stop creating recurring transactions
- **Default**: Never ends
- **Example**: `"2025-12-31T23:59:59.000Z"`

### `maxOccurrences`
- **Type**: Number
- **Description**: Maximum number of transactions to create
- **Default**: No limit
- **Example**: `12` (for 12 months)

### `tzOffsetMinutes` (Preset Only)
- **Type**: Number
- **Description**: Timezone offset in minutes from UTC
- **Example**: `-480` (for PST, UTC-8)

## Weekday Reference (For Weekly Preset)
- `0` = Sunday
- `1` = Monday  
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

## Response
When a recurring transaction is created successfully, you'll receive a standard success response. The system will:

1. Create the first transaction immediately
2. Set up the recurring schedule in the background
3. Automatically create future transactions based on your configuration

```json
{
  "status": "success",
  "data": [
    {
      "_id": "transaction_id_here",
      "transactionType": "income",
      "amount": 100,
      "description": "Weekly Sunday income",
      // ... other transaction fields
    }
  ],
  "message": "Transaction created successfully"
}
```

## Important Notes

1. **First Transaction**: The first transaction is created immediately when you make the API call
2. **Future Scheduling**: Future transactions are automatically created by a background scheduler
3. **Timezone Handling**: 
   - Direct configuration uses the server's timezone
   - Preset configuration allows timezone specification via `tzOffsetMinutes`
4. **Date Validation**: The system validates all dates and will throw errors for invalid configurations
5. **Monthly Safety**: For monthly presets, days are clamped to 1-28 to avoid issues with months having different numbers of days

## Error Handling

The API will return errors for:
- Missing required fields (`every`, `unit` for direct config)
- Invalid units (must be: minute, hour, day, week, month)
- Invalid weekday (must be 0-6 for weekly presets)
- Invalid dayOfMonth (must be 1-31 for monthly presets)
- Invalid preset values (must be "weekly" or "monthly")
- Invalid date formats

## Use Cases

### Perfect for:
- **Salaries**: Monthly recurring income
- **Rent/Utilities**: Monthly recurring expenses  
- **Subscriptions**: Monthly/yearly recurring payments
- **Allowances**: Weekly/daily recurring income
- **Savings Goals**: Regular recurring transfers

### Examples by Frequency:
- **Daily**: Allowances, daily earnings
- **Weekly**: Groceries, weekly services
- **Monthly**: Rent, salary, subscriptions
- **Custom Intervals**: Every 2 weeks, every 3 months, etc.

## Testing Recommendations

1. **Start with short intervals** (like minutes or hours) for testing
2. **Use `maxOccurrences`** to limit test runs
3. **Set near-future `endAt`** dates during development
4. **Test timezone handling** if using presets with different timezones

This feature makes it easy to automate regular financial transactions and maintain accurate, up-to-date financial records without manual entry each time.