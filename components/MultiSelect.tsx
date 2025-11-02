import React from 'react';

interface MultiSelectProps {
  label?: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  error?: string;
  className?: string;
}

export default function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  error,
  className = '',
}: MultiSelectProps) {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[42px] max-h-48 overflow-y-auto bg-white">
          {selectedValues.length === 0 ? (
            <div className="text-gray-400 text-sm">اختر الموردين</div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedValues.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <span
                    key={value}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                  >
                    {option?.label || value}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(value);
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 mb-2"
            >
              {selectedValues.length === options.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

