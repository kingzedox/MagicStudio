import { useRef, useState } from "react";
import { CanvasElement, TimelineEvent } from "../types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { 
  PlusSquare, Type, Image as ImageIcon, History, Circle, Star, Triangle,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown, Copy, Trash2, Lock, Unlock,
  Group, Ungroup, CheckSquare, X, FlipHorizontal, FlipVertical
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface SidebarProps {
  elements: CanvasElement[];
  setElements: (els: CanvasElement[]) => void;
  timeline: TimelineEvent[];
  selectedIds?: string[];
  setSelectedIds?: (ids: string[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddCommit: (desc: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  theme?: 'dark' | 'light';
}

export default function Sidebar({ 
  elements, 
  setElements, 
  timeline, 
  selectedIds = [], 
  setSelectedIds, 
  selectedId, 
  setSelectedId, 
  onAddCommit,
  isMobileOpen = false,
  onCloseMobile,
  theme = 'dark'
}: SidebarProps) {
  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
  const selectedEl = elements.find(e => e.id === selectedId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showGradient, setShowGradient] = useState(false);

  const isGrouped = effectiveSelectedIds.some(id => elements.find(el => el.id === id)?.groupId);

  // Color presets
  const colorPresets = [
    '#FF4564', '#4f46e5', '#ec4899', '#eab308', 
    '#10b981', '#3b82f6', '#8b5cf6', '#f97316',
    '#000000', '#ffffff', '#6b7280', '#1f2937'
  ];

  const handleGroup = () => {
    if (effectiveSelectedIds.length < 2) {
      return;
    }
    
    const newGroupId = uuidv4();
    const newEls = elements.map(el => {
      if (effectiveSelectedIds.includes(el.id)) {
        return { ...el, groupId: newGroupId };
      }
      return el;
    });
    setElements(newEls);
    onAddCommit("Grouped (Merged) elements");
  };

  const handleUngroup = () => {
    if (effectiveSelectedIds.length === 0) {
      return;
    }
    
    const newEls = elements.map(el => {
      if (effectiveSelectedIds.includes(el.id) && el.groupId) {
        const { groupId, ...rest } = el;
        return rest;
      }
      return el;
    });
    setElements(newEls);
    onAddCommit("Ungrouped elements");
  };

  const handleSelectAll = () => {
    const allIds = elements.filter(el => !el.locked).map(el => el.id);
    if (setSelectedIds) {
      setSelectedIds(allIds);
    } else if (allIds.length > 0) {
      setSelectedId(allIds[0]);
    }
  };

  const handleAddBox = () => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'rect',
      x: 350, y: 250, w: 120, h: 120,
      color: '#4f46e5',
      opacity: 1,
      cornerRadius: 8,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit("Added Rectangle");
  };

  const handleAddCircle = () => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'circle',
      x: 350, y: 250, w: 120, h: 120,
      color: '#ec4899',
      opacity: 1,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit("Added Circle");
  };

  const handleAddStar = () => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'star',
      x: 350, y: 250, w: 120, h: 120,
      color: '#eab308',
      opacity: 1,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit("Added Star");
  };

  const handleAddTriangle = () => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'triangle',
      x: 350, y: 250, w: 120, h: 120,
      color: '#10b981',
      opacity: 1,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit("Added Triangle");
  };

  const handleAddText = () => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'text',
      x: 300, y: 250, w: 220, h: 40,
      color: '#ffffff',
      text: 'Double click to edit',
      fontSize: 24,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit("Added Text");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      console.log("File is not an image:", file.type);
      alert("Please select an image file (jpg, png, gif, etc.)");
      return;
    }

    console.log("Loading image:", file.name, file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== 'string') {
        console.error("Failed to read file as data URL");
        return;
      }
      
      console.log("Image loaded successfully, adding to canvas");
      
      const newEl: CanvasElement = {
        id: uuidv4(),
        type: 'image',
        x: 300, y: 200, w: 200, h: 200,
        color: 'transparent',
        imageUrl: dataUrl,
        opacity: 1,
      };
      setElements([...elements, newEl]);
      setSelectedId(newEl.id);
      onAddCommit("Uploaded Image");
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Failed to load image. Please try again.");
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (e.target) e.target.value = "";
  };

  const handleAddSampleImage = (url: string, name: string) => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'image',
      x: 300, y: 200, w: 180, h: 180,
      color: 'transparent',
      imageUrl: url,
      opacity: 1,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    onAddCommit(`Added ${name}`);
  };

  const updateSelectedEl = (updates: Partial<CanvasElement>) => {
    if (!updates || effectiveSelectedIds.length === 0) return;
    
    setElements(elements.map(el => 
      effectiveSelectedIds.includes(el.id) ? { ...el, ...updates } : el
    ));
  };

  // Alignment Helpers
  const alignElement = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedEl) return;
    let x = selectedEl.x;
    let y = selectedEl.y;

    if (type === 'left') x = 0;
    if (type === 'center') x = (CANVAS_WIDTH - selectedEl.w) / 2;
    if (type === 'right') x = CANVAS_WIDTH - selectedEl.w;
    if (type === 'top') y = 0;
    if (type === 'middle') y = (CANVAS_HEIGHT - selectedEl.h) / 2;
    if (type === 'bottom') y = CANVAS_HEIGHT - selectedEl.h;

    updateSelectedEl({ x, y });
    onAddCommit(`Aligned ${type}`);
  };

  const moveLayer = (action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!selectedId) return;
    
    const index = elements.findIndex(e => e.id === selectedId);
    if (index === -1) return;

    const newArr = [...elements];
    const [item] = newArr.splice(index, 1);

    let newIndex = index;
    if (action === 'front') newIndex = newArr.length;
    else if (action === 'back') newIndex = 0;
    else if (action === 'forward') newIndex = Math.min(newArr.length, index + 1);
    else if (action === 'backward') newIndex = Math.max(0, index - 1);
    
    newArr.splice(newIndex, 0, item);

    setElements(newArr);
    onAddCommit(`Reordered layer (${action})`);
  };

  const duplicateSelected = () => {
    if (!selectedEl) return;
    const copy: CanvasElement = {
      ...selectedEl,
      id: uuidv4(),
      x: selectedEl.x + 20,
      y: selectedEl.y + 20,
    };
    setElements([...elements, copy]);
    setSelectedId(copy.id);
    onAddCommit("Duplicated element");
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(e => e.id !== selectedId));
    setSelectedId(null);
    onAddCommit("Deleted element");
  };

  const isDark = theme === 'dark';

  const sidebarContent = (
    <div className={`w-full sm:w-80 md:w-72 border-l flex flex-col h-full select-none overflow-y-auto transition-colors ${
      isDark ? 'border-white/10 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-900 shadow-lg'
    }`}>
      {/* Mobile Close Bar */}
      {onCloseMobile && (
        <div className={`md:hidden flex items-center justify-between p-3 border-b ${
          isDark ? 'border-white/10 bg-neutral-900/80' : 'border-neutral-200 bg-neutral-100'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF4564] dark:text-[#FF4564]">Studio Tools &amp; Properties</span>
          <button 
            onClick={onCloseMobile} 
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'text-neutral-400 hover:text-white bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Tools Section */}
      <div className={`p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Add Shapes & Media</h3>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <button onClick={handleAddBox} className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors border ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-white/5' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'}`}>
            <PlusSquare className="w-4 h-4 text-[#FF4564]" />
            <span>Box</span>
          </button>
          <button onClick={handleAddCircle} className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors border ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-white/5' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'}`}>
            <Circle className="w-4 h-4 text-[#FF4564]" />
            <span>Circle</span>
          </button>
          <button onClick={handleAddStar} className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors border ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-white/5' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'}`}>
            <Star className="w-4 h-4 text-[#FF4564]" />
            <span>Star</span>
          </button>
          <button onClick={handleAddTriangle} className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors border ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-white/5' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'}`}>
            <Triangle className="w-4 h-4 text-[#FF4564]" />
            <span>Triangle</span>
          </button>
          <button onClick={handleAddText} className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors border col-span-2 ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-white/5' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-200'}`}>
            <Type className="w-4 h-4 text-[#FF4564]" />
            <span>Text</span>
          </button>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-[#FF4564]/80 hover:bg-[#FF4564] rounded-md transition-colors mb-2"
        >
          <ImageIcon className="w-4 h-4" /> Upload Image
        </button>

        {/* Quick Sample Media */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold">Samples:</span>
          <button 
            onClick={() => handleAddSampleImage("https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", "Solana Logo")}
            className="text-[11px] px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-white/5"
          >
            Solana
          </button>
          <button 
            onClick={() => handleAddSampleImage("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", "Abstract Graphic")}
            className="text-[11px] px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-white/5"
          >
            Abstract
          </button>
        </div>
      </div>

      {/* Properties & Actions Section */}
      <div className={`p-4 border-b flex-shrink-0 space-y-4 ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {effectiveSelectedIds.length > 1 ? `${effectiveSelectedIds.length} Elements Selected` : 'Properties'}
            </h3>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleSelectAll}
                className="p-1 rounded text-neutral-400 hover:bg-neutral-800 hover:text-white flex items-center gap-1 text-[11px]"
                title="Select All Elements"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Select All</span>
              </button>

              {selectedEl && (
                <>
                  <button 
                    onClick={() => updateSelectedEl({ locked: !selectedEl.locked })} 
                    className={`p-1 rounded text-xs ${selectedEl.locked ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400 hover:bg-neutral-800'}`}
                    title={selectedEl.locked ? "Unlock" : "Lock"}
                  >
                    {selectedEl.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={duplicateSelected} 
                    className="p-1 rounded text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={deleteSelected} 
                    className="p-1 rounded text-neutral-400 hover:bg-red-500/20 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group & Ungroup / Merge Controls */}
          <div className="flex items-center gap-2 pt-1">
            {effectiveSelectedIds.length > 1 && (
              <button
                onClick={handleGroup}
                className="flex-1 px-2.5 py-1.5 bg-[#FF4564] hover:bg-[#FF4564] text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow transition-colors"
                title="Merge selected elements into a single group"
              >
                <Group className="w-3.5 h-3.5" />
                <span>Merge ({effectiveSelectedIds.length})</span>
              </button>
            )}

            {isGrouped && (
              <button
                onClick={handleUngroup}
                className="flex-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow transition-colors"
                title="Unmerge grouped elements"
              >
                <Ungroup className="w-3.5 h-3.5" />
                <span>Unmerge</span>
              </button>
            )}
          </div>
        </div>

        {selectedEl ? (
          <div className="space-y-4">
            {/* Position & Size */}
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500">X</span>
                <input 
                  type="number" 
                  value={Math.round(selectedEl.x)} 
                  onChange={(e) => updateSelectedEl({ x: Number(e.target.value) })}
                  className="font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-[#FF4564] text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500">Y</span>
                <input 
                  type="number" 
                  value={Math.round(selectedEl.y)} 
                  onChange={(e) => updateSelectedEl({ y: Number(e.target.value) })}
                  className="font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-[#FF4564] text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500">W</span>
                <input 
                  type="number" 
                  value={Math.round(selectedEl.w)} 
                  onChange={(e) => updateSelectedEl({ w: Number(e.target.value) })}
                  className="font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-[#FF4564] text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500">H</span>
                <input 
                  type="number" 
                  value={Math.round(selectedEl.h)} 
                  onChange={(e) => updateSelectedEl({ h: Number(e.target.value) })}
                  className="font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800 focus:outline-none focus:border-[#FF4564] text-xs" 
                />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Rotation</span>
                <span className="font-mono text-neutral-400">{Math.round(selectedEl.rotation || 0)}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="360" 
                value={Math.round(selectedEl.rotation || 0)} 
                onChange={(e) => updateSelectedEl({ rotation: Number(e.target.value) })}
                className="w-full accent-[#FF4564] h-1.5 bg-neutral-800 rounded cursor-pointer" 
              />
            </div>

            {/* Alignment Controls */}
            <div className="flex flex-col gap-1.5">
              <span className="text-neutral-500 text-xs">Alignment</span>
              <div className="grid grid-cols-6 gap-1 bg-neutral-900 p-1 rounded border border-white/5">
                <button onClick={() => alignElement('left')} title="Align Left" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => alignElement('center')} title="Align Center (Horiz)" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => alignElement('right')} title="Align Right" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => alignElement('top')} title="Align Top" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignStartVertical className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => alignElement('middle')} title="Align Middle (Vert)" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignCenterVertical className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => alignElement('bottom')} title="Align Bottom" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <AlignEndVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Layer Ordering */}
            <div className="flex flex-col gap-1.5">
              <span className="text-neutral-500 text-xs">Layer Order</span>
              <div className="grid grid-cols-4 gap-1 bg-neutral-900 p-1 rounded border border-white/5">
                <button onClick={() => moveLayer('front')} title="Bring to Front" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveLayer('forward')} title="Bring Forward" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveLayer('backward')} title="Send Backward" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveLayer('back')} title="Send to Back" className="p-1.5 hover:bg-neutral-800 rounded flex items-center justify-center text-neutral-300 hover:text-white">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fill Color */}
            {selectedEl.type !== 'image' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-xs">Fill</span>
                  <button
                    onClick={() => setShowGradient(!showGradient)}
                    className="text-[10px] px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-white/5 transition-colors"
                  >
                    {showGradient ? 'Solid' : 'Gradient'}
                  </button>
                </div>

                {!showGradient ? (
                  <>
                    <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-800">
                      <input 
                        type="color" 
                        value={selectedEl.color.startsWith('#') ? selectedEl.color : '#ffffff'} 
                        onChange={(e) => updateSelectedEl({ color: e.target.value, gradient: undefined })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={selectedEl.color}
                        onChange={(e) => updateSelectedEl({ color: e.target.value, gradient: undefined })}
                        className="font-mono text-xs text-neutral-300 uppercase flex-1 bg-transparent focus:outline-none"
                      />
                    </div>

                    {/* Color Presets */}
                    <div className="grid grid-cols-6 gap-1.5 mt-1">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateSelectedEl({ color, gradient: undefined })}
                          className="w-full h-6 rounded border-2 border-white/10 hover:border-[#FF4564] transition-colors shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-neutral-400 text-[10px]">Gradient Type</span>
                      <div className="flex bg-neutral-900 rounded border border-neutral-800 p-0.5">
                        <button
                          onClick={() => updateSelectedEl({
                            gradient: {
                              type: 'linear',
                              stops: selectedEl.gradient?.stops || [
                                { color: '#4f46e5', offset: 0 },
                                { color: '#ec4899', offset: 1 }
                              ],
                              angle: selectedEl.gradient?.angle || 90
                            }
                          })}
                          className={`flex-1 py-1.5 text-xs rounded ${selectedEl.gradient?.type === 'linear' ? 'bg-[#FF4564] text-white' : 'text-neutral-400'}`}
                        >
                          Linear
                        </button>
                        <button
                          onClick={() => updateSelectedEl({
                            gradient: {
                              type: 'radial',
                              stops: selectedEl.gradient?.stops || [
                                { color: '#4f46e5', offset: 0 },
                                { color: '#ec4899', offset: 1 }
                              ]
                            }
                          })}
                          className={`flex-1 py-1.5 text-xs rounded ${selectedEl.gradient?.type === 'radial' ? 'bg-[#FF4564] text-white' : 'text-neutral-400'}`}
                        >
                          Radial
                        </button>
                      </div>
                    </div>

                    {selectedEl.gradient?.type === 'linear' && (
                      <div className="flex flex-col gap-1">
                        <span className="text-neutral-400 text-[10px]">Angle: {selectedEl.gradient.angle || 90}°</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedEl.gradient.angle || 90}
                          onChange={(e) => updateSelectedEl({
                            gradient: { ...selectedEl.gradient!, angle: Number(e.target.value) }
                          })}
                          className="w-full accent-[#FF4564] h-1.5 bg-neutral-800 rounded cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Gradient Color Stops */}
                    <div className="space-y-1.5">
                      <span className="text-neutral-400 text-[10px]">Colors</span>
                      {(selectedEl.gradient?.stops || []).map((stop, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={stop.color}
                            onChange={(e) => {
                              const newStops = [...(selectedEl.gradient?.stops || [])];
                              newStops[idx] = { ...newStops[idx], color: e.target.value };
                              updateSelectedEl({
                                gradient: { ...selectedEl.gradient!, stops: newStops }
                              });
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={stop.offset * 100}
                            onChange={(e) => {
                              const newStops = [...(selectedEl.gradient?.stops || [])];
                              newStops[idx] = { ...newStops[idx], offset: Number(e.target.value) / 100 };
                              updateSelectedEl({
                                gradient: { ...selectedEl.gradient!, stops: newStops }
                              });
                            }}
                            className="flex-1 accent-[#FF4564] h-1 bg-neutral-800 rounded cursor-pointer"
                          />
                          <span className="text-[10px] text-neutral-500 w-8">{Math.round(stop.offset * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Flip Controls */}
            {selectedEl.type !== 'text' && selectedEl.type !== 'image' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-500 text-xs">Transform</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => updateSelectedEl({ scaleX: (selectedEl.scaleX || 1) * -1 })}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-white/5 text-xs transition-colors"
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => updateSelectedEl({ scaleY: (selectedEl.scaleY || 1) * -1 })}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-white/5 text-xs transition-colors"
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>
              </div>
            )}

            {/* Outline / Stroke Controls */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Outline Width</span>
                <span className="font-mono text-neutral-400">{selectedEl.strokeWidth || 0}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={selectedEl.strokeWidth || 0} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateSelectedEl({ 
                    strokeWidth: val, 
                    stroke: val > 0 && !selectedEl.stroke ? '#ffffff' : selectedEl.stroke 
                  });
                }}
                className="w-full accent-[#FF4564] h-1.5 bg-neutral-800 rounded cursor-pointer" 
              />

              {(selectedEl.strokeWidth || 0) > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-neutral-500 text-xs">Outline Color</span>
                  <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <input 
                      type="color" 
                      value={selectedEl.stroke && selectedEl.stroke.startsWith('#') ? selectedEl.stroke : '#ffffff'} 
                      onChange={(e) => updateSelectedEl({ stroke: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={selectedEl.stroke || '#ffffff'}
                      onChange={(e) => updateSelectedEl({ stroke: e.target.value })}
                      className="font-mono text-xs text-neutral-300 uppercase flex-1 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Opacity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Opacity</span>
                <span className="font-mono text-neutral-400">{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={selectedEl.opacity ?? 1} 
                onChange={(e) => updateSelectedEl({ opacity: Number(e.target.value) })}
                className="w-full accent-[#FF4564] h-1.5 bg-neutral-800 rounded cursor-pointer" 
              />
            </div>

            {/* Corner Radius (for Box) */}
            {selectedEl.type === 'rect' && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Corner Radius</span>
                  <span className="font-mono text-neutral-400">{selectedEl.cornerRadius ?? 8}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  step="1"
                  value={selectedEl.cornerRadius ?? 8} 
                  onChange={(e) => updateSelectedEl({ cornerRadius: Number(e.target.value) })}
                  className="w-full accent-[#FF4564] h-1.5 bg-neutral-800 rounded cursor-pointer" 
                />
              </div>
            )}

            {/* Specific Text Controls */}
            {selectedEl.type === 'text' && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs">Text Content</span>
                  <textarea
                    rows={2}
                    value={selectedEl.text || ''}
                    onChange={(e) => updateSelectedEl({ text: e.target.value })}
                    className="bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white w-full focus:outline-none focus:border-[#FF4564] resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Font Size</span>
                    <input
                      type="number"
                      value={selectedEl.fontSize || selectedEl.h || 24}
                      onChange={(e) => updateSelectedEl({ fontSize: Number(e.target.value), h: Number(e.target.value) })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white w-full focus:outline-none focus:border-[#FF4564]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Font Family</span>
                    <select
                      value={selectedEl.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedEl({ fontFamily: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-white w-full focus:outline-none focus:border-[#FF4564]"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times Roman</option>
                      <option value="Courier New">Courier</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Trebuchet MS">Trebuchet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Font Weight</span>
                    <select
                      value={selectedEl.fontStyle || 'normal'}
                      onChange={(e) => updateSelectedEl({ fontStyle: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-white w-full focus:outline-none focus:border-[#FF4564]"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="italic">Italic</option>
                      <option value="bold italic">Bold Italic</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Text Align</span>
                    <div className="flex bg-neutral-900 rounded border border-neutral-800 p-0.5">
                      <button 
                        onClick={() => updateSelectedEl({ align: 'left' })}
                        className={`flex-1 py-1 flex justify-center text-xs rounded ${selectedEl.align === 'left' || !selectedEl.align ? 'bg-[#FF4564] text-white' : 'text-neutral-400'}`}
                      >
                        L
                      </button>
                      <button 
                        onClick={() => updateSelectedEl({ align: 'center' })}
                        className={`flex-1 py-1 flex justify-center text-xs rounded ${selectedEl.align === 'center' ? 'bg-[#FF4564] text-white' : 'text-neutral-400'}`}
                      >
                        C
                      </button>
                      <button 
                        onClick={() => updateSelectedEl({ align: 'right' })}
                        className={`flex-1 py-1 flex justify-center text-xs rounded ${selectedEl.align === 'right' ? 'bg-[#FF4564] text-white' : 'text-neutral-400'}`}
                      >
                        R
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-xs italic py-2 text-center rounded border ${isDark ? 'text-neutral-500 bg-neutral-900/50 border-white/5' : 'text-neutral-400 bg-neutral-50 border-neutral-200'}`}>
            Select an element on canvas to edit properties
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <History className="w-3 h-3 text-[#FF4564]" /> ER Commit History
        </h3>
        <div className="relative border-l border-neutral-800 ml-2 mt-2 space-y-4 pb-4">
          {timeline.map((event) => (
            <div key={event.id} className="relative pl-4">
              <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${event.type === 'ai' ? 'bg-yellow-400' : 'bg-[#FF4564]'}`} />
              <div className="text-xs font-medium text-white">{event.version}</div>
              <div className="text-xs text-neutral-400">{event.description}</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full max-w-[85vw] shadow-2xl animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
