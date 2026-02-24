import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faDownload, faFileLines, faHistory, faScroll, faCode, faCalendar, faQuestionCircle, faArrowUpRightFromSquare, faX, faBars } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

interface ServerSidebarProps {
  guild: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function ServerSidebar({ guild, activeTab, onTabChange, isMobile = false, onClose }: ServerSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobileView) {
      setIsMobileOpen(false);
      if (onClose) onClose();
    }
  };

  const handleClose = () => {
    setIsMobileOpen(false);
    if (onClose) onClose();
  };

  const getServerIcon = () => {
    return guild.icon 
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    {
      id: 'config',
      name: 'Logs Settings',
      icon: faGear,
      description: 'Manage Logs Settings'
    },
    {
      id: 'export',
      name: 'Export & Backup',
      icon: faDownload,
      description: 'Export logs and backup settings'
    },
    {
      id: 'server-logs',
      name: 'Server Logs',
      icon: faFileLines,
      description: 'View Server Logs'
    },
    {
      id: 'audit-log',
      name: 'Audit Log',
      icon: faHistory,
      description: 'View Audit Log'
    },
    {
      id: 'transcripts',
      name: 'Transcripts',
      icon: faScroll,
      description: 'View conversation transcripts'
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div>
            {getServerIcon() ? (
              <img
                src={getServerIcon()!}
                alt={guild.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shadow-lg flex-shrink-0"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">{getInitials(guild.name)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                {guild.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Server Management
            </p>
          </div>
        </div>
        {isMobileView && (
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ml-2"
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faX} className="h-5 w-5" />
          </button>
        )}
      </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition-all duration-200 group touch-manipulation min-h-[48px] ${
                  isActive
                    ? 'border border-[#93c5fd]/30 dark:border-[#93c5fd]/40 bg-[#93c5fd]/10 dark:bg-[#93c5fd]/15'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-[#93c5fd]/20 dark:bg-[#93c5fd]/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5 flex-shrink-0" style={isActive ? { color: '#93c5fd' } : undefined} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-medium text-xs sm:text-sm truncate ${
                    isActive
                      ? 'text-[#93c5fd]'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  >
                    {item.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <FontAwesomeIcon icon={faCode} className="h-3 w-3 opacity-60 flex-shrink-0" />
              <span className="font-medium">Version</span>
              <span className="opacity-75">v1.0.0</span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 opacity-60 flex-shrink-0" />
              <span className="font-medium">Last Update</span>
              <span className="opacity-75">01/01/2026</span>
            </div>

            <div className="pt-2">
              <motion.a
                href={import.meta.env.VITE_SUPPORT_SERVER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between space-x-2 px-3 py-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 active:bg-blue-500/30 dark:active:bg-blue-500/40 transition-all duration-200 text-xs font-medium group touch-manipulation min-h-[44px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faQuestionCircle} className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>NEED SUPPORT?</span>
                </div>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </motion.a>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                <span className="opacity-75">
                  © 2026 Logs Bot. All rights reserved.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  if (isMobileView) {
    return (
      <>
        <motion.button
          onClick={() => setIsMobileOpen(true)}
          className="fixed left-4 bottom-6 z-40 lg:hidden px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-full border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors touch-manipulation flex items-center justify-center gap-2 min-h-[44px]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open sidebar"
        >
          <FontAwesomeIcon icon={faBars} className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Open Menu</span>
        </motion.button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={handleClose}
              />
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] lg:hidden rounded-r-2xl overflow-hidden"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.div
      className="hidden lg:block fixed left-4 top-28 bottom-24 bg-white/40 dark:bg-gray-700/40 backdrop-blur-md shadow-lg rounded-2xl border border-gray-200/20 dark:border-gray-700/20 z-30 w-64 transition-all duration-300 overflow-hidden"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {sidebarContent}
    </motion.div>
  );
} 