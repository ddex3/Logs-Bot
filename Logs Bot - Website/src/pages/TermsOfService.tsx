import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faShield, faTriangleExclamation, faScaleBalanced, faUsers, faGavel, faCalendar, faCheck, faArrowRight, faLock, faDatabase, faClock, faBan, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import React, { useRef } from "react";

function HoverCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden cursor-default ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: mousePosition.x - 200,
            top: mousePosition.y - 200,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
          }}
        />
      )}
      {children}
    </div>
  );
}

export default function TermsOfService() {
  const sections = [
    {
      icon: faFileLines,
      title: 'Service Description',
      color: 'from-blue-500 to-cyan-500',
      content: [
        'Logs Bot is a Discord bot that provides server activity logging and moderation related features.',
        'The bot records and displays server events based on the configuration chosen by server administrators.',
        'Logs Bot is provided free of charge.'
      ]
    },
    {
      icon: faUsers,
      title: 'Eligibility',
      color: 'from-indigo-500 to-purple-500',
      content: [
        'You must comply with Discord\'s Terms of Service and meet Discord\'s minimum age requirements to use Logs Bot.',
        'Server administrators are responsible for ensuring that the use of Logs Bot within their server complies with all applicable laws and regulations.'
      ]
    },
    {
      icon: faShield,
      title: 'Use of the Service',
      color: 'from-emerald-500 to-teal-500',
      content: [
        'You agree to use Logs Bot only for lawful purposes and in accordance with these Terms of Service.',
        'You may not use the bot to violate any laws, infringe the rights of others, or abuse Discord\'s platform.',
        'You may not attempt to interfere with the bot\'s operation, bypass security measures, or misuse the service in any way.',
        'Server administrators are solely responsible for how Logs Bot is configured and used within their server.'
      ]
    },
    {
      icon: faDatabase,
      title: 'Data Handling',
      color: 'from-purple-500 to-pink-500',
      content: [
        <>Logs Bot processes and stores data as described in the <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.</>,
        <>By using the service, you acknowledge and accept the data practices outlined in the <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.</>
      ]
    },
    {
      icon: faClock,
      title: 'Availability and Changes',
      color: 'from-orange-500 to-red-500',
      content: [
        'We strive to keep Logs Bot available and functioning properly, but we do not guarantee uninterrupted or error free operation.',
        'We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.'
      ]
    },
    {
      icon: faTriangleExclamation,
      title: 'Limitation of Liability',
      color: 'from-red-500 to-pink-500',
      content: [
        'Logs Bot is provided on an "as is" and "as available" basis.',
        'We make no warranties, express or implied, regarding reliability, availability, or fitness for a particular purpose.',
        'To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use Logs Bot.'
      ]
    },
    {
      icon: faBan,
      title: 'Termination',
      color: 'from-gray-500 to-slate-500',
      content: [
        'We reserve the right to restrict or terminate access to Logs Bot for any server or user at our discretion, including for violations of these Terms of Service or Discord\'s Terms of Service.',
        'Removing the bot from a server will terminate its operation within that server.'
      ]
    },
    {
      icon: faGlobe,
      title: 'Third Party Services',
      color: 'from-blue-600 to-indigo-600',
      content: [
        'Logs Bot operates using Discord\'s platform and APIs.',
        'We are not responsible for the availability, behavior, or policies of Discord or any third party services.'
      ]
    },
    {
      icon: faFileLines,
      title: 'Changes to These Terms',
      color: 'from-indigo-600 to-purple-600',
      content: [
        'We may update these Terms of Service from time to time.',
        'Continued use of Logs Bot after changes take effect constitutes acceptance of the updated terms.'
      ]
    },
    {
      icon: faScaleBalanced,
      title: 'Governing Law',
      color: 'from-purple-600 to-pink-600',
      content: [
        'These Terms of Service shall be governed and interpreted in accordance with applicable laws, without regard to conflict of law principles.'
      ]
    }
  ];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-gray-950 dark:via-slate-900/90 dark:to-gray-900"></div>
      
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none"></div>
      
      <section className="relative overflow-hidden min-h-[60vh] flex items-center z-10">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mt-12"
          >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] pb-4 mb-2">
                Terms of Service
              </h1>
              
              <p className="mt-5 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                These Terms of Service govern the use of Logs Bot. By inviting Logs Bot to a Discord server or using its features, you agree to be bound by these Terms of Service.
              </p>
              <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                If you do not agree to these terms, you must not use Logs Bot.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="relative rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FontAwesomeIcon icon={faFileLines} className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document Type</div>
                      <div className="text-gray-900 dark:text-white font-semibold">Terms of Service</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FontAwesomeIcon icon={faCalendar} className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</div>
                      <div className="text-gray-900 dark:text-white font-semibold">01/01/2026</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FontAwesomeIcon icon={faGavel} className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Legal Status</div>
                      <div className="text-gray-900 dark:text-white font-semibold">Binding Agreement</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg p-8 md:p-12">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="relative"
                >
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-5 tracking-tight">
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-sm mr-2">{String(index + 1).padStart(2, '0')}.</span>
                    {section.title}
                  </h2>
                  
                  <div className="space-y-3.5 text-gray-800 dark:text-gray-200 leading-relaxed ml-6">
                    {section.content.map((item, itemIndex) => (
                      <p
                        key={itemIndex}
                        className="text-sm md:text-base font-normal"
                        style={{ textAlign: 'justify' }}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Fair and transparent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">terms for everyone.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
              We believe in clear, fair terms that protect both you and us. 
              Our commitment is to provide transparent service agreements that everyone can understand.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: faCheck, text: "Clear and understandable terms", color: "text-emerald-400" },
                { icon: faCheck, text: "Fair use policies for all users", color: "text-emerald-400" },
                { icon: faCheck, text: "Transparent service agreements", color: "text-emerald-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={item.icon} className={`h-4 w-4 ${item.color}`} />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl p-8 overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={faScaleBalanced} className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Legal Clarity</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fair terms for all.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">24/7</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Support</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Fair</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Terms</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "We believe in fair, transparent terms that protect both users and our service. Every agreement is designed to be clear and understandable."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-gradient-to-r from-blue-800 via-indigo-800 to-indigo-900 p-12 shadow-2xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Contact
              </h2>
              <p className="text-lg text-white/90 max-w-2xl">
                If you have questions regarding these Terms of Service, please contact us through our official support channels.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4">
              <motion.a
                href="mailto:legal@logsbot.com"
                className="inline-flex items-center gap-2.5 bg-white/95 rounded-lg px-6 py-3 text-base font-medium text-purple-600/90 shadow-sm border border-purple-200/50"
                whileTap={{ scale: 0.98 }}
              >
                <span>Contact Legal Team</span>
                <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="https://discord.gg/ER8F8QgbBc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-white/10 rounded-lg px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-white/20 transition-all duration-200 border border-white/20"
                whileTap={{ scale: 0.98 }}
              >
                <FontAwesomeIcon icon={faDiscord} className="h-5 w-5" />
                <span>Support Server</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
