import React from 'react';
import { X } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface Platform {
  id: string;
  name: string;
  balance: number;
  reload: number;
  withdrawal: number;
}

interface PlatformEntryProps {
  platform: Platform;
  onChange: (platform: Platform) => void;
  onRemove: () => void;
}

const PlatformEntry: React.FC<PlatformEntryProps> = ({ platform, onChange, onRemove }) => {
  const handleValueChange = (field: keyof Platform, value: number) => {
    onChange({
      ...platform,
      [field]: value
    });
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{platform.name}</span>
        <button 
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <CurrencyInput
            value={platform.balance}
            onChange={(value) => handleValueChange('balance', value)}
            placeholder="0"
          />
          <span className="text-xs text-gray-500 mt-1 block">Balance</span>
        </div>
        
        <div>
          <CurrencyInput
            value={platform.reload}
            onChange={(value) => handleValueChange('reload', value)}
            placeholder="0"
            className="bg-green-50"
          />
          <span className="text-xs text-gray-500 mt-1 block">Reload</span>
        </div>
        
        <div>
          <CurrencyInput
            value={platform.withdrawal}
            onChange={(value) => handleValueChange('withdrawal', value)}
            placeholder="0"
            className="bg-red-50"
          />
          <span className="text-xs text-gray-500 mt-1 block">Withdrawal</span>
        </div>
      </div>
    </div>
  );
};

export default PlatformEntry;