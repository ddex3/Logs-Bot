import { useEffect } from 'react';

export default function Discord() {
  const DISCORD_INVITE_URL = import.meta.env.VITE_SUPPORT_SERVER_URL || '';

  useEffect(() => {
    window.location.href = DISCORD_INVITE_URL;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">Redirecting to Discord...</p>
      </div>
    </div>
  );
}
