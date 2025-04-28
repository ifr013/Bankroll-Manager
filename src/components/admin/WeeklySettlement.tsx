import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Calendar,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Ban as Bank,
  Users,
  Wallet,
  Plus,
  Minus,
  Trash2,
  Lock,
  Edit,
  Save
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency } from '../../utils/calculations';
import { PlayerSummary } from '../../types/admin';
import toast from 'react-hot-toast';

interface WeeklySettlementProps {
  players: PlayerSummary[];
}

interface SettlementData {
  id: string;
  startDate: string;
  endDate: string;
  month: string;
  players: {
    playerId: string;
    playerName: string;
    previousMakeup: number;
    currentMakeup: number;
    deposits: number;
    withdrawals: number;
    profitDivision: number;
    lucroFechamento: number;
    lucroTotal: number;
  }[];
}

const WeeklySettlement: React.FC<WeeklySettlementProps> = ({ players }) => {
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [expandedSettlements, setExpandedSettlements] = useState<Record<string, boolean>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy'));

  // Generate months for the current year
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(new Date().getFullYear(), i, 1);
    return format(date, 'MMMM yyyy');
  });

  const handleCalculateSettlement = () => {
    const settlementId = crypto.randomUUID();
    const month = format(selectedEndDate, 'MMMM yyyy');
    
    const newSettlement: SettlementData = {
      id: settlementId,
      startDate: selectedStartDate.toISOString(),
      endDate: selectedEndDate.toISOString(),
      month,
      players: players.map(player => ({
        playerId: player.id,
        playerName: player.name,
        previousMakeup: player.currentMakeup,
        currentMakeup: 0,
        deposits: 0,
        withdrawals: 0,
        profitDivision: player.currentMakeup,
        lucroFechamento: player.verifiedProfit,
        lucroTotal: player.verifiedProfit
      }))
    };

    setSettlements(prev => [...prev, newSettlement]);
    setExpandedSettlements(prev => ({ ...prev, [settlementId]: true }));
    setSelectedMonth(month);
    toast.success('Settlement calculated successfully');
  };

  const toggleSettlement = (settlementId: string) => {
    setExpandedSettlements(prev => ({
      ...prev,
      [settlementId]: !prev[settlementId]
    }));
  };

  const removeSettlement = (settlementId: string) => {
    if (window.confirm('Are you sure you want to remove this settlement?')) {
      setSettlements(prev => prev.filter(s => s.id !== settlementId));
      toast.success('Settlement removed successfully');
    }
  };

  // Calculate monthly totals
  const monthlyTotals = months.reduce((acc, month) => {
    const monthSettlements = settlements.filter(s => s.month === month);
    const total = monthSettlements.reduce((sum, settlement) => {
      return sum + settlement.players.reduce((playerSum, player) => 
        playerSum + player.lucroFechamento, 0);
    }, 0);
    acc[month] = total;
    return acc;
  }, {} as Record<string, number>);

  // Calculate totals for all players
  const totalMakeup = players.reduce((sum, player) => sum + player.currentMakeup, 0);
  const totalBalance = players.reduce((sum, player) => sum + player.availableBalance, 0);
  const totalBankReserve = players.reduce((sum, player) => sum + player.bankReserve, 0);
  const totalWithdrawals = players.reduce((sum, player) => sum + player.totalWithdrawals, 0);
  const totalProfit = players.reduce((sum, player) => sum + player.verifiedProfit, 0);

  return (
    <div className="space-y-6">
      {/* Settlement Calculator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-500" />
            Weekly Settlement Calculator
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <DatePicker
                selected={selectedStartDate}
                onChange={(date: Date) => setSelectedStartDate(date)}
                maxDate={selectedEndDate}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                dateFormat="MMMM d, yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <DatePicker
                selected={selectedEndDate}
                onChange={(date: Date) => setSelectedEndDate(date)}
                minDate={selectedStartDate}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCalculateSettlement}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
            >
              <Check className="h-5 w-5 mr-2" />
              Calculate Settlement
            </button>
          </div>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {months.map((month) => {
              const hasSettlements = settlements.some(s => s.month === month);
              const isSelected = selectedMonth === month;
              const monthlyTotal = monthlyTotals[month] || 0;

              return (
                <button
                  key={month}
                  onClick={() => hasSettlements && setSelectedMonth(month)}
                  disabled={!hasSettlements}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    hasSettlements
                      ? isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {month}
                  {hasSettlements && (
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

        {/* Settlements List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {settlements
            .filter(settlement => settlement.month === selectedMonth)
            .map(settlement => (
              <div
                key={settlement.id}
                className="bg-white dark:bg-gray-800"
              >
                <div className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleSettlement(settlement.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {expandedSettlements[settlement.id] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Settlement Period
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(settlement.startDate), 'MMM d, yyyy')} - {format(parseISO(settlement.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSettlement(settlement.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {expandedSettlements[settlement.id] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Player
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Previous Makeup
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Current Makeup
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Deposits
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Withdrawals
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Profit Division
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lucro Fechamento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lucro Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {settlement.players.map((player) => (
                          <tr key={player.playerId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {player.playerName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                player.previousMakeup >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(player.previousMakeup)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                player.currentMakeup >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(player.currentMakeup)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-600 dark:text-green-400">
                                {formatCurrency(player.deposits)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-red-600 dark:text-red-400">
                                {formatCurrency(player.withdrawals)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatCurrency(player.profitDivision)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                player.lucroFechamento >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(player.lucroFechamento)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                player.lucroTotal >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(player.lucroTotal)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

          {(!settlements.length || !settlements.filter(s => s.month === selectedMonth).length) && (
            <div className="bg-white dark:bg-gray-800 p-8 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {settlements.length === 0
                  ? 'No settlements calculated yet. Select a date range and click Calculate Settlement.'
                  : `No settlements for ${selectedMonth}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* General Player Statement */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
            General Player Statement
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Player
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Makeup
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Available Balance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bank Reserve
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Withdrawals
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Profit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contract Start
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {player.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      player.currentMakeup >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(player.currentMakeup)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(player.availableBalance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Bank className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(player.bankReserve)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {formatCurrency(player.totalWithdrawals)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      player.verifiedProfit >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(player.verifiedProfit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(player.contractStartDate), 'MMM dd, yyyy')}
                    </span>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No players found
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Totals
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    totalMakeup >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(totalMakeup)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalBalance)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {formatCurrency(totalBankReserve)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(totalWithdrawals)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    totalProfit >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(totalProfit)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklySettlement;