import bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';
import { TCategory, TProfile, TUser } from './user.interface';
import { userRole } from '../../constants';

const UserSchema = new Schema<TUser>(
  {
    img: { type: String, required: false },
    name: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: true },
    password: { type: String, required: true },
    agreedToTerms: { type: Boolean, default: true },
    role: { type: String, enum: ['admin', 'user'], default: userRole.user },
    allowPasswordChange: { type: Boolean, default: true },
    sentOTP: { type: String, required: false }, // Made optional
    OTPVerified: { type: Boolean, required: false, default: false }, // Made optional
    isProfileUpdated: { type: Boolean, required: false, default: false },
    isDeleted: { type: Boolean, required: false, default: false },
    isBlocked: { type: Boolean, required: false, default: false },
    isLoggedIn: { type: Boolean, required: false, default: false },
    loggedOutTime: { type: Date, required: false },
    passwordChangeTime: { type: Date, required: false },
    fcmToken: { type: String, required: false, default: null },
  },
  { timestamps: true },
);

const ProfileSchema = new Schema<TProfile>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserCollection' },
    name: { type: String, required: true },
    phone: { type: String, required: false },
    email: { type: String, required: true },
    img: {
      type: String,
      required: false,
      default: 'https://res.cloudinary.com/dpgcpei5u/image/upload/v1747546759/interviewProfile_jvo9jl.jpg',
    },
    friends: [{
      name: { type: String, required: false },
      email: { type: String, required: true },
      user_id: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: false }, // Only if friend is app user
      isAppUser: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'accepted'
      },

    }],
    monthStart: { type: Date, required: false },
    monthEnd: { type: Date, required: false },
    aiChatCount: { type: Number, required: false, default: 100 },
    maxGroups: { type: Number, required: false, default: 3 },
    totalCreatedGroups: { type: Number, required: false, default: 0 },
    groupList: {
      type: [Schema.Types.ObjectId],
      ref: 'ExpenseOrIncomeGroup',
      required: false,
      default: [],
    },
    assistantType: {
      type: String,
      enum: ['Supportive_Friendly', 'SarcasticTruth-Teller'],
      default: 'Supportive_Friendly',
    },
    plan_id: { type: Schema.Types.ObjectId, required: false, ref: 'Plan' },
    planPurchaseDate: { type: Date, required: false },
    currency: { type: String, required: false, enum: ["USD", "EUR", "SGD", "GBP", "AUD"], default: 'USD' },
    language: { type: String, required: false, enum: ["English", "Bahasa_Indonesia", "Bahasa_Malay", "한국어", "中文", "日语"], default: 'English' },
    emailNotification: { type: Boolean, required: true, default: false },
    notificationList_id: { type: Schema.Types.ObjectId, required: false, ref: 'NotificationList' },
    chatList_id: { type: Schema.Types.ObjectId, required: false, ref: 'ChatCollectionList' },
    isDeleted: { type: Boolean, required: false, default: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

const CategorySchema = new Schema<TCategory>({
  name: { type: String, required: true },
  type: { type: String, enum: ['personal', 'group'] },
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserCollection' }
});

export const UserModel = mongoose.model('UserCollection', UserSchema);
export const ProfileModel = mongoose.model('Profile', ProfileSchema);
export const CategoryModel = mongoose.model('Category', CategorySchema);
