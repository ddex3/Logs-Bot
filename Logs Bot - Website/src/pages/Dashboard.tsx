import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faServer, faArrowUpRightFromSquare, faRotate } from '@fortawesome/free-solid-svg-icons';
import ServerCard from '../components/ServerCard';
import CustomLoader from '../components/CustomLoader';
import BeatLoader from 'react-spinners/BeatLoader';

export default function Dashboard() {
const { user, guilds, isLoading, isLoadingGuilds, fetchGuilds } = useAuth();
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<'all' | 'with-bot' | 'without-bot'>('all');
const BOT_INVITE_URL = import.meta.env.VITE_BOT_INVITE_URL;

useEffect(() => { if (user && guilds.length === 0 && !isLoadingGuilds) fetchGuilds(); }, [user, guilds, fetchGuilds, isLoadingGuilds]);

const handleRefresh = async () => { await fetchGuilds(); };

const filteredGuilds = guilds.filter(guild => { const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase()); const matchesFilter = filterStatus === 'all' || (filterStatus === 'with-bot' && guild.botPresent) || (filterStatus === 'without-bot' && !guild.botPresent); return matchesSearch && matchesFilter; });

const sortedGuilds = [...filteredGuilds].sort((a, b) => { if (a.botPresent === b.botPresent) return 0; return a.botPresent ? -1 : 1; });

const botPresentGuilds = guilds.filter(g => g.botPresent);

if (isLoading) return (<div className="min-h-screen flex items-center justify-center"><CustomLoader message="Loading your servers..." size="lg" /></div>);

if (!user) return (<div className="min-h-screen flex items-center justify-center"><motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Please log in to access your dashboard.</p></motion.div></div>);


return (
<div className="min-h-screen pt-20 sm:pt-24 lg:pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
<div className="max-w-7xl mx-auto">
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
<div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
<motion.img src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'} alt={user.username} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} draggable="false" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
<div className="flex-1 min-w-0">
<motion.h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>Welcome back, {user.username}!</motion.h1>
<motion.div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}><span>{botPresentGuilds.length} Servers with bot active</span>{guilds.length > 0 && (<span className="text-gray-400">•</span>)}{guilds.length > 0 && (<span className="text-gray-500">{guilds.length - botPresentGuilds.length} Servers without bot</span>)}</motion.div>
</div>
</div>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto overflow-hidden">
<div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
<motion.button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px] whitespace-nowrap ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-400 dark:active:bg-gray-500'}`}>All ({guilds.length})</motion.button>
<motion.button onClick={() => setFilterStatus('with-bot')} className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px] whitespace-nowrap ${filterStatus === 'with-bot' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-400 dark:active:bg-gray-500'}`}>With Bot ({botPresentGuilds.length})</motion.button>
<motion.button onClick={() => setFilterStatus('without-bot')} className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px] whitespace-nowrap ${filterStatus === 'without-bot' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-400 dark:active:bg-gray-500'}`}>Without Bot ({guilds.length - botPresentGuilds.length})</motion.button>
</div>

<motion.button onClick={handleRefresh} disabled={isLoadingGuilds} className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg active:bg-gray-400 dark:active:bg-gray-500 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px] whitespace-nowrap">{isLoadingGuilds ? <BeatLoader size={6} color="#374151" /> : <FontAwesomeIcon icon={faRotate} className="h-4 w-4" />}<span className="hidden sm:inline">Refresh</span></motion.button>

<div className="relative w-full sm:w-auto">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
<input type="text" placeholder="Search servers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base touch-manipulation min-h-[44px]" />
</div>
</div>
</div>

{isLoadingGuilds ? (<div className="flex justify-center py-12"><CustomLoader message="Loading server data..." size="lg" /></div>) : filteredGuilds.length === 0 ? (<motion.div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 md:p-12 text-center border border-gray-200 dark:border-gray-700" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.6 }}><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 10 }}><FontAwesomeIcon icon={faServer} className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" /></motion.div><h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{searchTerm ? 'No servers found' : 'No Servers Found'}</h3><p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto px-4">{searchTerm ? `No servers match "${searchTerm}". Try a different search term.` : "You don't have any servers where you can manage Logs Bot. Make sure the bot is invited to your server and you have the \"Manage Server\" permission."}</p>{!searchTerm && (<motion.a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-5 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl touch-manipulation min-h-[44px] text-sm sm:text-base" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>Invite Bot to Server<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 h-4 w-4" /></motion.a>)}</motion.div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">{sortedGuilds.map((guild, index) => (<ServerCard key={guild.id} guild={guild} index={index} />))}</div>)}
</motion.div>
</div>
</div>
);
}