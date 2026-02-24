import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { NotFoundHandler } from '../utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { discordApi, type LogSettings } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMessage, faUsers, faVolumeHigh, faShield, faHashtag, faCrown, faCalendar, faChartLine, faPaperPlane, faUserCheck, faLink, faCode, faCalendarDays, faFaceSmile, faBolt } from '@fortawesome/free-solid-svg-icons';
import AnimatedToggle from '../components/AnimatedToggle';
import CustomLoader from '../components/CustomLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import CustomDropdown from '../components/dropd';
import ServerSidebar from '../components/ServerSidebar';
import ServerLogsTab from '../components/logs';
import ServerStatsTab from '../components/ServerStatsTab';
import ServerLogs from '../components/ServerLogs';
import ExportTab from '../components/ExportTab';
import TranscriptsTab from '../components/TranscriptsTab';

interface LogCategory { id: string; name: string; icon: any; color: string; events: LogEvent[]; }
interface LogEvent { id: string; name: string; description: string; enabled: boolean; channel: string; }
interface Channel { id: string; name: string; type: number; position: number; }

const getColorClass = (color: string): string => {
  return '#93c5fd';
};

const getIconColorClass = (color: string): string => {
  return '#93c5fd';
};

export default function ServerPanel() {
const { guildId, tab, transcriptId } = useParams<{ guildId: string; tab?: string; transcriptId?: string }>();
const navigate = useNavigate();
const { guilds, fetchGuildChannels, fetchGuildDetails, user, fetchGuilds } = useAuth();
const [channels, setChannels] = useState<Channel[]>([]);
const [isLoadingChannels, setIsLoadingChannels] = useState(false);
const [isTesting, setIsTesting] = useState(false);
const [guildDetails, setGuildDetails] = useState<any>(null);
const [showTestLogModal, setShowTestLogModal] = useState(false);
const [selectedChannelId, setSelectedChannelId] = useState<string>('');
const [isSendingTestLog, setIsSendingTestLog] = useState(false);
const [channelSearchQuery, setChannelSearchQuery] = useState<string>('');
const [testLogStep, setTestLogStep] = useState<'select' | 'confirm'>('select');
const [activeTab, setActiveTab] = useState<string>(tab || 'config');
const [isRefreshingGuild, setIsRefreshingGuild] = useState(false);

const validTabs = ['config', 'server-logs', 'audit-log', 'export', 'transcripts'];

useEffect(() => { 
  if (transcriptId) {
    if (activeTab !== 'transcripts') {
      setActiveTab('transcripts');
    }
  } else if (tab && tab !== activeTab) { 
    if (validTabs.includes(tab)) {
      setActiveTab(tab); 
    }
  } else if (!tab && !transcriptId) { 
    setActiveTab('config'); 
    navigate(`/${guildId}/dashboard/config`); 
  } 
}, [tab, activeTab, guildId, navigate, transcriptId]);

const [logCategories, setLogCategories] = useState<LogCategory[]>([
{ id: 'member', name: 'Member Logs', icon: faUsers, color: 'green', events: [{ id: 'member_joined', name: 'Member Joined', description: 'When a user joins the server', enabled: true, channel: '' }, { id: 'member_left', name: 'Member Left', description: 'When a user leaves the server', enabled: true, channel: '' }, { id: 'member_updated', name: 'Member Updated', description: 'When member roles or permissions change', enabled: false, channel: '' }, { id: 'nickname_changed', name: 'Nickname Changed', description: 'When a member changes their nickname', enabled: false, channel: '' }] },
{ id: 'user', name: 'User Logs', icon: faUserCheck, color: 'blue', events: [{ id: 'user_updated', name: 'User Updated', description: 'When a user updates their profile', enabled: false, channel: '' }, { id: 'username_changed', name: 'Username Changed', description: 'When a user changes their username', enabled: false, channel: '' }, { id: 'avatar_changed', name: 'Avatar Changed', description: 'When a user changes their avatar', enabled: false, channel: '' }] },
{ id: 'moderation', name: 'Moderation & Security Logs', icon: faShield, color: 'red', events: [{ id: 'member_banned', name: 'Member Banned', description: 'When a member is banned from the server', enabled: true, channel: '' }, { id: 'ban_removed', name: 'Ban Removed', description: 'When a ban is lifted from a user', enabled: true, channel: '' }, { id: 'timeout_applied', name: 'Timeout Applied', description: 'When a member is timed out', enabled: true, channel: '' }, { id: 'timeout_removed', name: 'Timeout Removed', description: 'When a timeout is removed from a member', enabled: true, channel: '' }, { id: 'member_kicked', name: 'Member Kicked', description: 'When a member is kicked from the server', enabled: true, channel: '' }, { id: 'presence_updated', name: 'Presence Updated', description: 'When a user\'s presence changes', enabled: false, channel: '' }, { id: 'permission_overwrites_changed', name: 'Permission Overwrites Changed', description: 'When channel permissions are modified', enabled: false, channel: '' }, { id: 'bot_added_to_server', name: 'Bot Added to Server', description: 'When a bot is added to the server', enabled: true, channel: '' }, { id: 'bot_removed_from_server', name: 'Bot Removed from Server', description: 'When a bot is removed from the server', enabled: true, channel: '' }] },
{ id: 'role', name: 'Role Logs', icon: faCrown, color: 'yellow', events: [{ id: 'role_created', name: 'Role Created', description: 'When a new role is created', enabled: false, channel: '' }, { id: 'role_deleted', name: 'Role Deleted', description: 'When a role is deleted', enabled: false, channel: '' }, { id: 'role_updated', name: 'Role Updated', description: 'When role permissions or settings change', enabled: false, channel: '' }] },
{ id: 'channel', name: 'Channel Logs', icon: faHashtag, color: 'purple', events: [{ id: 'channel_created', name: 'Channel Created', description: 'When a new channel is created', enabled: false, channel: '' }, { id: 'channel_deleted', name: 'Channel Deleted', description: 'When a channel is deleted', enabled: false, channel: '' }, { id: 'channel_updated', name: 'Channel Updated', description: 'When channel settings are modified', enabled: false, channel: '' }, { id: 'thread_created', name: 'Thread Created', description: 'When a new thread is created', enabled: false, channel: '' }, { id: 'thread_updated', name: 'Thread Updated', description: 'When thread settings are modified', enabled: false, channel: '' }, { id: 'thread_deleted', name: 'Thread Deleted', description: 'When a thread is deleted', enabled: false, channel: '' }, { id: 'afk_channel_changed', name: 'AFK Channel Changed', description: 'When the AFK channel is modified', enabled: false, channel: '' }, { id: 'system_messages_channel_changed', name: 'System Messages Channel Changed', description: 'When system messages channel is changed', enabled: false, channel: '' }] },
{ id: 'message', name: 'Message Logs', icon: faMessage, color: 'blue', events: [{ id: 'message_sent', name: 'Message Sent', description: 'When a message is sent (optional)', enabled: false, channel: '' }, { id: 'message_edited', name: 'Message Edited', description: 'When a message is edited', enabled: true, channel: '' }, { id: 'message_deleted', name: 'Message Deleted', description: 'When a message is deleted', enabled: true, channel: '' }, { id: 'bulk_message_deleted', name: 'Bulk Message Deleted', description: 'When multiple messages are deleted at once', enabled: true, channel: '' }] },
{ id: 'invite', name: 'Invite Logs', icon: faLink, color: 'teal', events: [{ id: 'invite_created', name: 'Invite Created', description: 'When a server invite is created', enabled: false, channel: '' }, { id: 'invite_deleted', name: 'Invite Deleted', description: 'When a server invite is deleted', enabled: false, channel: '' }] },
{ id: 'voice', name: 'Voice Logs', icon: faVolumeHigh, color: 'purple', events: [{ id: 'voice_state_updated', name: 'Voice State Updated', description: 'When voice channel state changes', enabled: false, channel: '' }, { id: 'started_streaming', name: 'Started Streaming', description: 'When a user starts streaming', enabled: false, channel: '' }, { id: 'stopped_streaming', name: 'Stopped Streaming', description: 'When a user stops streaming', enabled: false, channel: '' }, { id: 'started_video', name: 'Started Video', description: 'When a user starts video', enabled: false, channel: '' }, { id: 'stopped_video', name: 'Stopped Video', description: 'When a user stops video', enabled: false, channel: '' }, { id: 'self_muted', name: 'Self Muted', description: 'When a user mutes themselves', enabled: false, channel: '' }, { id: 'self_unmuted', name: 'Self Unmuted', description: 'When a user unmutes themselves', enabled: false, channel: '' }, { id: 'self_deafened', name: 'Self Deafened', description: 'When a user deafens themselves', enabled: false, channel: '' }, { id: 'self_undeafened', name: 'Self Undeafened', description: 'When a user undeafens themselves', enabled: false, channel: '' }, { id: 'server_muted', name: 'Server Muted', description: 'When a user is server muted', enabled: false, channel: '' }, { id: 'server_unmuted', name: 'Server Unmuted', description: 'When a user is server unmuted', enabled: false, channel: '' }, { id: 'server_deafened', name: 'Server Deafened', description: 'When a user is server deafened', enabled: false, channel: '' }, { id: 'server_undeafened', name: 'Server Undeafened', description: 'When a user is server undeafened', enabled: false, channel: '' }] },
{ id: 'webhook_stage', name: 'Webhook & Stage Logs', icon: faCode, color: 'indigo', events: [{ id: 'webhook_updated', name: 'Webhook Updated', description: 'When a webhook is modified', enabled: false, channel: '' }, { id: 'stage_started', name: 'Stage Started', description: 'When a stage channel goes live', enabled: false, channel: '' }, { id: 'stage_updated', name: 'Stage Updated', description: 'When stage settings are modified', enabled: false, channel: '' }, { id: 'stage_ended', name: 'Stage Ended', description: 'When a stage channel ends', enabled: false, channel: '' }] },
{ id: 'scheduled_event', name: 'Scheduled Event Logs', icon: faCalendarDays, color: 'pink', events: [{ id: 'scheduled_event_created', name: 'Scheduled Event Created', description: 'When a scheduled event is created', enabled: false, channel: '' }, { id: 'scheduled_event_updated', name: 'Scheduled Event Updated', description: 'When a scheduled event is modified', enabled: false, channel: '' }, { id: 'scheduled_event_deleted', name: 'Scheduled Event Deleted', description: 'When a scheduled event is deleted', enabled: false, channel: '' }, { id: 'scheduled_event_started', name: 'Scheduled Event Started', description: 'When a scheduled event begins', enabled: false, channel: '' }, { id: 'scheduled_event_ended', name: 'Scheduled Event Ended', description: 'When a scheduled event ends', enabled: false, channel: '' }, { id: 'event_subscription_added', name: 'Event Subscription Added', description: 'When someone subscribes to an event', enabled: false, channel: '' }, { id: 'event_subscription_removed', name: 'Event Subscription Removed', description: 'When someone unsubscribes from an event', enabled: false, channel: '' }] },
{ id: 'emoji_sticker', name: 'Emoji & Sticker Logs', icon: faFaceSmile, color: 'orange', events: [{ id: 'emoji_created', name: 'Emoji Created', description: 'When a custom emoji is added', enabled: false, channel: '' }, { id: 'emoji_updated', name: 'Emoji Updated', description: 'When a custom emoji is modified', enabled: false, channel: '' }, { id: 'emoji_deleted', name: 'Emoji Deleted', description: 'When a custom emoji is removed', enabled: false, channel: '' }, { id: 'sticker_created', name: 'Sticker Created', description: 'When a custom sticker is added', enabled: false, channel: '' }, { id: 'sticker_updated', name: 'Sticker Updated', description: 'When a custom sticker is modified', enabled: false, channel: '' }, { id: 'sticker_deleted', name: 'Sticker Deleted', description: 'When a custom sticker is removed', enabled: false, channel: '' }] },
{ id: 'nitro_boost', name: 'Nitro & Boost Logs', icon: faBolt, color: 'pink', events: [{ id: 'server_boosted', name: 'Server Boosted', description: 'When someone boosts the server', enabled: false, channel: '' }, { id: 'server_boost_removed', name: 'Server Boost Removed', description: 'When a boost is removed', enabled: false, channel: '' }, { id: 'boost_tier_changed', name: 'Boost Tier Changed', description: 'When the server boost tier changes', enabled: false, channel: '' }] }
]);

const guild = guilds.find(g => g.id === guildId);

const refreshGuildData = useCallback(async () => {
  if (!guildId || isRefreshingGuild) return;
  setIsRefreshingGuild(true);
  try {
    await fetchGuilds();
    const details = await fetchGuildDetails(guildId);
    if (details) {
      setGuildDetails(details);
    }
  } catch (error) {
    console.error('Error refreshing guild data:', error);
  } finally {
    setIsRefreshingGuild(false);
  }
}, [guildId, fetchGuilds, fetchGuildDetails, isRefreshingGuild]);

useEffect(() => {
const savedSettings = localStorage.getItem(`logs-bot-settings-${guildId}`);
if (savedSettings) { const settings = JSON.parse(savedSettings); setLogCategories(prev => prev.map(category => ({ ...category, events: category.events.map(event => ({ ...event, enabled: settings[event.id]?.enabled ?? event.enabled, channel: settings[event.id]?.channel ?? event.channel })) }))); }
if (guildId) { loadChannels(); loadGuildDetails(); loadLogSettings(); }
  }, [guildId]);

useEffect(() => {
  if (!guildId) return;
  
  const currentGuild = guilds.find(g => g.id === guildId);
  if (!currentGuild && !isRefreshingGuild) {
    refreshGuildData();
  }
  
  const refreshInterval = setInterval(() => {
    const currentGuildCheck = guilds.find(g => g.id === guildId);
    if (!currentGuildCheck && !isRefreshingGuild) {
      refreshGuildData();
    }
  }, 300000);
  
  return () => clearInterval(refreshInterval);
}, [guildId, guilds, refreshGuildData, isRefreshingGuild]);

const loadChannels = async () => { if (!guildId) return; setIsLoadingChannels(true); try { const guildChannels = await discordApi.getGuildChannels(guildId); setChannels(guildChannels); } catch (error) { console.error('Error loading channels:', error); toast.error('Failed to load channels'); } finally { setIsLoadingChannels(false); } };
const loadGuildDetails = async () => { if (!guildId) return; try { const details = await fetchGuildDetails(guildId); setGuildDetails(details); } catch (error) { console.error('Error loading guild details:', error); } };
const loadLogSettings = async () => { if (!guildId) return; try { const logSettings = await discordApi.getLogSettings(guildId); const updatedCategories = logCategories.map(category => ({ ...category, events: category.events.map(event => ({ ...event, enabled: !!logSettings[event.name], channel: logSettings[event.name] || '' })) })); setLogCategories(updatedCategories); } catch (error) { console.error('Error loading log settings:', error); toast.error('Failed to load log settings'); } };

const handleAutoSave = async (updatedCategories: LogCategory[]) => { if (!guildId) return; const settings: any = {}; updatedCategories.forEach(category => { category.events.forEach(event => { settings[event.id] = { enabled: event.enabled, channel: event.channel }; }); }); localStorage.setItem(`logs-bot-settings-${guildId}`, JSON.stringify(settings)); };

const saveSingleLogSetting = async (logName: string, channelId: string, userId?: string, username?: string, userAvatar?: string) => { if (!guildId) return; try { await discordApi.updateLogSetting(guildId, logName, channelId, userId, username, userAvatar); } catch (error) { console.error('Error saving to bot:', error); toast.error('Failed to save changes to bot'); } };

const changeLogChannel = async (logName: string, channelId: string, userId?: string, username?: string, userAvatar?: string) => { if (!guildId) return; try { await discordApi.updateLogSetting(guildId, logName, channelId, userId, username, userAvatar, 'channel_change'); } catch (error) { console.error('Error changing log channel:', error); toast.error('Failed to change log channel'); } };

const removeSingleLogSetting = async (logName: string, userId?: string, username?: string, userAvatar?: string) => { if (!guildId) return; try { await discordApi.removeLogSetting(guildId, logName, userId, username, userAvatar); } catch (error) { console.error('Error removing from bot:', error); toast.error('Failed to remove setting from bot'); } };

const handleTestLog = () => { 
  setShowTestLogModal(true); 
  setTestLogStep('select');
  setSelectedChannelId('');
  setChannelSearchQuery('');
};

const handleChannelSelect = (channelId: string) => {
  setSelectedChannelId(channelId);
  setTestLogStep('confirm');
};

const handleSendTestLog = async () => { 
  if (!selectedChannelId) { 
    toast.error('Please select a channel'); 
    return; 
  } 
  if (!guildId) {
    toast.error('Guild ID is missing');
    return;
  }
  
  setIsSendingTestLog(true); 
  
  try { 
    const result = await discordApi.sendTestLog(guildId, selectedChannelId); 
    
    if (result.success) { 
      toast.success(`Test log sent successfully to #${result.channelName || 'channel'}!`); 
      setShowTestLogModal(false); 
      setSelectedChannelId(''); 
      setChannelSearchQuery(''); 
      setTestLogStep('select');
    } else { 
      console.error('[Frontend] Test log failed:', result.message);
      toast.error(result.message || 'Failed to send test log'); 
    } 
  } catch (error) { 
    console.error('[Frontend] Test log error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to send test log. Please try again.'); 
  } finally { 
    setIsSendingTestLog(false); 
  } 
};

const handleBackToSelect = () => {
  setTestLogStep('select');
};

const handleCloseModal = () => {
  setShowTestLogModal(false);
  setSelectedChannelId('');
  setChannelSearchQuery('');
  setTestLogStep('select');
};

const handleEventToggle = (categoryId: string, eventId: string) => { const currentEvent = logCategories.find(cat => cat.id === categoryId)?.events.find(evt => evt.id === eventId); if (!currentEvent) return; if (!currentEvent.enabled && !currentEvent.channel) { toast.error('Please select a channel first'); return; } const wasEnabled = currentEvent?.enabled; const updatedCategories = logCategories.map(category => { if (category.id === categoryId) { return { ...category, events: category.events.map(event => event.id === eventId ? { ...event, enabled: !event.enabled } : event) }; } return category; }); setLogCategories(updatedCategories); const event = updatedCategories.find(cat => cat.id === categoryId)?.events.find(evt => evt.id === eventId); if (event) { const guild = guilds.find(g => g.id === guildId); const userRole = guild?.owner ? 'Owner' : 'Admin'; const username = user?.username || 'Unknown'; const userAvatar = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined; handleAutoSave(updatedCategories); if (event.enabled) { if (event.channel) { toast.success(`Enabled ${event.name} log`); saveSingleLogSetting(event.name, event.channel, userRole, username, userAvatar); } else { toast.error('Please select a channel first'); const revertedCategories = logCategories.map(category => { if (category.id === categoryId) { return { ...category, events: category.events.map(evt => evt.id === eventId ? { ...evt, enabled: false } : evt) }; } return category; }); setLogCategories(revertedCategories); } } else { toast.success(`Disabled ${event.name} log`); removeSingleLogSetting(event.name, userRole, username, userAvatar); } } };

const handleChannelChange = (categoryId: string, eventId: string, channelId: string) => { const currentEvent = logCategories.find(cat => cat.id === categoryId)?.events.find(evt => evt.id === eventId); const oldChannelId = currentEvent?.channel; const updatedCategories = logCategories.map(category => { if (category.id === categoryId) { return { ...category, events: category.events.map(event => event.id === eventId ? { ...event, channel: channelId, enabled: true } : event) }; } return category; }); setLogCategories(updatedCategories); const event = updatedCategories.find(cat => cat.id === categoryId)?.events.find(evt => evt.id === eventId); if (event && channelId) { const guild = guilds.find(g => g.id === guildId); const userRole = guild?.owner ? 'Owner' : 'Admin'; const username = user?.username || 'Unknown'; const userAvatar = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined; handleAutoSave(updatedCategories); if (oldChannelId && oldChannelId !== channelId) { toast.success(`Changed ${event.name} log channel`); changeLogChannel(event.name, channelId, userRole, username, userAvatar); } else if (!oldChannelId) { toast.success(`Enabled ${event.name} log`); saveSingleLogSetting(event.name, channelId, userRole, username, userAvatar); } } };

if (!guild && isRefreshingGuild) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BeatLoader size={10} color="#6b7280" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading server data...</p>
      </motion.div>
    </div>
  );
}

if (tab && !validTabs.includes(tab)) {
  return <NotFoundHandler />;
}

if (!guild) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <motion.div 
        className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
          Server not found or you don't have permission to manage it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={refreshGuildData}
            disabled={isRefreshingGuild}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            whileHover={{ scale: isRefreshingGuild ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isRefreshingGuild ? (
              <>
                <BeatLoader size={6} color="#ffffff" className="mr-2" />
                Refreshing...
              </>
            ) : (
              'Try Again'
            )}
          </motion.button>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

const getServerIcon = () => guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;
const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
const formatJoinDate = (dateString?: string) => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const discordEpoch = new Date('2015-01-01');
    if (date > now || date < discordEpoch) return 'Unknown';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
};

return (
<div className="min-h-screen bg-white dark:bg-gray-900">
<ServerSidebar guild={guild} activeTab={activeTab} onTabChange={(newTab) => { setActiveTab(newTab); navigate(`/${guildId}/dashboard/${newTab}`); }} isMobile={false} />

<div className="lg:ml-64 min-h-screen pt-20 sm:pt-24 lg:pt-28 pb-20 px-4 sm:px-6 lg:px-8 transition-all duration-300">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
<motion.div className="flex-1" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
<Link to="/dashboard" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4 group">
<motion.div whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}><FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" /></motion.div>Back to Dashboard
</Link>

<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-6 gap-4">
<div className="flex items-center space-x-3 sm:space-x-4">
<div>
{getServerIcon() ? (<img src={getServerIcon()!} alt={guild.name} className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-lg shadow-lg flex-shrink-0" draggable="false" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />) : (<div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"><span className="text-white font-bold text-base sm:text-lg">{getInitials(guild.name)}</span></div>)}
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center space-x-2">
<motion.h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>{guild.name}</motion.h1>
</div>
<motion.p className="text-sm sm:text-base text-gray-600 dark:text-gray-400" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>{activeTab === 'config' && 'Configure comprehensive logging settings'}{activeTab === 'export' && 'Export logs and backup settings'}{activeTab === 'server-logs' && 'View server logs from Discord bot'}{activeTab === 'audit-log' && 'View audit log and user activity history'}{activeTab === 'transcripts' && 'View conversation transcripts'}</motion.p>
</div>
</div>
</div>
</motion.div>
{activeTab === 'config' && (
<div className="flex items-center lg:items-start lg:pt-12 flex-shrink-0">
<motion.button onClick={handleTestLog} disabled={isTesting} className="inline-flex items-center px-3 sm:px-4 py-2 text-sm sm:text-base text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:brightness-110 touch-manipulation min-h-[44px]" style={{ backgroundColor: '#2563eb' }} whileHover={{ scale: isTesting ? 1 : 1.05 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>{isTesting ? (<BeatLoader size={6} color="#ffffff" />) : (<><FontAwesomeIcon icon={faPaperPlane} className="mr-2 h-4 w-4" />Send Test Log</>)}</motion.button>
</div>
)}
</div>

<motion.div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
{[{ icon: faHashtag, label: 'Server ID', value: guild.id }, { icon: faUsers, label: 'Members', value: guildDetails?.memberCount?.toLocaleString() || guild.memberCount?.toLocaleString() || 'Loading...' }, { icon: faChartLine, label: 'Online', value: guildDetails?.approximatePresenceCount?.toLocaleString() || guild.approximatePresenceCount?.toLocaleString() || 'Loading...' }, { icon: faCalendar, label: 'Joined', value: formatJoinDate(guildDetails?.botJoinedAt || guild.botJoinedAt) }].map((stat, index) => { return (<motion.div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300" whileHover={{ scale: 1.02, y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}><div className="flex items-center space-x-2"><FontAwesomeIcon icon={stat.icon} className="h-5 w-5" style={{ color: '#93c5fd' }} /><div><p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p><p className="text-gray-900 dark:text-white font-semibold text-sm">{stat.value}</p></div></div></motion.div>); })}
</motion.div>

<AnimatePresence mode="wait">
{activeTab === 'config' && (<motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}><motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>{logCategories.map((category, categoryIndex) => { const colorClass = getColorClass(category.color); const iconColorClass = getIconColorClass(category.color); return (<motion.div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + categoryIndex * 0.1, duration: 0.4 }}><div className="flex items-center space-x-3 mb-4"><h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{category.name}</h2></div><div className="space-y-3">{category.events.map((event, eventIndex) => (<motion.div key={event.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + categoryIndex * 0.1 + eventIndex * 0.05, duration: 0.3 }}><div className="flex-1 min-w-0"><div className="flex items-start sm:items-center space-x-3 gap-3"><motion.button onClick={() => !event.channel && !event.enabled ? toast.error('Please select a channel first') : handleEventToggle(category.id, event.id)} disabled={!event.channel && !event.enabled} className={`relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-all duration-200 focus:outline-none flex-shrink-0 touch-manipulation ${!event.channel && !event.enabled ? 'opacity-50 cursor-not-allowed' : ''} ${event.enabled ? '' : 'bg-gray-300 dark:bg-gray-600'}`} style={event.enabled ? { backgroundColor: colorClass } : {}} whileTap={event.channel || event.enabled ? { scale: 0.95 } : {}}><motion.span className="inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-sm" animate={{ x: event.enabled ? [2, 24, 22] : [2] }} transition={{ type: "spring", stiffness: 500, damping: 30 }} /></motion.button><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">{event.name}</h3><p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p></div></div></div><motion.div className="w-full sm:w-64 sm:ml-4 sm:min-w-0 flex-shrink-0" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>{isLoadingChannels ? (<div className="flex justify-center py-2"><BeatLoader size={6} color="#2563eb" /></div>) : (<CustomDropdown value={event.channel} onChange={(channelId) => handleChannelChange(category.id, event.id, channelId)} options={channels} placeholder="Select channel..." disabled={isLoadingChannels} />)}</motion.div></motion.div>))}</div></motion.div>); })}</motion.div></motion.div>)}

{activeTab === 'server-logs' && (<ServerLogs guildId={guildId!} />)}

{activeTab === 'audit-log' && (<ServerLogsTab guildId={guildId!} />)}

{activeTab === 'export' && (<ExportTab guildId={guildId!} guild={guild} />)}

{activeTab === 'transcripts' && (<TranscriptsTab guildId={guildId!} />)}
</AnimatePresence>
</div>
</div>

<AnimatePresence mode="wait">
{showTestLogModal && (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={handleCloseModal}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        onClick={(e) => e.stopPropagation()}
      >
      {testLogStep === 'select' ? (
        <motion.div
          key="select"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send Test Log</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Channel</label>
            <input 
              type="text" 
              placeholder="Type channel name to search..." 
              value={channelSearchQuery} 
              onChange={(e) => setChannelSearchQuery(e.target.value)} 
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-base touch-manipulation" 
            />
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md custom-scrollbar">
              {channels
                .filter(channel => channel.type === 0 || channel.type === 5)
                .filter(channel => channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                .map(channel => (
                  <div 
                    key={channel.id} 
                    onClick={() => handleChannelSelect(channel.id)} 
                    className="px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 transition-colors text-gray-900 dark:text-white touch-manipulation min-h-[44px] flex items-center"
                  >
                    #{channel.name}
                  </div>
                ))}
              {channels.filter(channel => channel.type === 0 || channel.type === 5).filter(channel => channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase())).length === 0 && (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No channels found</div>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleCloseModal} 
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-400 transition-colors touch-manipulation min-h-[44px] font-medium"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Test Log</h3>
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to send a test log to the following channel?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                #{channels.find(c => c.id === selectedChannelId)?.name || 'Unknown Channel'}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleBackToSelect} 
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-400 transition-colors touch-manipulation min-h-[44px] font-medium"
            >
              Back
            </button>
            <button 
              onClick={handleSendTestLog} 
              disabled={isSendingTestLog} 
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center touch-manipulation min-h-[44px] font-medium"
            >
              {isSendingTestLog ? (
                <>
                  <BeatLoader size={6} color="#ffffff" className="mr-2" />
                  Sending...
                </>
              ) : (
                'Send Test Log'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  </motion.div>
)}
</AnimatePresence>
</div>
);
}