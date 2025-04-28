import React, { useState } from 'react';
import { Save, Plus, Calendar, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { PlatformBalance } from '../types/bankroll';
import toast from 'react-hot-toast';

interface DailyEntryFormProps {
  onSubmit: (data: EntryData) => void;
}

interface EntryData {
  platforms: PlatformBalance[];
  date: string;
}

const AVAILABLE_PLATFORMS = [
  { name: 'PokerStars', type: 'poker' },
  { name: 'GGPoker', type: 'poker' },
  { name: 'ACR', type: 'poker' },
  { name: 'PartyPoker', type: 'poker' },
  { name: 'WPN', type: 'poker' },
  { name: 'iPoker', type: 'poker' },
  { name: 'Winamax', type: 'poker' },
  { name: '888poker', type: 'poker' },
  { name: 'Winning', type: 'poker' },
  { name: 'Chico', type: 'poker' },
  { name: 'Luxon', type: 'wallet' },
  { name: 'EcoPayz', type: 'wallet' },
  { name: 'MuchBetter', type: 'wallet' },
  { name: 'Gamers Wallet', type: 'wallet' }
];

const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ onSubmit }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['PokerStars', 'GGPoker', 'ACR']);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformBalance[]>([]);

  // Initialize platforms when selected platforms change
  React.useEffect(() => {
    const newPlatforms = selectedPlatforms.flatMap(platformName => [
      { 
        id: `${platformName.toLowerCase().replace(/\s+/g, '-')}-balance`,
        name: platformName,
        amount: 0,
        type: AVAILABLE_PLATFORMS.find(p => p.name === platformName)?.type || 'poker',
        transactionType: 'balance'
      },
      {
        id: `${platformName.toLowerCase().replace(/\s+/g, '-')}-deposit`,
        name: platformName,
        amount: 0,
        type: AVAILABLE_PLATFORMS.find(p => p.name === platformName)?.type || 'poker',
        transactionType: 'deposit'
      },
      {
        id: `${platformName.toLowerCase().replace(/\s+/g, '-')}-withdrawal`,
        name: platformName,
        amount: 0,
        type: AVAILABLE_PLATFORMS.find(p => p.name === platformName)?.type || 'poker',
        transactionType: 'withdrawal'
      }
    ]);
    setPlatforms(newPlatforms);
  }, [selectedPlatforms]);

  const handlePlatformChange = (id: string, amount: number) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === id ? { ...platform, amount } : platform
    ));
  };

  const togglePlatform = (platformName: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformName)) {
        return prev.filter(p => p !== platformName);
      }
      return [...prev, platformName];
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one platform is selected
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    // Calculate totals
    const totalBalance = platforms
      .filter(p => p.transactionType === 'balance')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDeposits = platforms
      .filter(p => p.transactionType === 'deposit')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalWithdrawals = platforms
      .filter(p => p.transactionType === 'withdrawal')
      .reduce((sum, p) => sum + p.amount, 0);

    // Submit the entry
    onSubmit({
      platforms,
      date: format(selectedDate, 'yyyy-MM-dd')
    });

    // Reset form
    setPlatforms(platforms.map(p => ({ ...p, amount: 0 })));
    toast.success('Entry saved successfully');
  };

  const groupedPlatforms = platforms.reduce((acc, platform) => {
    const name = platform.name;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(platform);
    return acc;
  }, {} as Record<string, PlatformBalance[]>);

  const total = platforms
    .filter(p => p.transactionType === 'balance')
    .reduce((sum, platform) => sum + platform.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Add Results</h2>
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              maxDate={new Date()}
              dateFormat="MMMM d, yyyy"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              customInput={
                <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  <Calendar className="h-5 w-5" />
                  <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
                </button>
              }
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Platform Selector */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Active Platforms
              </h3>
              <button
                type="button"
                onClick={() => setShowPlatformSelector(!showPlatformSelector)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Manage Platforms
              </button>
            </div>

            {showPlatformSelector && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {AVAILABLE_PLATFORMS.map(platform => (
                  <label
                    key={platform.name}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.name)}
                      onChange={() => togglePlatform(platform.name)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{platform.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({platform.type})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Platform Entries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedPlatforms).map(([platformName, platformEntries]) => (
              <div key={platformName} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {platformName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => togglePlatform(platformName)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {platformEntries.map((platform) => (
                    <div key={platform.id}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {platform.transactionType === 'balance' ? 'Balance' :
                         platform.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400">$</span>
                        </div>
                        <input
                          type="number"
                          value={platform.amount || ''}
                          onChange={(e) => handlePlatformChange(platform.id, parseFloat(e.target.value) || 0)}
                          className={`block w-full pl-7 py-2 border rounded-md shadow-sm focus:ring-2 dark:bg-gray-700 dark:text-white ${
                            platform.transactionType === 'balance' 
                              ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                              : platform.transactionType === 'deposit'
                              ? 'border-green-300 dark:border-green-600 focus:ring-green-500 focus:border-green-500'
                              : 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                          }`}
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Balance: </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Save className="mr-2 h-5 w-5" /> Save Daily Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyEntryForm;