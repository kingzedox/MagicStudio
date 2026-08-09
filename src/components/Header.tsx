import { Save, Send, Zap, Home, Copy, Check, Sliders, Sun, Moon } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  roomId: string;
  onGoHome: () => void;
  onSaveSnapshot: () => void;
  onPublish: () => void;
  onToggleMobileTools?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function Header({
  roomId,
  onGoHome,
  onSaveSnapshot,
  onPublish,
  onToggleMobileTools,
  theme = 'dark',
  onToggleTheme
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        
        <button
          onClick={onPublish}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#FF4564] hover:bg-[#ff5a75] rounded-md transition-colors shadow-sm"
          title="Publish L1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish L1</span>
        </button>

        {/* Mobile / Tablet Tools button cleanly in the header */}
        {onToggleMobileTools && (
          <button
            onClick={onToggleMobileTools}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#FF4564] hover:bg-[#ff5a75] rounded-md shadow-sm border border-[#ff5a75]/30 transition-all shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tools</span>
          </button>
        )}
      </div>
    </header>
  );
}

