import React from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "0",
  className = ""
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove non-numeric characters except for decimal point
    const cleanedValue = inputValue.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleanedValue.split('.');
    const formattedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}` 
      : cleanedValue;
    
    // Convert to number or 0 if empty
    const numericValue = formattedValue === '' ? 0 : parseFloat(formattedValue);
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
        $
      </span>
      <input
        type="text"
        value={value === 0 ? '' : value.toString()}
        onChange={handleChange}
        placeholder={placeholder}
        className={`block w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 ${className}`}
      />
    </div>
  );
};

export default CurrencyInput;