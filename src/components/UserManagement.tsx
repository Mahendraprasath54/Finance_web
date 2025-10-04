import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Address, SchemeType } from '../types';
import { userApi } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface User {
  id: string;
  _id: string;
  name: string;
  mobileNumber: string;
  employeeId?: string | null; // Made optional and nullable
  schemes: SchemeType[];
  isSameAsPermanent: boolean;
  permanentAddress: Address;
  temporaryAddress: Address;
  createdAt?: string;
  updatedAt?: string;
}

interface Address {
  doorNumber: string;
  street: string;
  area: string;
  localAddress: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
}

const cleanAddress = (address: any) => {
  const cleaned: any = {};
  Object.entries(address).forEach(([key, value]) => {
    if (value !== '' && value !== null) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterScheme, setFilterScheme] = useState<string>('all');
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching users with params:', {
        page: pagination.page,
        limit: pagination.limit,
        scheme: filterScheme === 'all' ? undefined : filterScheme,
        search: debouncedSearchQuery || undefined
      });
      
      // Get users from the API
      const response = await userApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        scheme: filterScheme === 'all' ? undefined : filterScheme,
        search: debouncedSearchQuery || undefined
      });
      
      console.log('API Response:', response);
      
      // Handle the response based on its structure
      let usersData = [];
      let paginationData = null;
      
      // Check if response is an array (direct users array)
      if (Array.isArray(response)) {
        usersData = response;
      } 
      // Check if response has a data property (pagination response)
      else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
        paginationData = response.pagination;
      }
      // If response is an object with users array directly
      else if (response && Array.isArray(response.users)) {
        usersData = response.users;
        paginationData = response.pagination;
      } 
      // If response is a single user object
      else if (response && typeof response === 'object' && response.id) {
        usersData = [response];
      }
      
      console.log('Extracted users data:', usersData);
      
      // Process the users data
      const processedUsers = usersData
        .filter(Boolean) // Remove any null/undefined entries
        .map(user => ({
          id: user.id || user._id,
          _id: user._id || user.id,
          name: user.name || '',
          mobileNumber: user.mobileNumber || '',
          employeeId: user.employeeId || '',
          schemes: Array.isArray(user.schemes) ? user.schemes : [],
          isSameAsPermanent: user.isSameAsPermanent !== undefined ? user.isSameAsPermanent : true,
          permanentAddress: user.permanentAddress || {
            doorNumber: '',
            street: '',
            area: '',
            localAddress: '',
            city: '',
            district: '',
            state: '',
            pinCode: ''
          },
          temporaryAddress: user.temporaryAddress || {
            doorNumber: '',
            street: '',
            area: '',
            localAddress: '',
            city: '',
            district: '',
            state: '',
            pinCode: ''
          },
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString()
        }));
      
      console.log('Processed users:', processedUsers);
      
      // Update the users state
      setUsers(processedUsers);
      
      // Apply local filtering for immediate UI update
      const filtered = applyFilters(processedUsers, filterScheme, debouncedSearchQuery);
      console.log('Filtered users:', filtered);
      setFilteredUsers(filtered);
      
      // Update pagination if we have pagination data
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || filtered.length,
          pages: paginationData.pages || Math.ceil(filtered.length / pagination.limit) || 1
        }));
      } else {
        // If no pagination data, use the filtered count
        setPagination(prev => ({
          ...prev,
          total: filtered.length,
          pages: Math.ceil(filtered.length / pagination.limit) || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filterScheme, debouncedSearchQuery]);
  
  // Apply filters to the users list
  const applyFilters = (usersList: User[], schemeFilter: string, searchQuery: string): User[] => {
    return usersList.filter(user => {
      // Filter by scheme
      if (schemeFilter !== 'all' && (!user.schemes || !user.schemes.includes(schemeFilter as SchemeType))) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesMobile = user.mobileNumber.includes(query);
        const matchesEmployeeId = user.employeeId && user.employeeId.toLowerCase().includes(query);
        const matchesScheme = user.schemes && user.schemes.some(scheme => 
          scheme.toLowerCase().includes(query)
        );
        
        if (!(matchesName || matchesMobile || matchesEmployeeId || matchesScheme)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const resetForm = useCallback(() => {
    const defaultData = {
      ...defaultFormData,
      temporaryAddress: { ...defaultFormData.permanentAddress }
    };
    setFormData(defaultData);
    setSelectedUser(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: isChecked
      }));
      
      if (name === 'isSameAsPermanent' && isChecked) {
        setFormData(prev => ({
          ...prev,
          temporaryAddress: { ...prev.permanentAddress }
        }));
      }
      return;
    }
    
    // Handle number inputs
    if (name === 'mobileNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    // For other inputs
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSchemesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, option => option.value as SchemeType);
    setFormData(prev => ({
      ...prev,
      schemes: options
    }));
  };

  const handleAddressChange = useCallback((
    type: 'permanentAddress' | 'temporaryAddress',
    field: keyof Address,
    value: string
  ) => {
    setFormData(prev => {
      const newAddress: Address = {
        doorNumber: prev[type]?.doorNumber || '',
        street: prev[type]?.street || '',
        area: prev[type]?.area || '',
        localAddress: prev[type]?.localAddress || '',
        city: prev[type]?.city || '',
        district: prev[type]?.district || '',
        state: prev[type]?.state || '',
        pinCode: prev[type]?.pinCode || '',
        [field]: value
      };
      
      if (type === 'permanentAddress' && 
          JSON.stringify(prev.permanentAddress) === JSON.stringify(prev.temporaryAddress)) {
        return {
          ...prev,
          permanentAddress: newAddress,
          temporaryAddress: newAddress
        } as UserFormData;
      }
      
      return {
        ...prev,
        [type]: newAddress
      } as UserFormData;
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterSchemeChange = (scheme: string) => {
    setFilterScheme(scheme);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      mobileNumber: user.mobileNumber || '',
      employeeId: user.employeeId || '',
      schemes: user.schemes || [],
      isSameAsPermanent: user.isSameAsPermanent ?? true,
      permanentAddress: user.permanentAddress || {
        doorNumber: '',
        street: '',
        area: '',
        localAddress: '',
        city: '',
        district: '',
        state: '',
        pinCode: ''
      },
      temporaryAddress: user.temporaryAddress || {
        doorNumber: '',
        street: '',
        area: '',
        localAddress: '',
        city: '',
        district: '',
        state: '',
        pinCode: ''
      }
    });
    setShowAddForm(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!formData.name.trim()) {
        toast.error('Please enter a name');
        return;
      }

      if (!formData.mobileNumber || !/^\d{10}$/.test(formData.mobileNumber)) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }

      // Prepare the user data with proper formatting
      const userData = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber,
        employeeId: formData.employeeId.trim() || '', // Ensure empty string instead of undefined
        schemes: formData.schemes.length > 0 ? formData.schemes : [],
        isSameAsPermanent: formData.isSameAsPermanent,
        permanentAddress: cleanAddress(formData.permanentAddress),
        temporaryAddress: formData.isSameAsPermanent 
          ? cleanAddress(formData.permanentAddress) 
          : cleanAddress(formData.temporaryAddress)
      };

      console.log('Submitting user data:', userData);

      if (selectedUser) {
        // Update existing user
        await userApi.updateUser(selectedUser.id, userData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await userApi.createUser(userData);
        toast.success('User created successfully');
      }

      // Reset form and refresh user list
      setShowAddForm(false);
      setSelectedUser(null);
      setFormData(defaultFormData);
      
      // Refresh the users list
      const response = await userApi.getUsers({});
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      console.error('Error details:', error.response?.data);
      toast.error(errorMessage);
    }
  };
      toast.error('Please enter a name');
      return;
    }
    
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!formData.schemes || formData.schemes.length === 0) {
      toast.error('Please select at least one scheme');
      return;
    }

    const requiredAddressFields = ['doorNumber', 'street', 'area', 'localAddress', 'city', 'district', 'state', 'pinCode'] as const;
    
    for (const field of requiredAddressFields) {
      const value = formData.permanentAddress[field];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        toast.error(`Please enter permanent address ${field}`);
        return;
      }
    }

    const isSameAsPermanent = formData.isSameAsPermanent || 
      JSON.stringify(formData.permanentAddress) === JSON.stringify(formData.temporaryAddress);
    
    if (!isSameAsPermanent) {
      for (const field of requiredAddressFields) {
        const value = formData.temporaryAddress[field];
        if (!value || typeof value !== 'string' || value.trim() === '') {
          toast.error(`Please enter temporary address ${field}`);
          return;
        }
      }
    }
    
    try {
      setIsLoading(true);
      
      const userData = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber,
        employeeId: (formData.employeeId || '').trim() || undefined, // Send undefined to let backend generate ID if empty
        schemes: formData.schemes,
        permanentAddress: { ...formData.permanentAddress },
        temporaryAddress: isSameAsPermanent 
          ? { ...formData.permanentAddress }
          : { ...formData.temporaryAddress },
        isSameAsPermanent
      };
      ``
      if (selectedUser) {
        const userId = selectedUser.id || selectedUser._id;
        if (!userId) {
          throw new Error('No user ID found for update');
        }
        
        const updatedUser = await userApi.updateUser(userId, userData);
        
        // Ensure we have the updated user data with all fields
        const completeUpdatedUser = {
          ...userData,
          id: updatedUser._id || updatedUser.id || userId,
          _id: updatedUser._id || updatedUser.id || userId,
          createdAt: selectedUser.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            (user.id === userId || user._id === userId) 
              ? completeUpdatedUser 
              : user
          )
        );
        toast.success('User updated successfully');
      } else {
        const response = await userApi.createUser(userData);
        console.log('User created successfully:', response);
        
        // Create a complete user object with all required fields
        // Create a properly typed user object
        const newUser: User = {
          id: response._id || response.id,
          _id: response._id || response.id,
          name: response.name || userData.name,
          mobileNumber: response.mobileNumber || userData.mobileNumber,
          employeeId: response.employeeId || userData.employeeId || '', // Ensure employeeId is always a string
          schemes: response.schemes || userData.schemes,
          permanentAddress: response.permanentAddress || userData.permanentAddress,
          temporaryAddress: response.temporaryAddress || (userData.isSameAsPermanent ? userData.permanentAddress : userData.temporaryAddress),
          isSameAsPermanent: response.isSameAsPermanent !== undefined ? response.isSameAsPermanent : userData.isSameAsPermanent,
          createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
          updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date()
        };
        
        // Update the users list with the new user
        setUsers(prevUsers => [newUser, ...prevUsers]);
        setFilteredUsers(prev => [newUser, ...prev]);
        
        // Reset the form and close the modal
        setShowAddForm(false);
        resetForm();
        
        toast.success('User created successfully');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      let errorMessage = 'Failed to save user';
      
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Validation error. Please check all fields.';
        } else if (error.response.status === 409) {
          errorMessage = 'A user with this mobile number or employee ID already exists';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update filtered users whenever users, filterScheme, or search query changes
  useEffect(() => {
    if (users.length > 0) {
      const filtered = applyFilters(users, filterScheme, debouncedSearchQuery);
      setFilteredUsers(filtered);
    }
  }, [users, filterScheme, debouncedSearchQuery]);
  
  // For display, use filteredUsers which is kept in sync with the current filters
  const displayedUsers = filteredUsers;

  useEffect(() => {
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, filterScheme, debouncedSearchQuery, fetchUsers]);

  // Debug information
  console.log('Rendering UserManagement with users:', {
    allUsers: users,
    filteredUsers: filteredUsers,
    isLoading,
    pagination
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {pagination.total} users
            {isLoading && ' (Loading...)'}
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterScheme}
                onChange={(e) => handleFilterSchemeChange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
              >
                <option value="all">All Schemes</option>
                <option value="gold">Gold</option>
                <option value="savings">Savings</option>
                <option value="furniture">Furniture</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* User List Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No users found. Try adjusting your search or add a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schemes
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.mobileNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.employeeId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.schemes?.map((scheme, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {scheme}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    {/* Heroicon name: solid/chevron-left */}
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    // Show page numbers around current page
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    {/* Heroicon name: solid/chevron-right */}
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      id="mobileNumber"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      id="employeeId"
                      value={formData.employeeId || 'Auto-generated'}
                      readOnly
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="schemes" className="block text-sm font-medium text-gray-700">
                    Schemes <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="schemes"
                    name="schemes"
                    multiple
                    required
                    value={formData.schemes}
                    onChange={handleSchemesChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md h-auto min-h-[42px]"
                  >
                    <option value="gold">Gold</option>
                    <option value="savings">Savings</option>
                    <option value="furniture">Furniture</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple schemes</p>
                </div>

                <div className="pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Permanent Address</h4>
                  <AddressForm
                    title="Permanent Address"
                    address={formData.permanentAddress}
                    onChange={(field, value) => handleAddressChange('permanentAddress', field, value)}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isSameAsPermanent"
                      name="isSameAsPermanent"
                      checked={formData.isSameAsPermanent}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSameAsPermanent" className="ml-2 block text-sm text-gray-700">
                      Same as permanent address
                    </label>
                  </div>

                  {!formData.isSameAsPermanent && (
                    <div className="mt-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Temporary Address</h4>
                      <AddressForm
                        title="Temporary Address"
                        address={formData.temporaryAddress}
                        onChange={(field, value) => handleAddressChange('temporaryAddress', field, value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setViewingUser(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{viewingUser.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {viewingUser.mobileNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Employee ID</h5>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Schemes</h5>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {viewingUser.schemes?.map((scheme, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {scheme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-2">Permanent Address</h5>
                  {viewingUser.permanentAddress ? (
                    <div className="text-sm text-gray-900 space-y-1">
                      <p>{viewingUser.permanentAddress.doorNumber}, {viewingUser.permanentAddress.street}</p>
                      <p>{viewingUser.permanentAddress.area}</p>
                      <p>{viewingUser.permanentAddress.localAddress}</p>
                      <p>
                        {viewingUser.permanentAddress.city}, {viewingUser.permanentAddress.district}
                      </p>
                      <p>
                        {viewingUser.permanentAddress.state} - {viewingUser.permanentAddress.pinCode}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No permanent address provided</p>
                  )}
                </div>

                {(!viewingUser.temporaryAddress || 
                  JSON.stringify(viewingUser.permanentAddress) !== JSON.stringify(viewingUser.temporaryAddress)) && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 mb-2">Temporary Address</h5>
                    {viewingUser.temporaryAddress ? (
                      <div className="text-sm text-gray-900 space-y-1">
                        <p>{viewingUser.temporaryAddress.doorNumber}, {viewingUser.temporaryAddress.street}</p>
                        <p>{viewingUser.temporaryAddress.area}</p>
                        <p>{viewingUser.temporaryAddress.localAddress}</p>
                        <p>
                          {viewingUser.temporaryAddress.city}, {viewingUser.temporaryAddress.district}
                        </p>
                        <p>
                          {viewingUser.temporaryAddress.state} - {viewingUser.temporaryAddress.pinCode}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No temporary address provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;