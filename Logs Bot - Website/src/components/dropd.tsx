import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faMagnifyingGlass, faX } from '@fortawesome/free-solid-svg-icons';

interface Channel { id: string; name: string; type: number; position: number; }
interface cdnProps { value: string; onChange: (value: string) => void; options: Channel[]; placeholder?: string; disabled?: boolean; }

export default function cdn({ value, onChange, options, placeholder = "Select channel...", disabled = false }: cdnProps) {
const [isOpen, setIsOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const dropdownRef = useRef<HTMLDivElement>(null);
const searchInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
const handleClickOutside = (event: MouseEvent) => {
if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setIsOpen(false); setSearchTerm(''); }
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

useEffect(() => { if (isOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isOpen]);

const selectedChannel = options.find(option => option.id === value);
const filteredOptions = options.filter(option => option.name.toLowerCase().includes(searchTerm.toLowerCase()));

const handleSelect = (channelId: string) => { onChange(channelId); setIsOpen(false); setSearchTerm(''); };
const clearSearch = () => { setSearchTerm(''); searchInputRef.current?.focus(); };

return (
<div className="relative" ref={dropdownRef}>
<motion.button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-sm focus:outline-none transition-all duration-200 ease-in-out touch-manipulation min-h-[44px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'border-blue-500 dark:border-blue-400 shadow-lg' : ''}`} whileTap={!disabled ? { scale: 0.98 } : {}}>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3 min-w-0 flex-1">
{selectedChannel ? (<span className="text-gray-900 dark:text-white font-medium truncate">#{selectedChannel.name}</span>) : (<span className="text-gray-500 dark:text-gray-400">{placeholder}</span>)}
</div>
<motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 text-gray-400 flex-shrink-0" /></motion.div>
</div>

</motion.button>

<AnimatePresence>
{isOpen && (
<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-xl overflow-hidden backdrop-blur-sm max-h-[70vh] sm:max-h-60" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
<div className="p-3 border-b border-gray-200 dark:border-gray-600">
<div className="relative">
<FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
<input ref={searchInputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search channels..." className="w-full pl-10 pr-10 py-2.5 sm:py-2 bg-gray-50 dark:bg-gray-600 border-[0.5px] border-gray-300/50 dark:border-gray-500/50 rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none touch-manipulation" />
{searchTerm && (<button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><FontAwesomeIcon icon={faX} className="h-4 w-4" /></button>)}
</div>
</div>

<div className="max-h-[50vh] sm:max-h-60 overflow-y-auto">
{filteredOptions.length === 0 ? (<div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">{searchTerm ? 'No channels found' : 'No channels available'}</div>) : (filteredOptions.map((option, index) => (<motion.button key={option.id} onClick={() => handleSelect(option.id)} className={`w-full px-4 py-3 sm:py-3 text-left flex items-center space-x-3 transition-all duration-150 ease-in-out touch-manipulation min-h-[44px] ${value === option.id ? 'bg-blue-100 dark:bg-gray-600' : ''}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
<span className="text-gray-900 dark:text-white font-normal flex-1 truncate">#{option.name}</span>
{value === option.id && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}><FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-blue-600 dark:text-blue-400" /></motion.div>)}
</motion.button>)))}
</div>
</motion.div>)}
</AnimatePresence>
</div>
);
} 