// Test file to demonstrate currency conversion functionality
import { convertCurrency, convertCurrencyBatch, getExchangeRate, TCurrency } from '../util/currencyConverter';

const testCurrencyConversion = async () => {
  console.log('=== Currency Conversion Test ===\n');

  try {
    // Test single currency conversion
    console.log('1. Single Currency Conversion:');
    const amount = 100;
    const convertedAmount = await convertCurrency(amount, 'USD', 'EUR');
    console.log(`${amount} USD = ${convertedAmount} EUR\n`);

    // Test batch conversion (similar to what happens in getFilteredIncomeAndExpenses)
    console.log('2. Batch Currency Conversion:');
    const transactions = [
      { amount: 100, fromCurrency: 'USD' as TCurrency, toCurrency: 'EUR' as TCurrency },
      { amount: 50, fromCurrency: 'GBP' as TCurrency, toCurrency: 'EUR' as TCurrency },
      { amount: 200, fromCurrency: 'SGD' as TCurrency, toCurrency: 'EUR' as TCurrency },
    ];

    const convertedAmounts = await convertCurrencyBatch(transactions);
    transactions.forEach((tx, index) => {
      console.log(`${tx.amount} ${tx.fromCurrency} = ${convertedAmounts[index]} ${tx.toCurrency}`);
    });

    // Test exchange rate
    console.log('\n3. Exchange Rate:');
    const rate = await getExchangeRate('USD', 'EUR');
    console.log(`1 USD = ${rate} EUR`);

    console.log('\n=== Test Completed Successfully ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Example of how the converted response would look
const exampleResponse = {
  totalIncome: 2500.75, // Converted to user's preferred currency
  totalExpenses: 1800.25, // Converted to user's preferred currency  
  remainingBalance: 700.50, // Calculated from converted amounts
  currency: 'EUR', // User's preferred currency
  groupedByDate: [
    {
      date: '2025-01-15',
      dayName: 'Wednesday',
      transactions: [
        {
          _id: '507f1f77bcf86cd799439011',
          amount: 85.50, // Converted amount
          originalAmount: 100, // Original amount
          currency: 'EUR', // User's preferred currency
          originalCurrency: 'USD', // Original transaction currency
          date: '2025-01-15T10:30:00Z',
          description: 'Coffee shop',
          transactionType: 'expense',
          typeName: 'Food & Dining'
        }
      ],
      totalIncome: 0,
      totalExpenses: 85.50, // Converted amount
      net: -85.50 // Calculated from converted amounts
    }
  ]
};

console.log('Example converted response structure:');
console.log(JSON.stringify(exampleResponse, null, 2));

export { testCurrencyConversion };
