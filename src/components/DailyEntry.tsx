import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calculator, 
  CreditCard, 
  Smartphone,
  Banknote,
  Receipt,
  Calendar
} from 'lucide-react';
import { Transaction, User, UserScheme, PaymentMode } from '../types';
import { StorageService } from '../utils/storage';
import { formatCurrency, generateReceiptNumber, calculateInterest } from '../utils/calculations';
import Card from './common/Card';
import Button from './common/Button';

const DailyEntry: React.FC = () => {
  const storageService = StorageService.getInstance();
  const [users] = useState<User[]>(storageService.getUsers());
  const [userSchemes] = useState<UserScheme[]>(storageService.getUserSchemes());
  const [transactions, setTransactions] = useState<Transaction[]>(storageService.getTransactions());
  
  const [formData, setFormData] = useState({
    userId: '',
    schemeId: '',
    amount: '',
    paymentMode: 'offline' as PaymentMode,
    remarks: '',
    cardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: ''
    },
    upiId: '',
    bankName: ''
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<UserScheme | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [calculatedInterest, setCalculatedInterest] = useState(0);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setFormData(prev => ({ ...prev, userId, schemeId: '' }));
    setSelectedScheme(null);
  };

  const handleSchemeSelect = (schemeId: string) => {
    const scheme = userSchemes.find(s => s.id === schemeId);
    setSelectedScheme(scheme || null);
    setFormData(prev => ({ ...prev, schemeId }));
    
    // Calculate interest when scheme is selected
    if (scheme && formData.amount) {
      const interest = calculateInterest(
        parseFloat(formData.amount),
        scheme.interestRate,
        1 // Daily interest
      );
      setCalculatedInterest(interest);
    }
  };

  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({ ...prev, amount }));
    
    if (selectedScheme && amount) {
      const interest = calculateInterest(
        parseFloat(amount),
        selectedScheme.interestRate,
        1
      );
      setCalculatedInterest(interest);
    }
  };

  const handleSubmitTransaction = () => {
    if (!selectedUser || !selectedScheme || !formData.amount) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      schemeId: selectedScheme.id,
      amount: parseFloat(formData.amount),
      date: new Date(),
      paymentMode: formData.paymentMode,
      interest: calculatedInterest,
      receiptNumber: generateReceiptNumber(),
      remarks: formData.remarks,
      paymentDetails: formData.paymentMode === 'offline' ? undefined : {
        transactionId: `TXN${Date.now()}`,
        cardLastFour: formData.paymentMode === 'card' ? formData.cardDetails.cardNumber.slice(-4) : undefined,
        bankName: formData.bankName || undefined,
        upiId: formData.upiId || undefined
      }
    };

    storageService.saveTransaction(newTransaction);
    setTransactions(storageService.getTransactions());
    
    // Reset form
    setFormData({
      userId: '',
      schemeId: '',
      amount: '',
      paymentMode: 'offline',
      remarks: '',
      cardDetails: {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        holderName: ''
      },
      upiId: '',
      bankName: ''
    });
    setSelectedUser(null);
    setSelectedScheme(null);
    setShowPaymentForm(false);
    setCalculatedInterest(0);
    
    alert('Transaction recorded successfully!');
  };

  const userSchemesByUser = selectedUser 
    ? userSchemes.filter(scheme => scheme.userId === selectedUser.id && scheme.status === 'active')
    : [];

  const todayTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const today = new Date();
    return transactionDate.toDateString() === today.toDateString();
  });

  const paymentModeIcons = {
    offline: Banknote,
    card: CreditCard,
    upi: Smartphone,
    netbanking: CreditCard
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Entry</h1>
        <p className="text-gray-600">Record today's transactions and payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card title="New Transaction Entry">
            <div className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer *</label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {users.filter(u => u.status === 'active').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.mobileNumber}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUser && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Selected:</strong> {selectedUser.name} | {selectedUser.mobileNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Scheme Selection */}
              {selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Scheme *</label>
                  <select
                    value={formData.schemeId}
                    onChange={(e) => handleSchemeSelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a scheme...</option>
                    {userSchemesByUser.map(scheme => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.schemeType.name} - {formatCurrency(scheme.currentBalance)} current balance
                      </option>
                    ))}
                  </select>
                  {selectedScheme && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-800">
                          <strong>Scheme:</strong> {selectedScheme.schemeType.name}
                        </span>
                        <span className="text-sm text-green-800">
                          <strong>Interest Rate:</strong> {selectedScheme.interestRate}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount and Interest */}
              {selectedScheme && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calculated Interest</label>
                    <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Calculator size={20} className="text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{formatCurrency(calculatedInterest)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Mode */}
              {formData.amount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['offline', 'card', 'upi', 'netbanking'] as PaymentMode[]).map(mode => {
                      const Icon = paymentModeIcons[mode];
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMode: mode }))}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center transition-all duration-200 ${
                            formData.paymentMode === mode
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Icon size={24} className="mb-1" />
                          <span className="text-sm font-medium capitalize">
                            {mode === 'offline' ? 'Cash' : mode}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes about this transaction..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => formData.paymentMode === 'offline' ? handleSubmitTransaction() : setShowPaymentForm(true)}
                  disabled={!formData.userId || !formData.schemeId || !formData.amount}
                  className="flex-1"
                >
                  {formData.paymentMode === 'offline' ? 'Record Payment' : 'Process Payment'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setFormData({
                    userId: '',
                    schemeId: '',
                    amount: '',
                    paymentMode: 'offline',
                    remarks: '',
                    cardDetails: {
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                      holderName: ''
                    },
                    upiId: '',
                    bankName: ''
                  });
                  setSelectedUser(null);
                  setSelectedScheme(null);
                  setCalculatedInterest(0);
                }} className="flex-1">
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Summary */}
        <div>
          <Card title="Today's Summary" subtitle={`${todayTransactions.length} transactions`}>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Collection</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(todayTransactions.reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {todayTransactions.slice(-5).reverse().map(transaction => {
                  const user = users.find(u => u.id === transaction.userId);
                  const Icon = paymentModeIcons[transaction.paymentMode];
                  return (
                    <div key={transaction.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Icon size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {todayTransactions.length === 0 && (
                <div className="text-center py-8">
                  <Calendar size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No transactions today</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.paymentMode === 'card' ? 'Card Payment' : 
                 formData.paymentMode === 'upi' ? 'UPI Payment' : 'Net Banking'}
              </h3>
            </div>
            
            <div className="p-6">
              {formData.paymentMode === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
                    <input
                      type="text"
                      value={formData.cardDetails.holderName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cardDetails: { ...prev.cardDetails, holderName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={formData.cardDetails.cardNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cardDetails: { ...prev.cardDetails, cardNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={formData.cardDetails.expiryDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          cardDetails: { ...prev.cardDetails, expiryDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={formData.cardDetails.cvv}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          cardDetails: { ...prev.cardDetails, cvv: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMode === 'upi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="username@paytm"
                  />
                </div>
              )}

              {formData.paymentMode === 'netbanking' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-4 mt-6">
                <Button onClick={handleSubmitTransaction} className="flex-1">
                  <Receipt size={16} className="mr-2" />
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyEntry;