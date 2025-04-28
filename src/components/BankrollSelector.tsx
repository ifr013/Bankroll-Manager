import React from 'react';
import { PlusCircle, FolderOpen } from 'lucide-react';
import { BankrollData } from '../types/bankroll';

interface BankrollSelectorProps {
  bankrolls: BankrollData[];
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

const BankrollSelector: React.FC<BankrollSelectorProps> = ({
  bankrolls,
  onSelect,
  onCreateNew
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 p-6 text-white">
        <h2 className="text-2xl font-bold text-center">Bankroll Manager</h2>
        <p className="text-center mt-2 text-blue-100">Select an existing bankroll or create a new one</p>
      </div>

      <div className="p-6 space-y-6">
        {bankrolls.length > 0 && (
          <div className="space-y-4">
            {bankrolls.map(bankroll => (
              <button
                key={bankroll.id}
                onClick={() => onSelect(bankroll.id)}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{bankroll.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current: ${bankroll.currentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(bankroll.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Create New Bankroll</span>
        </button>
      </div>
    </div>
  );
};

export default BankrollSelector;