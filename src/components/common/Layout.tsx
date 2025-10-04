import React, { ReactNode, useEffect, useState } from 'react';
import type { ViewId } from './NavigationContext';
import { ThemeProvider } from './ThemeContext';
import {
  Home, 
  Users, 
  PlusCircle, 
  BarChart3, 
  CreditCard, 
  Bell,
  Settings,
  LogOut,
  Gift
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewId;
  onViewChange: (view: ViewId) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('fst_dark_mode');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fst_dark_mode', JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'entry', label: 'Daily Entry', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'bonus', label: 'Bonus Management', icon: Gift },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 shadow-lg flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FST</span>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>FinTracker</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(v => !v)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'text-yellow-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Toggle Dark Mode"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id as ViewId)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Admin User</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>admin@fintracker.com</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'text-gray-200 hover:bg-red-900/20 hover:text-red-400' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <ThemeProvider value={{ darkMode }}>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </ThemeProvider>
    </div>
  );
};

export default Layout;