import mongoose from 'mongoose';
import { getRangeFromQuery } from './report.utils';
import { TransactionModel } from '../incomeAndExpances/incomeAndexpence.model';

interface TotalsGroup {
  _id: 'income' | 'expense' | string;
  total: number;
}

interface CategoryGroup {
  _id: string;
  transactionType: 'income' | 'expense';
  total: number;
}

interface TransactionItem {
  _id: string;
  transaction_Code: string;
  amount: number;
  transactionType: 'income' | 'expense';
  date: string;
  description?: string;
  typeName?: string;
}

interface GroupedPeriod {
  _id: string | number; // e.g., '2025-07-22' or ISO week number
  total: number;
  transactions: TransactionItem[];
}

interface MonthlyReportResult {
  totals: TotalsGroup[];
  byCategory: CategoryGroup[];
  daily: GroupedPeriod[];
  weekly: GroupedPeriod[];
  monthly: GroupedPeriod[];
  transactions: TransactionItem[];
}

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
                  startOfWeek: 'monday', // or 'sunday' if you prefer
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
            },
          },
        ],
      },
    },
  ];

  const [result] =
    await TransactionModel.aggregate<MonthlyReportResult>(pipeline);

  const totals: Record<string, number> = { income: 0, expense: 0 };
  (result.totals || []).forEach((t) => {
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
