import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = 'http://localhost:5000/api'; // Update this with your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  // Get all users with pagination and filtering
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    scheme?: string;
    search?: string;
  }) => {
    console.log('Fetching users with params:', params);
    const response = await api.get('/users', { params });
    console.log('Raw API response:', response);
    
    // If response.data exists and has a data property, process it
    if (response.data) {
      const usersData = response.data.data || response.data;
      const usersArray = Array.isArray(usersData) ? usersData : [];
      
      const processedUsers = usersArray.map((user: any) => {
        if (!user) return null;
        return {
          ...user,
          id: user._id || user.id, // Ensure id is always set
          _id: user._id || user.id, // Ensure _id is always set
          name: user.name || '',
          mobileNumber: user.mobileNumber || '',
          employeeId: user.employeeId || '',
          schemes: Array.isArray(user.schemes) ? user.schemes : [],
          isSameAsPermanent: user.isSameAsPermanent !== undefined ? user.isSameAsPermanent : true,
          permanentAddress: user.permanentAddress || {},
          temporaryAddress: user.temporaryAddress || {},
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }).filter(Boolean);
      
      console.log('Processed users from API:', processedUsers);
      
      // Return the processed data in the expected format
      if (response.data.data) {
        return {
          ...response.data,
          data: processedUsers
        };
      }
      
      return processedUsers;
    }
    
    console.warn('Unexpected API response format:', response);
    return [];
  },

  // Get a single user by ID
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    if (response.data) {
      response.data = {
        ...response.data,
        id: response.data._id || response.data.id
      };
    }
    return response.data;
  },

  // Create a new user
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update a user
  updateUser: async (id: string, userData: Partial<User>) => {
    try {
      // Ensure we're using the correct ID field
      const userId = id.startsWith('_') ? id.slice(1) : id;
      const response = await api.put(`/users/${userId}`, userData);
      // Ensure the response has an id field
      if (response.data) {
        response.data = {
          ...response.data,
          id: response.data._id || response.data.id || userId
        };
      }
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data?.message || 'Failed to update user');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(error.message || 'Error updating user');
      }
    }
  },

  // Delete a user
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api;
