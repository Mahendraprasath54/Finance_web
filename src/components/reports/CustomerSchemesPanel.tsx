import React, { useMemo, useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { StorageService } from '../../utils/storage';
import type { User, UserScheme, SchemeType } from '../../types';

interface Props {}

const CustomerSchemesPanel: React.FC<Props> = () => {
  const storage = StorageService.getInstance();
  const [users] = useState<User[]>(storage.getUsers());
  const [schemeTypes] = useState<SchemeType[]>(storage.getSchemeTypes());
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [dailyAmount, setDailyAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [schemeTypeId, setSchemeTypeId] = useState<string>(schemeTypes[0]?.id || '');
  const [assigning, setAssigning] = useState(false);

  const userSchemes: UserScheme[] = useMemo(() => storage.getUserSchemesByUserId(selectedUserId), [selectedUserId]);

  const assignScheme = async () => {
    if (!selectedUserId || !schemeTypeId) return;
    setAssigning(true);
    try {
      const dAmt = dailyAmount ? parseFloat(dailyAmount) : undefined;
      const dur = duration ? parseInt(duration, 10) : undefined;
      storage.addSchemeToUser({ userId: selectedUserId, schemeTypeId, dailyAmount: dAmt, duration: dur });
      setDailyAmount('');
      setDuration('');
      // trigger a lightweight re-fetch by toggling selected user
      setSelectedUserId(prev => prev);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Select Customer" subtitle="View and manage schemes for a customer">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Customer</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Active Schemes" subtitle="Schemes for selected customer">
        {userSchemes.length === 0 ? (
          <p className="text-sm text-gray-500">No schemes yet for this customer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Scheme</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration (days)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Daily</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {userSchemes.map(s => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{s.schemeType.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.interestRate}%</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.duration}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.dailyAmount ?? '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{s.totalAmount}</td>
                    <td className="py-3 px-4 text-xs"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Assign New Scheme" subtitle="Add a scheme to the selected customer">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Scheme Type</label>
            <select value={schemeTypeId} onChange={(e) => setSchemeTypeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
              {schemeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Daily Amount (optional)</label>
            <input type="number" value={dailyAmount} onChange={(e) => setDailyAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 200" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Duration (days, optional)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 180" />
          </div>
          <div className="flex items-end">
            <Button onClick={assignScheme} loading={assigning} className="w-full">Assign Scheme</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerSchemesPanel;
