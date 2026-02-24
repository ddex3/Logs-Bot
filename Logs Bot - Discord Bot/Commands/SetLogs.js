const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

function logsFor(c){
  switch(c){
    case'index':return[]
    case'member':return['Member Joined','Member Left','Member Updated','Nickname Changed']
    case'user':return['Username Changed','Avatar Changed']
    case'moderation':return['Member Banned','Ban Removed','Timeout Applied','Timeout Removed', 'Member Kicked', 'Presence Updated','Permission Overwrites Changed','Bot Added to Server','Bot Removed from Server']
    case'role':return['Role Created','Role Deleted','Role Updated']
    case'channel':return['Channel Created','Channel Deleted','Channel Updated','Thread Created','Thread Updated','Thread Deleted','AFK Channel Changed','System Messages Channel Changed']
    case'message':return['Message Sent','Message Edited','Message Deleted','Bulk Message Deleted']
    case'invite':return['Invite Created','Invite Deleted']
    case'voice':return['Voice State Updated','Started Streaming','Stopped Streaming','Started Video','Stopped Video','Self Muted','Self Unmuted','Self Deafened','Self Undeafened', 'Server Muted', 'Server Unmuted', 'Server Deafened', 'Server Undeafened', 'Server Deafened', 'Server Undeafened']
    case'webhook':return['Webhook Updated','Stage Started','Stage Updated','Stage Ended']
    case'scheduled':return['Scheduled Event Created','Scheduled Event Updated','Scheduled Event Deleted','Scheduled Event Started','Scheduled Event Ended','Event Subscription Added','Event Subscription Removed']
    case'emoji':return['Emoji Created','Emoji Updated','Emoji Deleted','Sticker Created','Sticker Updated','Sticker Deleted']
    case'nitro':return['Server Boosted','Server Boost Removed','Boost Tier Changed']
    default:return[]
  }
}

const data=new SlashCommandBuilder().setName('set-logs').setDescription('Assign log types to channels')
;[['member','Member Logs'],['user','User Logs'],['moderation','Moderation & Security Logs'],['role','Role Logs'],['channel','Channel Logs'],['message','Message Logs'],['invite','Invite Logs'],['voice','Voice Logs'],['webhook','Webhook & Stage Logs'],['scheduled','Scheduled Event Logs'],['emoji','Emoji & Sticker Logs'],['nitro','Nitro & Boost Logs']].forEach(([k,d])=>{
  data.addSubcommand(s=>
    s.setName(k).setDescription(d)
      .addStringOption(o=>{
        const opt=o.setName('log').setDescription('Log type').setRequired(true)
        logsFor(k).forEach(l=>opt.addChoices({name:l,value:l}))
        return opt
      })
      .addChannelOption(o=>o.setName('channel').setDescription('Target channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
  )
})

const dbPath=path.join(__dirname,'..','Data','logsChannels.db')
if(!fs.existsSync(path.dirname(dbPath)))fs.mkdirSync(path.dirname(dbPath),{recursive:true})
const db=new sqlite3.Database(dbPath)
db.run('CREATE TABLE IF NOT EXISTS logs_channels (guild_id TEXT, log TEXT, channel_id TEXT, PRIMARY KEY (guild_id, log))')

module.exports={
  data,
  async execute(i){
    if(!i.memberPermissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({embeds:[new EmbedBuilder().setDescription('You must have **Administrator** permission to use this command.').setColor('#f25252')],ephemeral:true})
    const sub=i.options.getSubcommand()
    const logType=i.options.getString('log')
    const channel=i.options.getChannel('channel')
    if(!logsFor(sub).includes(logType))return i.reply({content:'Invalid log type for this category.',ephemeral:true})
    if(![ChannelType.GuildText,ChannelType.GuildAnnouncement].includes(channel.type))return i.reply({content:'Unsupported channel type.',ephemeral:true})
    db.get('SELECT channel_id FROM logs_channels WHERE guild_id=? AND log=?',[i.guildId,logType],(e,row)=>{
      if(row&&row.channel_id===channel.id)return i.reply({embeds:[new EmbedBuilder().setDescription('This log type is already assigned to that channel.').setColor('#f25252')],ephemeral:true})
      db.run('INSERT OR REPLACE INTO logs_channels (guild_id, log, channel_id) VALUES (?,?,?)',[i.guildId,logType,channel.id])
      i.reply({embeds:[new EmbedBuilder().setDescription(`Log **${logType}** will now be sent to ${channel}.`).setColor('#67e68d')],ephemeral:true})
    })
  }
}
