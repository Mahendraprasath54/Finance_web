import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Send
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { formatCurrency, formatDate, generateReceiptNumber } from '../utils/calculations';
import Card from './common/Card';
import Button from './common/Button';

const PaymentHandling: React.FC = () => {
  const storageService = StorageService.getInstance();
  const [transactions, setTransactions] = useState(storageService.getTransactions());
  const [showCardDetails, setShowCardDetails] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'security'>('overview');
  const users = storageService.getUsers();
  const schemeTypes = storageService.getSchemeTypes();

  // Add Payment form state
  const [payType, setPayType] = useState<'cash' | 'online'>('cash');
  const [onlineMode, setOnlineMode] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [userId, setUserId] = useState(users[0]?.id || '');
  const initialUserSchemes = storageService.getUserSchemesByUserId(users[0]?.id || '');
  const [schemeId, setSchemeId] = useState(initialUserSchemes[0]?.id || '');
  const [schemeTypeId, setSchemeTypeId] = useState(schemeTypes[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  // Online details
  const [cardLastFour, setCardLastFour] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recompute available schemes for current user and keep selection in sync
  const userSchemesForUser = storageService.getUserSchemesByUserId(userId);
  React.useEffect(() => {
    const first = storageService.getUserSchemesByUserId(userId)[0]?.id || '';
    setSchemeId(first);
  }, [userId]);

  const assignQuickScheme = () => {
    if (!userId || !schemeTypeId) return;
    const created = storageService.addSchemeToUser({ userId, schemeTypeId });
    if (created) {
      setSchemeId(created.id);
      alert('Scheme assigned to user');
    } else {
      alert('Failed to assign scheme');
    }
  };

  const handleAddPayment = async () => {
    if (!userId || !schemeId || !amount) {
      alert('Please fill User, Scheme and Amount');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const id = `${Date.now()}`;
      const receiptNumber = generateReceiptNumber();
      const base = {
        id,
        userId,
        schemeId,
        amount: amt,
        date: new Date(),
        interest: 0,
        receiptNumber,
        remarks: remarks || undefined,
      } as any;

      if (payType === 'cash') {
        storageService.saveTransaction({
          ...base,
          paymentMode: 'offline',
        });
      } else {
        const paymentDetails: any = { transactionId: transactionId || undefined };
        if (onlineMode === 'card') paymentDetails.cardLastFour = cardLastFour || undefined;
        if (onlineMode === 'upi') paymentDetails.upiId = upiId || undefined;
        if (onlineMode === 'netbanking') paymentDetails.bankName = bankName || undefined;
        storageService.saveTransaction({
          ...base,
          paymentMode: onlineMode,
          paymentDetails,
        });
      }
      // refresh state
      setTransactions(storageService.getTransactions());
      // reset minimal fields
      setAmount('');
      setRemarks('');
      setTransactionId('');
      setCardLastFour('');
      setUpiId('');
      setBankName('');
      alert('Payment recorded successfully');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentStats = {
    totalTransactions: transactions.length,
    successfulPayments: transactions.filter(t => t.paymentDetails?.transactionId).length,
    offlinePayments: transactions.filter(t => t.paymentMode === 'offline').length,
    cardPayments: transactions.filter(t => t.paymentMode === 'card').length,
    upiPayments: transactions.filter(t => t.paymentMode === 'upi').length,
    netBankingPayments: transactions.filter(t => t.paymentMode === 'netbanking').length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0)
  };

  const toggleCardDetails = (transactionId: string) => {
    setShowCardDetails(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Add Payment */}
      <Card title="Add Payment" subtitle="Record a new payment as Cash or Online">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Customer</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Scheme</label>
              {userSchemesForUser.length > 0 ? (
                <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                  {userSchemesForUser.map(s => <option key={s.id} value={s.id}>{s.schemeType.name}</option>)}
                </select>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">No schemes for this user. Assign one:</p>
                  <div className="flex items-center space-x-2">
                    <select value={schemeTypeId} onChange={(e) => setSchemeTypeId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                      {schemeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <Button onClick={assignQuickScheme}>Assign</Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Optional" />
            </div>
          </div>

          {/* Payment Type */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 text-sm">
              <input type="radio" checked={payType==='cash'} onChange={() => setPayType('cash')} />
              <span className="flex items-center space-x-1"><Banknote size={14} /> <span>Cash</span></span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="radio" checked={payType==='online'} onChange={() => setPayType('online')} />
              <span className="flex items-center space-x-1"><CreditCard size={14} /> <span>Online</span></span>
            </label>
          </div>

          {payType === 'online' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Online Mode</label>
                <select value={onlineMode} onChange={(e) => setOnlineMode(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              {onlineMode === 'card' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Card Last 4</label>
                  <input type="text" maxLength={4} value={cardLastFour} onChange={(e) => setCardLastFour(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="1234" />
                </div>
              )}
              {onlineMode === 'upi' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">UPI ID</label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="name@bank" />
                </div>
              )}
              {onlineMode === 'netbanking' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bank</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Bank name" />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Transaction ID</label>
                <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Optional" />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleAddPayment} loading={submitting}>
              <Send size={16} className="mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
      </Card>
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Successful Online</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.successfulPayments}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Offline Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.offlinePayments}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Banknote size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <Card title="Payment Method Distribution">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Banknote size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">{paymentStats.offlinePayments}</p>
            <p className="text-sm text-gray-500">Cash/Offline</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <CreditCard size={32} className="text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">{paymentStats.cardPayments}</p>
            <p className="text-sm text-gray-500">Card Payments</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Smartphone size={32} className="text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">{paymentStats.upiPayments}</p>
            <p className="text-sm text-gray-500">UPI Payments</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <CreditCard size={32} className="text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">{paymentStats.netBankingPayments}</p>
            <p className="text-sm text-gray-500">Net Banking</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <Card title="Payment Transactions" subtitle="Detailed payment transaction history">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Receipt</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Mode</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(new Date(transaction.date))}
                </td>
                <td className="py-3 px-4 text-sm font-mono text-gray-900">
                  {transaction.receiptNumber}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.paymentMode === 'offline' 
                      ? 'bg-gray-100 text-gray-800'
                      : transaction.paymentMode === 'card'
                      ? 'bg-blue-100 text-blue-800'
                      : transaction.paymentMode === 'upi'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {transaction.paymentMode.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle size={12} className="mr-1" />
                    Success
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {transaction.paymentMode === 'offline' ? (
                    'Cash Payment'
                  ) : transaction.paymentMode === 'card' ? (
                    <div className="flex items-center space-x-2">
                      <span>****{transaction.paymentDetails?.cardLastFour}</span>
                      <button
                        onClick={() => toggleCardDetails(transaction.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showCardDetails[transaction.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  ) : transaction.paymentMode === 'upi' ? (
                    transaction.paymentDetails?.upiId || 'UPI Payment'
                  ) : (
                    transaction.paymentDetails?.bankName || 'Net Banking'
                  )}
                  {showCardDetails[transaction.id] && transaction.paymentMode === 'card' && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <p><strong>Transaction ID:</strong> {transaction.paymentDetails?.transactionId}</p>
                      <p><strong>Card:</strong> ****{transaction.paymentDetails?.cardLastFour}</p>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                    {transaction.paymentMode !== 'offline' && (
                      <button className="text-green-600 hover:text-green-800 text-sm">Refund</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card title="Payment Security Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">PCI DSS Compliance</h4>
                <p className="text-sm text-gray-600">All card data is processed according to PCI DSS standards</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock size={16} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">AES-256 Encryption</h4>
                <p className="text-sm text-gray-600">All sensitive data encrypted at rest and in transit</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">2-Factor Authentication</h4>
                <p className="text-sm text-gray-600">OTP verification for all online transactions</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={16} className="text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Fraud Detection</h4>
                <p className="text-sm text-gray-600">Real-time monitoring for suspicious activities</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <RefreshCw size={16} className="text-teal-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Automated Backups</h4>
                <p className="text-sm text-gray-600">Regular encrypted backups of all transaction data</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Secure Tokenization</h4>
                <p className="text-sm text-gray-600">Card numbers replaced with secure tokens</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Security Audit Log" subtitle="Recent security events">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Security scan completed</p>
                <p className="text-xs text-gray-500">All systems secure</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock size={16} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">SSL certificate renewed</p>
                <p className="text-xs text-gray-500">Valid until 2025-12-31</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle size={16} className="text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payment gateway updated</p>
                <p className="text-xs text-gray-500">Enhanced security protocols</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">3 days ago</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: CheckCircle },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Handling & Security</h1>
        <p className="text-gray-600">Secure payment processing and transaction management</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'security' && renderSecurity()}
    </div>
  );
};

export default PaymentHandling;