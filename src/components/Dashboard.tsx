import React from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import Card from './common/Card';
import { groupTransactionsByDay, simpleMovingAverage } from '../utils/analytics';
import LineChart from './charts/LineChart';
import { useNavigation } from './common/NavigationContext';
import { useTheme } from './common/ThemeContext';

const Dashboard: React.FC = () => {
  const { navigate } = useNavigation();
  const { darkMode } = useTheme();
  const [showTrend, setShowTrend] = React.useState(false);
  const storageService = StorageService.getInstance();
  const stats = storageService.getDashboardStats();
  const recentTransactions = storageService.getTransactions().slice(-5);
  const users = storageService.getUsers();
  const daySeries = groupTransactionsByDay(storageService.getTransactions(), 30);
  const dayLabels = daySeries.map(p => p.label);
  const dayValues = daySeries.map(p => p.value);
  const daySMA = simpleMovingAverage(dayValues, 7);

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Schemes',
      value: stats.activeSchemes,
      icon: Target,
      color: 'green',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Investment',
      value: formatCurrency(stats.totalInvestment),
      icon: TrendingUp,
      color: 'purple',
      change: '+24%',
      changeType: 'positive'
    },
    {
      title: 'Pending Dues',
      value: formatCurrency(stats.pendingDues),
      icon: Clock,
      color: 'orange',
      change: '-5%',
      changeType: 'positive'
    },
    {
      title: 'Completed Cycles',
      value: stats.completedCycles,
      icon: CheckCircle,
      color: 'teal',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: "Today's Collection",
      value: formatCurrency(stats.todayCollection),
      icon: IndianRupee,
      color: 'pink',
      change: '+18%',
      changeType: 'positive'
    }
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Admin Dashboard</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back! Here's what's happening with your finance tracker today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight size={16} className="text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorMap[stat.color as keyof typeof colorMap]} flex items-center justify-center shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card title="Recent Transactions" subtitle="Latest 5 transactions">
          <div className="space-y-4">
            {recentTransactions.map(transaction => {
              const user = users.find(u => u.id === transaction.userId);
              return (
                <div key={transaction.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <IndianRupee size={16} className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user?.name || 'Unknown User'}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{transaction.paymentMode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(transaction.amount)}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" subtitle="Frequently used operations">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('users')} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 group">
              <Users size={32} className="text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add New User</p>
            </button>
            <button onClick={() => navigate('entry')} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200 group">
              <TrendingUp size={32} className="text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Daily Entry</p>
            </button>
            <button onClick={() => navigate('reports')} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200 group">
              <CheckCircle size={32} className="text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600">Generate Report</p>
            </button>
            <button onClick={() => navigate('notifications')} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors duration-200 group">
              <Clock size={32} className="text-gray-400 group-hover:text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">View Notifications</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-8">
        <Card title="Investment Growth" subtitle="Monthly collection trends">
          <div className="flex items-center justify-end mb-2">
            <label className="text-sm text-gray-600 flex items-center space-x-2">
              <input type="checkbox" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
              <span>Show trend</span>
            </label>
          </div>
          <div className={`h-64 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <LineChart
              labels={dayLabels}
              values={dayValues}
              title={`Last 30 days • Growth ${stats.monthlyGrowth}%`}
              forecastValues={showTrend ? daySMA : undefined}
              forecastLabel="Trend (7d SMA)"
              showPoints={!showTrend}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;