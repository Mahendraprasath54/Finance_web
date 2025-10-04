import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Settings, 
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { formatDate } from '../utils/calculations';
import Card from './common/Card';
import Button from './common/Button';

interface Notification {
  id: string;
  type: 'reminder' | 'alert' | 'info';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const Notifications: React.FC = () => {
  const storageService = StorageService.getInstance();
  const users = storageService.getUsers();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings' | 'send'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'reminder',
      title: 'Payment Reminder',
      message: 'Rajesh Kumar has a pending payment of ₹500 due today',
      date: new Date(),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'alert',
      title: 'Failed Transaction',
      message: 'Online payment failed for Priya Sharma - Transaction ID: TXN123456',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: '3',
      type: 'info',
      title: 'Scheme Maturity',
      message: 'Daily Savings scheme for 3 customers will mature in 30 days',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      priority: 'medium'
    }
  ]);

  const [notificationConfig, setNotificationConfig] = useState({
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
    reminderDays: [1, 3, 7],
    escalationDays: [7, 14],
    reportSchedule: '19:00',
    autoReminders: true
  });

  const [sendMessage, setSendMessage] = useState({
    type: 'reminder' as 'reminder' | 'alert' | 'info',
    recipients: 'all' as 'all' | 'selected',
    selectedUsers: [] as string[],
    channel: 'email' as 'email' | 'whatsapp' | 'sms',
    subject: '',
    message: '',
    scheduleTime: ''
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSendMessage = () => {
    // Simulate sending message
    alert(`Message sent successfully to ${sendMessage.recipients === 'all' ? 'all customers' : sendMessage.selectedUsers.length + ' selected customers'} via ${sendMessage.channel}!`);
    
    // Reset form
    setSendMessage({
      type: 'reminder',
      recipients: 'all',
      selectedUsers: [],
      channel: 'email',
      subject: '',
      message: '',
      scheduleTime: ''
    });
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <Card 
        title="Notifications" 
        subtitle={`${unreadCount} unread notifications`}
        action={
          <Button size="sm" variant="outline">
            Mark all as read
          </Button>
        }
      >
        <div className="space-y-3">
          {notifications.map(notification => {
            const Icon = notification.type === 'reminder' ? Clock : 
                        notification.type === 'alert' ? AlertCircle : 
                        CheckCircle;
            
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                  notification.read
                    ? 'bg-gray-50 border-gray-300'
                    : notification.priority === 'high'
                    ? 'bg-red-50 border-red-400'
                    : notification.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'alert' 
                        ? 'bg-red-100' 
                        : notification.type === 'reminder' 
                        ? 'bg-yellow-100' 
                        : 'bg-blue-100'
                    }`}>
                      <Icon size={16} className={
                        notification.type === 'alert' 
                          ? 'text-red-600' 
                          : notification.type === 'reminder' 
                          ? 'text-yellow-600' 
                          : 'text-blue-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : notification.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(notification.date)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card title="Notification Settings">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Communication Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail size={20} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationConfig(prev => ({
                    ...prev,
                    emailEnabled: !prev.emailEnabled
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationConfig.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationConfig.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationConfig(prev => ({
                    ...prev,
                    whatsappEnabled: !prev.whatsappEnabled
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationConfig.whatsappEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationConfig.whatsappEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Reminder Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Days Before Due
                </label>
                <div className="flex space-x-2">
                  {[1, 3, 7, 15].map(day => (
                    <button
                      key={day}
                      onClick={() => {
                        const currentDays = [...notificationConfig.reminderDays];
                        const index = currentDays.indexOf(day);
                        if (index > -1) {
                          currentDays.splice(index, 1);
                        } else {
                          currentDays.push(day);
                        }
                        setNotificationConfig(prev => ({
                          ...prev,
                          reminderDays: currentDays
                        }));
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        notificationConfig.reminderDays.includes(day)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Report Time
                </label>
                <input
                  type="time"
                  value={notificationConfig.reportSchedule}
                  onChange={(e) => setNotificationConfig(prev => ({
                    ...prev,
                    reportSchedule: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSendMessage = () => (
    <div className="space-y-6">
      <Card title="Send Notification" subtitle="Send custom messages to customers">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
              <select
                value={sendMessage.type}
                onChange={(e) => setSendMessage(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="reminder">Payment Reminder</option>
                <option value="alert">Important Alert</option>
                <option value="info">Information</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication Channel</label>
              <select
                value={sendMessage.channel}
                onChange={(e) => setSendMessage(prev => ({ ...prev, channel: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recipients"
                    value="all"
                    checked={sendMessage.recipients === 'all'}
                    onChange={(e) => setSendMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                    className="mr-2"
                  />
                  Send to all customers
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recipients"
                    value="selected"
                    checked={sendMessage.recipients === 'selected'}
                    onChange={(e) => setSendMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                    className="mr-2"
                  />
                  Send to selected customers
                </label>
              </div>
            </div>

            {sendMessage.recipients === 'selected' && (
              <div className="mt-3">
                <select
                  multiple
                  value={sendMessage.selectedUsers}
                  onChange={(e) => setSendMessage(prev => ({
                    ...prev,
                    selectedUsers: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  size={5}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.mobileNumber}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple customers
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={sendMessage.subject}
              onChange={(e) => setSendMessage(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter message subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={sendMessage.message}
              onChange={(e) => setSendMessage(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Enter your message here..."
              required
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>Available variables: {'{customer_name}'}, {'{amount_due}'}, {'{due_date}'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time (Optional)</label>
            <input
              type="datetime-local"
              value={sendMessage.scheduleTime}
              onChange={(e) => setSendMessage(prev => ({ ...prev, scheduleTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to send immediately</p>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="flex-1">
              <Send size={16} className="mr-2" />
              {sendMessage.scheduleTime ? 'Schedule Message' : 'Send Message'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setSendMessage({
                type: 'reminder',
                recipients: 'all',
                selectedUsers: [],
                channel: 'email',
                subject: '',
                message: '',
                scheduleTime: ''
              })}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'send', label: 'Send Message', icon: Send }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications & Alerts</h1>
        <p className="text-gray-600">Manage notifications, reminders, and customer communications</p>
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
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'send' && renderSendMessage()}
    </div>
  );
};

export default Notifications;