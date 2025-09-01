import cron from 'node-cron';
import { Types } from 'mongoose';
import { RecurringTransactionModel, TRecurringTransaction, TRecurringUnit } from '../modules/incomeAndExpances/recurringTransaction.model';
import incomeAndExpensesService from '../modules/incomeAndExpances/incomeAndexpence.service';

// Compute the next run date by unit
const addByUnit = (date: Date, every: number, unit: TRecurringUnit): Date => {
  const d = new Date(date);
  switch (unit) {
    case 'minute':
      d.setMinutes(d.getMinutes() + every);
      break;
    case 'hour':
      d.setHours(d.getHours() + every);
      break;
    case 'day':
      d.setDate(d.getDate() + every);
      break;
    case 'week':
      d.setDate(d.getDate() + 7 * every);
      break;
    case 'month':
      d.setMonth(d.getMonth() + every);
      break;
  }
  return d;
};

// Ensure base payload is clean: never carry repeat config into Transaction creation
const sanitizeBasePayload = (payload: any) => {
  const { repeat, ...rest } = payload || {};
  return rest;
};

const processRecurring = async () => {
  const now = new Date();
  // find all active schedules due to run
  const dueList: TRecurringTransaction[] = await RecurringTransactionModel.find({
    isActive: true,
    nextRunAt: { $lte: now },
  }).lean();

  for (const schedule of dueList) {
    try {
      const userId = schedule.user_id as unknown as Types.ObjectId;
      const basePayload = sanitizeBasePayload(schedule.basePayload);

      // set date to now ISO if not present; otherwise keep user-specified date
      // Important: system expects date as string; we'll default to now.toISOString()
      const payload = {
        ...basePayload,
        // Always stamp with execution time
        date: new Date().toISOString(),
      };

      // Create the transaction(s)
      await incomeAndExpensesService.addIncomeOrExpenses(userId, payload);

      // update the schedule
      const incRunCount = (schedule.runCount || 0) + 1;
      let isActive = true;
      const nextRunAt = addByUnit(schedule.nextRunAt || schedule.startAt, schedule.every, schedule.unit);

      // respect endAt or maxOccurrences
      if ((schedule.maxOccurrences && incRunCount >= schedule.maxOccurrences) || (schedule.endAt && nextRunAt > schedule.endAt)) {
        isActive = false;
      }

      await RecurringTransactionModel.updateOne(
        { _id: (schedule as any)._id },
        {
          $set: {
            lastRunAt: now,
            nextRunAt,
            isActive,
          },
          $inc: { runCount: 1 },
        }
      );
    } catch (err) {
      // Log and continue with other schedules
      console.error('Recurring schedule processing failed:', err);
    }
  }
};

let taskStarted = false;
export const startRecurringScheduler = () => {
  if (taskStarted) return; // prevent duplicate schedulers
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processRecurring();
  });
  taskStarted = true;
};
