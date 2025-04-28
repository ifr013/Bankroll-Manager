import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Users, Calendar, DollarSign, Settings, ArrowRight } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const systems = useSystemsStore(state => state.getSystemsByAdminId(user?.id || ''));
  const recentActivities = useSystemsStore(state => state.getRecentActivities());
  const [selectedTab, setSelectedTab] = useState('systems');
  
  // Calculate stats from systems data
  const totalPlayers = systems.reduce((acc, system) => acc + system.playersCount, 0);
  const activeSystems = systems.filter(system => system.status === 'active').length;
  const totalBalance = systems.reduce((acc, system) => acc + system.totalBalance, 0);

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
      <Header title="Admin Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Systems Table Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your Systems</h1>
          <Link 
            to="/admin/systems/create" 
            className="btn-primary"
          >
            <Plus size={16} className="mr-1" /> Add New System
          </Link>
        </div>
        
        {systems.length > 0 ? (
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
                      <td className="font-medium">{system.name}</td>
                      <td>{system.type}</td>
                      <td>{system.playersCount}</td>
                      <td className="font-medium">{formatCurrency(system.totalBalance)}</td>
                      <td>
                        <span className={`badge ${
                          system.status === 'active' ? 'badge-success' : 
                          system.status === 'paused' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {system.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          to={`/admin/systems/${system.id}`}
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
        ) : (
          <div className="bg-white shadow sm:rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-500">You don't have any systems yet.</p>
            <Link 
              to="/admin/systems/create" 
              className="btn-primary mt-4 inline-flex"
            >
              <Plus size={16} className="mr-1" /> Create Your First System
            </Link>
          </div>
        )}
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-primary-100 p-3 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Poker Bankroll Manager</h3>
              <p className="text-gray-500 text-sm">Manage player bankrolls and transactions</p>
            </div>
          </div>
          
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg mr-4">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Systems</h3>
              <p className="text-gray-500 text-sm">Manage and monitor all systems</p>
            </div>
          </div>
          
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Weekly Settlement</h3>
              <p className="text-gray-500 text-sm">Process weekly settlements</p>
            </div>
          </div>
          
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Players</h3>
              <p className="text-gray-500 text-sm">Manage player accounts</p>
            </div>
          </div>
          
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Analytics</h3>
              <p className="text-gray-500 text-sm">View performance metrics</p>
            </div>
          </div>
          
          <div className="card flex items-start">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg mr-4">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Profile</h3>
              <p className="text-gray-500 text-sm">Manage your account</p>
            </div>
          </div>
        </div>
        
        {/* Stats and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Quick Stats</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Players</p>
                <p className="text-2xl font-bold">{totalPlayers}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Active Systems</p>
                <p className="text-2xl font-bold">{activeSystems}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <button className="text-sm text-primary-600 hover:text-primary-800">View all</button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.slice(0, 3).map(activity => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {activity.type === 'deposit' && (
                      <div className="bg-green-100 p-2 rounded-md">
                        <DollarSign size={16} className="text-green-600" />
                      </div>
                    )}
                    {activity.type === 'player_added' && (
                      <div className="bg-blue-100 p-2 rounded-md">
                        <Users size={16} className="text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'settlement' && (
                      <div className="bg-purple-100 p-2 rounded-md">
                        <Calendar size={16} className="text-purple-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {activity.type === 'deposit' && 'New deposit'}
                        {activity.type === 'player_added' && 'New player added'}
                        {activity.type === 'settlement' && 'Weekly settlement completed'}
                      </p>
                      <span className="text-xs text-gray-500">{getRelativeTime(activity.date)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {activity.type === 'deposit' && `Player: ${activity.playerName}`}
                      {activity.type === 'player_added' && `Player: ${activity.playerName}`}
                      {activity.type === 'settlement' && `Period: ${activity.period}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}