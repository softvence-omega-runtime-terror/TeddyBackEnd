export type TUserRole = 'admin' | 'user';

export const userRole = {
  user: 'user',
  admin: 'admin',
} as const;

 export const transactionType = {
  'expense':'expense',
  'income':'income'
} as const

export type TErrorSource = {
  path: string | number;
  message: string;
}[];
