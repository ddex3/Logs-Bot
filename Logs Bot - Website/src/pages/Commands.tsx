import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import confetti from 'canvas-confetti';

export default function Commands() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = async (command: string, event: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);

      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;

      confetti({
        particleCount: 10,
        angle: 60,
        spread: 30,
        origin: { x, y },
        startVelocity: 15,
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
        ticks: 60,
        gravity: 0.8,
        zIndex: 9999
      });
      
      confetti({
        particleCount: 10,
        angle: 120,
        spread: 30,
        origin: { x, y },
        startVelocity: 15,
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
        ticks: 60,
        gravity: 0.8,
        zIndex: 9999
      });

      setTimeout(() => {
        setCopiedCommand(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const commandCategories = [
    {
      title: 'General Commands',
      commands: [
        {
          name: '/help',
          description: 'Display bot information and this command list.'
        },
        {
          name: '/invite',
          description: "Get the bot's invite link."
        },
        {
          name: '/support',
          description: 'Get support server and website links.'
        },
        {
          name: '/vote',
          description: 'Vote for the bot and help us grow!'
        }
      ]
    },
    {
      title: 'Log Configuration',
      commands: [
        {
          name: '/set-logs',
          description: 'Assign log types to channels.'
        },
        {
          name: '/settings',
          description: 'Show log settings.'
        },
        {
          name: '/disable-logs',
          description: 'Disable a specific log.'
        },
        {
          name: '/reset-settings',
          description: 'Reset all log settings for this server.'
        },
        {
          name: '/logs-test',
          description: 'Send a test log (Member Joined).'
        }
      ]
    },
    {
      title: 'Legal & Information',
      commands: [
        {
          name: '/legal',
          description: "View the bot's Legal Policy's."
        },
        {
          name: '/privacy',
          description: "View the bot's privacy policy."
        },
        {
          name: '/terms',
          description: "View the bot's terms of use."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <section className="border-b border-gray-100 dark:border-gray-800/50 pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20">
          <div className="text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <h1 className="text-3xl sm:text-3xl md:text-4xl font-medium text-gray-900 dark:text-white leading-tight mb-3 sm:mb-4 tracking-tight">
                Commands
              </h1>
              
              <p className="text-base sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                All available bot commands organized by category.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="pt-10 sm:pt-12 md:pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-10 sm:space-y-12 md:space-y-16">
            {commandCategories.map((category) => {
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-lg font-normal text-gray-900 dark:text-white tracking-tight">
                      {category.title}
                    </h2>
                  </div>
                  
                  <div className="space-y-2">
                    {category.commands.map((command) => {
                      const isCopied = copiedCommand === command.name;
                      return (
                        <div
                          key={command.name}
                          className="group relative"
                        >
                          <div 
                            className="border-b border-gray-100 dark:border-gray-800/50 py-3 sm:py-4 hover:border-gray-200 dark:hover:border-gray-700/50 active:border-gray-300 dark:active:border-gray-600/50 transition-colors duration-200 cursor-pointer relative touch-manipulation min-h-[44px] flex items-center"
                            onClick={(e) => copyToClipboard(command.name, e)}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
                              <code className="text-sm sm:text-sm font-mono text-gray-900 dark:text-white font-medium flex-shrink-0 relative z-10">
                                {command.name}
                              </code>
                              <p className="text-sm sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                                {command.description}
                              </p>
                              <AnimatePresence>
                                {isCopied && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, x: -20 }}
                                    className="text-sm font-medium text-green-500 dark:text-green-400 flex-shrink-0"
                                  >
                                    Copied!
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

