import { SchemeType, Transaction, UserScheme } from '../types';

export const calculateInterest = (
  principal: number,
  rate: number,
  days: number
): number => {
  // Simple interest calculation: (P * R * T) / 100
  // Where T is in years, so days/365
  return (principal * rate * (days / 365)) / 100;
};

export const calculateMaturityAmount = (
  principal: number,
  rate: number,
  days: number
): number => {
  const interest = calculateInterest(principal, rate, days);
  return principal + interest;
};

export const calculateDailyInterest = (
  scheme: UserScheme,
  currentDate: Date = new Date()
): number => {
  const daysSinceStart = Math.floor(
    (currentDate.getTime() - scheme.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return calculateInterest(scheme.currentBalance, scheme.interestRate, daysSinceStart);
};

export const calculateRemainingAmount = (
  totalAmount: number,
  paidAmount: number
): number => {
  return Math.max(0, totalAmount - paidAmount);
};

export const calculateSchemeProgress = (
  scheme: UserScheme,
  transactions: Transaction[]
): {
  totalPaid: number;
  remainingAmount: number;
  completionPercentage: number;
  daysRemaining: number;
} => {
  const totalPaid = transactions
    .filter(t => t.schemeId === scheme.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingAmount = calculateRemainingAmount(scheme.totalAmount, totalPaid);
  const completionPercentage = (totalPaid / scheme.totalAmount) * 100;
  
  const currentDate = new Date();
  const endDate = new Date(scheme.startDate);
  endDate.setDate(endDate.getDate() + scheme.duration);
  
  const daysRemaining = Math.max(0, Math.floor(
    (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  return {
    totalPaid,
    remainingAmount,
    completionPercentage,
    daysRemaining
  };
};

export const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const time = Date.now().toString().slice(-6);
  
  return `FST${year}${month}${day}${time}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Handle dates and objects
        if (cell instanceof Date) {
          return formatDate(cell);
        }
        if (typeof cell === 'object') {
          return JSON.stringify(cell).replace(/,/g, ';');
        }
        // Escape commas and quotes
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${formatDate(new Date()).replace(/\s/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};