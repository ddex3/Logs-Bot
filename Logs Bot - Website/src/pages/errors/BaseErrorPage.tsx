import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BaseErrorPageProps {
  code: number;
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
  gradientFrom: string;
  gradientTo: string;
}

export default function BaseErrorPage({
  code,
  title,
  message,
  actionLabel,
  actionPath,
  gradientFrom,
  gradientTo,
}: BaseErrorPageProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-gray-950 dark:via-slate-900/90 dark:to-gray-900"></div>
      
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none"></div>
      
      <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 dark:opacity-5 blur-3xl pointer-events-none`}></div>
      <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-br ${gradientTo} ${gradientFrom} opacity-10 dark:opacity-5 blur-3xl pointer-events-none`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 dark:opacity-3 blur-3xl pointer-events-none`}></div>
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
        <div className="absolute bottom-20 right-1/3 w-3 h-3 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
        <div className="absolute bottom-1/3 left-20 w-3 h-3 rounded-full bg-gray-400/30 dark:bg-gray-500/20"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className={`absolute top-1/4 right-1/4 w-px h-32 bg-gradient-to-b ${gradientFrom} ${gradientTo} opacity-20 dark:opacity-10`}></div>
        <div className={`absolute bottom-1/4 left-1/4 w-32 h-px bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-20 dark:opacity-10`}></div>
        <div className={`absolute top-1/2 left-1/3 w-px h-24 bg-gradient-to-b ${gradientTo} ${gradientFrom} opacity-15 dark:opacity-8`}></div>
        <div className={`absolute bottom-1/3 right-1/3 w-24 h-px bg-gradient-to-r ${gradientTo} ${gradientFrom} opacity-15 dark:opacity-8`}></div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
      >
        <div className="text-[30rem] md:text-[40rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900/20 to-gray-700/20 dark:from-white/10 dark:to-gray-300/10 select-none">
          {code}
        </div>
      </motion.div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            className="relative inline-block mb-6"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-20 dark:opacity-10 blur-2xl rounded-full`}></div>
            <motion.h1
              className="relative text-8xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300"
            >
              {code}
            </motion.h1>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {title}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative max-w-2xl mx-auto mb-8"
          >
            <div className={`absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientFrom} ${gradientTo} opacity-30 dark:opacity-20 rounded-full`}></div>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed pl-6">
              {message}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center relative"
          >
            <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r transparent ${gradientFrom} ${gradientTo} opacity-30 dark:opacity-20`}></div>
            <Link
              to={actionPath}
              className="relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 group"
            >
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 transition-opacity duration-200`}></div>
              <span className="relative">{actionLabel}</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900/5 dark:bg-white/10 px-8 py-4 text-gray-900 dark:text-white font-semibold ring-1 ring-inset ring-gray-900/10 dark:ring-white/15 hover:bg-gray-900/10 dark:hover:bg-white/15 transition-all duration-200"
            >
              Go Back
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

