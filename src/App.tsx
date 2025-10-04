import React, { useState } from 'react';
import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import DailyEntry from './components/DailyEntry';
import Reports from './components/Reports';
import PaymentHandling from './components/PaymentHandling';
import Notifications from './components/Notifications';
import BonusManagement from './components/bonus/BonusManagement';
import { NavigationProvider, ViewId } from './components/common/NavigationContext';

function App() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'entry':
        return <DailyEntry />;
      case 'reports':
        return <Reports />;
      case 'payments':
        return <PaymentHandling />;
      case 'notifications':
        return <Notifications />;
      case 'bonus':
        return <BonusManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <NavigationProvider value={{ currentView, navigate: (v) => { console.log('Navigate to', v); setCurrentView(v); } }}>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderCurrentView()}
      </Layout>
    </NavigationProvider>
  );
}

export default App;