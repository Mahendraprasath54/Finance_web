import React, { ReactNode, useContext } from 'react';

export type ViewId = 'dashboard' | 'users' | 'entry' | 'reports' | 'payments' | 'notifications' | 'bonus';

interface NavigationState {
  currentView: ViewId;
  navigate: (view: ViewId) => void;
}

const NavigationContext = React.createContext<NavigationState>({
  currentView: 'dashboard',
  navigate: () => {},
});

export const NavigationProvider: React.FC<{ value: NavigationState; children: ReactNode }> = ({ value, children }) => {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => useContext(NavigationContext);
