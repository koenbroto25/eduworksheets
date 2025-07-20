import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  size?: number;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  showAllOption = true,
  size
}) => {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          size={size}
          className={`w-full ${size && size > 1 ? '' : 'appearance-none'} bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${size && size > 1 ? 'overflow-y-auto' : 'pr-8'}`}
        >
          {showAllOption && <option value="all">All {label}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(!size || size <= 1) && (
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};
