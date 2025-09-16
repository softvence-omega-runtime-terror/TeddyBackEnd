import {
  TransectionService,
} from './transection.service';
import catchAsync from '../../util/catchAsync';
import { sendSuccessResponse, sendFinancialResponse } from '../../util/sendResponse';
import { convertCurrency } from '../../util/currencyConverter';

const createTransection = catchAsync(async (req, res): Promise<void> => {
  const userId = req.user?.id;
  const userCurrency = req.userPreferences?.currency || 'USD';

  const transectionData = {
    createdBy: userId,
    ...req.body
  };

  const result = await TransectionService.createTransactionSummary(transectionData);

  // Convert amounts if needed
  if (result.currency && result.currency !== userCurrency) {
    if (result.amount) {
      result.amount = await convertCurrency(result.amount, result.currency as any, userCurrency as any);
    }
    
    // Convert member amounts if they exist
    if (result.members_Share_list) {
      for (const member of result.members_Share_list) {
        if (member.share_amount) {
          member.share_amount = await convertCurrency(member.share_amount, result.currency as any, userCurrency as any);
        }
      }
    }
    
    if (result.contribution_list) {
      for (const contribution of result.contribution_list) {
        if (contribution.contributed_amount) {
          contribution.contributed_amount = await convertCurrency(contribution.contributed_amount, result.currency as any, userCurrency as any);
        }
      }
    }
  }

  sendFinancialResponse(res, req, {
    messageKey: 'transaction.transaction_created',
    data: result,
    originalCurrency: result.currency,
    statusCode: 200
  });
});

const paybackTransectionAmount = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.paybackTransectionAmountToDB(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'transaction.transaction_updated',
    data: result
  });
});

const addMemberToEqualTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToEqualTransection(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'group.member_added',
    data: result
  });
});

const addMemberToCustomTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToCustomTransection(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'group.member_added',
    data: result
  });
});

const addMemberToTransaction = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToTransaction(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'group.member_added',
    data: result
  });
});

const deleteMemberFromEqualTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.deleteMemberFromEqualTransection(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'group.member_removed',
    data: result
  });
});

const leaveAMemberFromGroup = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.leaveAMemberFromGroup(req.body);

  sendSuccessResponse(res, req, {
    messageKey: 'group.member_removed',
    data: result
  });
});

const getAllTransection = catchAsync(async (req, res): Promise<void> => {
  const userId = req.user?.id;
  const userCurrency = req.userPreferences?.currency || 'USD';

  const result = await TransectionService.getAllTransection(userId);

  // Convert currency for all transactions if needed
  if (result && Array.isArray(result)) {
    for (const transaction of result) {
      if (transaction.currency && transaction.currency !== userCurrency) {
        // Convert main amount
        if (transaction.amount) {
          transaction.amount = await convertCurrency(transaction.amount, transaction.currency as any, userCurrency as any);
        }
        
        // Convert member share amounts
        if (transaction.members_Share_list) {
          for (const member of transaction.members_Share_list) {
            if (member.share_amount) {
              member.share_amount = await convertCurrency(member.share_amount, transaction.currency as any, userCurrency as any);
            }
          }
        }
        
        // Convert contribution amounts
        if (transaction.contribution_list) {
          for (const contribution of transaction.contribution_list) {
            if (contribution.contributed_amount) {
              contribution.contributed_amount = await convertCurrency(contribution.contributed_amount, transaction.currency as any, userCurrency as any);
            }
          }
        }
        
        // Update currency to user's preferred currency
        transaction.currency = userCurrency;
      }
    }
  }

  sendSuccessResponse(res, req, {
    messageKey: 'transaction.transactions_fetched',
    data: result
  });
});

export const TransectionController = {
  createTransection,
  paybackTransectionAmount,
  addMemberToEqualTransection,
  getAllTransection,
  addMemberToCustomTransection,
  deleteMemberFromEqualTransection,
  addMemberToTransaction,
  leaveAMemberFromGroup
};
