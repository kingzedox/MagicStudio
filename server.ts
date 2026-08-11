import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Canvas Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_ELEMENT_SIZE = 10;

function sanitizeElements(elements: any[]) {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements.map(el => {
    if (!el || typeof el !== 'object') {
      return null;
    }
    
    const type = ['rect', 'circle', 'star', 'triangle', 'text'].includes(el.type) ? el.type : 'rect';
    const x = typeof el.x === 'number' ? Math.max(-50, Math.min(CANVAS_WIDTH, el.x)) : 100;
    const y = typeof el.y === 'number' ? Math.max(-50, Math.min(CANVAS_HEIGHT, el.y)) : 100;
    const w = typeof el.w === 'number' ? Math.max(MIN_ELEMENT_SIZE, Math.min(CANVAS_WIDTH, el.w)) : 120;
    let h = typeof el.h === 'number' ? Math.max(MIN_ELEMENT_SIZE, Math.min(CANVAS_HEIGHT, el.h)) : 120;
    const color = (typeof el.color === 'string' && (el.color.startsWith('#') || el.color.startsWith('rgb') || ['black','white','red','blue','green','yellow','purple','orange','gray'].includes(el.color.toLowerCase()))) ? el.color : '#6366f1';
    const rotation = typeof el.rotation === 'number' ? el.rotation % 360 : 0;
    const cornerRadius = typeof el.cornerRadius === 'number' ? el.cornerRadius : (type === 'rect' ? 8 : undefined);

    const stroke = typeof el.stroke === 'string' ? el.stroke : undefined;
    const strokeWidth = typeof el.strokeWidth === 'number' ? el.strokeWidth : undefined;
    const groupId = typeof el.groupId === 'string' ? el.groupId : undefined;

    if (type === 'text') {
      let fontSize = typeof el.fontSize === 'number' ? Math.max(12, Math.min(72, el.fontSize)) : 24;
      h = Math.min(h, fontSize * 2.5);
      
      let text = typeof el.text === 'string' ? el.text.trim() : 'Text';
      if (text.length > 100) text = text.substring(0, 100);

      return {
        id: el.id,
        type,
        x,
        y,
        w,
        h,
        rotation,
        color,
        stroke,
        strokeWidth,
        groupId,
        text,
        fontSize,
        fontFamily: el.fontFamily || 'Arial',
        fontStyle: el.fontStyle || 'bold',
        align: el.align || 'center'
      };
    }

    return {
      id: el.id,
      type,
      x,
      y,
      w,
      h,
      rotation,
      color,
      stroke,
      strokeWidth,
      groupId,
      cornerRadius
    };
  }).filter(el => el !== null);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Validate environment variables on startup
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️  WARNING: GROQ_API_KEY environment variable is not set.");
    console.warn("   AI generation features will not work until you set it.");
    console.warn("   Set it in your .env file or provide it via API request.");
  }

  // Increase payload size limit to 50MB (default is 100kb)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, currentElements, groqApiKey } = req.body;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
         return res.status(400).json({ error: "Valid prompt is required" });
      }

      const activeGroqKey = groqApiKey || process.env.GROQ_API_KEY;

      if (!activeGroqKey) {
        return res.status(400).json({ 
          error: "GROQ_API_KEY is not set. Please set GROQ_API_KEY in environment variables or enter it in key settings." 
        });
      }

      const groq = new Groq({ apiKey: activeGroqKey });

      // Filter out image data URLs to reduce payload size for AI
      const sanitizedElements = Array.isArray(currentElements) 
        ? currentElements.map(el => {
            if (el.type === 'image') {
              // Keep structure but remove the large base64 data URL
              return {
                ...el,
                imageUrl: '[IMAGE_DATA_REMOVED]'
              };
            }
            return el;
          })
        : [];

      const hasExisting = sanitizedElements.length > 0;
      const currentCanvasContext = hasExisting 
        ? `CURRENT CANVAS ELEMENTS:\n${JSON.stringify(sanitizedElements, null, 2)}`
        : "CURRENT CANVAS IS EMPTY.";

      const systemPrompt = `You are an expert AI vector layout designer for a ${CANVAS_WIDTH}x${CANVAS_HEIGHT} canvas.
The user provides a design prompt, and optionally the current elements on the canvas.

CANVAS SPECIFICATIONS:
- Canvas dimensions: Width = ${CANVAS_WIDTH}px, Height = ${CANVAS_HEIGHT}px.
- Center of canvas: X = ${CANVAS_WIDTH / 2}, Y = ${CANVAS_HEIGHT / 2}.
- Shape types available: 'rect', 'circle', 'star', 'triangle', 'text'.

CONTEXT & MODIFICATION RULES:
1. IF CURRENT CANVAS ELEMENTS EXIST:
   - If the user says "add X" (e.g., "add a black box", "add a title"), PRESERVE ALL existing elements and APPEND the new element(s) to the array.
   - If the user says "change X to Y" or "make background dark", UPDATE the existing elements in the array accordingly.
   - DO NOT discard existing elements unless the user explicitly asks to "clear canvas", "start over", or "reset layout".

2. NESTING / TEXT INSIDE SHAPES (VERY IMPORTANT):
   - If the prompt describes text inside a shape or star (e.g. "a yellow star with 'hello' in it", "a red circle with 'CLICK' text"):
     a) First, create the shape (e.g. star/rect/circle/triangle) centered on canvas or in a logical position.
     b) Then, create a 'text' element placed DIRECTLY IN THE CENTER of that shape!
     c) For text inside a shape with position (x, y) and size (w, h):
        - Place the text at position: x = shape.x, y = shape.y + (shape.h / 2) - (fontSize / 2).
        - Set text 'w' = shape.w, 'align' = 'center'.
        - Ensure high color contrast (e.g. dark text on yellow star, white text on dark box).

3. STRICT RULES FOR SHAPES ('rect', 'circle', 'star', 'triangle'):
   - Keep positions 'x' (0-${CANVAS_WIDTH - 50}) and 'y' (0-${CANVAS_HEIGHT - 50}) inside ${CANVAS_WIDTH}x${CANVAS_HEIGHT}.
   - 'w' and 'h' between 30 and ${CANVAS_HEIGHT}.
   - 'color': Hex color string (e.g., "#eab308", "#000000", "#ffffff", "#3b82f6").
   - 'cornerRadius': For 'rect' shapes, optionally set 0 to 30 (default 8).

4. STRICT RULES FOR 'text' SHAPES:
   - 'text': Short, clean string (1 to 8 words).
   - 'fontSize': 14 to 40.
   - 'align': 'center' (recommended for centered text), 'left', or 'right'.
   - 'color': High contrast hex color code.

Return ONLY a valid JSON object: { "elements": [ ... ] }`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${currentCanvasContext}\n\nUSER PROMPT: "${prompt}"`
          }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = chatCompletion.choices[0]?.message?.content || "{}";
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        return res.status(500).json({ error: "AI returned invalid JSON format" });
      }
      
      const rawElements = parsed.elements || [];

      const cleanElements = sanitizeElements(rawElements);
      return res.json({ elements: cleanElements });
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to generate AI elements";
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

