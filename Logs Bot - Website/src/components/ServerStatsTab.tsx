import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faShield, faArrowTrendUp, faArrowTrendDown, faBolt, faHeart, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { discordApi } from '../services/api';
import CustomLoader from './CustomLoader';
import BeatLoader from 'react-spinners/BeatLoader';

interface ServerStatsTabProps {
  guildId: string;
  guild: any;
}

interface StatCard {
  icon: any;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color: string;
  bgColor: string;
  description?: string;
}

interface ServerStats {
  overview: {
    totalMembers: number;
    onlineMembers: number;
    totalChannels: number;
    totalRoles: number;
    serverAge: string;
    boostLevel: number;
    verificationLevel: number;
  };
  activity: {
    messagesToday: number;
    messagesWeek: number;
    messagesMonth: number;
    eventsToday: number;
    eventsWeek: number;
    eventsMonth: number;
    voiceMinutes: number;
    streamMinutes: number;
  };
  growth: {
    membersJoined: number;
    membersLeft: number;
    netGrowth: number;
    growthRate: string;
    peakOnline: number;
    averageOnline: number;
  };
  moderation: {
    bansToday: number;
    timeoutsToday: number;
    kicksToday: number;
    totalBans: number;
    totalTimeouts: number;
    totalKicks: number;
  };
  engagement: {
    activeUsers: number;
    inactiveUsers: number;
    veryActiveUsers: number;
    engagementRate: string;
    averageMessagesPerUser: number;
    topChannel: string;
    topChannelMessages: number;
  };
  dailyLogs: {
    count: number;
    change: string;
    date: string;
  };
  logsByType: Array<{
    log_type: string;
    count: number;
    today_count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

export default function ServerStatsTab({ guildId }: ServerStatsTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState<any>(null);
  const [presenceStats, setPresenceStats] = useState<any>(null);
  const [mostActiveUsers, setMostActiveUsers] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadStats();
    
    const statsInterval = setInterval(() => {
      loadStats();
    }, 300000);
    
    return () => clearInterval(statsInterval);
  }, [guildId, timeRange]);



  useEffect(() => {
    loadRealtimeStats();
    loadPresenceStats();
    loadMostActiveUsers();
    const interval = setInterval(() => {
      loadRealtimeStats();
      loadPresenceStats();
      loadMostActiveUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [guildId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await discordApi.getServerStats(guildId, timeRange);
      if (response.success && response.stats) {
        setStats(response.stats);
      } else {
        console.error('Failed to load stats:', response.message);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const loadRealtimeStats = async () => {
    try {
      const response = await discordApi.getRealtimeStats(guildId);
      if (response.success && response.data) {
        setRealtimeStats(response.data);
      }
    } catch (error) {
      console.error('Error loading real-time stats:', error);
    }
  };

  const loadPresenceStats = async () => {
    try {
      const response = await discordApi.getPresenceStats(guildId);
      if (response.success && response.data) {
        setPresenceStats(response.data);
      }
    } catch (error) {
      console.error('Error loading presence stats:', error);
    }
  };

  const loadMostActiveUsers = async () => {
    try {
      const response = await discordApi.getMostActiveUsers(guildId, 5);
      if (response.success && response.data) {
        setMostActiveUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading most active users:', error);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <CustomLoader message="Loading server statistics..." size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load statistics</p>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      icon: faUsers,
      title: 'Total Members',
      value: stats.overview.totalMembers.toLocaleString(),
      change: `+${stats.growth.membersJoined}`,
      changeType: 'positive',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: presenceStats ? `${presenceStats.totalOnline.toLocaleString()} online` : `${stats.overview.onlineMembers.toLocaleString()} online`
    },
    {
      icon: faChartLine,
      title: 'Online Users',
      value: presenceStats ? presenceStats.totalOnline.toLocaleString() : '0',
      change: presenceStats ? `${presenceStats.recentActivity} active` : '0',
      changeType: 'positive',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      description: presenceStats ? `${presenceStats.online} online, ${presenceStats.idle} idle, ${presenceStats.dnd} dnd` : 'tracking users'
    },
    {
      icon: faArrowTrendUp,
      title: 'Growth Rate',
      value: stats.growth.growthRate,
      change: stats.growth.netGrowth > 0 ? `+${stats.growth.netGrowth}` : `${stats.growth.netGrowth}`,
      changeType: stats.growth.netGrowth > 0 ? 'positive' : 'negative',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: `${stats.growth.membersJoined} joined, ${stats.growth.membersLeft} left`
    },
    {
      icon: faShield,
      title: 'Moderation',
      value: stats.moderation.totalBans,
      change: `-${stats.moderation.bansToday}`,
      changeType: 'positive',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      description: `${stats.moderation.totalTimeouts} timeouts`
    },
    {
      icon: faHeart,
      title: 'Daily Logs',
      value: stats.dailyLogs.count.toLocaleString(),
      change: stats.dailyLogs.change,
      changeType: stats.dailyLogs.change.startsWith('+') ? 'positive' : 'negative',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      description: 'logs sent today'
    },
    {
      icon: faBolt,
      title: 'Boost Level',
      value: `Level ${stats.overview.boostLevel}`,
      change: stats.overview.boostLevel > 0 ? '+1' : '0',
      changeType: stats.overview.boostLevel > 0 ? 'positive' : 'neutral',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      description: 'server boost'
    } 
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Server Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and insights</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
            >
              <span className="text-sm font-medium">
                {timeRange === '7d' ? 'Last 7 days' : 
                 timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  {[
                    { value: '7d', label: 'Last 7 days' },
                    { value: '30d', label: 'Last 30 days' },
                    { value: '90d', label: 'Last 90 days' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeRange(option.value as '7d' | '30d' | '90d');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        timeRange === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {realtimeStats && (
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Live Activity (24h)</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {realtimeStats.logsCount} logs • {realtimeStats.memberChanges.joined} joined • {realtimeStats.memberChanges.left} left
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-900 dark:text-blue-100">{realtimeStats.moderationActions.bans}</div>
                <div className="text-blue-700 dark:text-blue-300">Bans</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900 dark:text-blue-100">{realtimeStats.moderationActions.kicks}</div>
                <div className="text-blue-700 dark:text-blue-300">Kicks</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900 dark:text-blue-100">{realtimeStats.moderationActions.timeouts}</div>
                <div className="text-blue-700 dark:text-blue-300">Timeouts</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            className={`${card.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <FontAwesomeIcon icon={card.icon} className={`h-6 w-6 ${card.color}`} />
              </div>
              {card.change && (
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 
                  card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.changeType === 'positive' ? (
                    <FontAwesomeIcon icon={faArrowTrendUp} className="h-4 w-4" />
                  ) : card.changeType === 'negative' ? (
                    <FontAwesomeIcon icon={faArrowTrendDown} className="h-4 w-4" />
                  ) : null}
                  <span>{card.change}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              {card.description && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {card.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {presenceStats && (
        <motion.div 
          className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">User Presence</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Real-time user activity tracking</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {presenceStats.online.toLocaleString()}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {presenceStats.idle.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Idle</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {presenceStats.dnd.toLocaleString()}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Do Not Disturb</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {presenceStats.offline.toLocaleString()}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Offline</div>
            </div>
          </div>

        </motion.div>
      )}

      {mostActiveUsers.length > 0 && (
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Most Active Users (by Messages)</h3>
          </div>
          
          <div className="space-y-3">
            {mostActiveUsers.map((user: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={user.user_avatar && user.user_avatar !== 'null' && user.user_avatar !== '' ? 
                      `https://cdn.discordapp.com/avatars/${user.user_id}/${user.user_avatar}.png?size=64` : 
                      `https://cdn.discordapp.com/embed/avatars/${parseInt(user.user_id) % 5}.png`
                    } 
                    alt={user.username}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.user_id) % 5}.png`;
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.message_count.toLocaleString()} messages
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    #{index + 1}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Most Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}


      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">User Presence</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Online:</span>
              <span className="font-medium text-green-600">{presenceStats?.online || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Idle:</span>
              <span className="font-medium text-yellow-600">{presenceStats?.idle || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Do Not Disturb:</span>
              <span className="font-medium text-red-600">{presenceStats?.dnd || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Offline:</span>
              <span className="font-medium text-gray-600">{presenceStats?.offline || 0}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FontAwesomeIcon icon={faArrowTrendUp} className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Growth</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Joined:</span>
              <span className="font-medium text-green-600">{stats.growth.membersJoined.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Left:</span>
              <span className="font-medium text-red-600">{stats.growth.membersLeft.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Net Growth:</span>
              <span className={`font-medium ${stats.growth.netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growth.netGrowth >= 0 ? '+' : ''}{stats.growth.netGrowth.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
              <span className="font-medium text-blue-600">{stats.growth.growthRate}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <FontAwesomeIcon icon={faShield} className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Moderation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Bans:</span>
              <span className="font-medium text-red-600">{stats.moderation.totalBans.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Timeouts:</span>
              <span className="font-medium text-orange-600">{stats.moderation.totalTimeouts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Kicks:</span>
              <span className="font-medium text-yellow-600">{stats.moderation.totalKicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Today:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.moderation.bansToday + stats.moderation.timeoutsToday + stats.moderation.kicksToday}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FontAwesomeIcon icon={faShield} className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Server Info</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Channels:</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.overview.totalChannels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Roles:</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.overview.totalRoles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Age:</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.overview.serverAge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Boost Level:</span>
              <span className="font-medium text-yellow-600">{stats.overview.boostLevel}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}