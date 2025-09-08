import { model, Schema } from "mongoose"
import { TGroupTransaction } from "./groupTransection.interface"

const groupTransactionSchema = new Schema<TGroupTransaction>({
    groupId: { type: Number, required: false, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: false },
    ownerEmail: { type: String, required: false },
    groupName: { type: String, required: true },
    groupMembers: { type: [String], required: false, default: [] },
    groupExpenses: {
        type: [{
            expenseDate: { type: Date, required: true },
            totalExpenseAmount: { type: Number, required: true },
            currency: { type: String, enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD'], required: true },
            category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
            note: { type: String, required: false },
            paidBy: {
                type: {
                    type: String,
                    enum: ['individual', 'multiple'],
                    required: true
                },
                memberEmail: { type: String, required: function (this: any) { return this.paidBy.type === 'individual'; } },
                amount: { type: Number, required: function (this: any) { return this.paidBy.type === 'individual'; } },
                payments: {
                    type: [{
                        memberEmail: { type: String, required: true },
                        amount: { type: Number, required: true }
                    }],
                    required: function (this: any) { return this.paidBy.type === 'multiple'; }
                }
            },
            shareWith: {
                type: {
                    type: String,
                    enum: ['equal', 'custom'],
                    required: true
                },
                members: {
                    type: [String],
                    required: function (this: any) { return this.shareWith.type === 'equal'; }
                },
                shares: {
                    type: [{
                        memberEmail: { type: String, required: true },
                        amount: { type: Number, required: true }
                    }],
                    required: function (this: any) { return this.shareWith.type === 'custom'; }
                }
            }
        }],
        default: []
    }
},{timestamps:true});

export const GroupTransactionModel = model<TGroupTransaction>('GroupTransaction', groupTransactionSchema);