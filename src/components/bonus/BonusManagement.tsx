import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, CheckCircle } from 'lucide-react';
import { userApi } from '../../utils/api';
import { calculateBonus, getWeekNumber, isEligibleForBonus, getNextPaymentDate } from '../../utils/bonusCalculator';

// Define types for our bonus data
type BonusPayment = {
  id: string;
  userId: string;
  amount: number;
  date: string;
  weekNumber: number;
  year: number;
};

type UserWithBonus = {
  id: string;
  _id: string;
  name: string;
  mobileNumber: string;
  employeeId: string;
  schemes: string[];
  schemeStartDate?: Date | string;
  lastPaymentDate?: Date | string;
  bonusPayments?: BonusPayment[];
  nextPaymentDue?: Date;
  isEligibleForBonus?: boolean;
};

export const BonusManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithBonus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [showAddBonus, setShowAddBonus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBonus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Process user data to include bonus information
  const processUserData = (user: any): UserWithBonus => {
    const lastPayment = user.lastPaymentDate ? new Date(user.lastPaymentDate) : null;
    const nextPaymentDue = lastPayment ? getNextPaymentDate(lastPayment) : null;
    const now = new Date();
    
    // Check if payment is due and if it's within the bonus period
    const isPaymentDue = nextPaymentDue && nextPaymentDue <= now;
    const isBonusEligible = isPaymentDue && isEligibleForBonus(now, user.schemeStartDate || user.createdAt);
    
    return {
      ...user,
      bonusPayments: user.bonusPayments || [],
      lastPaymentDate: lastPayment,
      nextPaymentDue,
      isEligibleForBonus: isBonusEligible,
      schemeStartDate: user.schemeStartDate ? new Date(user.schemeStartDate) : user.createdAt
    };
  };

  // Fetch users with their bonus information
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers();
      // Transform the response to include bonus information
      const usersWithBonus = Array.isArray(response) ? response : response?.data || [];
      setUsers(usersWithBonus.map(processUserData));
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate total bonus for a user
  const calculateTotalBonus = (user: UserWithBonus): number => {
    return (user.bonusPayments || []).reduce(
      (sum, payment) => sum + (payment.amount || 0), 0
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScheme = !selectedScheme || 
      (user.schemes && user.schemes.includes(selectedScheme));
    
    return matchesSearch && matchesScheme;
  });

  const viewBonusDetails = (user: any) => {
    // Implement view bonus details logic
    console.log('View bonus details for:', user);
  };

  const handleAddBonus = (user: UserWithBonus) => {
    setSelectedUser(user);
    setShowAddBonus(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedUser || !paymentAmount) return;
    
    try {
      const paymentDate = new Date();
      const bonusAmount = calculateBonus(paymentDate, selectedUser.schemeStartDate || selectedUser.createdAt);
      
      // Create payment record
      const paymentData = {
        userId: selectedUser._id,
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        weekNumber: getWeekNumber(paymentDate).week,
        year: paymentDate.getFullYear(),
        bonus: bonusAmount,
        totalAmount: parseFloat(paymentAmount) + bonusAmount
      };
      
      // In a real app, you would save this to your backend
      console.log('Processing payment:', paymentData);
      
      // Update user's last payment date
      const updatedUser = {
        ...selectedUser,
        lastPaymentDate: paymentDate,
        bonusPayments: [...(selectedUser.bonusPayments || []), paymentData]
      };
      
      // Update the users list
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === selectedUser._id ? processUserData(updatedUser) : u
        )
      );
      
      // Reset form
      setShowAddBonus(false);
      setPaymentAmount('');
      setSelectedUser(null);
      
      alert(`Payment processed successfully! ${bonusAmount > 0 ? `₹${bonusAmount} bonus added.` : ''}`);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Bonus Management</h1>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by name or employee ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
            >
              <option value="">All Schemes</option>
              <option value="gold">Gold</option>
              <option value="savings">Savings</option>
              <option value="furniture">Furniture</option>
            </select>
            
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                setSearchTerm('');
                setSelectedScheme('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found. Try adjusting your search or add a new user.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schemes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bonus
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.mobileNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.schemes?.map((scheme) => (
                          <span 
                            key={scheme} 
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                          >
                            {scheme}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{calculateTotalBonus(user).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {user.nextPaymentDue && (
                          <div className="text-xs text-gray-500 mr-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {new Date(user.nextPaymentDue).toLocaleDateString()}
                          </div>
                        )}
                        {user.isEligibleForBonus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Bonus Eligible
                          </span>
                        )}
                        <button
                          onClick={() => viewBonusDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAddBonus(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Add Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
            <span className="font-medium">{filteredUsers.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={true}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={true}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddBonus && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Payment</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter payment amount"
              />
            </div>
            
            {selectedUser.isEligibleForBonus && (
              <div className="mb-4 p-3 bg-green-50 text-green-800 text-sm rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  This payment is eligible for a ₹5 bonus!
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddBonus(false);
                  setSelectedUser(null);
                  setPaymentAmount('');
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!paymentAmount}
                className={`px-4 py-2 rounded-md text-white ${!paymentAmount ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusManagement;
