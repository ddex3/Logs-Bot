import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import backend from './backend.js';
const app = express();
const PORT = config.PORT;
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));  
app.use(express.json());
app.use('/api', backend);
app.get('/', (req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
  const date = new Date(timestamp);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Server Status - Logs Bot</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
        }
      </script>
      <style>
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      </style>
    </head>
    <body class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div class="max-w-2xl w-full space-y-4 fade-in">
        <div class="relative overflow-hidden bg-gradient-to-r from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-gray-200/60 dark:border-gray-700/40 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] text-center">
          <div class="mb-8">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50/50 dark:bg-green-900/10 border border-green-200/30 dark:border-green-800/20 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500/80 dark:bg-green-400/80"></div>
              <span class="text-xs font-medium text-green-700/80 dark:text-green-400/80 tracking-wide">Status: OK</span>
            </div>
            <div class="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
           
              <span class="text-sm font-medium font-mono">api.logsbot.com</span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div class="relative overflow-hidden bg-gradient-to-r from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-lg p-5 border border-gray-200/60 dark:border-gray-700/40 hover:border-gray-300/70 dark:hover:border-gray-600/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col items-center justify-center">
              <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em] mb-3">
                Current Time
              </div>
              <div class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 font-mono text-center leading-tight">
                <div id="current-time-display" class="whitespace-nowrap">${hours}:${minutes}:${seconds}</div>
              </div>
            </div>
            
            <div class="relative overflow-hidden bg-gradient-to-r from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-lg p-5 border border-gray-200/60 dark:border-gray-700/40 hover:border-gray-300/70 dark:hover:border-gray-600/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] transition-all duration-300">
              <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em] mb-2">
                Uptime
              </div>
              <div id="uptime-display" class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-50 font-mono" data-uptime="${uptime}">
                ${uptimeFormatted}
              </div>
            </div>
            
            <div class="relative overflow-hidden bg-gradient-to-r from-white via-white to-gray-50/30 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-lg p-5 border border-gray-200/60 dark:border-gray-700/40 hover:border-gray-300/70 dark:hover:border-gray-600/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] transition-all duration-300">
              <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em] mb-2">
                Version
              </div>
              <div class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-50 font-mono">
                1.0.0
              </div>
            </div>
          </div>
          
          <div class="mt-8 text-sm text-gray-500 dark:text-gray-400 font-medium">
            All systems operational
          </div>
        </div>
      </div>
      
      <script>
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
        
        (function() {
          const timeElement = document.getElementById('current-time-display');
          if (!timeElement) return;
          
          function formatTime(date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
          }
          
          function updateTime() {
            const now = new Date();
            timeElement.textContent = formatTime(now);
          }
          
          updateTime();
          setInterval(updateTime, 1000);
        })();
        
        (function() {
          const uptimeElement = document.getElementById('uptime-display');
          if (!uptimeElement) return;
          
          const startUptime = parseFloat(uptimeElement.getAttribute('data-uptime')) || 0;
          const startTime = Date.now();
          
          function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return hours + 'h ' + minutes + 'm ' + secs + 's';
          }
          
          function updateUptime() {
            const elapsed = (Date.now() - startTime) / 1000;
            const currentUptime = startUptime + elapsed;
            uptimeElement.textContent = formatUptime(currentUptime);
          }
          
          updateUptime();
          setInterval(updateUptime, 1000);
        })();
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
}); 