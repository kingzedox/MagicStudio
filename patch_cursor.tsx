import { motion } from 'motion/react';

const AnimatedCursor = () => (
  <motion.div
    initial={{ x: -300, y: 300, opacity: 0 }}
    animate={{ 
      x: [-300, -100, 0, 320], 
      y: [300, 80, 40, -10],
      opacity: [0, 1, 1, 1]
    }}
    transition={{ 
      duration: 4.5, 
      times: [0, 0.4, 0.55, 1], 
      ease: "easeInOut",
      delay: 0.5
    }}
    className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-start pointer-events-none"
  >
    <motion.div
      animate={{ scale: [1, 1, 0.8, 1, 1] }}
      transition={{ duration: 4.5, times: [0, 0.4, 0.48, 0.55, 1], ease: "easeInOut", delay: 0.5 }}
      style={{ originX: 0, originY: 0 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg -translate-x-1 -translate-y-1">
        <path d="M5.65376 1.15003L22.6538 10.15C23.5186 10.6067 23.4975 11.8385 22.6162 12.261L14.7335 16.037L9.93282 23.3638C9.43194 24.1281 8.24357 23.9576 7.97127 23.0847L5.65376 1.15003Z" fill="#7042e8" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    </motion.div>
    <div className="bg-[#7042e8] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap mt-1 ml-4 border border-white/20">
      Magic Studio
    </div>
  </motion.div>
);
