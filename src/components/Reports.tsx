import React, { useState } from 'react';
import { 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  IndianRupee,
  FileText,
  Mail,
  MessageSquare
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { formatCurrency, formatDate, exportToCSV } from '../utils/calculations';
import { ReportFilter } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { paymentModeDistribution, amountBySchemeType, groupTransactionsByMonth, userGrowthByMonth } from '../utils/analytics';
import DoughnutChart from './charts/DoughnutChart';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import CustomerSchemesPanel from './reports/CustomerSchemesPanel';
import SchemeSummaryPanel from './reports/SchemeSummaryPanel';
import AdvancedFilters from './reports/AdvancedFilters';
import ExportColumnsSelector from './reports/ExportColumnsSelector';

const Reports: React.FC = () => {
  const storageService = StorageService.getInstance();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'customers' | 'schemes'>('overview');
  const [filter, setFilter] = useState<ReportFilter>({
    period: 'monthly'
  });
  const [showExportModal, setShowExportModal] = useState(false);
  // Advanced Filters (off by default)
  const [advShow, setAdvShow] = useState(false);
  const [advApply, setAdvApply] = useState(false);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [advPaymentMode, setAdvPaymentMode] = useState('');
  const [advUserId, setAdvUserId] = useState('');
  // Export column selection (defaults to current columns)
  const allColumns = ['Receipt Number','Date','Customer Name','Mobile Number','Scheme','Amount','Interest','Payment Mode','Remarks'];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns);
  // Transactions table enhancements (defaults keep current behavior)
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [visibleCols, setVisibleCols] = useState({
    receipt: true,
    date: true,
    customer: true,
    amount: true,
    interest: true,
    mode: true,
  });
  // Drill-down state (independent of Advanced Apply)
  const [advMonth, setAdvMonth] = useState<string>('');
  const [advSchemeTypeId, setAdvSchemeTypeId] = useState<string>('');
  // Presets
  type ReportPreset = {
    name: string;
    period: 'weekly'|'monthly'|'yearly';
    advApply: boolean;
    amountMin: string;
    amountMax: string;
    advPaymentMode: string;
    advUserId: string;
    selectedColumns: string[];
    visibleCols: typeof visibleCols;
  };
  const loadPresets = (): ReportPreset[] => {
    try { return JSON.parse(localStorage.getItem('fst_report_presets') || '[]'); } catch { return []; }
  };
  const [presets, setPresets] = useState<ReportPreset[]>(loadPresets());
  const savePresets = (next: ReportPreset[]) => {
    localStorage.setItem('fst_report_presets', JSON.stringify(next));
    setPresets(next);
  };
  const saveCurrentAsPreset = () => {
    const name = prompt('Preset name');
    if (!name) return;
    const newPreset: ReportPreset = { name, period: constrainedPeriod, advApply, amountMin, amountMax, advPaymentMode, advUserId, selectedColumns, visibleCols };
    const others = presets.filter(p => p.name !== name);
    savePresets([...others, newPreset]);
  };
  const loadPreset = (name: string) => {
    const p = presets.find(x => x.name === name);
    if (!p) return;
    setFilter({ period: p.period });
    setAdvApply(p.advApply);
    setAmountMin(p.amountMin);
    setAmountMax(p.amountMax);
    setAdvPaymentMode(p.advPaymentMode);
    setAdvUserId(p.advUserId);
    setSelectedColumns(p.selectedColumns);
    setVisibleCols(p.visibleCols);
    setPage(1);
  };
  const deletePreset = (name: string) => {
    savePresets(presets.filter(p => p.name !== name));
  };

  const transactions = storageService.getTransactions();
  const users = storageService.getUsers();
  const userSchemes = storageService.getUserSchemes();

  const constrainedPeriod: 'weekly' | 'monthly' | 'yearly' =
    filter.period === 'weekly' || filter.period === 'monthly' || filter.period === 'yearly'
      ? filter.period
      : 'monthly';
  const periodFiltered = storageService.filterTransactionsByPeriod(constrainedPeriod);
  const filteredTransactions = periodFiltered.filter(t => {
    if (!advApply) return true;
    if (amountMin && t.amount < parseFloat(amountMin)) return false;
    if (amountMax && t.amount > parseFloat(amountMax)) return false;
    if (advPaymentMode && t.paymentMode !== advPaymentMode) return false;
    if (advUserId && t.userId !== advUserId) return false;
    return true;
  });
  // Apply independent drill-down filters
  const schemeTypes = storageService.getSchemeTypes();
  const drilledTransactions = filteredTransactions.filter(t => {
    if (advSchemeTypeId) {
      const s = userSchemes.find(us => us.id === t.schemeId);
      if (!s || s.schemeType.id !== advSchemeTypeId) return false;
    }
    if (advMonth) {
      const label = new Date(t.date).toLocaleString('default', { month: 'short' });
      if (label !== advMonth) return false;
    }
    return true;
  });

  // Chart data
  const modeDist = paymentModeDistribution(drilledTransactions);
  const schemeAmount = amountBySchemeType(drilledTransactions, userSchemes);
  const monthlySeries = groupTransactionsByMonth(transactions);
  const monthlyLabels = monthlySeries.map(p => p.label);
  const monthlyValues = monthlySeries.map(p => p.value);
  const userGrowthSeries = userGrowthByMonth(users);
  const userGrowthLabels = userGrowthSeries.map(p => p.label);
  const userGrowthValues = userGrowthSeries.map(p => p.value);

  const reportStats = {
    totalTransactions: drilledTransactions.length,
    totalAmount: drilledTransactions.reduce((sum, t) => sum + t.amount, 0),
    avgTransactionAmount: drilledTransactions.length > 0 
      ? drilledTransactions.reduce((sum, t) => sum + t.amount, 0) / drilledTransactions.length 
      : 0,
    uniqueCustomers: new Set(drilledTransactions.map(t => t.userId)).size,
    totalInterest: drilledTransactions.reduce((sum, t) => sum + t.interest, 0),
    offlinePayments: drilledTransactions.filter(t => t.paymentMode === 'offline').length,
    onlinePayments: drilledTransactions.filter(t => t.paymentMode !== 'offline').length
  };

  const handleExport = (type: 'csv' | 'email' | 'whatsapp') => {
    if (type === 'csv') {
      const exportData = filteredTransactions.map(transaction => {
        const user = users.find(u => u.id === transaction.userId);
        const scheme = userSchemes.find(s => s.id === transaction.schemeId);
        const row = {
          'Receipt Number': transaction.receiptNumber,
          'Date': formatDate(new Date(transaction.date)),
          'Customer Name': user?.name || 'Unknown',
          'Mobile Number': user?.mobileNumber || 'N/A',
          'Scheme': scheme?.schemeType.name || 'Unknown',
          'Amount': transaction.amount,
          'Interest': transaction.interest,
          'Payment Mode': transaction.paymentMode,
          'Remarks': transaction.remarks || ''
        } as Record<string, any>;
        if (!selectedColumns || selectedColumns.length === allColumns.length) return row;
        const shaped: Record<string, any> = {};
        selectedColumns.forEach(col => { shaped[col] = row[col]; });
        return shaped;
      });
      
      exportToCSV(exportData, `${filter.period}_transactions_report`);
    } else if (type === 'email') {
      alert('Email report functionality would be implemented here');
    } else if (type === 'whatsapp') {
      alert('WhatsApp report functionality would be implemented here');
    }
    setShowExportModal(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportStats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Interest</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportStats.totalInterest)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats.uniqueCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Payment Mode Distribution" subtitle={`Based on ${drilledTransactions.length} transactions`}>
          <div className="h-72">
            <DoughnutChart
              labels={modeDist.labels}
              values={modeDist.values}
              onElementClick={(_i, label) => {
                const pm = String(label).toLowerCase();
                setAdvPaymentMode(pm);
                setAdvApply(true);
                setAdvShow(true);
                setActiveTab('transactions');
                setPage(1);
              }}
            />
          </div>
        </Card>
        <Card title="Amount by Scheme Type" subtitle="Sum of amounts by scheme">
          <div className="h-72">
            <BarChart
              labels={schemeAmount.labels}
              values={schemeAmount.values}
              color="#8b5cf6"
              onElementClick={(_i, label) => {
                const st = schemeTypes.find(s => s.name === String(label));
                if (st) {
                  setAdvSchemeTypeId(st.id);
                  setActiveTab('transactions');
                  setPage(1);
                }
              }}
            />
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Collections (This Year)">
          <div className="h-72">
            <LineChart
              labels={monthlyLabels}
              values={monthlyValues}
              onElementClick={(_i, label) => {
                setAdvMonth(String(label));
                setActiveTab('transactions');
                setPage(1);
              }}
            />
          </div>
        </Card>
        <Card title="New Users per Month (This Year)">
          <div className="h-72">
            <BarChart labels={userGrowthLabels} values={userGrowthValues} color="#f59e0b" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderTransactions = () => {
    const total = drilledTransactions.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageRows = drilledTransactions.slice(start, start + pageSize);
    return (
      <Card title="Transaction Details" subtitle={`${total} transactions found`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.receipt} onChange={(e)=>setVisibleCols(v=>({...v,receipt:e.target.checked}))} />
              <span>Receipt</span>
            </label>
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.date} onChange={(e)=>setVisibleCols(v=>({...v,date:e.target.checked}))} />
              <span>Date</span>
            </label>
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.customer} onChange={(e)=>setVisibleCols(v=>({...v,customer:e.target.checked}))} />
              <span>Customer</span>
            </label>
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.amount} onChange={(e)=>setVisibleCols(v=>({...v,amount:e.target.checked}))} />
              <span>Amount</span>
            </label>
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.interest} onChange={(e)=>setVisibleCols(v=>({...v,interest:e.target.checked}))} />
              <span>Interest</span>
            </label>
            <label className="text-sm text-gray-700 flex items-center space-x-2">
              <input type="checkbox" checked={visibleCols.mode} onChange={(e)=>setVisibleCols(v=>({...v,mode:e.target.checked}))} />
              <span>Mode</span>
            </label>
          </div>
          <div className="text-sm text-gray-600">Page {currentPage} / {totalPages}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {visibleCols.receipt && <th className="text-left py-3 px-4 font-medium text-gray-700">Receipt</th>}
                {visibleCols.date && <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>}
                {visibleCols.customer && <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>}
                {visibleCols.amount && <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>}
                {visibleCols.interest && <th className="text-left py-3 px-4 font-medium text-gray-700">Interest</th>}
                {visibleCols.mode && <th className="text-left py-3 px-4 font-medium text-gray-700">Mode</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(transaction => {
                const user = users.find(u => u.id === transaction.userId);
                return (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {visibleCols.receipt && (
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">{transaction.receiptNumber}</td>
                    )}
                    {visibleCols.date && (
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(new Date(transaction.date))}</td>
                    )}
                    {visibleCols.customer && (
                      <td className="py-3 px-4 text-sm text-gray-900">{user?.name || 'Unknown'}</td>
                    )}
                    {visibleCols.amount && (
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</td>
                    )}
                    {visibleCols.interest && (
                      <td className="py-3 px-4 text-sm text-green-600">{formatCurrency(transaction.interest)}</td>
                    )}
                    {visibleCols.mode && (
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.paymentMode === 'offline' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                          {transaction.paymentMode}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {total === 0 && (
            <div className="text-center py-8">
              <FileText size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No transactions found for the selected period</p>
            </div>
          )}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-gray-600">Showing {start + 1}-{Math.min(start + pageSize, total)} of {total}</div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'schemes', label: 'Schemes', icon: TrendingUp }
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive financial reporting and insights</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Period Filter */}
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={filter.period}
              onChange={(e) => setFilter(prev => ({ ...prev, period: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>
          
          <Button onClick={() => setShowExportModal(true)}>
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Drill-down chips */}
      {(advMonth || advSchemeTypeId) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {advMonth && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              Month: {advMonth}
              <button className="ml-2" onClick={()=>{ setAdvMonth(''); setPage(1); }}>×</button>
            </span>
          )}
          {advSchemeTypeId && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
              Scheme: {schemeTypes.find(s=>s.id===advSchemeTypeId)?.name}
              <button className="ml-2" onClick={()=>{ setAdvSchemeTypeId(''); setPage(1); }}>×</button>
            </span>
          )}
          <button className="text-xs underline text-gray-600" onClick={()=>{ setAdvMonth(''); setAdvSchemeTypeId(''); setPage(1); }}>Clear all</button>
        </div>
      )}

      {/* Advanced Filters (collapsed by default) */}
      <div className="mb-6">
        <AdvancedFilters
          users={users}
          show={advShow}
          apply={advApply}
          amountMin={amountMin}
          amountMax={amountMax}
          paymentMode={advPaymentMode}
          userId={advUserId}
          onToggleShow={() => setAdvShow(s => !s)}
          onToggleApply={(checked) => { setAdvApply(checked); }}
          onAmountMinChange={(v) => { setAmountMin(v); }}
          onAmountMaxChange={(v) => { setAmountMax(v); }}
          onPaymentModeChange={(v) => { setAdvPaymentMode(v); }}
          onUserIdChange={(v) => { setAdvUserId(v); }}
          onReset={() => { setAmountMin(''); setAmountMax(''); setAdvPaymentMode(''); setAdvUserId(''); setAdvApply(false); }}
        />
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
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'customers' && (
        <CustomerSchemesPanel />
      )}
      {activeTab === 'schemes' && (
        <SchemeSummaryPanel />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">Choose how you'd like to export this report:</p>
              
              {/* Column selection for CSV (defaults to all columns) */}
              <div className="mb-4">
                <ExportColumnsSelector allColumns={allColumns} selectedColumns={selectedColumns} onChange={setSelectedColumns} />
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Download CSV</p>
                    <p className="text-sm text-gray-500">Export as Excel-compatible file</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('email')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Email Report</p>
                    <p className="text-sm text-gray-500">Send to configured email address</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('whatsapp')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">WhatsApp Report</p>
                    <p className="text-sm text-gray-500">Send summary via WhatsApp</p>
                  </div>
                </button>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button variant="outline" onClick={() => setShowExportModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
