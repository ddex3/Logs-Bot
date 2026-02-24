import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faCalendar } from '@fortawesome/free-solid-svg-icons';

interface DateRangeOption {
  value: '7d' | '30d' | '90d' | 'all' | '';
  label: string;
}

interface DateRangeDropdownProps {
  value: '7d' | '30d' | '90d' | 'all' | '';
  onChange: (value: '7d' | '30d' | '90d' | 'all' | '') => void;
  placeholder?: string;
  disabled?: boolean;
}

const dateRangeOptions: DateRangeOption[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
];

export default function DateRangeDropdown({ 
  value, 
  onChange, 
  placeholder = 'Select date range...', 
  disabled = false 
}: DateRangeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = dateRangeOptions.find(option => option.value === value);

  const handleSelect = (optionValue: '7d' | '30d' | '90d' | 'all' | '') => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left bg-white dark:bg-gray-700 
          border border-gray-200 dark:border-gray-700 rounded-lg 
          hover:border-gray-300 dark:hover:border-gray-600 
          focus:outline-none transition-all duration-200 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-gray-300 dark:border-gray-600' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {selectedOption ? (
              <>
                <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-normal">
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                {placeholder}
              </span>
            )}
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
            <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-700 
                       border border-gray-200 dark:border-gray-700 rounded-lg 
                       shadow-sm overflow-hidden"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="py-1">
              {dateRangeOptions.map((option, index) => {
                const isSelected = value === option.value;
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5 text-left flex items-center justify-between
                      transition-all duration-150 ease-in-out
                      ${isSelected 
                        ? 'bg-gray-50 dark:bg-gray-600/30 text-gray-700 dark:text-gray-200' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-600/20'
                      }
                    `}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <span className="text-sm font-normal">{option.label}</span>
                    {isSelected && (
                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
                        <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

