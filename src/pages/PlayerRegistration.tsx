import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Calendar, DollarSign, Ban as Bank, Percent, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contractStartDate: new Date().toISOString().split('T')[0],
    dealPercentage: 50,
    hasBankReserve: false,
    bankReservePercentage: 20,
    type: 'Staking' as 'Staking' | 'CFP'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tableName = formData.type === 'Staking' ? 'staking_players' : 'cfp_players';

      const { data, error } = await supabase
        .from(tableName)
        .insert({
          name: formData.name,
          email: formData.email,
          contract_start_date: formData.contractStartDate,
          deal_percentage: formData.dealPercentage,
          has_bank_reserve: formData.hasBankReserve,
          bank_reserve_percentage: formData.bankReservePercentage
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Player account created successfully!');
      navigate(`/players/${data.id}`);
    } catch (error: any) {
      console.error('Error creating player:', error);
      toast.error(error.message || 'Failed to create player account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Create Player Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Fill in the player details to create a new account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Player Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'Staking' | 'CFP' }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="Staking">Staking</option>
                <option value="CFP">CFP</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Enter player's name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="player@example.com"
                />
              </div>
            </div>

            {/* Contract Start Date */}
            <div>
              <label htmlFor="contractStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contract Start Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="contractStartDate"
                  required
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Deal Percentage */}
            <div>
              <label htmlFor="dealPercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deal Percentage
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="dealPercentage"
                  required
                  min="0"
                  max="100"
                  value={formData.dealPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealPercentage: Number(e.target.value) }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Percentage of profits the player will receive
              </p>
            </div>

            {/* Bank Reserve */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasBankReserve"
                  checked={formData.hasBankReserve}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasBankReserve: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasBankReserve" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable Bank Reserve
                </label>
              </div>

              {formData.hasBankReserve && (
                <div>
                  <label htmlFor="bankReservePercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Reserve Percentage
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Bank className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="bankReservePercentage"
                      required
                      min="0"
                      max="100"
                      value={formData.bankReservePercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankReservePercentage: Number(e.target.value) }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Percentage of profits to be kept in reserve
                  </p>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Creating Account...
                  </>
                ) : (
                  'Create Player Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;