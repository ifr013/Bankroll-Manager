import { Link } from 'react-router-dom';
import { DollarSign, ChevronRight, CalendarClock, CreditCard, History, BarChart3 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';
import { useAuth } from '../../context/AuthContext';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const players = useSystemsStore(state => state.players);
  const systems = useSystemsStore(state => state.systems);
  const platformBalances = useSystemsStore(state => state.platformBalances);
  const recentActivities = useSystemsStore(state => state.recentActivities);
  
  // Find the current player (for demo, just use the first player)
  const currentPlayer = players[1]; // Using the "New Player" for demo
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format date for activities
  const formatActivityDate = (date: Date) => {
    if (isToday(date)) {
      return `${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return `${format(date, 'MMM d, yyyy')}`;
    }
  };
  
  // Get relative time for activities
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.round(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Player Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Systems Table Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your Systems</h1>
        </div>
        
        <div className="overflow-hidden bg-white shadow mb-6 sm:rounded-lg">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SYSTEM</th>
                  <th>TYPE</th>
                  <th>PLAYERS</th>
                  <th>TOTAL BALANCE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {systems.map(system => (
                  <tr key={system.id}>
                    <td className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <DollarSign size={16} className="text-primary-600" />
                        </div>
                        {system.name}
                      </div>
                    </td>
                    <td>
                      <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {system.type}
                      </span>
                    </td>
                    <td>{system.playersCount}</td>
                    <td className="font-medium">{formatCurrency(system.totalBalance)}</td>
                    <td>
                      <span className="badge badge-success">
                        active
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/player/systems/${system.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Details <ChevronRight size={16} className="inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <CreditCard size={20} className="text-primary-200" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(currentPlayer.balance)}</p>
          </div>
          
          <div className="card relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <DollarSign size={20} className="text-danger-200" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Current Makeup</p>
            <p className="text-2xl font-bold text-danger-600">{formatCurrency(currentPlayer.makeup)}</p>
          </div>
          
          <div className="card relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <BarChart3 size={20} className="text-success-200" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Profit</p>
            <p className={`text-2xl font-bold ${currentPlayer.profit < 0 ? 'text-danger-600' : 'text-success-600'}`}>
              {formatCurrency(currentPlayer.profit)}
            </p>
          </div>
          
          <div className="card relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <CalendarClock size={20} className="text-purple-200" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Last Settlement</p>
            <p className="text-2xl font-bold">2024-03-21</p>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary-100 p-3 rounded-lg mr-4">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Platforms</h3>
                <p className="text-gray-500 text-sm">Manage your poker platforms</p>
              </div>
            </div>
          </div>
          
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-success-100 p-3 rounded-lg mr-4">
                <History className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Transactions</h3>
                <p className="text-gray-500 text-sm">View your transaction history</p>
              </div>
            </div>
          </div>
          
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg mr-4">
                <CalendarClock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Settlements</h3>
                <p className="text-gray-500 text-sm">View settlement history</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Platform Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Overview */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Platform Overview</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {platformBalances.map(platform => (
                <div key={platform.platform} className="flex justify-between items-center">
                  <span className="text-gray-700">{platform.platform}</span>
                  <span className="font-medium">{formatCurrency(platform.balance)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <button className="text-sm text-primary-600 hover:text-primary-800">View all</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-success-100 p-2 rounded-md">
                    <DollarSign size={16} className="text-success-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Deposit on PokerStars</p>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-success-600">$5,000.00</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-danger-100 p-2 rounded-md">
                    <DollarSign size={16} className="text-danger-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Withdrawal on GGPoker</p>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <p className="text-sm text-danger-600">$2,000.00</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-purple-100 p-2 rounded-md">
                    <CalendarClock size={16} className="text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Weekly Settlement (Mar 15 - Mar 21)</p>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  <p className="text-sm text-success-600">$3,500.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}