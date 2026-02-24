import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDesktop, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
const { theme, setTheme } = useTheme();
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const handleClickOutside = (event: MouseEvent) => {
if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setIsOpen(false); }
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const getThemeIcon = () => { switch (theme) { case 'light': return <FontAwesomeIcon icon={faSun} className="h-4 w-4" />; case 'dark': return <FontAwesomeIcon icon={faMoon} className="h-4 w-4" />; default: return <FontAwesomeIcon icon={faDesktop} className="h-4 w-4" />; } };
const getThemeText = () => { switch (theme) { case 'light': return 'Light'; case 'dark': return 'Dark'; default: return 'System'; } };

const themeOptions = [{ value: 'system', label: 'System', icon: faDesktop, description: 'system preference' }, { value: 'light', label: 'Light', icon: faSun, description: 'Light theme' }, { value: 'dark', label: 'Dark', icon: faMoon, description: 'Dark theme' }] as const;

return (
<div className="relative w-full" ref={dropdownRef}>
<button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors w-full text-left">
{getThemeIcon()}
<span className="flex-1">Theme</span>
<FontAwesomeIcon icon={faChevronDown} className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
</button>

{isOpen && (
<div className="absolute left-full top-0 ml-2 w-56 max-w-xs bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-[9999] overflow-hidden">
<div className="px-3 py-1 border-b border-gray-200 dark:border-gray-600 mb-1">
<div className="text-sm font-medium text-gray-900 dark:text-white">Choose Theme</div>
</div>
{themeOptions.map((option) => {
const Icon = option.icon;
const isSelected = theme === option.value;
return (
<button key={option.value} onClick={() => { setTheme(option.value); setIsOpen(false); }} className={`w-full flex items-center space-x-2 px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded mx-2 ${isSelected ? 'bg-blue-25 dark:bg-blue-900/10 text-blue-500 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
<FontAwesomeIcon icon={option.icon} className="h-4 w-4" />
<div className="flex-1">
<div className="text-sm font-medium">{option.label}</div>
<div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
</div>
{isSelected && (<div />)}
</button>); })}
</div>)}
</div>
);
} 