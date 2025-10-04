import React, { ReactNode, useContext } from 'react';

interface ThemeState {
  darkMode: boolean;
}

const ThemeContext = React.createContext<ThemeState>({ darkMode: false });

export const ThemeProvider: React.FC<{ value: ThemeState; children: ReactNode }> = ({ value, children }) => {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
