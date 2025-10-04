import React, { useMemo } from 'react';
import Card from '../common/Card';
import { StorageService } from '../../utils/storage';

const SchemeSummaryPanel: React.FC = () => {
  const storage = StorageService.getInstance();
  const schemeTypes = storage.getSchemeTypes();
  const userSchemes = storage.getUserSchemes();
  const transactions = storage.getTransactions();

  const rows = useMemo(() => {
    return schemeTypes.map((t) => {
      const schemesOfType = userSchemes.filter((s) => s.schemeType.id === t.id);
      const schemeIds = new Set(schemesOfType.map((s) => s.id));
      const txOfType = transactions.filter((tx) => schemeIds.has(tx.schemeId));
      const totalAmount = txOfType.reduce((sum, tx) => sum + tx.amount, 0);
      const avgDaily = (() => {
        const withDaily = schemesOfType.filter((s) => typeof s.dailyAmount === 'number');
        if (withDaily.length === 0) return 0;
        return (
          withDaily.reduce((sum, s) => sum + (s.dailyAmount || 0), 0) / withDaily.length
        );
      })();
      return {
        id: t.id,
        name: t.name,
        activeSchemes: schemesOfType.length,
        totalCollected: totalAmount,
        avgDailyAmount: avgDaily,
        interestRate: t.interestRate,
      };
    });
  }, [schemeTypes, userSchemes, transactions]);

  return (
    <div className="space-y-6">
      <Card title="Scheme Summary" subtitle="Counts and totals by scheme type">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Scheme Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Interest %</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Active Schemes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Daily</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Collected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{r.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.interestRate}%</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.activeSchemes}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.avgDailyAmount}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{r.totalCollected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SchemeSummaryPanel;
