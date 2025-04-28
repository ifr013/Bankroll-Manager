import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  DollarSign, ArrowUp, ArrowDown, Calendar, Clock, 
  CreditCard, BarChart3, ChevronRight, ChevronLeft, 
  Users, Info, Wallet, ArrowRightLeft, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';

export default function SystemView() {
  const { systemId } = useParams<{ systemId: string }>();
  const system = useSystemsStore(state => state.getSystemById(systemId || ''));
  const players = useSystemsStore(state => state.getPlayersBySystemId(systemId || ''));
  const transactions = useSystemsStore(state => state.getTransactionsBySystemId(systemId || ''));
  const deleteTransaction = useSystemsStore(state => state.deleteTransaction);
  
  // For demo, use the second player (New Player)
  const player = players[1];
  
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2024');
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
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  if (!system || !player) {
    return <div className="p-8 text-center">System or player not found</div>;
  }
  
  // Filter transactions for the selected month
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const selectedDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
    return tx.playerId === player.id && 
           txDate.getMonth() === selectedDate.getMonth() &&
           txDate.getFullYear() === parseInt(selectedYear);
  });
  
  // Calculate total for the selected month
  const monthTotal = filteredTransactions.reduce((sum, tx) => sum + tx.result, 0);

  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(transactionId);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Player Bankroll Manager Staking ${system.stakingPercentage}%`} />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center mb-1">
              <Link to="/player" className="text-gray-400 hover:text-gray-600 mr-2">
                Dashboard
              </Link>
              <ChevronRight size={14} className="text-gray-400 mr-2" />
              <span className="text-gray-700">{system.type}</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome, {player.name}</h1>
          </div>
          
          <div className="flex space-x-2">
            <button className="btn-secondary">
              <Info size={16} className="mr-1" /> Contract Details
            </button>
            <button className="btn-secondary">
              <ArrowRightLeft size={16} className="mr-1" /> Transactions
            </button>
            <button className="btn-secondary">
              <Wallet size={16} className="mr-1" /> Withdraw
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center mb-1">
              <DollarSign size={16} className="text-primary-500 mr-1" />
              <span className="text-sm text-gray-500">Current Makeup</span>
              {player.makeup > 0 && <ArrowUp size={12} className="text-danger-500 ml-2" />}
            </div>
            <p className="text-2xl font-bold text-danger-600">{formatCurrency(player.makeup)}</p>
            <p className="text-xs text-gray-500 mt-1">Previous: {formatCurrency(player.makeup - 200)}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-1">
              <CreditCard size={16} className="text-success-500 mr-1" />
              <span className="text-sm text-gray-500">Available Balance</span>
            </div>
            <p className="text-2xl font-bold text-success-600">{formatCurrency(player.balance)}</p>
            <p className="text-xs text-gray-500 mt-1">Last deposit: {formatCurrency(200)} on Apr 21</p>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-1">
              <Clock size={16} className="text-purple-500 mr-1" />
              <span className="text-sm text-gray-500">Bank Reserve</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(player.bankReserve)}</p>
            <p className="text-xs text-gray-500 mt-1">Required: {formatCurrency(5000)}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-1">
              <BarChart3 size={16} className="text-danger-500 mr-1" />
              <span className="text-sm text-gray-500">Total Profit</span>
              {player.profit < 0 && <ArrowDown size={12} className="text-danger-500 ml-2" />}
            </div>
            <p className={`text-2xl font-bold ${player.profit < 0 ? 'text-danger-600' : 'text-success-600'}`}>
              {formatCurrency(player.profit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last session: {formatCurrency(-200)}</p>
          </div>
        </div>
        
        {/* Contract Details */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Contract Details</h2>
            <span className="badge badge-success">Active</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Contract Start Date</p>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <p className="font-medium">April 26, 2025</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Deal Percentage</p>
              <div className="flex items-center">
                <DollarSign size={16} className="text-gray-400 mr-2" />
                <p className="font-medium">50%</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Withdrawals</p>
              <div className="flex items-center">
                <ArrowDown size={16} className="text-gray-400 mr-2" />
                <p className="font-medium">{formatCurrency(3500)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Next Settlement</p>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <p className="font-medium">April 28, 2025</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Results Button */}
        <div className="mb-6">
          <Link 
            to={`/player/systems/${systemId}/add-results`}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            <DollarSign size={18} className="mr-2" /> Add Daily Entry
          </Link>
        </div>
        
        {/* Transaction History */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Transaction History</h2>
            <div className="flex space-x-2">
              <select 
                className="input py-1 text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 
                    ${selectedMonth === month 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  {month} {month === selectedMonth && monthTotal !== 0 && formatCurrency(monthTotal)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>DATE</th>
                  <th>RESULT</th>
                  <th>RELOAD</th>
                  <th>WITHDRAWAL</th>
                  <th>PREVIOUS MAKEUP</th>
                  <th>CURRENT MAKEUP</th>
                  <th>PROFIT</th>
                  <th>PLAYER WITHDRAWAL</th>
                  <th>BANK RESERVE</th>
                  <th>TOTAL BALANCE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <>
                      <tr key={tx.id}>
                        <td>
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
                        </td>
                        <td>{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                        <td className={tx.result < 0 ? 'text-danger-600' : 'text-success-600'}>
                          {formatCurrency(tx.result)}
                        </td>
                        <td className="text-success-600">{tx.reload > 0 ? formatCurrency(tx.reload) : '-'}</td>
                        <td className="text-danger-600">{tx.withdrawal > 0 ? formatCurrency(tx.withdrawal) : '-'}</td>
                        <td>{formatCurrency(tx.previousMakeup)}</td>
                        <td>{formatCurrency(tx.currentMakeup)}</td>
                        <td className={tx.profit < 0 ? 'text-danger-600' : 'text-success-600'}>
                          {formatCurrency(tx.profit)}
                        </td>
                        <td>{formatCurrency(tx.playerWithdrawal)}</td>
                        <td>{formatCurrency(tx.bankReserve)}</td>
                        <td>{formatCurrency(tx.totalBalance)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-danger-500 hover:text-danger-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(tx.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={12} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-8">
                              {/* Platform details would go here */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">PokerStars</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Balance:</span>
                                    <span className="font-medium">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Reload:</span>
                                    <span className="font-medium text-success-600">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Withdrawal:</span>
                                    <span className="font-medium text-danger-600">{formatCurrency(0)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">GGPoker</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Balance:</span>
                                    <span className="font-medium">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Reload:</span>
                                    <span className="font-medium text-success-600">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Withdrawal:</span>
                                    <span className="font-medium text-danger-600">{formatCurrency(0)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">ACR</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Balance:</span>
                                    <span className="font-medium">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Reload:</span>
                                    <span className="font-medium text-success-600">{formatCurrency(0)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Withdrawal:</span>
                                    <span className="font-medium text-danger-600">{formatCurrency(0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4 text-gray-500">
                      No transactions found for {selectedMonth} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}