import React, { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  Filter
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { DailyEntry } from '../types/bankroll';

interface SiteTransactionsProps {
  entries: DailyEntry[];
  onClose: () => void;
}

type DateFilterType = 'all' | 'year' | 'month' | 'custom';

const SiteTransactions: React.FC<SiteTransactionsProps> = ({ entries, onClose }) => {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null; end: Date | null}>({
    start: null,
    end: null
  });

  // Get unique sites from all entries
  const sites = useMemo(() => {
    const siteSet = new Set<string>();
    entries.forEach(entry => {
      entry.platforms.forEach(platform => {
        siteSet.add(platform.name);
      });
    });
    return Array.from(siteSet).sort();
  }, [entries]);

  // Get available years from entries
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    entries.forEach(entry => {
      years.add(parseISO(entry.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [entries]);

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      
      switch (dateFilterType) {
        case 'year':
          return entryDate.getFullYear() === selectedYear;
        case 'month':
          return (
            entryDate.getFullYear() === selectedYear &&
            entryDate.getMonth() === selectedMonth
          );
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            return isWithinInterval(entryDate, {
              start: startOfYear(customDateRange.start),
              end: endOfYear(customDateRange.end)
            });
          }
          return true;
        default:
          return true;
      }
    });
  }, [entries, dateFilterType, selectedYear, selectedMonth, customDateRange]);

  // Filter and process entries for selected site
  const siteEntries = useMemo(() => {
    if (!selectedSite) return [];

    return filteredEntries
      .filter(entry => entry.platforms.some(p => p.name === selectedSite))
      .map(entry => {
        const sitePlatforms = entry.platforms.filter(p => p.name === selectedSite);
        const balance = sitePlatforms.find(p => p.transactionType === 'balance')?.amount || 0;
        const deposit = sitePlatforms.find(p => p.transactionType === 'deposit')?.amount || 0;
        const withdrawal = sitePlatforms.find(p => p.transactionType === 'withdrawal')?.amount || 0;

        return {
          date: entry.date,
          balance,
          deposit,
          withdrawal,
          platforms: sitePlatforms
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSite, filteredEntries]);

  // Calculate totals for selected site
  const siteTotals = useMemo(() => {
    return siteEntries.reduce((acc, entry) => ({
      balance: entry.balance,
      deposits: acc.deposits + entry.deposit,
      withdrawals: acc.withdrawals + entry.withdrawal
    }), { balance: 0, deposits: 0, withdrawals: 0 });
  }, [siteEntries]);

  const toggleEntry = (date: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Site Transactions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Site and Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Site Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Site
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Choose a site</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Filter
              </label>
              <div className="flex space-x-2">
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as DateFilterType)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="year">By Year</option>
                  <option value="month">By Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Date Filter Options */}
          {dateFilterType !== 'all' && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateFilterType === 'year' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {dateFilterType === 'month' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Month
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {dateFilterType === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <DatePicker
                        selected={customDateRange.start}
                        onChange={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                        maxDate={customDateRange.end || new Date()}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        dateFormat="MMMM d, yyyy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <DatePicker
                        selected={customDateRange.end}
                        onChange={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                        minDate={customDateRange.start}
                        maxDate={new Date()}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        dateFormat="MMMM d, yyyy"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedSite && (
            <>
              {/* Site Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Current Balance
                  </h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${siteTotals.balance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Deposits
                  </h3>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${siteTotals.deposits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Withdrawals
                  </h3>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    ${siteTotals.withdrawals.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="overflow-y-auto max-h-[50vh]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Balance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Deposit
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Withdrawal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {siteEntries.map((entry) => (
                      <React.Fragment key={entry.date}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {format(parseISO(entry.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ${entry.balance.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.deposit > 0 && (
                              <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                                <Plus className="h-4 w-4 mr-1" />
                                ${entry.deposit.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.withdrawal > 0 && (
                              <span className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                <Minus className="h-4 w-4 mr-1" />
                                ${entry.withdrawal.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleEntry(entry.date)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {expandedEntries[entry.date] ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedEntries[entry.date] && (
                          <tr className="bg-gray-50 dark:bg-gray-900">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                  Transaction Details
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                  {entry.platforms.map((platform) => (
                                    <div key={platform.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {platform.transactionType === 'balance' ? 'Balance' :
                                         platform.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                      </p>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        ${platform.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteTransactions;