import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import InitialSetup from './InitialSetup';
import DailyEntryForm from './DailyEntryForm';
import TransactionHistory from './TransactionHistory';
import BankrollSelector from './BankrollSelector';
import useBankrollStore from '../hooks/useBankrollStore';
import { calculateResult } from '../utils/result';
import { calculateMakeupOne } from '../utils/makeup';
import { calculateCurrentBankroll } from '../utils/calculations';

const BankrollManager = () => {
  const { 
    bankrolls,
    activeBankroll,
    createBankroll,
    setActiveBankroll,
    addDailyEntry,
    lastUpdate
  } = useBankrollStore();
  
  const [showingSetup, setShowingSetup] = useState(false);

  const totalProfit = useMemo(() => {
    if (!activeBankroll?.dailyEntries.length) return 0;
    return activeBankroll.dailyEntries.reduce((sum, entry) => sum + (entry.result || 0), 0);
  }, [activeBankroll?.dailyEntries, lastUpdate]);

  const currentBankroll = useMemo(() => {
    if (!activeBankroll?.dailyEntries.length) return activeBankroll?.initialAmount || 0;
    const lastEntry = activeBankroll.dailyEntries[activeBankroll.dailyEntries.length - 1];
    return calculateCurrentBankroll(lastEntry);
  }, [activeBankroll?.dailyEntries, activeBankroll?.initialAmount, lastUpdate]);

  const handleInitialSetup = (name: string, initialAmount: number) => {
    createBankroll(name, initialAmount);
    setShowingSetup(false);
    toast.success('Bankroll created successfully!');
  };

  const handleBackToSelector = () => {
    setActiveBankroll('');
    setShowingSetup(false);
  };

  const handleDailyEntry = (entryData: any) => {
    if (!activeBankroll) return;

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
    const sortedEntries = [...activeBankroll.dailyEntries].sort((a, b) => 
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
      date: entryData.date,
      platforms: entryData.platforms,
      total: totalBalances,
      result,
      makeupEffective: newMakeup,
      deposit: totalDeposits,
      withdrawal: totalWithdrawals
    };

    addDailyEntry(entry, totalBalances, result, newMakeup);
    toast.success('Daily entry saved successfully!');
  };

  if (!bankrolls.length && !showingSetup) {
    return <InitialSetup onSetup={handleInitialSetup} />;
  }

  if (!activeBankroll && !showingSetup) {
    return (
      <BankrollSelector
        bankrolls={bankrolls}
        onSelect={setActiveBankroll}
        onCreateNew={() => setShowingSetup(true)}
      />
    );
  }

  if (showingSetup) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToSelector}
          className="flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Bankrolls
        </button>
        <InitialSetup onSetup={handleInitialSetup} />
      </div>
    );
  }

  const currentMakeup = activeBankroll?.dailyEntries.length 
    ? activeBankroll.dailyEntries[activeBankroll.dailyEntries.length - 1].makeupEffective
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToSelector}
            className="flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Bankrolls
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeBankroll?.name}
          </h1>
        </div>
        <button
          onClick={() => setShowingSetup(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Bankroll
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Bankroll</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${currentBankroll.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Profit</h3>
          <p className="text-3xl font-bold text-green-500 dark:text-green-400">
            ${totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Makeup</h3>
          <p className={`text-3xl font-bold ${currentMakeup >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            ${currentMakeup.toLocaleString()}
          </p>
        </div>
      </div>

      <DailyEntryForm onSubmit={handleDailyEntry} />
      
      <div className="w-full">
        <TransactionHistory 
          entries={activeBankroll?.dailyEntries || []} 
          key={lastUpdate} 
        />
      </div>
    </div>
  );
};

export default BankrollManager;