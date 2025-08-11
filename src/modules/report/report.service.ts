import mongoose from 'mongoose';
import { getRangeFromQuery } from './report.utils';
import { TransactionModel } from '../incomeAndExpances/incomeAndexpence.model';

interface TransactionItem {
  _id: string;
  transaction_Code: string;
  amount: number;
  transactionType: 'income' | 'expense';
  date: string;
  description?: string;
  typeName?: string;
  inDebt: boolean;
  borrowedOrLendAmount: number;
  debtType: 'borrowed' | 'lent';
}

interface GroupedPeriod {
  _id: string | number;
  total: number;
  transactions: TransactionItem[];
}

// ... other interfaces

export async function getMonthlyReport(userId: string, query: any) {
  const { start, end } = getRangeFromQuery(query);

  const pipeline: mongoose.PipelineStage[] = [
    {
      $addFields: {
        dateObj: {
          $dateFromString: { dateString: '$date', timezone: '+06:00' },
        },
      },
    },
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        dateObj: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totals: [
          { $group: { _id: '$transactionType', total: { $sum: '$amount' } } },
        ],
        byCategory: [
          { $match: { typeName: { $ne: null, $exists: true } } },
          {
            $group: {
              _id: '$typeName',
              transactionType: { $first: '$transactionType' },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
        ],
        daily: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateObj' } },
              total: { $sum: '$amount' },
              transactions: {
                $push: {
                  _id: '$_id',
                  transactionType: '$transactionType',
                  transaction_Code: '$transaction_Code',
                  date: '$date',
                  amount: '$amount',
                  description: '$description',
                  typeName: '$typeName',
                  inDebt: '$inDebt',
                  borrowedOrLendAmount: '$borrowedOrLendAmount',
                  debtType: {
                    $cond: { if: '$inDebt', then: 'borrowed', else: 'lent' },
                  },
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
        weekly: [
          {
            $addFields: {
              weekStartDate: {
                $dateTrunc: {
                  date: '$dateObj',
                  unit: 'week',
                  startOfWeek: 'monday',
                },
              },
              weekEndDate: {
                $dateAdd: {
                  startDate: {
                    $dateTrunc: {
                      date: '$dateObj',
                      unit: 'week',
                      startOfWeek: 'monday',
                    },
                  },
                  unit: 'day',
                  amount: 6,
                },
              },
            },
          },
          {
            $group: {
              _id: '$weekStartDate',
              weekStartDate: { $first: '$weekStartDate' },
              weekEndDate: { $first: '$weekEndDate' },
              total: { $sum: '$amount' },
              transactions: {
                $push: {
                  _id: '$_id',
                  transactionType: '$transactionType',
                  transaction_Code: '$transaction_Code',
                  date: '$date',
                  amount: '$amount',
                  description: '$description',
                  typeName: '$typeName',
                  inDebt: '$inDebt',
                  borrowedOrLendAmount: '$borrowedOrLendAmount',
                  debtType: {
                    $cond: { if: '$inDebt', then: 'borrowed', else: 'lent' },
                  },
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
        monthly: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$dateObj' } },
              total: { $sum: '$amount' },
              transactions: {
                $push: {
                  _id: '$_id',
                  transactionType: '$transactionType',
                  transaction_Code: '$transaction_Code',
                  date: '$date',
                  amount: '$amount',
                  description: '$description',
                  typeName: '$typeName',
                  inDebt: '$inDebt',
                  borrowedOrLendAmount: '$borrowedOrLendAmount',
                  debtType: {
                    $cond: { if: '$inDebt', then: 'borrowed', else: 'lent' },
                  },
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
        transactions: [
          { $sort: { dateObj: -1 } },
          {
            $project: {
              _id: 1,
              transaction_Code: 1,
              amount: 1,
              transactionType: 1,
              date: 1,
              description: 1,
              typeName: 1,
              inDebt: 1,
              borrowedOrLendAmount: 1,
              debtType: {
                $cond: { if: '$inDebt', then: 'borrowed', else: 'lent' },
              },
            },
          },
        ],
      },
    },
  ];

  const [result] = await TransactionModel.aggregate(pipeline);

  const totals: Record<string, number> = { income: 0, expense: 0 };
  (result.totals || []).forEach((t : any) => {
    totals[t._id] = t.total;
  });

  const net = (totals.income || 0) - (totals.expense || 0);

  return {
    totals,
    net,
    byCategory: result.byCategory || [],
    daily: result.daily || [],
    weekly: result.weekly || [],
    monthly: result.monthly || [],
    transactions: result.transactions || [],
  };
}
