import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { CanvasElement } from "../types";
import { v4 as uuidv4 } from "uuid";

interface PromptBarProps {
  currentElements: CanvasElement[];
  onGenerated: (elements: CanvasElement[]) => void;
  onAddCommit: (desc: string) => void;
  theme?: 'dark' | 'light';
}

export default function PromptBar({ currentElements, onGenerated, onAddCommit, theme = 'dark' }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          currentElements,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.elements) {
        const newEls: CanvasElement[] = data.elements.map((el: any) => ({
          ...el,
          id: el.id || uuidv4(),
        }));
        onGenerated(newEls);
        onAddCommit(`AI: ${prompt}`);
        setPrompt("");
      } else {
        setErrorMessage(data.error || "Failed to generate layout");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error connecting to AI endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-10 flex flex-col items-center gap-2 px-4">
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg flex items-center justify-between w-full shadow-lg backdrop-blur-md">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Main Prompt Bar */}
      <form 
        onSubmit={handleGenerate}
        className={`flex items-center gap-2 p-2 rounded-xl shadow-2xl w-full border transition-colors ${
          isDark 
            ? 'bg-neutral-900/90 backdrop-blur-md border-white/10 text-white' 
            : 'bg-white/95 backdrop-blur-md border-neutral-200 text-neutral-900'
        }`}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Prompt AI (e.g., 'Sign-up card', 'Yellow star with hello inside', 'Add a black box')..."
          className={`flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none ${
            isDark ? 'text-white placeholder:text-neutral-500' : 'text-neutral-900 placeholder:text-neutral-400'
          }`}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-2 text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-neutral-800 disabled:text-neutral-500 shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate</span>
        </button>
      </form>
    </div>
  );
}

