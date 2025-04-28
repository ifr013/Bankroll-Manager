import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight, Plus, Minus, Trash2, HelpCircle, Calendar, Lock, Edit, Check, X } from 'lucide-react';
import { DailyEntry, PlatformBalance } from '../types/bankroll';
import useBankrollStore from '../hooks/useBankrollStore';
import toast from 'react-hot-toast';

interface TransactionHistoryProps {
  entries: DailyEntry[];
}

interface MonthlyData {
  entries: DailyEntry[];
  totalResult: number;
  totalMakeup: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

interface EditingState {
  entryId: string | null;
  platforms: PlatformBalance[];
}

const calculateMonthlyResult = (entries: DailyEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.result, 0);
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ entries }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [editingState, setEditingState] = useState<EditingState>({ entryId: null, platforms: [] });
  const { removeDailyEntry, settlementDates, updateDailyEntry, activeBankroll } = useBankrollStore();

  // Generate years from 2020 to 2035
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i);

  useEffect(() => {
    if (entries.length > 0) {
      const latestEntry = entries[entries.length - 1];
      const month = format(parseISO(latestEntry.date), 'MMMM');
      const year = parseISO(latestEntry.date).getFullYear();
      setSelectedMonth(month);
      setSelectedYear(year);
    } else {
      setSelectedMonth('');
      setSelectedYear(new Date().getFullYear());
      setExpandedEntries({});
    }
  }, [entries]);

  // Filter entries by selected year
  const entriesForYear = useMemo(() => 
    entries.filter(entry => parseISO(entry.date).getFullYear() === selectedYear),
    [entries, selectedYear]
  );

  const monthlyEntries = useMemo(() => 
    entriesForYear.reduce((acc: Record<string, MonthlyData>, entry) => {
      const month = format(parseISO(entry.date), 'MMMM');
      
      if (!acc[month]) {
        acc[month] = {
          entries: [],
          totalResult: 0,
          totalMakeup: 0,
          totalDeposits: 0,
          totalWithdrawals: 0
        };
      }
      
      acc[month].entries.push(entry);
      acc[month].totalResult = calculateMonthlyResult(acc[month].entries);
      acc[month].totalMakeup = entry.makeupEffective;
      acc[month].totalDeposits += entry.deposit || 0;
      acc[month].totalWithdrawals += entry.withdrawal || 0;
      
      return acc;
    }, {}),
    [entriesForYear]
  );

  const yearTotal = useMemo(() => 
    entriesForYear.reduce((sum, entry) => sum + entry.result, 0),
    [entriesForYear]
  );

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleDeleteEntry = (date: string) => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      removeDailyEntry(date);
      toast.success('Entry deleted successfully');
    }
  };

  const handleEditEntry = (entry: DailyEntry) => {
    setEditingState({
      entryId: entry.date,
      platforms: [...entry.platforms]
    });
    setExpandedEntries(prev => ({
      ...prev,
      [entry.date]: true
    }));
  };

  const handleCancelEdit = () => {
    setEditingState({ entryId: null, platforms: [] });
  };

  const handleSaveEdit = () => {
    if (!activeBankroll || !editingState.entryId) return;

    updateDailyEntry(
      editingState.entryId,
      editingState.platforms,
      activeBankroll.id
    );

    setEditingState({ entryId: null, platforms: [] });
    toast.success('Changes saved successfully');
  };

  const handlePlatformValueChange = (platformId: string, newValue: number) => {
    setEditingState(prev => ({
      ...prev,
      platforms: prev.platforms.map(platform =>
        platform.id === platformId
          ? { ...platform, amount: newValue }
          : platform
      )
    }));
  };

  const groupPlatformsByType = (platforms: PlatformBalance[]) => {
    return platforms.reduce((acc, platform) => {
      const key = platform.transactionType;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(platform);
      return acc;
    }, {} as Record<string, PlatformBalance[]>);
  };

  const calculatePlayerProfit = (entry: DailyEntry): number => {
    return entry.result - entry.makeupEffective;
  };

  const isSettlementDate = (date: string) => {
    if (!settlementDates) return false;
    const entryDate = parseISO(date);
    const startDate = parseISO(settlementDates.start);
    const endDate = parseISO(settlementDates.end);
    return entryDate >= startDate && entryDate <= endDate;
  };

  const getSettlementTooltip = () => {
    if (!settlementDates) return '';
    const startDate = format(parseISO(settlementDates.start), 'dd/MM/yyyy');
    const endDate = format(parseISO(settlementDates.end), 'dd/MM/yyyy');
    return `Settlement period: ${startDate} - ${endDate}`;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Transaction History</h2>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Year Total: </span>
            <span className={`text-lg font-semibold ${
              yearTotal >= 0 
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${yearTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-2">
          {months.map((month) => {
            const monthData = monthlyEntries[month];
            const hasEntries = monthData && monthData.entries.length > 0;
            const isSelected = selectedMonth === month;
            const monthlyTotal = hasEntries ? monthlyEntries[month].totalResult : 0;

            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(isSelected ? '' : month)}
                disabled={!hasEntries}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  hasEntries
                    ? isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {month}
                {hasEntries && (
                  <span className={`ml-2 ${
                    monthlyTotal >= 0 
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    ${Math.abs(monthlyTotal).toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {entries.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No transactions recorded yet. Add your first daily entry.
          </div>
        ) : selectedMonth && monthlyEntries[selectedMonth] ? (
          <div className="bg-gray-50 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Result
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Deposit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Withdrawal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Makeup
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Balance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Player Profit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {monthlyEntries[selectedMonth].entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, index) => {
                    const entryId = `${entry.date}-${index}`;
                    const isEntryExpanded = expandedEntries[entryId] || editingState.entryId === entry.date;
                    const groupedPlatforms = groupPlatformsByType(entry.platforms);
                    const isSettlement = isSettlementDate(entry.date);
                    const playerProfit = calculatePlayerProfit(entry);
                    const isEditing = editingState.entryId === entry.date;

                    return (
                      <React.Fragment key={entryId}>
                        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSettlement ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900 dark:text-gray-200">
                                {format(parseISO(entry.date), 'MMM dd, yyyy')}
                              </span>
                              {isSettlement && (
                                <div className="group relative">
                                  <HelpCircle className="h-4 w-4 text-yellow-500 cursor-help" />
                                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                    {getSettlementTooltip()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.result !== 0 && (
                              <div className={`flex items-center ${
                                entry.result >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {entry.result >= 0 ? (
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 mr-1" />
                                )}
                                <span className="font-medium">
                                  ${Math.abs(entry.result).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.deposit > 0 && (
                              <span className="text-green-600 dark:text-green-400 flex items-center">
                                <Plus className="h-4 w-4 mr-1" />
                                ${entry.deposit.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.withdrawal > 0 && (
                              <span className="text-red-600 dark:text-red-400 flex items-center">
                                <Minus className="h-4 w-4 mr-1" />
                                ${entry.withdrawal.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              (entry.makeupEffective || 0) >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              ${(entry.makeupEffective || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              ${entry.total.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              playerProfit >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              ${playerProfit.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleEntry(entryId)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                {isEntryExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                              {isSettlement ? (
                                <Lock className="h-5 w-5 text-yellow-500" />
                              ) : isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                  >
                                    <Check className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditEntry(entry)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntry(entry.date)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isEntryExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-900">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-4">
                                {Object.entries(groupPlatformsByType(isEditing ? editingState.platforms : entry.platforms)).map(([type, platforms]) => (
                                  <div key={type} className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                      {type === 'balance' ? 'Platform Balances' :
                                       type === 'deposit' ? 'Deposits' : 'Withdrawals'}
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      {platforms.map((platform) => (
                                        <div key={platform.id} className="space-y-1">
                                          <p className="text-sm text-gray-600 dark:text-gray-400">{platform.name}</p>
                                          {isEditing ? (
                                            <div className="relative">
                                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 dark:text-gray-400">$</span>
                                              </div>
                                              <input
                                                type="number"
                                                value={platform.amount}
                                                onChange={(e) => handlePlatformValueChange(platform.id, parseFloat(e.target.value) || 0)}
                                                className="block w-full pl-7 pr-3 py-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                                                step="0.01"
                                              />
                                            </div>
                                          ) : (
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                              ${platform.amount.toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {entries.length === 0
              ? 'No transactions recorded yet. Add your first daily entry.'
              : `Select a month to view transactions for ${selectedYear}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;