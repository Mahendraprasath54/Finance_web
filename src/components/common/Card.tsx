import React, { ReactNode } from 'react';
import { useTheme } from './ThemeContext';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '', action }) => {
  const { darkMode } = useTheme();
  const container = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerBorder = darkMode ? 'border-gray-700' : 'border-gray-200';
  const titleCls = darkMode ? 'text-gray-100' : 'text-gray-900';
  const subtitleCls = darkMode ? 'text-gray-400' : 'text-gray-500';
  return (
    <div className={`${container} rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b ${headerBorder} flex items-center justify-between`}>
          <div>
            {title && (
              <h3 className={`text-lg font-semibold ${titleCls}`}>{title}</h3>
            )}
            {subtitle && (
              <p className={`text-sm mt-1 ${subtitleCls}`}>{subtitle}</p>
            )}
          </div>
          {action && (
            <div>{action}</div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;