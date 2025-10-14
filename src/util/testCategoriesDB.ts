import mongoose from 'mongoose';
import { CategoryModel } from '../modules/user/user.model';

// Simple test to check if categories exist in database
export const testCategoriesInDB = async () => {
  try {
    // Connect to database (you might need to adjust connection string)
    if (mongoose.connection.readyState !== 1) {
      console.log('Please make sure MongoDB connection is established first');
      return;
    }

    console.log('=== Database Category Test ===');
    
    // Get all categories
    const allCategories = await CategoryModel.find({});
    console.log(`Total categories in database: ${allCategories.length}`);
    
    if (allCategories.length > 0) {
      console.log('\n--- Sample Categories ---');
      allCategories.slice(0, 5).forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (${cat.type}, ${cat.transactionType}) - User: ${cat.user_id}`);
      });
      
      // Group by user
      const userGroups = allCategories.reduce((acc: any, cat: any) => {
        const userId = cat.user_id.toString();
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push(cat);
        return acc;
      }, {});
      
      console.log('\n--- Categories by User ---');
      Object.keys(userGroups).forEach(userId => {
        console.log(`User ${userId}: ${userGroups[userId].length} categories`);
      });
    } else {
      console.log('No categories found in database');
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  }
};

export default testCategoriesInDB;