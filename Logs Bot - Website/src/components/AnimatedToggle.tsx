import { motion } from 'framer-motion';

interface atProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

export default function at({ 
  enabled, 
  onChange, 
  label, 
  description
}: atProps) {
  const getBackgroundClass = () => {
    if (!enabled) return 'bg-gray-300 dark:bg-gray-600';
    
    switch (glowColor) {
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-green-600';
      case 'purple': return 'bg-purple-600';
      case 'red': return 'bg-red-600';
      case 'yellow': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      
      <motion.button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${getBackgroundClass()}`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
          animate={{
            x: enabled ? 24 : 4,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      </motion.button>
    </div>
  );
}