import { Types } from "mongoose";

// Assuming TUserRole is an enum based on previous context
export type TUserRole = 'admin' | 'user';

export type TInterviewsAvailable = number | 'unlimited';

export type TUser = {
  img?: string,
  name: string;
  phone?: string;
  email: string;
  password: string;
  // confirmPassword?: string;
  agreedToTerms?: boolean; // Fixed typo: agreedToTerms -> agreedToTerms
  role: TUserRole;
  allowPasswordChange?: boolean;
  sentOTP?: string; // Made optional
  OTPVerified?: boolean; // Made optional
  isProfileUpdated?: boolean;
  isDeleted?: boolean; // Changed to boolean
  isBlocked?: boolean;
  isLoggedIn?: boolean;
  loggedOutTime?: Date;
  passwordChangeTime?: Date;
  fcmToken?: string;
};

export type TFriend = {
  name: string;
  email: string;
  user_id?: Types.ObjectId;
  isAppUser: boolean;
  nickname?: string;
  tags?: string[];
  profileImage?: string;
  phone?: string;
  addedAt?: Date;
  lastInteraction?: Date;
  isFavorite?: boolean;
  status: 'pending' | 'accepted' | 'blocked';
  mutualFriendsCount?: number;
  notes?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
};

export type TProfile = {
  name: string;
  phone?: string;
  email: string;
  friends?: TFriend[];
  monthStart?: Date;
  monthEnd?: Date;
  aiChatCount?: number; // Made optional to align with schema
  chatList_id?: Types.ObjectId; // Optional to align with schema
  maxGroups?: number; // Optional to align with schema
  totalCreatedGroups?: number;
  groupList?: Types.ObjectId[]; // Optional to align with schema
  assistantType: "Supportive_Friendly" | "SarcasticTruth-Teller";
  startDate?: Date;
  endDate?: Date;
  plan_id?: Types.ObjectId;
  planPurchaseDate?: Date;
  img?: string;
  emailNotification: boolean;
  user_id: Types.ObjectId;
  notificationList_id?: Types.ObjectId; // Optional to align with schema
  preferredCurrency?: 'USD' | 'EUR' | 'SGD' | 'GBP' | 'AUD';
  // App language preference following ISO 639-1 codes
  language?: TLanguage;
  isDeleted?: boolean;
};

export type TCategory = {
  name: String;
  type: 'personal' | 'group';
  transactionType: 'income' | 'expense';
  user_id: Types.ObjectId;
};

// Supported UI languages (align with the app's language picker)
export type TLanguage = 'en'   // English
  | 'id'  // Bahasa Indonesia
  | 'ms'  // Bahasa Melayu
  | 'ko'  // 한국어 (Korean)
  | 'zh'  // 中文 (Chinese - generic)
  | 'ja'; // 日本語 (Japanese)