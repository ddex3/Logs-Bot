import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faFileExport, 
  faFileCode, 
  faFileCsv, 
  faDatabase, 
  faClock, 
  faCalendar,
  faServer,
  faCheckCircle,
  faSpinner,
  faCircleInfo,
  faGear,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import CustomLoader from '../components/CustomLoader';
import DateRangeDropdown from '../components/DateRangeDropdown';
import { discordApi } from '../services/api';
import toast from 'react-hot-toast';

interface ExportOptions {
  format: 'json' | 'csv';
  dateRange: '7d' | '30d' | '90d' | 'all' | '';
  logType: 'all' | 'message' | 'member' | 'voice' | 'moderation' | '';
  includeSettings: boolean;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  lastBackup?: string;
}

export default function Export() {
  const { user, guilds, isLoading } = useAuth();
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: '',
    logType: '',
    includeSettings: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState<BackupSchedule>({
    enabled: false,
    frequency: 'weekly',
    time: '02:00'
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  useEffect(() => {
    if (guilds.length > 0 && !selectedGuild) {
      const botPresentGuild = guilds.find(g => g.botPresent);
      if (botPresentGuild) {
        setSelectedGuild(botPresentGuild.id);
      }
    }
  }, [guilds, selectedGuild]);

  const handleExport = async () => {
    if (!selectedGuild) {
      toast.error('Please select a server');
      return;
    }

    if (!exportOptions.dateRange) {
      toast.error('Please select a date range');
      return;
    }

    if (!exportOptions.logType) {
      toast.error('Please select a log category');
      return;
    }

    setIsExporting(true);
    try {
      const result = await discordApi.exportLogs(
        selectedGuild,
        exportOptions.format,
        exportOptions.dateRange,
        exportOptions.logType,
        exportOptions.includeSettings
      );

      if (result.success) {
        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
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

  const handleBackupSettings = async () => {
    if (!selectedGuild) {
      toast.error('Please select a server');
      return;
    }

    setIsExporting(true);
    try {
      const result = await discordApi.backupSettings(selectedGuild);
      
      if (result.success) {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Settings backed up successfully');
      } else {
        toast.error(result.message || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to backup settings');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedGuild) {
      toast.error('Please select a server');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const result = await discordApi.saveBackupSchedule(selectedGuild, backupSchedule);
      
      if (result.success) {
        setBackupSchedule(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
        toast.success('Backup schedule saved successfully');
      } else {
        toast.error(result.message || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Schedule save error:', error);
      toast.error('Failed to save backup schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CustomLoader message="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Please log in to export logs.</p>
        </motion.div>
      </div>
    );
  }

  const botPresentGuilds = guilds.filter(g => g.botPresent);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Export & Backup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export your logs and backup your settings
          </p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <FontAwesomeIcon icon={faServer} className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Server</h2>
          </div>
          <select
            value={selectedGuild}
            onChange={(e) => setSelectedGuild(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a server...</option>
            {botPresentGuilds.map(guild => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
          {botPresentGuilds.length === 0 && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No servers with bot active found
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <FontAwesomeIcon icon={faFileExport} className="h-5 w-5" style={{ color: '#4f46e5' }} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Logs</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Export your server logs in various formats for analysis, backup, and archival purposes. Select your preferred format, date range, and log types to create a customized export.
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
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={exportOptions.format === format.value ? { borderColor: '#4f46e5' } : {}}
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
                Log Type
              </label>
              <select
                value={exportOptions.logType}
                onChange={(e) => setExportOptions(prev => ({ ...prev, logType: e.target.value as any }))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#4f46e5')}
              >
                <option value="">Select log category...</option>
                <option value="all">All logs</option>
                <option value="message">Messages</option>
                <option value="member">Members</option>
                <option value="voice">Voice</option>
                <option value="moderation">Moderation</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSettings}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                  className="w-5 h-5 rounded focus:ring-2"
                  style={{ accentColor: '#4f46e5' }}
                  onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', '#4f46e5')}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include server settings in export
                </span>
              </label>
            </div>

            <motion.button
              onClick={handleExport}
              disabled={!selectedGuild || !exportOptions.dateRange || !exportOptions.logType || isExporting}
              className="w-full px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 hover:opacity-90"
              style={{ backgroundColor: '#4f46e5' }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <FontAwesomeIcon icon={faDatabase} className="h-5 w-5" style={{ color: '#4f46e5' }} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backup Settings</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Download a backup of your server's logging configuration and settings.
            </p>

            <motion.button
              onClick={handleBackupSettings}
              disabled={!selectedGuild || isExporting}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mb-6"
            >
              {isExporting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="h-5 w-5" />
                  <span>Download Settings Backup</span>
                </>
              )}
            </motion.button>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <div className="flex items-center space-x-3 mb-4">
                <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automatic Backup</h3>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupSchedule.enabled}
                    onChange={(e) => setBackupSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable automatic backups
                  </span>
                </label>
              </div>

              {backupSchedule.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frequency
                    </label>
                    <select
                      value={backupSchedule.frequency}
                      onChange={(e) => setBackupSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={backupSchedule.time}
                      onChange={(e) => setBackupSchedule(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {backupSchedule.lastBackup && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-500" />
                      <span>Last backup: {new Date(backupSchedule.lastBackup).toLocaleString()}</span>
                    </div>
                  )}

                  <motion.button
                    onClick={handleSaveSchedule}
                    disabled={isSavingSchedule}
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSavingSchedule ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                        <span>Save Schedule</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon icon={faCircleInfo} className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Export Information
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• JSON format includes all log data in structured format</li>
                <li>• CSV format is optimized for spreadsheet applications</li>
                <li>• Settings backup includes all logging channel configurations</li>
                <li>• Automatic backups are stored securely and can be restored later</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

