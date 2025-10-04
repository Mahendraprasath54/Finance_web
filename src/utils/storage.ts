import { User, Transaction, UserScheme, SchemeType, DashboardStats } from '../types';

// Mock data for demonstration
const mockSchemeTypes: SchemeType[] = [
  {
    id: '1',
    name: 'Daily Savings',
    description: 'Save a small amount daily',
    interestRate: 8.5,
    minAmount: 50,
    maxAmount: 1000,
    duration: 365,
    frequency: 'daily'
  },
  {
    id: '2',
    name: 'Monthly Investment',
    description: 'Monthly investment plan',
    interestRate: 10.2,
    minAmount: 1000,
    maxAmount: 50000,
    duration: 365,
    frequency: 'monthly'
  },
  {
    id: '3',
    name: 'Yearly Growth',
    description: 'Annual savings scheme',
    interestRate: 12.5,
    minAmount: 10000,
    maxAmount: 100000,
    duration: 365,
    frequency: 'lumpsum'
  },
  {
    id: '4',
    name: 'Weekly Saver',
    description: 'Contribute weekly with flexible amounts',
    interestRate: 9.0,
    minAmount: 200,
    maxAmount: 5000,
    duration: 365,
    frequency: 'weekly'
  },
  {
    id: '5',
    name: 'Quarterly Bonus',
    description: 'Quarterly deposits with bonus interest',
    interestRate: 11.0,
    minAmount: 2500,
    maxAmount: 100000,
    duration: 365,
    frequency: 'monthly'
  }
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    mobileNumber: '+91 98765 43210',
    permanentAddress: {
      doorNumber: '123',
      street: 'MG Road',
      area: 'Commercial District',
      localAddress: 'Near City Mall',
      city: 'Bangalore',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      pinCode: '560001'
    },
    temporaryAddress: {
      doorNumber: '456',
      street: 'Brigade Road',
      area: 'Central Bangalore',
      localAddress: 'Opposite Metro Station',
      city: 'Bangalore',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      pinCode: '560025'
    },
    employeeId: 'EMP001',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    schemes: []
  },
  {
    id: '2',
    name: 'Priya Sharma',
    mobileNumber: '+91 87654 32109',
    permanentAddress: {
      doorNumber: '789',
      street: 'Anna Salai',
      area: 'T. Nagar',
      localAddress: 'Near Phoenix Mall',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pinCode: '600017'
    },
    status: 'active',
    createdAt: new Date('2024-02-20'),
    schemes: []
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: '1',
    schemeId: '1',
    amount: 500,
    date: new Date('2024-12-01'),
    paymentMode: 'offline',
    interest: 1.16,
    receiptNumber: 'FST241201001',
    remarks: 'Daily savings deposit'
  },
  {
    id: '2',
    userId: '2',
    schemeId: '2',
    amount: 5000,
    date: new Date('2024-12-02'),
    paymentMode: 'upi',
    paymentDetails: {
      transactionId: 'UPI12345678',
      upiId: 'priya@paytm'
    },
    interest: 13.97,
    receiptNumber: 'FST241202002'
  }
];

export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Users
  getUsers(): User[] {
    const stored = localStorage.getItem('fst_users');
    return stored ? JSON.parse(stored) : mockUsers;
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('fst_users', JSON.stringify(users));
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(user => user.id === id);
  }

  // Transactions
  getTransactions(): Transaction[] {
    const stored = localStorage.getItem('fst_transactions');
    return stored ? JSON.parse(stored) : mockTransactions;
  }

  saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('fst_transactions', JSON.stringify(transactions));
  }

  getTransactionsByUserId(userId: string): Transaction[] {
    return this.getTransactions().filter(t => t.userId === userId);
  }

  getTransactionsBySchemeId(schemeId: string): Transaction[] {
    return this.getTransactions().filter(t => t.schemeId === schemeId);
  }

  // Schemes
  getSchemeTypes(): SchemeType[] {
    const stored = localStorage.getItem('fst_scheme_types');
    return stored ? JSON.parse(stored) : mockSchemeTypes;
  }

  getUserSchemes(): UserScheme[] {
    const stored = localStorage.getItem('fst_user_schemes');
    if (stored) return JSON.parse(stored);

    // Mock user schemes
    return [
      {
        id: '1',
        userId: '1',
        schemeType: mockSchemeTypes[0],
        startDate: new Date('2024-01-15'),
        duration: 365,
        dailyAmount: 500,
        totalAmount: 182500,
        interestRate: 8.5,
        currentBalance: 15000,
        status: 'active'
      },
      {
        id: '2',
        userId: '2',
        schemeType: mockSchemeTypes[1],
        startDate: new Date('2024-02-20'),
        duration: 365,
        totalAmount: 60000,
        interestRate: 10.2,
        currentBalance: 25000,
        status: 'active'
      }
    ];
  }

  saveUserScheme(scheme: UserScheme): void {
    const schemes = this.getUserSchemes();
    const existingIndex = schemes.findIndex(s => s.id === scheme.id);
    
    if (existingIndex >= 0) {
      schemes[existingIndex] = scheme;
    } else {
      schemes.push(scheme);
    }
    
    localStorage.setItem('fst_user_schemes', JSON.stringify(schemes));
  }

  getUserSchemesByUserId(userId: string): UserScheme[] {
    return this.getUserSchemes().filter(s => s.userId === userId);
  }

  addSchemeToUser(params: {
    userId: string;
    schemeTypeId: string;
    startDate?: Date;
    duration?: number; // in days
    dailyAmount?: number;
    totalAmount?: number;
    interestRate?: number;
  }): UserScheme | undefined {
    const types = this.getSchemeTypes();
    const schemeType = types.find(t => t.id === params.schemeTypeId);
    if (!schemeType) return undefined;

    const id = `${Date.now()}`;
    // Derive defaults
    const duration = params.duration ?? schemeType.duration;
    const interestRate = params.interestRate ?? schemeType.interestRate;
    const startDate = params.startDate ?? new Date();
    const totalAmount = params.totalAmount ?? (params.dailyAmount ? params.dailyAmount * duration : schemeType.minAmount * duration);
    const newScheme: UserScheme = {
      id,
      userId: params.userId,
      schemeType,
      startDate,
      duration,
      dailyAmount: params.dailyAmount,
      totalAmount,
      interestRate,
      currentBalance: 0,
      status: 'active'
    };
    this.saveUserScheme(newScheme);
    return newScheme;
  }

  // Dashboard Stats
  getDashboardStats(): DashboardStats {
    const users = this.getUsers();
    const transactions = this.getTransactions();
    const schemes = this.getUserSchemes();
    
    const today = new Date();
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.toDateString() === today.toDateString();
    });

    const totalInvestment = transactions.reduce((sum, t) => sum + t.amount, 0);
    const todayCollection = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalCustomers: users.filter(u => u.status === 'active').length,
      activeSchemes: schemes.filter(s => s.status === 'active').length,
      totalInvestment,
      pendingDues: 0, // This would need more complex calculation
      completedCycles: schemes.filter(s => s.status === 'completed').length,
      todayCollection,
      monthlyGrowth: 12.5 // Mock data
    };
  }

  // Search and Filter
  searchUsers(query: string): User[] {
    const users = this.getUsers();
    const lowerQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.mobileNumber.includes(query) ||
      user.employeeId?.toLowerCase().includes(lowerQuery) ||
      user.permanentAddress.city.toLowerCase().includes(lowerQuery)
    );
  }

  filterTransactionsByPeriod(period: 'weekly' | 'monthly' | 'yearly'): Transaction[] {
    const transactions = this.getTransactions();
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  }
}