import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_GROUP_EXPENSE_CATEGORIES, DEFAULT_GROUP_INCOME_CATEGORIES } from '../modules/user/defaultCategories';

// Test function to verify default categories structure
export const testDefaultCategories = () => {
  console.log('=== Default Categories Test ===');
  
  console.log('\n--- Personal Expense Categories ---');
  console.log(`Count: ${DEFAULT_EXPENSE_CATEGORIES.length}`);
  DEFAULT_EXPENSE_CATEGORIES.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.type}, ${cat.transactionType})`);
  });
  
  console.log('\n--- Personal Income Categories ---');
  console.log(`Count: ${DEFAULT_INCOME_CATEGORIES.length}`);
  DEFAULT_INCOME_CATEGORIES.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.type}, ${cat.transactionType})`);
  });
  
  console.log('\n--- Group Expense Categories ---');
  console.log(`Count: ${DEFAULT_GROUP_EXPENSE_CATEGORIES.length}`);
  DEFAULT_GROUP_EXPENSE_CATEGORIES.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.type}, ${cat.transactionType})`);
  });
  
  console.log('\n--- Group Income Categories ---');
  console.log(`Count: ${DEFAULT_GROUP_INCOME_CATEGORIES.length}`);
  DEFAULT_GROUP_INCOME_CATEGORIES.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.type}, ${cat.transactionType})`);
  });
  
  const totalCategories = 
    DEFAULT_EXPENSE_CATEGORIES.length + 
    DEFAULT_INCOME_CATEGORIES.length + 
    DEFAULT_GROUP_EXPENSE_CATEGORIES.length + 
    DEFAULT_GROUP_INCOME_CATEGORIES.length;
  
  console.log(`\n=== Summary ===`);
  console.log(`Total Default Categories: ${totalCategories}`);
  console.log(`- Personal Expense: ${DEFAULT_EXPENSE_CATEGORIES.length}`);
  console.log(`- Personal Income: ${DEFAULT_INCOME_CATEGORIES.length}`);
  console.log(`- Group Expense: ${DEFAULT_GROUP_EXPENSE_CATEGORIES.length}`);
  console.log(`- Group Income: ${DEFAULT_GROUP_INCOME_CATEGORIES.length}`);
  
  return {
    totalCategories,
    personalExpense: DEFAULT_EXPENSE_CATEGORIES.length,
    personalIncome: DEFAULT_INCOME_CATEGORIES.length,
    groupExpense: DEFAULT_GROUP_EXPENSE_CATEGORIES.length,
    groupIncome: DEFAULT_GROUP_INCOME_CATEGORIES.length
  };
};

// Export for testing
export default testDefaultCategories;

// Run the test if this file is executed directly
if (require.main === module) {
  testDefaultCategories();
}