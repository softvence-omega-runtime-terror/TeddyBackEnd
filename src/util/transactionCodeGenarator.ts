import { Types } from 'mongoose';
import { ExpenseOrIncomeGroupModel, TransactionModel } from '../modules/incomeAndExpances/incomeAndexpence.model';


const generateTransactionCode = async (user_id: Types.ObjectId, group_id?: Types.ObjectId): Promise<string> => {
  try {
    let prefix: string;
    let lastTransaction;

    if (group_id) {
      // Handle group transactions
      const group = await ExpenseOrIncomeGroupModel.findById(group_id);
      
      if (!group) {
        throw new Error('Group not found');
      }

      // Format group name: lowercase and replace spaces with underscores
      prefix = group.groupName
        .toLowerCase()
        .replace(/\s+/g, '_');

      // Find the last group transaction, sorted by createdAt descending
      lastTransaction = await TransactionModel.findOne({ 
        group_id,
        isGroupTransaction: true 
      })
        .sort({ createdAt: -1 })
        .select('transaction_Code');
    } else {
      // Handle non-group transactions
      prefix = user_id.toString(); // Use user_id as prefix

      // Find the last non-group transaction for the user, sorted by createdAt descending
      lastTransaction = await TransactionModel.findOne({ 
        user_id,
        isGroupTransaction: false 
      })
        .sort({ createdAt: -1 })
        .select('transaction_Code');
    }

    let counter = 0;
    
    if (lastTransaction && lastTransaction.transaction_Code) {
      // Extract the last 4 digits from the transaction code
      const lastCode = lastTransaction.transaction_Code;
      const lastNumber = parseInt(lastCode.slice(-4), 10);
      if (!isNaN(lastNumber)) {
        counter = lastNumber + 1;
      }
    }

    // Format the counter as a 4-digit number with leading zeros
    const formattedCounter = counter.toString().padStart(4, '0');
    
    // Combine prefix and counter
    return `${prefix}_${formattedCounter}`;
  } catch (error) {
    console.error('Error generating transaction ID:', error);
    throw error;
  }
};

export default generateTransactionCode ;