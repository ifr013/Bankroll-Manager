import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Ban as Bank, 
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock,
  Settings
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/calculations';
import DailyEntryForm from '../components/DailyEntryForm';
import TransactionHistory from '../components/TransactionHistory';
import SiteTransactions from '../components/SiteTransactions';
import { DailyEntry } from '../types/bankroll';
import { calculateResult } from '../utils/result';
import { calculateMakeupOne } from '../utils/makeup';

interface PlayerData {
  id: string;
  name: string;
  email: string;
  current_makeup: number;
  available_balance: number;
  bank_reserve: number;
  total_withdrawals: number;
  total_profit: number;
  contract_start_date: string;
  deal_percentage: number;
  has_bank_reserve: boolean;
  bank_reserve_percentage: number;
  type: 'Staking' | 'CFP';
  dailyEntries?: DailyEntry[];
}

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showSiteTransactions, setShowSiteTransactions] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [lastUpdate]);

  const fetchPlayerData = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      // Try to get player from staking_players first
      let { data: playerData, error: stakingError } = await supabase
        .from('staking_players')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (stakingError) {
        // If not found in staking_players, try cfp_players
        const { data: cfpData, error: cfpError } = await supabase
          .from('cfp_players')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (cfpError) {
          throw new Error('Player data not found');
        }

        playerData = { ...cfpData, type: 'CFP' };
      } else {
        playerData = { ...playerData, type: 'Staking' };
      }

      // Fetch daily entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('player_id', playerData.id)
        .order('date', { ascending: false });

      if (entriesError) throw entriesError;

      setPlayer({
        ...playerData,
        dailyEntries: entriesData || []
      });
    } catch (error) {
      console.error('Error fetching player data:', error);
      toast.error('Failed to load player data');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyEntry = async (entryData: any) => {
    if (!player) return;

    try {
      const totalBalances = entryData.platforms
        .filter((p: any) => p.transactionType === 'balance')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const totalWithdrawals = entryData.platforms
        .filter((p: any) => p.transactionType === 'withdrawal')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const totalDeposits = entryData.platforms
        .filter((p: any) => p.transactionType === 'deposit')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      // Sort entries by date to find the last entry before the current date
      const sortedEntries = [...(player.dailyEntries || [])].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const currentDate = new Date(entryData.date);
      const lastEntry = sortedEntries
        .filter(entry => new Date(entry.date) < currentDate)
        .pop();

      const isFirstEntry = !lastEntry;
      
      const result = calculateResult(
        isFirstEntry,
        totalBalances,
        lastEntry,
        totalDeposits,
        totalWithdrawals
      );

      const newMakeup = calculateMakeupOne(
        isFirstEntry,
        totalBalances,
        result,
        lastEntry,
        totalDeposits,
        totalWithdrawals
      );

      const entry = {
        player_id: player.id,
        date: entryData.date,
        platforms: entryData.platforms,
        total: totalBalances,
        result,
        makeup_effective: newMakeup,
        deposit: totalDeposits,
        withdrawal: totalWithdrawals
      };

      // Insert the entry
      const { error: insertError } = await supabase
        .from('daily_entries')
        .insert(entry);

      if (insertError) throw insertError;

      // Update player data
      const { error: updateError } = await supabase
        .from(player.type === 'Staking' ? 'staking_players' : 'cfp_players')
        .update({
          current_makeup: newMakeup,
          available_balance: totalBalances,
          total_withdrawals: player.total_withdrawals + totalWithdrawals,
          total_profit: player.total_profit + result
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      toast.success('Daily entry saved successfully');
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error saving daily entry:', error);
      toast.error('Failed to save daily entry');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Player data not found</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {player.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {player.type} Player Account
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSiteTransactions(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Site Transactions
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Makeup */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Makeup
                </h3>
              </div>
              {player.current_makeup >= 0 ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className={`mt-4 text-2xl font-semibold ${
              player.current_makeup >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(player.current_makeup)}
            </p>
          </div>

          {/* Available Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Available Balance
              </h3>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(player.available_balance)}
            </p>
          </div>

          {/* Bank Reserve */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bank className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Bank Reserve
              </h3>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(player.bank_reserve)}
            </p>
            {player.has_bank_reserve && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {player.bank_reserve_percentage}% Reserve Rate
              </p>
            )}
          </div>

          {/* Total Profit */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Profit
                </h3>
              </div>
              {player.total_profit >= 0 ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className={`mt-4 text-2xl font-semibold ${
              player.total_profit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(player.total_profit)}
            </p>
          </div>
        </div>

        {/* Contract Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contract Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contract Start Date</p>
              <div className="mt-2 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <p className="text-gray-900 dark:text-white">
                  {format(parseISO(player.contract_start_date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deal Percentage</p>
              <div className="mt-2 flex items-center">
                <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                <p className="text-gray-900 dark:text-white">
                  {player.deal_percentage}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</p>
              <div className="mt-2 flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <p className="text-gray-900 dark:text-white">
                  {formatCurrency(player.total_withdrawals)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Entry Form */}
        <DailyEntryForm onSubmit={handleDailyEntry} />

        {/* Transaction History */}
        <TransactionHistory entries={player.dailyEntries || []} />

        {/* Site Transactions Modal */}
        {showSiteTransactions && (
          <SiteTransactions
            entries={player.dailyEntries || []}
            onClose={() => setShowSiteTransactions(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;