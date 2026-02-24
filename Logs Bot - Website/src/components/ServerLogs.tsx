import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { discordApi } from '../services/api';
import BeatLoader from 'react-spinners/BeatLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faRotate, faFilter, faHashtag, faMessage, faUsers, faShield, faVolumeHigh, faFaceSmile, faCrown, faCode, faMicrophone, faCircleCheck, faCircleXmark, faUser, faFingerprint, faFileText, faPaperclip, faArrowLeft, faArrowRight, faClock, faEdit, faLink, faCalendar, faBan, faUserMinus, faUserPlus, faGavel, faHourglass, faImage, faTag, faBell, faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

type Log = { 
  id: string; 
  channelId: string; 
  timestamp: string; 
  logType?: string;
  embed: { 
    title: string; 
    color: number; 
    fields: Array<{ name: string; value: string; inline: boolean }>; 
    thumbnail?: { url: string }; 
    footer?: { text: string; icon_url: string } 
  }; 
  author?: { id: string; username: string; avatar: string } 
};

const types = [
  { value: 'all', label: 'All Logs', icon: faFileLines, color: 'blue', activeClass: 'bg-blue-600' },
  { value: 'message', label: 'Message', icon: faMessage, color: 'blue', activeClass: 'bg-blue-600' },
  { value: 'member', label: 'Member', icon: faUsers, color: 'green', activeClass: 'bg-green-600' },
  { value: 'channel', label: 'Channel', icon: faHashtag, color: 'purple', activeClass: 'bg-purple-600' },
  { value: 'emoji', label: 'Emoji', icon: faFaceSmile, color: 'yellow', activeClass: 'bg-yellow-600' },
  { value: 'role', label: 'Role', icon: faCrown, color: 'yellow', activeClass: 'bg-yellow-600' },
  { value: 'moderation', label: 'Moderation', icon: faShield, color: 'red', activeClass: 'bg-red-600' },
  { value: 'voice', label: 'Voice', icon: faVolumeHigh, color: 'purple', activeClass: 'bg-purple-600' },
  { value: 'stage', label: 'Stage', icon: faMicrophone, color: 'indigo', activeClass: 'bg-indigo-600' },
  { value: 'webhook', label: 'Webhook', icon: faCode, color: 'indigo', activeClass: 'bg-indigo-600' }
];

export default function ServerLogs({ guildId }: { guildId: string }) {
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [filteredData, setFilteredData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['all']));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const getLogs = async () => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const res = await discordApi.getServerLogs(guildId, 'all', 100);
      const logs = res.success ? res.logs || [] : [];

      setAllLogs(logs);
      applyFilters(logs, selectedFilters);
      if (!res.success) setError(res.message || 'Failed to fetch logs');
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const inferLogType = (log: Log): string => {
    if (log.logType) {
      return log.logType.toLowerCase().trim();
    }
    
    const title = (log.embed?.title || '').toLowerCase();
    
    if (title.includes('message') || title.includes('sent') || title.includes('edited') || title.includes('deleted')) {
      return 'message';
    }
    if (title.includes('member') || title.includes('joined') || title.includes('left') || title.includes('updated') || title.includes('nickname')) {
      return 'member';
    }
    if (title.includes('channel') || title.includes('thread')) {
      return 'channel';
    }
    if (title.includes('emoji') || title.includes('sticker')) {
      return 'emoji';
    }
    if (title.includes('role')) {
      return 'role';
    }
    if (title.includes('ban') || title.includes('kick') || title.includes('timeout') || title.includes('warn') || title.includes('moderation')) {
      return 'moderation';
    }
    if (title.includes('voice') || title.includes('stream')) {
      return 'voice';
    }
    if (title.includes('stage')) {
      return 'stage';
    }
    if (title.includes('webhook')) {
      return 'webhook';
    }
    
    return '';
  };

  const applyFilters = (logs: Log[], filters: Set<string>) => {
    if (filters.has('all') || filters.size === 0) {
      setFilteredData(logs);
      return;
    }
    
    const logsWithTypes = logs.map(log => ({
      ...log,
      inferredType: inferLogType(log)
    }));
    
    const uniqueLogTypes = [...new Set(logsWithTypes.map(log => log.logType || log.inferredType).filter(Boolean))];

    const filtered = logsWithTypes.filter(log => {
      const logType = (log.logType || log.inferredType || '').toLowerCase().trim();
      
      if (!logType) {
        return false;
      }
      
      const filterValues = Array.from(filters).map(f => f.toLowerCase().trim());
      const matches = filterValues.includes(logType);
      
      return matches;
    }).map(({ inferredType, ...log }) => log);
    
    if (filtered.length === 0 && logs.length > 0) {
      console.warn('⚠️ No logs matched the selected filters. Available types:', uniqueLogTypes, 'Selected:', Array.from(filters));
    }
    
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (guildId) {
      getLogs();
      loadChannels();
    }
  }, [guildId]);

  const loadChannels = async () => {
    if (!guildId) return;
    try {
      const guildChannels = await discordApi.getGuildChannels(guildId);
      setChannels(guildChannels.map(ch => ({ id: ch.id, name: ch.name })));
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const getChannelName = (channelId: string): string => {
    const channel = channels.find(ch => ch.id === channelId);
    return channel ? channel.name : 'Unknown';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    getLogs();
  };

  const handleFilterToggle = (filterValue: string) => {
    const newFilters = new Set(selectedFilters);
    
    if (filterValue === 'all') {
      if (newFilters.has('all')) {
        if (newFilters.size > 1) {
          newFilters.delete('all');
        }
      } else {
        newFilters.clear();
        newFilters.add('all');
      }
    } else {
      if (newFilters.has(filterValue)) {
        newFilters.delete(filterValue);
        if (newFilters.size === 0) {
          newFilters.add('all');
        }
      } else {
        newFilters.delete('all');
        newFilters.add(filterValue);
      }
    }
    
    setSelectedFilters(newFilters);
    applyFilters(allLogs, newFilters);
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFieldIcon = (fieldName: string) => {
    const name = fieldName.toLowerCase().trim();
    
    if (name === 'author' || name === 'user') return faUser;
    if (name.includes('username') || name.includes('name')) return faUser;
    
    if (name === 'message id' || name === 'id' || name.includes('id')) return faFingerprint;
    
    if (name === 'content' || name === 'message' || name === 'text') return faFileText;
    if (name === 'reason' || name === 'description') return faFileText;
    
    if (name === 'attachments' || name === 'attachment') return faPaperclip;
    if (name === 'image' || name === 'thumbnail') return faImage;
    
    if (name === 'edited at' || name === 'edited' || name.includes('edited')) return faEdit;
    if (name === 'time' || name === 'timestamp' || name.includes('at')) return faClock;
    if (name === 'created at' || name === 'created') return faCalendar;
    if (name === 'account age') return faHourglass;
    
    if (name === 'before') return faArrowLeft;
    if (name === 'after') return faArrowRight;
    
    if (name === 'channel') return faHashtag;
    
    if (name === 'invite code' || name === 'invite') return faLink;
    
    if (name === 'role' || name.includes('role')) return faCrown;
    
    if (name === 'banned' || name === 'ban') return faBan;
    if (name === 'kicked' || name === 'kick') return faUserMinus;
    if (name === 'joined' || name === 'added') return faUserPlus;
    if (name === 'moderator' || name === 'action') return faGavel;
    
    if (name === 'tag' || name.includes('tag')) return faTag;
    if (name === 'notification' || name.includes('notify')) return faBell;
    
    return faFileText;
  };

  const removeDiscordEmojis = (text: string): string => {
    if (!text || typeof text !== 'string') return text || '';
    return text.replace(/<a?:\w+:\d+>/g, '').trim();
  };

  const parseDiscordTimestamps = (text: string): string => {
    if (!text || typeof text !== 'string') return text || '';
    
    let result = text.replace(/<t:(\d+)(?::[FRDfTd])?>/g, (match, timestamp) => {
      try {
        const date = new Date(parseInt(timestamp) * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
      } catch {
        return match;
      }
    });
    
    result = result.replace(/(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})\s*\(\1\)/g, '$1');
    
    return result;
  };

  const parseAuthorField = (value: string): string => {
    const mentionMatch = value.match(/<@(\d+)>/);
    const usernameMatch = value.match(/\(([^)]+)\)/);
    
    if (mentionMatch && usernameMatch) {
      const userId = mentionMatch[1];
      const username = usernameMatch[1];
      return `${username} (${userId})`;
    }
    
    return value;
  };

  const parseLinks = (text: string): (string | JSX.Element)[] => {
    if (!text || typeof text !== 'string') return [text || ''];
    
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let linkKeyIndex = 0;
    
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = markdownLinkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        const parsedBefore = parseUrls(beforeText, linkKeyIndex);
        parts.push(...parsedBefore);
        linkKeyIndex += parsedBefore.filter(p => typeof p !== 'string').length;
      }
      
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={`link-${linkKeyIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
          style={{ color: '#93c5fd' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#7dd3fc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
        >
          {linkText}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      const parsedRemaining = parseUrls(remainingText, linkKeyIndex);
      parts.push(...parsedRemaining);
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const parseUrls = (text: string, startKeyIndex: number = 0): (string | JSX.Element)[] => {
    if (!text || typeof text !== 'string') return [text || ''];
    
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = startKeyIndex;
    
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const url = match[1];
      parts.push(
        <a
          key={`url-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
          style={{ color: '#93c5fd' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#7dd3fc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
        >
          {url}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };


  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BeatLoader size={10} color="#6b7280" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading server logs...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div 
          className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
          >
            <FontAwesomeIcon icon={faCircleXmark} className="h-12 w-12 text-red-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Logs</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <motion.button 
            onClick={() => getLogs()} 
            className="px-6 py-2 text-white rounded-lg transition-colors font-medium"
            style={{ backgroundColor: '#93c5fd' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7dd3fc'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#93c5fd'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Server Logs</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">View and manage all logs from your Discord server</p>
        </motion.div>

        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filters</span>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isRefreshing ? (
                  <BeatLoader size={4} color="#9ca3af" />
                ) : (
                  <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
                )}
                <span>Refresh</span>
              </motion.button>
            </div>

            <div className="md:hidden mb-3">
              <motion.button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-left touch-manipulation min-h-[44px]"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedFilters.has('all') 
                      ? 'All Logs' 
                      : `${selectedFilters.size} ${selectedFilters.size === 1 ? 'filter' : 'filters'} selected`
                    }
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isMobileFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isMobileFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {types.map((type) => {
                        const isChecked = selectedFilters.has(type.value);
                        const isAllLogsSelected = selectedFilters.has('all');
                        const shouldShowAsChecked = isChecked || (isAllLogsSelected && type.value !== 'all');
                        return (
                          <motion.button
                            key={type.value}
                            onClick={() => handleFilterToggle(type.value)}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px] border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="relative flex-shrink-0">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  shouldShowAsChecked
                                    ? ''
                                    : 'border-gray-300 dark:border-gray-600 bg-transparent'
                                }`}
                                style={shouldShowAsChecked ? { borderColor: '#93c5fd', backgroundColor: '#93c5fd' } : {}}
                              >
                                {shouldShowAsChecked && (
                                  <FontAwesomeIcon 
                                    icon={faCheck} 
                                    className="w-3 h-3 text-white"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className={`text-sm font-medium flex-1 ${
                                shouldShowAsChecked 
                                  ? '' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`} style={shouldShowAsChecked ? { color: '#93c5fd' } : {}}>
                                {type.label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex flex-wrap gap-2">
              {types.map((type) => {
                const isChecked = selectedFilters.has(type.value);
                const isAllLogsSelected = selectedFilters.has('all');
                const shouldShowAsChecked = isChecked || (isAllLogsSelected && type.value !== 'all');
                return (
                  <motion.label
                    key={type.value}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-normal transition-all cursor-pointer border ${
                      shouldShowAsChecked
                        ? ''
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{ 
                      borderWidth: '1px', 
                      borderStyle: 'solid',
                      borderColor: shouldShowAsChecked ? '#93c5fd' : undefined
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFilterToggle(type.value)}
                        className="w-3 h-3 bg-transparent border rounded focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-0 cursor-pointer appearance-none"
                        style={{ 
                          borderWidth: '1px',
                          borderColor: shouldShowAsChecked ? '#93c5fd' : '#d1d5db'
                        }}
                      />
                      {shouldShowAsChecked && (
                        <FontAwesomeIcon 
                          icon={faCheck} 
                          className="absolute top-1/2 left-1/2 w-2.5 h-2.5 pointer-events-none"
                          style={{ 
                            transform: 'translate(-50%, calc(-50% - 1px))',
                            color: '#93c5fd'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ color: shouldShowAsChecked ? '#93c5fd' : undefined }} className={shouldShowAsChecked ? '' : 'text-gray-600 dark:text-gray-400'}>{type.label}</span>
                  </motion.label>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 text-green-500" />
                <span>{filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {filteredData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
              >
                <FontAwesomeIcon icon={faFileLines} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Logs Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {selectedFilters.has('all') || selectedFilters.size === 0
                  ? "No logs found. Make sure logging is enabled and configured in your server settings."
                  : `No logs found for the selected filters. Try selecting different filters.`
                }
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredData.map((log, index) => {
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                            {log.embed.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faHashtag} className="h-3 w-3" style={{ color: '#93c5fd' }} />
                              <span>{getChannelName(log.channelId)}</span>
                            </div>
                            <span>•</span>
                            <span>{formatTime(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {log.embed.fields && log.embed.fields.length > 0 && (
                        <div className="space-y-1">
                          {log.embed.fields
                            .filter(field => {
                              const fieldName = field.name.toLowerCase();
                              return fieldName !== 'time' && fieldName !== 'author id' && fieldName !== 'channel';
                            })
                            .map((field, i) => {
                              const fieldNameLower = field.name.toLowerCase();
                              const isAuthorField = fieldNameLower === 'author';
                              
                              let cleanedValue = removeDiscordEmojis(field.value);
                              cleanedValue = parseDiscordTimestamps(cleanedValue);
                              
                              const displayValue = isAuthorField 
                                ? parseAuthorField(cleanedValue)
                                : parseLinks(cleanedValue);
                              
                              const fieldIcon = getFieldIcon(field.name);
                              
                              return (
                                <div 
                                  key={i} 
                                  className="flex items-start gap-2 py-1"
                                >
                                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300 flex-shrink-0 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={fieldIcon} className="h-3.5 w-3.5" style={{ color: '#93c5fd' }} />
                                    {field.name}:
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 break-words flex-1">
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}