'use client';

import { usePrivy } from '@privy-io/react-auth';
import { LogIn, LogOut } from 'lucide-react';

export default function LoginButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  
  if (!ready) {
    return (
      <div className="w-24 h-10 rounded-lg bg-white/5 animate-pulse"></div>
    );
  }

  if (authenticated) {
    // Show truncated address or email
    const display = user?.wallet?.address 
      ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`
      : user?.email?.address || 'Connected';

    return (
      <button
        onClick={logout}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
        title="Click to logout"
      >
        <span className="font-mono text-xs">{display}</span>
        <LogOut className="w-3.5 h-3.5 text-red-400" />
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-[#FF4564] hover:bg-[#ff2a4d] text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,69,100,0.3)]"
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
}
