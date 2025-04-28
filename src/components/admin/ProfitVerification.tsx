import React, { useState } from 'react';
import { Check, DollarSign } from 'lucide-react';
import { PlayerSummary } from '../../types/admin';
import { formatCurrency } from '../../utils/calculations';

interface ProfitVerificationProps {
  player: PlayerSummary;
  onVerify: (playerId: string, wasPositive: boolean, profitWithdrawn: number) => void;
}

const ProfitVerification: React.FC<ProfitVerificationProps> = ({ player, onVerify }) => {
  const [profitAmount, setProfitAmount] = useState<number>(0);
  
  const handleVerification = () => {
    onVerify(player.id, true, profitAmount);
    setProfitAmount(0);
  };

  return (
    <div className="flex items-center space-x-4">
      {player.currentMakeup > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="number"
            value={profitAmount}
            onChange={(e) => setProfitAmount(Number(e.target.value))}
            className="pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Profit amount"
          />
        </div>
      )}
      
      <button
        onClick={handleVerification}
        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
      >
        <Check className="h-4 w-4 mr-1" />
        Verify Profit
      </button>
    </div>
  );
};

export default ProfitVerification;