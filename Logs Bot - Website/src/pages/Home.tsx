import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faUsers, faBell, faChartBar, faArrowUpRightFromSquare, faArrowRight, faTriangleExclamation, faMicrophone, faFaceSmile, faFire, faPenToSquare, faUserPlus, faBolt, faLock, faInfinity, faCheck, faHeart, faSignal } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import React, { useRef, useEffect, useMemo } from "react";

const alerts = [
  { type: "mod", text: "Anti-spam triggered in #general" },
  { type: "fire", text: "Popular message got 50+ reactions" },
  { type: "warn", text: "Role @VIP assigned to @Bob" },
  { type: "plus", text: "@Chris was promoted to Moderator" },
  { type: "mod", text: "@Mod cleared 15 messages" },
  { type: "join", text: "2 bots added to the server" },
  { type: "warn", text: "Server reached 1,000 members!" },
  { type: "plus", text: "Welcome bot activated for new members" },
  { type: "critical", text: "Security alert: suspicious login detected" },
  { type: "fun", text: "User @Luna sent a meme" },
  { type: "join", text: "5 new invites created" },
  { type: "mod", text: "Modmail received from @User" },
  { type: "edit", text: "Channel description changed" },
  { type: "warn", text: "Giveaway started in #events" },
  { type: "voice", text: "User @Mike joined voice channel" },
  { type: "fun", text: "@Alex started a fun poll" },
  { type: "join", text: "3 members joined in the last hour" },
  { type: "voice", text: "@Sarah started streaming in #music" },
  { type: "warn", text: "Poll created in #suggestions" },
  { type: "fire", text: "Server hit a new activity record!" },
  { type: "plus", text: "New member @Nova joined the team" },
  { type: "edit", text: "@Tom updated their status message" },
  { type: "critical", text: "Bot error: failed to log message" },
  { type: "voice", text: "Voice channel created: #gaming-room" },
  { type: "fire", text: "Trending topic: #DevDiscussion" },
  { type: "join", text: "User @Sam left the server" },
  { type: "warn", text: "Suspicious link removed in #general" },
  { type: "mod", text: "@Mod muted @User for 10m" },
  { type: "mod", text: "@Admin banned @Spammer" },
  { type: "join", text: "User @Eve joined the server" },
  { type: "fun", text: "Emoji reaction party in #random" },
  { type: "edit", text: "Message edited in #general" },
  { type: "warn", text: "New channel #announcements created" },
  { type: "join", text: "User @Alice boosted the server" },
  { type: "mod", text: "@Helper warned @TroubleMaker" },
];


const iconMap: { [key: string]: JSX.Element } = {
  mod: <FontAwesomeIcon icon={faShield} className="h-4 w-4 text-indigo-400" />,
  warn: <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-lime-400" />,
  join: <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-cyan-400" />,
  critical: <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 text-rose-400" />,
  voice: <FontAwesomeIcon icon={faMicrophone} className="h-4 w-4 text-violet-400" />,
  edit: <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4 text-emerald-400" />,
  fun: <FontAwesomeIcon icon={faFaceSmile} className="h-4 w-4 text-fuchsia-400" />,
  fire: <FontAwesomeIcon icon={faFire} className="h-4 w-4 text-orange-400" />,
  plus: <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4 text-sky-400" />,
};

function distributeTypesNoBlocks<T extends { type: string }>(array: T[]): T[] {
  const typeMap: { [type: string]: T[] } = {};
  array.forEach(alert => {
    if (!typeMap[alert.type]) typeMap[alert.type] = [];
    typeMap[alert.type].push(alert);
  });
  const heap: Array<{ type: string; items: T[] }> = Object.keys(typeMap)
    .map(type => ({ type, items: [...typeMap[type]] }))
    .sort((a, b) => b.items.length - a.items.length);
  heap.forEach(group => {
    for (let i = group.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group.items[i], group.items[j]] = [group.items[j], group.items[i]];
    }
  });
  const result: T[] = [];
  let lastType = '';
  while (result.length < array.length) {
    let idx = heap.findIndex(group => group.type !== lastType && group.items.length > 0);
    if (idx === -1) {
      idx = heap.findIndex(group => group.items.length > 0);
      if (idx === -1) break;
    }
    const group = heap[idx];
    result.push(group.items.pop()!);
    lastType = group.type;
    heap.sort((a, b) => b.items.length - a.items.length);
  }
  return result;
}

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

function LiveFeed() {
  const feedRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemHeight, setItemHeight] = React.useState(0);
  const totalLines = alerts.length;
  const distributedAlerts = useMemo(() => distributeTypesNoBlocks(alerts), []);
  const feedItems = [...distributedAlerts, ...distributedAlerts];
  const lineDuration = 2.1;
  const totalDuration = lineDuration * totalLines;

  useEffect(() => {
    if (feedRef.current && feedRef.current.firstChild) {
      const height = (feedRef.current.firstChild as HTMLElement).clientHeight;
      setItemHeight(height);
    }
  }, []);

  return (
    <div className="w-full rounded-xl border border-gray-200/60 dark:border-white/10 bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-white/5 p-4 shadow-md">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
        <span className="flex items-center">
          <FontAwesomeIcon icon={faSignal} className="mr-1 h-4 w-4" />
          Live feed
        </span>
      </div>
      <div ref={containerRef} className="relative h-40 overflow-hidden w-full">
        <div
          ref={feedRef}
          className="absolute w-full"
          style={{
            animation: itemHeight
              ? `livefeed-scroll ${totalDuration}s linear infinite`
              : undefined,
            willChange: 'transform',
          }}
        >
          {feedItems.map((msg, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm px-2 py-0.5 w-full min-w-0"
              style={{
                fontFamily: "inherit",
                fontWeight: 500,
                color: "var(--tw-prose-body, #e5e7eb)",
                width: "100%",
              }}
            >
              {iconMap[msg.type]}
              <span className="text-gray-700 dark:text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap w-full block">
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>
        {`
        @keyframes livefeed-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-${itemHeight * totalLines}px); }
        }
        .dark .text-gray-700 { color: #e5e7eb !important; }
        `}
      </style>
    </div>
  );
}

export default function Home() {
  const { user, login } = useAuth();
  const BOT_INVITE_URL = import.meta.env.VITE_BOT_INVITE_URL;

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-gray-950 dark:via-slate-900/90 dark:to-gray-900"></div>
      
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] pointer-events-none"></div>
      
      
      <section className="relative overflow-hidden min-h-screen flex items-center z-10 pt-20 sm:pt-24 md:pt-28">


        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                 <div className="inline-flex items-center space-x-2 sm:space-x-3 rounded-full bg-gray-900/90 dark:bg-gray-800/90 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm border border-gray-700/50">
                   <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500"></span>
                   </span>
                   <span>Live Status • 99.9% Uptime</span>
                 </div>
                <h1 className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 leading-[1.1] pb-3 sm:pb-4 mb-2">
                  Professional Discord Logging
                </h1>
                <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Monitor messages, members, voice activity, and moderation.
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>All in one beautiful dashboard.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <motion.a
                    href={BOT_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 sm:px-6 md:px-7 py-3 sm:py-3.5 md:py-4 text-white font-semibold text-sm sm:text-base shadow-lg hover:bg-blue-700 hover:shadow-xl active:bg-blue-800 transition touch-manipulation min-h-[44px] w-full sm:w-auto"
                    whileTap={{ scale: 0.98 }}
                  >
                    Invite Bot <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 h-4 w-4" />
                  </motion.a>
                  {user ? (
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900/5 dark:bg-white/10 px-5 sm:px-6 md:px-7 py-3 sm:py-3.5 md:py-4 text-gray-900 dark:text-white font-semibold text-sm sm:text-base ring-1 ring-inset ring-gray-900/10 dark:ring-white/15 hover:bg-gray-900/10 dark:hover:bg-white/15 active:bg-gray-900/15 dark:active:bg-white/20 transition touch-manipulation min-h-[44px] w-full sm:w-auto"
                      >
                        Open Dashboard <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={login}
                      className="inline-flex items-center justify-center rounded-lg bg-gray-900/5 dark:bg-white/10 px-5 sm:px-6 md:px-7 py-3 sm:py-3.5 md:py-4 text-gray-900 dark:text-white font-semibold text-sm sm:text-base ring-1 ring-inset ring-gray-900/10 dark:ring-white/15 hover:bg-gray-900/10 dark:hover:bg-white/15 active:bg-gray-900/15 dark:active:bg-white/20 transition touch-manipulation min-h-[44px] w-full sm:w-auto"
                      whileTap={{ scale: 0.98 }}
                    >
                      Login <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
                    </motion.button>
                  )}
                </div>

              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative mt-8 lg:mt-0"
            >
              <HoverCard className="relative rounded-xl sm:rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-400" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <LiveFeed />

                  <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                      <FontAwesomeIcon icon={faChartBar} className="h-4 w-4" /> Analytics
                    </div>
                                         <div className="h-28 w-full rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center relative overflow-hidden">
                      <style>
                        {`
                          .ecg-scroll-group {
                            transform-box: fill-box;
                            animation: ecg-scroll-ltr 2s linear infinite;
                          }
                          .ecg-polyline {
                            stroke-dasharray: 1000;
                            stroke-dashoffset: 0;
                            filter: url(#glow-filter);
                          }
                          @keyframes ecg-scroll-ltr {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(100px); }
                          }
                        `}
                      </style>
                      <div className="absolute bottom-0 left-0 w-full flex items-end h-3/4 z-0 px-6 gap-2">
                        <div className="w-3 bg-white/20 rounded-t-md animate-pulse" style={{ height: '30%', animationDelay: '0.1s' }} />
                        <div className="w-3 bg-white/30 rounded-t-md animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }} />
                        <div className="w-3 bg-white/10 rounded-t-md animate-pulse" style={{ height: '40%', animationDelay: '0.3s' }} />
                        <div className="w-3 bg-white/25 rounded-t-md animate-pulse" style={{ height: '70%', animationDelay: '0.4s' }} />
                        <div className="w-3 bg-white/15 rounded-t-md animate-pulse" style={{ height: '35%', animationDelay: '0.5s' }} />
                        <div className="w-3 bg-white/20 rounded-t-md animate-pulse" style={{ height: '55%', animationDelay: '0.6s' }} />
                        <div className="w-3 bg-white/10 rounded-t-md animate-pulse" style={{ height: '25%', animationDelay: '0.7s' }} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-gray-100 dark:bg-white/10 px-2 py-2 text-center">
                        <div className="text-gray-900 dark:text-white font-semibold">200K+</div>
                        <div className="text-gray-500 dark:text-gray-400">Events/Day</div>
                      </div>
                      <div className="rounded-md bg-gray-100 dark:bg-white/10 px-2 py-2 text-center">
                        <div className="text-gray-900 dark:text-white font-semibold">99.9%</div>
                        <div className="text-gray-500 dark:text-gray-400">Uptime</div>
                      </div>
                      <div className="rounded-md bg-gray-100 dark:bg-white/10 px-2 py-2 text-center">
                        <div className="text-gray-900 dark:text-white font-semibold">100+</div>
                        <div className="text-gray-500 dark:text-gray-400">Servers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverCard>
            </motion.div>
          </div>
        </div>
      </section>
      
      <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 sm:mb-8">
              Commitment to Community
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 sm:mb-8 px-4">
              Powerful features. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Uncompromisingly free.</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8 sm:mb-10 md:mb-12 px-4">
              We believe that powerful server management tools should be accessible to every community leader. 
              No credit cards, no hidden tiers, and no "premium " features locked behind a paywall.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 w-full mt-4 px-4">
              {[
                { 
                  icon: faInfinity, 
                  title: "Infinite Capacity", 
                  desc: "Log every event across every channel. We don't believe in limits on your visibility." 
                },
                { 
                  icon: faLock, 
                  title: "Privacy First", 
                  desc: "Your data is your own. We prioritize security and transparency in everything we build." 
                },
                { 
                  icon: faBolt, 
                  title: "High Performance", 
                  desc: "Built on a modern stack to ensure sub-second latency, even for the largest servers." 
                }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center group">
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                    <FontAwesomeIcon icon={item.icon} className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Total visibility into every <br className="hidden sm:block" /> corner of your community.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                Logs Bot provides a comprehensive trail of everything that happens in your server. 
                Whether you're auditing staff actions or tracking member growth, you'll have the data you need.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="https://logsbot.com/invite" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all duration-200 touch-manipulation min-h-[44px] text-sm sm:text-base">
                  See it in action <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            >
              {[
                { 
                  icon: faShield, 
                  title: "Auditing", 
                  color: "bg-indigo-500",
                  description: "Track every moderation action, role change, and administrative decision with complete transparency.",
                  stats: "100% Coverage"
                },
                { 
                  icon: faUsers, 
                  title: "Members", 
                  color: "bg-blue-500",
                  description: "Monitor joins, leaves, bans, kicks, and all member activity across your entire server.",
                  stats: "Real-time Updates"
                },
                { 
                  icon: faMicrophone, 
                  title: "Voice", 
                  color: "bg-purple-500",
                  description: "Log voice channel activity, streaming sessions, and audio interactions in your community.",
                  stats: "24/7 Tracking"
                },
                { 
                  icon: faBell, 
                  title: "Alerts", 
                  color: "bg-emerald-500",
                  description: "Get instant notifications for important events, security issues, and community milestones.",
                  stats: "Instant Notifications"
                }
              ].map((stat, i) => (
                <div key={i} className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={stat.icon} className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-900 dark:text-white`} />
                    </div>
                    <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{stat.title}</div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{stat.description}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { 
                title: "Message Intelligence", 
                desc: "Every edit, deletion, and purge is recorded with precise context, including author and timestamps." 
              },
              { 
                title: "Member Journeys", 
                desc: "Track the lifecycle of your members from join to leave, including role updates and nickname changes." 
              },
              { 
                title: "Interaction Hub", 
                desc: "Monitor voice channel traffic, server boosts, and invitation usage to see how members engage." 
              },
              { 
                title: "Staff Transparency", 
                desc: "Keep your moderation team accountable with a clear, immutable record of all administrative actions." 
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative p-1"
              >
                <div className="h-full p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-300">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{feature.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Professional logging, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">completely free.</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg leading-relaxed">
              We believe security and moderation should be accessible to everyone. Logs Bot is engineered to provide enterprise-grade logging for every community, regardless of size.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: faCheck, text: "No hidden costs or restrictions", color: "text-emerald-400" },
                { icon: faCheck, text: "No limits on message or event logs", color: "text-emerald-400" },
                { icon: faCheck, text: "100% of features available to everyone", color: "text-emerald-400" },
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
                    <FontAwesomeIcon icon={faHeart} className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Community First</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Zero traps, all trust.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">$0</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Per Month</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">∞</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Logs</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "We started Logs Bot with one goal: to make professional-grade logging accessible to every Discord server. No tiers, no limits, just reliability."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl">
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                Ready to level up your Discord server?
              </h2>
              <p className="text-base sm:text-lg text-white/90 max-w-2xl">
                Thousands of Discord servers use Logs Bot for logging and server management.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>Get started now!
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <a
                href={BOT_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-white/95 rounded-lg px-5 sm:px-6 py-3 text-sm sm:text-base font-medium text-purple-600/90 shadow-sm hover:shadow-md hover:bg-white active:bg-white/90 transition-all duration-200 border border-purple-200/50 touch-manipulation min-h-[44px] w-full md:w-auto"
              >
                <FontAwesomeIcon icon={faDiscord} className="h-5 w-5 text-purple-600/90" />
                <span>Add to Discord</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}