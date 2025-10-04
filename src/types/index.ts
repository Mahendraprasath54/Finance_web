export type SchemeType = 'gold' | 'savings' | 'furniture';

export interface User {
  id: string;
  _id?: string;  // MongoDB's _id
  name: string;
  mobileNumber: string;
  permanentAddress: Address;
  temporaryAddress: Address;
  employeeId: string;
  schemes: SchemeType[];
  isSameAsPermanent?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Address {
  doorNumber: string;
  street: string;
  area: string;
  localAddress: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface UserScheme {
  id: string;
  userId: string;
  schemeType: SchemeType;
  startDate: Date;
  duration: number; // in days
  dailyAmount?: number;
  totalAmount: number;
  interestRate: number;
  currentBalance: number;
  status: 'active' | 'completed' | 'paused';
}

export interface Transaction {
  id: string;
  userId: string;
  schemeId: string;
  amount: number;
  date: Date;
  paymentMode: PaymentMode;
  paymentDetails?: PaymentDetails;
  interest: number;
  remarks?: string;
  receiptNumber?: string;
}

export interface PaymentDetails {
  transactionId?: string;
  cardLastFour?: string;
  bankName?: string;
  upiId?: string;
  paymentGateway?: string;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  duration: number; // in days
  frequency: 'daily' | 'weekly' | 'monthly' | 'lumpsum';
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  schemeType?: string;
  paymentMode?: PaymentMode;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export type PaymentMode = 'offline' | 'card' | 'upi' | 'netbanking';

export interface DashboardStats {
  totalCustomers: number;
  activeSchemes: number;
  totalInvestment: number;
  pendingDues: number;
  completedCycles: number;
  todayCollection: number;
  monthlyGrowth: number;
}

export interface NotificationConfig {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  reminderDays: number[];
  escalationDays: number[];
  reportSchedule: string;
}