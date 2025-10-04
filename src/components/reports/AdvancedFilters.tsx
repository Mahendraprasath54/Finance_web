import React from 'react';
import Button from '../common/Button';
import { User } from '../../types';

interface AdvancedFiltersProps {
  users: User[];
  show: boolean;
  apply: boolean;
  amountMin: string;
  amountMax: string;
  paymentMode: string;
  userId: string;
  onToggleShow: () => void;
  onToggleApply: (checked: boolean) => void;
  onAmountMinChange: (v: string) => void;
  onAmountMaxChange: (v: string) => void;
  onPaymentModeChange: (v: string) => void;
  onUserIdChange: (v: string) => void;
  onReset: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  users,
  show,
  apply,
  amountMin,
  amountMax,
  paymentMode,
  userId,
  onToggleShow,
  onToggleApply,
  onAmountMinChange,
  onAmountMaxChange,
  onPaymentModeChange,
  onUserIdChange,
  onReset,
}) => {
  return (
    <div>
      <Button variant="outline" onClick={onToggleShow}>
        {show ? 'Hide' : 'Advanced Filters'}
      </Button>

      {show && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Amount</label>
              <input
                type="number"
                value={amountMin}
                onChange={(e) => onAmountMinChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Amount</label>
              <input
                type="number"
                value={amountMax}
                onChange={(e) => onAmountMaxChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => onPaymentModeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Any</option>
                <option value="offline">Offline</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Netbanking</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Customer</label>
              <select
                value={userId}
                onChange={(e) => onUserIdChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Any</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={apply}
                onChange={(e) => onToggleApply(e.target.checked)}
              />
              <span>Apply advanced filters</span>
            </label>
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
