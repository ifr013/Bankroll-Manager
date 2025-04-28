import React, { useState } from 'react';
import { DollarSign, ArrowRight } from 'lucide-react';

interface InitialSetupProps {
  onSetup: (name: string, initialAmount: number) => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ onSetup }) => {
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState(10000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a name for your bankroll');
      return;
    }
    onSetup(name, initialAmount);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 p-6 text-white">
        <div className="flex items-center justify-center mb-4">
          <DollarSign className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold text-center">Create New Bankroll</h2>
        <p className="text-center mt-2 text-blue-100">Set up your initial bankroll details</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bankroll Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Main Bankroll"
            required
          />
        </div>

        <div>
          <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Initial Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">$</span>
            </div>
            <input
              type="number"
              id="initialAmount"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="block w-full pl-7 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="10000"
              min="1"
              step="1"
              required
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Enter the total amount of your current poker bankroll across all platforms.
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Create Bankroll <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default InitialSetup;