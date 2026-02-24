import React, { createContext, useContext, useState, useEffect } from 'react';
import { discordApi, type DiscordGuild, type DiscordChannel, type BotGuildInfo } from '../services/api';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  botPresent?: boolean;
  memberCount?: number;
  approximatePresenceCount?: number;
  channels?: Channel[];
  botJoinedAt?: string;
}

interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
}

interface AuthContextType {
  user: User | null;
  guilds: Guild[];
  isLoading: boolean;
  isLoadingGuilds: boolean;
  botStatus: 'online' | 'offline' | 'maintenance';
  login: () => void;
  logout: () => void;
  fetchGuilds: () => Promise<void>;
  fetchGuildChannels: (guildId: string) => Promise<Channel[]>;
  fetchGuildDetails: (guildId: string) => Promise<Guild | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);
  const [botStatus, setBotStatus] = useState<'online' | 'offline' | 'maintenance'>('offline');

  const login = () => {
    const scope = 'identify guilds';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('discord_access_token');
    setUser(null);
    setGuilds([]);
    discordApi.clearCache();
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        discordApi.setUserToken(token);
        return true;
      } else {
        localStorage.removeItem('discord_access_token');
        return false;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return false;
    }
  };

  const fetchGuilds = async () => {
    const token = localStorage.getItem('discord_access_token');
    if (!token) return;

    setIsLoadingGuilds(true);
    try {
      const [userGuilds, botGuildsInfo] = await Promise.allSettled([
        discordApi.getUserGuilds(),
        discordApi.getAllBotGuilds()
      ]);
      
      if (userGuilds.status === 'rejected') {
        console.error('Failed to fetch user guilds:', userGuilds.reason);
        return;
      }
      
      const manageableGuilds = userGuilds.value.filter((guild: DiscordGuild) => 
        guild.owner || (BigInt(guild.permissions) & BigInt(0x20)) === BigInt(0x20)
      );
      
      const botGuildsMap = botGuildsInfo.status === 'fulfilled' ? botGuildsInfo.value : new Map();
      
      const guildsWithBotStatus = manageableGuilds.map((guild: DiscordGuild) => {
        const botInfo = botGuildsMap.get(guild.id);
        return {
          ...guild,
          botPresent: !!botInfo,
          memberCount: botInfo?.member_count || 0,
          approximatePresenceCount: botInfo?.presence_count || 0,
          channels: botInfo?.channels || [],
          botJoinedAt: botInfo?.joined_at
        };
      });
      
      setGuilds(guildsWithBotStatus);
      
      if (botGuildsInfo.status === 'rejected') {
        console.warn('Bot guilds info failed to load, showing user guilds only');
      }
      
    } catch (error) {
      console.error('Error fetching guilds:', error);
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  const fetchGuildChannels = async (guildId: string): Promise<Channel[]> => {
    try {
      const channels = await discordApi.getGuildChannels(guildId);
      return channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position
      }));
    } catch (error) {
      console.error('Error fetching guild channels:', error);
      return [];
    }
  };

  const fetchGuildDetails = async (guildId: string): Promise<Guild | null> => {
    try {
      const botInfo = await discordApi.getGuildDetails(guildId);
      if (!botInfo) return null;

      const guild = guilds.find(g => g.id === guildId);
      if (!guild) return null;

      return {
        ...guild,
        memberCount: botInfo.member_count,
        approximatePresenceCount: botInfo.presence_count,
        channels: botInfo.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position
        })),
        botJoinedAt: botInfo.joined_at
      };
    } catch (error) {
      console.error('Error fetching guild details:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const status = await discordApi.getBotStatus();
        setBotStatus(status);
      } catch (error) {
        console.error('Error checking bot status:', error);
        setBotStatus('offline');
      }
    };

    checkBotStatus();
    const interval = setInterval(checkBotStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');

      if (accessToken) {
        localStorage.setItem('discord_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('discord_access_token');
      if (token) {
        const success = await fetchUser(token);
        if (success) {
          await fetchGuilds();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      guilds, 
      isLoading, 
      isLoadingGuilds,
      botStatus, 
      login, 
      logout, 
      fetchGuilds, 
      fetchGuildChannels, 
      fetchGuildDetails 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}