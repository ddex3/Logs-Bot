import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faHashtag, faMessage, faTrash, faX, faClock, faEye, faImage, faPaperclip, faLink, faCopy } from '@fortawesome/free-solid-svg-icons';
import { discordApi } from '../services/api';
import CustomLoader from './CustomLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import toast from 'react-hot-toast';

interface Transcript {
  id: string;
  channelId: string;
  channelName: string;
  deletedBy: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  deletedAt: string;
  messageCount: number;
  messages: Array<{
    id: string;
    author: {
      id: string;
      username: string;
      avatar: string | null;
      discriminator?: string;
    };
    content: string;
    timestamp: string;
    attachments?: Array<{ url: string; filename: string }>;
    embeds?: Array<any>;
  }>;
}

const AttachmentDisplay = ({ attachment }: { attachment: any; idx: number }) => {
  const [imageError, setImageError] = useState(false);
  const url = attachment.url || attachment.proxy_url || attachment.attachment || attachment.attachment_url;
  const filename = attachment.filename || attachment.name || 'attachment';
  const isImage = !imageError && (
    attachment.content_type?.startsWith('image/') || 
    attachment.contentType?.startsWith('image/') ||
    attachment.type?.startsWith('image/') ||
    filename.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|tif)$/i) ||
    (url && (url.includes('image') || url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|tif)(\?|$)/i)))
  );
  
  if (isImage && url) {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-600 dark:border-gray-700">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img 
            src={url} 
            alt={filename}
            className="max-w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </a>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-600 dark:border-gray-700">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 bg-gray-700/50 dark:bg-gray-800/50 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
      >
        <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-gray-300 text-xs sm:text-sm truncate">{filename}</span>
      </a>
    </div>
  );
};

export default function TranscriptsTab({ guildId }: { guildId: string }) {
  const navigate = useNavigate();
  const { transcriptId: urlTranscriptId } = useParams<{ transcriptId?: string }>();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  useEffect(() => {
    const fetchTranscripts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await discordApi.getTranscripts(guildId, undefined, 50, 0);
        if (response.success && response.transcripts) {
          const transformedTranscripts: Transcript[] = response.transcripts.map((t: any) => {
            const deletedByStr = t.deletedBy || 'Unknown';
            let deletedByUsername = 'Unknown';
            let deletedByDisplayName = 'Unknown';
            let deletedById = '0';
            
            if (typeof deletedByStr === 'string') {
              const mentionMatch = deletedByStr.match(/<@(\d+)>\s*\(([^)]+)\)/);
              if (mentionMatch) {
                deletedById = mentionMatch[1];
                deletedByDisplayName = mentionMatch[2].trim();
                
                const deletedByMessage = t.messages?.find((msg: any) => 
                  String(msg.authorId || msg.author_id) === deletedById
                );
                
                if (deletedByMessage) {
                  const userName = deletedByMessage.authorUserName || deletedByMessage.author_user_name || deletedByDisplayName;
                  deletedByUsername = typeof userName === 'string' && userName.includes('#') 
                    ? userName.split('#')[0] 
                    : (userName || deletedByDisplayName);
                } else {
                  deletedByUsername = deletedByDisplayName;
                }
              } else if (deletedByStr.includes('#')) {
                const parts = deletedByStr.split('#');
                deletedByUsername = parts[0] || 'Unknown';
                deletedByDisplayName = deletedByUsername;
                deletedById = parts[1] || '0';
              } else if (deletedByStr.includes('(') && deletedByStr.includes(')')) {
                const nameMatch = deletedByStr.match(/([^(]+)\s*\(([^)]+)\)/);
                if (nameMatch) {
                  deletedByDisplayName = nameMatch[1].trim();
                  deletedByUsername = nameMatch[2].trim();
                } else {
                  deletedByUsername = deletedByStr;
                  deletedByDisplayName = deletedByStr;
                }
              } else {
                deletedByUsername = deletedByStr;
                deletedByDisplayName = deletedByStr;
              }
            }
            
            const firstMessage = t.messages && t.messages.length > 0 ? t.messages[0] : null;
            const channelName = firstMessage?.channelName || firstMessage?.channel_name || `channel-${t.channelId || t.channel_id}`;
            
            const timestampMs = t.timestamp > 1000000000000 ? t.timestamp : t.timestamp * 1000;
            
            return {
              id: String(t.id),
              channelId: t.channelId || t.channel_id || '',
              channelName: channelName,
              deletedBy: {
                id: deletedById,
                username: deletedByUsername,
                displayName: deletedByDisplayName,
                avatar: null
              },
              deletedAt: timestampMs ? new Date(timestampMs).toISOString() : new Date().toISOString(),
              messageCount: t.messagesCount || t.messages_count || (t.messages?.length || 0),
              messages: (t.messages || []).map((msg: any) => {
                const msgTimestamp = msg.createdTimestamp 
                  ? (msg.createdTimestamp > 1000000000000 ? msg.createdTimestamp : msg.createdTimestamp * 1000)
                  : Date.now();
                
                const avatarValue = msg.userAvatar || msg.user_avatar;
                const avatarStr = avatarValue 
                  ? (typeof avatarValue === 'string' ? avatarValue.trim() : String(avatarValue).trim())
                  : null;
                const cleanAvatar = avatarStr && avatarStr !== 'null' && avatarStr !== 'undefined' && avatarStr !== '' 
                  ? avatarStr 
                  : null;
                
                const authorId = String(msg.authorId || msg.author_id || '0');
                const authorName = msg.authorName || msg.author_name || 'Unknown';
                
                return {
                  id: msg.messageId || msg.message_id || String(Math.random()),
                  author: {
                    id: authorId,
                    username: authorName,
                    displayName: authorName,
                    avatar: cleanAvatar,
                    discriminator: msg.authorUserName || msg.author_user_name 
                      ? (typeof (msg.authorUserName || msg.author_user_name) === 'string' && (msg.authorUserName || msg.author_user_name).includes('#')
                          ? (msg.authorUserName || msg.author_user_name).split('#')[1] 
                          : undefined)
                      : undefined
                  },
                  content: msg.content || '',
                  timestamp: new Date(msgTimestamp).toISOString(),
                  attachments: msg.attachments || [],
                  embeds: msg.embeds || [],
                  authorId: authorId,
                  authorName: authorName,
                  authorUserName: msg.authorUserName || msg.author_user_name,
                  mentions: msg.mentions || []
                };
              })
            };
          });
          setTranscripts(transformedTranscripts);
        } else {
          setError(response.message || 'Failed to load transcripts');
          setTranscripts([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        toast.error(`Failed to load transcripts: ${errorMessage}`);
        setTranscripts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (guildId) {
      fetchTranscripts();
    }
  }, [guildId]);

  useEffect(() => {
    if (transcripts.length > 0 && !isModalOpen && urlTranscriptId) {
      const transcript = transcripts.find(t => String(t.id) === String(urlTranscriptId));
      if (transcript) {
        setSelectedTranscript(transcript);
        setIsModalOpen(true);
      }
    }
  }, [transcripts, isModalOpen, urlTranscriptId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleTranscriptClick = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setIsModalOpen(true);
    navigate(`/${guildId}/dashboard/transcripts/${transcript.id}`, { replace: false });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTranscript(null);
    navigate(`/${guildId}/dashboard/transcripts`, { replace: true });
  };

  const copyTranscriptLink = async (transcriptId?: string) => {
    const id = transcriptId || selectedTranscript?.id;
    if (!id) return;
    
    const transcriptUrl = `${window.location.origin}/${guildId}/dashboard/transcripts/${id}`;
    
    try {
      await navigator.clipboard.writeText(transcriptUrl);
      toast.success('Transcript link copied to clipboard!');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = transcriptUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Transcript link copied to clipboard!');
      } catch (fallbackErr) {
        toast.error('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const getAvatarUrl = (userId: string, avatar: string | null) => {
    if (!userId || userId === '0' || !avatar) {
      return null;
    }
    const avatarStr = String(avatar).trim();
    if (!avatarStr || avatarStr === 'null' || avatarStr === 'undefined' || avatarStr === '') {
      return null;
    }
    if (avatarStr.startsWith('http')) {
      return avatarStr;
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarStr}.png`;
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const parseDiscordContent = (text: string, messageData?: any, allMessages?: any[]): (string | JSX.Element)[] => {
    if (!text || typeof text !== 'string') return [text || ''];
    
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let elementKey = 0;
    
    const hex2rgb = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    
    const patterns = [
      {
        regex: /<@!?(\d+)>/g,
        render: (_match: string, userId: string) => {
          let name = 'Unknown';
          
          if (allMessages && allMessages.length > 0) {
            for (const msg of allMessages) {
              const msgAuthorId = String(msg.author?.id || msg.authorId || msg.author_id || '');
              
              if (msgAuthorId === userId && msgAuthorId !== '0' && msgAuthorId !== '') {
                name = msg.author?.displayName || 
                       msg.authorName || 
                       msg.author_name ||
                       msg.author?.username || 
                       msg.displayName ||
                       'Unknown';
                if (name !== 'Unknown') break;
              }
            }
            
            if (name === 'Unknown') {
              for (const msg of allMessages) {
                if (msg.mentions && Array.isArray(msg.mentions)) {
                  for (const mention of msg.mentions) {
                    const mentionId = String(mention.id || mention.userId || mention.user_id || '');
                    if (mentionId === userId && mentionId !== '0' && mentionId !== '') {
                      name = mention.displayName || 
                             mention.name ||
                             mention.username || 
                             mention.userName ||
                             'Unknown';
                      if (name !== 'Unknown') break;
                    }
                  }
                  if (name !== 'Unknown') break;
                }
              }
            }
            
            if (name === 'Unknown') {
              const extractNameFromText = (text: string): string | null => {
                if (!text || typeof text !== 'string') return null;
                const pattern = new RegExp(`<@!?${userId}>\\s*\\(([^)]+)\\)`);
                const match = text.match(pattern);
                if (match && match[1]) {
                  const extractedName = match[1].split('#')[0].trim();
                  return extractedName || null;
                }
                return null;
              };
              
              for (const msg of allMessages) {
                if (msg.content) {
                  const extractedName = extractNameFromText(msg.content);
                  if (extractedName) {
                    name = extractedName;
                    break;
                  }
                }
                
                if (msg.embeds && Array.isArray(msg.embeds)) {
                  for (const embed of msg.embeds) {
                    if (embed.title) {
                      const extractedName = extractNameFromText(embed.title);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (embed.description) {
                      const extractedName = extractNameFromText(embed.description);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (embed.fields && Array.isArray(embed.fields)) {
                      for (const field of embed.fields) {
                        if (field.value) {
                          const extractedName = extractNameFromText(field.value);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                        if (field.name) {
                          const extractedName = extractNameFromText(field.name);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                      }
                      if (name !== 'Unknown') break;
                    }
                    
                    if (embed.footer?.text) {
                      const extractedName = extractNameFromText(embed.footer.text);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (name !== 'Unknown') break;
                  }
                  if (name !== 'Unknown') break;
                }
              }
            }
          }
          
          return (
            <span 
              key={`mention-${elementKey++}`} 
              className="mention user"
              style={{
                background: 'rgba(88, 101, 242, 0.3)',
                color: '#fff',
                padding: '0 3px',
                borderRadius: '3px',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                lineHeight: '1.1',
                cursor: 'pointer',
                transition: 'filter 0.1s',
                textShadow: '0 0 8px rgba(88, 101, 242, 0.4), 0 0 4px rgba(88, 101, 242, 0.6)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              @{name}
            </span>
          );
        }
      },
      {
        regex: /<#(\d+)>/g,
        render: (match: string, channelId: string) => {
          const channelName = messageData?.channelName || messageData?.channel_name || 'unknown';
          
          return (
            <span 
              key={`channel-${elementKey++}`} 
              className="mention channel"
              style={{
                background: 'rgba(88, 101, 242, 0.3)',
                color: '#fff',
                padding: '0 3px',
                borderRadius: '3px',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                lineHeight: '1.1',
                cursor: 'pointer',
                transition: 'filter 0.1s',
                textShadow: '0 0 8px rgba(88, 101, 242, 0.4), 0 0 4px rgba(88, 101, 242, 0.6)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              #{channelName}
            </span>
          );
        }
      },
      {
        regex: /<@&(\d+)>/g,
        render: (_match: string, roleId: string) => {
          let name = 'Unknown Role';
          
          if (allMessages && allMessages.length > 0) {
            const extractRoleNameFromText = (text: string): string | null => {
              if (!text || typeof text !== 'string') return null;
              
              let pattern = new RegExp(`<@&${roleId}>\\s*\\(([^)]+)\\)`);
              let match = text.match(pattern);
              if (match && match[1]) {
                return match[1].trim() || null;
              }
              
              pattern = new RegExp(`<@&${roleId}>\\s+([^<@\\n\\r]+?)(?=\\s*(?:<|$|\\n|\\r|,|;|:))`);
              match = text.match(pattern);
              if (match && match[1]) {
                const extracted = match[1].trim();
                const cleaned = extracted.replace(/[,.;:!?]+$/, '').trim();
                if (cleaned && cleaned.length > 0) {
                  return cleaned;
                }
              }
              
              pattern = new RegExp(`<@&${roleId}>([^<@]*?)(?=<@|$)`, 's');
              match = text.match(pattern);
              if (match && match[1]) {
                const extracted = match[1].trim();
                const cleaned = extracted.replace(/^[\s,;:]+|[\s,;:]+$/g, '').trim();
                if (cleaned && cleaned.length > 0 && cleaned.length < 100) {
                  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
                  if (words.length > 0) {
                    return words.slice(0, 5).join(' ').trim();
                  }
                }
              }
              
              pattern = new RegExp(`(?:Role|role|Role Name|role name)[:：]?\\s*<@&${roleId}>\\s*([^\\n<@]+)`, 'i');
              match = text.match(pattern);
              if (match && match[1]) {
                const extracted = match[1].trim();
                if (extracted && extracted.length > 0) {
                  return extracted.split(/[,\n]/)[0].trim();
                }
              }
              
              return null;
            };
            
            for (const msg of allMessages) {
              if (msg.mentions && msg.mentions.roles && Array.isArray(msg.mentions.roles)) {
                for (const roleMention of msg.mentions.roles) {
                  const mentionRoleId = String(roleMention.id || '');
                  if (mentionRoleId === roleId && mentionRoleId !== '0' && mentionRoleId !== '') {
                    name = roleMention.name || 'Unknown Role';
                    if (name !== 'Unknown Role') break;
                  }
                }
                if (name !== 'Unknown Role') break;
              }
              if (msg.roleMentions && Array.isArray(msg.roleMentions)) {
                for (const roleMention of msg.roleMentions) {
                  const mentionRoleId = String(roleMention.id || roleMention.roleId || roleMention.role_id || '');
                  if (mentionRoleId === roleId && mentionRoleId !== '0' && mentionRoleId !== '') {
                    name = roleMention.name || 
                           roleMention.roleName ||
                           roleMention.role_name ||
                           'Unknown Role';
                    if (name !== 'Unknown Role') break;
                  }
                }
                if (name !== 'Unknown Role') break;
              }
            }
            
            if (name === 'Unknown Role') {
              for (const msg of allMessages) {
                if (msg.content) {
                  const extractedName = extractRoleNameFromText(msg.content);
                  if (extractedName) {
                    name = extractedName;
                    break;
                  }
              }
              
              if (msg.embeds && Array.isArray(msg.embeds)) {
                for (const embed of msg.embeds) {
                  if (embed.fields && Array.isArray(embed.fields)) {
                      for (const field of embed.fields) {
                        const fieldText = `${field.name || ''} ${field.value || ''}`;
                        if (fieldText.includes(`<@&${roleId}>`)) {
                          const extractedName = extractRoleNameFromText(fieldText);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                        if (field.name && field.name.toLowerCase().includes('role') && field.value && field.value.includes(roleId)) {
                          const extractedName = extractRoleNameFromText(field.value);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                      }
                      if (name !== 'Unknown Role') break;
                    }
                    
                    const embedTextParts: string[] = [];
                    if (embed.title) embedTextParts.push(embed.title);
                    if (embed.description) embedTextParts.push(embed.description);
                    if (embed.fields && Array.isArray(embed.fields)) {
                      for (const field of embed.fields) {
                        if (field.name) embedTextParts.push(field.name);
                        if (field.value) embedTextParts.push(field.value);
                      }
                    }
                    if (embed.footer?.text) embedTextParts.push(embed.footer.text);
                    
                    const combinedEmbedText = embedTextParts.join(' ');
                    if (combinedEmbedText) {
                      const extractedName = extractRoleNameFromText(combinedEmbedText);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (embed.title) {
                      const extractedName = extractRoleNameFromText(embed.title);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (embed.description) {
                      const extractedName = extractRoleNameFromText(embed.description);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (embed.fields && Array.isArray(embed.fields)) {
                      for (const field of embed.fields) {
                        if (field.value) {
                          const extractedName = extractRoleNameFromText(field.value);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                        if (field.name) {
                          const extractedName = extractRoleNameFromText(field.name);
                          if (extractedName) {
                            name = extractedName;
                            break;
                          }
                        }
                      }
                      if (name !== 'Unknown Role') break;
                    }
                    
                    if (embed.footer?.text) {
                      const extractedName = extractRoleNameFromText(embed.footer.text);
                      if (extractedName) {
                        name = extractedName;
                        break;
                      }
                    }
                    
                    if (name !== 'Unknown Role') break;
                  }
                  if (name !== 'Unknown Role') break;
                }
              }
            }
          }
          
          return (
            <span 
              key={`role-${elementKey++}`} 
              className="mention role"
              style={{
                background: 'rgba(88, 101, 242, 0.3)',
                color: '#fff',
                padding: '0 3px',
                borderRadius: '3px',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                lineHeight: '1.1',
                cursor: 'pointer',
                transition: 'filter 0.1s',
                textShadow: '0 0 8px rgba(88, 101, 242, 0.4), 0 0 4px rgba(88, 101, 242, 0.6)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              @{name}
            </span>
          );
        }
      },
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/g,
        render: (_match: string, linkText: string, linkUrl: string) => {
          return (
            <a
              key={`markdown-link-${elementKey++}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all"
              style={{
                color: '#00a8ff',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
                e.currentTarget.style.color = '#00d4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
                e.currentTarget.style.color = '#00a8ff';
              }}
            >
              {linkText}
            </a>
          );
        }
      },
      {
        regex: /(https?:\/\/[^\s<>"{}|\\^`\[\]]+(?:[^\s<>"{}|\\^`\[\].,;:!?]|(?:[.,;:!?](?![\s<])))*)/gi,
        render: (match: string) => {
          let url = match.trim();
          url = url.replace(/[.,;:!?]+$/, '');
          return (
            <a
              key={`link-${elementKey++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all"
              style={{
                color: '#00a8ff',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
                e.currentTarget.style.color = '#00d4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
                e.currentTarget.style.color = '#00a8ff';
              }}
            >
              {url}
            </a>
          );
        }
      },
      {
        regex: /(?:^|\s)(www\.[^\s<>"{}|\\^`\[\]]+(?:[^\s<>"{}|\\^`\[\].,;:!?]|(?:[.,;:!?](?![\s<])))*)/gi,
        render: (match: string) => {
          let urlText = match.trim();
          urlText = urlText.replace(/[.,;:!?]+$/, '');
          const url = 'https://' + urlText;
          return (
            <span key={`link-wrapper-${elementKey++}`}>
              {' '}
              <a
                key={`link-${elementKey++}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all"
                style={{
                  color: '#00a8ff',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.color = '#00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = '#00a8ff';
                }}
              >
                {urlText}
              </a>
            </span>
          );
        }
      },
      {
        regex: /<t:(\d+)(?::([FRDfTd]))?>/g,
        render: (match: string, timestamp: string, format: string) => {
          try {
            const date = new Date(parseInt(timestamp) * 1000);
            let formatted: string;
            
            switch (format) {
              case 'R':
                const now = new Date();
                const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
                if (diff < 60) formatted = `${diff} seconds ago`;
                else if (diff < 3600) formatted = `${Math.floor(diff / 60)} minutes ago`;
                else if (diff < 86400) formatted = `${Math.floor(diff / 3600)} hours ago`;
                else if (diff < 2592000) formatted = `${Math.floor(diff / 86400)} days ago`;
                else formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                break;
              case 'D':
                formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                break;
              case 'F':
                formatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + 
                           ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                break;
              case 'T':
                formatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                break;
              default:
                formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
                           ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
            
            return (
              <span 
                key={`timestamp-${elementKey++}`} 
                style={{
                  background: '#32353B',
                  color: '#FFFFFF',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 400,
                  display: 'inline-block',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatted}
              </span>
            );
          } catch {
            return <span key={`timestamp-${elementKey++}`}>{match}</span>;
          }
        }
      }
    ];
    
    const allMatches: Array<{ index: number; match: RegExpMatchArray; pattern: typeof patterns[0] }> = [];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({ index: match.index, match, pattern });
      }
    });
    
    allMatches.sort((a, b) => a.index - b.index);
    
    allMatches.forEach(({ index, match, pattern }) => {
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      const rendered = pattern.render(match[0], match[1], match[2]);
      parts.push(rendered);
      lastIndex = index + match[0].length;
    });
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  return (
    <motion.div
      key="transcripts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <CustomLoader message="Loading transcripts..." size="lg" />
          </div>
        ) : error ? (
          <motion.div
            className="relative bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl p-16 border border-red-200/60 dark:border-red-700/40 text-center overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/10 to-red-500/10 dark:from-red-500/15 dark:via-red-500/15 dark:to-red-500/15 border border-red-200/40 dark:border-red-700/30 shadow-md mb-6">
                <FontAwesomeIcon icon={faMessage} className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3 tracking-tight">Error loading transcripts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                {error}
              </p>
            </div>
          </motion.div>
        ) : transcripts.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3 tracking-tight">No transcripts found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
              Bulk deleted messages will appear here once they are logged by the bot
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {transcripts.map((transcript, index) => (
              <motion.div
                key={transcript.id}
                className="relative overflow-hidden bg-gradient-to-r from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-gray-200/60 dark:border-gray-700/40 hover:border-gray-300/70 dark:hover:border-gray-600/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] transition-all duration-300"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 + index * 0.02, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="md:hidden space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileLines} className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                        #{transcript.channelName}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {transcript.messageCount} {transcript.messageCount === 1 ? 'message' : 'messages'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        Deleted by:
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {transcript.deletedBy.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        Deleted at:
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {formatDate(transcript.deletedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button 
                      onClick={() => handleTranscriptClick(transcript)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100/50 dark:bg-gray-700/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-300/40 dark:border-gray-600/40 flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[44px]"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                      <span>View Transcript</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTranscriptLink(transcript.id);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-gray-100/50 dark:bg-gray-700/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-300/40 dark:border-gray-600/40 flex items-center justify-center cursor-pointer touch-manipulation min-h-[44px] min-w-[44px]"
                      title="Copy transcript link"
                    >
                      <FontAwesomeIcon icon={faCopy} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-5">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faFileLines} className="h-4.5 w-4.5 text-gray-600 dark:text-gray-400" />
                  </div>

                  <div className="flex-shrink-0 w-[1px] h-5 bg-gradient-to-b from-transparent via-gray-300/50 to-transparent dark:via-gray-600/50" />

                  <div className="flex-shrink-0">
                    <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
                      #{transcript.channelName}
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {transcript.messageCount} {transcript.messageCount === 1 ? 'message' : 'messages'} deleted
                    </span>
                  </div>

                  <div className="flex-shrink-0 w-[1px] h-7 bg-gradient-to-b from-transparent via-gray-300/60 to-transparent dark:via-gray-600/60" />

                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">
                      Deleted by
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {transcript.deletedBy.displayName}
                    </span>
                  </div>

                  <div className="flex-shrink-0 w-[1px] h-7 bg-gradient-to-b from-transparent via-gray-300/60 to-transparent dark:via-gray-600/60" />

                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">
                      Deleted at
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {formatDate(transcript.deletedAt)}
                    </span>
                  </div>

                  <div className="flex-1" />

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTranscriptLink(transcript.id);
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-gray-700/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-300/40 dark:border-gray-600/40 flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px]"
                      title="Copy transcript link"
                    >
                      <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleTranscriptClick(transcript)}
                      className="px-4 py-2 rounded-lg bg-gray-100/50 dark:bg-gray-700/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-300/40 dark:border-gray-600/40 flex items-center gap-2 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                      <span>View Transcript</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && selectedTranscript && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-[#36393f] dark:bg-[#2f3136] rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl z-[61] m-2 sm:m-0"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 dark:border-gray-600">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                    #{selectedTranscript.channelName}
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">
                    {selectedTranscript.messageCount} messages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyTranscriptLink()}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-full flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Copy transcript link"
                  >
                    <FontAwesomeIcon icon={faCopy} className="h-5 w-5" />
                  </button>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 p-2 rounded-full flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faX} className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar bg-[#36393f] dark:bg-[#2f3136]">
                {selectedTranscript.messages.map((message, index) => {
                  const avatarUrl = getAvatarUrl(message.author.id, message.author.avatar);
                  const messageDate = new Date(message.timestamp);
                  const showAvatar = index === 0 || 
                    selectedTranscript.messages[index - 1].author.id !== message.author.id ||
                    new Date(selectedTranscript.messages[index - 1].timestamp).getTime() - messageDate.getTime() > 600000;

                  return (
                    <div key={message.id} className="flex items-start space-x-2 sm:space-x-3 group hover:bg-[#40444b] dark:hover:bg-[#36393f] rounded px-2 py-1 -mx-2 transition-colors">
                      {showAvatar ? (
                        <>
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={message.author.username}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs sm:text-sm font-bold">
                                {getInitials(message.author.username)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1 flex-wrap">
                              <span className="font-semibold text-white text-xs sm:text-sm">
                                {message.author.username}
                              </span>
                              {message.author.discriminator && (
                                <span className="text-gray-400 text-[10px] sm:text-xs">
                                  #{message.author.discriminator}
                                </span>
                              )}
                              <span className="text-gray-500 text-[10px] sm:text-xs">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                              {parseDiscordContent(message.content || '', { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                <span key={i}>{part}</span>
                              ))}
                            </p>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment: any, idx: number) => (
                                  <AttachmentDisplay key={idx} attachment={attachment} idx={idx} />
                                ))}
                              </div>
                            )}
                            
                            {message.embeds && message.embeds.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.embeds.map((embed: any, idx: number) => {
                                  const embedColor = embed.color 
                                    ? `#${embed.color.toString(16).padStart(6, '0')}` 
                                    : '#5865F2';
                                  const hasThumb = !!embed.thumbnail?.url;
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className="mt-2 border-l-4 rounded overflow-hidden"
                                      style={{ 
                                        borderLeftColor: embedColor,
                                        backgroundColor: '#2b2d31',
                                        padding: '12px 12px 12px 16px',
                                        maxWidth: '500px',
                                        width: '100%',
                                        position: 'relative',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word'
                                      }}
                                    >
                                      {embed.author && (
                                        <div className="flex items-center gap-2 mb-1 min-w-0">
                                          {embed.author.icon_url && (
                                            <img 
                                              src={embed.author.icon_url} 
                                              alt="Author icon"
                                              className="h-5 w-5 rounded-full flex-shrink-0"
                                            />
                                          )}
                                          {embed.author.name && (
                                            <span className="text-white text-sm font-semibold break-words overflow-wrap-anywhere min-w-0">
                                              {embed.author.url ? (
                                                <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-words">
                                                  {embed.author.name}
                                                </a>
                                              ) : (
                                                embed.author.name
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {embed.title && (
                                        <div className="text-white text-sm font-semibold mb-1 break-words overflow-wrap-anywhere">
                                          {embed.url ? (
                                            <a href={embed.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-words">
                                              {parseDiscordContent(embed.title, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                <span key={i}>{part}</span>
                                              ))}
                                            </a>
                                          ) : (
                                            <>{parseDiscordContent(embed.title, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                              <span key={i}>{part}</span>
                                            ))}</>
                                          )}
                                        </div>
                                      )}
                                      
                                      {embed.description && (
                                        <div className="text-[#dbdee1] text-sm whitespace-pre-wrap leading-[1.4] break-words overflow-wrap-anywhere">
                                          {parseDiscordContent(embed.description, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                            <span key={i}>{part}</span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {embed.fields && embed.fields.length > 0 && (
                                        <div className="mt-1.5">
                                          {embed.fields.map((field: any, fieldIdx: number) => (
                                            <div key={fieldIdx} className="mt-1.5">
                                              {field.name && (
                                                <div className="text-[#dbdee1] text-sm font-semibold break-words overflow-wrap-anywhere">
                                                  {parseDiscordContent(field.name, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                    <span key={i}>{part}</span>
                                                  ))}
                                                </div>
                                              )}
                                              {field.value && (
                                                <div className="text-[#dbdee1] text-sm whitespace-pre-wrap leading-[1.4] break-words overflow-wrap-anywhere">
                                                  {parseDiscordContent(field.value, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                    <span key={i}>{part}</span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {embed.thumbnail && embed.thumbnail.url && (
                                        <img 
                                          src={embed.thumbnail.url} 
                                          alt="Embed thumbnail"
                                          className="absolute top-3 right-3 max-w-[80px] max-h-[80px] rounded"
                                          style={{ position: 'absolute', top: '12px', right: '12px' }}
                                          loading="lazy"
                                        />
                                      )}
                                      
                                      {embed.image && embed.image.url && (
                                        <div className="mt-2">
                                          <img 
                                            src={embed.image.url} 
                                            alt="Embed image"
                                            className="max-w-full rounded"
                                            loading="lazy"
                                          />
                                        </div>
                                      )}
                                      
                                      {(embed.footer || embed.timestamp) && (
                                        <div className="text-[#b5bac1] text-xs mt-2 flex items-center gap-1 flex-wrap break-words overflow-wrap-anywhere">
                                          {embed.footer?.icon_url && (
                                            <img 
                                              src={embed.footer.icon_url} 
                                              alt="Footer icon"
                                              className="h-4 w-4 rounded-full flex-shrink-0"
                                            />
                                          )}
                                          {embed.footer?.text && (
                                            <span className="break-words overflow-wrap-anywhere">
                                              {parseDiscordContent(embed.footer.text, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                <span key={i}>{part}</span>
                                              ))}
                                            </span>
                                          )}
                                          {embed.footer?.text && embed.timestamp && (
                                            <span className="flex-shrink-0">•</span>
                                          )}
                                          {embed.timestamp && (
                                            <span className="break-words overflow-wrap-anywhere">
                                              {new Date(embed.timestamp).toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 min-w-0 ml-[36px] sm:ml-[52px]">
                          <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {parseDiscordContent(message.content || '', { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                              <span key={i}>{part}</span>
                            ))}
                          </p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment: any, idx: number) => (
                                <AttachmentDisplay key={idx} attachment={attachment} idx={idx} />
                              ))}
                            </div>
                          )}
                          
                          {message.embeds && message.embeds.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.embeds.map((embed: any, idx: number) => {
                                const embedColor = embed.color 
                                  ? `#${embed.color.toString(16).padStart(6, '0')}` 
                                  : '#5865F2';
                                const hasThumb = !!embed.thumbnail?.url;
                                
                                return (
                                  <div 
                                    key={idx} 
                                    className="mt-2 border-l-4 rounded overflow-hidden"
                                    style={{ 
                                      borderLeftColor: embedColor,
                                      backgroundColor: '#2b2d31',
                                      padding: '12px 12px 12px 16px',
                                      maxWidth: '500px',
                                      width: '100%',
                                      position: 'relative',
                                      paddingRight: hasThumb ? '104px' : '12px',
                                      wordWrap: 'break-word',
                                      overflowWrap: 'break-word'
                                    }}
                                  >
                                    {embed.author && (
                                      <div className="flex items-center gap-2 mb-1 min-w-0">
                                        {embed.author.icon_url && (
                                          <img 
                                            src={embed.author.icon_url} 
                                            alt="Author icon"
                                            className="h-5 w-5 rounded-full flex-shrink-0"
                                          />
                                        )}
                                        {embed.author.name && (
                                          <span className="text-white text-sm font-semibold break-words overflow-wrap-anywhere min-w-0">
                                            {embed.author.url ? (
                                              <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-words">
                                                {embed.author.name}
                                              </a>
                                            ) : (
                                              embed.author.name
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {embed.title && (
                                      <div className="text-white text-sm font-semibold mb-1 break-words overflow-wrap-anywhere">
                                        {embed.url ? (
                                          <a href={embed.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-words">
                                            {parseDiscordContent(embed.title, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                              <span key={i}>{part}</span>
                                            ))}
                                          </a>
                                        ) : (
                                          <>{parseDiscordContent(embed.title, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                            <span key={i}>{part}</span>
                                          ))}</>
                                        )}
                                      </div>
                                    )}
                                    
                                    {embed.description && (
                                      <div className="text-[#dbdee1] text-sm whitespace-pre-wrap leading-[1.4] break-words overflow-wrap-anywhere">
                                        {parseDiscordContent(embed.description, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                          <span key={i}>{part}</span>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {embed.fields && embed.fields.length > 0 && (
                                      <div className="mt-1.5">
                                        {embed.fields.map((field: any, fieldIdx: number) => (
                                          <div key={fieldIdx} className="mt-1.5">
                                            {field.name && (
                                              <div className="text-[#dbdee1] text-sm font-semibold break-words overflow-wrap-anywhere">
                                                {parseDiscordContent(field.name, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                  <span key={i}>{part}</span>
                                                ))}
                                              </div>
                                            )}
                                            {field.value && (
                                              <div className="text-[#dbdee1] text-sm whitespace-pre-wrap leading-[1.4] break-words overflow-wrap-anywhere">
                                                {parseDiscordContent(field.value, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                                  <span key={i}>{part}</span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {embed.thumbnail && embed.thumbnail.url && (
                                      <img 
                                        src={embed.thumbnail.url} 
                                        alt="Embed thumbnail"
                                        className="rounded"
                                        style={{ position: 'absolute', top: '12px', right: '12px', maxWidth: '80px', maxHeight: '80px' }}
                                        loading="lazy"
                                      />
                                    )}
                                    
                                    {embed.image && embed.image.url && (
                                      <div className="mt-2">
                                        <img 
                                          src={embed.image.url} 
                                          alt="Embed image"
                                          className="max-w-full rounded"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}
                                    
                                    {(embed.footer || embed.timestamp) && (
                                      <div className="text-[#b5bac1] text-xs mt-2 flex items-center gap-1 flex-wrap break-words overflow-wrap-anywhere">
                                        {embed.footer?.icon_url && (
                                          <img 
                                            src={embed.footer.icon_url} 
                                            alt="Footer icon"
                                            className="h-4 w-4 rounded-full flex-shrink-0"
                                          />
                                        )}
                                        {embed.footer?.text && (
                                          <span className="break-words overflow-wrap-anywhere">
                                            {parseDiscordContent(embed.footer.text, { ...message, channelName: selectedTranscript.channelName }, selectedTranscript.messages).map((part, i) => (
                                              <span key={i}>{part}</span>
                                            ))}
                                          </span>
                                        )}
                                        {embed.footer?.text && embed.timestamp && (
                                          <span className="flex-shrink-0">•</span>
                                        )}
                                        {embed.timestamp && (
                                          <span className="break-words overflow-wrap-anywhere">
                                            {new Date(embed.timestamp).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-700 dark:border-gray-600 bg-[#36393f] dark:bg-[#2f3136]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">Deleted by {selectedTranscript.deletedBy.displayName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">{formatDate(selectedTranscript.deletedAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


