import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faUser, faGear, faRotate, faMagnifyingGlass, faX, faCircleCheck, faCircleXmark, faPenToSquare, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { discordApi } from '../services/api';
import BeatLoader from 'react-spinners/BeatLoader';

interface UserLog { 
  id: number; 
  guild_id: string; 
  user_id: string; 
  username: string; 
  action_type: string; 
  action_details: string; 
  old_value: string | null; 
  new_value: string | null; 
  timestamp: string; 
  user_avatar?: string; 
}

interface ServerLogsTabProps { 
  guildId: string; 
}

export default function ServerLogsTab({ guildId }: ServerLogsTabProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async (isInitial = false) => { 
    try { 
      if (isInitial) setIsLoading(true); 
      const userLogs = await discordApi.getUserLogs(guildId, 200, 0); 
      setLogs(userLogs); 
    } catch (error) { 
      console.error('Error loading logs:', error); 
    } finally { 
      if (isInitial) setIsLoading(false); 
    } 
  };

  const refreshLogs = async () => { 
    setIsRefreshing(true); 
    await loadLogs(false); 
    setIsRefreshing(false); 
  };

  useEffect(() => { 
    loadLogs(true); 
    const interval = setInterval(() => { 
      loadLogs(false); 
    }, 2000); 
    return () => clearInterval(interval); 
  }, [guildId]);

  const getActionIcon = (actionType: string) => {
    const iconClass = "h-5 w-5";
    switch (actionType) {
      case 'LOG_ENABLED':
        return <FontAwesomeIcon icon={faCircleCheck} className={`${iconClass} text-green-500`} />;
      case 'LOG_DISABLED':
        return <FontAwesomeIcon icon={faCircleXmark} className={`${iconClass} text-red-500`} />;
      case 'LOG_CHANNEL_CHANGED':
      case 'CHANNEL_CHANGE':
        return <FontAwesomeIcon icon={faPenToSquare} className={`${iconClass} text-blue-500`} />;
      default:
        return <FontAwesomeIcon icon={faGear} className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'LOG_ENABLED':
        return {
          border: 'border-l-green-500',
          bg: 'bg-green-50/50 dark:bg-green-900/10',
          iconBg: 'bg-green-500/10',
          text: 'text-green-700 dark:text-green-400'
        };
      case 'LOG_DISABLED':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-50/50 dark:bg-red-900/10',
          iconBg: 'bg-red-500/10',
          text: 'text-red-700 dark:text-red-400'
        };
      case 'LOG_CHANNEL_CHANGED':
      case 'CHANNEL_CHANGE':
        return {
          border: 'border-l-blue-500',
          bg: 'bg-blue-50/50 dark:bg-blue-900/10',
          iconBg: 'bg-blue-500/10',
          text: 'text-blue-700 dark:text-blue-400'
        };
      default:
        return {
          border: 'border-l-gray-500',
          bg: 'bg-gray-50/50 dark:bg-gray-800/50',
          iconBg: 'bg-gray-500/10',
          text: 'text-gray-700 dark:text-gray-400'
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      return `${hours}h ${minutes}m ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      const hours = Math.floor((diffInSeconds % 86400) / 3600);
      if (days === 1) return `${days} day ${hours}h ago`;
      else return `${days} days ${hours}h ago`;
    }
  };

  const formatDetailedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    }
  };

  const formatActionDetails = (actionDetails: string): string => {
    const patterns = [
      { regex: /^(Changed)\s+(.+?)\s+(log channel)$/i, replacement: '$1 "$2" $3' },
      { regex: /^(Enabled|Disabled|Updated)\s+(.+?)\s+(log)$/i, replacement: '$1 "$2" $3' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(actionDetails)) {
        return actionDetails.replace(pattern.regex, pattern.replacement);
      }
    }
    
    return actionDetails;
  };

  const filteredLogs = useMemo(() => {
    if (searchQuery === '') return logs;
    return logs.filter(log => 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.old_value && log.old_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.new_value && log.new_value.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [logs, searchQuery]);

  if (isLoading) {
    return (
      <motion.div 
        key="logs" 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        exit={{ opacity: 0, x: -20 }} 
        transition={{ duration: 0.3 }} 
        className="space-y-4"
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-lg">
              <FontAwesomeIcon icon={faFileLines} className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
          </div>
          <div className="text-center py-12">
            <BeatLoader size={10} color="#2563eb" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="logs" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-4"
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-lg">
              <FontAwesomeIcon icon={faFileLines} className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          <motion.button 
            onClick={refreshLogs} 
            disabled={isRefreshing} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
            whileHover={{ scale: isRefreshing ? 1 : 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            {isRefreshing ? (
              <>
                <BeatLoader size={6} color="#ffffff" className="mr-2" />
                Updating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRotate} className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </motion.button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FontAwesomeIcon icon={faX} className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
            >
              <FontAwesomeIcon icon={faFileLines} className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matching logs found' : 'No Logs Yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'Start configuring your logs to see activity here'
              }
            </p>
            {searchQuery && (
              <motion.button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Search
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {filteredLogs.map((log, index) => {
                const colors = getActionColor(log.action_type);
                return (
                  <motion.div
                    key={`${log.id}-${log.timestamp}`}
                    className={`relative bg-white dark:bg-gray-800 rounded-lg border-l-4 ${colors.border} ${colors.bg} border-r border-t border-b border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <div className="p-4">
                      <div className="md:hidden">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`p-1.5 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                            {getActionIcon(log.action_type)}
                          </div>
                          <p className={`font-semibold text-sm ${colors.text} flex-1`}>
                            {formatActionDetails(log.action_details)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                            <span className="font-medium">{log.username}</span>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span className="font-mono text-xs">{log.user_id.slice(-6)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                            <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                            <div className="text-gray-400 dark:text-gray-500">{formatDetailedTime(log.timestamp)}</div>
                          </div>
                        </div>

                        {log.old_value && log.new_value && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 mb-1">
                                  <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3 text-red-500" />
                                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                                    Previous
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                  {log.old_value}
                                </p>
                              </div>

                              <div className="flex-shrink-0 pt-5">
                                <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 text-gray-400" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 mb-1">
                                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 text-green-500" />
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                    Current
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                  {log.new_value}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {!log.old_value && !log.new_value && log.action_details && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {formatActionDetails(log.action_details)}
                          </div>
                        )}
                      </div>

                      <div className="hidden md:flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {log.user_avatar ? (
                            <img 
                              src={log.user_avatar} 
                              alt={log.username} 
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                              <span className="text-white font-semibold text-sm">
                                {log.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className={`p-1.5 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                                {getActionIcon(log.action_type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold text-sm ${colors.text} truncate`}>
                                  {formatActionDetails(log.action_details)}
                                </p>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                    <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                                    <span className="font-medium">{log.username}</span>
                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                    <span className="font-mono text-xs">{log.user_id.slice(-6)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0 ml-4 text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {formatDetailedTime(log.timestamp)}
                              </div>
                            </div>
                          </div>

                          {log.old_value && log.new_value && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3 text-red-500" />
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                                      Previous
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                    {log.old_value}
                                  </p>
                                </div>

                                <div className="flex-shrink-0 pt-5">
                                  <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 text-gray-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 text-green-500" />
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                      Current
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                    {log.new_value}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {!log.old_value && !log.new_value && log.action_details && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {formatActionDetails(log.action_details)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
