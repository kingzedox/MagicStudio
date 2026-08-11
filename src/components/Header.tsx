import { Save, Send, Zap, Home, Copy, Check, Sliders, Sun, Moon, Download, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

interface HeaderProps {
  roomId: string;
  onGoHome: () => void;
  onSaveSnapshot: () => void;
  onPublish: () => void;
  onToggleMobileTools?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (file: File) => void;
}

export default function Header({
  roomId,
  onGoHome,
  onSaveSnapshot,
  onPublish,
  onToggleMobileTools,
  theme = 'dark',
  onToggleTheme,
  onExportPNG,
  onExportJSON,
  onImportJSON
}: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect, connecting } = useWallet();

  const handleCopyRoom = async () => {
    const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWalletClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b shrink-0 z-20 transition-colors ${
      isDark ? 'bg-black border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
    }`}>
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        

        <h1 
          onClick={onGoHome}
          className={`text-sm sm:text-xl font-bold tracking-tight flex items-center gap-1.5 shrink-0 cursor-pointer ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          <span>MagicStudio</span>
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4564] fill-[#FF4564]" />
        </h1>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border max-w-[140px] sm:max-w-none truncate ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-[#FF4564] animate-pulse shrink-0" />
          <span className={`text-[11px] sm:text-xs font-medium font-mono truncate ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            #{roomId}
          </span>
          <button
            onClick={handleCopyRoom}
            className={`p-0.5 transition-colors shrink-0 ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-800'}`}
            title="Copy room link"
          >
            {copied ? <Check className="w-3 h-3 text-[#FF4564]" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all shrink-0 ${
              isDark 
                ? 'bg-neutral-900 border-neutral-800 text-[#FF4564] hover:bg-neutral-800' 
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#FF4564]" />}
          </button>
        )}
        
        <button
          onClick={onSaveSnapshot}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
            isDark 
              ? 'text-neutral-300 hover:text-white bg-neutral-900 border-neutral-800 hover:bg-neutral-800' 
              : 'text-neutral-700 hover:text-neutral-900 bg-neutral-100 border-neutral-200 hover:bg-neutral-200'
          }`}
          title="Save Snapshot"
        >
          <Save className="w-3.5 h-3.5 text-[#FF4564]" />
          <span>Snapshot</span>
        </button>

        {/* Local Persistence Tools */}
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
              isDark 
                ? 'text-neutral-300 hover:text-white bg-neutral-900 border-neutral-800 hover:bg-neutral-800' 
                : 'text-neutral-700 hover:text-neutral-900 bg-neutral-100 border-neutral-200 hover:bg-neutral-200'
            }`}
            title="Download Canvas as PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
        )}

        {onExportJSON && onImportJSON && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={onExportJSON}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors border ${
                isDark 
                  ? 'text-neutral-300 hover:text-white bg-neutral-900 border-neutral-800 hover:bg-neutral-800' 
                  : 'text-neutral-700 hover:text-neutral-900 bg-neutral-100 border-neutral-200 hover:bg-neutral-200'
              }`}
              title="Save Design (.json)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors border-y border-r ${
                isDark 
                  ? 'text-neutral-300 hover:text-white bg-neutral-900 border-neutral-800 hover:bg-neutral-800 border-l-0' 
                  : 'text-neutral-700 hover:text-neutral-900 bg-neutral-100 border-neutral-200 hover:bg-neutral-200 border-l-0'
              }`}
              title="Load Design (.json)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportJSON(file);
                  e.target.value = ''; // Reset input
                }
              }}
            />
          </div>
        )}
        
        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffe0e5] hover:bg-[#ffc2cc] text-[#FF4564] text-xs font-bold rounded-md transition-all shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Publish</span>
        </button>

        <div className="hidden sm:block">
          <button
            onClick={handleWalletClick}
            disabled={connecting}
            className={`h-8 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              publicKey
                ? isDark 
                  ? 'bg-[#FF4564] text-white hover:bg-[#ff3050]' 
                  : 'bg-[#FF4564] text-white hover:bg-[#ff3050]'
                : connecting
                ? isDark
                  ? 'bg-neutral-800 text-neutral-400 cursor-wait'
                  : 'bg-neutral-200 text-neutral-500 cursor-wait'
                : isDark
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
            }`}
          >
            {connecting ? 'Connecting...' : publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>

        {/* Mobile / Tablet Tools button cleanly in the header */}
        {onToggleMobileTools && (
          <button 
            onClick={onToggleMobileTools}
            className={`sm:hidden p-1.5 rounded-md border ${
              isDark 
                ? 'border-neutral-800 text-neutral-400 bg-neutral-900' 
                : 'border-neutral-200 text-neutral-600 bg-neutral-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
