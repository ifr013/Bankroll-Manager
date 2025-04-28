import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface PlatformSelectorProps {
  availablePlatforms: string[];
  selectedPlatforms: string[];
  onSelectPlatform: (platformName: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  availablePlatforms,
  selectedPlatforms,
  onSelectPlatform
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableForSelection = availablePlatforms.filter(
    platform => !selectedPlatforms.includes(platform)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium transition-colors"
      >
        <Plus size={16} /> Manage Platforms
      </button>

      {isOpen && availableForSelection.length > 0 && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
          {availableForSelection.map(platform => (
            <button
              key={platform}
              onClick={() => {
                onSelectPlatform(platform);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
            >
              {platform}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;