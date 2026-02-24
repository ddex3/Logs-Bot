import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faLock, faFileLines, faCode, faHome } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import logo from '../assests/logo.png';

export default function Footer() {
  const BOT_INVITE_URL = import.meta.env.VITE_BOT_INVITE_URL;
  const SUPPORT_SERVER_URL = import.meta.env.VITE_SUPPORT_SERVER_URL;

  return (
    <footer className="w-full max-w-7xl mx-auto mb-4 z-50 px-4 sm:px-6">
      <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 px-4 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
          <motion.div 
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={logo} 
                alt="Logs Bot Logo" 
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md flex-shrink-0"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Logs Bot</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm max-w-md">
              Professional Discord logging solution for server administrators.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col gap-2 w-full md:w-auto"
          >
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2 text-xs sm:text-sm uppercase tracking-wider">Links</h3>
            <div className="flex flex-wrap gap-2">
              <Link 
                to="/" 
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 active:bg-white/80 dark:active:bg-white/15 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
              >
                <FontAwesomeIcon icon={faHome} className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <Link 
                to="/privacy-policy" 
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 active:bg-white/80 dark:active:bg-white/15 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
              >
                <FontAwesomeIcon icon={faLock} className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Privacy</span>
              </Link>
              <Link 
                to="/terms-of-service" 
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 active:bg-white/80 dark:active:bg-white/15 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
              >
                <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Terms</span>
              </Link>
              <Link 
                to="/commands" 
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 active:bg-white/80 dark:active:bg-white/15 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
              >
                <FontAwesomeIcon icon={faCode} className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Commands</span>
              </Link>
              <motion.a
                href={BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 active:bg-blue-500/30 dark:active:bg-blue-500/40 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
                whileTap={{ scale: 0.95 }}
              >
                <span>Invite Bot</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5 flex-shrink-0" />
              </motion.a>
              <motion.a
                href={SUPPORT_SERVER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 active:bg-purple-500/30 dark:active:bg-purple-500/40 transition-all duration-200 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[44px]"
                whileTap={{ scale: 0.95 }}
              >
                <span>Support</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5 flex-shrink-0" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-4 sm:mt-5 pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              © 2026 Logs Bot. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}