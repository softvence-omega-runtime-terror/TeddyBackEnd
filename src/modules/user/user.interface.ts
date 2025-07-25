import { Types } from "mongoose";
import { boolean } from "zod";

// Assuming TUserRole is an enum based on previous context
export type TUserRole = 'admin' | 'user';

export type TInterviewsAvailable = number | 'unlimited';

export type TUser = {
  img:string,
  name: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreedToTerms: boolean; // Fixed typo: agreedToTerms -> agreedToTerms
  role: TUserRole;
  allowPasswordChange: boolean;
  sentOTP?: string; // Made optional
  OTPVerified?: boolean; // Made optional
  isDeleted?: boolean; // Changed to boolean
  isBlocked?: boolean;
  isLoggedIn?: boolean;
  loggedOutTime?: Date;
  passwordChangeTime?: Date;
  fcmToken?: string;
};

export type TProfile = {
  name: string;
  phone?: string;
  email: string;
  monthStart?: Date;
  monthEnd?: Date;
  aiChatCount?: number; // Made optional to align with schema
  chatList_id?: Types.ObjectId; // Optional to align with schema
  maxGroups?: number; // Optional to align with schema
  totalCreatedGroups?:number;
  groupList?: Types.ObjectId[]; // Optional to align with schema
  assistantType : "Supportive_Friendly" | "SarcasticTruth-Teller";
  plan_id?:Types.ObjectId;
  planPurchaseDate?:Date;
  img?: string;
  emailNotification: boolean;
  user_id: Types.ObjectId;
  notificationList_id?: Types.ObjectId; // Optional to align with schema
  isDeleted?: boolean;
};