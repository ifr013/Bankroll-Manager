import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, ArrowUp, ArrowDown, Calendar, Clock, 
  CreditCard, BarChart3, ChevronRight, ChevronLeft, 
  Users, Info, Wallet, ArrowRightLeft, ChevronDown, ChevronUp, Lock, Unlock 
} from 'lucide-react';
import { 
  format, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, 
  subMonths, isWithinInterval, eachDayOfInterval 
} from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';

type DateRange = 'lastWeek' | 'lastMonth' | 'lastSettlement' | 'custom';

export default function WeeklySettlement() {
  const navigate = useNavigate();
  const { systemId } = useParams<{ systemId: string }>();
  const system = useSystemsStore(state => state.getSystemById(systemId || ''));
  const players = useSystemsStore(state => state.getPlayersBySystemId(systemId || ''));
  const transactions = useSystemsStore(state => state.getTransactionsBySystemId(systemId || ''));
  const settlements = useSystemsStore(state => state.getSettlementsBySystemId(systemId || ''));
  const createSettlement = useSystemsStore(state => state.createSettlement);
  const finalizeSettlement = useSystemsStore(state => state.finalizeSettlement);
  const unlockSettlementPeriod = useSystemsStore(state => state.unlockSettlementPeriod);
  
  // Get the last settlement date
  const lastSettlement = settlements
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .find(s => s.status === 'completed');
  
  const [selectedRange, setSelectedRange] = useState<DateRange>('lastWeek');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    lastSettlement ? new Date(lastSettlement.endDate) : startOfWeek(new Date()),
    endOfWeek(new Date())
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const selectedStartDate = dateRange[0] || new Date();
  const selectedEndDate = dateRange[1] || new Date();
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!system) {
    return <div className="p-8 text-center">System not found</div>;
  }
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Filter transactions for the selected week
  const weekTransactions = transactions.filter(tx => 
    tx.date >= selectedStartDate && 
    tx.date <= selectedEndDate &&
    !tx.settlementId // Only include unsettled transactions
  );
  
  // Get all days in the selected week
  const weekDays = eachDayOfInterval({
    start: selectedStartDate,
    end: selectedEndDate
  });
  
  // Calculate daily totals for each player
  const playerDailyTotals = players.map(player => {
    const playerTransactions = weekTransactions.filter(tx => tx.playerId === player.id);
    
    const dailyTotals = weekDays.map(day => {
      const dayTransactions = playerTransactions.filter(tx => 
        format(tx.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      if (dayTransactions.length === 0) {
        return {
          date: day,
          profit: 0,
          makeup: 0,
          balance: 0,
          reload: 0,
          withdrawal: 0,
          isLocked: false
        };
      }
      
      return {
        date: day,
        profit: dayTransactions.reduce((sum, tx) => sum + tx.profit, 0),
        makeup: dayTransactions.reduce((sum, tx) => sum + (tx.currentMakeup - tx.previousMakeup), 0),
        balance: dayTransactions[dayTransactions.length - 1].balance,
        reload: dayTransactions.reduce((sum, tx) => sum + tx.reload, 0),
        withdrawal: dayTransactions.reduce((sum, tx) => sum + tx.withdrawal, 0),
        isLocked: dayTransactions.some(tx => tx.isLocked)
      };
    });
    
    const totalProfit = dailyTotals.reduce((sum, day) => sum + day.profit, 0);
    const totalMakeup = dailyTotals.reduce((sum, day) => sum + day.makeup, 0);
    const totalBalance = player.balance;
    
    return {
      playerId: player.id,
      name: player.name,
      dailyTotals,
      totalProfit,
      totalMakeup,
      totalBalance
    };
  });
  
  // Calculate system totals
  const systemTotals = {
    profit: playerDailyTotals.reduce((sum, player) => sum + player.totalProfit, 0),
    makeup: playerDailyTotals.reduce((sum, player) => sum + player.totalMakeup, 0),
    balance: playerDailyTotals.reduce((sum, player) => sum + player.totalBalance, 0)
  };
  
  const handleDateRangeChange = (range: DateRange) => {
    const now = new Date();
    
    switch (range) {
      case 'lastWeek': {
        const lastWeekStart = startOfWeek(subDays(now, 7));
        const lastWeekEnd = endOfWeek(subDays(now, 7));
        setDateRange([lastWeekStart, lastWeekEnd]);
        break;
      }
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        setDateRange([startOfMonth(lastMonth), endOfMonth(lastMonth)]);
        break;
      }
      case 'lastSettlement':
        if (lastSettlement) {
          setDateRange([new Date(lastSettlement.endDate), now]);
        }
        break;
      case 'custom':
        setIsDatePickerOpen(prev => !prev);
        break;
    }
    
    setSelectedRange(range);
  };
  
  const handleCustomDateChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    if (dates[0] && dates[1]) {
      setIsDatePickerOpen(false);
    }
  };
  
  const togglePlayerExpansion = (playerId: string) => {
    const newExpandedPlayers = new Set(expandedPlayers);
    if (expandedPlayers.has(playerId)) {
      newExpandedPlayers.delete(playerId);
    } else {
      newExpandedPlayers.add(playerId);
    }
    setExpandedPlayers(newExpandedPlayers);
  };
  
  const handleFinalizeSettlement = async () => {
    if (!window.confirm('Are you sure you want to finalize this settlement? This action cannot be undone.')) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const settlementId = createSettlement({
        systemId: system.id,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        totalProfit: systemTotals.profit,
        totalMakeup: systemTotals.makeup,
        totalBalance: systemTotals.balance,
        players: playerDailyTotals.map(player => ({
          playerId: player.playerId,
          profit: player.totalProfit,
          makeup: player.totalMakeup,
          balance: player.totalBalance
        }))
      });
      
      finalizeSettlement(settlementId);
      
      // Navigate back to system details
      navigate(`/admin/systems/${systemId}`);
    } catch (error) {
      console.error('Error finalizing settlement:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockPeriod = () => {
    if (!window.confirm('Are you sure you want to unlock this period? This will allow editing of all transactions in this period.')) {
      return;
    }
    
    try {
      unlockSettlementPeriod(systemId || '', selectedStartDate, selectedEndDate);
    } catch (error) {
      console.error('Error unlocking period:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Weekly Settlement" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center mb-1">
              <DollarSign size={16} className="text-primary-500 mr-1" />
              <span className="text-sm text-gray-500">Total Profit</span>
              {systemTotals.profit !== 0 && (
                systemTotals.profit > 0 
                  ? <ArrowUp size={12} className="text-success-500 ml-2" />
                  : <ArrowDown size={12} className="text-danger-500 ml-2" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              systemTotals.profit > 0 ? 'text-success-600' : 
              systemTotals.profit < 0 ? 'text-danger-600' : 'text-gray-900'
            }`}>
              {formatCurrency(systemTotals.profit)}
            </p>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-1">
              <Lock size={16} className="text-danger-500 mr-1" />
              <span className="text-sm text-gray-500">Total Makeup</span>
            </div>
            <p className="text-2xl font-bold text-danger-600">
              {formatCurrency(systemTotals.makeup)}
            </p>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-1">
              <Users size={16} className="text-success-500 mr-1" />
              <span className="text-sm text-gray-500">Active Players</span>
            </div>
            <p className="text-2xl font-bold">
              {playerDailyTotals.filter(p => p.totalProfit !== 0 || p.totalMakeup !== 0).length}
            </p>
          </div>
        </div>

        {/* Date Selection and Actions Form */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDateRangeChange('lastWeek')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedRange === 'lastWeek'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Last Week
                </button>
                <button
                  onClick={() => handleDateRangeChange('lastMonth')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedRange === 'lastMonth'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Last Month
                </button>
                <button
                  onClick={() => handleDateRangeChange('lastSettlement')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedRange === 'lastSettlement'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                  disabled={!lastSettlement}
                  title={!lastSettlement ? 'No previous settlement found' : undefined}
                >
                  Since Last Settlement
                </button>
                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={() => handleDateRangeChange('custom')}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                      selectedRange === 'custom'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Calendar size={16} className="mr-2" />
                    Custom
                  </button>
                  {isDatePickerOpen && (
                    <div className="absolute z-50 mt-2">
                      <DatePicker
                        selected={dateRange[0]}
                        onChange={handleCustomDateChange}
                        startDate={dateRange[0]}
                        endDate={dateRange[1]}
                        selectsRange
                        inline
                        monthsShown={2}
                        className="bg-white rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Selected period: {format(selectedStartDate, 'MMM d')} - {format(selectedEndDate, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/admin/systems/${systemId}`)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockPeriod}
                className="btn-warning flex items-center"
              >
                <Unlock size={16} className="mr-2" />
                Unlock Period
              </button>
              <button
                onClick={handleFinalizeSettlement}
                disabled={isProcessing || weekTransactions.length === 0}
                className="btn-primary"
              >
                <Lock size={16} className="mr-2" />
                {isProcessing ? 'Processing...' : 'Finalize Settlement'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Player Results Table */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Player Results</h2>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>PLAYER</th>
                  <th>TOTAL PROFIT</th>
                  <th>MAKEUP CHANGE</th>
                  <th>CURRENT BALANCE</th>
                  <th>PLAYER SHARE (50%)</th>
                  <th>HOUSE SHARE (50%)</th>
                </tr>
              </thead>
              <tbody>
                {playerDailyTotals.map(player => (
                  <>
                    <tr key={player.playerId}>
                      <td>
                        <button
                          onClick={() => togglePlayerExpansion(player.playerId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedPlayers.has(player.playerId) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </td>
                      <td className="font-medium">{player.name}</td>
                      <td className={`font-medium ${
                        player.totalProfit > 0 ? 'text-success-600' : 
                        player.totalProfit < 0 ? 'text-danger-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(player.totalProfit)}
                      </td>
                      <td className="font-medium text-danger-600">
                        {formatCurrency(player.totalMakeup)}
                      </td>
                      <td className="font-medium">
                        {formatCurrency(player.totalBalance)}
                      </td>
                      <td className="font-medium">
                        {formatCurrency(player.totalProfit * 0.5)}
                      </td>
                      <td className="font-medium">
                        {formatCurrency(player.totalProfit * 0.5)}
                      </td>
                    </tr>
                    {expandedPlayers.has(player.playerId) && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 p-4">
                          <table className="w-full">
                            <thead>
                              <tr className="text-xs font-medium text-gray-500">
                                <th className="text-left py-2">DATE</th>
                                <th className="text-right py-2">PROFIT</th>
                                <th className="text-right py-2">MAKEUP</th>
                                <th className="text-right py-2">BALANCE</th>
                                <th className="text-right py-2">RELOAD</th>
                                <th className="text-right py-2">WITHDRAWAL</th>
                                <th className="text-right py-2">STATUS</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {player.dailyTotals.map(day => (
                                <tr key={format(day.date, 'yyyy-MM-dd')} className="border-t border-gray-100">
                                  <td className="py-2">{format(day.date, 'EEE, MMM d')}</td>
                                  <td className={`text-right py-2 ${
                                    day.profit > 0 ? 'text-success-600' : 
                                    day.profit < 0 ? 'text-danger-600' : 'text-gray-500'
                                  }`}>
                                    {day.profit !== 0 ? formatCurrency(day.profit) : '-'}
                                  </td>
                                  <td className="text-right py-2 text-danger-600">
                                    {day.makeup !== 0 ? formatCurrency(day.makeup) : '-'}
                                  </td>
                                  <td className="text-right py-2">
                                    {formatCurrency(day.balance)}
                                  </td>
                                  <td className="text-right py-2 text-success-600">
                                    {day.reload !== 0 ? formatCurrency(day.reload) : '-'}
                                  </td>
                                  <td className="text-right py-2 text-danger-600">
                                    {day.withdrawal !== 0 ? formatCurrency(day.withdrawal) : '-'}
                                  </td>
                                  <td className="text-right py-2">
                                    {day.isLocked ? (
                                      <span className="inline-flex items-center text-gray-500">
                                        <Lock size={14} className="mr-1" /> Locked
                                      </span>
                                    ) : (
                                      <span className="text-success-600">Open</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td></td>
                  <td className="font-medium">Total</td>
                  <td className={`font-medium ${
                    systemTotals.profit > 0 ? 'text-success-600' : 
                    systemTotals.profit < 0 ? 'text-danger-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(systemTotals.profit)}
                  </td>
                  <td className="font-medium text-danger-600">
                    {formatCurrency(systemTotals.makeup)}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(systemTotals.balance)}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(systemTotals.profit * 0.5)}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(systemTotals.profit * 0.5)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}