import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, PlusCircle, DollarSign, Users, Key } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  current_makeup: number;
  contract_start_date: string;
  deal_percentage: number;
  has_bank_reserve: boolean;
  bank_reserve_percentage: number;
  type: 'Staking' | 'CFP';
  available_balance: number;
  total_profit: number;
  email: string;
}

const PlayerOverview = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    contract_start_date: new Date().toISOString().split('T')[0],
    player_percentage: 50,
    backer_percentage: 50,
    has_bank_reserve: false,
    bank_reserve_percentage: 20,
    type: 'Staking' as 'Staking' | 'CFP'
  });
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch staking players
      const { data: stakingPlayers, error: stakingError } = await supabase
        .from('staking_players')
        .select('*')
        .order('name');

      if (stakingError) throw stakingError;

      // Fetch CFP players
      const { data: cfpPlayers, error: cfpError } = await supabase
        .from('cfp_players')
        .select('*')
        .order('name');

      if (cfpError) throw cfpError;

      // Combine and format players data
      const allPlayers = [
        ...(stakingPlayers || []).map(p => ({ ...p, type: 'Staking' as const })),
        ...(cfpPlayers || []).map(p => ({ ...p, type: 'CFP' as const }))
      ].sort((a, b) => a.name.localeCompare(b.name));

      setPlayers(allPlayers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate percentages
    if (newPlayer.player_percentage + newPlayer.backer_percentage !== 100) {
      toast.error('Player and Backer percentages must sum to 100%');
      return;
    }

    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        toast.error('You must be logged in to add players');
        return;
      }

      // Check if the current user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        toast.error('You do not have permission to add players');
        return;
      }

      let userId: string;

      // Check if user already exists using maybeSingle() instead of single()
      const { data: existingUser, error: userLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newPlayer.email)
        .maybeSingle();

      if (userLookupError) {
        throw userLookupError;
      }

      if (existingUser) {
        // Use existing user's ID
        userId = existingUser.id;
      } else {
        // Create new user account
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
          email: newPlayer.email,
          password: 'temp' + Math.random().toString(36).slice(-8), // Random temporary password
          options: {
            data: {
              name: newPlayer.name,
              is_player: true
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!userData.user) throw new Error('No user data returned');
        
        userId = userData.user.id;

        // Create user profile in public.users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: newPlayer.email,
            name: newPlayer.name,
            is_player: true
          });

        if (profileError) throw profileError;
      }
      
      // Insert player into appropriate table based on type
      const tableName = newPlayer.type === 'Staking' ? 'staking_players' : 'cfp_players';
      const { error: playerError } = await supabase
        .from(tableName)
        .insert({
          name: newPlayer.name,
          email: newPlayer.email,
          contract_start_date: newPlayer.contract_start_date,
          deal_percentage: newPlayer.player_percentage,
          has_bank_reserve: newPlayer.has_bank_reserve,
          bank_reserve_percentage: newPlayer.bank_reserve_percentage,
          user_id: userId,
          created_by: session.user.id
        });

      if (playerError) throw playerError;

      toast.success('Player added successfully!');
      setShowAddModal(false);
      setNewPlayer({
        name: '',
        email: '',
        contract_start_date: new Date().toISOString().split('T')[0],
        player_percentage: 50,
        backer_percentage: 50,
        has_bank_reserve: false,
        bank_reserve_percentage: 20,
        type: 'Staking'
      });
      fetchData(); // Refresh the player list
    } catch (error: any) {
      console.error('Error adding player:', error);
      toast.error(error.message || 'Failed to add player');
    }
  };

  const handleViewPlayer = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  // Handle percentage changes with validation
  const handlePercentageChange = (field: 'player_percentage' | 'backer_percentage', value: number) => {
    const otherField = field === 'player_percentage' ? 'backer_percentage' : 'player_percentage';
    const newValue = Math.max(0, Math.min(100, value)); // Clamp between 0 and 100
    setNewPlayer(prev => ({
      ...prev,
      [field]: newValue,
      [otherField]: 100 - newValue
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Players Overview
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Player
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Players List
            </h3>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Users className="h-4 w-4 mr-1" />
              {players.length} players
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
              {players.map((player) => (
                <li 
                  key={player.id} 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewPlayer(player.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {player.name}
                          </span>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            player.type === 'Staking'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {player.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Started {format(parseISO(player.contract_start_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Available Balance
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          ${player.available_balance.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Current Makeup
                        </div>
                        <div className={`text-sm ${
                          player.current_makeup >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ${player.current_makeup.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Total Profit
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          ${player.total_profit.toLocaleString()}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </li>
              ))}
              {players.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No players registered yet. Click "Add Player" to get started.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Add Player Modal */}
        {showAddModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleAddPlayer} className="p-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Add New Player
                  </h3>

                  {/* Player Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Player Type
                    </label>
                    <select
                      value={newPlayer.type}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, type: e.target.value as 'Staking' | 'CFP' }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Staking">Staking</option>
                      <option value="CFP">CFP</option>
                    </select>
                  </div>

                  {/* Player Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Contract Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contract Start Date
                    </label>
                    <input
                      type="date"
                      value={newPlayer.contract_start_date}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, contract_start_date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Player Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Player Percentage
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={newPlayer.player_percentage}
                        onChange={(e) => handlePercentageChange('player_percentage', Number(e.target.value))}
                        className="block w-full pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        min="0"
                        max="100"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Backer Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Backer Percentage
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={newPlayer.backer_percentage}
                        onChange={(e) => handlePercentageChange('backer_percentage', Number(e.target.value))}
                        className="block w-full pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        min="0"
                        max="100"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Player and Backer percentages must sum to 100%
                    </p>
                  </div>

                  {/* Bank Reserve */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has_bank_reserve"
                      checked={newPlayer.has_bank_reserve}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, has_bank_reserve: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="has_bank_reserve" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Has Bank Reserve
                    </label>
                  </div>

                  {/* Bank Reserve Percentage */}
                  {newPlayer.has_bank_reserve && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bank Reserve Percentage
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          value={newPlayer.bank_reserve_percentage}
                          onChange={(e) => setNewPlayer(prev => ({ ...prev, bank_reserve_percentage: Number(e.target.value) }))}
                          className="block w-full pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          min="0"
                          max="100"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Player
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && selectedPlayer && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                      <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Player Login Information
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Login credentials for {selectedPlayer.name}
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </label>
                          <input
                            type="text"
                            value={selectedPlayer.email}
                            readOnly
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Temporary Password
                          </label>
                          <input
                            type="text"
                            value="[Generated on first login]"
                            readOnly
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerOverview;