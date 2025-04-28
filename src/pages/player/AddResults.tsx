import { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, ChevronDown, Trash2, X, Calendar, ChevronUp, Lock 
} from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useSystemsStore from '../../store/systemsStore';
import Header from '../../components/layout/Header';
import PlatformEntry from '../../components/platforms/PlatformEntry';
import PlatformSelector from '../../components/platforms/PlatformSelector';

type Platform = {
  id: string;
  name: string;
  balance: number;
  reload: number;
  withdrawal: number;
};

export default function AddResults() {
  const navigate = useNavigate();
  const { systemId } = useParams<{ systemId: string }>();
  const system = useSystemsStore(state => state.getSystemById(systemId || ''));
  const players = useSystemsStore(state => state.getPlayersBySystemId(systemId || ''));
  const addTransaction = useSystemsStore(state => state.addTransaction);
  const deleteTransaction = useSystemsStore(state => state.deleteTransaction);
  const transactions = useSystemsStore(state => state.getTransactionsBySystemId(systemId || ''));
  const isTransactionLocked = useSystemsStore(state => state.isTransactionLocked);
  const getActiveSettlementPeriod = useSystemsStore(state => state.getActiveSettlementPeriod);
  
  // For demo, use the second player (New Player)
  const player = players[1];
  
  // Transaction form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: '1', name: 'PokerStars', balance: 0, reload: 0, withdrawal: 0 },
    { id: '2', name: 'GGPoker', balance: 0, reload: 0, withdrawal: 0 },
    { id: '3', name: 'ACR', balance: 0, reload: 0, withdrawal: 0 }
  ]);
  
  const [selectedYear, setSelectedYear] = useState('2025');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (transactionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(transactionId)) {
      newExpandedRows.delete(transactionId);
    } else {
      newExpandedRows.add(transactionId);
    }
    setExpandedRows(newExpandedRows);
  };
  
  if (!system || !player) {
    return <div className="p-8 text-center">System or player not found</div>;
  }
  
  // Check if the selected date is locked
  const isDateLocked = isTransactionLocked(selectedDate);
  
  // Get active settlement period
  const activePeriod = getActiveSettlementPeriod(systemId || '');
  
  // Available platforms for selection
  const availablePlatforms = ['PokerStars', 'GGPoker', 'ACR', 'PartyPoker', '888Poker'];
  
  // Platform handlers
  const handlePlatformChange = (platformId: string, field: keyof Platform, value: number) => {
    setPlatforms(prevPlatforms => 
      prevPlatforms.map(p => 
        p.id === platformId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleRemovePlatform = (platformId: string) => {
    setPlatforms(prevPlatforms => prevPlatforms.filter(p => p.id !== platformId));
  };

  const handleAddPlatform = (platformName: string) => {
    const newPlatform = {
      id: Date.now().toString(),
      name: platformName,
      balance: 0,
      reload: 0,
      withdrawal: 0
    };
    setPlatforms(prevPlatforms => [...prevPlatforms, newPlatform]);
  };

  // Calculate transaction values
  const calculateTransactionValues = () => {
    // Get previous transaction for this player
    const playerTransactions = transactions
      .filter(tx => tx.playerId === player.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const previousTransaction = playerTransactions[0];
    
    // Calculate totals from platforms
    const totalBalance = platforms.reduce((sum, platform) => sum + platform.balance, 0);
    const totalReload = platforms.reduce((sum, platform) => sum + platform.reload, 0);
    const totalWithdrawal = platforms.reduce((sum, platform) => sum + platform.withdrawal, 0);
    
    // Previous values
    const previousTotalBalance = previousTransaction?.totalBalance || 0;
    const previousReload = previousTransaction?.reload || 0;
    const previousWithdrawal = previousTransaction?.withdrawal || 0;
    const previousMakeup = previousTransaction?.currentMakeup || 0;
    const previousProfit = previousTransaction?.profit || 0;
    
    // Calculate result
    const result = totalBalance - previousTotalBalance - previousReload + previousWithdrawal;
    
    // Calculate potential makeup
    const potentialMakeup = previousMakeup + totalReload - totalWithdrawal;
    
    // If makeup would be negative, add it to profit instead
    let currentMakeup = potentialMakeup;
    let profit = previousProfit;
    
    if (potentialMakeup < 0) {
      // Add the absolute value of negative makeup to profit
      profit += Math.abs(potentialMakeup);
      // Reset makeup to 0
      currentMakeup = 0;
    }
    
    // Calculate bank reserve (20% of player withdrawal)
    const bankReserve = totalWithdrawal * 0.2;
    
    return {
      result,
      currentMakeup,
      profit,
      bankReserve,
      totalBalance,
      totalReload,
      totalWithdrawal,
      previousMakeup
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Check if the selected date is locked
    if (isDateLocked) {
      alert('Cannot add transactions for a locked settlement period');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const {
        result,
        currentMakeup,
        profit,
        bankReserve,
        totalBalance,
        totalReload,
        totalWithdrawal,
        previousMakeup
      } = calculateTransactionValues();
      
      // Add the transaction to the store
      addTransaction({
        playerId: player.id,
        systemId: system.id,
        date: selectedDate,
        balance: totalBalance,
        reload: totalReload,
        withdrawal: totalWithdrawal,
        result,
        previousMakeup,
        currentMakeup,
        profit,
        playerWithdrawal: totalWithdrawal,
        bankReserve,
        totalBalance
      });
      
      // Navigate back to system view
      navigate(`/player/systems/${systemId}`);
    } catch (error) {
      console.error('Error adding transaction:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(transactionId);
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Player Bankroll Manager Staking ${system?.stakingPercentage}%`} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-medium text-gray-900">Add Results</h1>
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              customInput={
                <button 
                  className={`flex items-center gap-2 px-4 py-2 text-sm ${
                    isDateLocked 
                      ? 'text-gray-500 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  } border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  disabled={isDateLocked}
                >
                  {isDateLocked ? (
                    <Lock size={16} className="text-gray-400" />
                  ) : (
                    <Calendar size={16} className="text-gray-400" />
                  )}
                  {format(selectedDate, 'MMMM d, yyyy')}
                </button>
              }
              dateFormat="MMMM d, yyyy"
            />
            {activePeriod && (
              <div className="absolute top-full mt-1 text-xs text-gray-500">
                Settlement period: {format(activePeriod.startDate, 'MMM d')} - {format(activePeriod.endDate, 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-medium text-gray-700">Active Platforms</h2>
                <PlatformSelector
                  availablePlatforms={availablePlatforms}
                  selectedPlatforms={platforms.map(p => p.name)}
                  onSelectPlatform={handleAddPlatform}
                />
              </div>
              
              <div className="space-y-6">
                {platforms.map(platform => (
                  <PlatformEntry
                    key={platform.id}
                    platform={platform}
                    onChange={(updatedPlatform) => {
                      setPlatforms(prevPlatforms =>
                        prevPlatforms.map(p =>
                          p.id === platform.id ? updatedPlatform : p
                        )
                      );
                    }}
                    onRemove={() => handleRemovePlatform(platform.id)}
                  />
                ))}
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Total Balance: <span className="font-medium">{formatCurrency(platforms.reduce((sum, platform) => sum + platform.balance, 0))}</span>
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || isDateLocked}
              className={`w-full py-3 px-4 rounded-b-lg flex items-center justify-center ${
                isDateLocked
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              } disabled:opacity-50`}
            >
              {isDateLocked ? (
                <>
                  <Lock size={18} className="mr-2" />
                  Period Locked
                </>
              ) : (
                <>
                  <DollarSign size={18} className="mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Daily Entry'}
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Transaction History</h2>
          
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center">
                <select 
                  className="text-sm border-none bg-transparent focus:ring-0"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <span className="ml-4 text-sm text-gray-500">
                  Year Total: <span className="font-medium text-danger-600">-$200.00</span>
                </span>
              </div>
            </div>
            
            <div className="p-4 border-b border-gray-100 overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
                  <button
                    key={month}
                    className={`relative px-4 py-1 text-sm font-medium rounded-full whitespace-nowrap
                      ${month === 'April' ? 'text-white bg-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {month}
                    {month === 'April' && (
                      <span className="block text-xs">-$200.00</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Result</th>
                    <th className="px-4 py-3 text-right">Reload</th>
                    <th className="px-4 py-3 text-right">Withdrawal</th>
                    <th className="px-4 py-3 text-right">Previous Makeup</th>
                    <th className="px-4 py-3 text-right">Current Makeup</th>
                    <th className="px-4 py-3 text-right">Profit</th>
                    <th className="px-4 py-3 text-right">Player Withdrawal</th>
                    <th className="px-4 py-3 text-right">Bank Reserve</th>
                    <th className="px-4 py-3 text-right">Total Balance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm bg-white">
                  {transactions.map(tx => (
                    <>
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {tx.isLocked ? (
                            <span className="inline-flex items-center text-gray-500">
                              <Lock size={14} className="mr-1" /> Locked
                            </span>
                          ) : (
                            <button 
                              onClick={() => toggleRow(tx.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedRows.has(tx.id) ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">{format(tx.date, 'MMM dd, yyyy')}</td>
                        <td className={`px-4 py-3 text-right ${tx.result < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          {formatCurrency(tx.result)}
                        </td>
                        <td className="px-4 py-3 text-right text-success-600">{formatCurrency(tx.reload)}</td>
                        <td className="px-4 py-3 text-right text-danger-600">{formatCurrency(tx.withdrawal)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(tx.previousMakeup)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(tx.currentMakeup)}</td>
                        <td className="px-4 py-3 text-right text-success-600">{formatCurrency(tx.profit)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(tx.playerWithdrawal)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(tx.bankReserve)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(tx.totalBalance)}</td>
                        <td className="px-4 py-3 text-right">
                          {!tx.isLocked && (
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-danger-500 hover:text-danger-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedRows.has(tx.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={12} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-8">
                              {platforms.map(platform => (
                                <div key={platform.id} className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">{platform.name}</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Balance:</span>
                                      <span className="font-medium">{formatCurrency(platform.balance)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Reload:</span>
                                      <span className="font-medium text-success-600">
                                        {formatCurrency(platform.reload)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Withdrawal:</span>
                                      <span className="font-medium text-danger-600">
                                        {formatCurrency(platform.withdrawal)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}