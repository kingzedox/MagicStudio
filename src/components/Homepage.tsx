import { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  Zap, ArrowRight, CheckCircle2, Copy, Check, 
  Layers, Sun, Moon, Cpu, Move, Square, Circle, 
  Type, Image as ImageIcon, Sparkles, Save, Send, Sliders, MousePointer2, Plus, Lock, Home
} from "lucide-react";

import { motion } from 'motion/react';

const AnimatedCursor = () => (
  <motion.div
    initial={{ x: -620, y: 310, opacity: 0 }}
    animate={{ 
      x: [-620, -420, -320, 0],
      y: [310, 90, 50, 0],
      opacity: [0, 1, 1, 1]
    }}
    transition={{ 
      duration: 4.5, 
      times: [0, 0.4, 0.55, 1], 
      ease: "easeInOut",
      delay: 0.5
    }}
    className="absolute top-4 -right-12 sm:-right-16 z-50 flex flex-col items-start pointer-events-none"
  >
    <motion.div
      animate={{ scale: [1, 1, 0.9, 1, 1] }}
      transition={{ duration: 4.5, times: [0, 0.4, 0.48, 0.55, 1], ease: "easeInOut", delay: 0.5 }}
      style={{ originX: 0, originY: 0 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg -translate-x-1 -translate-y-1">
        <path d="M5.65376 1.15003L22.6538 10.15C23.5186 10.6067 23.4975 11.8385 22.6162 12.261L14.7335 16.037L9.93282 23.3638C9.43194 24.1281 8.24357 23.9576 7.97127 23.0847L5.65376 1.15003Z" fill="#FF4564" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    </motion.div>
    <div className="bg-[#FF4564] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap mt-1 ml-4 border border-white/20">
      MagicStudio
    </div>
  </motion.div>
);


const AnimatedCursorCollaborator = () => (
  <motion.div
    initial={{ x: 640, y: 160, opacity: 0 }}
    animate={{ 
      x: [640, 440, 240, 0],
      y: [160, -90, -120, 0],
      opacity: [0, 1, 1, 1]
    }}
    transition={{ 
      duration: 4.5, 
      times: [0, 0.4, 0.55, 1], 
      ease: "easeInOut",
      delay: 0.8
    }}
    className="absolute -bottom-20 -left-6 sm:-left-10 z-50 flex flex-col items-start pointer-events-none"
  >
    <motion.div
      animate={{ scale: [1, 1, 0.9, 1, 1] }}
      transition={{ duration: 4.5, times: [0, 0.4, 0.48, 0.55, 1], ease: "easeInOut", delay: 0.8 }}
      style={{ originX: 0, originY: 0 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg -translate-x-1 -translate-y-1">
        <path d="M5.65376 1.15003L22.6538 10.15C23.5186 10.6067 23.4975 11.8385 22.6162 12.261L14.7335 16.037L9.93282 23.3638C9.43194 24.1281 8.24357 23.9576 7.97127 23.0847L5.65376 1.15003Z" fill="#d6ff50" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    </motion.div>
    <div className="bg-[#d6ff50] text-[#3b4712] text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap mt-1 ml-4 border border-white/20">
      Collaborator
    </div>
  </motion.div>
);




interface HomepageProps {
  onLaunchStudio: (roomId: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function Homepage({ onLaunchStudio, theme = 'dark', onToggleTheme }: HomepageProps) {
  const [roomInput, setRoomInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const { publicKey } = useWallet();
  
  // Interactive showcase state inside the vector studio preview component
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>("1");
  const [previewPrompt, setPreviewPrompt] = useState("");
  const [previewElements, setPreviewElements] = useState([
    { id: "1", type: "rect", x: 40, y: 40, w: 220, h: 120, color: "#8b5cf6", label: "Hero UI Card", text: "Vector Component" },
    { id: "2", type: "circle", x: 290, y: 50, w: 100, h: 100, color: "#ec4899", label: "Avatar Node", text: "Node #2" },
    { id: "3", type: "text", x: 60, y: 190, w: 240, h: 48, color: "#3b82f6", label: "AI Co-Design CTA", text: "Live Syncing (8ms)" }
  ]);

  const isDark = theme === 'dark';

  const generateRoomId = () => {
    const randomHash = Math.random().toString(36).substring(2, 6);
    return `studio-${randomHash}`;
  };

  const handleCreateNew = () => {
    const newRoom = generateRoomId();
    onLaunchStudio(newRoom);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    let cleanRoom = roomInput.trim().replace(/^#/, "");
    
    // Handle pasted URLs — extract the room param
    try {
      const url = new URL(cleanRoom);
      const roomParam = url.searchParams.get("room");
      if (roomParam) cleanRoom = roomParam;
    } catch {
      // Not a URL, use as-is
    }
    
    onLaunchStudio(cleanRoom);
  };

  const handleCopyDemoCode = () => {
    navigator.clipboard.writeText("solana program deploy --program-id magic_studio.so");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddInteractiveShape = () => {
    const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newId = Date.now().toString();
    const newEl = {
      id: newId,
      type: "rect",
      x: Math.floor(Math.random() * 180) + 30,
      y: Math.floor(Math.random() * 120) + 30,
      w: 180,
      h: 90,
      color: randomColor,
      label: previewPrompt.trim() || "New Vector Node",
      text: "Interactive"
    };
    setPreviewElements(prev => [...prev, newEl]);
    setSelectedPreviewId(newId);
    setPreviewPrompt("");
  };

  const handleColorSwatchChange = (color: string) => {
    setPreviewElements(prev => prev.map(el => el.id === selectedPreviewId ? { ...el, color } : el));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 selection:bg-[#ffe0e5]/30 ${
      isDark ? 'bg-[#0f0f0f] text-white' : 'bg-white text-neutral-900'
    }`}>
      {/* 1. Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isDark ? 'bg-[#0f0f0f]/80 border-neutral-800' : 'bg-white/80 border-neutral-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 text-xl font-bold tracking-tight cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className={isDark ? 'text-white' : 'text-neutral-900'}>MagicStudio</span>
            <Zap className="w-5 h-5 text-[#FF4564] fill-[#ffe0e5]" />
          </div>

          {/* Nav Links + Controls */}
          <div className="flex items-center gap-4 sm:gap-6">

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-lg border transition-all ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 text-[#FF4564] hover:bg-neutral-800' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#FF4564]" />}
              </button>
            )}

            <WalletMultiButton />
          </div>
        </div>
      </nav>

      {/* 2. Hero Section - Freed up with generous vertical spacing */}
      <section className="mt-[15px] relative pt-[110px] pb-[130px] px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Main Display Headline */}
        {/* Main Display Headline */}
        <div className={`relative inline-block border-[1.5px] p-6 sm:p-10 mb-[15px] ${isDark ? 'border-neutral-700' : 'border-black'}`}>
          <AnimatedCursor />
          <AnimatedCursorCollaborator />
          {/* Corner Handles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#FF4564]" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FF4564]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#FF4564]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#FF4564]" />
          
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-5xl leading-[1.3] sm:leading-[1.4] ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            Real-Time <span className="inline-block px-4 py-0 sm:py-1 bg-[#FF4564] text-white rounded-2xl mx-1 align-middle -translate-y-1 shadow-sm">Collaborative</span> Design. <br className="hidden md:block" />
            <span className="inline-block px-4 py-0 sm:py-1 bg-[#d6ff50] text-[#3b4712] rounded-2xl mx-1 align-middle -translate-y-1 shadow-sm mt-3 sm:mt-0">&lt; 10ms</span> On-Chain Versioning.
          </h1>
        </div>

        {/* Subhead / Subtitle with ample breathing space */}
        <p className={`text-base sm:text-xl max-w-2xl leading-relaxed mb-[44px] ${
          isDark ? 'text-neutral-300' : 'text-neutral-600'
        }`}>
          Powered by Ephemeral Rollups and built-in AI assist.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <button
            onClick={handleCreateNew}
            className="px-7 py-3.5 bg-[#ffe0e5] hover:bg-[#ffc2cc] text-[#FF4564] rounded-lg font-bold text-sm sm:text-base transition-all flex items-center gap-2.5 shadow-xl shadow-[#ffe0e5]/30 hover:scale-[1.02]"
          >
            <span>CREATE NEW STUDIO</span>
          </button>

          <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Room #code..."
              className={`px-5 py-3.5 rounded-lg text-sm font-mono border focus:outline-none focus:border-[#ffe0e5] transition-colors w-44 sm:w-52 ${
                isDark 
                  ? 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600' 
                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
            <button
              type="submit"
              disabled={!roomInput.trim()}
              className={`px-6 py-3.5 rounded-lg text-sm font-bold border transition-all disabled:opacity-40 ${
                isDark 
                  ? 'bg-neutral-900 hover:bg-[#FF4564] hover:border-[#FF4564] border-neutral-800 text-white' 
                  : 'bg-neutral-200 hover:bg-[#FF4564] hover:border-[#FF4564] hover:text-white border-neutral-300 text-neutral-900'
              }`}
            >
              JOIN
            </button>
          </form>
        </div>

          {/* Inline Hero Metrics */}
          <div className="w-full max-w-6xl mx-auto mt-12">
            {/* Top Gradient Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#FF4564] to-transparent opacity-60 mb-10"></div>
            
            <div className="flex flex-row items-start justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
              {/* Metric 1 */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-[140px]">
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans tracking-tighter mb-2 text-[#FF4564]">
                  &lt; 12ms
                </div>
                <div className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-500'}`}>Sync Latency</div>
                <div className={`text-[8px] sm:text-[10px] leading-tight px-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  MagicBlock Ephemeral Rollup Router
                </div>
              </div>

              {/* Vertical Divider 1 */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#FF4564] to-transparent opacity-40 self-center shrink-0"></div>

              {/* Metric 2 */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-[140px]">
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans tracking-tighter mb-2 text-[#FF4564]">
                  $0.00
                </div>
                <div className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-500'}`}>Gas per Edit</div>
                <div className={`text-[8px] sm:text-[10px] leading-tight px-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Session Keys (@magicblock-labs/session-keys)
                </div>
              </div>

              {/* Vertical Divider 2 */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#FF4564] to-transparent opacity-40 self-center shrink-0"></div>

              {/* Metric 3 */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-[140px]">
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans tracking-tighter mb-2 text-[#FF4564]">
                  60 FPS
                </div>
                <div className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-500'}`}>Canvas Speed</div>
                <div className={`text-[8px] sm:text-[10px] leading-tight px-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Fabric.js Vector Canvas Engine
                </div>
              </div>

              {/* Vertical Divider 3 */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#FF4564] to-transparent opacity-40 self-center shrink-0"></div>

              {/* Metric 4 */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-[140px]">
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans tracking-tighter mb-2 text-[#FF4564]">
                  100%
                </div>
                <div className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-500'}`}>Provenance</div>
                <div className={`text-[8px] sm:text-[10px] leading-tight px-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  L1 State Commits via commit_accounts
                </div>
              </div>
            </div>

            {/* Bottom Gradient Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#FF4564] to-transparent opacity-60 mt-8"></div>
          </div>
      </section>

      
            {/* 4. Section 2: Clean Feature Stack */}
      <section id="features" className={`relative py-20 px-6 transition-colors overflow-hidden ${
        isDark ? 'border-neutral-800 bg-transparent' : 'border-neutral-200 bg-neutral-50/50'
      }`}>
        {/* Floating Shapes */}
        <svg className="absolute top-10 left-10 w-12 h-12 opacity-60" viewBox="0 0 24 24" fill="#32CD32"><path d="M12 0l2 6 6-2-2 6 6 2-6 2 2 6-6-2-2 6-2-6-6 2 2-6-6-2 6-2-2-6 6 2z"/></svg>
        <svg className="absolute bottom-20 right-10 w-16 h-16 opacity-60" viewBox="0 0 24 24" fill="#FF8C00"><path d="M12 0C12 6.6 6.6 12 0 12c6.6 0 12 5.4 12 12 0-6.6 5.4-12 12-12-6.6 0-12-5.4-12-12z"/></svg>
        
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Headline */}
          <div className="mb-16">
            <div className={`relative inline-block border-[1.5px] p-6 sm:p-10 mb-4 ${isDark ? 'border-neutral-700' : 'border-black'}`}>
              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#FF4564]" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FF4564]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#FF4564]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#FF4564]" />
              <h2 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                Features
              </h2>
              
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: [0, 1, 1, 0], x: [20, -10, -10, -10], y: [20, -10, -10, -10] }}
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
                className="absolute -bottom-8 -right-8 z-50 flex flex-col items-start pointer-events-none"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg -translate-x-1 -translate-y-1">
                  <path d="M5.65376 1.15003L22.6538 10.15C23.5186 10.6067 23.4975 11.8385 22.6162 12.261L14.7335 16.037L9.93282 23.3638C9.43194 24.1281 8.24357 23.9576 7.97127 23.0847L5.65376 1.15003Z" fill="#3b82f6" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                </svg>
                <div className="bg-[#3b82f6] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap mt-1 ml-4 border border-white/20">
                  Features
                </div>
              </motion.div>
            </div>
          </div>

          {/* Features List */}
          <div className={`relative border-t-[1.5px] ${isDark ? 'border-neutral-800' : 'border-black'}`}>
            <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 border-[1.5px] ${isDark ? 'border-neutral-700 bg-neutral-950' : 'border-neutral-300 bg-white'}`} />
            <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 border-[1.5px] ${isDark ? 'border-neutral-700 bg-neutral-950' : 'border-neutral-300 bg-white'}`} />
            {[
              {
                id: '01',
                title: 'Sync',
                tags: 'Real-time, Ephemeral Rollups, 60 FPS',
                description: 'Traditional L1 transactions take ~400ms and require wallet approvals. MagicStudio delegates canvas accounts to MagicBlock ERs so multiple designers can edit simultaneously at 60 FPS with zero wallet popups.'
              },
              {
                id: '02',
                title: 'Generative AI',
                tags: 'AI Generation, Vector Layouts',
                description: 'Type natural language prompts like \'Sign-up form with blue button\' to generate structured vector layouts that stream directly onto your collaborators\' screens instantly.'
              },
              {
                id: '03',
                title: 'Snapshots',
                tags: 'Solana Devnet L1, State Diff',
                description: 'Save milestones without interrupting your flow. Hit \'Save Snapshot\' to write a cryptographic state diff back to Solana Devnet L1, creating an immutable history of your design.'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className={`relative border-b-[1.5px] py-10 sm:py-16 ${
                  isDark ? 'border-neutral-800' : 'border-black'
                }`}
              >
                <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 border-[1.5px] z-10 ${isDark ? 'border-neutral-700 bg-neutral-950' : 'border-neutral-300 bg-white'}`} />
                <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 border-[1.5px] z-10 ${isDark ? 'border-neutral-700 bg-neutral-950' : 'border-neutral-300 bg-white'}`} />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 items-start">
                  {/* Number */}
                  <div className={`md:col-span-1 font-mono text-lg font-bold md:mt-3 ${isDark ? 'text-neutral-500' : 'text-neutral-800'}`}>
                    {feature.id}
                  </div>

                  {/* Title */}
                  <div className={`md:col-span-5 lg:col-span-4 text-4xl md:text-[60px] font-extrabold font-sans tracking-tight leading-[0.9] break-words ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {feature.title}
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-3 lg:col-span-3 text-[#FF4564] text-xs font-bold tracking-widest leading-loose md:mt-3">
                    {feature.tags.split(', ').map((tag, j) => (
                      <div key={j}>{tag}</div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className={`md:col-span-12 lg:col-span-4 text-sm md:text-base font-medium leading-relaxed md:mt-3 max-w-2xl ${
                    isDark ? 'text-neutral-400' : 'text-neutral-700'
                  }`}>
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 Architecture Graphic Section */}
      <section className={`relative py-20 px-6 transition-colors overflow-hidden ${
        isDark ? 'border-neutral-800 bg-transparent' : 'border-neutral-200 bg-white'
      }`}>
        {/* Floating Shapes */}
        <svg className="absolute top-20 right-20 w-20 h-20 opacity-60" viewBox="0 0 24 24" fill="#9370DB"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z"/></svg>
        <svg className="absolute bottom-10 left-12 w-16 h-16 opacity-60" viewBox="0 0 24 24" fill="#FF69B4"><rect x="9" y="0" width="6" height="24" rx="3"/><rect x="0" y="9" width="24" height="6" rx="3"/></svg>
        
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Headline - Left Aligned like Features */}
          <div className="mb-16">
            <div className={`relative inline-block border-[1.5px] p-6 sm:p-10 mb-4 ${isDark ? 'border-neutral-700' : 'border-black'}`}>
              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#d6ff50]" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#d6ff50]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#d6ff50]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#d6ff50]" />
              <h2 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                How it works
              </h2>
              
              <motion.div
                initial={{ opacity: 0, x: -20, y: -20 }}
                animate={{ opacity: [0, 1, 1, 0], x: [-20, 10, 10, 10], y: [-20, 10, 10, 10] }}
                transition={{ duration: 7, repeat: Infinity, times: [0, 0.2, 0.8, 1], delay: 1 }}
                className="absolute -top-6 -left-6 z-50 flex flex-col items-start pointer-events-none"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg -translate-x-1 -translate-y-1">
                  <path d="M5.65376 1.15003L22.6538 10.15C23.5186 10.6067 23.4975 11.8385 22.6162 12.261L14.7335 16.037L9.93282 23.3638C9.43194 24.1281 8.24357 23.9576 7.97127 23.0847L5.65376 1.15003Z" fill="#10b981" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                </svg>
                <div className="bg-[#10b981] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap mt-1 ml-4 border border-white/20">
                  How it works
                </div>
              </motion.div>
            </div>
          </div>

          {/* Grid of Steps matching inspo */}
          <div className={`relative border-[1.5px] p-2 sm:p-3 ${isDark ? 'border-neutral-800' : 'border-black'}`}>
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#d6ff50]" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#d6ff50]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#d6ff50]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#d6ff50]" />
            
            <div className={`relative border ${isDark ? 'border-[#FF4564]/30' : 'border-[#FF4564]/20'} shadow-[0_0_40px_rgba(255,69,100,0.05)] rounded-2xl overflow-hidden`}>
            {/* Continuous horizontal dashed line for Desktop */}
            <div className={`hidden lg:block absolute top-[72px] left-0 w-full h-px border-t border-dashed ${
              isDark ? 'border-[#FF4564]/30' : 'border-[#FF4564]/20'
            }`}></div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-dashed lg:divide-dashed ${isDark ? 'divide-[#FF4564]/30' : 'divide-[#FF4564]/20'}`}>
              {[
                {
                  step: "Step 1",
                  title: "Create Room",
                  description: "Initialize a new session with a Solana PDA. This sets up the foundational on-chain state for your collaborative design.",
                  visual: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className={`relative w-3/4 h-3/4 border-2 border-dashed ${isDark ? 'border-[#FF4564]/30 bg-[#FF4564]/[0.02]' : 'border-[#FF4564]/30 bg-[#FF4564]/[0.02]'} rounded-xl flex items-center justify-center`}>
                        <motion.div animate={{ scale: [0.95, 1, 0.95], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-tr from-[#FF4564]/10 to-transparent rounded-xl"></motion.div>
                        <div className="flex gap-3 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-neutral-900 shadow-lg flex items-center justify-center text-xs text-white font-bold">U1</div>
                          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-neutral-900 shadow-lg flex items-center justify-center text-xs text-white font-bold -ml-2">U2</div>
                          <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-neutral-900 shadow-lg flex items-center justify-center text-xs text-white font-bold -ml-2">U3</div>
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#FF4564] animate-pulse shadow-[0_0_8px_rgba(255,69,100,0.8)]"></div>
                          <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>ROOM_ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  step: "Step 2",
                  title: "Delegate to ER",
                  description: "Delegate your canvas account to the MagicBlock Ephemeral Rollup engine, enabling high-throughput edits.",
                  visual: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="flex items-center gap-2 relative">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 shadow-inner flex items-center justify-center z-10">
                          <div className="w-3 h-3 bg-neutral-600 rounded-full"></div>
                        </div>
                        <div className="w-12 h-[2px] bg-gradient-to-r from-neutral-800 via-[#FF4564]/50 to-[#FF4564]"></div>
                        <div className="w-14 h-14 rounded-2xl bg-[#FF4564]/10 border border-[#FF4564]/30 flex items-center justify-center z-10 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[#FF4564]/20 animate-pulse"></div>
                          <Zap className="w-6 h-6 text-[#FF4564] relative z-10" />
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  step: "Step 3",
                  title: "Co-Design Live",
                  description: "Use sub-10ms session keys to edit vector layers in real-time with your team, completely avoiding wallet popups.",
                  visual: (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                      <div className="absolute w-[120%] h-[120%] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]"></div>
                      <div className="absolute top-1/4 left-1/4 w-16 h-12 border border-neutral-700/50 rounded bg-neutral-800/40 backdrop-blur-sm"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-20 h-14 border border-[#FF4564]/50 rounded bg-[#FF4564]/10 backdrop-blur-sm"></div>
                      <motion.div animate={{ x: [0, 10, -10, 0], y: [0, -10, 5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/3 left-1/3 z-20">
                        <MousePointer2 className="w-5 h-5 text-white drop-shadow-md fill-white" />
                      </motion.div>
                      <motion.div animate={{ x: [0, -15, 10, 0], y: [0, 15, -5, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-1/3 right-1/3 z-20">
                        <MousePointer2 className="w-5 h-5 text-[#d6ff50] drop-shadow-md fill-[#d6ff50]" />
                      </motion.div>
                    </div>
                  )
                },
                {
                  step: "Step 4",
                  title: "Commit to L1",
                  description: "When ready, save a snapshot to write a cryptographic state diff back to the Solana Devnet L1 for an immutable record.",
                  visual: (
                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-[#FF4564] shadow-sm"></div>
                        <div className="w-3.5 h-3.5 rounded bg-[#FF4564]/70 shadow-sm"></div>
                        <div className="w-3.5 h-3.5 rounded bg-[#FF4564]/40 shadow-sm"></div>
                        <div className="w-3.5 h-3.5 rounded bg-[#FF4564]/10 shadow-sm"></div>
                      </div>
                      <div className="w-[1.5px] h-8 bg-gradient-to-b from-[#FF4564]/50 to-neutral-800"></div>
                      <div className="px-4 py-1.5 text-[10px] font-mono border border-[#FF4564]/30 rounded bg-[#FF4564]/5 text-[#FF4564] uppercase tracking-widest shadow-inner">
                        State Diff Saved
                      </div>
                    </div>
                  )
                }
              ].map((node, i) => (
                <div key={i} className={`flex flex-col h-full z-10 ${isDark ? 'bg-[#FF4564]/[0.02]' : 'bg-[#FF4564]/[0.01]'}`}>
                  {/* Step Tag Area */}
                  <div className={`h-[72px] flex items-center px-6 ${isDark ? 'bg-[#FF4564]/5' : 'bg-[#FF4564]/10'}`}>
                    <span className="inline-flex px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide bg-[#FF4564] text-white shadow-sm">
                      {node.step}
                    </span>
                  </div>

                  {/* Divider Line (Mobile/Tablet only) */}
                  <div className={`w-full h-px border-t border-dashed lg:hidden ${
                    isDark ? 'border-[#FF4564]/30' : 'border-[#FF4564]/20'
                  }`}></div>

                  {/* Content Area */}
                  <div className="flex flex-col flex-grow p-6">
                    <h3 className={`text-[19px] font-bold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {node.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-8 flex-grow ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {node.description}
                    </p>

                    {/* Illustration Box */}
                    <div className={`w-full aspect-[4/3] rounded-xl flex items-center justify-center border mt-auto transition-all duration-300 overflow-hidden ${
                      isDark ? 'bg-[#0f0f0f]/50 border-[#FF4564]/10' : 'bg-white border-[#FF4564]/10'
                    }`}>
                      {node.visual}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
                </div>
        </section>

{/* 5. Footer */}
      <footer className={`bg-transparent pt-24 pb-0 px-6 lg:px-12 mt-12 relative overflow-hidden ${isDark ? 'text-white' : 'text-neutral-900'}`}>
        <div className="max-w-7xl mx-auto flex flex-col">
          {/* Top Huge Text */}
          <div className="flex flex-col md:flex-row justify-start items-center md:justify-end gap-4 md:gap-8 mb-24 md:mb-32 pr-0 md:pr-12 w-full flex-wrap">
             <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full md:w-auto">
                <h2 className="text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[9rem] xl:text-[11rem] font-bold tracking-tighter leading-none whitespace-normal break-words text-center md:text-right">
                  MagicStudio
                </h2>
                <Zap className="w-[12vw] h-[12vw] md:w-24 md:h-24 text-[#FF4564] fill-[#ffe0e5] shrink-0" strokeWidth={2.5} />
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16 px-4 md:px-0 text-center md:text-left w-full">
             <div className="max-w-sm flex flex-col items-center md:items-start w-full">
                <p className="text-[#a0a0a0] text-sm leading-relaxed mb-6">
                  This project was built for the MagicBlock Hackathon.
                </p>
                <div className="flex items-center justify-center md:justify-start flex-wrap gap-4 w-full md:w-auto">
                  <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors">
                    {/* X Icon */}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors">
                    {/* Github Icon */}
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="w-5 h-5 fill-white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                  </a>
                </div>
             </div>
             <div className="w-full md:w-auto flex justify-center md:justify-end">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 rounded-full bg-[#FF4564] text-white font-bold tracking-wide hover:bg-[#ff2a4d] transition-colors shadow-[0_0_20px_rgba(255,69,100,0.3)]"
                >
                  Launch Studio
                </button>
             </div>
          </div>
          
          {/* Decorative Shapes at bottom (Component Thingy) */}
          <div className="flex items-center justify-between w-full h-20 sm:h-28 lg:h-36 opacity-100 border-t border-neutral-900 pt-10 pb-4">
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5"/></svg>
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="#9370DB"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z"/></svg>
            <svg className="h-full w-auto hidden sm:block" viewBox="0 0 24 24" fill="#32CD32"><path d="M12 0l2 6 6-2-2 6 6 2-6 2 2 6-6-2-2 6-2-6-6 2 2-6-6-2 6-2-2-6 6 2z"/></svg>
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="#FF8C00"><path d="M12 0C12 6.6 6.6 12 0 12c6.6 0 12 5.4 12 12 0-6.6 5.4-12 12-12-6.6 0-12-5.4-12-12z"/></svg>
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="#FF69B4"><rect x="9" y="0" width="6" height="24" rx="3"/><rect x="0" y="9" width="24" height="6" rx="3"/></svg>
            <svg className="h-full w-auto hidden md:block" viewBox="0 0 24 24" fill="#4169E1"><rect x="10" y="-4" width="4" height="32" rx="2" transform="rotate(45 12 12)"/><rect x="10" y="-4" width="4" height="32" rx="2" transform="rotate(-45 12 12)"/></svg>
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="#00FA9A"><path d="M0 24 L12 0 L24 24 Z"/></svg>
            <svg className="h-full w-auto" viewBox="0 0 24 24" fill="#DC143C"><path d="M12 0l1.5 10.5L24 12l-10.5 1.5L12 24l-1.5-10.5L0 12l10.5-1.5z"/></svg>
            <svg className="h-full w-auto hidden lg:block" viewBox="0 0 24 24" fill="#1E90FF"><circle cx="12" cy="6" r="6"/><circle cx="12" cy="18" r="6"/><circle cx="6" cy="12" r="6"/><circle cx="18" cy="12" r="6"/></svg>
          </div>
        </div>
      </footer>
    </div>
  );
}
