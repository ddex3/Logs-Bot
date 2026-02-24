import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faUsers, faX, faCalendar, faArrowUpRightFromSquare, faHashtag, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface ServerCardProps {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    botPresent?: boolean;
    memberCount?: number;
    approximatePresenceCount?: number;
    botJoinedAt?: string;
  };
  index: number;
}

export default function ServerCard({ guild, index }: ServerCardProps) {
  const BOT_INVITE_URL = import.meta.env.VITE_BOT_INVITE_URL;

  const getServerIcon = () => guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;
  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  const formatJoinDate = (dateString?: string) => { if (!dateString) return 'Unknown'; try { const date = new Date(dateString); return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return 'Unknown'; } };
  const formatMemberCount = (count?: number) => { if (!count || count === 0) return '0'; if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`; else if (count >= 1000) return `${(count / 1000).toFixed(1)}K`; return count.toLocaleString(); };


  const CardContent = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 min-h-[220px] sm:min-h-[240px] flex flex-col justify-between ${guild.botPresent ? '' : 'opacity-75 bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-5">
        <div className="relative flex-shrink-0">
          <motion.div>
            {getServerIcon() ? (<img src={getServerIcon()!} alt={guild.name} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg ${!guild.botPresent ? 'grayscale' : ''}`} draggable="false" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />) : (<div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ${!guild.botPresent ? 'grayscale' : ''}`}><span className="text-white font-bold text-xs sm:text-sm">{getInitials(guild.name)}</span></div>)}
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate text-base sm:text-base transition-colors ${guild.botPresent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{guild.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-sm">{guild.owner ? 'Owner' : 'Admin'}</p>
        </div>
      </div>

      <div className="mb-1 space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-start text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center min-w-0"><FontAwesomeIcon icon={faHashtag} className="h-3.5 w-3.5 mr-1 flex-shrink-0" />Server ID:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300 ml-2 truncate">{guild.id}</span>
        </div>
        <div className="flex items-center justify-start text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center min-w-0"><FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5 mr-1 flex-shrink-0" />Members:</span>
          <span className={`font-semibold ml-2 ${guild.botPresent ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}`}>{guild.botPresent ? (guild.memberCount ? formatMemberCount(guild.memberCount) : 'Unknown') : 'Bot not in server'}</span>
        </div>
        <div className="flex items-center justify-start text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center min-w-0"><FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-gray-500 dark:text-gray-400" />Online:</span>
          <span className={`font-semibold ml-2 ${guild.botPresent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{guild.botPresent ? (guild.approximatePresenceCount ? formatMemberCount(guild.approximatePresenceCount) : 'Unknown') : 'Bot not in server'}</span>
        </div>
        {guild.botPresent && guild.botJoinedAt && (<div className="flex items-center justify-start text-sm text-gray-500 dark:text-gray-400"><span className="flex items-center min-w-0"><FontAwesomeIcon icon={faCalendar} className="h-3.5 w-3.5 mr-1 flex-shrink-0" />Bot joined:</span><span className="font-semibold text-blue-600 dark:text-blue-400 ml-2">{formatJoinDate(guild.botJoinedAt)}</span></div>)}
        {!guild.botPresent && (<div className="flex items-center justify-start text-sm text-gray-500 dark:text-gray-400"><span className="flex items-center min-w-0"><FontAwesomeIcon icon={faX} className="h-3.5 w-3.5 mr-1 flex-shrink-0" />Status:</span><span className="font-semibold text-red-600 dark:text-red-400 ml-2">Bot not in server</span></div>)}
      </div>


      <div className="flex items-center justify-end mt-3 sm:mt-4">
        {guild.botPresent ? (<Link to={`/${guild.id}/dashboard/config`} className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/25 border border-blue-500/30 hover:border-blue-500/50 text-blue-600 dark:text-blue-400 text-sm sm:text-sm font-medium rounded-lg transition-all touch-manipulation min-h-[44px]"><FontAwesomeIcon icon={faGear} className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Manage</span></Link>) : (<motion.a href={`${BOT_INVITE_URL}&guild_id=${guild.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500/10 hover:bg-green-500/20 active:bg-green-500/25 border border-green-500/30 hover:border-green-500/50 text-green-600 dark:text-green-400 text-sm sm:text-sm font-medium rounded-lg transition-all touch-manipulation min-h-[44px]" onClick={(e) => e.stopPropagation()} whileTap={{ scale: 0.95 }}><FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Invite Bot</span></motion.a>)}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="group">
      <CardContent />
    </motion.div>
  );
}