import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faFileExport, 
  faFileCode, 
  faFileCsv, 
  faDatabase, 
  faCalendar,
  faSpinner,
  faCircleInfo,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import DateRangeDropdown from './DateRangeDropdown';
import { discordApi } from '../services/api';
import toast from 'react-hot-toast';

interface ExportTabProps {
  guildId: string;
  guild: any;
}

interface ExportOptions {
  format: 'json' | 'csv';
  dateRange: '7d' | '30d' | '90d' | 'all' | '';
  logTypes: string[];
  includeSettings: boolean;
  includeAuditLog: boolean;
}

const LOG_CATEGORIES = [
  { id: 'member', name: 'Member Activity', description: 'Joins, leaves, updates, nickname changes' },
  { id: 'user', name: 'User Changes', description: 'Username and avatar updates' },
  { id: 'moderation', name: 'Moderation Actions', description: 'Bans, kicks, timeouts, permission changes' },
  { id: 'role', name: 'Role Management', description: 'Role creation, deletion, and updates' },
  { id: 'channel', name: 'Channel Events', description: 'Channel/thread creation, updates, deletions' },
  { id: 'message', name: 'Message Activity', description: 'Sent, edited, deleted, and bulk deletions' },
  { id: 'invite', name: 'Invite Tracking', description: 'Invite creation and deletion with usage tracking' },
  { id: 'voice', name: 'Voice Activity', description: 'Voice state changes, streaming, muting, deafening' },
  { id: 'webhook_stage', name: 'Webhook & Stage Events', description: 'Webhook updates and stage channel events' },
  { id: 'scheduled_event', name: 'Scheduled Events', description: 'Event lifecycle and subscription tracking' },
  { id: 'emoji_sticker', name: 'Emoji & Stickers', description: 'Creation, updates, and deletions' },
  { id: 'nitro_boost', name: 'Nitro & Boosts', description: 'Server boost events and tier changes' }
];

export default function ExportTab({ guildId }: ExportTabProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: '',
    logTypes: [],
    includeSettings: true,
    includeAuditLog: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [settingsBackupFormat, setSettingsBackupFormat] = useState<'json' | 'csv'>('json');
  const [auditLogBackupFormat, setAuditLogBackupFormat] = useState<'json' | 'csv'>('json');

  const handleExport = async () => {
    if (exportOptions.logTypes.length === 0) {
      toast.error('Please select at least one log category');
      return;
    }

    if (!exportOptions.dateRange) {
      toast.error('Please select a date range');
      return;
    }

    setIsExporting(true);
    try {
      const result = await discordApi.exportLogs(
        guildId,
        exportOptions.format,
        exportOptions.dateRange,
        exportOptions.logTypes,
        exportOptions.includeSettings,
        exportOptions.includeAuditLog
      );

      if (result.success) {
        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `logs-export-${guildId}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Exported successfully as ${exportOptions.format.toUpperCase()}`);
      } else {
        toast.error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  const [isBackingUpSettings, setIsBackingUpSettings] = useState(false);
  const [isBackingUpAuditLog, setIsBackingUpAuditLog] = useState(false);

  const handleBackupSettings = async () => {
    setIsBackingUpSettings(true);
    try {
      const result = await discordApi.backupSettings(guildId, settingsBackupFormat);
      
      if (result.success) {
        const blob = result.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `server-settings-${guildId}-${new Date().toISOString().split('T')[0]}.${settingsBackupFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Server settings backed up successfully');
      } else {
        toast.error(result.message || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to backup settings');
    } finally {
      setIsBackingUpSettings(false);
    }
  };

  const handleBackupAuditLog = async () => {
    setIsBackingUpAuditLog(true);
    try {
      const result = await discordApi.backupAuditLog(guildId, auditLogBackupFormat);
      
      if (result.success) {
        const blob = result.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `audit-log-${guildId}-${new Date().toISOString().split('T')[0]}.${auditLogBackupFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Audit log backed up successfully');
      } else {
        toast.error(result.message || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to backup audit log');
    } finally {
      setIsBackingUpAuditLog(false);
    }
  };


  return (
    <motion.div
      key="export"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <FontAwesomeIcon icon={faFileExport} className="h-5 w-5" style={{ color: '#93c5fd' }} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Logs</h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Export your server logs in various formats for analysis, backup, and archival purposes. Select your preferred format, date range, and log categories to create a customized export.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'json', icon: faFileCode, label: 'JSON', color: 'text-yellow-600 dark:text-yellow-400' },
                { value: 'csv', icon: faFileCsv, label: 'CSV', color: 'text-green-600 dark:text-green-400' }
              ].map(format => (
                <motion.button
                  key={format.value}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportOptions.format === format.value
                      ? ''
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={exportOptions.format === format.value ? { borderColor: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)' } : {}}
                >
                  <FontAwesomeIcon icon={format.icon} className={`h-6 w-6 ${format.color} mb-2`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{format.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mr-2" />
              Date Range
            </label>
            <DateRangeDropdown
              value={exportOptions.dateRange}
              onChange={(value) => setExportOptions(prev => ({ ...prev, dateRange: value }))}
              placeholder="Select date range..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <FontAwesomeIcon icon={faFilter} className="h-4 w-4 mr-2" />
              Log Categories
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
              <div className="mb-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={exportOptions.logTypes.length === LOG_CATEGORIES.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportOptions(prev => ({ ...prev, logTypes: LOG_CATEGORIES.map(cat => cat.id) }));
                        } else {
                          setExportOptions(prev => ({ ...prev, logTypes: [] }));
                        }
                      }}
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-all duration-200 appearance-none relative"
                      style={{
                        backgroundColor: exportOptions.logTypes.length === LOG_CATEGORIES.length ? '#93c5fd' : 'transparent',
                        borderColor: exportOptions.logTypes.length === LOG_CATEGORIES.length ? '#93c5fd' : undefined
                      }}
                      onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#93c5fd')}
                    />
                    {exportOptions.logTypes.length === LOG_CATEGORIES.length && (
                      <motion.svg 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 m-auto w-2.5 h-2.5 pointer-events-none" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          d="M13.5 4L6 11.5L2.5 8" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="drop-shadow-sm"
                        />
                      </motion.svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Select All</span>
                </label>
              </div>
              <div className="space-y-2">
                {LOG_CATEGORIES.map((category) => (
                  <label key={category.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 rounded p-2 -mx-2 transition-colors">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={exportOptions.logTypes.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions(prev => ({ ...prev, logTypes: [...prev.logTypes, category.id] }));
                          } else {
                            setExportOptions(prev => ({ ...prev, logTypes: prev.logTypes.filter(id => id !== category.id) }));
                          }
                        }}
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-all duration-200 appearance-none relative"
                        style={{
                          backgroundColor: exportOptions.logTypes.includes(category.id) ? '#93c5fd' : 'transparent',
                          borderColor: exportOptions.logTypes.includes(category.id) ? '#93c5fd' : undefined
                        }}
                        onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#93c5fd')}
                      />
                      {exportOptions.logTypes.includes(category.id) && (
                        <motion.svg 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute inset-0 m-auto w-2.5 h-2.5 pointer-events-none" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M13.5 4L6 11.5L2.5 8" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                          />
                        </motion.svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {exportOptions.logTypes.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Please select at least one category to export
              </p>
            )}
          </div>

          <div className="mb-6 flex items-center space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSettings}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-all duration-200 appearance-none relative"
                  style={{
                    backgroundColor: exportOptions.includeSettings ? '#93c5fd' : 'transparent',
                    borderColor: exportOptions.includeSettings ? '#93c5fd' : undefined
                  }}
                  onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#93c5fd')}
                />
                {exportOptions.includeSettings && (
                  <motion.svg 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 m-auto w-3 h-3 pointer-events-none" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M13.5 4L6 11.5L2.5 8" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="drop-shadow-sm"
                    />
                  </motion.svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include server settings in export
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAuditLog}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeAuditLog: e.target.checked }))}
                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-all duration-200 appearance-none relative"
                  style={{
                    backgroundColor: exportOptions.includeAuditLog ? '#93c5fd' : 'transparent',
                    borderColor: exportOptions.includeAuditLog ? '#93c5fd' : undefined
                  }}
                  onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#93c5fd')}
                />
                {exportOptions.includeAuditLog && (
                  <motion.svg 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 m-auto w-3 h-3 pointer-events-none" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M13.5 4L6 11.5L2.5 8" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="drop-shadow-sm"
                    />
                  </motion.svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include Audit Log in export
              </span>
            </label>
          </div>

          <motion.button
            onClick={handleExport}
            disabled={!exportOptions.dateRange || isExporting}
            className="w-full px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 hover:opacity-90"
            style={{ backgroundColor: '#60a5fa' }}
          >
            {isExporting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="h-5 w-5" />
                <span>Export Logs</span>
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <FontAwesomeIcon icon={faDatabase} className="h-5 w-5" style={{ color: '#93c5fd' }} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Server Settings Backup</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download a backup of your server's logging configuration and settings.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'json', icon: faFileCode, label: 'JSON', color: 'text-yellow-600 dark:text-yellow-400' },
                  { value: 'csv', icon: faFileCsv, label: 'CSV', color: 'text-green-600 dark:text-green-400' }
                ].map(format => (
                  <motion.button
                    key={format.value}
                    onClick={() => setSettingsBackupFormat(format.value as 'json' | 'csv')}
                    disabled={isBackingUpSettings || isBackingUpAuditLog}
                    className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                      settingsBackupFormat === format.value
                        ? ''
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={settingsBackupFormat === format.value ? { borderColor: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)', color: '#93c5fd' } : {}}
                  >
                    <FontAwesomeIcon icon={format.icon} className={`h-4 w-4 ${format.color}`} />
                    <span className="text-xs font-medium">{format.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={handleBackupSettings}
              disabled={isBackingUpSettings || isBackingUpAuditLog}
              className="w-full px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 hover:opacity-90"
              style={{ backgroundColor: '#60a5fa' }}
            >
              {isBackingUpSettings ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="h-5 w-5" />
                  <span>Download Server Settings</span>
                </>
              )}
            </motion.button>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Format Information
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• JSON format includes all log data in structured format</li>
                    <li>• CSV format is optimized for spreadsheet applications</li>
                    <li>• Settings backup includes all logging channel configurations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mb-8"></div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <FontAwesomeIcon icon={faDatabase} className="h-5 w-5" style={{ color: '#93c5fd' }} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Log Backup</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download a backup of all audit log entries (user actions and settings changes).
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'json', icon: faFileCode, label: 'JSON', color: 'text-yellow-600 dark:text-yellow-400' },
                  { value: 'csv', icon: faFileCsv, label: 'CSV', color: 'text-green-600 dark:text-green-400' }
                ].map(format => (
                  <motion.button
                    key={format.value}
                    onClick={() => setAuditLogBackupFormat(format.value as 'json' | 'csv')}
                    disabled={isBackingUpSettings || isBackingUpAuditLog}
                    className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                      auditLogBackupFormat === format.value
                        ? ''
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={auditLogBackupFormat === format.value ? { borderColor: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)', color: '#93c5fd' } : {}}
                  >
                    <FontAwesomeIcon icon={format.icon} className={`h-4 w-4 ${format.color}`} />
                    <span className="text-xs font-medium">{format.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={handleBackupAuditLog}
              disabled={isBackingUpSettings || isBackingUpAuditLog}
              className="w-full px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 hover:opacity-90"
              style={{ backgroundColor: '#60a5fa' }}
            >
              {isBackingUpAuditLog ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="h-5 w-5" />
                  <span>Download Audit Log</span>
                </>
              )}
            </motion.button>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Format Information
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• JSON format includes all log data in structured format</li>
                    <li>• CSV format is optimized for spreadsheet applications</li>
                    <li>• Settings backup includes all logging channel configurations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

