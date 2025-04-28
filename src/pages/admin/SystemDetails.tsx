import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Calendar, Plus, DollarSign, TrendingUp, 
  Clock, Info, ChevronRight, ChevronLeft, Check, X, History 
} from 'lucide-react';
import { format } from 'date-fns';
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

export default function SystemDetails() {
  const { systemId } = useParams<{ systemId: string }>();
  const system = useSystemsStore(state => state.getSystemById(systemId || ''));
  const players = useSystemsStore(state => state.getPlayersBySystemId(systemId || ''));
  const transactions = useSystemsStore(state => state.getTransactionsBySystemId(systemId || ''));
  
  // Calculate totals
  const totalMakeup = players.reduce((sum, player) => sum + player.makeup, 0);
  const totalBalance = players.reduce((sum, player) => sum + player.balance, 0);
  const totalProfit = players.reduce((sum, player) => sum + player.profit, 0);
  const totalBankReserve = players.reduce((sum, player) => sum + player.bankReserve, 0);

  // Filter pending transactions
  const pendingDeposits = transactions.filter(tx => tx.reload > 0 && !tx.status);
  const pendingWithdrawals = transactions.filter(tx => tx.withdrawal > 0 && !tx.status);

  // Get latest transaction for each player
  const latestTransactions = players.map(player => {
    const playerTransactions = transactions
      .filter(tx => tx.playerId === player.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return {
      player,
      transaction: playerTransactions[0]
    };
  }).filter(item => item.transaction); // Only include players with transactions
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Sample data for the profit chart
  const profitData = [
    { month: 'Jan', individualProfit: 0, accumulatedProfit: 0 },
    { month: 'Feb', individualProfit: -500, accumulatedProfit: -500 },
    { month: 'Mar', individualProfit: 1000, accumulatedProfit: 500 },
    { month: 'Apr', individualProfit: -22040, accumulatedProfit: -21540 }
  ];
  
  if (!system) {
    return <div className="p-8 text-center">System not found</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard Overview" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link 
              to="/admin"
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-2"
            >
              <ArrowLeft size={16} className="mr-1" />
            </Link>
            <div className="bg-gray-200 text-xs px-2 py-1 rounded">Admin</div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Total Players</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-semibold">{players.length}</span>
              <Link to="#" className="text-primary-600 text-xs">
                View all <ChevronRight size={12} className="inline" />
              </Link>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-gray-500">Total Profit</span>
            </div>
            <div className="flex justify-between items-end">
              <span className={`text-2xl font-semibold ${totalProfit < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                {formatCurrency(totalProfit)}
              </span>
              <Link to="#" className="text-primary-600 text-xs">
                View settlement <ChevronRight size={12} className="inline" />
              </Link>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-primary-400 mr-2" />
              <span className="text-sm text-gray-500">Total Makeup</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-semibold">{formatCurrency(totalMakeup)}</span>
              <Link to="#" className="text-primary-600 text-xs">
                View details <ChevronRight size={12} className="inline" />
              </Link>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-success-400 mr-2" />
              <span className="text-sm text-gray-500">Total Balance</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-semibold">{formatCurrency(totalBalance)}</span>
              <Link to="#" className="text-primary-600 text-xs">
                View balances <ChevronRight size={12} className="inline" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <Link 
            to={`/admin/systems/${systemId}/settlement`}
            className="btn-primary py-3 flex items-center justify-center bg-primary-600"
          >
            <Calendar size={18} className="mr-2" /> Weekly Settlement
          </Link>
          
          <button className="btn-success py-3 flex items-center justify-center">
            <Users size={18} className="mr-2" /> View Players
          </button>
        </div>

        {/* Latest Transactions */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <History size={20} className="text-gray-400 mr-2" />
              Latest Player Entries
            </h2>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>DATE</th>
                  <th>RESULT</th>
                  <th>RELOAD</th>
                  <th>WITHDRAWAL</th>
                  <th>MAKEUP</th>
                  <th>PROFIT</th>
                  <th>TOTAL BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {latestTransactions.map(({ player, transaction }) => (
                  <tr key={player.id}>
                    <td>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <span className="text-primary-600 text-xs">{player.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </td>
                    <td>{format(transaction.date, 'MMM dd, yyyy')}</td>
                    <td className={transaction.result < 0 ? 'text-danger-600' : 'text-success-600'}>
                      {formatCurrency(transaction.result)}
                    </td>
                    <td className="text-success-600">
                      {transaction.reload > 0 ? formatCurrency(transaction.reload) : '-'}
                    </td>
                    <td className="text-danger-600">
                      {transaction.withdrawal > 0 ? formatCurrency(transaction.withdrawal) : '-'}
                    </td>
                    <td className="text-danger-600">{formatCurrency(transaction.currentMakeup)}</td>
                    <td className={transaction.profit < 0 ? 'text-danger-600' : 'text-success-600'}>
                      {formatCurrency(transaction.profit)}
                    </td>
                    <td>{formatCurrency(transaction.totalBalance)}</td>
                  </tr>
                ))}
                {latestTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Pending Deposits */}
          <div className="card">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <DollarSign size={20} className="text-success-500 mr-2" />
              Pending Deposits
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 border-b">
                    <th className="pb-2 text-left">Player</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Date</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingDeposits.map(tx => (
                    <tr key={tx.id}>
                      <td className="py-3">
                        {players.find(p => p.id === tx.playerId)?.name}
                      </td>
                      <td className="py-3 text-right text-success-600 font-medium">
                        {formatCurrency(tx.reload)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {format(tx.date, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="text-success-600 hover:text-success-800">
                            <Check size={16} />
                          </button>
                          <button className="text-danger-600 hover:text-danger-800">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingDeposits.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No pending deposits
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="card">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <DollarSign size={20} className="text-danger-500 mr-2" />
              Pending Withdrawals
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 border-b">
                    <th className="pb-2 text-left">Player</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Date</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingWithdrawals.map(tx => (
                    <tr key={tx.id}>
                      <td className="py-3">
                        {players.find(p => p.id === tx.playerId)?.name}
                      </td>
                      <td className="py-3 text-right text-danger-600 font-medium">
                        {formatCurrency(tx.withdrawal)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {format(tx.date, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="text-success-600 hover:text-success-800">
                            <Check size={16} />
                          </button>
                          <button className="text-danger-600 hover:text-danger-800">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No pending withdrawals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Profit Chart */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Total Profit Overview</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-primary-500 mr-1"></div>
                <span className="text-xs text-gray-500">Individual Profit</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-success-200 mr-1"></div>
                <span className="text-xs text-gray-500">Accumulated Profit</span>
              </div>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="accumulatedProfit"
                  fill="#bbf7d0"
                  stroke="#22c55e"
                  fillOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="individualProfit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Players Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Players Overview</h2>
            <span className="badge badge-info">
              {players.length} Active Players
            </span>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>CURRENT MAKEUP</th>
                  <th>AVAILABLE BALANCE</th>
                  <th>BANK RESERVE</th>
                  <th>TOTAL PROFIT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <span className="text-primary-600 text-xs">{player.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </td>
                    <td className="font-medium text-primary-600">{formatCurrency(player.makeup)}</td>
                    <td className="font-medium">{formatCurrency(player.balance)}</td>
                    <td className="font-medium">{formatCurrency(player.bankReserve)}</td>
                    <td className={`font-medium ${player.profit < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      {formatCurrency(player.profit)}
                    </td>
                    <td>
                      <Link 
                        to="#"
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}