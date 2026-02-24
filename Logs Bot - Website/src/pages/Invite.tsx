import { useEffect } from 'react';

export default function Invite() {
  const BOT_INVITE_URL = import.meta.env.VITE_BOT_INVITE_URL || '';

  useEffect(() => {
    window.location.href = BOT_INVITE_URL;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">Redirecting to Discord bot invite...</p>
      </div>
    </div>
  );
}

