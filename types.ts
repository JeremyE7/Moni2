export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO String YYYY-MM-DD
}

export type ReminderType = 'none' | 'payment' | 'cancel';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  billingDay: number; // 1-31
  active: boolean;
  reminderType?: ReminderType;
  reminderDays?: number; // Custom days for payment reminders
}

export interface MoniData {
  transactions: Transaction[];
  subscriptions: Subscription[];
}

export type ViewState = 'dashboard' | 'transactions' | 'subscriptions' | 'settings';