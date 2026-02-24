import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { promisify } from 'util';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'BulkMessagesLogs.db');

const gunzip = promisify(zlib.gunzip);

const getDb = () => new sqlite3.Database(dbPath);

const dbQueryAll = (db: sqlite3.Database, query: string, params: any[]): Promise<any[]> =>
  new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

const decodeTranscript = async (base64Data: string): Promise<any> => {
  const buffer = Buffer.from(base64Data, 'base64');
  const decompressed = await gunzip(buffer);
  return JSON.parse(decompressed.toString('utf-8'));
};

const sanitizeMessage = (msg: any) => ({
  messageId: msg.message_id,
  authorName: msg.authorName,
  authorUserName: msg.authorUserName,
  authorId: msg.authorId,
  createdTimestamp: msg.createdTimestamp,
  channelId: msg.channel_id,
  channelName: msg.channel_name,
  guildId: msg.guild_id,
  userAvatar: msg.user_avatar,
  userRoleColor: msg.user_role_color,
  content: msg.content || null,
  editedTimestamp: msg.editedTimestamp || null,
  pinned: msg.pinned || false,
  attachments: msg.attachments || [],
  embeds: msg.embeds || [],
  reactions: msg.reactions || [],
  mentions: msg.mentions || []
});

router.get('/transcripts', async (req: Request, res: Response) => {
  const { guild_id, channel_id, limit = '50', offset = '0' } = req.query;
  
  const db = getDb();
  
  try {
    let query = 'SELECT id, guild_id, channel_id, timestamp, messages_count, deleted_by, transcript_base64 FROM transcripts WHERE 1=1';
    const params: any[] = [];
    
    if (guild_id) {
      query += ' AND guild_id = ?';
      params.push(guild_id);
    }
    
    if (channel_id) {
      query += ' AND channel_id = ?';
      params.push(channel_id);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));
    
    const rows = await dbQueryAll(db, query, params);
    
    const transcripts = await Promise.all(
      rows.map(async (row) => {
        if (!row.transcript_base64) {
          return {
            id: row.id,
            guildId: row.guild_id,
            channelId: row.channel_id,
            timestamp: row.timestamp,
            messagesCount: row.messages_count,
            deletedBy: row.deleted_by,
            messages: []
          };
        }
        
        try {
          const decoded = await decodeTranscript(row.transcript_base64);
          return {
            id: row.id,
            guildId: row.guild_id,
            channelId: row.channel_id,
            timestamp: row.timestamp,
            messagesCount: decoded.messagesCount || row.messages_count,
            deletedBy: row.deleted_by,
            messages: (decoded.messages || []).map(sanitizeMessage)
          };
        } catch (error) {
          return {
            id: row.id,
            guildId: row.guild_id,
            channelId: row.channel_id,
            timestamp: row.timestamp,
            messagesCount: row.messages_count,
            deletedBy: row.deleted_by,
            messages: [],
            error: 'Failed to decode transcript'
          };
        }
      })
    );
    
    res.json({
      success: true,
      transcripts,
      count: transcripts.length,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transcripts'
    });
  } finally {
    db.close();
  }
});

export default router;
