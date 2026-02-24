import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faX, faRightFromBracket, faChevronDown, faServer, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assests/logo.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, login, logout } = useAuth();


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  return (
    <header className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-1rem)] sm:w-full max-w-7xl z-50">
      <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 group min-w-0 flex-1 sm:flex-none">
            <img 
              src={logo} 
              alt="Logs Bot Logo" 
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-md flex-shrink-0"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                Logs Bot
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden xs:block">
                Professional Discord Logging
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {user ? (
              <>
                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg transition-colors min-w-0 touch-manipulation"
                    whileHover={{ scale: 1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'}
                      alt={user.username}
                      className="h-7 w-7 lg:h-8 lg:w-8 rounded-full flex-shrink-0"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300 truncate max-w-[120px] lg:max-w-none transition-colors duration-200 hover:text-gray-900 dark:hover:text-gray-100">{user.username}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`h-4 w-4 lg:h-5 lg:w-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200/20 dark:border-gray-700/20 py-2"
                      >
                        <div className="px-4 py-2 border-b border-gray-200/30 dark:border-gray-700/30">
                          <div className="flex items-center space-x-2">
                            <img
                              src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'}
                              alt={user.username}
                              className="h-6 w-6 rounded-full"
                              draggable="false"
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                            />
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {user.global_name || user.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-600/20 rounded transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FontAwesomeIcon icon={faServer} className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        
                        
                        
                        
                        <div className="border-t border-gray-200/30 dark:border-gray-700/30 mt-2 pt-2">
                          <button
                            onClick={() => { logout(); setIsProfileOpen(false); }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-white/20 dark:hover:bg-gray-600/20 rounded transition-colors"
                          >
                            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.button
                onClick={login}
                className="px-4 lg:px-5 py-2 bg-gradient-to-r from-blue-700/50 to-blue-800/50 text-white rounded-lg hover:from-blue-800/70 hover:to-blue-900/70 transition-all duration-300 font-semibold text-sm lg:text-base shadow-md hover:shadow-lg border border-blue-600/40 backdrop-blur-sm flex items-center space-x-2 touch-manipulation min-h-[44px]"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4" />
                <span className="hidden lg:inline">Login with Discord</span>
                <span className="lg:hidden">Login</span>
              </motion.button>
            )}
          </div>

          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 rounded-lg text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center bg-transparent hover:bg-transparent active:bg-transparent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
            style={{ WebkitTapHighlightColor: 'transparent', tapHighlightColor: 'transparent' }}
          >
            {isMenuOpen ? <FontAwesomeIcon icon={faX} className="h-6 w-6" /> : <FontAwesomeIcon icon={faBars} className="h-6 w-6" />}
          </motion.button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-3 pb-4 space-y-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                <div className="pt-3 pb-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center px-3 py-2">
                        <img
                          src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'}
                          alt={user.username}
                          className="h-12 w-12 rounded-full flex-shrink-0"
                          draggable="false"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-base font-bold text-gray-900 dark:text-white truncate">{user.global_name || user.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</div>
                        </div>
                      </div>
                      <div className="px-3 space-y-2">
                        <Link
                          to="/dashboard"
                          className="block w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-900/40 transition-colors touch-manipulation min-h-[44px] flex items-center font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={() => { logout(); setIsMenuOpen(false); }}
                          className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px] flex items-center font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3">
                      <button
                        onClick={() => { login(); setIsMenuOpen(false); }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-700/50 to-blue-800/50 text-white rounded-lg hover:from-blue-800/70 hover:to-blue-900/70 active:from-blue-900/80 active:to-blue-950/80 transition-all duration-300 font-semibold shadow-md hover:shadow-lg border border-blue-600/40 backdrop-blur-sm flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
                      >
                        <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4" />
                        <span>Login with Discord</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}